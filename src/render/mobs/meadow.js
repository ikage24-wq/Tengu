// Monster art: Petal Meadow and Clover Hills (levels 1-8), the first monsters a player meets.
//   puffle      Kitsune Kit: a tiny fox spirit with three tails tipped in spirit flames
//   snailbun    Moss Tortoise: a little tortoise carrying a garden on its shell
//   sproutling  Mandrake: a root creature with a leafy crown that screams when angry
//   mushkin     Toadstool Goblin: a goblin in a spotted mushroom-cap helmet with a club
//   piglet      Jackalope: a fluffy antlered hare that bounds along
// Every design faces right with its feet on the bottom edge; see kit.js for the shapes.

import { R, E, T, F, C, INK, BLUSH, MOUTH, arc, stroke, shade, mix } from './kit.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

// ---------- Shape helpers ----------

// A rotated ellipse (as a polygon).
function O(cx, cy, rx, ry, deg, c, n = 18) {
  const a = deg * D2R;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    pts.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return T(pts, c);
}

// An ellipse stretched between two points, w its half width (ears, limbs, feet).
function seg(a, b, w, c) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return O((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len / 2, w, Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R, c);
}

// A tapered limb from a (width wa) to b (width wb) with rounded ends.
function limb(a, b, wa, wb, c) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  return [
    T([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2], [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], c),
    E(a[0], a[1], wa / 2, wa / 2, c), E(b[0], b[1], wb / 2, wb / 2, c),
  ];
}

// A pointed leaf (or ear) growing from (bx, by) along deg.
function leaf(bx, by, deg, len, wid, c) {
  const a = deg * D2R;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const p = (u, v) => [bx + dx * len * u - dy * wid * v, by + dy * len * u + dx * wid * v];
  return T([p(0, 0.35), p(0.18, 0.85), p(0.45, 1), p(0.75, 0.7), p(1, 0), p(0.75, -0.7), p(0.45, -1), p(0.18, -0.85), p(0, -0.35)], c);
}

const bz = (a, b, c, t) => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
];

// One big expressive eye. s = -1 for the far (left) eye, 1 for the near one; o.lid is the skin
// color used to narrow the eye when angry, o.iris / o.glow the iris colors.
function eye(x, y, r, mood, s, o = {}) {
  const ink = o.ink ?? INK;
  const out = [];
  switch (mood) {
    case 'blink':
      out.push(arc(x, y - 0.1 * r, 0.95 * r, 0.6 * r, 10, 170, 0.42 * r, ink));
      break;
    case 'happy':
      out.push(arc(x, y + 0.55 * r, 0.95 * r, 0.9 * r, 200, 340, 0.46 * r, ink));
      break;
    case 'hurt': {
      const d = s < 0 ? 1 : -1;
      out.push(...stroke([[x - d * 0.85 * r, y - 0.85 * r], [x + d * 0.75 * r, y], [x - d * 0.85 * r, y + 0.85 * r]], 0.45 * r, ink));
      break;
    }
    case 'dead':
      out.push(...stroke([[x - 0.8 * r, y - 0.8 * r], [x + 0.8 * r, y + 0.8 * r]], 0.42 * r, ink), ...stroke([[x - 0.8 * r, y + 0.8 * r], [x + 0.8 * r, y - 0.8 * r]], 0.42 * r, ink));
      break;
    default: {
      const angry = mood === 'angry';
      const iris = angry ? o.glow ?? o.iris ?? '#7a5cff' : o.iris ?? '#6a5acd';
      out.push(F(E(x, y, 0.82 * r, 1.12 * r, ink)), F(E(x + 0.08 * r, y + 0.32 * r, 0.62 * r, 0.7 * r, iris)),
        F(E(x + 0.1 * r, y + 0.62 * r, 0.42 * r, 0.32 * r, mix(iris, '#ffffff', 0.45))));
      if (angry) out.push(F(E(x + 0.08 * r, y + 0.2 * r, 0.2 * r, 0.5 * r, ink)));
      out.push(F(E(x - 0.26 * r, y - 0.42 * r, 0.34 * r, 0.36 * r, '#ffffff')), F(E(x + 0.34 * r, y + 0.1 * r, 0.14 * r, 0.14 * r, '#ffffff')));
      if (angry && o.lid) {
        const yo = y - 0.62 * r;
        const yi = y + 0.05 * r;
        const [yl, yr] = s < 0 ? [yo, yi] : [yi, yo];
        out.push(F(T([[x - 1.1 * r, y - 1.6 * r], [x + 1.1 * r, y - 1.6 * r], [x + 1.1 * r, yr], [x - 1.1 * r, yl]], o.lid)));
        out.push(...stroke([[x - 1.05 * r, yl - 0.35 * r], [x + 1.05 * r, yr - 0.35 * r]], 0.5 * r, o.brow ?? ink));
      }
    }
  }
  return out;
}

const blush = (x, y, rx, mood) => (mood === 'dead' ? [] : [F(E(x, y, rx, rx * 0.5, BLUSH))]);

// A spirit flame: a teardrop licking upward, h tall, leaning by `lean`.
function flame(x, y, h, lean, outer, inner) {
  if (h <= 0) return [];
  const w = 1.4 + h * 0.2;
  return [
    F(T([[x - w, y + 0.3], [x - w * 1.1, y - h * 0.32], [x - w * 0.8 + lean * 0.3, y - h * 0.7], [x - w * 0.3, y - h * 0.46], [x + lean, y - h],
      [x + w * 0.4, y - h * 0.5], [x + w * 0.95 + lean * 0.4, y - h * 0.68], [x + w * 1.05, y - h * 0.18], [x + w * 0.85, y + w * 0.6], [x, y + w * 0.95], [x - w * 0.85, y + w * 0.6]], outer)),
    F(T([[x - w * 0.55, y + 0.3], [x - w * 0.45, y - h * 0.3], [x - w * 0.1 + lean * 0.6, y - h * 0.68], [x + w * 0.3, y - h * 0.38], [x + w * 0.5, y - h * 0.1], [x + w * 0.4, y + w * 0.5], [x, y + w * 0.65]], inner)),
    F(E(x + 0.1, y + 0.1, w * 0.3, w * 0.36, '#ffffff')),
    F(E(x + w * 1.4 + lean * 0.6, y - h * 0.95, 0.4, 0.4, inner)),
  ];
}

// ---------- Kitsune Kit (puffle) ----------

