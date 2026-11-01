// Monster art: Clover Hills' farm (the player's picks, 2026-11-01).
//   macgoblin  Old MacGoblin, the Toadstool Goblins' farmer chief and Clover Hills' area boss: a
//              huge, round, grumpy old goblin in patched denim overalls and a wide straw hat with
//              a red toadstool growing out of its crown, drooping old ears, a bulbous nose, bushy
//              white brows and a walrus moustache, and a giant pitchfork he slams into the ground.
// Faces use the simple eyes and mouths (faces.js). Faces right; see kit.js for the shapes.

import { E, T, F, mix, shade, stroke } from './kit.js';
import { simpleEye, simpleMouth, deadEye, sweat, vein } from './faces.js';
import { ramp, crescent, shine, smear, breath, sway } from './meadow.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const shift = (shapes, dx, dy) => shapes.map((s) => s && (s.t === 'p' ? { ...s, pts: s.pts.map(([x, y]) => [x + dx, y + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
function O(cx, cy, rx, ry, deg, c, n = 18) {
  const a = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    pts.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return T(pts, c);
}
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), F(E(x, y, k * 0.9, k * 0.9, core))];
}

const SK = ramp('#a8da8c', { step: 10, turn: 16, sat: -6 });
const DENIM = ramp('#5b86c8', { step: 10, turn: 10 });
const STRAW = ramp('#f0cf86', { step: 10, turn: 12, sat: -6 });
const CAP = ramp('#ff7072', { step: 11, turn: 14, sat: -8 });
const WHITE = ramp('#f6f2ea', { step: 7, turn: 30 });
const BOOT = ramp('#8a5a3c', { step: 9, turn: 10 });
const WOOD = ramp('#cf9c66', { step: 11, turn: 12, sat: -12 });
const STEEL = ['#eef2f8', '#b8c2d4', '#7a849a'];

// Attack: the pitchfork slam. arm: the fork arm's angle (deg, 0 straight down, + forward),
// rear: body leaning back (- forward), drop: body dip, burst: hay and dust where the tines land.
const MAC_ATK = [
  // Wind-up (held): rising onto his toes, the fork hoisted high over his head, glaring.
  { arm: -170, rear: 8, drop: -3, burst: 0 },
  // Slam: the fork driven down in front of him, his whole weight behind it (a smear).
  { arm: 30, rear: -10, drop: 2, burst: 0 },
  // Impact (held): the tines in the ground, hay and dust bursting up.
  { arm: 40, rear: -12, drop: 3, burst: 1 },
  // Lingering: hay still falling, he heaves it back out.
  { arm: 20, rear: -6, drop: 1, burst: 0.6 },
  // Recover: back upright, leaning on it.
  { arm: -5, rear: 0, drop: 0, burst: 0 },
];

