// The town's animals that aren't monsters: the dog and the cats (render/townlife.js) and the cats
// sat about the maps (render/scenery.js). Each is a little four-legged figure on a real skeleton
// (render/quadruped.js): shoulders and hips, legs that bend at the wrist and the hock, paws that
// stay planted on the ground while the body goes over them, a spine that dips and rises with the
// gait, and a head, ears and tail that swing on springs. Their steps come from the ground they
// cover, never a clock; standing, they breathe, blink, look about and do what a dog or a cat does.
// Everything is drawn facing right, standing on the box's ground line, and mirrored to face left;
// never squashed or stretched.

import { sprite, blit, E, T, F } from './pixel.js';
import { ik, limb, pawCycle, follow, eye, rot, blinkAt, INK, ss } from './quadruped.js';

const TAU = Math.PI * 2;
const q = (v, n = 4) => Math.round(v * n) / n;
const lerp = (a, b, t) => a + (b - a) * t;

function shadeOf(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
const tints = (coat) => ({ base: coat, sh: shadeOf(coat, 0.86), sh2: shadeOf(coat, 0.72), lt: shadeOf(coat, 1.08) });

// Each animal's springs and stride, kept per animal id.
const STATES = new Map();
function stateOf(id, wx, time) {
  let st = STATES.get(id);
  if (!st) {
    st = { x: wx, t: time, dist: 0, speed: 0, spring: {} };
    STATES.set(id, st);
    if (STATES.size > 300) STATES.delete(STATES.keys().next().value);
  }
  const dt = Math.max(0, Math.min(0.1, time - st.t));
  const dx = Math.abs(wx - st.x);
  // (A jump in position, arriving on the map, isn't walking.)
  const moved = dx < 40 ? dx : 0;
  st.dist += moved;
  st.speed = dt > 0 ? lerp(st.speed, moved / dt, 1 - Math.exp(-10 * dt)) : st.speed;
  st.x = wx;
  st.t = time;
  st.dt = dt;
  return st;
}

function place(ctx, s, x, gy, w, ground, flip) {
  blit(ctx, s, Math.round(x - w / 2), Math.round(gy - ground), { flip });
}

// ===================================================================================== The dog
// A little shiba: fox-red coat, cream cheeks, chest and socks, a curled-up tail and pointed ears,
// a red collar with a bell. It trots on diagonal pairs (near fore with far hind), the spine level
// and the head bobbing once a step; standing, it pants, wags, tilts its head at you; when it stops
// mid-chase it drops into a play bow, tail going like mad.
const DOG = { w: 40, h: 30, gy: 28, stride: 19, duty: 0.36 };
const DC = { base: '#e8a35e', sh: '#c97f45', sh2: '#a86536', cream: '#fff3e0', creamSh: '#f0d8bc', nose: '#3a2d4f', collar: '#ff5f7e', bell: '#ffd84a', tongue: '#ff8fa8', inner: '#ffc2c8' };

function dogShapes(P) {
  const c = DC;
  const gy = DOG.gy;
  const bob = P.bob;
  const bow = P.bow;
  // The spine: hips and shoulders, the shoulders sinking into a play bow.
  const hip = [12, 17.6 + bob];
  const sho = [26, 17.8 + bob + bow * 4.2];
  const pitch = Math.atan2(sho[1] - hip[1], sho[0] - hip[0]);
  const mid = [(hip[0] + sho[0]) / 2, (hip[1] + sho[1]) / 2];
  const R0 = (pts) => rot(pts, mid[0], mid[1], pitch);
  const legOf = (root, ph, front, near) => {
    const [dx, up] = P.moving ? pawCycle(ph, DOG.duty, (DOG.stride * DOG.duty) / 2, 3.4) : [0, 0];
    const reach = front ? bow * 3.4 : 0;
    const paw = [root[0] + (front ? 1.2 : -0.4) + dx + reach, gy - 1.1 - up];
    const { knee, paw: p } = ik(root[0], root[1] + 1.4, paw[0], paw[1], 4.9, 5.3, front ? 1 : -1);
    const tone = near ? c.base : c.sh2;
    return limb([root[0], root[1] + 1.4], knee, p, { w0: 4.6, w1: 2.7, w2: 2.6, c: tone, sock: near ? c.cream : c.creamSh, pawRx: 1.9, pawRy: 1.2, toe: front ? 0.6 : 0.4 });
  };
  // Trot: near fore and far hind together, then far fore and near hind.
  const ph = P.ph;
  const back = [...legOf([hip[0] + 1.4, hip[1]], ph, false, false), ...legOf([sho[0] - 1.6, sho[1]], ph + 0.5, true, false)];
  // The tail: a fat curl over the back, swinging with the wag.
  const tail = [];
  {
    let [tx, ty] = [hip[0] - 3.4, hip[1] - 3.6];
    let a = -Math.PI * 0.62 + P.tail * 0.5;
    const rs = [2.6, 2.9, 3, 2.8, 2.4, 1.9];
    for (let i = 0; i < rs.length; i++) {
      tail.push([tx, ty, rs[i]]);
      tx += Math.cos(a) * 2.2;
      ty += Math.sin(a) * 2.2;
      a += 0.55 + P.tailLag * 0.25;
    }
  }
  back.push(...tail.map(([x, y, r]) => E(x, y, r, r, c.base)));
  back.push(...tail.slice(2).map(([x, y, r]) => F(E(x + 0.3, y - 0.3, r * 0.62, r * 0.55, c.cream))));
  // Body: haunch, barrel and deep chest, cream underneath.
  const body = [
    E(hip[0], hip[1] - 1.4, 5.4, 5.2, c.base),
    T(R0([[hip[0] - 1, mid[1] - 5.4], [sho[0] + 1, mid[1] - 5.6], [sho[0] + 3.4, mid[1] - 1], [sho[0] + 1.6, mid[1] + 4.2], [hip[0] + 2, mid[1] + 3.6], [hip[0] - 2.4, mid[1] + 1]]), c.base),
    E(sho[0] + 1.4, sho[1] - 0.6, 4.8, 5.4, c.base),
    F(T(R0([[hip[0] + 2.4, mid[1] + 3.4], [sho[0] + 1.2, mid[1] + 3.8], [sho[0] - 2, mid[1] + 1.8], [hip[0] + 4, mid[1] + 2]]), c.creamSh)),
    F(E(sho[0] + 3.2, sho[1] + 0.6, 2.4, 3.6, c.cream)),
    F(E(mid[0] - 1, mid[1] - 4.4, 5.4, 0.9, '#f6bd80')),
  ];
  // Head on the neck, tilting and bobbing; the far ear behind it.
  const hx = sho[0] + 5.2 + bow * 1.6;
  const hy = sho[1] - 8.6 + P.head * 1.4 + bow * 2.2;
  const tilt = P.tilt * 0.22;
  const H = (pts) => rot(pts, hx, hy + 2, tilt);
  const ear = (ex, a, tone, inner) => {
    const pts = H(rot([[ex - 2.2, hy - 2.6], [ex + 2.4, hy - 2.8], [ex + 0.4 + a * 1.6, hy - 8.4 + Math.abs(a) * 1.2]], ex, hy - 2.6, a * 0.5));
    const ip = H(rot([[ex - 1, hy - 3.2], [ex + 1.3, hy - 3.3], [ex + 0.3 + a * 1.4, hy - 6.6 + Math.abs(a) * 1.1]], ex, hy - 2.6, a * 0.5));
    return [T(pts, tone), F(T(ip, inner))];
  };
  const mouthOpen = P.pant;
  const head = [
    T(R0([[sho[0] - 1.4, sho[1] - 3.6], [sho[0] + 3, sho[1] - 4.4], [hx + 1, hy + 2], [hx - 3.4, hy + 1]]), c.base),
    F(T(R0([[sho[0] + 2.6, sho[1] - 2.6], [sho[0] + 4.4, sho[1] - 3.6], [hx + 2, hy + 3.4]]), c.cream)),
    // the collar and its bell
    ...[T(R0([[sho[0] - 0.6, sho[1] - 3.6], [sho[0] + 3.8, sho[1] - 4.6], [sho[0] + 4.4, sho[1] - 2.6], [sho[0] + 0, sho[1] - 1.6]]), c.collar)],
    E(sho[0] + 4.4 + Math.sin(P.ph * TAU * 2) * 0.4 * P.moving, sho[1] - 1.4, 1.2, 1.2, c.bell),
    ...ear(hx + 2.6, P.ear + 0.15, c.sh, c.sh2),
    E(...H([[hx, hy]])[0], 6, 5.4, c.base),
    F(E(...H([[hx + 1.4, hy + 2.4]])[0], 4.6, 2.6, c.cream)),
    F(E(...H([[hx - 2.4, hy - 2.6]])[0], 2.4, 1, c.sh)),
    // muzzle, nose, mouth
    E(...H([[hx + 5, hy + 1.6]])[0], 2.8, 2.1, c.cream),
    F(E(...H([[hx + 7.2, hy + 0.7]])[0], 1.1, 0.85, c.nose)),
    ...(mouthOpen > 0.5
      ? [F(E(...H([[hx + 5.4, hy + 3.4]])[0], 1.4, 1.1, '#8a3a4a')), F(E(...H([[hx + 5.6, hy + 4.4 + P.lick * 0.4]])[0], 1, 1.4, c.tongue))]
      : [F(T(H([[hx + 4.4, hy + 3.2], [hx + 5.4, hy + 3.7], [hx + 6.4, hy + 3.2], [hx + 6.4, hy + 3.6], [hx + 5.4, hy + 4.1], [hx + 4.4, hy + 3.6]]), INK))]),
    ...H([[hx + 2, hy - 0.4]]).flatMap(([x, y]) => eye(x, y, P.eyes, 1.05)),
    F(E(...H([[hx + 2.8, hy + 2.6]])[0], 1.3, 0.7, '#ff9fb4')),
    ...ear(hx - 1.2, P.ear, c.base, c.inner),
  ];
  // Near legs in front of the body.
  const front = [...legOf([hip[0] + 0.4, hip[1]], ph + 0.5, false, true), ...legOf([sho[0] - 0.6, sho[1]], ph, true, true)];
  return [...back, ...body, ...head, ...front];
}

function dogPose(st, time, mode) {
  const moving = mode === 'run' && st.speed > 6;
  const ph = (st.dist / DOG.stride) % 1;
  const bow = mode === 'bow' ? 1 : 0;
  // Two bobs a stride (once per diagonal pair), lowest just after each pair lands.
  // Running, the body floats up between the pairs' pushes and sinks as each pair lands.
  const bob = moving ? -Math.abs(Math.sin(ph * TAU)) * 1.6 + 0.5 : Math.sin(time * 2.4) * 0.25;
  const wag = bow ? Math.sin(time * 22) : moving ? Math.sin(ph * TAU * 2) * 0.5 : Math.sin(time * 7) * (Math.sin(time * 0.6) > 0 ? 0.7 : 0.25);
  const look = moving ? Math.sin(ph * TAU * 2) * 0.3 : 0;
  // Standing about: a head tilt now and then, panting in turn with resting the mouth.
  const tiltOn = !moving && !bow && Math.sin(time * 0.45 + 1) > 0.75 ? 1 : 0;
  const pant = moving || bow || Math.sin(time * 0.3) > 0 ? 1 : 0;
  const target = {
    tail: wag, ear: moving ? -0.6 : bow ? 0.1 : tiltOn ? 0.35 : 0, head: look + (bow ? 1 : 0), tilt: tiltOn,
  };
  const P = follow(st.spring, target, st.dt, 220, 0.6);
  return {
    ph: q(ph, 16), moving: moving ? 1 : 0, bob: q(bob), bow, pant, lick: Math.floor(time * 6) % 2,
    tail: q(P.tail, 8), tailLag: q(P.tail - target.tail, 8), ear: q(P.ear, 8), head: q(P.head), tilt: q(P.tilt, 8), eyes: blinkAt(time, 5),
  };
}

// Draws the dog at (x, gy) on screen; `wx` its world x (its steps come from the ground covered).
// mode: 'run' (moving), 'stand', or 'bow' (a play bow).
export function drawDog(ctx, id, x, gy, wx, facing, time, mode) {
  const st = stateOf(id, wx, time);
  const P = dogPose(st, time, mode);
  const s = sprite(`critter|dog|${Object.values(P).join(',')}`, () => ({ w: DOG.w, h: DOG.h, shapes: dogShapes(P), res: 3, soft: 'cel', crisp: true, selout: true }));
  place(ctx, s, x, gy, DOG.w, DOG.gy, facing < 0);
}

// ===================================================================================== Cats
// A slim cat with a long tail held up in a question mark. It walks in the cat's own order (hind,
// fore, other hind, other fore), shoulders rolling, head low and level, tail up and swaying;
// standing it sits, tail curled round its feet, ears and tail tip twitching, now and then licking a
// paw; asleep it's a curled loaf, breathing, tail wrapped round its nose.
const CAT = { w: 36, h: 28, gy: 26, stride: 11, duty: 0.6 };

function catWalkShapes(P, col) {
  const c = tints(col);
  const gy = CAT.gy;
  const hip = [11, 16.8 + P.bob];
  const sho = [23.5, 17 + P.bob * 0.6];
  const mid = [(hip[0] + sho[0]) / 2, (hip[1] + sho[1]) / 2];
  // Lateral walk: hind, fore on the same side a quarter later, then the other side.
  const legOf = (root, ph, front, near) => {
    const [dx, up] = P.moving ? pawCycle(ph, CAT.duty, (CAT.stride * CAT.duty) / 2, 1.8) : [0, 0];
    const { knee, paw } = ik(root[0], root[1] + 1, root[0] + (front ? 0.8 : -0.4) + dx, gy - 1 - up, 4.6, 4.8, front ? 1 : -1);
    return limb([root[0], root[1] + 1], knee, paw, { w0: front ? 3.4 : 4.2, w1: 2.1, w2: 2, c: near ? c.base : c.sh2, sock: near ? c.lt : c.sh2, pawRx: 1.6, pawRy: 1, toe: 0.4 });
  };
  const ph = P.ph;
  const back = [...legOf([hip[0] + 1.2, hip[1]], ph + 0.5, false, false), ...legOf([sho[0] - 1.2, sho[1]], ph + 0.75, true, false)];
  // The tail: up from the rump in a curve, the tip hooked over and flicking.
  {
    // (Out back from the rump, sweeping up, the tip hooked forward: a question mark.)
    let [tx, ty] = [hip[0] - 3.4, hip[1] - 1.8];
    let a = -Math.PI * 0.88 + P.tail * 0.2;
    for (let i = 0; i < 10; i++) {
      const r = 1.75 - i * 0.06;
      back.push(E(tx, ty, r, r, c.base));
      tx += Math.cos(a) * 1.7;
      ty += Math.sin(a) * 1.7;
      a += (i < 4 ? 0.3 : i < 7 ? 0.08 : 0.42 + P.tip * 0.3) + P.tail * 0.03;
    }
  }
  const body = [
    E(hip[0], hip[1] - 1.2, 4.4, 4.4, c.base),
    T([[hip[0] - 0.6, mid[1] - 4.4], [sho[0] + 0.4, mid[1] - 4.2 + P.roll * 0.6], [sho[0] + 2.6, mid[1] - 0.4], [sho[0] + 0.6, mid[1] + 3.4], [hip[0] + 1.8, mid[1] + 3.2], [hip[0] - 2.4, mid[1] + 0.6]], c.base),
    E(sho[0] + 0.8, sho[1] - 1 + P.roll * 0.5, 3.6, 4.2, c.base),
    F(E(mid[0], mid[1] + 2.6, 7, 1.2, c.sh)),
    F(E(mid[0] - 1, mid[1] - 3.4, 5, 0.9, c.lt)),
  ];
  // (A walking cat carries its head low and level, out ahead of the shoulders.)
  const hx = sho[0] + 6.2;
  const hy = sho[1] - 5 + P.head * 0.8;
  const ear = (ex, a, tone, inner) => [
    T(rot([[ex - 2, hy - 2.6], [ex + 1.8, hy - 3], [ex + 0.2, hy - 7.6]], ex, hy - 2.8, a * 0.5), tone),
    F(T(rot([[ex - 0.9, hy - 3.2], [ex + 0.9, hy - 3.4], [ex + 0.1, hy - 6.2]], ex, hy - 2.8, a * 0.5), inner)),
  ];
  const head = [
    T([[sho[0] - 1, sho[1] - 3.4], [sho[0] + 2.4, sho[1] - 4], [hx, hy + 2.6], [hx - 3, hy + 1.4]], c.base),
    ...ear(hx + 2.2, P.ear + 0.2, c.sh, c.sh2),
    E(hx, hy, 4.8, 4.2, c.base),
    F(E(hx + 0.6, hy + 2.2, 4.4, 1.8, c.lt)),
    E(hx + 3.8, hy + 1.6, 1.8, 1.4, c.lt),
    F(T([[hx + 5, hy + 0.6], [hx + 6, hy + 0.6], [hx + 5.5, hy + 1.3]], '#ff9fb8')),
    F(T([[hx + 4.6, hy + 2.2], [hx + 5.4, hy + 2.6], [hx + 6.2, hy + 2.2], [hx + 6.2, hy + 2.5], [hx + 5.4, hy + 2.9], [hx + 4.6, hy + 2.5]], INK)),
    ...eye(hx + 1.8, hy - 0.2, P.eyes, 0.95),
    F(E(hx + 2.4, hy + 2, 1.1, 0.6, '#ffa8bf')),
    ...ear(hx - 1.6, P.ear, c.base, '#ffc2d0'),
  ];
  const front = [...legOf([hip[0] + 0.2, hip[1]], ph, false, true), ...legOf([sho[0] - 0.2, sho[1]], ph + 0.25, true, true)];
  return [...back, ...body, ...head, ...front];
}

function catSitShapes(P, col) {
  const c = tints(col);
  const gy = CAT.gy;
  const by = P.breath;
  // The tail lies round the front paws, its tip lifting and flicking.
  const tail = [];
  {
    let [tx, ty] = [9, gy - 1.6];
    for (let i = 0; i < 10; i++) {
      const r = 1.5;
      const k = i / 9;
      tail.push(E(tx, ty - (i > 6 ? (i - 6) * (0.6 + P.tip * 0.9) : 0), r, r, c.base));
      tx += 1.7;
      ty += k < 0.2 ? -0.2 : 0;
    }
  }
  const lick = P.lick;
  const hx = 21.4 + lick * 0.6;
  const hy = 7.6 + by + lick * 1.4;
  const ear = (ex, a, tone, inner) => [
    T(rot([[ex - 2, hy - 2.6], [ex + 1.8, hy - 3], [ex + 0.2, hy - 7.6]], ex, hy - 2.8, a * 0.5), tone),
    F(T(rot([[ex - 0.9, hy - 3.2], [ex + 0.9, hy - 3.4], [ex + 0.1, hy - 6.2]], ex, hy - 2.8, a * 0.5), inner)),
  ];
  // The near forepaw: down on the ground, or up at the mouth for a lick.
  const paw = lick ? [hx + 2.6, hy + 4.2] : [19.6, gy - 1];
  const { knee } = ik(18.4, 14 + by, paw[0], paw[1], 4.8, 5.6, 1);
  return [
    // far forepaw, the haunch and the upright chest
    ...limb([17.2, 14 + by], [17.6, 18.8 + by], [18, gy - 1], { w0: 3, w1: 2, w2: 2, c: c.sh2, sock: c.sh2, pawRx: 1.5, pawRy: 1, toe: 0.4 }),
    E(12.4, gy - 6.2 + by * 0.4, 6.4, 5.8, c.base),
    E(11.4, gy - 1.4, 4.6, 1.6, c.base),
    T([[13.6, gy - 10 + by], [17, 9.6 + by], [21.4, 12 + by], [21, 18 + by], [17.2, gy - 2], [12.6, gy - 3]], c.base),
    F(E(19.2, 15.4 + by, 2.4, 4.4, c.lt)),
    F(E(11.6, gy - 6.6, 4, 3.6, c.sh)),
    ...tail,
    ...ear(hx + 2.2, P.ear + 0.2, c.sh, c.sh2),
    E(hx, hy, 4.8, 4.2, c.base),
    F(E(hx + 0.4, hy + 2.2, 4.4, 1.8, c.lt)),
    E(hx + 3.6, hy + 1.6, 1.8, 1.4, c.lt),
    F(T([[hx + 4.8, hy + 0.6], [hx + 5.8, hy + 0.6], [hx + 5.3, hy + 1.3]], '#ff9fb8')),
    ...(lick ? [F(E(hx + 4.6, hy + 2.8, 0.7, 0.8, '#ff7fa0'))] : []),
    ...eye(hx + 1.6, hy - 0.2, lick ? 0.1 : P.eyes, 0.95),
    F(E(hx + 2.2, hy + 2, 1.1, 0.6, '#ffa8bf')),
    ...ear(hx - 1.6, P.ear, c.base, '#ffc2d0'),
    ...limb([18.4, 14 + by], knee, paw, { w0: 3.2, w1: 2.1, w2: 2.1, c: c.base, sock: c.lt, pawRx: 1.6, pawRy: 1.1, toe: 0.5 }),
  ];
}

function catNapShapes(P, col) {
  const c = tints(col);
  const gy = CAT.gy;
  const by = P.breath;
  return [
    // the curled body, the tail wrapped round to the nose
    E(15, gy - 4.6 - by, 9.4, 4.8 + by, c.base),
    F(E(14, gy - 2, 8, 1.6, c.sh)),
    F(E(13, gy - 7.6 - by, 5, 1, c.lt)),
    ...Array.from({ length: 9 }, (_, i) => E(6.4 + i * 1.9, gy - 1.6 - Math.sin((i / 8) * Math.PI) * 0.8, 1.5, 1.5, c.base)),
    // the head tucked down on the paws, ears soft, eyes shut
    E(22.4, gy - 4.4, 4.4, 3.8, c.base),
    T([[19.6, gy - 7], [21.4, gy - 7.4], [20.2, gy - 10.4 + P.ear * 0.6]], c.base),
    T([[23.4, gy - 7.8], [25.4, gy - 7.2], [24.8, gy - 10.6 + P.ear * 0.6]], c.base),
    F(T([[23.8, gy - 7.8], [24.9, gy - 7.5], [24.6, gy - 9.4]], '#ffc2d0')),
    E(25.4, gy - 2.4, 1.8, 1.2, c.lt),
    F(T([[22.2, gy - 4.6], [24.6, gy - 4.6], [24.3, gy - 4], [22.5, gy - 4]], INK)),
    F(E(24.2, gy - 2.8, 1.1, 0.6, '#ffa8bf')),
  ];
}

// A cat at (x, gy) on screen; `wx` its world x. mode: 'walk', 'sit' or 'nap'.
export function drawCat(ctx, id, coat, x, gy, wx, facing, time, mode) {
  const st = stateOf(id, wx, time);
  const seed = (id.length * 7 + id.charCodeAt(id.length - 1)) % 13;
  const t = time + seed;
  let P;
  let build;
  if (mode === 'walk') {
    const ph = (st.dist / CAT.stride) % 1;
    const moving = st.speed > 3;
    const S = follow(st.spring, { tail: Math.sin(t * 1.1) * 0.5, tip: Math.sin(t * 2.3) * 0.5 }, st.dt, 120, 0.7);
    P = {
      ph: q(ph, 16), moving: moving ? 1 : 0, bob: q(moving ? Math.sin(ph * TAU * 2) * 0.35 : Math.sin(t * 2) * 0.2), roll: q(moving ? Math.sin(ph * TAU) : 0),
      head: q(moving ? Math.sin(ph * TAU * 2 + 1) * 0.25 : 0), tail: q(S.tail, 8), tip: q(S.tip, 8), ear: Math.sin(t * 0.7) > 0.9 ? 0.4 : 0, eyes: blinkAt(time, seed),
    };
    build = () => catWalkShapes(P, coat);
  } else if (mode === 'nap') {
    P = { breath: q(Math.max(0, Math.sin(t * 1.6)) * 0.5), ear: Math.sin(t * 0.5) > 0.92 ? 1 : 0 };
    build = () => catNapShapes(P, coat);
  } else {
    const lick = Math.sin(t * 0.33) > 0.8 ? 1 : 0;
    P = {
      breath: q(Math.sin(t * 1.8) * 0.3), lick, tip: q(ss(Math.max(0, Math.sin(t * 1.3))) * (Math.sin(t * 0.21) > -0.3 ? 1 : 0.2), 8),
      ear: Math.sin(t * 0.9) > 0.94 ? 0.5 : 0, eyes: blinkAt(time, seed),
    };
    build = () => catSitShapes(P, coat);
  }
  const s = sprite(`critter|cat|${mode}|${coat}|${Object.values(P).join(',')}`, () => ({ w: CAT.w, h: CAT.h, shapes: build(), res: 3, soft: 'cel', crisp: true, selout: true }));
  place(ctx, s, x, gy, CAT.w, CAT.gy, facing < 0);
}
