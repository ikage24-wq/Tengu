// Bramble Bear concept B (2026-11-26): Varro, the moss-stone guardian. A chibi stone guardian
// lion-dog, the kind that sits at a shrine gate, forgotten in Rootwood Hollow until the moss grew on
// it and it woke up. Cool, proud and a bit mysterious; secretly playful (it gets caught playing with
// its ball and snaps back into a statue pose, its eyes darting).
// It moves on its own copy of the canine base (beastbase.js, the dog: its bones, gait, springs and
// moves), dressed here; everything else drawn here from scratch (the face too).
//   look    sage stone with a moss patina, a big round head in a mane of rounded carved curls (each
//           rooted inside the head, on its own spring), a curly tail plume of the same curls, stubby
//           legs with round paws, a faded vermilion bib tied under its chin (sprung from its knot),
//           and its round carved temple ball (a swirl cut in it, a cap of moss). Its own soft deep
//           sage outline. Eyes: big round bulging guardian eyes under a heavy carved brow of curls,
//           a stern flat upper lid, a lower lid, gold-amber irises with a crescent glint; a wide grin
//           with two soft round fang nubs.
//   idle    standing proud with a forepaw on its ball; a 30 s act: freezing into a perfect statue
//           (only its eyes moving); balancing its ball on its nose, then dropping it and snapping
//           back into a statue, eyes darting (caught!); polishing its ball with its paw; shaking
//           the moss dust out of its mane; a proud stomp and a soundless roar (its mane puffs out).
//   moves   Stone Paw (rears up, slams both forepaws down) and Mane Butt (a headbutt, mane first).
//   special Temple Ball (the dungeon's 'roll'): it hops up onto its ball and balances, paws
//           paddling; then runs on top of the rolling ball like a circus act; at the end it hops
//           off and strikes a guardian pose, the ball rolling to a stop under its paw.
//   faces   stern (calm), focus (a fight), play (caught playing), proud, content, squeeze (hurt,
//           shaking), roar, shut (asleep), dizzy (beaten).
import { dressedBeast } from './beastbase.js';
import { puff, pebble, moss, twinkle, spiral } from './fx.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const eout = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
// (a beat's weight: eased up t0..t1, held, eased down t2..t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
// (eased glances: [time, value] stops, each eased over `d`)
const glances = (T, stops, d = 0.2) => {
  let v = 0;
  for (const [t0, g] of stops) v = mix(v, g, sstep((T - t0) / d));
  return v;
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
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
function blush(ctx, x, y, rx, ry, col, al, r = 0) {
  if (al <= 0.005) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, col.replace('A', String(al)));
  g.addColorStop(1, col.replace('A', '0'));
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}
// (a value following its goal on a spring kept in the rig's state)
function follow(st, key, goal, k, c, dt) {
  const s = (st[key] ??= { x: goal, v: 0 });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      s.v += (-(s.x - goal) * k - s.v * c) * (dt / n);
      s.x += s.v * (dt / n);
    }
  }
  return s.x;
}

// Stone and moss, the bib, the ball.
// (2026-11-27, the player: murky grey-green, reads dull. Now a fresh spring sage stone, bright young
// moss, and a bramble-berry bib and nose: the same guardian, sunnier.)
const C = { lt: '#f1f8e2', base: '#d3e4b8', sh: '#b5cd98', deep: '#96b37c', guide: '#bfd6a4', nose: '#8a4f74' };
const INK = '#5f8f57';
const MANE = { lt: '#e2f0c8', base: '#bcd89a', sh: '#9fc17f', line: '#88ac6c', swirl: '#81a667' };
const MOSS = { lt: '#c6ea8c', base: '#9bd162', sh: '#77b24a' };
const BIB = { lt: '#f8a2c0', base: '#e76f9b', sh: '#c8547f', line: '#a9466c' };
const BALL = { lt: '#e9f2da', base: '#c8dab0', sh: '#a6bf8f', groove: '#86a872' };
const BROW = '#7f9e68';
const EYE = { white: '#fffdf2', iris0: '#c0801c', iris1: '#ffd36a', ring: '#97611a', pupil: '#3b3127', line: '#5a6e4c' };

const SCALE = 1.15;
const BR = 7; // the ball's radius, game px
const BALL_REST = 23; // its middle ahead of the feet, standing
const BALL_WALK = 29; // walking: dribbled along ahead of its nose
const BALL_ROLL = 5; // under it, riding
const WARN = 0.9;

// Its mood, from the game's own fields.
function moodOf(m, a) {
  if (m.hp <= 0) return 'beaten';
  if ((a.hurtAgo ?? 9) < 0.5) return 'hurt';
  if (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? Infinity))) return 'sleep';
  const cm = m.cine?.mood;
  if (cm === 'happy' || cm === 'angry' || cm === 'sad') return cm;
  const gl = (a.now ?? 0) - (m.gloatAt ?? -9);
  if (gl >= 0 && gl < 1.5) return 'happy';
  if ((m.windup ?? 0) > 0 || a.mood === 'angry') return 'angry';
  return 'calm';
}
const rollOf = (m) => (m.move && typeof m.move === 'object' && m.move.kind === 'roll' ? m.move : null);

// Its moves over the dog's: Stone Paw and Mane Butt.
const MOVES = {
  // Rears up on its hind legs, both forepaws high, then slams them down: pebbles and dust.
  pound: {
    anticT: 0.45,
    keys: [
      [0, { x: -0.07, pitch: 32, crouch: 0.45, fpX: 0.18, fpY: 0.75, neck: 4, head: 2, jaw: 0.45, ears: 0.6, tailUp: 22 }],
      [0.07, { x: 0.09, pitch: -8, crouch: 0.5, fpX: 0.2, fpY: 0, neck: 10, head: 8, jaw: 0, ears: -0.6, tailUp: 8 }, 'in'],
      [0.3, { x: 0.08, pitch: -5, crouch: 0.35, fpX: 0.12, neck: 7, head: 5, ears: -0.2, tailUp: 10 }],
      [0.75, {}],
    ],
    spark: [0.07],
    sparkAt: 'paw',
  },
  // Mane Butt: rocked back on its hind legs, chin tucked, then the whole body lunges forward so
  // the mane's curls lead into the blow. The head stays in its own three-quarter profile all the
  // way (only a small chin tuck: tipped further it turned face-on).
  butt: {
    anticT: 0.32,
    keys: [
      [0, { x: -0.12, crouch: 0.35, pitch: 14, neck: 4, head: 9, ears: -0.4, tailUp: 20, jaw: 0 }],
      [0.08, { x: 0.3, crouch: 0.08, pitch: -7, neck: 6, head: 7, ears: -0.8, tailUp: 30, jaw: 0 }, 'out'],
      [0.28, { x: 0.2, crouch: 0.12, pitch: -4, neck: 4, head: 5, ears: -0.5, tailUp: 22 }],
      [0.65, {}],
    ],
  },
};
const toward = (out, vals, w) => {
  if (w <= 0) return;
  for (const [k, v] of Object.entries(vals)) out[k] = mix(out[k] ?? 0, v, w);
};
const STATUE = { sit: 1, pitch: 0, neck: -10, head: 3, lift: 0, spine: 0, crouch: 0, ears: 0.1, tailUp: 18, wag: 0, jaw: 0.02, fpX: 0, fpY: 0 };