function macgoblin(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? MAC_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || Boolean(A);
  const out = [];
  // A heavy, bow-legged stomp: the body dips on each footfall (twice a loop), the belly and hat
  // a beat behind; idle, a grumpy breath and a sway, leaning on the fork.
  const br = idle ? breath(q) : 0;
  const dip = walk ? Math.abs(Math.sin(TAU * q)) : 0;
  const bob = dead ? 8 : A ? A.drop : walk ? 2 * dip - 1 : br * -1.2;
  const bx = 42 + (walk ? Math.sin(TAU * q) * 1.2 : idle ? sway(q) * 0.6 : 0) + (hurt ? -2.4 : 0);
  const by = 58 + bob;
  const lean = dead ? 70 : A ? -A.rear : hurt ? 8 : walk ? 2 * Math.sin(TAU * q * 2 - 1) : sway(q) * 1.2;

  // Legs: short and stout in denim, big muddy boots, swinging in a bow-legged stomp.
  for (const [dx, ph, near] of [[-8, 0, false], [8, 0.5, true]]) {
    const step = walk ? Math.sin(TAU * (q + ph)) * 5 : 0;
    const lift = walk ? Math.max(0, Math.cos(TAU * (q + ph))) * 3 : 0;
    const top = [bx + dx * 0.8, by + 14];
    const foot = [bx + dx + step, 84 - lift];
    const c = near ? DENIM : { base: DENIM.sh, sh: DENIM.deep };
    out.push(...stroke([top, [lerp(top[0], foot[0], 0.5) + (near ? 1.5 : -1.5), lerp(top[1], foot[1], 0.5)], [foot[0], foot[1] - 3]], 6, c.base, false));
    out.push(E(foot[0] + 2, foot[1] - 1.6, 5.6, 3.2, near ? BOOT.base : BOOT.sh), F(E(foot[0] + 3, foot[1] - 2.8, 2.6, 0.9, near ? BOOT.hi : BOOT.base)));
  }

  // The far arm, a hand on the small of his back (old farmer's back).
  out.push(...stroke([[bx - 12, by - 12], [bx - 19, by - 2], [bx - 15, by + 4]], 5, SK.sh, false), E(bx - 15, by + 4, 3, 3, SK.sh));

  // The body: a big round belly in skin, the overalls over it (bib, straps, a plaid patch, brass
  // buttons), a cream undershirt at the collar.
  const body = [E(bx, by, 20, 19, SK.base), crescent(bx, by, 20, 19, SK.sh, { k: 0.3, a0: 60, a1: 220 })];
  body.push(E(bx, by + 5, 20, 15, DENIM.base), crescent(bx, by + 5, 20, 15, DENIM.sh, { k: 0.3, a0: 40, a1: 200 }), shine(bx, by + 5, 20, 15, DENIM.hi, 0, 0.9));
  body.push(T([[bx - 9, by - 12], [bx + 10, by - 12], [bx + 11, by + 2], [bx - 10, by + 2]], DENIM.base), F(T([[bx - 9, by - 12], [bx + 10, by - 12], [bx + 10, by - 10], [bx - 9, by - 10]], DENIM.hi)));
  body.push(...stroke([[bx - 8, by - 11], [bx - 12, by - 20]], 2.6, DENIM.sh, false), ...stroke([[bx + 9, by - 11], [bx + 11, by - 20]], 2.6, DENIM.base, false));
  for (const x of [bx - 7.6, bx + 8.6]) body.push(E(x, by - 11, 1.5, 1.5, '#f2c654'), F(E(x - 0.4, by - 11.4, 0.6, 0.5, '#fff2b8')));
  // A plaid patch, stitched on crooked.
  const px = bx - 9;
  const py = by + 9;
  body.push(T([[px - 4, py - 3.4], [px + 4, py - 4], [px + 4.4, py + 3.6], [px - 3.6, py + 4]], '#d0504a'));
  for (const k of [-1.6, 1.6]) body.push(...stroke([[px + k, py - 3.6], [px + k + 0.3, py + 3.8]], 0.6, '#f6dcc0'), ...stroke([[px - 3.8, py + k], [px + 4.2, py + k - 0.3]], 0.6, '#f6dcc0'));
  for (let i = 0; i < 6; i++) body.push(...stroke([[px - 4.6 + i * 1.8, py - 4.4 + (i % 2) * 0.4], [px - 4 + i * 1.8, py - 3.4]], 0.4, '#8a6a52'));
  body.push(E(bx + 2, by - 15, 9, 3.6, WHITE.base));
  out.push(...body.map((s) => s));

  // The near arm and the pitchfork: leaning on it at rest (planted beside him), swung overhead
  // and driven down to attack.
  const sh = [bx + 14, by - 12];
  let hand;
  let fa;
  if (A) {
    // Attacking, the fork follows the arm: hoisted overhead tines-up, driven down tines-first.
    const armA = A.arm;
    const el = [sh[0] + Math.sin((armA + 25) * D2R) * 8, sh[1] + Math.cos((armA + 25) * D2R) * 8];
    hand = [el[0] + Math.sin(armA * D2R) * 7, el[1] + Math.cos(armA * D2R) * 7];
    fa = armA;
  } else {
    // At rest (and walking) the fork stands planted beside him, tines up over his hat, his hand
    // on the shaft; hurt, it's knocked askew.
    hand = [bx + 30 + (walk ? 2 * Math.sin(TAU * q) : 0), by - 4 + (walk ? dip : 0)];
    fa = hurt ? 200 : 180 + (walk ? 4 * Math.sin(TAU * q) : idle ? sway(q) * 2 : 0);
  }
  const el = [lerp(sh[0], hand[0], 0.5) - 1, lerp(sh[1], hand[1], 0.5) + 5];
  const dx = Math.sin(fa * D2R);
  const dy = Math.cos(fa * D2R);
  const reachDown = A ? 14 : Math.max(8, 84 - hand[1]);
  const butt = [hand[0] - dx * reachDown, hand[1] - dy * reachDown];
  const head0 = [hand[0] + dx * 34, hand[1] + dy * 34];
  const fork = [...stroke([butt, head0], 2.2, WOOD.base, false), ...stroke([[butt[0] + 0.6, butt[1]], [head0[0] + 0.6, head0[1]]], 0.6, WOOD.hi)];
  const nx = Math.cos(fa * D2R);
  const ny = -Math.sin(fa * D2R);
  fork.push(...stroke([[head0[0] - nx * 5, head0[1] - ny * 5], [head0[0] + nx * 5, head0[1] + ny * 5]], 1.8, STEEL[1], false));
  for (const k of [-4.4, 0, 4.4]) {
    const b = [head0[0] + nx * k, head0[1] + ny * k];
    const tip = [b[0] + dx * 10, b[1] + dy * 10];
    fork.push(...stroke([b, tip], 1.4, STEEL[1], false), ...stroke([[b[0] + nx * 0.4, b[1] + ny * 0.4], [tip[0] + nx * 0.4, tip[1] + ny * 0.4]], 0.4, STEEL[0]), F(T([[tip[0] - nx * 0.7, tip[1] - ny * 0.7], [tip[0] + dx * 2, tip[1] + dy * 2], [tip[0] + nx * 0.7, tip[1] + ny * 0.7]], STEEL[2])));
  }
  const held = [...fork];
  held.push(...stroke([sh, el, hand], 5.4, SK.base, false), E(hand[0], hand[1], 3.6, 3.4, SK.base), F(E(hand[0] + 1, hand[1] - 1, 1.2, 0.8, SK.hi)));

  // Hoisting it for the slam, the fork and his arm are raised up behind his head.
  const behind = A && f === 0;
  if (behind) out.push(...held);

  // The head: big and round on no neck, frog-green, tilted with his mood.
  const hx = bx + 10;
  const hy = by - 29 + (walk ? 1.2 * dip : idle ? br * -0.6 : 0) + (A ? -A.rear * 0.2 : 0);
  const head = [];
  // Old drooping ears, long and pointed, the far one behind.
  const earDrop = dead ? 30 : hurt ? 20 : angry ? -12 : 6 + (idle ? sway(q - 0.2) * 4 : walk ? Math.sin(TAU * q * 2 - 2) * 6 : 0);
  head.push(T([[hx - 10, hy - 2], [hx - 26, hy + earDrop * 0.4 - 4], [hx - 11, hy + 4]], SK.sh), F(T([[hx - 12, hy - 0.5], [hx - 22, hy + earDrop * 0.4 - 3], [hx - 12, hy + 2.5]], mix(SK.sh, '#ff9fb8', 0.35))));
  head.push(E(hx, hy, 14, 13, SK.base), crescent(hx, hy, 14, 13, SK.sh, { k: 0.3, a0: 100, a1: 230 }), shine(hx, hy, 14, 13, SK.hi, 0, 1));
  head.push(T([[hx + 8, hy - 2], [hx + 22, hy + earDrop * 0.3 - 6], [hx + 9, hy + 4]], SK.base), F(T([[hx + 10, hy - 0.5], [hx + 19, hy + earDrop * 0.3 - 5], [hx + 10, hy + 2.5]], mix(SK.base, '#ff9fb8', 0.35))));
  // Face: grumpy simple eyes under bushy white brows (heavy-lidded at rest, a glare angry).
  const em = dead ? 'dead' : hurt ? 'hurt' : angry ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  const eo = { iris: angry ? '#d0504a' : '#c98a2e', ink: '#2a2420', lid: 0.35, mood: em };
  const ey = hy - 1;
  if (dead) head.push(...deadEye(hx - 1, ey, 2, { type: 'swirl', s: -1, c: '#2a2420' }), ...deadEye(hx + 7, ey, 2.4, { type: 'swirl', c: '#2a2420' }));
  else head.push(...simpleEye(hx - 1, ey, { ...eo, s: -1, w: 2.2, h: 2.6 }), ...simpleEye(hx + 7, ey - 0.3, { ...eo, s: 1, w: 2.6, h: 3 }));
  // Bushy brows: thick cream tufts, slammed down when angry, lifted when hurt.
  const bt = angry ? 14 : hurt ? -14 : 0;
  for (const [x, s] of [[hx - 1, -1], [hx + 7, 1]]) {
    const y0 = ey - 4.6 + (hurt ? -1 : 0);
    for (let k = 0; k < 4; k++) head.push(O(x + s * (k - 1.5) * 1.6, y0 + s * (k - 1.5) * Math.tan(bt * D2R) * 1.6 - (k % 2) * 0.6, 1.6, 1.2, k * 20, k % 2 ? WHITE.base : WHITE.hi, 10));
  }
  // The bulbous nose.
  head.push(E(hx + 10, hy + 3, 4.2, 3.6, SK.base), crescent(hx + 10, hy + 3, 4.2, 3.6, SK.sh, { k: 0.4, a0: 60, a1: 200 }), F(E(hx + 11, hy + 1.6, 1.4, 0.9, '#ffffff')), F(E(hx + 9, hy + 5, 2, 1, mix(SK.base, '#ff9fb8', 0.5))));
  // The mouth peeks out under the moustache: a grumble at rest, a bellow attacking.
  const mm = dead ? 'dead' : A && f < 3 ? 'shout' : angry ? 'angry' : hurt ? 'hurt' : mood === 'happy' ? 'happy' : 'idle';
  head.push(...simpleMouth(hx + 6, hy + 9.4, { k: 1.6, mood: mm, lip: '#5a3a2a' }));
  // The walrus moustache: two big white sweeps under the nose, bristling when he shouts.
  const bristle = A && f < 3 ? 2 : angry ? 1 : 0;
  for (const s of [-1, 1]) {
    head.push(O(hx + 8 + s * 4, hy + 7 + Math.abs(s) * 0.4, 6 + bristle * 0.4, 2.6, s * (14 + bristle * 6), WHITE.base, 14));
    head.push(F(O(hx + 8 + s * 4.4, hy + 6.4, 3.6, 1, s * 14, WHITE.hi, 10)));
  }
  head.push(O(hx + 6, hy + 12.6, 2.6, 2, 0, WHITE.sh, 10));
  if (angry && !A) head.push(...vein(hx - 7, hy - 7, 1.3));
  if (hurt) head.push(...sweat(hx - 10, hy - 4, 1.4));

  // The straw hat: a wide floppy brim and a round crown with a red band, and a toadstool growing
  // out of the top, bobbing a beat behind his head.
  const hat = [];
  const cx = hx - 1;
  const cy = hy - 10;
  hat.push(O(cx, cy + 1.5, 21, 4.2, -4, STRAW.base, 20), F(O(cx + 3, cy + 0.6, 15, 2, -4, STRAW.hi, 16)));
  hat.push(E(cx, cy - 4, 11, 7, STRAW.base), crescent(cx, cy - 4, 11, 7, STRAW.sh, { k: 0.3, a0: 90, a1: 230 }), F(T([[cx - 11, cy - 1], [cx + 11, cy - 1.6], [cx + 11, cy + 1], [cx - 11, cy + 1.4]], '#d0504a')));
  for (let k = -3; k <= 3; k++) hat.push(...stroke([[cx + k * 3, cy - 9 + Math.abs(k) * 0.6], [cx + k * 3.4, cy - 1.6]], 0.4, STRAW.sh));
  const mb = walk ? Math.sin(TAU * q * 2 - 2.6) * 6 : idle ? sway(q - 0.4) * 4 : A ? -A.rear : 0;
  const mush = [];
  const mx = cx + 2;
  const my = cy - 10;
  mush.push(...stroke([[mx, my + 2], [mx + 0.6, my - 3]], 2.4, WHITE.base, false));
  mush.push(O(mx + 0.6, my - 4.6, 6, 3.6, 0, CAP.base, 16), crescent(mx + 0.6, my - 4.6, 6, 3.6, CAP.sh, { k: 0.3, a0: 30, a1: 180 }));
  for (const [dx, dy, r] of [[-2.6, -1, 1.2], [1.6, -2, 1], [3.6, 0.4, 0.8], [-0.2, 0.6, 0.7]]) mush.push(F(E(mx + 0.6 + dx, my - 4.6 + dy, r, r * 0.8, '#fff2e0')));
  hat.push(...rotate(mush, mx, my + 2, mb));
  head.push(...rotate(hat, cx, cy, -6 + (angry ? -4 : 0)));
  out.push(...rotate(head, bx, by, lean * 0.4));
  if (!behind) out.push(...held);

  let shapes = out;
  if (A && f === 1) shapes.push(smear([[bx + 14, by - 62], [bx + 32, by - 44], [bx + 42, by - 8]], 4, '#fff6d8'));
  if (A?.burst) {
    const k = A.burst;
    const gx = bx + 38;
    for (let i = 0; i < 10; i++) {
      const a = (-160 + i * 16) * D2R;
      const r = 8 + 14 * k;
      shapes.push(T([[gx + Math.cos(a) * r, 84 + Math.sin(a) * r * 0.7], [gx + Math.cos(a) * (r + 5), 84 + Math.sin(a) * (r + 5) * 0.7 - 1], [gx + Math.cos(a) * r + 1.4, 84 + Math.sin(a) * r * 0.7 + 1]], i % 2 ? STRAW.base : STRAW.hi));
    }
    shapes.push(...star(gx, 78, 5 * k, '#fff2b8'), E(gx - 8, 84, 4 * k, 2 * k, '#f3e6d6'), E(gx + 8, 84, 4 * k, 2 * k, '#f3e6d6'));
  }
  return { w: 96, h: 110, res: 3, shapes: shift(shapes, 2, 22) };
}

// Turns shapes about (cx, cy) by deg.
function rotate(shapes, cx, cy, deg) {
  if (!deg) return shapes;
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const r = (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return shapes.map((sh) => {
    if (!sh) return sh;
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([px, py]) => r(sh.x + px, sh.y + py)) };
    const [x, y] = sh.t === 'e' ? r(sh.x, sh.y) : r(sh.x + sh.w / 2, sh.y + sh.h / 2);
    return sh.t === 'e' ? { ...sh, x, y } : { ...sh, x: x - sh.w / 2, y: y - sh.h / 2 };
  });
}

export const ART = {
  macgoblin: { walk: 8, idle: 6, attack: 5, stride: 26, atkMs: [120, 460, 220, 260], draw: macgoblin },
};

export const INFO = {
  macgoblin: { name: 'Old MacGoblin', w: 70, h: 84 },
};