function kitsune(pose, f, mood) {
  const walk = pose === 'walk';
  const p = (f / (walk ? 6 : 4)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const fur = '#ffb98c';
  const furD = '#eea078';
  const cream = '#fff4e8';
  const sock = '#c58e86';
  const mark = '#ff6f92';
  const [fo, fi] = angry ? ['#ff8ab8', '#ffe1ee'] : ['#9cc6ff', '#e4f2ff'];
  const out = [];

  const bob = dead ? 3 : walk ? -Math.abs(Math.cos(p)) * 1.1 + 0.5 : Math.sin(p) * 0.3;
  const rx = hurt ? -1.4 : 0;
  const bx = 15 + rx;
  const by = 22 + bob;

  // Tails: three fluffy plumes curling up behind, lagging the stride, each tipped in a spirit flame.
  const tips = [[-7, -12.6, -6.4, -2], [-1.4, -15.4, -4.4, -7], [-10.6, -5, -3, 0.6]];
  tips.forEach(([tdx, tdy, cdx, cdy], k) => {
    const sw = walk ? Math.sin(p - 1.2 - k * 0.7) * 1.6 : Math.sin(p - k * 0.9) * 1.1;
    const lift = happy ? -1.5 : dead ? 7 + k : angry ? -1 : 0;
    const base = [bx - 5.5, by - 1];
    const tip = [base[0] + tdx + sw + (dead ? -1 : 0), base[1] + tdy + lift + Math.abs(sw) * 0.3];
    const ctl = [base[0] + cdx, base[1] + cdy];
    const tone = k === 2 ? furD : fur;
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      const [x, y] = bz(base, ctl, tip, t);
      const r = 1.5 + 1.7 * Math.sin(Math.PI * (0.18 + 0.66 * t));
      out.push(E(x, y, r, r * 0.95, t > 0.62 ? (k === 2 ? shade(cream, -5) : cream) : tone));
    }
    out.push(F(E(tip[0] - 0.6, tip[1] - 0.6, 1, 0.7, '#ffffff')));
    const fl = walk ? Math.sin(p * 2 + k * 2) : [0, 0.8, -0.6, 0.4][f];
    const h = dead ? 0 : (angry ? 7 : hurt ? 3 : 4.6) + fl * 0.6;
    out.push(...flame(tip[0] - 0.2, tip[1] - 1.2, h, -sw * 0.5 + fl * 0.5, fo, fi));
    if (dead) out.push(F(E(tip[0], tip[1] - 2.2, 0.9, 0.7, '#d8d0e8')), F(E(tip[0] + 0.8, tip[1] - 3.8, 0.6, 0.5, '#e4def0')));
  });

  // Legs: a trot, diagonal pairs swinging together.
  const hipY = by + 2.4;
  const leg = (x, ph, near) => {
    const s = walk ? Math.sin(p + ph) : 0;
    const lift = walk ? Math.max(0, Math.cos(p + ph)) * 1.4 : 0;
    const fx = x + s * 1.9 + (dead ? (near ? 2 : -2) : 0);
    const fy = dead ? 29.4 : 29 - lift;
    return [...limb([x, hipY], [fx, fy - 0.8], 2.8, 2.2, near ? fur : furD), E(fx + 0.5, fy, 1.7, 1, near ? sock : shade(sock, -6))];
  };
  out.push(...leg(bx - 4.2, Math.PI, false), ...leg(bx + 4.2, 0, false));
  // Body: haunch, barrel, cream chest.
  out.push(E(bx - 3.8, by + 0.4, 3.9, 4, fur), E(bx, by, 6.8, 4.4, fur), E(bx + 4.4, by + 0.8, 3.2, 3.6, cream));
  out.push(...leg(bx - 2.8, 0, true), ...leg(bx + 5.4, Math.PI, true));

  // Head, nodding with the stride.
  const nod = walk ? Math.sin(p * 2 + 0.9) * 0.45 : Math.sin(p - 0.6) * 0.3;
  const hx = 23 + rx * 1.1 + (dead ? -0.5 : 0);
  const hy = 13.5 + bob * 0.8 + nod + (hurt ? -0.6 : 0) + (dead ? 1.6 : 0);

  // Ruff: a fluffy cream collar, bristling when angry.
  const spike = angry ? 1.6 : 0;
  out.push(E(hx - 4.2, hy + 6.4, 3.4, 2.6, cream), E(hx - 0.8, hy + 7.2, 3.6, 2.6, cream), E(hx + 2.4, hy + 6.6, 2.8, 2.2, cream));
  for (const [x, y] of [[hx - 5.6, hy + 8], [hx - 3, hy + 9], [hx - 0.4, hy + 9.4], [hx + 2.2, hy + 8.6]]) {
    out.push(T([[x - 1.2, y - 1], [x + 1.2, y - 1], [x + 0.2, y + 1.4 + spike]], cream));
  }

  // Ears: big and pointy, swaying a beat behind the head; the near one twitches when idle.
  const esw = walk ? Math.sin(p * 2 - 0.4) * 0.6 : 0;
  const twitch = !walk && f === 2 ? 1 : 0;
  const droop = dead ? 1 : hurt ? 0.6 : angry ? 0.35 : 0;
  const ear = (b0, b1, tip, c) => {
    const inner = [(b0[0] * 0.6 + tip[0] * 0.4 + b1[0] * 0.1) / 1.1, 0];
    const midb = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2];
    inner[1] = midb[1] * 0.55 + tip[1] * 0.45;
    return [T([b0, tip, b1], c),
      F(T([[midb[0] * 0.8 + b0[0] * 0.2, midb[1] - 0.4], [tip[0] * 0.78 + midb[0] * 0.22, tip[1] * 0.78 + midb[1] * 0.22], [midb[0] * 0.8 + b1[0] * 0.2, midb[1] - 0.4]], '#ffb7c8')),
      F(T([tip, [tip[0] * 0.75 + b0[0] * 0.25, tip[1] * 0.75 + b0[1] * 0.25], [tip[0] * 0.75 + b1[0] * 0.25, tip[1] * 0.75 + b1[1] * 0.25]], sock))];
  };
  out.push(...ear([hx - 6.4, hy - 2.4], [hx - 1.4, hy - 5.8], [hx - 6.4 + esw - droop * 5, hy - 13 + droop * 7], furD));
  out.push(E(hx, hy, 7.6, 6.6, fur));
  out.push(...ear([hx + 0.2, hy - 6.2], [hx + 5.6, hy - 3.6], [hx + 4.4 + esw + twitch * 1.6 + droop * 5, hy - 13.4 + twitch * 1 + droop * 7.5], fur));
  // Cheek fluff and the cream lower face and muzzle.
  out.push(T([[hx - 6.6, hy + 0.6], [hx - 9.4, hy + 4.8], [hx - 6.4, hy + 3.8], [hx - 7, hy + 6.6], [hx - 3.4, hy + 5.4]], fur),
    E(hx + 1.6, hy + 3.4, 5.6, 3.2, cream), E(hx + 6.4, hy + 2.8, 3.2, 2.3, cream),
    F(E(hx - 3.4, hy - 3.8, 2.2, 1.2, mix(fur, '#ffffff', 0.35))));
  // Kitsune mask markings: a forehead flame and swoops over the eyes.
  out.push(F(T([[hx + 1.4, hy - 3], [hx + 0.6, hy - 4.6], [hx + 1.3, hy - 6.2], [hx + 2.2, hy - 4.6]], mark)));
  if (!dead) {
    out.push(...stroke([[hx - 2.6, hy - 1.6], [hx - 1.6, hy - 2.4], [hx - 0.4, hy - 2.2]], 0.6, mark),
      ...stroke([[hx + 3, hy - 2.2], [hx + 4.4, hy - 2.6], [hx + 5.4, hy - 1.8]], 0.6, mark));
  }
  // Eyes.
  const ey = hy + 0.6;
  out.push(...eye(hx - 1.4, ey, 1.55, mood, -1, { iris: '#7b5bd6', glow: '#ff4f8a', lid: fur, brow: '#8a4a5a' }),
    ...eye(hx + 4.2, ey, 1.8, mood, 1, { iris: '#7b5bd6', glow: '#ff4f8a', lid: fur, brow: '#8a4a5a' }),
    ...blush(hx - 2.4, ey + 2.6, 1.1, mood), ...blush(hx + 3.6, ey + 2.8, 1.2, mood));
  // Nose and mouth on the muzzle.
  const mx = hx + 7.4;
  const my = hy + 3.6;
  out.push(F(E(hx + 9.1, hy + 1.9, 1.05, 0.8, INK)), F(E(hx + 8.8, hy + 1.6, 0.35, 0.25, '#ffffff')));
  if (angry) {
    out.push(F(T([[mx - 1.8, my - 0.2], [mx + 1.6, my - 0.6], [mx + 1, my + 1.6], [mx - 1.2, my + 1.4]], MOUTH)),
      F(T([[mx - 1.4, my - 0.2], [mx - 0.8, my - 0.25], [mx - 1.1, my + 0.9]], '#ffffff')), F(T([[mx + 0.6, my - 0.4], [mx + 1.2, my - 0.45], [mx + 0.9, my + 0.8]], '#ffffff')));
  } else if (happy) {
    out.push(F(T([[mx - 1.4, my - 0.2], [mx + 1.4, my - 0.4], [mx + 0.2, my + 1.6]], MOUTH)), F(E(mx, my + 0.9, 0.6, 0.4, '#ff8fa8')));
  } else if (hurt) {
    out.push(F(E(mx, my + 0.4, 0.6, 0.75, MOUTH)));
  } else if (dead) {
    out.push(...stroke([[mx - 1, my], [mx, my + 0.4], [mx + 1, my]], 0.4, INK), F(E(mx + 0.3, my + 1, 0.5, 0.7, '#ff8fa8')));
  } else {
    out.push(...stroke([[mx - 1, my - 0.1], [mx - 0.4, my + 0.4], [mx + 0.1, my - 0.1], [mx + 0.6, my + 0.4], [mx + 1.1, my - 0.1]], 0.38, INK));
  }
  if (angry) out.push(...stroke([[hx - 6, hy - 7.6], [hx - 7, hy - 9.4]], 0.5, '#ff8ab8'), ...stroke([[hx - 7.6, hy - 6.4], [hx - 9.4, hy - 7]], 0.5, '#ff8ab8'));
  return { w: 40, h: 32, res: 3, shapes: out.map((q) => ({ ...q, x: q.x + 4, y: q.y + 2 })) };
}