// The act, the special, the face: worked out once a frame, kept on `a.zz` for the drawing.
function pose(m, a, out, K, mv, mt) {
  const st = a.mo.rig;
  const t = a.t ?? 0;
  const now = a.now ?? 0;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const H = K.H;
  const zz = (a.zz = { m, mood: moodOf(m, a), face: null, lookX: 0, lookY: 0, brow: 0, puff: 0, nose: 0, polish: 0, shake: 0, roar: 0, gather: 0, both: 0, t, now, busy: Boolean(mv) });
  const alive = m.hp > 0;
  // (rest: proud, chest out, the head a touch up; the tail plume up; no wagging, mostly)
  out.pitch += 3;
  out.neck -= 4;
  out.wag *= 0.35;
  out.tailUp += 8;
  out.jaw = Math.min(out.jaw, 0.04);
  // The roll: the warning, the ride, the stop after it.
  const R = rollOf(m);
  if (R && !st.kmRolling) st.kmRolling = true;
  if (!R && st.kmRolling) {
    st.kmRolling = false;
    st.kmStopAt = now;
  }
  const sT = now - (st.kmStopAt ?? -99);
  let pawGoal = alive ? 1 - (a.walkW ?? 0) : 0;
  let ballGoal = mix(BALL_REST, BALL_WALK, a.walkW ?? 0);
  let gather = 0;
  if (mv) {
    pawGoal = 0;
    zz.face = mv === MOVES.pound ? (mt < 0 ? 'focus' : 'roar') : mv === MOVES.butt ? (mt < 0 ? 'focus' : mt < 0.34 ? 'squeeze' : 'focus') : null;
    if (mv === MOVES.pound) zz.both = 1;
    if (mv === MOVES.butt) zz.puff = mt < 0 ? 0.6 : 1 - sstep((mt - 0.1) / 0.4);
    if (mv === MOVES.pound) zz.puff = mt < 0 ? 0.4 : pulse(mt, 0.04, 0.4);
    if (mv === K.moves.hurt) zz.face = 'squeeze';
  }
  zz.fast = false;
  if (R && alive) {
    zz.busy = true;
    zz.fast = true;
    if (R.phase === 'rev') {
      const rt = R.t ?? 0;
      // (its paw on the ball rolls it back toward itself, then a hop up onto it)
      const pull = sstep(rt / 0.3);
      const hop = sstep((rt - 0.3) / 0.2);
      ballGoal = mix(mix(BALL_REST, 15, pull), BALL_ROLL, hop);
      pawGoal = 1 - sstep((rt - 0.28) / 0.06);
      const crouchW = sstep(rt / 0.2) * (1 - hop);
      out.crouch = mix(out.crouch, 0.6, crouchW);
      out.pitch -= 4 * crouchW;
      out.x = mix(0, BALL_ROLL, hop) / H;
      out.hop = (mix(0, BR * 2, hop) + Math.sin(Math.PI * hop) * 8) / H;
      gather = sstep((rt - 0.44) / 0.06);
      // balancing on top: wobbling, paws paddling, mane bristling
      const bal = sstep((rt - 0.5) / 0.1);
      out.lift = mix(out.lift, -3, gather);
      out.pitch += Math.sin(rt * 11) * 5 * bal;
      out.head += Math.sin(rt * 11 + 1.2) * 4 * bal;
      ballGoal += Math.sin(rt * 11 + 0.4) * 1.1 * bal;
      out.tailUp += 14 * bal;
      out.ears = mix(out.ears, -0.4, bal);
      zz.puff = 0.3 + 0.7 * bal;
      zz.face = 'focus';
      zz.lookY = -0.2;
      zz.pad = rt * 9 * bal;
    } else {
      // riding the ball like a circus act: paws paddling over the top, leaning in, mane streaming
      ballGoal = BALL_ROLL;
      pawGoal = 0;
      gather = 1;
      out.x = BALL_ROLL / H;
      out.hop = (BR * 2) / H;
      out.lift = -3;
      out.crouch = 0.1;
      out.pitch = -5;
      out.neck = -6;
      out.head = -4;
      out.ears = -1;
      out.tailUp = 26;
      out.jaw = 0.25;
      zz.face = 'play';
      zz.puff = 0.4;
      zz.ride = true;
    }
  } else if (alive && sT >= 0 && sT < 1.4) {
    // the stop: a hop back off the ball, which rolls on to a stop under its paw; a guardian pose
    zz.busy = true;
    zz.fast = sT < 0.6;
    const u = sstep(sT / 0.42);
    ballGoal = mix(BALL_ROLL, BALL_REST, eout(sT / 0.75));
    gather = 1 - sstep(sT / 0.1);
    out.x = mix(BALL_ROLL, 0, u) / H;
    out.hop = (mix(BR * 2, 0, u) + Math.sin(Math.PI * u) * 7) / H;
    const land = pulse(sT, 0.4, 0.3);
    out.crouch = Math.max(out.crouch, 0.45 * land);
    pawGoal = sstep((sT - 0.55) / 0.2);
    const proud = win(sT, 0.6, 0.8, 1.15, 1.4);
    toward(out, { pitch: 9, neck: -16, head: -8, ears: 0.4, tailUp: 30, jaw: 0.02 }, proud);
    zz.puff = Math.max(zz.puff, 0.7 * proud + 0.5 * land);
    zz.face = sT < 0.5 ? 'play' : 'proud';
    zz.land = sT;
  }
  // The act, while it stands about.
  const aggro = (m.aggroUntil ?? 0) > now || (m.windup ?? 0) > 0;
  const calm = (a.calm ?? 0) * (mv || zz.busy || !alive || aggro || zz.mood !== 'calm' ? 0 : 1);
  const T = (t + (m.uid ?? 0) * 3.7) % 30;
  zz.T = T;
  // (its eyes glance about now and then; a slow blink)
  const gb = Math.floor(t / 3.7);
  zz.lookX = mix(Math.sin(gb * 12.9 + (m.uid ?? 0)), Math.sin((gb + 1) * 12.9 + (m.uid ?? 0)), sstep(((t / 3.7) % 1) / 0.12)) * 0.7;
  if (calm > 0.01) {
    // 1. a perfect statue: sitting up, not breathing, only its eyes moving
    const s1 = win(T, 1.5, 2.1, 6.2, 6.8) * calm;
    toward(out, STATUE, s1);
    if (s1 > 0.5) {
      zz.face = 'stern';
      zz.lookX = glances(T, [[2.4, 0.95], [3.5, -0.9], [4.5, 0.95], [5.4, 0]], 0.16);
      zz.lookY = -0.15;
      zz.still = true;
    }
    // 2. its ball on its nose: a glance round, a flick up, balancing it, then caught: a statue again
    const peek = win(T, 7.8, 8.0, 8.6, 8.8) * calm;
    if (peek > 0.3) {
      zz.lookX = glances(T, [[7.9, -1], [8.25, 1], [8.6, 0]], 0.12);
      zz.face = 'play';
    }
    out.neck += Math.sin((T - 7.8) * 9) * 4 * peek;
    zz.nose = sstep((T - 8.8) / 0.45) * (1 - sstep((T - 11.3) / 0.35)) * calm;
    const bal = win(T, 8.7, 9.15, 11.25, 11.55) * calm;
    toward(out, { neck: -22, head: -24, pitch: 6, sit: 0.4, jaw: 0.18, ears: 0.4, tailUp: 30, wag: 0.5 }, bal);
    out.head += Math.sin((T - 9) * 5.5) * 5 * bal;
    out.pitch += Math.sin((T - 9) * 5.5 + 1) * 2 * bal;
    if (bal > 0.3) {
      zz.face = 'play';
      zz.lookY = -1;
      zz.lookX = 0.5;
    }
    if (T > 8.7 && T < 11.7) pawGoal = Math.min(pawGoal, 1 - sstep((T - 8.75) / 0.15) * (1 - sstep((T - 11.45) / 0.2)));
    const caught = win(T, 11.6, 11.9, 13.7, 14.3) * calm;
    toward(out, STATUE, caught);
    if (caught > 0.4) {
      zz.face = 'stern';
      zz.lookX = glances(T, [[12.0, 1], [12.6, -1], [13.2, 1], [13.7, 0]], 0.1);
      zz.still = true;
      zz.sweat = caught;
    }
    zz.puff = Math.max(zz.puff, 0.8 * pulse(T, 11.62, 0.5) * calm);
    // 3. polishing its ball with its paw, eyes closed, content
    const pol = win(T, 15.5, 16, 19.4, 19.9) * calm;
    zz.polish = pol;
    toward(out, { neck: 14, head: 12, pitch: -3, sit: 0.25, ears: 0.3, wag: 0.25 }, pol);
    if (pol > 0.4) zz.face = 'content';
    // 4. shaking the moss dust out of its mane
    const sh = win(T, 21, 21.3, 23.6, 24.1) * calm;
    zz.shake = sh;
    out.neck += -6 * sh;
    out.head += Math.sin((T - 21) * 17) * 24 * sh;
    out.pitch += Math.sin((T - 21) * 17 + 0.6) * 2.5 * sh;
    out.ears += -0.4 * sh;
    if (sh > 0.3) zz.face = 'squeeze';
    // 5. a proud stomp and a soundless roar, mane puffed out; then a sheepish blink
    const rise = win(T, 25.9, 26.25, 26.3, 26.42) * calm;
    if (T > 25.85 && T < 29.1) pawGoal = Math.min(pawGoal, 1 - sstep((T - 25.85) / 0.15) * (1 - sstep((T - 28.8) / 0.3)));
    toward(out, { fpY: 0.6, fpX: 0.15, pitch: 12 }, rise);
    zz.stomp = T > 26.4 && T < 27.2 ? T - 26.4 : -1;
    out.crouch += 0.25 * pulse(T, 26.38, 0.3) * calm;
    const roar = win(T, 26.55, 26.85, 28.2, 28.6) * calm;
    toward(out, { neck: -18, head: -20, jaw: 1, ears: -0.5, tailUp: 32, pitch: 4 }, roar);
    zz.roar = roar;
    zz.puff = Math.max(zz.puff, roar);
    if (roar > 0.3) zz.face = 'roar';
    if (T > 26.95 && T < 28) zz.huff = (T - 26.95) / 1.05;
    if (T > 28.6 && T < 29.4) zz.face = 'proud';
  }
  // (the paw on the ball and the ball's place, eased; the ball turning by how far it goes)
  zz.pawOn = clamp(follow(st, 'kmPaw', clamp(pawGoal, 0, 1), 160, 24, dt), 0, 1);
  // (the ball balanced on its nose dropped back to the floor in one frame when a fight or a walk
  // cut its act short: now it rolls off its nose and down in a little arc, 2026-11-26)
  zz.nose = clamp(follow(st, 'kmNose', zz.nose ?? 0, 160, 26, dt), 0, 1);
  if (!alive) {
    st.kmDeadAt ??= now;
    ballGoal = BALL_REST + 12 * eout((now - st.kmDeadAt) / 0.3);
  } else st.kmDeadAt = null;
  const bx = follow(st, 'kmBall', ballGoal, zz.fast ? 900 : 260, zz.fast ? 55 : 30, dt);
  const odo = m.odo ?? 0;
  const dOdo = Math.abs(odo - (st.kmOdo ?? odo));
  st.kmOdo = odo;
  const dbx = bx - (st.kmBx ?? bx);
  st.kmBx = bx;
  st.kmSpin = (st.kmSpin ?? 0) + (dOdo + dbx) / BR;
  zz.ball = { x: bx, spin: st.kmSpin + Math.sin(T * 7) * 0.25 * zz.polish };
  zz.gather = gather;
  out.gather = gather;
  zz.pad = zz.pad ?? 0;
  if (zz.ride) {
    st.kmPad = (st.kmPad ?? 0) + dOdo / 6;
    zz.pad = st.kmPad;
  }
  zz.speed = st.bkV ?? 0;
}
// Asleep and beaten, its own way.
function after(m, a, out, K) {
  const zz = a.zz;
  const t = a.t ?? 0;
  if (m.hp <= 0) {
    // knocked flat, dizzy, its ball rolled off a little way
    Object.assign(out, { lie: 1, sit: 0, pitch: -4, neck: 4, head: -6, jaw: 0.3, ears: -1, tailUp: -10, wag: 0, fpX: 0, fpY: 0, gather: 0, x: -0.04, hop: 0 });
    zz.pawOn = 0;
  } else if (zz?.mood === 'sleep' && !zz.busy) {
    // napping sat up like a statue, paw on its ball, eyes shut, its head slowly nodding off
    const u = (t * 0.3) % 1;
    const nod = sstep(u / 0.85) * (1 - sstep((u - 0.86) / 0.12));
    Object.assign(out, { ...STATUE, neck: -4 + nod * 10, head: 8 + nod * 16, ears: -0.1, tailUp: 10, lift: Math.sin(t * 1.2) * 0.15 });
    zz.pawOn = 1;
  }
}

