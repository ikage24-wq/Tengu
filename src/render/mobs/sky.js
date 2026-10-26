// Monster art: sky. The Sky Garden's heavenly creatures:
//   cloudsheep  Pegasus Foal: a cream foal with a cotton-candy mane, cloud-puff fetlocks, and
//               feathered wings that beat as it trots.
//   windbird    Harpy: a bird-girl with feathered wing-arms, a plume crest, and dangling talons.
//   starspirit  Star Seraph: a turning star core with a serene face, three pairs of wings, a
//               halo, and star sparks circling it.
// Everything is built from feathers and puffs that carry their own thin inner line, so layered
// parts stay readable inside the automatic silhouette outline.

import { E, T, F, C, shade, mix, stroke, INK, BLUSH, MOUTH } from './kit.js';

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
function wing({ x, y, ang, ps, k = 1, col, tip, cov, vane, bone = col, hand, n = 5, sec = 4, arm = 6.5, plen = 11, pw = 3.3, slen = 8, sw = 3 }) {
  const [dx, dy] = dirOf(ang);
  const wx = x + dx * arm * k;
  const wy = y + dy * arm * k;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = ang + 4 - i * ps;
    const back = i * 0.55 * k;
    out.push(...feather(wx - dx * back, wy - dy * back, a, plen * k * (1 - i * 0.07), pw * k, col, { tip, vane }));
  }
  const sa = ang + 4 - n * ps;
  for (let j = 0; j < sec; j++) {
    const t = 1 - (j + 0.7) / (sec + 0.3);
    out.push(...feather(lerp(x, wx, t), lerp(y, wy, t), sa - 6 - j * 7, slen * k * (1 - j * 0.06), sw * k, col, { tip, vane }));
  }
  for (let j = 0; j < 4; j++) {
    const t = 0.95 - j * 0.27;
    out.push(...feather(lerp(x, wx, t), lerp(y, wy, t), sa + 10 - j * 6, slen * 0.52 * k, sw * 0.95 * k, cov, { shaft: false }));
  }
  out.push(...stroke([[x, y], [wx, wy]], 2.3 * k, bone, false), E(wx, wy, 1.35 * k, 1.35 * k, bone), E(x, y, 1.8 * k, 1.8 * k, bone));
  // Little marginal coverts along the leading edge.
  for (let j = 0; j < 3; j++) {
    const t = 0.2 + j * 0.3;
    out.push(...feather(lerp(x, wx, t), lerp(y, wy, t), ang - 120, 2.4 * k, 2 * k, cov, { shaft: false }));
  }
  if (hand) out.push(...hand(wx, wy));
  return out;
}