// ---------- Moss Tortoise (snailbun) ----------

function tortoise(pose, f, mood) {
  const walk = pose === 'walk';
  const p = (f / (walk ? 6 : 4)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const skin = '#a3dcc0';
  const skinD = '#86c4a6';
  const shell = '#e4bc8e';
  const shellD = '#c89a6e';
  const plate = '#efcfa4';
  const moss = '#8fd07e';
  const mossL = '#b5e8a2';
  const mossD = '#72b866';
  const out = [];
  const bob = dead ? 1.2 : walk ? -Math.abs(Math.cos(p)) * 0.6 + 0.3 : Math.sin(p) * 0.25;
  const sx = 17;
  const rim = 21 + bob;

  // Stubby elephant legs, plodding in diagonal pairs.
  const leg = (x, ph, near) => {
    const s = walk ? Math.sin(p + ph) : 0;
    const lift = walk ? Math.max(0, Math.cos(p + ph)) * 1.2 : 0;
    const fx = x + s * 1.5 + (dead ? (x < sx ? -1.5 : 1.5) : 0);
    const fy = 27.2 - lift;
    const c = near ? skin : skinD;
    const o = [...limb([x, rim - 0.5], [fx, fy - 1], 3.8, 3.4, c), E(fx + 0.3, fy - 0.2, 2.3, 1.2, c)];
    if (near) o.push(F(E(fx + 1.4, fy + 0.1, 0.45, 0.35, '#fff6e8')), F(E(fx + 0.2, fy + 0.35, 0.45, 0.35, '#fff6e8')));
    return o;
  };
  out.push(...leg(8.6, Math.PI, false), ...leg(23.2, 0, false));
  // Little tail.
  out.push(T([[5.4, rim - 1.2], [1.6 + (walk ? Math.sin(p) * 0.6 : 0), rim + 0.6], [5.4, rim + 1]], skin));

  // Head on its neck, poking out to the right (pulled in when hurt).
  const reach = hurt ? -3 : angry ? 1 : 0;
  const hx = 33.2 + reach + (walk ? Math.sin(p - 0.5) * 0.6 : 0);
  const hy = (dead ? 21.6 : 14.4) + bob + (walk ? Math.cos(p * 2) * 0.3 : Math.sin(p - 0.8) * 0.3) + (hurt ? 1.4 : 0);
  out.push(...limb([27, rim - 1.2], [hx - 2.2, hy + 1.6], 5.6, 4.8, skin));
  for (const t of [0.35, 0.65]) {
    const x = 27 + (hx - 2.2 - 27) * t;
    const y = rim - 1.2 + (hy + 1.6 - rim + 1.2) * t;
    out.push(...stroke([[x - 0.6, y - 1.8], [x + 0.6, y + 1.8]], 0.4, skinD));
  }

  // The shell: a domed carapace with scutes and a rim, then a garden on top.
  const dome = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    dome.push([sx + Math.cos(a) * 13.4, rim + Math.sin(a) * 12]);
  }
  out.push(T(dome, shell));
  for (const [x, y, w, h] of [[sx, rim - 6.8, 3.4, 3], [sx - 6.6, rim - 5, 2.8, 2.8], [sx + 6.6, rim - 5, 2.8, 2.8], [sx - 10.4, rim - 2.2, 1.6, 1.8], [sx + 10.4, rim - 2.2, 1.6, 1.8]]) {
    out.push(F(T([[x - w, y], [x - w * 0.5, y - h], [x + w * 0.5, y - h], [x + w, y], [x + w * 0.5, y + h], [x - w * 0.5, y + h]], plate)));
  }
  out.push(...stroke([[sx - 3.6, rim - 9.8], [sx - 3.6, rim - 3.6], [sx + 3.6, rim - 3.6], [sx + 3.6, rim - 9.8]], 0.4, shellD),
    ...stroke([[sx - 9.6, rim - 6.6], [sx - 3.6, rim - 6.6]], 0.4, shellD), ...stroke([[sx + 3.6, rim - 6.6], [sx + 9.6, rim - 6.6]], 0.4, shellD),
    ...stroke([[sx - 3.6, rim - 3.6], [sx - 5, rim]], 0.4, shellD), ...stroke([[sx + 3.6, rim - 3.6], [sx + 5, rim]], 0.4, shellD));
  out.push(E(sx, rim + 0.4, 14.2, 2.3, shellD));
  for (let i = 0; i < 9; i++) out.push(F(R(sx - 12 + i * 3, rim - 0.2, 0.4, 1.6, shade(shellD, -8))));

  // Moss blanket, dripping over the dome.
  const mb = rim - 9.6;
  out.push(E(sx, mb, 10.4, 3.4, moss), E(sx - 6.4, mb + 1.4, 5, 3, moss), E(sx + 6.6, mb + 1.4, 5, 3, moss));
  for (const [x, y, l] of [[sx - 9.6, mb + 2.6, 2.6], [sx - 5, mb + 3.2, 1.8], [sx + 1.2, mb + 3.2, 2.4], [sx + 7, mb + 3, 1.6], [sx + 10, mb + 2.4, 2.4]]) {
    out.push(E(x, y + l * 0.5, 1.1, l * 0.6, moss));
  }
  out.push(F(E(sx - 3, mb - 1.2, 2.4, 0.9, mossL)), F(E(sx + 5, mb - 0.4, 1.6, 0.7, mossL)), F(E(sx - 8, mb + 0.6, 1.2, 0.6, mossL)),
    F(E(sx + 2, mb + 1.4, 1.4, 0.6, mossD)), F(E(sx - 6, mb + 2.4, 1, 0.5, mossD)));
  // Grass tufts.
  for (const [x, h] of [[sx - 9, 2.4], [sx + 9.4, 2], [sx + 3.6, 1.8]]) {
    const w = walk ? Math.sin(p - 1) * 0.4 : 0;
    out.push(F(T([[x - 1, mb + 1], [x - 0.8 + w, mb - h], [x - 0.2, mb + 0.4], [x + 0.4 + w, mb - h - 0.6], [x + 0.6, mb + 0.4], [x + 1.4 + w, mb - h * 0.6], [x + 1.2, mb + 1]], mossD)));
  }
  // A spotted mushroom (puffs spores when angry).
  const mx = sx - 5.6;
  const my = mb - 1.4;
  out.push(R(mx - 0.8, my - 1, 1.6, 2.6, '#fff1dc'), T([[mx - 3, my - 0.8], [mx - 2.4, my - 2.8], [mx, my - 3.8], [mx + 2.4, my - 2.8], [mx + 3, my - 0.8]], '#ff8f8f'),
    F(E(mx - 1.2, my - 2.4, 0.55, 0.45, '#ffffff')), F(E(mx + 1, my - 2.9, 0.45, 0.4, '#ffffff')), F(E(mx + 1.8, my - 1.4, 0.35, 0.3, '#ffffff')));
  if (angry) out.push(F(E(mx - 2, my - 5.6, 0.7, 0.7, '#ffd9e0')), F(E(mx + 0.8, my - 6.8, 0.55, 0.55, '#ffd9e0')), F(E(mx - 0.6, my - 8.2, 0.45, 0.45, '#ffe8ec')));
  // The flower: a stem swaying a beat behind, a pink bloom (wilted when dead).
  const sw = walk ? Math.sin(p - 1.4) * 1.2 : Math.sin(p - 1) * 0.8;
  const fx0 = sx + 3.4;
  const fb = [fx0 + sw + (dead ? 3 : 0), mb - 7.4 + (dead ? 4 : happy ? -0.6 : 0)];
  out.push(...stroke([[fx0, mb], [fx0 + sw * 0.4, mb - 3.6], fb], 0.8, '#5fae5c'), leaf(fx0 + sw * 0.3, mb - 2.6, -20, 3.4, 1.1, '#7fcf73'), leaf(fx0 + sw * 0.3, mb - 2, 200, 2.8, 0.9, '#7fcf73'));
  const petal = dead ? '#d8b4c6' : '#ff9ec4';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2 + (walk ? sw * 0.2 : 0);
    const pr = dead ? 1.4 : happy ? 2.1 : 1.8;
    out.push(E(fb[0] + Math.cos(a) * pr, fb[1] + Math.sin(a) * pr * (dead ? 1.4 : 1) + (dead ? 1 : 0), 1.35, 1.25, petal));
  }
  out.push(F(E(fb[0], fb[1], 1, 1, '#ffe27a')), F(E(fb[0] - 0.3, fb[1] - 0.3, 0.4, 0.4, '#fff6c8')));

  // Near legs in front of the shell rim.
  out.push(...leg(11.4, 0, true), ...leg(26, Math.PI, true));

  // Head: round, with a sprout on top and a little beak-like mouth.
  out.push(E(hx, hy, 5.4, 4.8, skin), E(hx + 2.2, hy + 1.8, 3.2, 2.4, skin), F(E(hx - 1.6, hy - 2.4, 1.8, 0.8, mix(skin, '#ffffff', 0.4))));
  for (const [x, y] of [[hx - 2.6, hy - 1.6], [hx - 3.4, hy + 0.6], [hx - 1.8, hy + 2.6]]) out.push(F(E(x, y, 0.7, 0.55, skinD)));
  const spr = walk ? Math.sin(p - 1.6) * 0.6 : Math.sin(p - 1.2) * 0.4;
  out.push(...stroke([[hx - 0.4, hy - 4.4], [hx - 0.2 + spr * 0.5, hy - 6.2]], 0.5, '#5fae5c'),
    leaf(hx - 0.2 + spr * 0.5, hy - 6, -30 + spr * 15 + (dead ? 120 : 0), 2.8, 1, '#8fd07e'), leaf(hx - 0.2 + spr * 0.5, hy - 6, -160 + spr * 15 - (dead ? 30 : 0), 2.2, 0.8, '#a6e398'));
  const ey = hy - 0.2;
  out.push(...eye(hx - 0.6, ey, 1.25, mood, -1, { iris: '#4f8a6a', glow: '#ff7a3c', lid: skin, brow: '#3f6e55' }),
    ...eye(hx + 2.8, ey, 1.5, mood, 1, { iris: '#4f8a6a', glow: '#ff7a3c', lid: skin, brow: '#3f6e55' }),
    ...blush(hx - 1.6, ey + 2.2, 0.9, mood), ...blush(hx + 2.8, ey + 2.4, 1, mood));
  // Mouth.
  const mX = hx + 3.4;
  const mY = hy + 2.6;
  out.push(F(E(hx + 4.8, hy + 0.6, 0.25, 0.2, skinD)));
  if (angry) {
    out.push(F(T([[mX - 1.6, mY - 0.3], [mX + 1.9, mY - 0.6], [mX + 1.2, mY + 1.6], [mX - 1, mY + 1.2]], MOUTH)),
      F(T([[mX - 1.4, mY - 0.3], [mX + 1.8, mY - 0.6], [mX + 1.4, mY + 0.1], [mX + 0.8, mY - 0.2], [mX + 0.2, mY + 0.2], [mX - 0.4, mY - 0.1], [mX - 1, mY + 0.2]], '#fff6e8')));
  } else if (happy) {
    out.push(F(T([[mX - 1.4, mY - 0.3], [mX + 1.6, mY - 0.5], [mX + 0.3, mY + 1.5]], MOUTH)));
  } else if (hurt) {
    out.push(F(E(mX, mY + 0.3, 0.55, 0.7, MOUTH)));
  } else if (dead) {
    out.push(...stroke([[mX - 1.2, mY + 0.2], [mX - 0.4, mY - 0.1], [mX + 0.4, mY + 0.2], [mX + 1.2, mY - 0.1]], 0.38, INK));
  } else {
    out.push(arc(mX, mY - 0.5, 1.1, 0.8, 20, 160, 0.36, INK));
  }
  if (hurt) out.push(...stroke([[sx + 14, rim - 9], [sx + 15.6, rim - 10.4]], 0.5, '#9ad0ff'), ...stroke([[sx + 15.4, rim - 7], [sx + 17.4, rim - 7.6]], 0.5, '#9ad0ff'));
  return { w: 40, h: 28, res: 3, shapes: out };
}