// ---------- The ball ----------
// Its middle (rig space): on the floor ahead, or riding up on its nose.
function ballAt(a, K) {
  const zz = a.zz;
  const bk = a.bk;
  const g = [zz?.ball?.x ?? BALL_REST, -BR];
  if (!zz?.nose || !bk) return g;
  const sn = K.P.head.snout;
  const top = add(bk.hp, rot([K.sc(sn.at[0] + sn.len * 0.92), K.sc(sn.at[1] - sn.h * 0.36)], bk.ha));
  const n = [top[0] + Math.sin(bk.ha) * 0.3, top[1] - BR + 0.2];
  const u = zz.nose;
  return [mix(g[0], n[0], u), mix(g[1], n[1], u) - Math.sin(Math.PI * u) * 5];
}
// (the game's own fall when beaten, undone for the ball, so it stays on the floor)
function unfall(ctx, m, a) {
  if (m.hp > 0) return;
  const D = m.dying ?? 0;
  const k = clamp(D / 0.22, 0, 1);
  const push = a.mo.push || -((m.heading ?? m.dir) < 0 ? -1 : 1);
  const f = a.flip ? -1 : 1;
  const peak = clamp(m.def.h * 0.45, 8, 20);
  const lift = D < 0.22 ? 4 * k * (1 - k) * peak : 0;
  ctx.scale(f, 1);
  ctx.rotate(-push * 0.32 * k);
  ctx.translate(-push * 12 * k, -lift);
  ctx.scale(f, 1);
}
function drawBall(ctx, a, mode, K, m) {
  if (mode !== 'line') return;
  const zz = a.zz;
  if (!zz) return;
  ctx.save();
  if (m) unfall(ctx, m, a);
  const [x, y] = ballAt(a, K);
  const tone = (c) => K.colour(a, c);
  const r = BR;
  ell(ctx, x, y, r, r);
  stroke(ctx, INK, 2);
  ctx.fillStyle = tone(BALL.base);
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, r, r);
  ctx.clip();
  // (lit from above, a soft shade underneath: they stay put as it turns)
  blush(ctx, x - r * 0.3, y - r * 0.4, r * 0.9, r * 0.8, 'rgba(232,238,226,A)', 0.9);
  blush(ctx, x + r * 0.2, y + r * 0.75, r * 1.1, r * 0.6, 'rgba(128,141,122,A)', 0.55);
  // the carved swirl and the moss cap, turning with it
  const sp = zz.ball?.spin ?? 0;
  ctx.translate(x, y);
  ctx.rotate(sp);
  ctx.beginPath();
  for (let i = 0; i <= 26; i++) {
    const q = i / 26;
    const an = q * TAU * 1.25;
    const rr = r * (0.12 + 0.6 * q);
    const p = [Math.cos(an) * rr, Math.sin(an) * rr];
    i ? ctx.lineTo(...p) : ctx.moveTo(...p);
  }
  stroke(ctx, tone(BALL.groove), 0.7);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 2.2, 3.6);
  stroke(ctx, tone(BALL.groove), 0.45);
  // moss on one side of it
  ell(ctx, -r * 0.55, -r * 0.6, r * 0.62, r * 0.42, -0.6);
  ctx.fillStyle = tone(MOSS.base);
  ctx.fill();
  ell(ctx, -r * 0.58, -r * 0.72, r * 0.36, r * 0.2, -0.6);
  ctx.fillStyle = tone(MOSS.lt);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// ---------- The mane: rounded carved curls round the head, each on its own spring ----------