// A four-pointed sparkle.
function sparkle(x, y, r, c, core = '#ffffff') {
  const q = r * 0.3;
  return [F(T([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c)), F(E(x, y, q * 0.9, q * 0.9, core))];
}

// A tilted ring (halo).
function ring(cx, cy, rx, ry, th, rot, c) {
  const pts = (a, b) => Array.from({ length: 25 }, (_, i) => {
    const t = (i / 24) * TAU;
    const px = Math.cos(t) * a;
    const py = Math.sin(t) * b;
    const r = rad(rot);
    return [cx + px * Math.cos(r) - py * Math.sin(r), cy + px * Math.sin(r) + py * Math.cos(r)];
  });
  return T([...pts(rx, ry), ...pts(rx - th, Math.max(0.4, ry - th * 0.7)).reverse()], c);
}

// Expressive eyes. `inner` points toward the middle of the face (for brows and >< eyes), `lid` is
// the skin color the angry lid is drawn in, `look` glances the iris sideways.
function eye(x, y, s, mood, { iris = '#8a7cf0', inner = 1, lid = '#ffffff', look = 0, lash = true, ink = INK } = {}) {
  const o = -inner;
  const out = [];
  switch (mood) {
    case 'blink':
      out.push(...stroke([[x - s, y + 0.1 * s], [x - 0.45 * s, y + 0.5 * s], [x + 0.45 * s, y + 0.5 * s], [x + s, y + 0.1 * s]], 0.42 * s, ink));
      if (lash) out.push(...stroke([[x + o * s, y + 0.1 * s], [x + o * 1.5 * s, y - 0.25 * s]], 0.32 * s, ink));
      return out;
    case 'happy':
      out.push(...stroke([[x - 1.05 * s, y + 0.5 * s], [x - 0.6 * s, y - 0.25 * s], [x, y - 0.55 * s], [x + 0.6 * s, y - 0.25 * s], [x + 1.05 * s, y + 0.5 * s]], 0.46 * s, ink));
      return out;
    case 'hurt':
      out.push(...stroke([[x + o * 0.85 * s, y - 0.95 * s], [x + inner * 0.75 * s, y], [x + o * 0.85 * s, y + 0.95 * s]], 0.46 * s, ink));
      return out;
    case 'dead':
      out.push(...stroke([[x - 0.8 * s, y - 0.8 * s], [x + 0.8 * s, y + 0.8 * s]], 0.42 * s, ink), ...stroke([[x - 0.8 * s, y + 0.8 * s], [x + 0.8 * s, y - 0.8 * s]], 0.42 * s, ink));
      return out;
    default: {
      const lx = look * 0.24 * s;
      out.push(F(E(x, y, 1.02 * s, 1.32 * s, ink)), F(E(x + lx, y + 0.24 * s, 0.76 * s, 0.94 * s, iris)),
        F(E(x + lx, y + 0.12 * s, 0.4 * s, 0.56 * s, shade(iris, -30))), F(E(x + lx, y + 0.8 * s, 0.5 * s, 0.26 * s, mix(iris, '#ffffff', 0.55))),
        F(E(x - 0.32 * s + lx, y - 0.46 * s, 0.38 * s, 0.44 * s, '#ffffff')), F(E(x + 0.38 * s + lx, y + 0.44 * s, 0.16 * s, 0.16 * s, '#ffffff')));
      if (lash) out.push(...stroke([[x + o * 0.85 * s, y - 0.8 * s], [x + o * 1.45 * s, y - 1.2 * s]], 0.3 * s, ink));
      if (mood === 'angry') {
        out.push(F(T([[x + o * 1.25 * s, y - 1.8 * s], [x + inner * 1.25 * s, y - 1.8 * s], [x + inner * 1.25 * s, y - 0.05 * s], [x + o * 1.25 * s, y - 0.95 * s]], lid)),
          ...stroke([[x + o * 1.05 * s, y - 0.9 * s], [x + inner * 1.05 * s, y - 0.12 * s]], 0.4 * s, ink),
          ...stroke([[x + o * 1.3 * s, y - 2 * s], [x + inner * 1.15 * s, y - 1.1 * s]], 0.5 * s, ink));
      }
    }
  }
  return out;
}

function mouth(x, y, k, mood, ink = INK) {
  switch (mood) {
    case 'angry':
      return [F(T([[x - 1 * k, y - 0.1 * k], [x + 1 * k, y - 0.35 * k], [x + 0.7 * k, y + 0.75 * k], [x - 0.6 * k, y + 0.7 * k]], MOUTH)), F(T([[x + 0.15 * k, y - 0.2 * k], [x + 0.8 * k, y - 0.3 * k], [x + 0.5 * k, y + 0.45 * k]], '#ffffff'))];
    case 'hurt':
      return [F(E(x, y + 0.3 * k, 0.5 * k, 0.65 * k, MOUTH))];
    case 'dead':
      return stroke([[x - 0.9 * k, y + 0.3 * k], [x - 0.3 * k, y], [x + 0.3 * k, y + 0.3 * k], [x + 0.9 * k, y]], 0.35 * k, ink);
    case 'happy':
      return [F(T([[x - 1 * k, y - 0.1 * k], [x + 1 * k, y - 0.1 * k], [x + 0.45 * k, y + 0.85 * k], [x - 0.45 * k, y + 0.85 * k]], MOUTH)), F(E(x, y + 0.6 * k, 0.4 * k, 0.22 * k, '#ff94ae'))];
    default:
      return stroke([[x - 0.8 * k, y], [x - 0.4 * k, y + 0.42 * k], [x, y + 0.1 * k], [x + 0.4 * k, y + 0.42 * k], [x + 0.8 * k, y]], 0.3 * k, ink);
  }
}

// ---------- Pegasus Foal ----------

const COAT = '#fff6ee';
const COAT_FAR = '#ece2f6';
const COAT_SH = '#efe4f8';
const MANE = ['#ffc4de', '#e2caff', '#c0e2ff'];
const CLOUD = '#ffffff';
const HOOF = '#ffd98a';

function pegasus(pose, f, mood) {
  const walk = pose === 'walk';
  const a = (f / (walk ? 6 : 4)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const bob = walk ? 0.55 * Math.cos(2 * a) : 0;
  const breathe = walk ? 0 : Math.sin(a) * 0.35;
  let hx = 0;
  let hy = bob + (walk ? 0.45 * Math.cos(2 * a + 0.8) : Math.sin(a + 0.6) * 0.3);
  if (hurt) {
    hx -= 1.2;
    hy -= 0.8;
  }
  if (dead) {
    hx -= 0.4;
    hy += 2.4;
  }
  const look = walk ? 0 : [0, 0.7, 0.7, -0.5][f];
  const out = [];
  const B = (shapes) => shift(shapes, 0, bob);
  const H = (shapes) => shift(shapes, hx, hy);

  // Wing pose: raised and half spread, beating with the trot.
  let wa = walk ? -128 + 11 * Math.sin(a) : -133 + 2.5 * Math.sin(a);
  let ps = walk ? 10.5 + 2.5 * Math.cos(a) : 9.5;
  if (angry) [wa, ps] = [wa + 14, ps + 2.5];
  if (happy) wa += 8;
  if (hurt) [wa, ps] = [-104, 15];
  if (dead) [wa, ps] = [-176, 6];
  const wingCol = { col: '#fbfaff', tip: '#c8e4ff', cov: '#ffffff', vane: '#eef0fb' };
  out.push(...B(wing({ x: 29.5, y: 21.5, ang: wa + 9, ps, k: 0.9, col: '#e7e2f4', tip: '#b5d3f2', cov: '#efebf8', vane: '#dcd6ee' })));

  // Tail: a swishing cotton-candy plume with a bow.
  const tsw = walk ? 1 : 0.5;
  const tail = [[10.5, 24.5, 2.8], [7.6, 26.2, 3.3], [5.4, 29.4, 3.4], [4.6, 33.2, 3.1], [5.4, 36.8, 2.6], [7.2, 39.4, 1.9]].map(([x, y, r], i) => {
    const sw = Math.sin(a - i * 0.75) * i * 0.38 * tsw + (dead ? i * 0.5 : 0);
    return [x + sw + 0.6, y - (angry ? i * 0.5 : 0), r, MANE[i % 3]];
  });
  out.push(...B(puffs(tail, MANE[0])));

  // Legs: a diagonal trot (near fore with far hind, far fore with near hind).
  const ground = 46;
  const leg = (hipx, hipy, ph, fore, near) => {
    const s = Math.sin(ph);
    const c = Math.cos(ph);
    const dx = walk ? s * 3.1 : 0;
    const lift = walk ? Math.max(0, c) * 3.2 : 0;
    const fx = hipx + dx + (fore ? 0.6 : -0.4) + (dead ? (fore ? 1 : -1) : 0);
    const fy = ground - lift;
    const hy0 = hipy + bob;
    const coat = near ? COAT : COAT_FAR;
    const knee = fore ? [lerp(hipx, fx, 0.5) + lift * 0.55 + 0.3, lerp(hy0, fy, 0.45)] : [lerp(hipx, fx, 0.5) - 1.3 - lift * 0.25, lerp(hy0, fy, 0.55)];
    const ank = [fx + (fore ? 0 : 0.2), fy - 4.3];
    const o = [...stroke([[hipx, hy0], knee], fore ? 3.6 : 3.9, coat, false), E(knee[0], knee[1], 1.6, 1.6, coat), ...stroke([knee, ank], 2.7, coat, false)];
    o.push(T([[fx - 1.7, fy - 2.3], [fx + 1.8, fy - 2.3], [fx + 2.2, fy], [fx - 2, fy]], near ? HOOF : shade(HOOF, -8)), F(T([[fx - 1.1, fy - 2], [fx + 0.1, fy - 2], [fx - 0.3, fy - 0.6], [fx - 1.4, fy - 0.6]], '#fff1c8')));
    o.push(...puffs([[fx - 1.5, fy - 3.2, 1.9], [fx + 1.6, fy - 3.3, 1.8], [fx, fy - 4.6, 2.1]], near ? CLOUD : '#e8eefc', { line: near ? '#a9b8de' : '#9aa6cf' }));
    return o;
  };
  out.push(...leg(34.5, 31, a + Math.PI, true, false), ...leg(19.5, 31.5, a, false, false));

  // Body: rump, barrel, chest, a soft lavender belly, and star dapples.
  out.push(...B([F(E(16.4, 28.4, 7.9, 7.6, lineOf(COAT))), E(16.4, 28.4, 7.4, 7.1 + breathe * 0.4, COAT), E(25, 29.6, 11.5, 7.2 + breathe, COAT), E(33.2, 28, 6.4, 7, COAT),
    F(E(25.5, 35.2, 8.6, 1.6, COAT_SH)), F(E(15.5, 33.6, 4.5, 1.3, COAT_SH)), F(E(23, 24.4, 7, 1.3, '#ffffff')), F(E(14.5, 23.6, 3.2, 1.1, '#ffffff')),
    ...sparkle(14.2, 28.4, 1.9, '#ffd6ea', '#fff2f8'), ...sparkle(18.4, 31.6, 1.3, '#d9cfff', '#f4f0ff'), ...sparkle(11.6, 31.8, 1, '#c8e4ff', '#f0f8ff')]));
  out.push(...leg(30.8, 32, a, true, true), ...leg(16.5, 32.5, a + Math.PI, false, true));

  // Neck, bridging the body and the head.
  out.push(T([[28.6, 22.5 + bob], [33 + hx, 11 + hy], [40 + hx, 12 + hy], [38.6, 27 + bob], [33, 30 + bob]], COAT), F(E(36 + hx * 0.5, 22 + (bob + hy) / 2, 2.4, 4.6, COAT_SH)));
  // Mane down the neck crest, trailing in the wind.
  const maneLine = [[36.2, 5.6, 3.7], [33.4, 8.2, 3.7], [31.2, 11.6, 3.5], [29.5, 15.2, 3.3], [28, 18.7, 3], [26.8, 21.8, 2.6]];
  const mane = maneLine.map(([x, y, r], i) => {
    const t = i / 5;
    const wv = walk ? -(0.5 + 0.7 * Math.sin(a * 2 - i * 0.9)) * (0.3 + t) : -Math.sin(a - i * 0.8) * 0.35 * t;
    return [x + lerp(hx, 0, t) + wv - (angry ? 0.6 * (1 - t) : 0), y + lerp(hy, bob, t) - (angry ? 0.8 : 0), r, MANE[(5 - i) % 3]];
  }).reverse();
  out.push(...puffs(mane, MANE[0]));
  // A ribbon collar with a little gold star bell.
  out.push(...B([...stroke([[30, 24.6 + (hy - bob) * 0.3], [34.2, 26.4], [38.6, 25.6]], 1.5, '#9fd4ff'), ...stroke([[30.2, 24.1 + (hy - bob) * 0.3], [34.2, 25.9], [38.4, 25.1]], 0.4, '#d6efff')]),
    ...B(sparkle(35.2, 28.2, 1.9, '#ffd66b', '#fff4c0')));

  // Near wing, in front of the body.
  out.push(...B(wing({ x: 27.5, y: 23, ang: wa, ps, ...wingCol })));

  // Head.
  let earTip = [33.2, 1.4];
  if (angry) earTip = [30.2, 4.6];
  if (happy) earTip = [33.8, 0.8];
  if (dead) earTip = [29.6, 8.4];
  if (hurt) earTip = [31, 3];
  const farTip = [earTip[0] + 10.6 + (angry || dead ? -1.5 : 0), earTip[1] - 0.3];
  const head = [T([[40.5, 7.5], farTip, [44.6, 8.6]], COAT_FAR), F(T([[41.4, 7.6], [farTip[0] - 0.1, farTip[1] + 2], [43.6, 8.2]], '#f4c6d8'))];
  head.push(F(E(40, 14, 8.65, 8.05, lineOf(COAT))), E(40, 14, 8.2, 7.6, COAT), E(41.2, 17.6, 7, 5.4, COAT), F(E(46.2, 20.1, 5.85, 4.65, lineOf(COAT))), E(46.2, 20.1, 5.4, 4.2, COAT),
    F(E(47.4, 21.1, 3.7, 2.8, '#ffe2ec')), F(E(49.7, 19.8, 0.75, 0.55, '#e295b1')), F(E(37.4, 9.6, 3.6, 1.3, '#ffffff')), F(E(45, 17.4, 2, 0.8, '#ffffff')));
  head.push(T([[34.2, 9.2], earTip, [38.8, 6.6]], COAT), F(T([[35.1, 8.2], [earTip[0] + 0.7, earTip[1] + 2], [37.6, 6.9]], '#ffcade')));
  // Forelock, a curl, and a gold star clip.
  head.push(...puffs([[37.6, 6.6, 3.2, MANE[1]], [41, 5.8, 3, MANE[0]], [44, 7.6, 2.4, MANE[2]]], MANE[0]),
    ...feather(41.6, 7.4, 78 + (walk ? Math.sin(a) * 8 : 0), 5.4, 2.6, MANE[0], { shaft: false, cast: true }),
    ...sparkle(36.4, 5.4, 1.7, '#ffd66b', '#fff4c0'));
  const lid = COAT;
  head.push(...eye(40.6, 14.4, 1.95, mood, { iris: '#8b74f2', inner: 1, lid, look }), ...eye(46.3, 13.8, 1.55, mood, { iris: '#8b74f2', inner: -1, lid, look, lash: false }));
  if (!dead) head.push(F(E(39.2, 18.3, 1.6, 0.75, BLUSH)), F(E(47.3, 17.5, 1.1, 0.6, BLUSH)));
  head.push(...mouth(47.6, 22.6, 1.05, mood));
  if (angry) head.push(...puffs([[52.2, 20.8, 0.9], [53.1, 22.4, 0.7]], '#ffffff', { hi: null }));
  out.push(...H(head));
  return { w: 54, h: 46, res: 3, shapes: out };
}

// ---------- Harpy ----------

const PLUME = '#8fd0ff';
const PLUME_D = '#6cb8f2';
const PLUME_L = '#c4e9ff';
const SKIN = '#ffe8da';
const LEGC = '#ffc887';
const CLAW = '#6a5a86';
const CREST = ['#ff9ec0', '#ffd66b', '#ffb3d1'];

const FLAP = [
  { ang: -98, ps: 12, bob: 0.3 },
  { ang: -128, ps: 14, bob: 0 },
  { ang: -166, ps: 15, bob: 0.5 },
  { ang: 152, ps: 12.5, bob: 1.4 },
  { ang: 176, ps: 7.5, bob: 1.2 },
  { ang: -134, ps: 7.5, bob: 0.6 },
];
const HOVER = [
  { ang: -118, ps: 10.5, bob: 0 },
  { ang: -130, ps: 11, bob: 0.4 },
  { ang: -142, ps: 11, bob: 0.8 },
  { ang: -130, ps: 10.5, bob: 0.4 },
];

function harpy(pose, f, mood) {
  const walk = pose === 'walk';
  const st = (walk ? FLAP : HOVER)[f];
  const a = (f / (walk ? 6 : 4)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  let { ang, ps, bob } = st;
  if (angry) [ang, ps] = [ang + 8, ps + 2];
  if (hurt) [ang, ps] = [-100, 16];
  if (dead) [ang, ps, bob] = [118, 6, 1.5];
  // The head lags the body a little.
  let hx = 0;
  let hy = bob * 0.7 + (walk ? 0.25 : 0);
  if (hurt) [hx, hy] = [-1.3, hy - 0.6];
  if (dead) [hx, hy] = [0.4, hy + 1.6];
  const B = (shapes) => shift(shapes, 0, bob);
  const Hd = (shapes) => shift(shapes, hx, hy);
  const out = [];

  // Tail fan.
  const tsw = Math.sin(a) * (walk ? 6 : 3) + (dead ? 20 : 0);
  const tail = [];
  [[200, 8.6, PLUME_D], [186, 10.6, PLUME], [172, 11.2, PLUME_D], [160, 9.6, PLUME]].forEach(([d, len, c]) => tail.push(...feather(22.5, 30, d + tsw * (len / 11), len, 3.5, c, { tip: '#ffffff', vane: shade(c, -6) })));
  tail.push(...feather(22.5, 30.5, 180 + tsw, 7, 2.2, CREST[0], { tip: '#ffffff', shaft: false }));
  out.push(...B(tail));

  // Far wing.
  const wingOpts = { n: 6, sec: 4, arm: 7, plen: 11.6, pw: 3.4, slen: 8.2, sw: 3.2 };
  out.push(...B(wing({ x: 30.6, y: 21.6, ang: ang + 9, ps, k: 0.9, col: PLUME_D, tip: '#e6f3ff', cov: '#9ccff5', vane: shade(PLUME_D, -6), ...wingOpts })));

  // Legs and talons, dangling and swinging opposite the wingbeat.
  const leg = (x, near) => {
    const sw = (walk ? -Math.cos(a) * 1.2 : Math.sin(a) * 0.4) + (dead ? -1.5 : 0);
    const kx = x + sw * 0.3;
    const fx = x + 0.8 + sw;
    const fy = 40.2;
    const c = near ? LEGC : shade(LEGC, -10);
    const o = [...stroke([[kx, 33.5], [fx, fy]], 1.7, c, false)];
    for (const y of [36, 37.6]) o.push(...stroke([[lerp(kx, fx, (y - 33.5) / 6.7) - 0.8, y], [lerp(kx, fx, (y - 33.5) / 6.7) + 0.8, y + 0.2]], 0.3, shade(c, -18)));
    const spread = angry ? 1.4 : dead ? 0.5 : 1;
    const toes = [[-1.9 * spread, 1.4, 1.2], [0.9, 2.1, 0.6], [2.6 * spread, 1.2, 0.2], [-0.6, -0.9 + 0.6, -0.2]];
    for (const [tx, ty] of toes) {
      const ex = fx + tx;
      const ey = fy + ty;
      o.push(...stroke([[fx, fy], [ex, ey]], 1.1, c, false), T([[ex - 0.5, ey - 0.3], [ex + 0.5, ey - 0.3], [ex + 0.35 * Math.sign(tx || 1), ey + 1.1]], CLAW));
    }
    return o;
  };
  out.push(...B(leg(29.5, false)));

  // Back hair: feather locks trailing behind the head.
  const lag = walk ? Math.sin(a - 1) * 4 : Math.sin(a) * 2;
  const back = [F(E(28.4, 14, 9, 8.4, lineOf(PLUME_D))), E(28.4, 14, 8.5, 7.9, PLUME_D)];
  [[22, 13.5, 158, 7.6], [21.6, 17, 130, 8.4], [23.6, 19.6, 108, 7.4], [26.4, 21, 96, 5.6]].forEach(([x, y, d, len], i) =>
    back.push(...feather(x, y, d + lag * (1 - i * 0.2) + (dead ? 12 : 0), len, 3.8, i % 2 ? PLUME : PLUME_D, { tip: i % 2 ? '#ffffff' : PLUME_L })));
  out.push(...Hd(back));

  // Body: plumed torso, a fluffy feather skirt, and a white ruff.
  const body = [F(E(27, 27, 6.1, 6.5, lineOf(PLUME))), E(27, 27, 5.6, 6, PLUME)];
  [[21.8, 29.6, 116], [24.2, 30.4, 104], [27, 30.8, 92], [29.8, 30.4, 80], [32.2, 29.4, 68]].forEach(([x, y, d], i) =>
    body.push(...feather(x, y, d + (walk ? Math.sin(a + i) * 3 : 0), 6.4 - Math.abs(i - 2) * 0.5, 3.6, i % 2 ? PLUME_D : PLUME, { tip: '#ffffff', shaft: false })));
  out.push(...B(body), ...B(leg(25.2, true)));
  out.push(...B([...puffs([[25.6, 24.2, 2.5], [28.4, 28.4, 2.6], [30.8, 25.8, 2.7], [28.6, 22.8, 3]], '#ffffff', { line: '#a8c4e6' }),
    ...stroke([[25.8, 21.6], [29, 24.2], [32, 21.8]], 0.45, '#ffd66b'), F(T([[29, 23.6], [30.2, 25.1], [29, 26.8], [27.8, 25.1]], '#ffd66b')), F(T([[29, 24.2], [29.7, 25.1], [29, 26.1], [28.3, 25.1]], '#ff8fb8'))]));

  // Head.
  const head = [E(29.6, 20.6, 1.8, 2.2, SKIN), F(E(32, 15.6, 6.75, 6.45, lineOf(SKIN))), E(32, 15.6, 6.3, 6, SKIN), E(33.2, 17.8, 5, 3.6, SKIN)];
  // Crest plumes.
  const cr = angry ? 14 : happy ? 8 : hurt ? -18 : dead ? -40 : 0;
  const csw = walk ? Math.sin(a - 1.4) * 7 : Math.sin(a) * 3;
  const crest = [];
  [[-160, 7, CREST[2]], [-130, 8.6, CREST[1]], [-104, 8, CREST[0]]].forEach(([d, len, c], i) =>
    crest.push(...feather(27.2 + i * 0.9, 8.4 - i * 0.2, d + cr + csw * (0.6 + i * 0.2), len, 2.7, c, { tip: '#ffffff', tipAt: 0.7 })));
  head.unshift(...crest);
  // Hair cap and feather bangs.
  head.push(F(E(29.4, 11.4, 8.1, 5.4, lineOf(PLUME))), E(29.4, 11.4, 7.6, 4.9, PLUME), E(24.8, 14.2, 3.6, 4.6, PLUME), F(E(28, 8.6, 3.6, 1.2, PLUME_L)));
  [[24.8, 12, 100, 7.4, PLUME_D], [29, 8.6, 80, 6.2, PLUME], [32.4, 8.4, 66, 6.2, PLUME], [35.6, 9.2, 56, 5.4, PLUME_D], [37.6, 10.8, 54, 3.8, PLUME]].forEach(([x, y, d, len, c]) =>
    head.push(...feather(x, y, d, len, 3.5, c, { tip: PLUME_L, cast: true, shaft: false, tipAt: 0.7 })));
  // A gold feather clip with a gem, over the ear.
  head.push(...feather(24.6, 15, 130 + lag * 0.5, 5, 2.4, '#ffffff', { tip: CREST[0], shaft: false }), F(E(24.8, 14.4, 1.5, 1.5, '#ffd66b')), F(E(24.8, 14.4, 0.8, 0.8, '#5ec8e8')));
  head.push(...eye(31.6, 16.4, 1.8, mood, { iris: '#38b6c9', inner: 1, lid: SKIN, look: walk ? 0.4 : 0 }), ...eye(37, 16, 1.5, mood, { iris: '#38b6c9', inner: -1, lid: SKIN, lash: false, look: walk ? 0.4 : 0 }));
  if (!dead) head.push(F(E(30.4, 19.6, 1.5, 0.7, BLUSH)), F(E(37.8, 19.2, 1.1, 0.6, BLUSH)));
  head.push(...mouth(35.4, 20.2, 0.95, mood));
  out.push(...Hd(head));

  // Near wing-arm, with a little hand at the wrist.
  const hand = (x, y) => [E(x + 0.4, y + 0.6, 1.3, 1.1, SKIN), ...stroke([[x + 0.6, y + 1.2], [x + 1.4, y + 2]], 0.7, SKIN, false), ...stroke([[x - 0.3, y + 1.3], [x - 0.2, y + 2.3]], 0.7, SKIN, false)];
  out.push(...B(wing({ x: 25.4, y: 22.6, ang, ps, col: PLUME, tip: '#ffffff', cov: PLUME_L, vane: shade(PLUME, -7), hand, ...wingOpts })));
  return { w: 52, h: 44, res: 3, shapes: out };
}

// ---------- Star Seraph ----------

const GOLD = '#ffe27a';
const STAR = '#ffe88f';
const STAR_IN = '#fff6c8';
const WING_TIPS = ['#ffe6a0', '#ddd0ff', '#c6e6ff'];

function seraph(pose, f, mood) {
  const walk = pose === 'walk';
  const n = walk ? 6 : 4;
  const a = (f / n) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const cx = 25;
  const cy = 26 + (walk ? Math.sin(a) * 0.6 : Math.sin(a) * 0.3) + (dead ? 1.2 : 0);
  const fade = (c) => (dead ? mix(c, '#cfc6dc', 0.45) : angry ? mix(c, '#ffb07a', 0.25) : c);
  const out = [];

  // Halo, behind everything.
  let hrot = walk ? Math.sin(a) * 4 : Math.sin(a) * 2;
  let hdy = 0;
  if (hurt) hrot += 16;
  if (dead) [hrot, hdy] = [-24, 4];
  out.push(F(ring(cx + 0.6, cy - 18.6 + hdy, 9.3, 3.1, 2.4, hrot, lineOf(GOLD))), ring(cx + 0.6, cy - 18.6 + hdy, 8.6, 2.6, 1.7, hrot, fade(GOLD)));
  if (!dead) out.push(...sparkle(cx + 7 * Math.cos(rad(hrot)), cy - 18.6 + 7 * Math.sin(rad(hrot)), 1.6, '#ffffff', '#ffffff'));

  // Sparks circling the core; the far half passes behind the wings.
  const sparks = [];
  for (let i = 0; i < 4; i++) {
    const t = rad(i * 90 + (walk ? f * 15 : f * 22.5) + 20);
    const sx = cx + Math.cos(t) * 21.5;
    const sy = cy + 2 + Math.sin(t) * 5.5 - Math.cos(t) * 2;
    const front = Math.sin(t) > 0;
    sparks.push({ front, s: sparkle(sx, sy, front ? 2.4 : 1.7, fade(front ? '#fff1a6' : '#e8dcff')) });
  }
  if (!dead) for (const s of sparks) if (!s.front) out.push(...s.s);

  // Three pairs of wings, the beat rippling from the top pair down.
  const pairs = [
    { dx: 4.6, dy: -4.6, base: -38, amp: 12, n: 5, len: 14.5, w: 3.6, fan: 13, tip: WING_TIPS[0] },
    { dx: 6.4, dy: 0.4, base: 4, amp: 10, n: 5, len: 15, w: 3.5, fan: 12, tip: WING_TIPS[1] },
    { dx: 4.8, dy: 5, base: 46, amp: 8, n: 4, len: 10.5, w: 3.2, fan: 13, tip: WING_TIPS[2] },
  ];
  const wings = [];
  pairs.forEach((p, i) => {
    let beat = Math.sin(a - i * 1.05) * (walk ? p.amp : p.amp * 0.4);
    if (angry) beat -= 10;
    if (happy) beat -= 5;
    if (hurt) beat += 10 + i * 2;
    if (dead) beat = 26 - i * 6;
    const fan = p.fan * (walk ? 1 + 0.2 * Math.cos(a - i * 1.05) : 1) * (dead ? 0.6 : 1);
    for (const side of [-1, 1]) {
      const rx = cx + side * p.dx;
      const ry = cy + p.dy;
      const one = [];
      for (let j = p.n - 1; j >= 0; j--) {
        // Feathers fan from the leading edge (above) down to the trailing edge.
        const d = p.base + beat + (j - (p.n - 1) * 0.35) * fan;
        const ang = side > 0 ? d : 180 - d;
        const len = p.len * (1 - Math.abs(j - 1) * 0.08);
        one.push(...feather(rx, ry, ang, len, p.w, fade('#ffffff'), { tip: fade(p.tip), vane: fade('#f0ecfb'), line: fade('#a99ccd') }));
      }
      // Coverts on top.
      for (let j = 0; j < 3; j++) {
        const d = p.base + beat + (j - 1) * fan * 0.9 - fan * 0.4;
        one.push(...feather(rx, ry, side > 0 ? d : 180 - d, p.len * 0.45, p.w * 1.1, fade('#fffaf0'), { shaft: false, line: fade('#b7a9d6'), tip: fade(mix(p.tip, '#ffffff', 0.5)) }));
      }
      wings.push(one);
    }
  });
  // Lower pairs first, so the top pair overlaps the middle one.
  for (const i of [5, 4, 3, 2, 1, 0]) out.push(...wings[i]);

  // Stardust tail streaming below the core.
  const tw = walk ? Math.sin(a - 0.8) * 2.2 : Math.sin(a) * 1;
  out.push(F(T([[cx - 5.6, cy + 5], [cx + 5.6, cy + 5], [cx + 3 + tw * 0.5, cy + 15], [cx + tw * 1.4, cy + 24.6], [cx - 2.6 + tw * 0.4, cy + 14]], lineOf(STAR))),
    T([[cx - 5, cy + 5], [cx + 5, cy + 5], [cx + 2.4 + tw * 0.5, cy + 15], [cx + tw * 1.4, cy + 24], [cx - 2.1 + tw * 0.4, cy + 14]], fade(STAR)),
    F(T([[cx - 2.4, cy + 6], [cx + 2.6, cy + 6], [cx + 1 + tw * 0.5, cy + 14.5], [cx + tw * 1.1, cy + 20.4], [cx - 0.9 + tw * 0.4, cy + 13.4]], fade(STAR_IN))));
  if (!dead) out.push(...sparkle(cx - 3.5 + tw, cy + 19, 1.2, '#fff6c8'), ...sparkle(cx + 4 + tw * 0.8, cy + 15, 0.9, '#ffffff'));

  // The core: two turning eight-pointed stars around a glowing face.
  const spin = (walk ? f * 7.5 : f * 11.25) + (hurt ? 10 : 0);
  const star = (r1, r2, off, sq = 1) =>
    Array.from({ length: 16 }, (_, i) => {
      const t = rad(-90 + off + i * 22.5);
      const r = i % 2 ? r2 : r1;
      return [cx + Math.cos(t) * r, cy + Math.sin(t) * r * sq];
    });
  const pulse = walk ? 1 + Math.sin(a * 2) * 0.04 : 1 + Math.sin(a) * 0.03;
  out.push(F(T(star(14 * pulse, 7.6, spin), lineOf(STAR))), T(star(13.3 * pulse, 7.2, spin), fade(STAR)));
  out.push(F(T(star(10.6, 7.4, 22.5 - spin * 1.5), lineOf(STAR_IN))), F(T(star(10, 7, 22.5 - spin * 1.5), fade('#fff0b0'))));
  out.push(F(E(cx, cy, 8.4, 8, lineOf(STAR_IN))), E(cx, cy, 7.9, 7.5, fade(STAR_IN)), F(E(cx - 2.4, cy - 4.4, 3.4, 1.4, '#ffffff')), F(E(cx + 3.8, cy + 4.6, 2.2, 0.9, fade('#ffe9a8'))));
  // A small diamond on the brow.
  out.push(F(T([[cx + 0.8, cy - 6.6], [cx + 2, cy - 5.2], [cx + 0.8, cy - 3.8], [cx - 0.4, cy - 5.2]], fade('#ff9ec0'))), F(E(cx + 0.5, cy - 5.6, 0.35, 0.35, '#ffffff')));
  // Serene face: gentle lidded eyes when calm.
  const fx = cx + 0.8;
  const fy = cy + 0.4;
  const calm = mood === 'idle';
  if (calm) {
    for (const [ex, inner] of [[fx - 3, 1], [fx + 3, -1]]) {
      out.push(F(E(ex, fy, 1.6, 1.8, INK)), F(E(ex, fy + 0.5, 1.2, 1.2, '#b28cff')), F(E(ex, fy + 1.1, 0.8, 0.4, '#e6d6ff')), F(E(ex - 0.5, fy + 0.1, 0.45, 0.45, '#ffffff')),
        F(T([[ex - 1.9, fy - 2.2], [ex + 1.9, fy - 2.2], [ex + 1.9, fy - 0.4], [ex - 1.9, fy - 0.4]], fade(STAR_IN))),
        ...stroke([[ex - 1.7, fy - 0.3], [ex, fy - 0.6], [ex + 1.7, fy - 0.3]], 0.6, INK), ...stroke([[ex - inner * 1.6, fy - 0.3], [ex - inner * 2.3, fy - 0.9]], 0.45, INK));
    }
  } else {
    out.push(...eye(fx - 3, fy, 1.65, mood, { iris: '#b28cff', inner: 1, lid: fade(STAR_IN) }), ...eye(fx + 3, fy, 1.65, mood, { iris: '#b28cff', inner: -1, lid: fade(STAR_IN) }));
  }
  if (!dead) out.push(F(E(fx - 4.4, fy + 2.6, 1.4, 0.7, BLUSH)), F(E(fx + 4.4, fy + 2.6, 1.4, 0.7, BLUSH)));
  out.push(...mouth(fx, fy + 3.2, 1, mood));
  if (!dead) for (const s of sparks) if (s.front) out.push(...s.s);
  if (angry) out.push(...sparkle(cx + 11, cy - 11, 2.2, '#ff9a6b', '#fff0c0'));
  return { w: 50, h: 52, res: 3, shapes: out };
}

export const ART = {
  cloudsheep: { walk: 6, idle: 4, draw: pegasus },
  windbird: { walk: 6, idle: 4, draw: harpy },
  starspirit: { walk: 6, idle: 4, draw: seraph },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  cloudsheep: { name: 'Pegasus Foal', w: 40, h: 32 },
  windbird: { name: 'Sky Harpy', w: 36, h: 30 },
  starspirit: { name: 'Star Seraph', w: 34, h: 36 },
};