// ---------- Mandrake (sproutling) ----------

function mandrake(pose, f, mood) {
  const walk = pose === 'walk';
  const p = (f / (walk ? 6 : 4)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const root = '#f6d6ae';
  const rootD = '#e2b88c';
  const line = '#c99b74';
  const out = [];
  // Waddle: body highest as the legs pass, swaying side to side.
  const bob = dead ? 2 : walk ? -(1 + Math.cos(p * 2)) * 0.7 + 0.4 : Math.sin(p) * 0.35;
  const sway = walk ? Math.sin(p) * 0.7 : 0;
  const bx = 15 + sway + (hurt ? -1 : 0);
  const by = 22.5 + bob;

  // Root legs, stepping.
  const leg = (x, ph, near) => {
    const s = walk ? Math.sin(p + ph) : 0;
    const lift = walk ? Math.max(0, Math.cos(p + ph)) * 1.8 : 0;
    const fx = x + s * 2.2 + (dead ? (near ? 2.4 : -2.4) : 0);
    const fy = 39.2 - lift;
    const c = near ? root : rootD;
    return [...limb([x + sway * 0.5, by + 7], [fx, fy - 1], 4, 2.8, c), E(fx + 0.8, fy - 0.3, 2.2, 1.1, c),
      ...stroke([[fx + 2.6, fy - 0.2], [fx + 3.6, fy + 0.2]], 0.6, c, false), ...stroke([[fx - 1.2, fy - 0.2], [fx - 2.2, fy + 0.4]], 0.6, c, false)];
  };
  out.push(...leg(12.4, Math.PI, false));
  // Far arm.
  const swing = walk ? Math.sin(p) * 1.6 : Math.sin(p) * 0.4;
  const armUp = angry ? 1 : happy ? 0.6 : 0;
  const hand0 = dead ? [5, by + 8] : [4.6 - armUp * 1, by + 4 + swing - armUp * 13];
  out.push(...limb([bx - 6, by - 1], hand0, 2.2, 1.6, rootD), ...stroke([[hand0[0], hand0[1]], [hand0[0] - 1.4, hand0[1] - 1]], 0.6, rootD, false), ...stroke([[hand0[0], hand0[1]], [hand0[0] - 0.8, hand0[1] + 1.4]], 0.6, rootD, false));

  // Leafy crown, swaying behind the body's motion.
  const ldead = '#b9c48a';
  const lc = [['#62b25e', -150, 9], ['#7fcf73', -122, 11.5], ['#8fd87e', -92, 12.5], ['#7fcf73', -62, 11.5], ['#62b25e', -32, 9]];
  const top = [bx, by - 9.6];
  lc.forEach(([c, a, len], k) => {
    const s = walk ? Math.sin(p - 1 - k * 0.35) * 9 : Math.sin(p - k * 0.6) * 5;
    let ang = a + s;
    if (dead) ang = a < -90 ? 160 - k * 12 : 20 + (4 - k) * 12;
    else if (happy) ang = a * 0.8 - 18;
    else if (angry) ang = -90 + (a + 90) * 1.25 + s * 1.4;
    const l = len * (dead ? 0.85 : angry ? 1.08 : 1);
    out.push(leaf(top[0], top[1], ang, l, 2.4, dead ? ldead : c));
    const tip = [top[0] + Math.cos(ang * D2R) * l * 0.8, top[1] + Math.sin(ang * D2R) * l * 0.8];
    out.push(...stroke([top, tip], 0.4, dead ? shade(ldead, -12) : shade(c, -14)));
  });
  // A sprig of lilac blossoms in the middle.
  if (!dead) {
    const fs = walk ? Math.sin(p - 1.8) * 1 : Math.sin(p - 1) * 0.6;
    const fl = [top[0] + 1 + fs, top[1] - 11];
    out.push(...stroke([[top[0], top[1]], [top[0] + 0.6 + fs * 0.5, top[1] - 6], fl], 0.6, '#5fae5c'));
    for (const [dx, dy] of [[0, 0], [-1.3, 0.9], [1.3, 0.9], [0, -1.2]]) out.push(E(fl[0] + dx, fl[1] + dy, 1.05, 1.05, '#c9a6ff'));
    out.push(F(E(fl[0], fl[1] + 0.2, 0.5, 0.5, '#fff1a8')));
  }

  // The root body: a plump parsnip with rings and root hairs.
  out.push(E(bx, by - 8.4, 4.6, 2.6, root), E(bx, by, 8.8, 10, root), E(bx + 0.5, by + 7.4, 6.4, 3.6, root));
  for (const [y, w] of [[-3.6, 6], [1.8, 7.2], [6.4, 5.4]]) out.push(arc(bx + 0.4, by + y, w, 1.6, 20, 160, 0.4, line));
  for (const [x, y, d] of [[-8.6, -1, -1], [-8, 3.4, -1], [8.6, 0.4, 1], [8, 4.4, 1]]) {
    out.push(...stroke([[bx + x, by + y], [bx + x + d * 1.4, by + y + 0.6], [bx + x + d * 2, by + y + 1.6]], 0.45, rootD));
  }
  out.push(F(E(bx - 3.6, by - 5, 2.4, 1.3, mix(root, '#ffffff', 0.45))));
  // Dangling tail root between the legs.
  const tw = walk ? Math.sin(p - 1.5) * 1.2 : 0;
  out.push(...stroke([[bx - 0.6, by + 9], [bx - 1.2 + tw * 0.5, by + 12], [bx - 0.4 + tw, by + 14.2]], 0.9, rootD, false));
  out.push(...leg(18.2, 0, true));

  // Face: big round eyes, or hollow screaming holes when angry.
  const fx = bx + 2;
  const ey = by - 1.6;
  if (angry) {
    for (const [x, s] of [[fx - 3, -1], [fx + 2.8, 1]]) {
      out.push(F(T([[x - 1.7, ey - (s < 0 ? 1.8 : 0.6)], [x + 1.7, ey - (s < 0 ? 0.6 : 1.8)], [x + 1.5, ey + 1.6], [x, ey + 2.2], [x - 1.5, ey + 1.6]], '#4a2c47')));
      out.push(F(E(x + 0.2, ey + 0.4, 0.55, 0.6, '#ffe36b')), F(E(x + 0.2, ey + 0.4, 0.25, 0.3, '#ffffff')));
      out.push(...stroke([[x - 1.9, ey - (s < 0 ? 2.8 : 1.4)], [x + 1.9, ey - (s < 0 ? 1.4 : 2.8)]], 0.7, '#8a5a40'));
    }
  } else {
    out.push(...eye(fx - 3, ey, 1.7, mood, -1, { iris: '#6b7d3a' }), ...eye(fx + 2.8, ey, 1.9, mood, 1, { iris: '#6b7d3a' }));
  }
  out.push(...blush(fx - 4.4, ey + 3, 1.3, mood), ...blush(fx + 3.6, ey + 3.2, 1.4, mood));
  const mY = ey + 4.2;
  if (angry) {
    // The scream.
    out.push(F(E(fx, mY + 1.8, 3.2, 3.8, '#5a2a44')), F(E(fx, mY + 2.6, 2.4, 2.6, '#7a3456')), F(E(fx + 0.2, mY + 4, 1.8, 1.2, '#ff8fab')));
    out.push(F(T([[fx - 2.4, mY - 0.8], [fx + 2.4, mY - 0.8], [fx + 1.8, mY + 0.1], [fx + 1.2, mY - 0.3], [fx + 0.6, mY + 0.2], [fx, mY - 0.3], [fx - 0.6, mY + 0.2], [fx - 1.2, mY - 0.3], [fx - 1.8, mY + 0.1]], '#fff8ec')));
    for (const [r, a] of [[9, 0], [11.6, 1]]) {
      const cx = fx + 2.4;
      out.push(arc(cx, mY + 1.6, r * 0.55, r * 0.7, -38 + a * 4, 38 - a * 4, 0.5, a ? '#d9a0ff' : '#ff9ec0'));
    }
  } else if (happy) {
    out.push(F(T([[fx - 1.8, mY - 0.3], [fx + 1.8, mY - 0.3], [fx, mY + 1.8]], MOUTH)), F(E(fx, mY + 1, 0.8, 0.45, '#ff8fab')));
  } else if (hurt) {
    out.push(...stroke([[fx - 1.4, mY + 0.6], [fx - 0.7, mY], [fx, mY + 0.6], [fx + 0.7, mY], [fx + 1.4, mY + 0.6]], 0.45, INK));
  } else if (dead) {
    out.push(...stroke([[fx - 1.2, mY + 0.2], [fx + 1.2, mY + 0.2]], 0.45, INK));
  } else {
    out.push(F(E(fx, mY + 0.2, 0.9, 0.7, MOUTH)), F(E(fx, mY - 0.1, 0.9, 0.35, root)));
  }
  // Near arm.
  const hand1 = dead ? [25, by + 8] : [25.6 + armUp * 1, by + 4 - swing - armUp * 13];
  out.push(...limb([bx + 6.4, by - 0.6], hand1, 2.4, 1.8, root), ...stroke([[hand1[0], hand1[1]], [hand1[0] + 1.4, hand1[1] - 1]], 0.6, root, false), ...stroke([[hand1[0], hand1[1]], [hand1[0] + 0.8, hand1[1] + 1.4]], 0.6, root, false));
  return { w: 30, h: 40, res: 3, shapes: out };
}

// ---------- Toadstool Goblin (mushkin) ----------

function goblin(pose, f, mood) {
  const walk = pose === 'walk';
  const p = (f / (walk ? 6 : 4)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const skin = '#a6dc8a';
  const skinD = '#8bc571';
  const skinL = '#c8eeb0';
  const cap = '#ff6f6f';
  const capL = '#ff9a8f';
  const gill = '#f6dcc0';
  const cloth = '#c8996a';
  const wood = '#cf9a64';
  const woodD = '#a8764c';
  const out = [];
  const bob = dead ? 2.2 : walk ? -(1 + Math.cos(p * 2)) * 0.7 + 0.5 : Math.sin(p) * 0.35;
  const rx = hurt ? -1.2 : 0;
  const bx = 18 + rx;
  const by = 33 + bob;

  // Legs: short, bowed, big bare feet.
  const leg = (x, ph, near) => {
    const s = walk ? Math.sin(p + ph) : 0;
    const lift = walk ? Math.max(0, Math.cos(p + ph)) * 1.8 : 0;
    const fx = x + s * 2.4 + (dead ? (near ? 2 : -2) : 0);
    const fy = 43.2 - lift;
    const c = near ? skin : skinD;
    return [...limb([x, by + 4], [fx, fy - 1.4], 3, 2.6, c), E(fx + 1.2, fy - 0.2, 2.8, 1.3, c), F(E(fx + 2.8, fy - 0.6, 0.5, 0.4, shade(c, -10)))];
  };
  out.push(...leg(bx - 2.6, Math.PI, false));
  // Far arm swinging opposite the near leg.
  const swing = walk ? Math.sin(p) * 1.8 : 0;
  const farHand = dead ? [bx - 8, by + 6] : [bx - 6.6 - swing, by + 3];
  out.push(...limb([bx - 4.6, by - 3.4], farHand, 2.6, 2.2, skinD), E(farHand[0], farHand[1], 1.6, 1.5, skinD));

  // Pot belly with a lighter tummy and a loincloth.
  out.push(E(bx, by, 6.8, 6, skin), E(bx + 1.6, by + 1, 4, 4, skinL), F(E(bx + 2.2, by + 1.6, 0.35, 0.35, skinD)));
  out.push(...leg(bx + 2.6, 0, true));
  const cs = walk ? Math.sin(p - 1) * 0.8 : Math.sin(p - 0.8) * 0.3;
  out.push(T([[bx - 6.2, by + 3.4], [bx + 6.4, by + 3.2], [bx + 5.2, by + 7.6 + cs * 0.3], [bx + 3.6 + cs, by + 9.4], [bx + 1.8 + cs, by + 8.4], [bx - 0.2 + cs, by + 9.6], [bx - 2.4 + cs, by + 8.4], [bx - 4.6 + cs, by + 9.2], [bx - 5.8, by + 7]], cloth));
  out.push(F(R(bx - 1.2, by + 5.6, 2.4, 2, shade(cloth, 8))), ...stroke([[bx - 1.2, by + 5.6], [bx + 1.2, by + 7.6]], 0.3, shade(cloth, -16)));
  out.push(...stroke([[bx - 6.6, by + 3], [bx, by + 3.8], [bx + 6.6, by + 2.8]], 1.2, '#8a6a4e', false), F(E(bx + 3.4, by + 3.5, 0.9, 0.8, '#ffe08a')));

  // Head.
  const nod = walk ? Math.sin(p * 2 + 0.8) * 0.4 : Math.sin(p - 0.6) * 0.3;
  const hx = 19 + rx * 1.2;
  const hy = 21.6 + bob * 0.8 + nod + (dead ? 1.4 : 0);
  // Long pointy ears out from under the cap, flicking a beat late.
  const esw = walk ? Math.sin(p * 2 - 0.6) * 0.8 : !walk && f === 2 ? -1.2 : 0;
  const ed = dead ? 4 : hurt ? 2 : angry ? -1.6 : 0;
  out.push(T([[hx - 5.8, hy - 2.8], [hx - 14.6, hy - 5.4 + esw + ed], [hx - 6, hy + 2]], skinD), F(T([[hx - 6.4, hy - 1.6], [hx - 12.4, hy - 4.4 + esw + ed], [hx - 6.6, hy + 0.8]], '#ffb8c0')));
  out.push(E(hx, hy, 7.8, 6.8, skin));
  out.push(T([[hx + 5.6, hy - 2.8], [hx + 13.4, hy - 6.2 - esw + ed], [hx + 6.6, hy + 1.6]], skin), F(T([[hx + 6.2, hy - 1.8], [hx + 11.4, hy - 5 - esw + ed], [hx + 6.6, hy + 0.4]], '#ffb8c0')));
  // Eyes, a big nose, warts and a toothy grin.
  const ey = hy + 0.2;
  const eo = { iris: '#e8a91e', glow: '#ff5a2a', lid: skin, brow: '#4f7a3c' };
  out.push(...eye(hx - 1.6, ey, 1.7, mood, -1, eo), ...eye(hx + 3.4, ey, 1.9, mood, 1, eo));
  if (!angry && mood !== 'dead' && mood !== 'hurt') out.push(...stroke([[hx - 3.4, ey - 2.6], [hx - 0.4, ey - 2.4]], 0.5, '#4f7a3c'), ...stroke([[hx + 1.8, ey - 2.4], [hx + 5, ey - 2.8]], 0.5, '#4f7a3c'));
  out.push(...blush(hx - 3.2, ey + 2.8, 1.2, mood), F(E(hx - 4.6, ey + 2, 0.4, 0.4, skinD)), F(E(hx - 3.8, ey + 3.4, 0.35, 0.35, skinD)));
  out.push(E(hx + 6.4, hy + 2.4, 2.2, 1.7, skinD), F(E(hx + 6, hy + 1.8, 0.7, 0.45, skinL)));
  const mx = hx + 2.6;
  const my = hy + 4.4;
  if (angry) {
    out.push(F(T([[mx - 3, my - 0.6], [mx + 2.6, my - 0.6], [mx + 1.8, my + 1.8], [mx - 2.2, my + 1.8]], '#7a3456')),
      F(T([[mx - 2.8, my - 0.6], [mx + 2.4, my - 0.6], [mx + 2, my + 0.1], [mx - 2.4, my + 0.1]], '#fff6e0')),
      F(T([[mx - 2.4, my + 1.8], [mx - 1.6, my - 0.6], [mx - 1, my + 1.8]], '#fff6e0')), F(T([[mx + 0.8, my + 1.8], [mx + 1.5, my - 0.4], [mx + 2, my + 1.8]], '#fff6e0')));
  } else if (happy) {
    out.push(F(T([[mx - 2.4, my - 0.5], [mx + 2.2, my - 0.5], [mx + 0.8, my + 1.8], [mx - 1.2, my + 1.6]], MOUTH)), F(R(mx - 1.8, my - 0.5, 3.6, 0.6, '#fff6e0')));
  } else if (hurt) {
    out.push(F(E(mx, my + 0.4, 0.8, 0.9, MOUTH)));
  } else if (dead) {
    out.push(...stroke([[mx - 1.8, my], [mx + 1.8, my]], 0.45, INK), F(E(mx + 0.6, my + 0.8, 0.6, 0.8, '#ff8fab')));
  } else {
    out.push(arc(mx, my - 1.2, 2.4, 1.4, 25, 155, 0.45, INK), F(T([[mx - 1.2, my + 0.1], [mx - 0.5, my + 0.1], [mx - 0.85, my - 0.9]], '#fff6e0')), F(T([[mx + 0.6, my + 0.1], [mx + 1.3, my + 0.1], [mx + 0.95, my - 0.9]], '#fff6e0')));
  }

  // The mushroom-cap helmet: gills underneath casting a shadow, a dome with white spots.
  const tilt = dead ? 3 : hurt ? -1.4 : 0;
  const cx = hx + (dead ? 2.4 : 0);
  const cy = hy - 6 + (hurt ? -1.6 : 0) + (dead ? 1.4 : 0);
  out.push(C(E(cx, cy + 0.4, 12.6, 2.1, gill)));
  for (let i = -5; i <= 5; i++) out.push(...stroke([[cx + i * 1, cy - 0.4], [cx + i * 2.1, cy + 1.6]], 0.3, shade(gill, -14)));
  const domePts = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    domePts.push([cx + Math.cos(a) * 13.6, cy + Math.sin(a) * 12.4 * (0.85 + 0.15 * Math.abs(Math.cos(a))) + Math.cos(a) * tilt]);
  }
  out.push(T(domePts, cap), F(E(cx - 4.6, cy - 7.8 - tilt * 0.4, 3.8, 1.8, capL)));
  for (const [x, y, r] of [[-7.4, -3.8, 2.1], [-1.4, -8.6, 2.6], [5, -5.6, 2], [9.8, -2.2, 1.4], [0.6, -2.8, 1.2], [-10.6, -1.3, 1], [-5, -9.4, 0.9]]) {
    out.push(F(E(cx + x, cy + y - (x / 14.6) * tilt, r, r * 0.86, '#fff6ea')), F(E(cx + x + r * 0.3, cy + y - (x / 14.6) * tilt + r * 0.35, r * 0.45, r * 0.3, '#f0e2d0')));
  }
  if (angry) out.push(...stroke([[cx + 12, cy - 12], [cx + 13.2, cy - 13.4]], 0.5, '#ff5a5a'), ...stroke([[cx + 13.6, cy - 10.6], [cx + 15.4, cy - 11]], 0.5, '#ff5a5a'));

  // Near arm and the club: resting on the shoulder, raised high when angry, dropped when dead.
  const sh = [bx + 4.4, by - 3.4];
  let hand;
  let tip;
  if (dead) {
    hand = [bx + 8, by + 6];
    tip = [bx + 17, by + 8.6];
  } else if (angry) {
    hand = [bx + 8.6, by - 9.4];
    tip = [bx + 13.6, by - 22];
  } else {
    const rock = walk ? Math.sin(p) * 0.9 : Math.sin(p) * 0.3;
    hand = [bx + 7.4 + swing * 0.6, by + 1.6 + rock * 0.3];
    tip = [bx + 13.8 + swing * 0.3 + rock, by - 12.4];
  }
  const dx = tip[0] - hand[0];
  const dy = tip[1] - hand[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const at = (t) => [hand[0] + dx * t, hand[1] + dy * t];
  out.push(...limb(at(-0.18), at(0.62), 1.6, 2.6, wood), O(tip[0] - ux * 2, tip[1] - uy * 2, 4.8, 3.6, Math.atan2(dy, dx) / D2R, wood),
    F(E(tip[0] - ux * 2.4 - uy * 1.4, tip[1] - uy * 2.4 + ux * 1.4, 0.9, 0.7, woodD)), F(E(tip[0] - ux * 0.6 + uy * 1.2, tip[1] - uy * 0.6 - ux * 1.2, 0.7, 0.55, woodD)),
    F(E(tip[0] - ux * 3.8 + uy * 1.6, tip[1] - uy * 3.8 - ux * 1.6, 0.5, 0.5, '#d8d4e4')), F(E(tip[0] - ux * 1.4 - uy * 2.6, tip[1] - uy * 1.4 + ux * 2.6, 0.5, 0.5, '#d8d4e4')),
    F(E(tip[0] - ux * 2.6 + uy * 2.4, tip[1] - uy * 2.6 - ux * 2.4, 0.5, 0.5, '#d8d4e4')));
  for (const t of [0.12, 0.24]) out.push(...stroke([[at(t)[0] - uy * 1, at(t)[1] + ux * 1], [at(t)[0] + uy * 1, at(t)[1] - ux * 1]], 0.5, '#8a6a4e'));
  out.push(...limb(sh, hand, 2.8, 2.4, skin), E(hand[0], hand[1], 1.8, 1.7, skin), F(E(hand[0] + 0.6, hand[1] - 0.6, 0.6, 0.5, skinL)));
  return { w: 38, h: 44, res: 3, shapes: out };
}

// ---------- Jackalope (piglet) ----------

// The hop, frame by frame: lift off the ground, hind legs extended, front legs reaching, ears swept.
const HOP = [
  { lift: 0, squash: 1, hind: 0, reach: 0, ear: 0, tilt: 0.6 },
  { lift: 1.8, squash: 0, hind: 1, reach: 0.4, ear: 1, tilt: -1.2 },
  { lift: 4.4, squash: -1, hind: 0.8, reach: 1, ear: 1.4, tilt: -1.6 },
  { lift: 5, squash: -0.4, hind: 0.2, reach: 0.6, ear: 0.6, tilt: 0 },
  { lift: 2.6, squash: 0, hind: 0, reach: 1, ear: -0.6, tilt: 1.2 },
  { lift: 0.5, squash: 0.6, hind: 0, reach: 0.2, ear: -0.4, tilt: 1 },
];

function jackalope(pose, f, mood) {
  const walk = pose === 'walk';
  const p = (f / 4) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const fur = '#efcca8';
  const furD = '#d9b18c';
  const cream = '#fff4e6';
  const earIn = '#ffb3c6';
  const ant = '#f3e6cc';
  const antD = '#d9c49e';
  const hop = walk ? HOP[f] : { lift: 0, squash: Math.sin(p) * 0.4, hind: 0, reach: 0, ear: 0, tilt: 0 };
  const out = [];
  const L = dead ? -2 : hop.lift;
  const rx = hurt ? -1.4 : 0;
  const bx = 17 + rx;
  const by = 26.4 - L + hop.squash * 0.5;

  // Cotton tail.
  const tw = walk ? -hop.ear * 0.6 : !walk && f === 1 ? 0.8 : 0;
  out.push(E(bx - 9.6, by - 2.6 + tw, 2.8, 2.6, '#ffffff'), E(bx - 11, by - 3.6 + tw, 1.6, 1.5, '#ffffff'), E(bx - 10.8, by - 1.2 + tw, 1.5, 1.4, '#ffffff'));
  // Far legs (darker).
  const hindFoot = (near) => {
    const k = hop.hind;
    const fx = (near ? 13.2 : 10.6) + rx - k * 4.6 + (walk && hop.lift > 0 && k === 0 ? 2 : 0);
    const fy = Math.min(34.8, (34.8 - L * 0.55) + k * 0.6);
    return [fx, fy, k * 50];
  };
  const front = (near) => {
    const sx = bx + (near ? 6.6 : 5);
    const reach = hop.reach;
    return [[sx, by + 1.4], [sx + 1 + reach * 3.4 + (near ? 0.6 : 0), Math.min(35, by + 7.6 - reach * 1.6)]];
  };
  {
    const [fx, fy, a] = hindFoot(false);
    out.push(...limb([bx - 6, by + 2.6], [fx + 2, fy - 1.2], 3, 2.4, furD), O(fx + 2.6, fy, 3.6, 1.3, a, furD));
    const [s, h] = front(false);
    out.push(...limb(s, h, 2.2, 1.8, furD), E(h[0] + 0.5, h[1] - 0.2, 1.5, 1, furD));
  }
  // Body: haunch, barrel, cream chest fluff.
  const sq = hop.squash;
  out.push(E(bx, by, 9.6 + sq * 0.4, 6.4 - sq * 0.5, fur), E(bx - 4.6, by + 1.2, 5.6, 5.4 - sq * 0.3, fur), F(E(bx - 6, by - 2, 2.4, 1.2, mix(fur, '#ffffff', 0.35))));
  out.push(...stroke([[bx - 7.6, by + 3.2], [bx - 4, by + 5.4], [bx - 0.6, by + 4.6]], 0.4, furD));
  out.push(E(bx + 6.2, by + 1.6, 3.8, 4.2, cream));
  {
    const [fx, fy, a] = hindFoot(true);
    out.push(...limb([bx - 3.6, by + 3.4], [fx + 2, fy - 1.2], 3.2, 2.4, fur), O(fx + 2.8, fy, 4, 1.4, a, fur), F(E(fx + 5.4 - a / 30, fy + 0.2 + a / 40, 0.5, 0.4, furD)));
    const [s, h] = front(true);
    out.push(...limb(s, h, 2.4, 2, fur), E(h[0] + 0.6, h[1] - 0.2, 1.7, 1.1, cream));
  }

  // Head, tilting with the hop (nose up on the push, down on landing).
  const hx = 27.4 + rx * 1.1 + (dead ? -1 : 0);
  const hy = 17 - L + hop.tilt * 0.5 + (walk ? 0 : Math.sin(p - 0.7) * 0.3) + (dead ? 3 : 0) + (hurt ? -0.4 : 0);
  // Ears: long, swept back on the rise, flopping forward on landing; flat when angry, limp when dead.
  const eb = walk ? hop.ear : 0;
  const twitch = !walk && f === 2 ? 1 : 0;
  const flat = angry ? 1 : hurt ? 0.8 : dead ? 1.6 : happy ? -0.3 : 0;
  const earTip = (bx0, by0, len, a0) => {
    const a = (a0 - eb * 10 - flat * 32 + (dead ? -60 : 0)) * D2R;
    return [bx0 + Math.cos(a) * len, by0 + Math.sin(a) * len];
  };
  const farB = [hx - 3.2, hy - 4.4];
  const farT = earTip(farB[0], farB[1], 11, -112);
  out.push(seg(farB, farT, 2.3, furD), seg([farB[0] * 0.85 + farT[0] * 0.15, farB[1] * 0.85 + farT[1] * 0.15], farT, 1.2, shade(earIn, -8)));
  // Antlers (behind the near ear, in front of the far one): branching tines, a clover tied on.
  const antler = (x, y, c, k) => {
    const g = [x + 2.2 * k, y - 6];
    const t = [x + 1.8 * k, y - 10.4];
    return [...limb([x, y], g, 1.6, 1.3, c), ...limb(g, t, 1.3, 0.9, c), ...limb([x + 1 * k, y - 3], [x - 1.6 * k, y - 5.4], 1.1, 0.8, c),
      ...limb(g, [x + 5.4 * k, y - 7.6], 1.1, 0.8, c), ...limb([x + 2 * k, y - 8.6], [x - 0.4 * k, y - 11], 0.9, 0.7, c)];
  };
  out.push(...antler(hx - 0.6, hy - 5, antD, 0.85));
  out.push(E(hx, hy, 7, 6.2, fur));
  out.push(...antler(hx + 2, hy - 5.2, ant, 1));
  if (!dead) {
    const cx = hx + 7.2;
    const cy = hy - 12.6;
    out.push(...stroke([[cx - 0.2, cy + 0.6], [cx + 0.6, cy + 2.6]], 0.35, '#5fae5c'));
    for (const a of [-90, 30, 150]) out.push(F(E(cx + Math.cos(a * D2R) * 0.9, cy + Math.sin(a * D2R) * 0.9, 0.8, 0.8, '#7fcf73')));
    out.push(F(E(cx, cy, 0.35, 0.35, '#b5e8a2')));
  }
  const nearB = [hx + 0.4, hy - 5];
  const nearT = earTip(nearB[0], nearB[1], 12.4 - twitch * 1.4, -104 - twitch * 14);
  out.push(seg(nearB, nearT, 2.6, fur), seg([nearB[0] * 0.8 + nearT[0] * 0.2, nearB[1] * 0.8 + nearT[1] * 0.2], nearT, 1.4, earIn));
  // Cheek fluff, muzzle, whiskers.
  out.push(T([[hx - 5.6, hy + 1], [hx - 8.4, hy + 3.4], [hx - 5.6, hy + 3.6], [hx - 6.6, hy + 6], [hx - 2.6, hy + 5.4]], fur),
    E(hx + 4.4, hy + 2.6, 3.4, 2.6, cream), F(E(hx - 2.6, hy - 3.6, 2, 1, mix(fur, '#ffffff', 0.35))));
  const tw2 = !walk && f === 3 ? -0.3 : 0;
  out.push(F(T([[hx + 6.8, hy + 1.1 + tw2], [hx + 8.2, hy + 1.1 + tw2], [hx + 7.5, hy + 2 + tw2]], '#ff7f9f')));
  for (const [a, b] of [[0.6, -0.4], [1.6, 0.8]]) out.push(...stroke([[hx + 7.2, hy + 2 + a * 0.4], [hx + 10.6, hy + 1.6 + b + tw2]], 0.25, '#b08a74'));
  const ey = hy - 0.2;
  const eo = { iris: '#9a5a3a', glow: '#ff3d6e', lid: fur, brow: '#8a5a44' };
  out.push(...eye(hx - 0.8, ey, 1.6, mood, -1, eo), ...eye(hx + 3.6, ey, 1.9, mood, 1, eo), ...blush(hx - 1.4, ey + 2.8, 1.1, mood), ...blush(hx + 3.8, ey + 3, 1.1, mood));
  const mx = hx + 6.8;
  const my = hy + 3.2;
  if (angry) {
    out.push(F(T([[mx - 1.8, my - 0.4], [mx + 1.2, my - 0.4], [mx + 0.8, my + 1.8], [mx - 1.4, my + 1.6]], MOUTH)), F(R(mx - 1, my - 0.4, 1.6, 1.4, '#ffffff')), F(R(mx - 0.25, my - 0.4, 0.2, 1.4, '#e6dce8')));
  } else if (happy) {
    out.push(...stroke([[mx - 1.4, my - 0.4], [mx - 0.7, my + 0.3], [mx, my - 0.3], [mx + 0.7, my + 0.3]], 0.4, INK), F(E(mx - 0.4, my + 0.9, 0.7, 0.5, '#ff8fab')));
  } else if (hurt) {
    out.push(F(E(mx - 0.3, my + 0.3, 0.6, 0.7, MOUTH)));
  } else if (dead) {
    out.push(...stroke([[mx - 1.2, my], [mx + 0.6, my]], 0.4, INK));
  } else {
    out.push(...stroke([[mx - 1.4, my - 0.4], [mx - 0.7, my + 0.3], [mx, my - 0.3], [mx + 0.7, my + 0.3]], 0.38, INK), F(R(mx - 0.75, my + 0.25, 1, 0.9, '#ffffff')));
  }
  if (angry) out.push(...stroke([[hx - 7, hy - 7], [hx - 8.4, hy - 8.4]], 0.5, '#ff6b8a'), ...stroke([[hx - 7.8, hy - 5.4], [hx - 9.6, hy - 5.8]], 0.5, '#ff6b8a'));
  return { w: 40, h: 36, res: 3, shapes: out };
}

export const ART = {
  puffle: { walk: 6, idle: 4, draw: kitsune },
  snailbun: { walk: 6, idle: 4, draw: tortoise },
  sproutling: { walk: 6, idle: 4, draw: mandrake },
  mushkin: { walk: 6, idle: 4, draw: goblin },
  piglet: { walk: 6, idle: 4, draw: jackalope },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  puffle: { name: 'Kitsune Kit', w: 22, h: 20 },
  snailbun: { name: 'Moss Tortoise', w: 32, h: 22 },
  sproutling: { name: 'Mandrake', w: 18, h: 28 },
  mushkin: { name: 'Toadstool Goblin', w: 24, h: 34 },
  piglet: { name: 'Jackalope', w: 26, h: 24 },
};