// [angle about the head (0 forward, -90 up), how far out (of the head's edge), radius, row]
// [angle about the head (0 forward, -90 up), how far out (of the head edge), radius, row, moss]
const LOBES = [
  [-108, 0.98, 4.9, 1, 1], [-138, 1.02, 5.6, 1, 0], [-168, 1.04, 5.9, 1, 0], [162, 1.03, 5.8, 1, 0], [132, 1.0, 5.5, 1, 0],
  [100, 0.94, 4.7, 1, 0], [70, 0.88, 3.8, 1, 0],
];
function maneOf(a, K) {
  const zz = a.zz ?? {};
  const st = a.mo.rig;
  const sc = K.sc;
  const Hd = K.P.head;
  const rx = sc(Hd.rx);
  const ry = sc(Hd.ry);
  const sp = st.kmMane ?? [];
  const puffK = clamp(zz.puff ?? 0, 0, 1.2);
  return LOBES.map(([deg, f, r, row, mossy], i) => {
    const q = (deg * Math.PI) / 180;
    const e = [Math.cos(q) * rx, Math.sin(q) * ry];
    const lift = 1 + puffK * (row ? 0.13 : 0.16) + (row ? 0 : 0.02);
    const o = sp[i] ? rot([sp[i].x, sp[i].y], -(a.bk?.ha ?? 0)) : [0, 0];
    return { x: e[0] * f * lift + o[0], y: e[1] * f * lift + o[1], r: sc(r), row, mossy, q, i, root: [e[0] * 0.5, e[1] * 0.5] };
  });
}
// (the springs: each curl trails the head's swings and bounces, streams back on a run, and settles)
function maneStep(a, K) {
  const st = a.mo.rig;
  const bk = a.bk;
  const zz = a.zz ?? {};
  if (!bk || st.kmManeAt === a.now) return;
  st.kmManeAt = a.now;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const hp = bk.hp;
  const prev = st.kmHp ?? hp;
  const odoV = zz.speed ?? 0;
  const vx = dt > 0 ? (hp[0] - prev[0]) / dt + odoV * 0 : 0;
  const vy = dt > 0 ? (hp[1] - prev[1]) / dt : 0;
  const pv = st.kmHv ?? [vx, vy];
  const ax = dt > 0 ? clamp((vx - pv[0]) / dt, -1500, 1500) : 0;
  const ay = dt > 0 ? clamp((vy - pv[1]) / dt, -1500, 1500) : 0;
  const spin = dt > 0 ? clamp((bk.ha - (st.kmHa ?? bk.ha)) / dt, -30, 30) : 0;
  st.kmHp = hp;
  st.kmHv = [vx, vy];
  st.kmHa = bk.ha;
  const run = clamp((zz.ride ? 260 : odoV) / 220, 0, 1);
  const sp = (st.kmMane ??= LOBES.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 })));
  const n = Math.max(1, Math.ceil(dt * 240));
  LOBES.forEach(([deg], i) => {
    const s = sp[i];
    const k = 230 + (i % 3) * 50;
    const c = 13 + (i % 2) * 3;
    const q = (deg * Math.PI) / 180 + bk.ha;
    // (the spin flings each curl along its way round the head)
    const fx = -Math.sin(q) * spin * 1.4;
    const fy = Math.cos(q) * spin * 1.4;
    const gx = -run * 1.6;
    const gy = run * 0.2;
    for (let j = 0; j < n; j++) {
      s.vx += (-(s.x - gx) * k - s.vx * c - ax * 0.05 + fx * 2) * (dt / n);
      s.vy += (-(s.y - gy) * k - s.vy * c - ay * 0.05 + fy * 2) * (dt / n);
      s.x = clamp(s.x + s.vx * (dt / n), -1.8, 1.8);
      s.y = clamp(s.y + s.vy * (dt / n), -1.8, 1.8);
    }
  });
  // the bib, a pendulum from its knot
  const b = (st.kmBib ??= { x: 0, v: 0 });
  const goal = run * 0.9;
  for (let j = 0; j < n; j++) {
    b.v += (-(b.x - goal) * 140 - b.v * 9 + ax * 0.004 * -1 + spin * 0.6) * (dt / n);
    b.x = clamp(b.x + b.v * (dt / n), -0.9, 1.3);
  }
}
const swirlPath = (ctx, x, y, r, a0, turns = 1.1) => {
  ctx.beginPath();
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const q = i / N;
    const an = a0 + q * TAU * turns;
    const rr = r * (1 - q * 0.78);
    const p = [x + Math.cos(an) * rr, y + Math.sin(an) * rr];
    i ? ctx.lineTo(...p) : ctx.moveTo(...p);
  }
};
function maneUnder(ctx, a, mode, K) {
  if (!a.bk) return;
  if (mode === 'line') maneStep(a, K);
  const tone = (c) => K.colour(a, c);
  K.headFrame(ctx, a);
  const L = maneOf(a, K);
  if (mode === 'line') {
    ctx.beginPath();
    for (const l of L) {
      ctx.moveTo(l.x + l.r, l.y);
      ctx.arc(l.x, l.y, l.r, 0, TAU);
    }
    return stroke(ctx, INK, 2);
  }
  // the back row first, darker; then the front curls, each with a soft edge and a carved swirl
  for (const row of [0, 1]) {
    for (const l of L.filter((v) => v.row === row)) {
      ell(ctx, l.x, l.y, l.r, l.r);
      ctx.fillStyle = tone(row ? MANE.base : MANE.sh);
      ctx.fill();
      if (row) {
        ctx.save();
        ell(ctx, l.x, l.y, l.r, l.r);
        ctx.clip();
        // (lit on its top, shaded under)
        blush(ctx, l.x - l.r * 0.25, l.y - l.r * 0.4, l.r * 0.8, l.r * 0.6, 'rgba(214,223,206,A)', 0.9);
        blush(ctx, l.x + l.r * 0.1, l.y + l.r * 0.8, l.r * 0.9, l.r * 0.5, 'rgba(120,134,114,A)', 0.45);
        // moss on the curls that face up
        if (l.mossy) {
          ell(ctx, l.x - l.r * 0.1, l.y - l.r * 0.75, l.r * 0.75, l.r * 0.42);
          ctx.fillStyle = tone(MOSS.base);
          ctx.fill();
          ell(ctx, l.x - l.r * 0.2, l.y - l.r * 0.88, l.r * 0.4, l.r * 0.2);
          ctx.fillStyle = tone(MOSS.lt);
          ctx.fill();
        }
        ctx.restore();
        ell(ctx, l.x, l.y, l.r - 0.15, l.r - 0.15);
        stroke(ctx, tone(MANE.line), 0.45);
        swirlPath(ctx, l.x + l.r * 0.08, l.y + l.r * 0.05, l.r * 0.55, l.q + 2.2);
        stroke(ctx, tone(MANE.swirl), 0.45);
      }
    }
  }
}

