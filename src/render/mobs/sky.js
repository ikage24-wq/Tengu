// Monster art: sky. The Sky Garden's heavenly creatures:
//   cloudsheep  Pegasus Foal: a cream foal with a cotton-candy mane, cloud-puff fetlocks, and
//               feathered wings that beat as it trots.
//   windbird    Harpy: a bird-girl with feathered wing-arms, a plume crest, and dangling talons.
//   starspirit  Star Seraph: a turning star core with a serene face, three pairs of wings, a
//               halo, and star sparks circling it.
// Everything is built from feathers and puffs that carry their own thin inner line, so layered
// parts stay readable inside the automatic silhouette outline.

import { E, T, F, C, shade, mix, stroke, INK, BLUSH } from './kit.js';
import { eye, mouth, deadEye } from './faces.js';
import { ID, ap, pivot, move, put, breath, beat, burst, streaks, ik, gait } from './ruins.js';

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const dirOf = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
// The inner line drawn around a part where it overlaps another.
const lineOf = (c) => mix(shade(c, -36), INK, 0.38);
const lerp = (a, b, t) => a + (b - a) * t;
const shift = (shapes, dx, dy) => shapes.map((s) => s && { ...s, x: s.x + dx, y: s.y + dy });

// ---------- Building blocks ----------

// A feather: a long leaf with a rounded tip, its own thin line, an optional colored tip, a
// darker back vane, and a shaft.
function featherPts(bx, by, ang, len, wid) {
  const [dx, dy] = dirOf(ang);
  const p = (t, s) => [bx + dx * len * t - dy * wid * s, by + dy * len * t + dx * wid * s];
  return { p, body: [p(0, 0.3), p(0.45, 0.5), p(0.8, 0.42), p(0.97, 0.16), p(1, 0), p(0.97, -0.16), p(0.8, -0.42), p(0.45, -0.5), p(0, -0.3)] };
}

function feather(bx, by, ang, len, wid, col, { tip, vane, shaft = len > 6, cast = false, line = lineOf(col), tipAt = 0.62 } = {}) {
  const [dx, dy] = dirOf(ang);
  const out = [F(T(featherPts(bx - dx * 0.35, by - dy * 0.35, ang, len + 0.8, wid + 0.95).body, line))];
  const { p, body } = featherPts(bx, by, ang, len, wid);
  const main = T(body, col);
  out.push(cast ? C(main) : main);
  if (vane) out.push(F(T([p(0.12, 0), p(0.45, -0.46), p(0.8, -0.38), p(0.96, 0)], vane)));
  if (tip) out.push(F(T([p(tipAt, 0.47), p(0.8, 0.42), p(0.97, 0.16), p(1, 0), p(0.97, -0.16), p(0.8, -0.42), p(tipAt, -0.47)], tip)));
  if (shaft) out.push(...stroke([p(0.06, 0), p(0.8, 0)], 0.28, mix(col, line, 0.4)));
  return out;
}

// Fluffy puffs ([x, y, r]) with their own scalloped lines and a soft shine on each.
function puffs(list, col, { line = lineOf(col), hi = mix(col, '#ffffff', 0.6), sq = 0.88 } = {}) {
  const out = [];
  list.forEach(([x, y, r, c = col]) => {
    out.push(F(E(x, y, r + 0.45, r * sq + 0.45, c === col ? line : lineOf(c))), E(x, y, r, r * sq, c));
    if (hi && r > 1.4) out.push(F(E(x - r * 0.28, y - r * 0.38, r * 0.42, r * 0.26, c === col ? hi : mix(c, '#ffffff', 0.6))));
  });
  return out;
}

// A side-view wing from the shoulder (x, y): an arm toward `ang` (degrees, screen space), primaries
// fanning backward from the wrist by `ps` degrees each, secondaries along the arm, a row of coverts,
// and the leading edge. Scaled by k.
function wing({ x, y, ang, ps, k = 1, col, tip, tipAt = 0.62, cov, vane, bone = col, hand, n = 5, sec = 4, arm = 6.5, plen = 11, pw = 3.3, slen = 8, sw = 3 }) {
  const [dx, dy] = dirOf(ang);
  const wx = x + dx * arm * k;
  const wy = y + dy * arm * k;
  const out = [];
  // Inner lines stay soft; the silhouette gets the strong outline anyway.
  const line = mix(col, lineOf(col), 0.72);
  for (let i = 0; i < n; i++) {
    const a = ang + 4 - i * ps;
    const back = i * 0.55 * k;
    out.push(...feather(wx - dx * back, wy - dy * back, a, plen * k * (1 - i * 0.07), pw * k, col, { tip, tipAt, vane, shaft: false, line }));
  }
  const sa = ang + 4 - n * ps;
  for (let j = 0; j < sec; j++) {
    const t = 1 - (j + 0.7) / (sec + 0.3);
    out.push(...feather(lerp(x, wx, t), lerp(y, wy, t), sa - 6 - j * 7, slen * k * (1 - j * 0.06), sw * k, col, { tip, tipAt, vane, shaft: false, line }));
  }
  // Coverts: one smooth band of three broad feathers over the feather roots.
  const cl = mix(cov, lineOf(cov), 0.8);
  const [nx, ny] = dirOf(sa + 20);
  out.push(...stroke([[x + nx * 1.2 * k, y + ny * 1.2 * k], [wx + nx * 1.2 * k, wy + ny * 1.2 * k]], 3.4 * k, cov, false));
  for (let j = 0; j < 3; j++) {
    const t = 0.9 - j * 0.36;
    out.push(...feather(lerp(x, wx, t), lerp(y, wy, t), sa + 16 - j * 8, slen * 0.6 * k, sw * 1.2 * k, cov, { shaft: false, line: cl }));
  }
  out.push(...stroke([[x, y], [wx, wy]], 2.4 * k, bone, false), E(wx, wy, 1.4 * k, 1.4 * k, bone), E(x, y, 1.9 * k, 1.9 * k, bone), F(E(lerp(x, wx, 0.45) - ny * 0.4, lerp(y, wy, 0.45) + nx * 0.4, 1.6 * k, 0.6 * k, mix(bone, '#ffffff', 0.55))));
  if (hand) out.push(...hand(wx, wy));
  return out;
}

