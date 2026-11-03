// Monster art: Clover Hills' farm (the player's picks, 2026-11-01).
//   macgoblin  Old MacGoblin, the Toadstool Goblins' farmer chief and Clover Hills' area boss: a
//              huge, round, grumpy old goblin in patched denim overalls and a wide straw hat with
//              a red toadstool growing out of its crown, drooping old ears, a bulbous nose, bushy
//              white brows and a walrus moustache, and a giant pitchfork he slams into the ground.
//   strawimp   Scarecrow Imp: a burlap-headed straw imp hopping on its post (the Mandrake Rows).
//   brownie    Kitchen Brownie: a tiny hooded house spirit with a big broom (the Goblin Barnyard).
//   kamaitachi Wind Ferret: the sickle weasel, darting on the wind (Jackalope Ridge).
// Faces use the simple eyes and mouths (faces.js). Faces right; see kit.js for the shapes.

import { E, T, F, mix, shade, stroke } from './kit.js';
import { simpleEye, simpleMouth, deadEye, sweat, vein } from './faces.js';
import { ramp, crescent, shine, smear, breath, sway, chain, wave } from './meadow.js';
import { part, makeRig, stateBlend, inPart } from './rig.js';

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
  const bob = dead ? 8 : A ? A.drop : walk ? 3.4 * dip - 1.7 : br * -1.8;
  const bx = 42 + (walk ? Math.sin(TAU * q) * 2.2 : idle ? sway(q) * 1.2 : 0) + (hurt ? -2.4 : 0);
  const by = 58 + bob;
  const lean = dead ? 70 : A ? -A.rear : hurt ? 8 : walk ? 4.5 * Math.sin(TAU * q * 2 - 1) : sway(q) * 2.6;

  // Legs: short and stout in denim, big muddy boots, swinging in a bow-legged stomp.
  for (const [dx, ph, near] of [[-8, 0, false], [8, 0.5, true]]) {
    const step = walk ? Math.sin(TAU * (q + ph)) * 8 : 0;
    const lift = walk ? Math.max(0, Math.cos(TAU * (q + ph))) * 5.5 : 0;
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
  const earDrop = dead ? 30 : hurt ? 20 : angry ? -12 : 6 + (idle ? sway(q - 0.2) * 7 : walk ? Math.sin(TAU * q * 2 - 2) * 11 : 0);
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
  const mb = walk ? Math.sin(TAU * q * 2 - 2.6) * 13 : idle ? sway(q - 0.4) * 9 : A ? -A.rear : 0;
  const mush = [];
  const mx = cx + 2;
  const my = cy - 10;
  mush.push(...stroke([[mx, my + 2], [mx + 0.6, my - 3]], 2.4, WHITE.base, false));
  mush.push(O(mx + 0.6, my - 4.6, 6, 3.6, 0, CAP.base, 16), crescent(mx + 0.6, my - 4.6, 6, 3.6, CAP.sh, { k: 0.3, a0: 30, a1: 180 }));
  for (const [dx, dy, r] of [[-2.6, -1, 1.2], [1.6, -2, 1], [3.6, 0.4, 0.8], [-0.2, 0.6, 0.7]]) mush.push(F(E(mx + 0.6 + dx, my - 4.6 + dy, r, r * 0.8, '#fff2e0')));
  hat.push(...rotate(mush, mx, my + 2, mb));
  // The hat rocks a beat behind his head.
  head.push(...rotate(hat, cx, cy, -6 + (angry ? -4 : 0) + (walk ? Math.sin(TAU * q * 2 - 1.9) * 4 : idle ? sway(q - 0.3) * 2.5 : 0)));
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


// ---------- Scarecrow Imp ----------
// A little straw imp that passes for a scarecrow: a burlap-sack head with a stitched grin under a
// patched straw hat, a plaid shirt with straw poking out of the cuffs and collar, standing on one
// wooden post it hops along on. At rest it holds still with its arms out, like a real scarecrow,
// its head lolling; it lunges with a straw-stuffed punch.

const BURLAP = ramp('#e2c08c', { step: 9, turn: 14, sat: -8 });
const PLAID = ramp('#d0504a', { step: 10, turn: 12 });
const STRAW2 = ramp('#f2d27a', { step: 9, turn: 12, sat: -4 });

const IMP_ATK = [
  { lean: -10, arm: -60, hop: 0 },
  { lean: 14, arm: 70, hop: 2 },
  { lean: 16, arm: 80, hop: 1 },
  { lean: 4, arm: 20, hop: 0 },
];

function strawimp(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? IMP_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  // It hops on its post: up off the ground and down twice a loop; at rest it stands stock still,
  // only the head lolling and the straw stirring.
  const hop = walk ? Math.sin(Math.PI * ((q * 2) % 1)) * 9 : A ? A.hop : 0;
  const x0 = 18;
  const gy = 40;
  const lean = dead ? 80 : A ? A.lean : hurt ? -14 : walk ? 9 * Math.sin(TAU * q * 2 - 0.6) : sway(q) * 5;
  const by = gy - 12 - hop;
  const body = [];
  // The post, and a straw tuft at its foot.
  body.push(...stroke([[x0, gy - hop], [x0, by + 2]], 2.4, WOOD.base, false), ...stroke([[x0 + 0.6, gy - hop], [x0 + 0.6, by + 2]], 0.6, WOOD.hi));
  // Plaid shirt: a little body, the checks as two crossing stripes.
  body.push(E(x0, by - 2, 6, 6.4, PLAID.base), crescent(x0, by - 2, 6, 6.4, PLAID.sh, { k: 0.3, a0: 60, a1: 220 }));
  for (const k of [-2.4, 1.6]) body.push(...stroke([[x0 + k, by - 8], [x0 + k + 0.4, by + 4]], 0.8, PLAID.sh), ...stroke([[x0 - 5.6, by - 3 + k], [x0 + 5.6, by - 3 + k]], 0.8, PLAID.sh));
  // Straw poking out under the shirt.
  for (let i = 0; i < 6; i++) body.push(...stroke([[x0 - 4 + i * 1.6, by + 3], [x0 - 4.6 + i * 1.8, by + 6 + (i % 2)]], 0.7, i % 2 ? STRAW2.base : STRAW2.hi));
  // Arms: held straight out like a scarecrow at rest (sagging a little, swaying), punching.
  const sag = idle ? 6 + Math.sin(TAU * q - 1) * 5 : walk ? 8 + 11 * Math.sin(TAU * q * 2 - 1.4) : 14;
  const arm = (s, near) => {
    const sh2 = [x0 + s * 4, by - 5];
    // (Attacking, A.arm is how far the near fist reaches: back and up winding up, out to punch.)
    const tip = A && near ? [sh2[0] + A.arm / 7, sh2[1] - (A.arm < 0 ? 6 : 0)] : [sh2[0] + s * 9, sh2[1] + (hurt ? -6 : sag * 0.5)];
    const o = [...stroke([sh2, tip], 2.6, near ? PLAID.base : PLAID.sh, false)];
    for (let i = 0; i < 4; i++) o.push(...stroke([tip, [tip[0] + s * 2 + (i - 1.5) * 0.6, tip[1] - 1.5 + i * 1.2]], 0.6, STRAW2.base));
    return o;
  };
  const back = arm(-1, false);
  const front = arm(1, true);
  out.push(...rotate([...back, ...body, ...front], x0, gy - hop, lean));
  // The head: a lumpy burlap sack tied at the neck, a stitched grin, simple eyes (button-dark).
  const hx = x0 + 1;
  const hy = by - 13 + (idle ? Math.sin(TAU * q - 1) * 1.3 : walk ? Math.sin(TAU * q * 2 - 1.8) * 1.4 : 0);
  const roll = idle ? Math.sin(TAU * q - 0.8) * 16 : walk ? Math.sin(TAU * q * 2 - 2.2) * 14 : 0;
  const head = [O(hx, hy, 7.4, 6.8, 0, BURLAP.base, 18), crescent(hx, hy, 7.4, 6.8, BURLAP.sh, { k: 0.3, a0: 90, a1: 230 })];
  for (let i = 0; i < 4; i++) head.push(...stroke([[hx - 6 + i * 3.6, hy - 5 + (i % 2)], [hx - 5 + i * 3.6, hy + 5]], 0.35, BURLAP.sh));
  head.push(...stroke([[hx - 4, hy + 6.4], [hx + 4, hy + 6.4]], 1, '#8a5a3c'));
  const em = dead ? 'dead' : hurt ? 'hurt' : mood === 'angry' || A ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  if (dead) head.push(...deadEye(hx, hy - 1, 1.6, { s: -1, c: '#3a2a2a' }), ...deadEye(hx + 4.4, hy - 1, 1.8, { c: '#3a2a2a' }));
  else head.push(...simpleEye(hx, hy - 1, { s: -1, w: 1.5, h: 1.7, mood: em, iris: '#3a2a2a', ink: '#2a1a1a' }), ...simpleEye(hx + 4.4, hy - 1.2, { s: 1, w: 1.7, h: 1.9, mood: em, iris: '#3a2a2a', ink: '#2a1a1a' }));
  // The stitched grin: a curve with little cross-stitches (wide open shouting).
  const open = A && f < 3;
  head.push(...stroke([[hx - 1.6, hy + 2.6], [hx + 1.6, hy + 3.6 + (open ? 1.4 : 0)], [hx + 5, hy + 2.4]], 0.6, '#5a3a2a'));
  for (const k of [0, 1.6, 3.2]) head.push(...stroke([[hx - 0.6 + k, hy + 2.4], [hx - 0.2 + k, hy + 4]], 0.4, '#5a3a2a'));
  // The patched straw hat, its brim flopping.
  const hat = [O(hx, hy - 5.4, 9.4, 2, -6, STRAW2.base, 16), E(hx - 0.6, hy - 8, 5, 3.6, STRAW2.base), crescent(hx - 0.6, hy - 8, 5, 3.6, STRAW2.sh, { k: 0.3, a0: 90, a1: 220 }),
    F(T([[hx - 3, hy - 9.6], [hx - 0.6, hy - 9.8], [hx - 0.4, hy - 7.6], [hx - 2.8, hy - 7.4]], '#5b86c8'))];
  for (let i = 0; i < 5; i++) hat.push(...stroke([[hx - 8 + i * 4, hy - 4.6], [hx - 8.6 + i * 4, hy - 2.8]], 0.5, STRAW2.sh));
  head.push(...hat);
  out.push(...rotate(head, hx, hy + 6, roll + lean * 0.5));
  if (A && f === 1) out.push(smear([[x0 + 4, by - 6], [x0 + 12, by - 4], [x0 + 18, by - 2]], 3, '#fff2c0'));
  if (A && f === 2) out.push(...star(x0 + 19, by - 3, 2.4, '#fff2b8'));
  return { w: 40, h: 46, res: 3, shapes: shift(out, 2, 4) };
}

// ---------- Kitchen Brownie ----------
// A tiny house spirit from the old stories: a round little fellow in a brown hooded cloak with
// long ears poking out, a patched apron and a broom twice his size. He sweeps as he goes, and
// whacks you with the broom (a puff of dust) when his chores are interrupted.

const CLOAK = ramp('#9a6a4a', { step: 10, turn: 12 });
const BSKIN = ramp('#ffd8b8', { step: 7, turn: 30 });
const APRON = ramp('#f6efe0', { step: 6, turn: 30 });
const BRISTLE = ramp('#e8c070', { step: 9, turn: 12 });

const BROWNIE_ATK = [
  { broom: -150, lean: -8 },
  { broom: 30, lean: 12 },
  { broom: 50, lean: 14 },
  { broom: 0, lean: 2 },
];

function brownie(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? BROWNIE_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  const bob = walk ? Math.abs(Math.sin(TAU * q * 2)) * 2.8 : idle ? breath(q) * 1.4 : 0;
  const x0 = 18 + (hurt ? -1.4 : 0);
  const gy = 40;
  const lean = dead ? 80 : A ? A.lean : hurt ? -12 : walk ? 4 + 7 * Math.sin(TAU * q * 2) : 6 * Math.sin(TAU * q - 0.3);
  const body = [];
  // Little boots pattering under the cloak.
  for (const [dx, ph] of [[-3, 0], [3, 0.5]]) {
    const step = walk ? Math.sin(TAU * (q + ph)) * 2.4 : 0;
    body.push(E(x0 + dx + step, gy - 1.2, 2.6, 1.6, CLOAK.deep));
  }
  // The cloak: a round brown bell, the apron over its front.
  const cy = gy - 8 - bob;
  body.push(O(x0, cy, 6.6, 7, 0, CLOAK.base, 18), crescent(x0, cy, 6.6, 7, CLOAK.sh, { k: 0.3, a0: 50, a1: 230 }));
  body.push(T([[x0 + 0.6, cy - 3], [x0 + 5.6, cy - 3], [x0 + 6.2, cy + 6], [x0 + 0.4, cy + 6.4]], APRON.base), F(T([[x0 + 2.4, cy + 1], [x0 + 5, cy + 1], [x0 + 5, cy + 3.6], [x0 + 2.4, cy + 3.6]], APRON.sh)));
  out.push(...rotate(body, x0, gy, lean * 0.5));
  // The broom: sweeping side to side at rest and walking, raised high and brought down to attack.
  const ba = A ? A.broom : walk ? 15 + 24 * Math.sin(TAU * q * 2 - 0.5) : 20 + 30 * Math.sin(TAU * q - 0.4);
  const hand = [x0 + 10, cy - 2];
  const d = [Math.sin(ba * D2R), Math.cos(ba * D2R)];
  const top = [hand[0] - d[0] * 8, hand[1] - d[1] * 8];
  const foot = [hand[0] + d[0] * 13, hand[1] + d[1] * 13];
  const broom = [...stroke([top, foot], 1.4, WOOD.base, false)];
  const n = [Math.cos(ba * D2R), -Math.sin(ba * D2R)];
  broom.push(T([[foot[0] - n[0] * 2, foot[1] - n[1] * 2], [foot[0] + n[0] * 2, foot[1] + n[1] * 2], [foot[0] + n[0] * 4 + d[0] * 7, foot[1] + n[1] * 4 + d[1] * 7], [foot[0] - n[0] * 4 + d[0] * 7, foot[1] - n[1] * 4 + d[1] * 7]], BRISTLE.base));
  for (const k of [-2.4, 0, 2.4]) broom.push(...stroke([[foot[0] + n[0] * k * 0.5, foot[1] + n[1] * k * 0.5], [foot[0] + n[0] * k + d[0] * 6.6, foot[1] + n[1] * k + d[1] * 6.6]], 0.4, BRISTLE.sh));
  broom.push(...stroke([[foot[0] - n[0] * 2.2, foot[1] - n[1] * 2.2 + 0.6], [foot[0] + n[0] * 2.2, foot[1] + n[1] * 2.2 + 0.6]], 0.8, '#d0504a'));
  out.push(...broom, E(hand[0], hand[1], 1.6, 1.6, BSKIN.base));
  // The head: a round face in the hood, long ears poking out of it, a button nose, simple eyes.
  const hx = x0 + 1.4;
  const hy = cy - 11 + (walk ? -bob * 0.5 : 0);
  const head = [];
  const ear = (s, c) => T([[hx + s * 4, hy - 2], [hx + s * 14, hy - 5 + (hurt || dead ? 4 : 0) + (idle ? Math.sin(TAU * q - 1) * 2.6 : walk ? Math.sin(TAU * q * 2 - 1.8) * 3.2 : 0)], [hx + s * 4, hy + 2]], c);
  head.push(ear(-1, BSKIN.sh), O(hx, hy - 1, 9.6, 9.2, 0, CLOAK.base, 18), crescent(hx, hy - 1, 9.6, 9.2, CLOAK.sh, { k: 0.3, a0: 90, a1: 230 }));
  head.push(E(hx + 1.6, hy + 0.8, 7, 6.4, BSKIN.base), crescent(hx + 1.6, hy + 0.8, 7, 6.4, BSKIN.sh, { k: 0.3, a0: 100, a1: 220 }), ear(1, BSKIN.base));
  head.push(T([[hx - 7, hy - 7], [hx - 1, hy - 13], [hx + 4, hy - 8]], CLOAK.base));
  const em = dead ? 'dead' : hurt ? 'hurt' : mood === 'angry' || A ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  if (dead) head.push(...deadEye(hx, hy, 1.3, { type: 'swirl', s: -1, c: '#3a2a2a' }), ...deadEye(hx + 3.6, hy, 1.4, { type: 'swirl', c: '#3a2a2a' }));
  else head.push(...simpleEye(hx - 0.4, hy, { s: -1, w: 1.6, h: 2, mood: em, iris: '#7a4a2a', ink: '#2a1a1a' }), ...simpleEye(hx + 4.4, hy - 0.1, { s: 1, w: 1.9, h: 2.3, mood: em, iris: '#7a4a2a', ink: '#2a1a1a' }));
  head.push(E(hx + 4.6, hy + 2, 1.2, 1, BSKIN.sh), F(E(hx - 0.6, hy + 2.4, 1, 0.6, '#ffb3c6')), F(E(hx + 5, hy + 2.8, 1, 0.6, '#ffb3c6')));
  head.push(...simpleMouth(hx + 2, hy + 3.6, { k: 0.8, mood: dead ? 'dead' : A && f < 3 ? 'shout' : em === 'angry' ? 'angry' : em, lip: '#8a3550' }));
  out.push(...rotate(head, x0, gy, lean * 0.6));
  if (A && f === 1) out.push(smear([[x0 + 2, cy - 18], [x0 + 12, cy - 10], [x0 + 16, cy + 6]], 3, '#fff2c0'));
  if (A && f === 2) for (const k of [-4, 0, 4]) out.push(E(x0 + 18 + k, gy - 1 - Math.abs(k) * 0.3, 2.6, 1.6, '#f3e6d6'));
  return { w: 40, h: 46, res: 3, shapes: shift(out, 2, 4) };
}

// ---------- Wind Ferret (kamaitachi) ----------
// The sickle weasel of the old stories: a slim cream ferret with a sky-blue wind ribbon round its
// neck, little sickle blades for claws and a tail that trails off into a swirl of wind. It zips
// along the ridge in darting bursts and dashes through you, leaving slashes of wind.

const FUR = ramp('#f6e6cc', { step: 8, turn: 24, sat: -4 });
const MASK = ramp('#c9a37a', { step: 9, turn: 14 });
const GUST = '#bfe6ff';

const FERRET_ATK = [
  { crouch: 3, dash: -3, stretch: 0 },
  { crouch: -1, dash: 10, stretch: 1 },
  { crouch: 0, dash: 12, stretch: 1 },
  { crouch: 1, dash: 4, stretch: 0 },
];

function kamaitachi(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? FERRET_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  // A bounding run: the long body arches and stretches with each bound; idle, it rears up to
  // sniff the wind.
  const bound = walk ? Math.sin(TAU * q) : 0;
  const x0 = 22 + (A ? A.dash : 0) + (hurt ? -2 : 0);
  const gy = 30;
  const rear = idle ? Math.max(0, Math.sin(TAU * q)) * 4 : 0;
  const by = gy - 6 - (walk ? Math.abs(bound) * 4.2 : 0) + (A ? A.crouch : 0) - rear * 0.5 + (dead ? 3 : 0);
  const arch = walk ? bound * 6 : A ? -A.crouch : 0;
  // The tail: a long plume that turns into a swirl of wind at its tip.
  const tail = chain(x0 - 10, by - 1, 190 + (walk ? -bound * 12 : idle ? Math.sin(TAU * q) * 10 : 0), [3, 3, 3, 3], (i) => -14 + wave(TAU * q * (walk ? 2 : 1), 8)(i));
  out.push(...stroke(tail.map(([x, y]) => [x, y]), 2.6, FUR.sh, false));
  const tt = tail.at(-1);
  for (let k = 0; k < 3; k++) out.push(...stroke(Array.from({ length: 6 }, (_, i) => { const a = (i / 5) * 4 + k * 2.1 + q * TAU; return [tt[0] - 2 - i * 0.8 + Math.cos(a) * (1 + i * 0.5), tt[1] + Math.sin(a) * (1 + i * 0.5)]; }), 0.6, GUST));
  // Legs: four quick little paws, sickle claws gleaming on the front ones.
  for (const [dx, ph, front] of [[-7, 0, false], [-4, 0.5, false], [5, 0.25, true], [8, 0.75, true]]) {
    const step = walk ? Math.sin(TAU * (q + ph)) * 3 : 0;
    const lift = walk ? Math.max(0, Math.cos(TAU * (q + ph))) * 2 : 0;
    const p = [x0 + dx + step, gy - lift];
    out.push(...stroke([[x0 + dx * 0.8, by + 2], p], 1.8, front ? FUR.base : FUR.sh, false));
    if (front) out.push(...stroke([[p[0], p[1] - 0.6], [p[0] + 2.4, p[1] - 2.4], [p[0] + 3.2, p[1] - 0.4]], 0.6, '#b8c2d4'));
  }
  // The long body, arching with the bound, stretching out in the dash.
  const len = 10 + (A ? A.stretch * 3 : walk ? Math.abs(bound) * 1.2 : 0);
  const body = [O(x0, by - arch * 0.4, len, 4.4, 0, FUR.base, 18), crescent(x0, by - arch * 0.4, len, 4.4, FUR.sh, { k: 0.3, a0: 60, a1: 200 }), shine(x0, by - arch * 0.4, len, 4.4, '#ffffff', 0, 0.8)];
  out.push(...rotate(body, x0, by, (dead ? 0 : -rear * 3) + arch));
  // The wind ribbon round its neck, its ends streaming back.
  const nx = x0 + len - 1;
  const ny = by - 2 - rear;
  const flow = walk || A ? 1 : 0.4;
  out.push(...stroke([[nx - 1, ny - 2], [nx - 6, ny - 3 - 2 * flow * Math.sin(TAU * q * 2)], [nx - 11, ny - 2]], 1.4, GUST), ...stroke([[nx - 1, ny + 1], [nx - 7, ny + 2 + flow * Math.sin(TAU * q * 2 + 1)], [nx - 12, ny + 3]], 1, mix(GUST, '#ffffff', 0.4)));
  // The head: a pointed little muzzle with a darker mask round the eyes, round ears.
  const hx = nx + 3;
  const hy = ny - 3;
  const head = [E(hx - 3, hy - 4, 2, 2, MASK.base), O(hx, hy, 5.4, 4.2, -8, FUR.base, 16), crescent(hx, hy, 5.4, 4.2, FUR.sh, { k: 0.3, a0: 100, a1: 220 }), O(hx + 5, hy + 1.4, 3, 2, -10, FUR.base, 12), F(E(hx + 7.6, hy + 0.8, 0.9, 0.8, '#3a2a3a')), E(hx + 1, hy - 4.4, 2, 2, MASK.base), F(O(hx + 2, hy - 0.6, 3.4, 1.8, -8, MASK.hi, 12))];
  const em = dead ? 'dead' : hurt ? 'hurt' : mood === 'angry' || A ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  if (dead) head.push(...deadEye(hx + 1, hy - 0.6, 1.2, { type: 'swirl', c: '#2a1a2e' }));
  else head.push(...simpleEye(hx + 1.6, hy - 0.6, { s: 1, w: 1.3, h: 1.5, mood: em, iris: '#4f95e0', ink: '#2a1a2e', wing: 1 }));
  head.push(...simpleMouth(hx + 5.6, hy + 2.8, { k: 0.7, mood: dead ? 'dead' : A && f < 3 ? 'shout' : em, lip: '#8a3550', smug: em === 'idle' }));
  out.push(...rotate(head, hx, hy + 3, (idle ? Math.sin(TAU * q - 1) * 8 : 0) - rear * 2));
  if (A && f >= 1 && f <= 2) {
    out.push(smear([[x0 - 14, by - 2], [x0 - 2, by - 2], [x0 + 10, by - 3]], 4, mix(GUST, '#ffffff', 0.5)));
    for (const k of [-3, 0, 3]) out.push(...stroke([[x0 + 14 + k, by - 8 + k], [x0 + 20 + k, by + 2 + k]], 0.8, GUST));
  }
  return { w: 50, h: 36, res: 3, shapes: shift(out, 2, 4) };
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

// ---------- Old MacGoblin, rigged ----------
// (2026-11-03, the boss reanimation.) A live skeleton (render/mobs/rig.js): he stomps bow-legged,
// his big belly and head a beat behind; his droopy ears flop on springs and the toadstool on his
// straw hat bobs after his head; at rest he leans on his pitchfork planted beside him, and for the
// slam he hoists it high over his hat and drives it into the ground in a burst of hay. Rig space:
// the floor under him at (0, 0).
const MG = {
  leg: (near) => part(`mac|leg|${near}`, 22, 22, () => {
    const c = near ? DENIM : { base: DENIM.sh };
    return [...stroke([[8, 2], [near ? 9.5 : 6.5, 7], [8, 12]], 6, c.base, false), E(10, 14.4, 5.6, 3.2, near ? BOOT.base : BOOT.sh), F(E(11, 13.2, 2.6, 0.9, near ? BOOT.hi : BOOT.base))];
  }),
  farArm: () => part('mac|fararm', 16, 22, () => [...stroke([[12, 2], [5, 12], [9, 18]], 5, SK.sh, false), E(9, 18, 3, 3, SK.sh)]),
  body: () => part('mac|body', 48, 46, () => {
    const bx = 24;
    const by = 24;
    const out = [E(bx, by, 20, 19, SK.base), crescent(bx, by, 20, 19, SK.sh, { k: 0.3, a0: 60, a1: 220 }), E(bx, by + 5, 20, 15, DENIM.base), crescent(bx, by + 5, 20, 15, DENIM.sh, { k: 0.3, a0: 40, a1: 200 }), shine(bx, by + 5, 20, 15, DENIM.hi, 0, 0.9)];
    out.push(T([[bx - 9, by - 12], [bx + 10, by - 12], [bx + 11, by + 2], [bx - 10, by + 2]], DENIM.base), F(T([[bx - 9, by - 12], [bx + 10, by - 12], [bx + 10, by - 10], [bx - 9, by - 10]], DENIM.hi)));
    out.push(...stroke([[bx - 8, by - 11], [bx - 12, by - 20]], 2.6, DENIM.sh, false), ...stroke([[bx + 9, by - 11], [bx + 11, by - 20]], 2.6, DENIM.base, false));
    for (const x of [bx - 7.6, bx + 8.6]) out.push(E(x, by - 11, 1.5, 1.5, '#f2c654'), F(E(x - 0.4, by - 11.4, 0.6, 0.5, '#fff2b8')));
    const px = bx - 9;
    const py = by + 9;
    out.push(T([[px - 4, py - 3.4], [px + 4, py - 4], [px + 4.4, py + 3.6], [px - 3.6, py + 4]], '#d0504a'));
    for (const k of [-1.6, 1.6]) out.push(...stroke([[px + k, py - 3.6], [px + k + 0.3, py + 3.8]], 0.6, '#f6dcc0'), ...stroke([[px - 3.8, py + k], [px + 4.2, py + k - 0.3]], 0.6, '#f6dcc0'));
    out.push(E(bx + 2, by - 15, 9, 3.6, WHITE.base));
    return out;
  }),
  // An ear from its root at (2, 4), drooping along +x.
  ear: (near) => part(`mac|ear|${near}`, 20, 10, () => {
    const c = near ? SK.base : SK.sh;
    return [T([[2, 1], [18, 5], [2, 8]], c), F(T([[3, 2.5], [14, 5], [3, 6.5]], mix(c, '#ff9fb8', 0.35)))];
  }),
  head: () => part('mac|head', 40, 38, () => {
    const hx = 18;
    const hy = 18;
    const out = [E(hx, hy, 14, 13, SK.base), crescent(hx, hy, 14, 13, SK.sh, { k: 0.3, a0: 100, a1: 230 }), shine(hx, hy, 14, 13, SK.hi, 0, 1)];
    out.push(E(hx + 10, hy + 3, 4.2, 3.6, SK.base), crescent(hx + 10, hy + 3, 4.2, 3.6, SK.sh, { k: 0.4, a0: 60, a1: 200 }), F(E(hx + 11, hy + 1.6, 1.4, 0.9, '#ffffff')), F(E(hx + 9, hy + 5, 2, 1, mix(SK.base, '#ff9fb8', 0.5))));
    return out;
  }),
  // Eyes, brows, the mouth and the moustache: everything that acts the mood.
  face: (mood, atk) => part(`mac|face|${mood}|${atk}`, 30, 26, () => {
    const hx = 10;
    const hy = 12;
    const dead = mood === 'dead';
    const hurt = mood === 'hurt';
    const angry = mood === 'angry' || atk;
    const out = [];
    const em = dead ? 'dead' : hurt ? 'hurt' : angry ? 'angry' : mood === 'happy' ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
    const eo = { iris: angry ? '#d0504a' : '#c98a2e', ink: '#2a2420', lid: 0.35, mood: em };
    const ey = hy - 1;
    if (dead) out.push(...deadEye(hx - 1, ey, 2, { type: 'swirl', s: -1, c: '#2a2420' }), ...deadEye(hx + 7, ey, 2.4, { type: 'swirl', c: '#2a2420' }));
    else out.push(...simpleEye(hx - 1, ey, { ...eo, s: -1, w: 2.2, h: 2.6 }), ...simpleEye(hx + 7, ey - 0.3, { ...eo, s: 1, w: 2.6, h: 3 }));
    const bt = angry ? 14 : hurt ? -14 : 0;
    for (const [x, sd] of [[hx - 1, -1], [hx + 7, 1]]) {
      const y0 = ey - 4.6 + (hurt ? -1 : 0);
      for (let k = 0; k < 4; k++) out.push(O(x + sd * (k - 1.5) * 1.6, y0 + sd * (k - 1.5) * Math.tan(bt * D2R) * 1.6 - (k % 2) * 0.6, 1.6, 1.2, k * 20, k % 2 ? WHITE.base : WHITE.hi, 10));
    }
    const mm = dead ? 'dead' : atk ? 'shout' : angry ? 'angry' : hurt ? 'hurt' : mood === 'happy' ? 'happy' : 'idle';
    out.push(...simpleMouth(hx + 6, hy + 9.4, { k: 1.6, mood: mm, lip: '#5a3a2a' }));
    const bristle = atk ? 2 : angry ? 1 : 0;
    for (const sd of [-1, 1]) out.push(O(hx + 8 + sd * 4, hy + 7 + Math.abs(sd) * 0.4, 6 + bristle * 0.4, 2.6, sd * (14 + bristle * 6), WHITE.base, 14), F(O(hx + 8 + sd * 4.4, hy + 6.4, 3.6, 1, sd * 14, WHITE.hi, 10)));
    out.push(O(hx + 6, hy + 12.6, 2.6, 2, 0, WHITE.sh, 10));
    if (angry && !atk) out.push(...vein(hx - 7, hy - 7, 1.3));
    if (hurt) out.push(...sweat(hx - 10, hy - 4, 1.4));
    return out;
  }),
  hat: () => part('mac|hat', 46, 18, () => {
    const cx = 23;
    const cy = 12;
    const out = [O(cx, cy + 1.5, 21, 4.2, -4, STRAW.base, 20), F(O(cx + 3, cy + 0.6, 15, 2, -4, STRAW.hi, 16)), E(cx, cy - 4, 11, 7, STRAW.base), crescent(cx, cy - 4, 11, 7, STRAW.sh, { k: 0.3, a0: 90, a1: 230 }), F(T([[cx - 11, cy - 1], [cx + 11, cy - 1.6], [cx + 11, cy + 1], [cx - 11, cy + 1.4]], '#d0504a'))];
    for (let k = -3; k <= 3; k++) out.push(...stroke([[cx + k * 3, cy - 9 + Math.abs(k) * 0.6], [cx + k * 3.4, cy - 1.6]], 0.4, STRAW.sh));
    return out;
  }),
  // The toadstool on top, from its foot at (7, 14).
  mush: () => part('mac|mush', 14, 16, () => {
    const out = [...stroke([[7, 14], [7.6, 9]], 2.4, WHITE.base, false), O(7.6, 7.4, 6, 3.6, 0, CAP.base, 16), crescent(7.6, 7.4, 6, 3.6, CAP.sh, { k: 0.3, a0: 30, a1: 180 })];
    for (const [dx, dy, r] of [[-2.6, -1, 1.2], [1.6, -2, 1], [3.6, 0.4, 0.8], [-0.2, 0.6, 0.7]]) out.push(F(E(7.6 + dx, 7.4 + dy, r, r * 0.8, '#fff2e0')));
    return out;
  }),
  arm: () => part('mac|arm', 22, 10, () => [...stroke([[3, 5], [17, 5]], 5.4, SK.base, false), E(17, 5, 3.6, 3.4, SK.base), F(E(18, 4, 1.2, 0.8, SK.hi))]),
  // The pitchfork along +x from the grip at (16, 9): the butt behind, the tines ahead.
  fork: () => part('mac|fork', 66, 18, () => {
    const out = [...stroke([[2, 9], [50, 9]], 2.2, WOOD.base, false), ...stroke([[2, 9.6], [50, 9.6]], 0.6, WOOD.hi), ...stroke([[50, 4], [50, 14]], 1.8, STEEL[1], false)];
    for (const k of [-4.4, 0, 4.4]) out.push(...stroke([[50, 9 + k], [60, 9 + k]], 1.4, STEEL[1], false), ...stroke([[50, 9.4 + k], [60, 9.4 + k]], 0.4, STEEL[0]), F(T([[60, 8.3 + k], [62, 9 + k], [60, 9.7 + k]], STEEL[2])));
    return out;
  }),
};
const macRig = makeRig({
  w: 70,
  h: 84,
  stride: 48,
  fast: ['arm', 'fork', 'rear'],
  kick: { rear: 1.6, mush: 4, earF: 3 },
  springs: { earF: [70, 4.5], earB: [60, 4], mush: [60, 4], hat: [110, 7], head: [140, 10] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const dip = Math.abs(s);
    const idle = { rear: Math.sin(t * 1.2) * 0.04, bob: Math.sin(t * 2) * 1.8, arm: 0.46, fork: -Math.PI / 2 + Math.sin(t * 1.2) * 0.03, legF: 0, legB: 0, x: 0 };
    const walk = { rear: Math.sin(a.wp * 2 - 1) * 0.08, bob: dip * 3.4 - 1.7, arm: 0.46 + s * 0.05, fork: -Math.PI / 2 + s * 0.07, legF: -s * 0.5, legB: s * 0.5, x: s * 2.2 };
    // Hoisted overhead, tines up and back...
    const antic = { rear: -8 * D2R, bob: -3, arm: -1.75, fork: -1.9, legF: -0.1, legB: 0.15, x: 0 };
    // ...then driven down in front of him, his whole weight behind it.
    const strike = { rear: 12 * D2R, bob: 3, arm: 0.95, fork: 0.95, legF: -0.3, legB: 0.25, x: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S, a) => ({ head: S.rear * 0.4, hat: -6 * D2R - S.rear * 0.6, mush: -S.rear * 1.5 - S.bob * 0.04, earF: 0.35 - S.bob * 0.06 - S.rear, earB: 2.7 + S.bob * 0.06 + S.rear }),
  parts: [
    { name: 'root', at: (S) => [S.x, -26 + S.bob], rot: (S) => S.rear },
    { name: 'legB', parent: 'root', pivot: [8, 2], at: () => [-6.4, 12], rot: (S) => S.legB, s: () => MG.leg(false) },
    { name: 'legF', parent: 'root', pivot: [8, 2], at: () => [6.4, 12], rot: (S) => S.legF, s: () => MG.leg(true) },
    { name: 'farArm', parent: 'root', pivot: [12, 2], at: () => [-12, -12], s: () => MG.farArm() },
    { name: 'body', parent: 'root', pivot: [24, 24], at: () => [0, 0], s: () => MG.body() },
    { name: 'earB', parent: 'root', pivot: [2, 4], at: () => [0, -31], rot: (S) => S.earB, s: () => MG.ear(false) },
    { name: 'head', parent: 'root', pivot: [18, 18], at: () => [10, -29], rot: (S) => S.head, s: () => MG.head() },
    { name: 'face', parent: 'head', pivot: [10, 12], at: () => [0, 0], s: (a) => MG.face(a.face, a.atk) },
    { name: 'earF', parent: 'head', pivot: [2, 4], at: () => [8, -1], rot: (S) => S.earF - S.head, s: () => MG.ear(true) },
    { name: 'hat', parent: 'head', pivot: [23, 12], at: () => [-1, -10], rot: (S) => S.hat - S.head, s: () => MG.hat() },
    { name: 'mush', parent: 'hat', pivot: [7, 14], at: () => [2, -10], rot: (S) => S.mush, s: () => MG.mush() },
    // The near arm and the fork in world terms: the fork's angle is where it points.
    { name: 'arm', parent: 'root', pivot: [3, 5], at: () => [14, -12], rot: (S) => S.arm - S.rear, s: () => MG.arm() },
    { name: 'fork', parent: 'arm', pivot: [16, 9], at: () => [14, 0], rot: (S) => S.fork - S.arm, s: () => MG.fork() },
  ],
  fx(ctx, m, a) {
    // Hay and dust bursting up where the tines land.
    if (a.ph.since >= 0 && a.ph.since < 0.6) {
      const u = a.ph.since / 0.6;
      for (let i = 0; i < 10; i++) {
        const ang = (-160 + i * 16) * D2R;
        const r = 8 + 18 * u;
        ctx.globalAlpha = a.alpha * (1 - u);
        ctx.fillStyle = i % 2 ? STRAW.base : STRAW.hi;
        ctx.fillRect(40 + Math.cos(ang) * r, -2 + Math.sin(ang) * r * 0.7, 3, 1.4);
      }
    }
  },
});

export const ART = {
  macgoblin: { walk: 8, idle: 6, attack: 5, stride: 26, atkMs: [120, 460, 220, 260], draw: macgoblin, rig: macRig },
  strawimp: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 240, 180], draw: strawimp },
  brownie: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [70, 260, 200], draw: brownie },
  kamaitachi: { walk: 8, idle: 6, attack: 4, stride: 34, atkMs: [50, 220, 160], draw: kamaitachi },
};

export const INFO = {
  macgoblin: { name: 'Old MacGoblin', w: 70, h: 84 },
  strawimp: { name: 'Scarecrow Imp', w: 22, h: 36 },
  brownie: { name: 'Kitchen Brownie', w: 22, h: 30 },
  kamaitachi: { name: 'Wind Ferret', w: 34, h: 22 },
};