// ---------- The bib: a faded vermilion cloth tied under its chin ----------
function bibShape(a, K) {
  const st = a.mo.rig;
  const bk = a.bk;
  const sc = K.sc;
  // its knot: under the chin, inside the head's round, held by the neck
  const root = add(bk.hp, rot([sc(2.6), sc(9.4)], bk.ha));
  const sw = (st.kmBib?.x ?? 0) + 0.1;
  const down = Math.PI / 2 + sw;
  const len = sc(7.4);
  const wd = sc(5.2);
  const d = [Math.cos(down), Math.sin(down)];
  const nrm = [-d[1], d[0]];
  const tip = add(root, [d[0] * len, d[1] * len]);
  // (the band across: along the chin, turning with the head)
  const bandA = add(bk.hp, rot([sc(-2.6), sc(9.6)], bk.ha));
  const bandB = add(bk.hp, rot([sc(5.6), sc(8.6)], bk.ha));
  return { root, tip, d, nrm, wd, bandA, bandB };
}
function bibOver(ctx, a, mode, K) {
  if (!a.bk) return;
  const tone = (c) => K.colour(a, c);
  const b = bibShape(a, K);
  const flap = () => {
    ctx.beginPath();
    const L = [b.root[0] - b.nrm[0] * b.wd, b.root[1] - b.nrm[1] * b.wd];
    const Rr = [b.root[0] + b.nrm[0] * b.wd, b.root[1] + b.nrm[1] * b.wd];
    const tr = 1.4;
    const tc = [b.tip[0] - b.d[0] * tr, b.tip[1] - b.d[1] * tr];
    ctx.moveTo(...L);
    ctx.quadraticCurveTo(...add(L, [b.d[0] * 4.6, b.d[1] * 4.6]), tc[0] - b.nrm[0] * tr, tc[1] - b.nrm[1] * tr);
    ctx.arc(tc[0], tc[1], tr, Math.atan2(-b.nrm[1], -b.nrm[0]), Math.atan2(b.nrm[1], b.nrm[0]), false);
    ctx.quadraticCurveTo(...add(Rr, [b.d[0] * 4.6, b.d[1] * 4.6]), ...Rr);
    ctx.closePath();
  };
  const band = () => {
    ctx.beginPath();
    ctx.moveTo(...b.bandA);
    ctx.quadraticCurveTo(...add(b.root, [0, 0.9]), ...b.bandB);
  };
  if (mode === 'line') {
    flap();
    return stroke(ctx, INK, 2);
  }
  flap();
  ctx.fillStyle = tone(BIB.base);
  ctx.fill();
  ctx.save();
  flap();
  ctx.clip();
  blush(ctx, ...add(b.root, [b.d[0] * 2 - b.nrm[0] * 1.5, b.d[1] * 2 - b.nrm[1] * 1.5]), b.wd, b.wd * 0.7, 'rgba(240,150,118,A)', 0.8);
  blush(ctx, ...b.tip, b.wd * 0.7, b.wd * 0.5, 'rgba(160,66,48,A)', 0.4);
  ctx.restore();
  flap();
  stroke(ctx, tone(BIB.line), 0.5);
  // its knot, a soft round
  ell(ctx, b.root[0] - b.nrm[0] * 0.5, b.root[1] - b.nrm[1] * 0.5 + 0.3, 1.3, 1.1);
  ctx.fillStyle = tone(BIB.sh);
  ctx.fill();
  stroke(ctx, tone(BIB.line), 0.4);
}

// ---------- The tail plume: rounded curls up a sprung chain ----------
function plume(a, K) {
  const T = a.bk?.tail;
  if (!T) return [];
  const sc = K.sc;
  const n = T.length - 1;
  const out = [];
  for (let i = 1; i < n; i++) out.push({ x: T[i][0], y: T[i][1], r: sc(1.7 + i * 0.5), i });
  // (the tip: a fan of three curls, like a flame)
  const d = [T[n][0] - T[n - 1][0], T[n][1] - T[n - 1][1]];
  const l = Math.hypot(...d) || 1;
  const u = [d[0] / l, d[1] / l];
  const nn = [-u[1], u[0]];
  for (const [f, s, r] of [[0.2, -1.5, 3.2], [0.4, 1.6, 3.0], [1.4, 0.1, 3.5]]) out.push({ x: T[n][0] + u[0] * sc(f * 2) + nn[0] * sc(s), y: T[n][1] + u[1] * sc(f * 2) + nn[1] * sc(s), r: sc(r), i: out.length + 1 });
  return out;
}
function tailOver(ctx, a, mode, K) {
  const L = plume(a, K);
  if (!L.length) return;
  const tone = (c) => K.colour(a, c);
  if (mode === 'line') {
    ctx.beginPath();
    for (const l of L) {
      ctx.moveTo(l.x + l.r, l.y);
      ctx.arc(l.x, l.y, l.r, 0, TAU);
    }
    return stroke(ctx, INK, 2);
  }
  for (const l of L) {
    ell(ctx, l.x, l.y, l.r, l.r);
    ctx.fillStyle = tone(MANE.base);
    ctx.fill();
    ctx.save();
    ell(ctx, l.x, l.y, l.r, l.r);
    ctx.clip();
    blush(ctx, l.x - l.r * 0.3, l.y - l.r * 0.4, l.r * 0.8, l.r * 0.6, 'rgba(214,223,206,A)', 0.9);
    if (l.i >= L.length - 1) {
      ell(ctx, l.x, l.y - l.r * 0.75, l.r * 0.7, l.r * 0.4);
      ctx.fillStyle = tone(MOSS.base);
      ctx.fill();
    }
    ctx.restore();
    ell(ctx, l.x, l.y, l.r - 0.15, l.r - 0.15);
    stroke(ctx, tone(MANE.line), 0.45);
    if (l.r > K.sc(2.6)) {
      swirlPath(ctx, l.x, l.y, l.r * 0.5, l.i * 1.7);
      stroke(ctx, tone(MANE.swirl), 0.4);
    }
  }
}

// ---------- Over the body: moss on its back, a carved swirl on its haunch ----------
function bodyOver(ctx, a, mode, K) {
  const bk = a.bk;
  if (!bk || mode === 'line') return;
  const tone = (c) => K.colour(a, c);
  ctx.save();
  K.bodyPath(ctx, a);
  ctx.clip();
  for (const [x, y, r] of [[-4.5, -9.4, 2.8]]) {
    const p = bk.bodyPt([x, y]);
    ell(ctx, p[0], p[1], K.sc(r), K.sc(r) * 0.7, bk.th);
    ctx.fillStyle = tone(MOSS.base);
    ctx.fill();
    ell(ctx, p[0] - 0.4, p[1] - K.sc(r) * 0.25, K.sc(r) * 0.55, K.sc(r) * 0.3, bk.th);
    ctx.fillStyle = tone(MOSS.lt);
    ctx.fill();
  }
  const h = bk.bodyPt([-7, 0.5]);
  swirlPath(ctx, h[0], h[1], K.sc(2.6), bk.th + 3.6, 1.25);
  stroke(ctx, tone(C.deep), 0.55);
  ctx.restore();
}
// (curled toes on the near paws)
const toes = (k) => (ctx, a, mode, K) => {
  const Lg = a.bk?.legs?.[k];
  if (!Lg || mode === 'line') return;
  const pw = K.sc(K.P.paw.w);
  const ph = K.sc(K.P.paw.h);
  const c = add(Lg.P, rot([pw * 0.16, ph * 0.08], Lg.rot));
  for (const f of [0.12, 0.34]) {
    const p = add(c, rot([pw * f, 0], Lg.rot));
    ctx.beginPath();
    ctx.moveTo(...add(p, rot([0, -ph * 0.05], Lg.rot)));
    ctx.lineTo(...add(p, rot([0, ph * 0.38], Lg.rot)));
    stroke(ctx, K.colour(a, C.deep), 0.45);
  }
};