// A four-pointed sparkle.
function sparkle(x, y, r, c, core = '#ffffff') {
  const q = r * 0.3;
  return [F(T([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c)), F(E(x, y, q * 0.9, q * 0.9, core))];
}

// A tilted ring (halo), or the arc of it from t0 to t1 degrees.
function ring(cx, cy, rx, ry, th, rot, c, t0 = 0, t1 = 360) {
  const pts = (a, b) => Array.from({ length: 25 }, (_, i) => {
    const t = rad(t0 + ((t1 - t0) * i) / 24);
    const px = Math.cos(t) * a;
    const py = Math.sin(t) * b;
    const r = rad(rot);
    return [cx + px * Math.cos(r) - py * Math.sin(r), cy + px * Math.sin(r) + py * Math.cos(r)];
  });
  return T([...pts(rx, ry), ...pts(rx - th, Math.max(0.4, ry - th * 0.7)).reverse()], c);
}

// ---------- Pegasus Foal ----------
// It prances in a springy diagonal trot with high knees, a nodding head, and a flagging tail; it
// attacks by rearing up on its hind legs and stamping down with its forehooves.

const COAT = '#fff6ee';
const COAT_FAR = '#ece2f6';
const COAT_SH = '#efe4f8';
const MANE = ['#ffc4de', '#e2caff', '#c0e2ff'];
const CLOUD = '#ffffff';
const HOOF = '#ffd98a';
const MUZ = '#b0607e';

const PEG_ATK = [
  { rot: 0.05, dy: 1.4, wa: -152, ps: 8, fore: [0.8, 46], head: [-0.6, 1.6], tail: -0.6 },
  { rot: -0.3, dy: 1.6, wa: -98, ps: 15, fore: [3.4, 38], head: [-0.8, 3.4], tail: 1 },
  { rot: -0.08, dy: 0.4, wa: -116, ps: 13, fore: [7, 44.6], head: [0.8, 0.8], tail: 0.6 },
  { rot: -0.02, dy: 0.2, wa: -126, ps: 11, fore: [2.4, 46], head: [0.3, 0.4], tail: 0.2 },
];

function pegasus(pose, f, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? PEG_ATK[f] : null;
  const u = ak ? f / 4 : f / (walk ? 8 : 6);
  const a = ak ? f * 1.2 : u * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // A springy prancing trot: the body rises off each diagonal pair's push (two bounces a cycle),
  // the head nodding a beat after; standing, it breathes in slowly and out quickly.
  const bob = ak ? ak.dy : walk ? 0.75 * Math.cos(2 * a) : -breath(u) * 0.45;
  const breathe = walk || ak ? 0 : breath(u) * 0.5;
  let hx = ak ? ak.head[0] : walk ? 0.3 * Math.sin(2 * a - 0.6) : Math.sin(a) * 0.25;
  let hy = bob + (ak ? ak.head[1] - ak.dy : walk ? 0.7 * Math.cos(2 * a - 0.9) : -breath(u - 0.12) * 0.35);
  if (hurt) [hx, hy] = [hx - 1.2, hy - 0.8];
  if (dead) [hx, hy] = [hx - 0.4, hy + 2.4];
  const nod = ak ? [-0.06, -0.14, 0.08, 0.03][f] : walk ? 0.05 * Math.cos(2 * a - 1.2) : 0.02 * Math.sin(a - 1) + (hurt ? -0.12 : 0) + (dead ? 0.18 : 0);
  const look = walk ? 0.4 : ak ? 0.6 : Math.sin(a) * 0.9;
  // Rig: root (rears about the hind hooves in the attack) > body (bob) > neck > head (nods about
  // the poll); legs are two-bone IK from the hips to hooves planted on the ground.
  const root = ak ? pivot(move(ID, -ak.rot * 16, 0), 18, 46, ak.rot) : ID;
  const bodyF = move(root, 0, bob);
  const headF = pivot(move(root, hx, hy), 37, 18, nod);
  const Rt = (s) => put(root, s);
  const B = (s) => put(bodyF, s);
  const out = [];

  // Wing pose: raised and half spread, beating with the trot (fast down, slow up).
  const bt = beat(u * 2);
  let wa = ak ? ak.wa : walk ? -140 + 22 * bt : -133 + 4 * beat(u) + (f === 3 ? -3 : 0);
  let ps = ak ? ak.ps : walk ? 13 - 3.5 * bt : 9.5 + beat(u) * 0.8;
  if (angry && !ak) [wa, ps] = [wa + 14, ps + 2.5];
  if (happy) wa += 8;
  if (hurt) [wa, ps] = [-104, 15];
  if (dead) [wa, ps] = [-176, 6];
  const wingCol = { col: '#fbfaff', tip: '#a9d3ff', cov: '#ffffff', vane: '#e8eefb', k: 1.2, arm: 7 };
  out.push(...B(wing({ x: 29.5, y: 21.5, ang: wa + 9 + (walk ? 18 * (beat(u * 2 - 0.06) - bt) : 0), ps, k: 1.08, arm: 7, col: '#e7e2f4', tip: '#b5d3f2', cov: '#efebf8', vane: '#dcd6ee' })));

  // Tail: a cotton-candy plume on a chain, carried high in the trot and swishing root to tip.
  const tsw = walk ? 1.2 : ak ? 0.4 : 0.6;
  const lift = ak ? ak.tail : walk ? 0.7 : 0;
  const tail = [[10.5, 24.5, 2.8], [7.6, 26.2, 3.3], [5.4, 29.4, 3.4], [4.6, 33.2, 3.1], [5.4, 36.8, 2.6], [7.2, 39.4, 1.9]].map(([x, y, r], i) => {
    const sw = Math.sin((walk ? 2 : 1) * a - i * 0.75) * i * 0.38 * tsw + (dead ? i * 0.5 : 0);
    return [x + sw + 0.6 - lift * i * 0.35, y - (angry ? i * 0.5 : 0) - lift * i * 0.9, r, MANE[i % 3]];
  });
  out.push(...B(puffs(tail, MANE[0])));

  // Legs: a diagonal trot (near fore with far hind) with high, prancing forelegs. Forelegs bend
  // at the knee to the front, hind legs at the hock to the back; the hooves plant and slide.
  const ground = 46;
  const leg = (hipx, hipy, p, fore, near, plant) => {
    const hip = ap(bodyF, hipx, hipy);
    let foot;
    let up = 0;
    if (plant) foot = plant;
    else if (walk && !dead) {
      const [dx, l] = gait(p, 8, fore ? 5.4 : 3.4, 0.5);
      up = l;
      foot = [hipx + (fore ? 0.6 : -0.4) + dx, ground - l];
    } else foot = [hipx + (fore ? 0.6 : -0.4) + (dead ? (fore ? 1 : -1) : 0), ground];
    up = Math.max(up, ground - foot[1]);
    const tgt = [foot[0] + (fore ? up * 0.25 : 0.2), foot[1] - 4.3];
    const l1 = fore ? 6.4 : 6.8;
    const knee = ik(hip, tgt, l1, 5.6, fore ? 1 : -1);
    const d = Math.hypot(tgt[0] - knee[0], tgt[1] - knee[1]) || 1;
    const ank = [knee[0] + ((tgt[0] - knee[0]) / d) * 5.6, knee[1] + ((tgt[1] - knee[1]) / d) * 5.6];
    const [fx, fy] = [ank[0] - (fore ? up * 0.25 : 0.2), ank[1] + 4.3];
    const coat = near ? COAT : COAT_FAR;
    const o = [...stroke([hip, knee], fore ? 3.6 : 3.9, coat, false), E(knee[0], knee[1], 1.6, 1.6, coat), ...stroke([knee, ank], 2.7, coat, false)];
    if (near) o.push(...stroke([[hip[0] - 1.4, hip[1] + 1], [knee[0] - 1.1, knee[1]]], 0.8, COAT_SH));
    o.push(T([[fx - 1.7, fy - 2.3], [fx + 1.8, fy - 2.3], [fx + 2.2, fy], [fx - 2, fy]], near ? HOOF : shade(HOOF, -8)), F(T([[fx - 1.1, fy - 2], [fx + 0.1, fy - 2], [fx - 0.3, fy - 0.6], [fx - 1.4, fy - 0.6]], '#fff1c8')));
    o.push(...puffs([[fx - 1.5, fy - 3.2, 1.9], [fx + 1.6, fy - 3.3, 1.8], [fx, fy - 4.6, 2.1]], near ? CLOUD : '#e8eefc', { line: near ? '#a9b8de' : '#9aa6cf' }));
    return o;
  };
  // In the attack the hind hooves stay planted under the rearing body; the forelegs kick and stamp.
  const hind = (hipx, hipy, p, near) => leg(hipx, hipy, p, false, near, ak ? [hipx - 1.2 + (near ? 0 : 1.4), ground] : null);
  const foreLeg = (hipx, hipy, p, near) => leg(hipx, hipy, p, true, near, ak ? ap(root, hipx + ak.fore[0] + (near ? 0 : -1.2), ak.fore[1] - (near ? 0 : 0.8) - (f === 0 || f === 3 ? bob : 0)) : null);
  out.push(...foreLeg(34.5, 31, u + 0.5, false), ...hind(19.5, 31.5, u, false));

  // Body: rump, barrel, chest, a soft lavender belly, and star dapples.
  out.push(...B([F(E(16.4, 28.4, 7.9, 7.6, lineOf(COAT))), E(16.4, 28.4, 7.4, 7.1 + breathe * 0.4, COAT), E(25, 29.6, 11.5, 7.2 + breathe, COAT), E(33.2, 28, 6.4, 7, COAT),
    F(E(25.5, 35.2, 8.6, 1.6, COAT_SH)), F(E(15.5, 33.6, 4.5, 1.3, COAT_SH)), F(E(23, 24.4, 7, 1.3, '#ffffff')), F(E(14.5, 23.6, 3.2, 1.1, '#ffffff')),
    ...sparkle(14.2, 28.4, 1.9, '#ffd6ea', '#fff2f8'), ...sparkle(18.4, 31.6, 1.3, '#d9cfff', '#f4f0ff'), ...sparkle(11.6, 31.8, 1, '#c8e4ff', '#f0f8ff')]));
  out.push(...foreLeg(30.8, 32, u, true), ...hind(16.5, 32.5, u + 0.5, true));

  // Neck, bridging the body and the head.
  out.push(...Rt([T([[28.6, 22.5 + bob], [33 + hx, 11 + hy], [40 + hx, 12 + hy], [38.6, 27 + bob], [33, 30 + bob]], COAT), F(E(36 + hx * 0.5, 22 + (bob + hy) / 2, 2.4, 4.6, COAT_SH))]));
  // Mane down the neck crest: a chain from the poll to the withers, streaming back and rippling.
  const maneLine = [[36.2, 5.6, 3.7], [33.4, 8.2, 3.7], [31.2, 11.6, 3.5], [29.5, 15.2, 3.3], [28, 18.7, 3], [26.8, 21.8, 2.6]];
  const mane = maneLine.map(([x, y, r], i) => {
    const t = i / 5;
    const wv = walk ? -(0.5 + 0.7 * Math.sin(a * 2 - i * 0.9)) * (0.3 + t) : ak ? -[0, 1.2, 0.8, 0.3][f] * (0.3 + t) : -Math.sin(a - i * 0.8) * 0.4 * t;
    return [x + lerp(hx, 0, t) + wv - (angry ? 0.6 * (1 - t) : 0), y + lerp(hy, bob, t) - (angry ? 0.8 : 0), r, MANE[(5 - i) % 3]];
  }).reverse();
  out.push(...Rt(puffs(mane, MANE[0])));
  out.push(...B([...stroke([[30, 24.6 + (hy - bob) * 0.3], [34.2, 26.4], [38.6, 25.6]], 1.5, '#9fd4ff'), ...stroke([[30.2, 24.1 + (hy - bob) * 0.3], [34.2, 25.9], [38.4, 25.1]], 0.4, '#d6efff')]),
    ...B(shift(sparkle(35.2, 28.2, 1.9, '#ffd66b', '#fff4c0'), walk ? Math.sin(2 * a - 1.4) * 0.4 : 0, walk ? Math.abs(Math.cos(a - 0.7)) * 0.4 : 0)));
  // Near wing, in front of the body.
  out.push(...B(wing({ x: 27.5, y: 23, ang: wa, ps, ...wingCol })));

  // Head: ears flick and pin back with mood.
  let earTip = [33.2, 1.4];
  if (angry || ak) earTip = [30.2, 4.6];
  if (happy) earTip = [33.8, 0.8];
  if (dead) earTip = [29.6, 8.4];
  if (hurt) earTip = [31, 3];
  if (!walk && !ak && f === 3 && !angry && !dead && !hurt) earTip = [31.6, 2.6];
  const farTip = [earTip[0] + 10.6 + (angry || dead || ak ? -1.5 : 0), earTip[1] - 0.3];
  const head = [T([[40.5, 7.5], farTip, [44.6, 8.6]], COAT_FAR), F(T([[41.4, 7.6], [farTip[0] - 0.1, farTip[1] + 2], [43.6, 8.2]], '#f4c6d8'))];
  head.push(F(E(40, 14, 8.65, 8.05, lineOf(COAT))), E(40, 14, 8.2, 7.6, COAT), E(41.2, 17.6, 7, 5.4, COAT), F(E(46.2, 20.1, 5.85, 4.65, lineOf(COAT))), E(46.2, 20.1, 5.4, 4.2, COAT),
    F(E(47.4, 21.1, 3.7, 2.8, '#ffe2ec')), F(E(49.7, 19.8, 0.75 + (angry || ak ? 0.25 : 0), 0.55, '#e295b1')), F(E(37.4, 9.6, 3.6, 1.3, '#ffffff')), F(E(45, 17.4, 2, 0.8, '#ffffff')), F(E(37.6, 19.4, 3.2, 1.2, COAT_SH)));
  head.push(T([[34.2, 9.2], earTip, [38.8, 6.6]], COAT), F(T([[35.1, 8.2], [earTip[0] + 0.7, earTip[1] + 2], [37.6, 6.9]], '#ffcade')));
  // Forelock, a curl, and a gold star clip.
  head.push(...puffs([[37.6, 6.6, 3.2, MANE[1]], [41, 5.8, 3, MANE[0]], [44, 7.6, 2.4, MANE[2]]], MANE[0]),
    ...feather(41.6, 7.4, 78 + (walk ? Math.sin(2 * a - 1) * 10 : Math.sin(a) * 4), 5.4, 2.6, MANE[0], { shaft: false, cast: true }),
    ...sparkle(36.4, 5.4, 1.7, '#ffd66b', '#fff4c0'));
  // One big gentle eye on the side of the head (the kit's eye: violet iris against the pink mane,
  // plum lashes), and a small mouth on the muzzle.
  const em = ak && mood === 'idle' ? 'angry' : mood;
  const lashC = '#5a3a72';
  const act = { angry: { lid: 0.32, slant: 0.7, pupilK: 0.7 }, happy: { closed: 'happy' }, blink: { closed: 'blink' }, hurt: { closed: 'squeeze' } }[em] ?? {};
  if (dead) head.push(...deadEye(42.2, 14, 1.8, { c: lashC }));
  else head.push(...eye(42.2, 13.8, { s: 1, shape: 'round', w: 2.3, h: 2.7, iris: ['#3b2a7a', '#6a4fc0', '#c2b0ff'], lashC, flicks: 2, look: [look, 0], ...act }));
  if (!dead) head.push(F(E(40.6, 18.4, 1.8, 0.8, BLUSH)));
  const mo = { ink: MUZ, s: 1 };
  if (ak && f === 1 && !dead) head.push(...mouth(47.8, 22.8, { ...mo, type: 'shout', w: 1.1, h: 1.6, open: 1 }));
  else if (em === 'angry') head.push(...mouth(47.6, 22.6, { ...mo, type: 'snarl', w: 1.1, h: 1, open: 0.7, teeth: 'gritted', tongue: false }));
  else if (hurt) head.push(...mouth(47.6, 22.8, { ...mo, type: 'o', w: 0.7, h: 0.9, open: 1 }));
  else if (happy) head.push(...mouth(47.6, 22.4, { ...mo, type: 'grin', w: 1.1, h: 1.2, open: 1, teeth: 'none' }));
  else if (dead) head.push(...mouth(47.6, 22.6, { ...mo, type: 'wavy', w: 1, amp: 0.2 }));
  else head.push(...mouth(47.6, 22.4, { ...mo, type: 'cat', w: 0.9, curve: 0.4 }));
  if (angry || (ak && f > 0)) head.push(...puffs([[52.2, 20.8, 0.9], [53.1, 22.4, 0.7]], '#ffffff', { hi: null }));
  out.push(...put(headF, head));
  if (ak && f === 2 && !dead) {
    const [bx, by] = ap(root, 30.8 + ak.fore[0], ak.fore[1]);
    out.push(...burst(bx + 2.4, Math.min(by, 44), 3.4, '#fff3b0', '#ffffff', 7, 0.2), ...puffs([[bx - 3, 45, 1.6], [bx + 5.6, 45, 1.4]], '#ffffff', { hi: null }));
  }
  if (ak && f === 1 && !dead) out.push(...streaks([[48, 30, 51.6, 27.6], [47.4, 34, 51.4, 33]], '#e0ecff', 0.6));
  return { w: 54, h: 46, res: 3, shapes: out };
}

// ---------- Harpy ----------
// Strong, deep wingbeats: the body surges up on each downstroke and sags on the recovery, the
// crest, hair, and tail streaming a beat behind. It attacks by rising, then diving talons-first.

const PLUME = '#8fd0ff';
const PLUME_D = '#6cb8f2';
const PLUME_L = '#c4e9ff';
const SKIN = '#ffe8da';
const LEGC = '#ffc887';
const CLAW = '#6a5a86';
const CREST = ['#ff9ec0', '#ffd66b', '#ffb3d1'];

const HARPY_ATK = [
  { ang: -96, ps: 15, bob: -0.6, rot: -0.14, dx: -1.6, feet: [-1.2, -3.6], spread: 0.7 },
  { ang: 166, ps: 6, bob: -0.6, rot: 0.32, dx: 1.6, feet: [5.4, -2.6], spread: 1.6 },
  { ang: 178, ps: 7, bob: -0.2, rot: 0.24, dx: 2.4, feet: [6.4, -1.6], spread: 1.7 },
  { ang: -124, ps: 13, bob: 0.4, rot: 0.06, dx: 0.8, feet: [1.6, -0.6], spread: 1.1 },
];

function harpy(pose, f, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? HARPY_ATK[f] : null;
  const u = ak ? f / 4 : f / (walk ? 8 : 6);
  const a = ak ? f * 1.3 : u * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // A full stroke: a fast downstroke from high (-108) past the body (-204), then a slow recovery
  // (Saint11 "Wings"); the feathers close on the way down and spread on the way up. The body
  // surges up a beat after each downstroke and sags through the recovery.
  const bt = beat(u);
  let ang = ak ? ak.ang : walk ? lerp(-108, -204, bt) : lerp(-122, -140, bt);
  let ps = ak ? ak.ps : walk ? lerp(15, 7.6, bt) : lerp(11.3, 10.3, bt);
  let bob = ak ? ak.bob : walk ? 0.8 - 1.8 * beat(u - 0.1) : 0.4 - 0.8 * beat(u - 0.1);
  if (angry && !ak) [ang, ps] = [ang + 8, ps + 2];
  if (hurt) [ang, ps] = [-100, 16];
  if (dead) [ang, ps, bob] = [128, 6, 0.6];
  // The head lags the body a little.
  let hx = 0;
  let hy = (ak ? bob : walk ? 0.8 - 1.8 * beat(u - 0.2) : 0.4 - 0.8 * beat(u - 0.2)) - bob + bob * 0.7 + (walk ? 0.25 : 0);
  if (hurt) [hx, hy] = [-1.3, hy - 0.6];
  if (dead) [hx, hy] = [0.4, hy + 1.6];
  const lagA = a - 1.1;
  const look = walk ? 0.5 : ak ? 0.7 : Math.sin(a) * 0.9;
  const B = (shapes) => shift(shapes, 0, bob);
  const Hd = (shapes) => shift(shapes, hx, hy);
  const out = [];

  // Tail fan, swinging a beat behind the strokes.
  const tsw = Math.sin(lagA) * (walk ? 7 : 3) + (dead ? 20 : 0) + (ak ? [10, -12, -10, -2][f] : 0);
  const tail = [];
  [[200, 8.6, PLUME_D], [186, 10.6, PLUME], [172, 11.2, PLUME_D], [160, 9.6, PLUME]].forEach(([d, len, c]) => tail.push(...feather(22.5, 30, d + tsw * (len / 11), len, 3.5, c, { tip: '#ffffff', vane: shade(c, -6) })));
  tail.push(...feather(22.5, 30.5, 180 + tsw, 7, 2.2, CREST[0], { tip: '#ffffff', shaft: false }));
  out.push(...B(tail));

  // Far wing, a touch behind the near one.
  const wingOpts = { n: 6, sec: 4, arm: 7, plen: 11.6, pw: 3.4, slen: 8.2, sw: 3.2 };
  out.push(...B(wing({ x: 30.6, y: 21.6, ang: ang + 9 + (walk ? 96 * (bt - beat(u - 0.05)) : 0), ps, k: 1.12, col: '#dce8f6', tip: PLUME_D, tipAt: 0.72, cov: '#cfe0f4', bone: PLUME_D, vane: '#cfdcef', ...wingOpts })));

  // Legs and talons: dangling and swinging after the strokes, tucked or thrust out in the dive.
  const leg = (x, near) => {
    const sw = (walk ? -Math.cos(lagA) * 1.4 : Math.sin(a) * 0.4) + (dead ? -1.5 : 0);
    const kx = x + sw * 0.3;
    let fx = x + 0.8 + sw;
    let fy = 40.2 - (walk ? Math.max(0, Math.cos(lagA)) * 0.8 : 0);
    if (ak) [fx, fy] = [x + 0.8 + ak.feet[0] + (near ? 0.8 : 0), 40.2 + ak.feet[1]];
    const c = near ? LEGC : shade(LEGC, -10);
    const o = [...stroke([[kx, 33.5], [fx, fy]], 1.7, c, false)];
    for (const y of [36, 37.6]) {
      const u = (y - 33.5) / Math.max(1, fy - 33.5);
      if (u < 0.95) o.push(...stroke([[lerp(kx, fx, u) - 0.8, lerp(33.5, fy, u)], [lerp(kx, fx, u) + 0.8, lerp(33.5, fy, u) + 0.2]], 0.3, shade(c, -18)));
    }
    const spread = ak ? ak.spread : angry ? 1.4 : dead ? 0.5 : 1;
    const toes = [[-1.9 * spread, 1.4], [0.9, 2.1], [2.6 * spread, 1.2], [-0.6, -0.3]];
    for (const [tx, ty] of toes) {
      const ex = fx + tx;
      const ey = fy + ty;
      o.push(...stroke([[fx, fy], [ex, ey]], 1.1, c, false), T([[ex - 0.5, ey - 0.3], [ex + 0.5, ey - 0.3], [ex + 0.35 * Math.sign(tx || 1), ey + 1.1]], CLAW));
    }
    return o;
  };
  out.push(...B(leg(29.5, false)));

  // Back hair: feather locks trailing behind the head.
  const lag = walk ? Math.sin(a - 1.3) * 5 : ak ? [-6, 8, 6, 2][f] : Math.sin(a - 0.6) * 2;
  const back = [F(E(28.4, 14, 9, 8.4, lineOf(PLUME_D))), E(28.4, 14, 8.5, 7.9, PLUME_D)];
  [[22, 13.5, 158, 7.6], [21.6, 17, 130, 8.4], [23.6, 19.6, 108, 7.4], [26.4, 21, 96, 5.6]].forEach(([x, y, d, len], i) =>
    back.push(...feather(x, y, d + lag * (1 - i * 0.2) + (dead ? 12 : 0), len, 3.8, i % 2 ? PLUME : PLUME_D, { tip: i % 2 ? '#ffffff' : PLUME_L })));
  out.push(...Hd(back));

  // Body: plumed torso, a fluffy feather skirt, and a white ruff.
  const body = [F(E(27, 27, 6.1, 6.5, lineOf(PLUME))), E(27, 27, 5.6, 6, PLUME)];
  [[21.8, 29.6, 116], [24.2, 30.4, 104], [27, 30.8, 92], [29.8, 30.4, 80], [32.2, 29.4, 68]].forEach(([x, y, d], i) =>
    body.push(...feather(x, y, d + (walk ? Math.sin(lagA + i * 0.6) * 4 : Math.sin(a + i) * 1.5), 6.4 - Math.abs(i - 2) * 0.5, 3.6, i % 2 ? PLUME_D : PLUME, { tip: '#ffffff', shaft: false })));
  out.push(...B(body), ...B(leg(25.2, true)));
  out.push(...B([...puffs([[25.6, 24.2, 2.5], [28.4, 28.4, 2.6], [30.8, 25.8, 2.7], [28.6, 22.8, 3]], '#ffffff', { line: '#a8c4e6' }),
    ...stroke([[25.8, 21.6], [29, 24.2], [32, 21.8]], 0.45, '#ffd66b'), F(T([[29, 23.6], [30.2, 25.1], [29, 26.8], [27.8, 25.1]], '#ffd66b')), F(T([[29, 24.2], [29.7, 25.1], [29, 26.1], [28.3, 25.1]], '#ff8fb8'))]));

  // Near wing-arm, with a little hand at the wrist.
  const hand = (x, y) => [E(x + 0.4, y + 0.6, 1.3, 1.1, SKIN), ...stroke([[x + 0.6, y + 1.2], [x + 1.4, y + 2]], 0.7, SKIN, false), ...stroke([[x - 0.3, y + 1.3], [x - 0.2, y + 2.3]], 0.7, SKIN, false)];
  out.push(...B(wing({ x: 24.8, y: 23.2, ang, ps, col: '#f8fcff', tip: PLUME, tipAt: 0.72, cov: '#e6f4ff', bone: PLUME, vane: '#e4effa', hand, k: 1.25, ...wingOpts })));
  // Head.
  const head = [E(29.6, 20.6, 1.8, 2.2, SKIN), F(E(32.6, 16.2, 7.05, 6.65, lineOf(SKIN))), E(32.6, 16.2, 6.6, 6.2, SKIN), E(33.4, 18.4, 5.4, 3.6, SKIN)];
  // Crest plumes, streaming behind.
  const cr = angry || ak ? 14 : happy ? 8 : hurt ? -18 : dead ? -40 : 0;
  const csw = walk ? Math.sin(a - 1.6) * 9 : ak ? [8, -16, -12, -4][f] : Math.sin(a - 0.8) * 4;
  const crest = [];
  [[-160, 7, CREST[2]], [-130, 8.6, CREST[1]], [-104, 8, CREST[0]]].forEach(([d, len, c], i) =>
    crest.push(...feather(27.2 + i * 0.9, 8.4 - i * 0.2, d + cr + csw * (0.6 + i * 0.2), len, 2.7, c, { tip: '#ffffff', tipAt: 0.7 })));
  head.unshift(...crest);
  // Hair cap and feather bangs.
  head.push(F(E(29.8, 11, 8.6, 5.8, lineOf(PLUME))), E(29.8, 11, 8.1, 5.3, PLUME), E(24.8, 14.4, 3.8, 5, PLUME));
  [[25.2, 12, 98, 7.2, PLUME_D], [28.8, 8.4, 92, 5, PLUME], [31.8, 8, 76, 5.2, PLUME], [34.8, 8.6, 60, 4.8, PLUME], [37.4, 10.2, 48, 3.6, PLUME]].forEach(([x, y, d, len, c], i) =>
    head.push(...feather(x, y, d + (walk ? Math.sin(lagA - i * 0.3) * 3 : 0), len, 3.7, c, { cast: true, shaft: false, line: mix(c, lineOf(c), 0.7) })));
  // One highlight band across the crown, its lower edge V-notched between the feather clumps.
  head.push(F(T([[24.6, 10.4], [26.8, 7.8], [30, 6.5], [33.6, 6.7], [36.4, 8.3], [35.6, 9.5], [34.2, 8.7], [32.8, 9.6], [31.2, 8.4], [29.6, 9.3], [28, 8.8], [26.8, 10.2], [25.4, 11.2]], PLUME_L)), F(T([[27.6, 8.4], [30, 7.2], [32.6, 7.3], [30.2, 7.9]], '#f2fbff')));
  head.push(...feather(24.6, 15, 130 + lag * 0.5, 5, 2.4, '#ffffff', { tip: CREST[0], shaft: false }), F(E(24.8, 14.4, 1.5, 1.5, '#ffd66b')), F(E(24.8, 14.4, 0.8, 0.8, '#5ec8e8')));
  // Sharp raptor eyes (the kit's eye: gold iris against the blue plumes, navy lashes) under a
  // stern feathered brow; the near eye is the larger.
  const em = ak && mood === 'idle' ? 'angry' : mood;
  const lashC = '#24406e';
  const act = { angry: { lid: 0.3, slant: 0.85, raise: 0.2, pupilK: 0.6 }, happy: { closed: 'happy' }, blink: { closed: 'blink' }, hurt: { closed: 'squeeze' } }[em] ?? {};
  const eo = { shape: 'sharp', iris: ['#a2580e', '#ffbb2e', '#ffe9a0'], lashC, look: [look, 0], flicks: 1, ...act };
  if (dead) head.push(...deadEye(32.4, 17, 1.4, { c: lashC }), ...deadEye(37.8, 16.6, 1.1, { c: lashC }));
  else head.push(...eye(32.4, 16.9, { ...eo, s: -1, w: 2.1, h: 2.2 }), ...eye(37.8, 16.5, { ...eo, s: 1, w: 1.6, h: 1.9 }));
  const bl = em === 'angry' ? 1 : hurt ? -0.8 : happy ? -0.4 : 0;
  if (!dead) head.push(...stroke([[30, 14 - bl * 0.2], [32.4, 13.6 + bl * 0.2], [34.2, 14 + bl * 0.8]], 0.8, PLUME_D), ...stroke([[36.6, 14 + bl * 0.6], [38.2, 13.6], [39.4, 14 - bl * 0.3]], 0.67, PLUME_D));
  if (!dead) head.push(F(E(31, 20.2, 1.5, 0.7, BLUSH)), F(E(38, 19.8, 0.9, 0.55, BLUSH)));
  const mo = { ink: MUZ, s: 1 };
  if (ak && f > 0 && !dead) head.push(...mouth(35.4, 21.2, { ...mo, type: 'shout', w: 1.2, h: 1.7, open: 1, fangs: 0 }));
  else if (em === 'angry') head.push(...mouth(35.4, 21, { ...mo, type: 'snarl', w: 1.2, h: 1, open: 0.7, fangs: 2, tongue: false }));
  else if (hurt) head.push(...mouth(35.4, 21.2, { ...mo, type: 'pained', w: 1, h: 1, open: 1 }));
  else if (happy) head.push(...mouth(35.4, 20.8, { ...mo, type: 'grin', w: 1.2, h: 1.3, open: 1, teeth: 'none' }));
  else if (dead) head.push(...mouth(35.4, 21, { ...mo, type: 'wavy', w: 1, amp: 0.2 }));
  else head.push(...mouth(35.4, 20.8, { ...mo, type: 'smirk', w: 1, curve: 0.35 }));
  out.push(...Hd(head));

  let shapes = out;
  if (ak) {
    shapes = put(pivot(move(ID, ak.dx, 0), 28, 26, ak.rot), shapes);
    if (!dead && f === 1) shapes.push(...streaks([[6, 12, 14, 17], [4, 20, 12, 23], [8, 27, 16, 29]], '#e0f0ff', 0.7));
    if (!dead && f === 2) for (const k of [-2.2, 0, 2.2]) shapes.push(...stroke([[39 + k * 0.3, 31 + k], [44 + k * 0.2, 36.4 + k], [45.4, 42 + k * 0.4]], 0.7, '#ff9ec0'), ...stroke([[39.4 + k * 0.3, 31.8 + k], [43.8 + k * 0.2, 36.8 + k]], 0.3, '#ffffff'));
  }
  return { w: 52, h: 44, res: 3, shapes };
}

// ---------- Star Seraph ----------
// A slow, majestic hover: three pairs of wings ripple in long sweeps, the core turning and the
// stardust tail streaming. It casts by gathering light into its core and releasing a star burst.

const GOLD = '#ffe27a';
const GOLD_SH = '#e8a64e';
const GOLD_HI = '#fff8d2';
const STAR = '#ffe88f';
const STAR_IN = '#fff6c8';
const WING_TIPS = ['#ffe9a8', '#e4d8ff', '#cdeaff'];

const SERAPH_ATK = [
  { beat: -20, fan: 0.8, pulse: 1.12, orbit: 0.45, dx: -1.2, dy: -0.8 },
  { beat: 18, fan: 1.25, pulse: 0.94, orbit: 1.1, dx: 1, dy: 0.4 },
  { beat: 12, fan: 1.2, pulse: 1, orbit: 1.15, dx: 0.6, dy: 0.3 },
  { beat: 2, fan: 1.05, pulse: 1, orbit: 1, dx: 0.2, dy: 0 },
];

function seraph(pose, f, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? SERAPH_ATK[f] : null;
  const n = walk ? 8 : ak ? 4 : 6;
  const a = (f / n) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const cx = 25 + (ak ? ak.dx : 0);
  const cy = 26 + (ak ? ak.dy : walk ? Math.sin(a - 0.4) * 1.2 : Math.sin(a) * 0.5) + (dead ? 1.2 : 0);
  const fade = (c) => (dead ? mix(c, '#cfc6dc', 0.45) : angry || ak ? mix(c, '#ffb07a', 0.2) : c);
  const out = [];

  // Halo, behind everything, tilting a beat behind the hover.
  let hrot = walk ? Math.sin(a - 1) * 5 : Math.sin(a) * 2;
  let hdy = walk ? Math.sin(a - 1.2) * 0.5 : 0;
  if (hurt) hrot += 16;
  if (dead) [hrot, hdy] = [-24, 4];
  // Three tones of gold under one upper-front light: the base, a warm shadow on the back and
  // underside, and a pale shine on the upper front of the rim.
  const hcy = cy - 18.6 + hdy;
  out.push(F(ring(cx + 0.6, hcy, 9.3, 3.1, 2.4, hrot, lineOf(GOLD))), ring(cx + 0.6, hcy, 8.6, 2.6, 1.7, hrot, fade(GOLD)));
  out.push(F(ring(cx + 0.6, hcy, 8.6, 2.6, 1.7, hrot, fade(GOLD_SH), 70, 230)), F(ring(cx + 0.6, hcy, 8.5, 2.5, 0.8, hrot, fade(GOLD_HI), 280, 350)));
  if (!dead) {
    const ha = rad(hrot) + (f / n) * TAU;
    out.push(...sparkle(cx + 0.6 + 7.6 * Math.cos(ha), cy - 18.6 + hdy + 2.2 * Math.sin(ha), 1.6, '#ffffff', '#ffffff'));
  }

  // Sparks circling the core; the far half passes behind the wings. They gather in to cast.
  const orbit = ak ? ak.orbit : 1;
  const sparks = [];
  for (let i = 0; i < 4; i++) {
    const t = rad(i * 90 + (f / n) * 90 + 20);
    const sx = cx + Math.cos(t) * 21.5 * orbit;
    const sy = cy + 2 + (Math.sin(t) * 5.5 - Math.cos(t) * 2) * orbit;
    const front = Math.sin(t) > 0;
    sparks.push({ front, s: sparkle(sx, sy, front ? 2.4 : 1.7, fade(front ? '#fff1a6' : '#e8dcff')) });
  }
  if (!dead) for (const s of sparks) if (!s.front) out.push(...s.s);

  // Three pairs of wings, the long sweep rippling from the top pair down.
  const pairs = [
    { dx: 4.4, dy: -4.8, base: -50, amp: 14, n: 5, len: 15, w: 3.9, fan: 9, tip: WING_TIPS[0] },
    { dx: 6.2, dy: 0.2, base: 2, amp: 11, n: 5, len: 16, w: 3.9, fan: 8, tip: WING_TIPS[1] },
    { dx: 4.6, dy: 4.8, base: 54, amp: 9, n: 4, len: 11.5, w: 3.6, fan: 9, tip: WING_TIPS[2] },
  ];
  const wings = [];
  pairs.forEach((p, i) => {
    let beat = ak ? ak.beat * (1 - i * 0.15) : Math.sin(a - i * 0.8) * (walk ? p.amp : p.amp * 0.4);
    if (angry && !ak) beat -= 10;
    if (happy) beat -= 5;
    if (hurt) beat += 10 + i * 2;
    if (dead) beat = 26 - i * 6;
    const fan = p.fan * (ak ? ak.fan : walk ? 1 + 0.22 * Math.cos(a - i * 0.8) : 1 + 0.05 * Math.cos(a - i)) * (dead ? 0.6 : 1);
    for (const side of [-1, 1]) {
      const rx = cx + side * p.dx;
      const ry = cy + p.dy;
      const one = [];
      for (let j = p.n - 1; j >= 0; j--) {
        // Feathers fan from the leading edge down to the trailing edge; the tips lag the sweep.
        // A ripple runs from the leading edge to the trailing feathers, root to tip.
        const lagT = dead ? 0 : Math.sin(a - i * 0.8 - 0.9 - j * 0.45) * (j / p.n) * (walk ? 6 : ak ? 3 : 3.4);
        const d = p.base + beat + (j - (p.n - 1) * 0.35) * fan + lagT;
        const ang = side > 0 ? d : 180 - d;
        const len = p.len * (1 - Math.abs(j - 1) * 0.08);
        one.push(...feather(rx, ry, ang, len, p.w, fade('#ffffff'), { tip: fade(p.tip), vane: fade('#f0ecfb'), line: fade('#bcaedf') }));
      }
      for (let j = 0; j < 3; j++) {
        const d = p.base + beat + (j - 1) * fan * 0.9 - fan * 0.4;
        one.push(...feather(rx, ry, side > 0 ? d : 180 - d, p.len * 0.45, p.w * 1.1, fade('#fffaf0'), { shaft: false, line: fade('#c6b9e4'), tip: fade(mix(p.tip, '#ffffff', 0.5)) }));
      }
      wings.push(one);
    }
  });
  for (const i of [5, 4, 3, 2, 1, 0]) out.push(...wings[i]);

  // Stardust tail streaming below the core.
  const tw = walk ? Math.sin(a - 1.2) * 2.4 : ak ? [-1, 2, 1.6, 0.6][f] : Math.sin(a) * 1;
  const wisp = (wk, grow = 0) => {
    const L = [];
    const Rr = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = cx + Math.sin(t * 3 - a * (walk ? 1 : 0.6)) * (1 + tw * 0.7) * t * 1.8 - (walk ? t * t * 2 : 0);
      const y = cy + 4 + t * (20 + grow * 0.6 - (cy - 26) * 0.6);
      const w = (5.4 * Math.pow(1 - t, 0.85) * (1 + 0.12 * Math.sin(t * 15 - a)) + 0.25) * wk + grow * (1 - t);
      L.push([x - w, y]);
      Rr.push([x + w, y]);
    }
    return [...L, ...Rr.reverse()];
  };
  out.push(F(T(wisp(1, 0.5), lineOf(STAR))), T(wisp(1), fade(STAR)), F(T(wisp(0.5), fade(STAR_IN))), F(T(wisp(0.18), fade('#ffffff'))));
  if (!dead) {
    const u = (f / n) % 1;
    out.push(...sparkle(cx - 3.5 + tw, cy + 15 + u * 5, 1.2 - u * 0.4, '#fff6c8'), ...sparkle(cx + 4 + tw * 0.8, cy + 12 + ((u + 0.5) % 1) * 5, 0.9, '#ffffff'));
  }

  // The core: two turning eight-pointed stars around a glowing face.
  const spin = (f / n) * 45 + (hurt ? 10 : 0) + (ak ? f * 8 : 0);
  const star = (r1, r2, off, sq = 1) =>
    Array.from({ length: 16 }, (_, i) => {
      const t = rad(-90 + off + i * 22.5);
      const r = i % 2 ? r2 : r1;
      return [cx + Math.cos(t) * r, cy + Math.sin(t) * r * sq];
    });
  const pulse = ak ? ak.pulse : walk ? 1 + Math.sin(a * 2) * 0.04 : 1 + Math.sin(a) * 0.04;
  if (ak && f === 0 && !dead) out.push(F(T(star(16.4, 6, spin + 11), fade('#fff8d8'))));
  out.push(F(T(star(14 * pulse, 7.6, spin), lineOf(STAR))), T(star(13.3 * pulse, 7.2, spin), fade(STAR)));
  out.push(F(T(star(10.6, 7.4, 22.5 - spin * 1.5), lineOf(STAR_IN))), F(T(star(10, 7, 22.5 - spin * 1.5), fade('#fff0b0'))));
  out.push(F(E(cx, cy, 8.4, 8, lineOf(STAR_IN))), E(cx, cy, 7.9, 7.5, fade(STAR_IN)), F(E(cx - 2.4, cy - 4.4, 3.4, 1.4, '#ffffff')), F(E(cx + 3.8, cy + 4.6, 2.2, 0.9, fade('#ffe9a8'))));
  out.push(F(T([[cx + 0.8, cy - 6.6], [cx + 2, cy - 5.2], [cx + 0.8, cy - 3.8], [cx - 0.4, cy - 5.2]], fade('#ff9ec0'))), F(E(cx + 0.5, cy - 5.6, 0.35, 0.35, '#ffffff')));
  // Serene closed eyes that open on star pupils when it's roused or casting.
  const fx = cx + 0.8;
  const fy = cy + 0.4;
  const open = !!ak && f > 0;
  const em = ak && f === 0 && mood === 'angry' ? 'idle' : mood;
  // The kit's eyes: calm, they rest closed with long amber lashes; roused, they open on violet
  // irises with star pupils.
  const lashC = '#8a5228';
  const roused = open || em === 'angry';
  const so = dead ? null : roused
    ? { shape: 'round', iris: ['#4a2f9a', '#9a6cf0', '#e2d4ff'], pupil: 'star', pupilC: '#fff3b0', lashC, ...(em === 'angry' ? { lid: 0.25, slant: 0.7 } : {}) }
    : { closed: { happy: 'happy', hurt: 'squeeze', blink: 'blink' }[em] ?? 'sleep', lashC, flicks: 2 };
  if (dead) out.push(...deadEye(fx - 3, fy, 1.3, { c: lashC }), ...deadEye(fx + 3, fy, 1.3, { c: lashC }));
  else out.push(...eye(fx - 3, fy, { ...so, s: -1, w: 1.7, h: 1.9 }), ...eye(fx + 3, fy, { ...so, s: 1, w: 1.7, h: 1.9 }));
  if (!dead) out.push(F(E(fx - 4.4, fy + 2.6, 1.4, 0.7, BLUSH)), F(E(fx + 4.4, fy + 2.6, 1.4, 0.7, BLUSH)));
  const mo = { ink: MUZ };
  if (ak && f > 0 && f < 3 && !dead) out.push(...mouth(fx, fy + 3.6, { ...mo, type: 'o', w: 0.9, h: 1.2, open: 1 }));
  else if (em === 'angry') out.push(...mouth(fx, fy + 3.4, { ...mo, type: 'frown', w: 1.1 }));
  else if (hurt) out.push(...mouth(fx, fy + 3.4, { ...mo, type: 'pained', w: 1, h: 1, open: 1 }));
  else if (happy) out.push(...mouth(fx, fy + 3.2, { ...mo, type: 'grin', w: 1.2, h: 1.2, open: 1, teeth: 'none' }));
  else if (dead) out.push(...mouth(fx, fy + 3.4, { ...mo, type: 'wavy', w: 1, amp: 0.2 }));
  else out.push(...mouth(fx, fy + 3.2, { ...mo, type: 'smile', w: 1, curve: 0.45 }));
  if (!dead) for (const s of sparks) if (s.front) out.push(...s.s);
  if (angry && !ak) out.push(...sparkle(cx + 11, cy - 11, 2.2, '#ff9a6b', '#fff0c0'));

  // The cast: light drawn in, then a star burst flung forward, then its shards.
  if (ak && !dead) {
    if (f === 0) {
      for (let i = 0; i < 6; i++) {
        const t = (i / 6) * TAU + 0.3;
        out.push(...stroke([[cx + Math.cos(t) * 19, cy + Math.sin(t) * 17], [cx + Math.cos(t) * 14, cy + Math.sin(t) * 12.5]], 0.6, '#fff3b0'));
      }
    } else if (f === 1) {
      out.push(...streaks([[cx + 8, cy - 1, 40, cy - 2], [cx + 8, cy + 2, 39, cy + 4]], '#fff3b0', 0.9), ...burst(42.6, cy - 1, 6.4, '#ffe27a', '#ffffff', 8, 0.2), ...sparkle(42.6, cy - 1, 3.6, '#ffffff', '#ffffff'));
    } else if (f === 2) {
      out.push(F(ring(42, cy - 1, 6.6, 6.6, 1.1, 0, '#fff3b0')), ...burst(42, cy - 1, 4.4, '#fff6c8', '#ffffff', 6, 0.6));
      for (const [x, y, r] of [[47, cy - 9, 1.8], [46.6, cy + 7, 1.6], [36.6, cy - 9.6, 1.3], [37.6, cy + 8.6, 1.2]]) out.push(...sparkle(x, y, r, '#ffe27a', '#ffffff'));
    } else {
      for (const [x, y, r] of [[47.6, cy - 11, 1.2], [47, cy + 9, 1.1], [42.4, cy - 2, 1.4], [38.4, cy - 12, 0.9]]) out.push(...sparkle(x, y, r, '#fff1a6', '#ffffff'));
    }
  }
  return { w: 50, h: 52, res: 3, shapes: out };
}

// Each design keeps its own cadence: `stride` is how far it travels in one walk or wingbeat cycle.
export const ART = {
  cloudsheep: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [60, 250, 180], draw: pegasus },
  windbird: { walk: 8, idle: 6, attack: 4, stride: 45, atkMs: [45, 200, 140], draw: harpy },
  starspirit: { walk: 8, idle: 6, attack: 4, stride: 60, atkMs: [60, 240, 180], draw: seraph },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  cloudsheep: { name: 'Pegasus Foal', w: 40, h: 32 },
  windbird: { name: 'Sky Harpy', w: 36, h: 30 },
  starspirit: { name: 'Star Seraph', w: 34, h: 36 },
};