// ---------- The face ----------
function eyeState(zz) {
  const mood = zz.mood;
  if (mood === 'beaten') return 'dizzy';
  if (mood === 'hurt') return 'squeeze';
  if (mood === 'sleep') return 'shut';
  if (zz.face) return zz.face;
  if (mood === 'happy') return 'proud';
  if (mood === 'angry') return 'focus';
  if (mood === 'sad') return 'sad';
  return (zz.t + 3.3) % 5.2 < 0.14 && !zz.still ? 'shut' : 'stern';
}
// The face, in the head's frame: carved brows, big round guardian eyes, the grin, moss on the crown.
function face(ctx, a, sk, K) {
  const zz = a.zz ?? { mood: 'calm', t: 0 };
  const sc = K.sc;
  const Hd = K.P.head;
  const rx = sc(Hd.rx);
  const ry = sc(Hd.ry);
  const tone = (c) => K.colour(a, c);
  const st = eyeState(zz);
  // moss on the crown, and a faint warm cheek
  ctx.save();
  K.shapePath(ctx, K.headShapes(sk, 'skull'));
  ctx.clip('nonzero');
  ell(ctx, -rx * 0.22, -ry * 1.0, rx * 0.3, ry * 0.17, -0.2);
  ctx.fillStyle = tone(MOSS.base);
  ctx.fill();
  ell(ctx, -rx * 0.25, -ry * 1.04, rx * 0.17, ry * 0.08, -0.2);
  ctx.fillStyle = tone(MOSS.lt);
  ctx.fill();
  blush(ctx, sc(4.2), sc(4.8), sc(2.8), sc(1.8), 'rgba(246,140,160,A)', 0.55);
  ctx.restore();
  mouth(ctx, a, sk, K, st);
  // the far eye, a sliver round the front of the face; then the near eye
  eye(ctx, a, K, rx * 0.88, -ry * 0.06, sc(3.9), st, -1, 0.34);
  eye(ctx, a, K, rx * 0.36, -ry * 0.02, sc(4.5), st, 1, 1);
}
// One eye: x, y its middle, R its radius, `side` 1 near / -1 far, `w` how much of it shows across.
function eye(ctx, a, K, x, y, R, st, side, w) {
  const zz = a.zz ?? {};
  const tone = (c) => K.colour(a, c);
  const sc = K.sc;
  const rx = R * w;
  const lx = clamp(zz.lookX ?? 0, -1, 1);
  const ly = clamp(zz.lookY ?? 0, -1, 1);
  // the brow: carved rounded curls over the eye, set by the mood
  // (2026-11-27: its resting 'stern' face softened to a mild, proud little frown: the brow a touch
  // higher and only just tilted, the eye wide open under a rounded lid; the fight face keeps its knit)
  const browUp = st === 'play' || st === 'roar' ? 0.55 : st === 'proud' || st === 'content' ? 0.2 : st === 'focus' ? -0.35 : st === 'squeeze' ? -0.3 : st === 'sad' ? 0.3 : 0.14;
  const browTilt = st === 'focus' ? 0.28 : st === 'stern' ? 0.12 : st === 'sad' ? -0.3 : st === 'play' ? -0.12 : 0;
  // (a bold carved brow: a thick arch over the eye that rolls into a curl at its back end)
  const brow = () => {
    const up = browUp * R * 0.32;
    const P = (px, py) => [x + px * rx * (side > 0 ? 1 : 1.5), y + py * R - up + px * browTilt * R * 0.55];
    return side > 0 ? { f: P(0.78, -1.05), top: P(-0.05, -1.62), b: P(-0.8, -1.18) } : { f: P(0.55, -1.02), top: P(0.05, -1.42), b: P(-0.45, -1.2) };
  };
  if (st === 'shut' || st === 'proud' || st === 'content') {
    // closed: a calm lid line (asleep: drooping; proud and content: curved up)
    ctx.beginPath();
    if (st === 'shut') {
      ctx.moveTo(x - rx * 0.95, y + R * 0.05);
      ctx.quadraticCurveTo(x, y + R * 0.6, x + rx * 0.95, y + R * 0.05);
    } else {
      ctx.moveTo(x - rx * 0.95, y + R * 0.25);
      ctx.quadraticCurveTo(x, y - R * 0.55, x + rx * 0.95, y + R * 0.25);
    }
    stroke(ctx, tone(EYE.line), sc(0.6));
    if (st !== 'shut' && side > 0) {
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.6, y + R * 0.62);
      ctx.quadraticCurveTo(x, y + R * 0.82, x + rx * 0.6, y + R * 0.62);
      stroke(ctx, tone(C.deep), sc(0.35));
    }
  } else if (st === 'squeeze') {
    // squeezed tight: a rounded chevron
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.85, y - R * 0.55);
    ctx.quadraticCurveTo(x + rx * 0.55, y - R * 0.05, x + rx * 0.35, y);
    ctx.quadraticCurveTo(x + rx * 0.55, y + R * 0.05, x - rx * 0.85, y + R * 0.55);
    stroke(ctx, tone(EYE.line), sc(0.6));
  } else if (st === 'dizzy') {
    // (soft dizzy swirls, no eye showing)
    if (side > 0) {
      swirlPath(ctx, x, y, R * 0.62, (zz.t ?? 0) * 3, 1.6);
      stroke(ctx, tone(EYE.line), sc(0.5));
    }
  } else {
    // open: a carved socket, the round bulging eye, the amber iris and its crescent glint
    const lid = st === 'roar' ? 0.12 : st === 'play' ? 0.16 : st === 'focus' ? 0.46 : st === 'sad' ? 0.42 : 0.2;
    const low = st === 'focus' ? 0.66 : st === 'roar' ? 0.95 : st === 'play' ? 0.88 : 0.86;
    const tilt = st === 'focus' ? 0.3 : st === 'stern' ? 0.05 : st === 'sad' ? -0.28 : 0;
    // (the lid's lower edge arched, rounder the calmer it is)
    const arch = st === 'focus' ? 0.08 : 0.3;
    ell(ctx, x, y + R * 0.06, rx * 1.12, R * 1.1);
    ctx.fillStyle = tone(C.sh);
    ctx.globalAlpha *= 0.6;
    ctx.fill();
    ctx.globalAlpha /= 0.6;
    const ball = () => ell(ctx, x, y, rx, R);
    ball();
    ctx.fillStyle = tone(EYE.white);
    ctx.fill();
    ctx.save();
    ball();
    ctx.clip();
    const ir = R * 0.72;
    const gx = x + (lx * 0.3 + 0.08) * R * (side > 0 ? 1 : 0.5);
    const gy = y + (ly * 0.26 + 0.08) * R;
    ell(ctx, gx, gy, ir * (side > 0 ? 1 : 0.55), ir);
    const g = ctx.createLinearGradient(0, gy - ir, 0, gy + ir);
    g.addColorStop(0, tone(EYE.iris0));
    g.addColorStop(1, tone(EYE.iris1));
    ctx.fillStyle = g;
    ctx.fill();
    stroke(ctx, tone(EYE.ring), sc(0.3));
    ell(ctx, gx + R * 0.03, gy + R * 0.02, ir * 0.46 * (side > 0 ? 1 : 0.55), ir * 0.5);
    ctx.fillStyle = tone(EYE.pupil);
    ctx.fill();
    if (side > 0) {
      // the crescent glint, top-left, and a small round one low on the right
      ctx.save();
      ell(ctx, gx - ir * 0.3, gy - ir * 0.32, ir * 0.5, ir * 0.5);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(gx - ir * 2, gy - ir * 2, ir * 4, ir * 4);
      ctx.moveTo(gx - ir * 0.04 + ir * 0.46, gy - ir * 0.08);
      ctx.arc(gx - ir * 0.04, gy - ir * 0.08, ir * 0.46, 0, TAU);
      ctx.fillStyle = '#fffdf3';
      ctx.fill('evenodd');
      ctx.restore();
      ell(ctx, gx + ir * 0.42, gy + ir * 0.4, ir * 0.13, ir * 0.13);
      ctx.fillStyle = '#fffdf3';
      ctx.fill();
    }
    // the stern flat upper lid, and the lower lid
    const ly0 = y - R + lid * 2 * R;
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.4, y - R * 1.6);
    ctx.lineTo(x + rx * 1.4, y - R * 1.6);
    ctx.lineTo(x + rx * 1.4, ly0 + tilt * R * 0.6 + arch * R * 0.5);
    ctx.quadraticCurveTo(x, ly0 - arch * R, x - rx * 1.4, ly0 - tilt * R * 0.6 + arch * R * 0.5);
    ctx.closePath();
    ctx.fillStyle = tone(C.base);
    ctx.fill();
    const lo = y - R + low * 2 * R;
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.4, y + R * 1.6);
    ctx.lineTo(x - rx * 1.4, lo + R * 0.2);
    ctx.quadraticCurveTo(x, lo - R * 0.18, x + rx * 1.4, lo + R * 0.2);
    ctx.lineTo(x + rx * 1.4, y + R * 1.6);
    ctx.closePath();
    ctx.fillStyle = tone(C.base);
    ctx.fill();
    ctx.restore();
    ball();
    stroke(ctx, tone(C.deep), sc(0.3));
    // (the lid's heavy line, a soft tick at its outer corner; the lower lid a lighter line)
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.02, ly0 - tilt * R * 0.6 * 0.73 + R * 0.08 + arch * R * 0.28);
    ctx.quadraticCurveTo(x, ly0 - arch * R * 0.62, x + rx * 0.98, ly0 + tilt * R * 0.6 * 0.7 + arch * R * 0.28);
    stroke(ctx, tone(EYE.line), sc(0.55));
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.78, lo + R * 0.1);
    ctx.quadraticCurveTo(x, lo - R * 0.12, x + rx * 0.78, lo + R * 0.1);
    stroke(ctx, tone(C.deep), sc(0.4));
  }
  // the brow over it all
  const bp = brow();
  ctx.beginPath();
  ctx.moveTo(...bp.f);
  ctx.quadraticCurveTo(...bp.top, ...bp.b);
  if (side > 0) {
    // (the curl: round and down, inward)
    const cx = bp.b[0] + R * 0.06;
    const cy = bp.b[1] + R * 0.36;
    for (let i = 0; i <= 10; i++) {
      const q = i / 10;
      const an = -Math.PI * 0.75 - q * Math.PI * 1.5;
      const rr = R * 0.36 * (1 - q * 0.55);
      ctx.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr);
    }
  }
  stroke(ctx, tone(BROW), R * (side > 0 ? 0.3 : 0.26));
}
// The grin: wide, curling up at the corner, two soft round fang nubs; open, a dark mouth and a tongue.
function mouth(ctx, a, sk, K, st) {
  const sc = K.sc;
  const tone = (c) => K.colour(a, c);
  const P = (x, y) => [sc(x), sc(y)];
  const U = [P(13.5, 4.5), P(10.8, 5.6), P(8.2, 6.2)];
  const hinge = P(6, 5.13);
  const jw = sk.jaw * 0.5;
  const L = [P(13, 4.7), P(10.6, 5.8), P(8.2, 6.3)].map((p) => add(hinge, rot([p[0] - hinge[0], p[1] - hinge[1]], jw)));
  if (sk.jaw > 0.08) {
    ctx.beginPath();
    ctx.moveTo(...U[0]);
    ctx.quadraticCurveTo(...U[1], ...U[2]);
    ctx.lineTo(...L[2]);
    ctx.quadraticCurveTo(...L[1], ...L[0]);
    ctx.closePath();
    ctx.fillStyle = tone('#6e4c46');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, (L[1][0] + L[2][0]) / 2, (L[1][1] + L[2][1]) / 2, sc(2.2), sc(1.1), jw);
    ctx.fillStyle = tone('#d98678');
    ctx.fill();
    ctx.restore();
  }
  // the lip line, curling up into the cheek
  ctx.beginPath();
  ctx.moveTo(...U[0]);
  ctx.quadraticCurveTo(...U[1], ...U[2]);
  ctx.quadraticCurveTo(...P(6.4, 6.6), ...P(5.8, 5.4));
  ctx.quadraticCurveTo(...P(5.6, 4.5), ...P(6.4, 4.4));
  stroke(ctx, tone(EYE.line), sc(0.5));
  // the fang nubs, up from the lower lip
  for (const f of [0.28, 0.62]) {
    const i = f < 0.5 ? 0 : 1;
    const p = [mix(L[i][0], L[i + 1][0], 0.6), mix(L[i][1], L[i + 1][1], 0.6) + 0.1];
    ctx.beginPath();
    ctx.moveTo(p[0] - sc(0.46), p[1]);
    ctx.lineTo(p[0] - sc(0.42), p[1] - sc(0.45));
    ctx.arc(p[0], p[1] - sc(0.45), sc(0.42), Math.PI, 0);
    ctx.lineTo(p[0] + sc(0.46), p[1]);
    ctx.closePath();
    ctx.fillStyle = tone('#f1f1e4');
    ctx.fill();
    stroke(ctx, tone(C.deep), sc(0.3));
  }
}

// ---------- Paws: on the ball, riding it, both up for the Stone Paw ----------
function paw(a, k, { T, paw: p0, S, LF, ground }) {
  const zz = a.zz;
  if (!zz) return null;
  const g = clamp(S.gather ?? 0, 0, 1);
  if (g > 0.01) {
    // gathered on the top of the ball, paddling
    const bx = zz.ball?.x ?? BALL_ROLL;
    const off = { foreN: 3.8, foreF: 2.6, hindN: -3.6, hindF: -2.4 }[k];
    const ph = (zz.pad ?? 0) + { foreN: 0, foreF: Math.PI, hindN: Math.PI, hindF: 0 }[k];
    const dx = off + Math.sin(ph) * 1.3;
    const lift = Math.max(0, Math.cos(ph)) * 1.6;
    const y = ground - BR * 2 + (BR - Math.sqrt(Math.max(0, BR * BR - dx * dx))) - lift;
    return { p: [bx + dx, y], a3: k.startsWith('hind') ? -0.2 : 0.15, k: g };
  }
  if (k === 'foreN' && zz.pawOn > 0.01) {
    // on the ball's upper back, as guardians stand; polishing: rubbing round on it
    const [cx, cy] = ballAt(a, { P: KP, sc: (v) => v * SCALE });
    const pol = zz.polish ?? 0;
    const T2 = zz.T ?? 0;
    const an = -2.3 + Math.sin(T2 * 7) * 0.4 * pol;
    const out = 0.9 + Math.max(0, Math.cos(T2 * 7)) * 0.8 * pol;
    return { p: [cx + Math.cos(an) * (BR + out), cy + Math.sin(an) * (BR + out)], a3: 0.55, k: zz.pawOn };
  }
  if (k === 'foreF' && zz.both > 0 && (S.fpX || S.fpY)) {
    return { p: [p0[0] + S.fpX * LF - 1.6, p0[1] - S.fpY * LF + 0.6], a3: 0.5, k: clamp(S.fpY * 3, 0, 1) };
  }
  return null;
}

// ---------- Live extras: dust, pebbles, moss bits, sparkles, the dizzy circle ----------
function fx(ctx, m, a, S, K) {
  const zz = a.zz;
  const bk = a.bk;
  if (!zz || !bk) return;
  const t = zz.t ?? 0;
  const T = zz.T ?? 0;
  const sc = K.sc;
  const hurt = a.hurtAgo ?? 9;
  ctx.save();
  // hit: a puff of moss dust off it and a pebble or two
  if (m.hp > 0 && hurt < 0.6) {
    const u = hurt / 0.6;
    const c = add(bk.pivot, [0, -sc(6)]);
    for (let i = 0; i < 4; i++) {
      const q = -Math.PI / 2 + (i - 1.5) * 0.8;
      puff(ctx, c[0] + Math.cos(q) * (5 + u * 9), c[1] + Math.sin(q) * (4 + u * 6), 2.2 + u * 2.4 - i * 0.2, 0.85 * (1 - u));
    }
    for (let i = 0; i < 2; i++) pebble(ctx, c[0] + (i ? 4 : -6) * (0.5 + u), c[1] - 8 * Math.sin(Math.PI * Math.min(1, u * 1.2)) + u * 10, 1.1, u * 5 + i, 1 - u * u);
  }
  // the Stone Paw landing; the act's stomp; landing off the ball
  const mv = a.bkMove?.mv;
  const mt = a.bkMove?.t ?? -1;
  const thud = (x, u, big) => {
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) puff(ctx, x + s * (3 + i * 3.2) * (0.5 + u), -1.8 - i * 0.6 - u * 2, (2.4 - i * 0.5) * (0.6 + u * 0.7) * big, 0.8 * (1 - u));
    for (let i = 0; i < 3; i++) pebble(ctx, x + (i - 1) * 5 * (0.4 + u), -Math.sin(Math.PI * clamp(u * 1.3, 0, 1)) * (6 + i * 2) * big, 1 + (i % 2) * 0.3, u * 6 + i * 2, 1 - u);
  };
  if (mv === MOVES.pound && mt >= 0.06 && mt < 0.6) thud(bk.legs.foreN.P[0], (mt - 0.06) / 0.54, 1.2);
  // the Mane Butt's contact: a small puff of dust where the mane's front curls meet the target
  if (mv === MOVES.butt && mt >= 0.07 && mt < 0.5) {
    const u = (mt - 0.07) / 0.43;
    const c = [bk.hp[0] + sc(K.P.head.rx * 0.9), bk.hp[1] + sc(2)];
    for (let i = 0; i < 4; i++) {
      const q = -Math.PI / 2 + (i - 1.5) * 0.7;
      puff(ctx, c[0] + sc(2) + Math.cos(q) * (2 + u * 7), c[1] + Math.sin(q) * (2 + u * 5), (1.8 - i * 0.15) * (0.7 + u * 0.8), 0.8 * (1 - u));
    }
  }
  if (zz.stomp >= 0 && zz.stomp < 0.7) thud(bk.legs.foreN.P[0], zz.stomp / 0.7, 0.8);
  if (zz.land != null && zz.land > 0.38 && zz.land < 0.9) thud(bk.pivot[0], (zz.land - 0.38) / 0.52, 0.8);
  // riding: dust kicked up behind the ball
  if (zz.ride) {
    const [bx] = ballAt(a, K);
    for (let i = 0; i < 4; i++) {
      const u = ((m.odo ?? 0) / 60 + i / 4) % 1;
      puff(ctx, bx - BR * 0.6 - u * 16, -1.6 - u * 3, 1.8 + u * 1.8, 0.7 * (1 - u));
    }
  }
  // shaking: moss dust and bits of moss flung out of its mane
  if (zz.shake > 0.05) {
    for (let i = 0; i < 6; i++) {
      const u = ((T - 21) * 1.3 + i / 6) % 1;
      const q = -Math.PI / 2 + (i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.35);
      const p = add(bk.hp, [Math.cos(q) * (sc(9) + u * 10), Math.sin(q) * (sc(8) + u * 6) + u * u * 8]);
      if (i % 3 === 0) moss(ctx, p[0], p[1], 1.4, u * 4 + i, zz.shake * (1 - u));
      else puff(ctx, p[0], p[1], 1.6 + u * 1.6, 0.75 * zz.shake * (1 - u));
    }
  }
  // the soundless roar: just a little huff of dust
  if (zz.huff != null) {
    const u = zz.huff;
    const sn = K.P.head.snout;
    const p = add(bk.hp, rot([sc(sn.at[0] + sn.len + 1.5), sc(sn.at[1] + 1)], bk.ha));
    for (let i = 0; i < 3; i++) puff(ctx, p[0] + u * (6 + i * 3), p[1] - u * (3 + i * 2), 1.2 + u * 1.4 + i * 0.2, 0.7 * (1 - u) * sstep(u * 6 - i * 0.6));
  }
  // polishing: a twinkle off its ball
  if (zz.polish > 0.3) {
    const [bx, by] = ballAt(a, K);
    for (const [t0, dx, dy] of [[16.6, -0.5, -0.7], [17.8, 0.6, -0.2], [19.0, 0.1, -0.85]]) {
      const u = (T - t0) / 0.5;
      if (u > 0 && u < 1) twinkle(ctx, bx + dx * BR, by + dy * BR, 1.4 + Math.sin(Math.PI * u) * 1.6, u, Math.sin(Math.PI * u));
    }
  }
  // caught: a little drop of nervous sweat
  if (zz.sweat > 0.2) {
    const u = ((T - 11.9) / 1.6) % 1;
    const p = add(bk.hp, rot([sc(-1.5), sc(-6.8)], bk.ha));
    ctx.globalAlpha = zz.sweat * (1 - sstep((u - 0.7) / 0.3));
    ell(ctx, p[0], p[1] + u * 2, 0.9, 1.2);
    ctx.fillStyle = '#d8eef6';
    ctx.fill();
    stroke(ctx, '#8fb8c8', 0.35);
    ctx.globalAlpha = 1;
  }
  // beaten: soft dizzy swirls and stars round its head
  if (m.hp <= 0) {
    for (let i = 0; i < 3; i++) {
      const q = t * 2.4 + (i * TAU) / 3;
      const p = [bk.hp[0] + Math.cos(q) * sc(8), bk.hp[1] - sc(13) + Math.sin(q) * sc(2.2)];
      if (i === 1) spiral(ctx, p[0], p[1], 1.6, q);
      else twinkle(ctx, p[0], p[1], 1.7, q * 0.2, 1);
    }
  }
  ctx.restore();
}

const KP = {
  scale: SCALE,
  head: { rx: 12, ry: 11, snout: { at: [7, 3], len: 7, h: 7.6 }, nose: 2.3, cheek: false },
  neck: { base: [7.2, -4.6], len: 6.4, w: 8.4, ang: -66 },
  ears: { kind: 'flop', near: [0, 0], far: [0, 0], size: 0.05 },
  tail: { root: [-10.6, -5.2], n: 3, seg: 3.6, w: [3, 2.4], start: -2.45, curl: 0.24, bush: 0, tip: 0 },
  paw: { w: 6.2, h: 3.4, up: 1.4 },
  chest: [7.2, 2.4, 4.4, 4],
};
const VARRO = dressedBeast({
  kind: 'dog',
  C,
  ink: INK,
  quiet: true,
  noEars: true,
  noCheek: true,
  P: KP,
  kit: { bx: 0.62, by: 0.94, lx: 0.7, ls: 0.75, lw: 1.25 },
  moves: MOVES,
  fast: (m, a) => Boolean(a.zz?.fast),
  // (its swings in turn: its data's list when that names its own moves, else Stone Paw and Mane Butt;
  // m.move is read only as a name, a dungeon's own move being an object)
  pick: (m, a) => {
    const own = m.def.moves?.length && m.def.moves.every((k) => MOVES[k]) ? m.def.moves : ['pound', 'butt'];
    return own[(a.mo.rig.bkN ?? 0) % own.length];
  },
  face,
  pose,
  after,
  paw,
  under: { hindF: (ctx, a, mode, K) => drawBall(ctx, a, mode, K, a.zz?.m), head: maneUnder },
  over: { tail: tailOver, body: bodyOver, head: bibOver, foreN: toes('foreN'), hindN: toes('hindN') },
  fx,
});

// Its art entry; its size as drawn (tail plume to snout, feet to the top of its mane, measured on
// tools/zz-thornbackcheck.html; its ball sits under its chin); its pace: the dog gait's own walk
// (stride 16.1 px, a clean walk with no trot up to about 28 px/s).
export const THORNBACK = { art: { ...VARRO.art, noHop: true }, w: 54, h: 48, speed: 27 };
