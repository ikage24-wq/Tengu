// Monster art: hollow. Rootwood Hollow's minions, the creatures of a giant tree gone sour: root
// imps, mushroom shamans, bramble bears, spore mites, and the corrupted saplings that feed its
// heart. Bark and fungus in soft browns, lilacs, and mossy greens, with the corruption showing as
// glowing teal eyes and purple veins.

import { E, T, F, C, shade, mix, INK, BLUSH, MOUTH, arc, stroke } from './kit.js';

const TAU = Math.PI * 2;
const TEAL = '#5ff0d6';
const TEAL_HI = '#d9fff8';
const PURP = '#b86cff';
const PURP_HI = '#f1ddff';
const SOCKET = '#2b2040';
const BONE = '#f1e5cc';
const FANG = '#fffaf0';
const GUM = '#4a2440';

// ---------- Helpers ----------

const lineOf = (c) => mix(shade(c, -38), INK, 0.45);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// A polyline as one tapering polygon: width w0 at the start and w1 at the end.
function taper(pts, w0, w1, c) {
  const n = pts.length;
  const d = [0];
  for (let i = 1; i < n; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = d[n - 1] || 1;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / dl;
    const ny = (b[0] - a[0]) / dl;
    const w = (w0 + (w1 - w0) * (d[i] / len)) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return T([...left, ...right.reverse()], c);
}

// Pushes both ends of a polyline out by e.
function ext(pts, e) {
  const n = pts.length;
  const out = pts.map((p) => [...p]);
  const push = (i, j) => {
    const dx = pts[i][0] - pts[j][0];
    const dy = pts[i][1] - pts[j][1];
    const l = Math.hypot(dx, dy) || 1;
    out[i] = [pts[i][0] + (dx / l) * e, pts[i][1] + (dy / l) * e];
  };
  push(0, 1);
  push(n - 1, n - 2);
  return out;
}

// A tapered limb with its own thin line around it, so it reads in front of the body.
const limb = (pts, w0, w1, c, line = lineOf(c)) => [F(taper(ext(pts, 0.45), w0 + 1, w1 + 1, line)), taper(pts, w0, w1, c)];
// An ellipse with its own thin line.
const oval = (x, y, rx, ry, c, line = lineOf(c)) => [F(E(x, y, rx + 0.5, ry + 0.5, line)), E(x, y, rx, ry, c)];
const flatLine = (pts, th, c) => stroke(pts, th, c);

// Glowing eyes. list: [x, y, r]; cx is the middle of the face (brows slant toward it); skin is the
// color around the eyes (the angry brow carves into the eye with it).
function eyes(list, mood, { cx, skin, glow = TEAL, core = TEAL_HI, socket = SOCKET, ink = INK, brow = INK, flare = true, shine = true } = {}) {
  const out = [];
  for (const [x, y, r] of list) {
    const inw = Math.sign(cx - x) || 1;
    switch (mood) {
      case 'blink':
        out.push(arc(x, y - 0.2 * r, r * 1.05, r * 0.75, 15, 165, 0.55, ink));
        break;
      case 'happy':
        out.push(arc(x, y + 0.7 * r, r * 1.05, r * 1.0, 195, 345, 0.6, ink));
        break;
      case 'hurt':
        out.push(...flatLine([[x - inw * r, y - r], [x + inw * 0.8 * r, y], [x - inw * r, y + r]], 0.6, ink));
        break;
      case 'dead':
        out.push(...flatLine([[x - 0.9 * r, y - 0.9 * r], [x + 0.9 * r, y + 0.9 * r]], 0.55, ink), ...flatLine([[x - 0.9 * r, y + 0.9 * r], [x + 0.9 * r, y - 0.9 * r]], 0.55, ink));
        break;
      default: {
        const a = mood === 'angry';
        if (a && flare) {
          // Flames of glow streaming off the outer corner.
          out.push(F(T([[x - inw * 0.9 * r, y - 0.6 * r], [x - inw * 2.6 * r, y - 1.9 * r], [x - inw * 1.6 * r, y - 0.2 * r], [x - inw * 2.3 * r, y + 0.2 * r], [x - inw * 1.0 * r, y + 0.5 * r]], glow)));
        }
        out.push(F(E(x, y, r * 1.18, r * 1.28, socket)));
        out.push(F(E(x + 0.05 * r, y + 0.05 * r, r * (a ? 1.05 : 0.9), r * (a ? 1.05 : 1.02), glow)));
        out.push(F(E(x + 0.12 * r, y + 0.22 * r, r * 0.46, r * 0.52, core)));
        if (a) {
          out.push(F(E(x + 0.1 * r, y + 0.1 * r, r * 0.2, r * 0.72, socket)));
          // The brow carves the top of the eye into a fierce slant.
          out.push(F(T([[x - inw * 1.7 * r, y - 2.6 * r], [x + inw * 1.7 * r, y - 2.6 * r], [x + inw * 1.7 * r, y - 0.05 * r], [x - inw * 1.7 * r, y - 1.25 * r]], skin)));
          out.push(...flatLine([[x - inw * 1.7 * r, y - 1.45 * r], [x + inw * 1.6 * r, y - 0.2 * r]], 0.75, brow));
        } else if (shine) {
          out.push(F(E(x - 0.35 * r, y - 0.42 * r, r * 0.34, r * 0.34, '#ffffff')));
        }
      }
    }
  }
  return out;
}

// Drifting spore motes: a glowing dot with a bright center.
const mote = (x, y, r, c = TEAL) => [F(E(x, y, r, r, c)), F(E(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.45, '#ffffff'))];

// ---------- Root Imp (rootling) ----------
// A little horned demon of twisted roots: a knotty face with glowing eyes, a root beard, claw
// hands of thorn, a spade-leaf tail, and corruption glowing through the cracks in its chest.

function rootImp(pose, f, mood) {
  const walk = pose === 'walk';
  const p = walk ? (f / 6) * TAU : 0;
  const it = walk ? 0 : (f / 4) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const bark = '#a97c5e';
  const barkD = '#83604a';
  const head = '#bb8f6c';
  const horn = '#7a5a48';
  const lineD = '#5e4232';
  const bob = walk ? -1.1 * Math.cos(p) ** 2 + 0.55 : Math.sin(it) * 0.35;
  const breathe = walk ? 0 : (1 + Math.sin(it)) * 0.3;
  const by = bob + (dead ? 1.4 : 0);
  const hx = hurt ? -1.4 : 0;
  const hy = (dead ? 1.8 : hurt ? -0.5 : 0) + (walk ? Math.sin(p * 2 + 0.6) * 0.15 : Math.sin(it - 0.5) * 0.25);
  const glow = dead ? '#9a93a6' : TEAL;
  const pglow = dead ? '#a59ab3' : PURP;
  const out = [];

  // Tail: a root curling up behind, tipped with a corrupted spade leaf.
  const tw = walk ? Math.sin(p) * 1.2 : Math.sin(it) * 0.8;
  const tip = dead ? [2.6, 31] : [2.8 + tw * 0.4, 20.5 + tw];
  out.push(...limb([[10.5, 29 + by], [6, 29 + by], [3.4, 26 + by * 0.5 + tw * 0.3], tip], 2.2, 0.8, barkD));
  out.push(F(T([[tip[0], tip[1] + 0.6], [tip[0] - 2.4, tip[1] - 1.2], [tip[0] - 0.2, tip[1] - 3.8], [tip[0] + 2, tip[1] - 1.2]], lineOf(pglow))));
  out.push(F(T([[tip[0], tip[1]], [tip[0] - 1.7, tip[1] - 1.3], [tip[0] - 0.1, tip[1] - 3.1], [tip[0] + 1.4, tip[1] - 1.3]], pglow)));
  out.push(F(E(tip[0] - 0.1, tip[1] - 1.5, 0.45, 0.6, PURP_HI)));

  // Legs: root legs with splayed root toes.
  const leg = (hipX, q, c) => {
    const sw = walk ? Math.sin(q) : 0;
    const lift = walk ? Math.max(0, Math.cos(q)) * 2.3 : 0;
    const fx = hipX + sw * 3.3 + (dead ? (hipX < 16 ? -1.5 : 1.5) : 0);
    const fy = 36.3 - lift;
    const hip = [hipX, 30.4 + by];
    const knee = [(hip[0] + fx) / 2 + 1.4, (hip[1] + fy) / 2];
    return [
      ...limb([[fx, fy], [fx - 1.6, fy + 1.1], [fx - 2.8, fy + 1.3]], 1.6, 0.4, c),
      ...limb([hip, knee, [fx, fy]], 3.8, 2.8, c),
      ...limb([[fx - 0.3, fy], [fx + 1.7, fy + 0.9], [fx + 3.7, fy + 1.3]], 2.3, 0.5, c),
      ...limb([[fx + 0.4, fy + 0.2], [fx + 1.4, fy + 1.1], [fx + 2.2, fy + 1.4]], 1.4, 0.4, c),
    ];
  };
  // Arms: a twisted root arm ending in three thorn claws.
  const arm = (sx, sy, q, c, front) => {
    let hand;
    if (dead) hand = [sx + 0.8, sy + 6];
    else if (hurt) hand = [sx - 3.4, sy - 2.6];
    else if (angry) hand = front ? [sx + 5.6, sy - 2.4 + Math.sin(p) * 0.6] : [sx + 4, sy - 3.6];
    else {
      const a = walk ? Math.sin(q) * 0.75 : 0.25 + Math.sin(it) * 0.08;
      hand = [sx + Math.sin(a) * 5.4, sy + Math.cos(a) * 5.4];
    }
    const elbow = [lerp([sx, sy], hand, 0.5)[0] - 0.8, lerp([sx, sy], hand, 0.5)[1] + 0.4];
    const dx = hand[0] - elbow[0];
    const dy = hand[1] - elbow[1];
    const base = Math.atan2(dy, dx);
    const res = [...limb([[sx, sy], elbow, hand], 2.8, 2.1, c)];
    for (const k of [-1, 0, 1]) {
      const a = base + k * 0.55 - (angry && !dead ? 0.5 : 0);
      const l = k === 0 ? 3.2 : 2.6;
      const m = [hand[0] + Math.cos(a) * l * 0.55, hand[1] + Math.sin(a) * l * 0.55];
      const t2 = [hand[0] + Math.cos(a + 0.35) * l, hand[1] + Math.sin(a + 0.35) * l];
      res.push(...limb([hand, m, t2], 1.2, 0.1, front ? BONE : shade(BONE, -12)));
    }
    res.push(...oval(hand[0], hand[1], 1.5, 1.4, c));
    return res;
  };

  out.push(...leg(14.6, p + Math.PI, barkD));
  out.push(...arm(13.4, 23.6 + by, p, barkD, false));

  // Back ear and back horn sit behind the head.
  const hcx = 17.6 + hx;
  const hcy = 14.2 + by + hy;
  out.push(...limb([[hcx - 7.4, hcy - 1], [hcx - 11.2, hcy - 3], [hcx - 13.4, hcy - 5.4 + (walk ? Math.sin(p) * 0.4 : 0)]], 3.8, 0.3, barkD));
  out.push(...limb([[hcx - 3.6, hcy - 6.6], [hcx - 5.6, hcy - 10.4], [hcx - 9, hcy - 12.4], [hcx - 10.6, hcy - 11.4]], 3, 0.4, shade(horn, -8)));
  out.push(F(E(hcx - 10.4, hcy - 11.6, 0.7, 0.7, pglow)));

  // Body: a knot of roots with corruption glowing through.
  out.push(E(16.6, 27 + by, 6.6, 6.2 + breathe * 0.5, bark), E(16.4, 30.4 + by, 5.4, 3.2, bark));
  out.push(...flatLine([[11, 24.4 + by], [13.6, 26.6 + by], [12.4, 30.6 + by]], 0.55, barkD), ...flatLine([[21.4, 25 + by], [19.6, 28.6 + by], [21, 31.4 + by]], 0.55, barkD));
  out.push(...flatLine([[14.8, 31.6 + by], [16.2, 29.6 + by], [18.4, 31.8 + by]], 0.5, barkD));
  out.push(...flatLine([[16.6, 23.6 + by], [17.6, 25.2 + by], [16.8, 27.4 + by], [18, 29.2 + by]], 0.6, pglow));
  out.push(F(E(17.6, 26.4 + by, 1.5, 1.7, pglow)), F(E(17.5, 26.2 + by, 0.7, 0.8, PURP_HI)));

  out.push(...leg(18.8, p, bark));

  // Head: big and knotty, with a root beard.
  for (const [x, l] of [[-1.6, 3.6], [0.6, 4.6], [2.6, 3.4]]) {
    const s = walk ? Math.sin(p + x) * 0.5 : Math.sin(it + x) * 0.3;
    out.push(...limb([[hcx + 3.4 + x, hcy + 5.4], [hcx + 3 + x + s, hcy + 5.4 + l * 0.6], [hcx + 3.6 + x + s * 1.6, hcy + 5.4 + l]], 1.5, 0.3, barkD));
  }
  out.push(C(E(hcx, hcy, 9.8, 8.4, head)), C(E(hcx + 3.6, hcy + 3.6, 6.4, 4.4, head)), E(hcx - 6.4, hcy - 4.2, 2.8, 2.6, head));
  // Bark texture: forehead grain and a knot on the cheek.
  out.push(...flatLine([[hcx - 7.6, hcy - 2.6], [hcx - 5.6, hcy - 4.8], [hcx - 3.2, hcy - 5.6]], 0.45, barkD));
  out.push(...flatLine([[hcx - 8.6, hcy + 1.6], [hcx - 6.8, hcy - 0.2], [hcx - 6.8, hcy - 2]], 0.45, barkD));
  out.push(...flatLine([[hcx - 1, hcy - 7.2], [hcx + 1.2, hcy - 6.2], [hcx + 3.8, hcy - 6.8]], 0.45, barkD));
  out.push(F(E(hcx - 4.4, hcy + 3.4, 1.4, 1.2, barkD)), F(E(hcx - 4.3, hcy + 3.5, 0.7, 0.6, lineD)));
  out.push(F(E(hcx - 3.4, hcy - 4.6, 2.2, 1.0, mix(head, '#ffffff', 0.28))));
  // Glowing fungus on the brow.
  out.push(F(E(hcx - 6.6, hcy - 5.6, 1.3, 0.8, shade(glow, -14))), F(E(hcx - 6.6, hcy - 5.8, 0.8, 0.45, TEAL_HI)));

  // Face.
  const ex1 = hcx + 1.2;
  const ex2 = hcx + 6.6;
  const ey = hcy + 0.8;
  if (!angry && !dead) {
    out.push(...flatLine([[ex1 - 1.8, ey - 2.6], [ex1, ey - 3.1], [ex1 + 1.6, ey - 2.5]], 0.5, lineD), ...flatLine([[ex2 - 1.4, ey - 2.5], [ex2 + 0.2, ey - 3.1], [ex2 + 1.6, ey - 2.4]], 0.5, lineD));
  }
  out.push(...eyes([[ex1, ey, 1.85], [ex2, ey, 1.75]], mood, { cx: (ex1 + ex2) / 2, skin: head, glow, brow: lineD }));
  if (mood === 'idle' || mood === 'blink' || mood === 'happy') out.push(F(E(ex1 - 0.8, ey + 2.6, 1.1, 0.5, BLUSH)), F(E(ex2 + 0.9, ey + 2.6, 0.9, 0.45, BLUSH)));
  const mx = hcx + 4.2;
  const my = hcy + 5;
  switch (mood) {
    case 'angry':
      out.push(F(E(mx, my, 2.9, 1.8, GUM)), F(E(mx, my + 0.9, 1.6, 0.7, MOUTH)));
      for (const k of [-2, -0.7, 0.7, 2]) out.push(F(T([[mx + k - 0.55, my - 1.4], [mx + k + 0.55, my - 1.4], [mx + k, my - 0.1]], FANG)));
      for (const k of [-1.3, 1.3]) out.push(F(T([[mx + k - 0.5, my + 1.5], [mx + k + 0.5, my + 1.5], [mx + k, my + 0.4]], FANG)));
      break;
    case 'happy':
      out.push(F(T([[mx - 2.2, my - 0.6], [mx + 2.2, my - 0.6], [mx + 1.2, my + 1.2], [mx - 1.2, my + 1.2]], GUM)), F(E(mx, my + 0.8, 1.2, 0.5, MOUTH)));
      out.push(F(T([[mx - 1.6, my - 0.6], [mx - 0.6, my - 0.6], [mx - 1.1, my + 0.5]], FANG)), F(T([[mx + 0.6, my - 0.6], [mx + 1.6, my - 0.6], [mx + 1.1, my + 0.5]], FANG)));
      break;
    case 'hurt':
      out.push(F(E(mx, my + 0.2, 1.1, 1.3, GUM)), F(E(mx, my + 0.7, 0.6, 0.5, MOUTH)));
      break;
    case 'dead':
      out.push(...flatLine([[mx - 1.8, my], [mx - 0.6, my - 0.6], [mx + 0.6, my], [mx + 1.8, my - 0.6]], 0.45, INK), F(E(mx + 0.8, my + 0.7, 0.7, 0.9, '#ff8fa8')));
      break;
    default:
      out.push(arc(mx, my - 1.1, 1.8, 1.4, 25, 155, 0.5, INK), F(T([[mx + 0.3, my + 0.1], [mx + 1.2, my - 0.1], [mx + 0.8, my + 1.1]], FANG)));
  }

  // Front horn: a twisted root curling back, its tip glowing.
  out.push(...limb([[hcx + 1.2, hcy - 7], [hcx + 1.4, hcy - 10.6], [hcx - 0.6, hcy - 13.2], [hcx - 3, hcy - 13.8]], 3.2, 0.5, horn));
  out.push(...flatLine([[hcx + 0.2, hcy - 8.4], [hcx + 2, hcy - 9]], 0.45, lineD), ...flatLine([[hcx + 0.2, hcy - 11], [hcx + 1.4, hcy - 12.2]], 0.45, lineD));
  out.push(F(E(hcx - 2.7, hcy - 13.8, 0.75, 0.7, pglow)), F(E(hcx - 2.8, hcy - 13.9, 0.35, 0.35, PURP_HI)));
  // Front ear tucked by the horn.
  out.push(...limb([[hcx + 7.6, hcy - 3.2], [hcx + 10, hcy - 5.6], [hcx + 11.4, hcy - 7.4 + (walk ? Math.sin(p + 1) * 0.4 : 0)]], 2.8, 0.3, head));

  out.push(...arm(20.6, 23.8 + by, p + Math.PI, bark, true));
  return { w: 34, h: 38, res: 3, shapes: out };
}

// ---------- Myconid Shaman (sporecap) ----------
// A mushroom-folk caster: a floppy-tipped frilled cap with glowing spots, a leaf mantle and a
// beaded necklace, war paint under its eyes, and a gnarled staff topped with a glowing spore pod in
// a cage of roots. Its walk is a ritual march: the staff rises overhead and swings forward, so the
// same frames read as the cast when it lobs spores.

function myconid(pose, f, mood) {
  const walk = pose === 'walk';
  const p = walk ? (f / 6) * TAU : 0;
  const it = walk ? 0 : (f / 4) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const stem = '#f4e6d0';
  const stemD = '#e2cdb0';
  const cap = '#8b6dd0';
  const capHi = '#a88ee2';
  const frill = '#f5c6dc';
  const gill = '#c99bc8';
  const wood = '#8a6a52';
  const raise = dead ? 0 : walk ? (1 - Math.cos(p)) / 2 : angry ? 0.6 : 0.08 + 0.06 * Math.sin(it);
  const bob = walk ? -0.9 * Math.cos(p * 2) * 0.5 - 0.45 * raise : Math.sin(it) * 0.4;
  const by = bob + (dead ? 1.6 : 0);
  const breathe = walk ? 0 : (1 + Math.sin(it)) * 0.25;
  const hx = hurt ? -1.4 : 0;
  const glow = dead ? '#a49cb0' : TEAL;
  const out = [];

  // Staff (behind the body until the hand grips it): gnarled wood with a caged spore pod.
  const lean = hurt ? -2.4 : dead ? 4 : 0;
  const bot = [29.6 + raise * 1.6 + lean * 0.3, 43.6 - raise * 5.2];
  const top = [28.8 + raise * 3.4 + lean, 14 - raise * 5.6 + (dead ? 4 : 0)];
  const staffPts = [];
  for (let i = 0; i <= 6; i++) {
    const q = lerp(bot, top, i / 6);
    staffPts.push([q[0] + Math.sin(i * 1.9) * 0.45, q[1]]);
  }

  // Back foot, back arm.
  const foot = (x, q, c) => {
    const lift = walk ? Math.max(0, Math.cos(q)) * 2 : 0;
    const fx = x + (walk ? Math.sin(q) * 2.2 : 0);
    const fy = 42.4 - lift;
    return [...limb([[x, 38 + by], [fx, fy - 0.6]], 2.8, 2.6, c), ...oval(fx + 0.6, fy, 2.7, 1.5, c)];
  };
  out.push(...foot(14, p + Math.PI, stemD));
  const bsx = 11.6;
  const bsy = 30.6 + by;
  const bh = dead ? [bsx - 0.6, bsy + 5.6] : hurt ? [bsx - 4, bsy - 2] : [bsx - 2.2 - raise * 1.2, bsy + 4.4 - raise * 9];
  out.push(...limb([[bsx, bsy], lerp([bsx, bsy], bh, 0.5).map((v, i) => v - (i ? 0 : 0.8)), bh], 2.6, 2, stemD), ...oval(bh[0], bh[1], 1.4, 1.4, stemD));
  if (raise > 0.5) {
    // The free hand flares open as the staff goes up, sparking.
    out.push(...mote(bh[0] - 1.6, bh[1] - 2, 0.7, glow), ...mote(bh[0] + 0.6, bh[1] - 3, 0.5, PURP));
  }
  out.push(...foot(20, p, stemD));

  // Body: a stout stem with a leaf mantle and beads.
  out.push(E(17, 34.4 + by, 7.6, 8.2 + breathe, stem), E(17, 38.6 + by, 7, 3.6, stem));
  out.push(F(E(19, 36 + by, 3.4, 3.6, mix(stem, '#ffffff', 0.35))));
  out.push(...flatLine([[11.6, 37 + by], [12.6, 39.8 + by]], 0.45, stemD), ...flatLine([[22.6, 37.4 + by], [21.8, 40 + by]], 0.45, stemD));
  // Leaf mantle.
  for (let i = 0; i < 7; i++) {
    const x = 10.4 + i * 2.2;
    const s = walk ? Math.sin(p + i) * 0.35 : 0;
    const c = i % 2 ? '#5f8c6e' : '#74a47e';
    out.push(F(T([[x - 1.6, 28.6 + by], [x + 1.6, 28.6 + by], [x + 0.3 + s, 32.4 + by + (i % 2) * 0.6], [x - 0.5 + s, 32.2 + by]], lineOf(c))));
    out.push(F(T([[x - 1.2, 28.6 + by], [x + 1.2, 28.6 + by], [x + 0.3 + s, 31.8 + by + (i % 2) * 0.6], [x - 0.4 + s, 31.6 + by]], c)));
  }
  // Beaded necklace with a fang pendant.
  const beads = [TEAL, BONE, PURP, BONE, TEAL, BONE, PURP];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + (i / 6) * 0.7);
    const x = 17.6 + Math.cos(a) * 6;
    const y = 30.2 + by + Math.sin(a) * 3.4;
    out.push(F(E(x, y, 0.95, 0.95, lineOf(beads[i]))), F(E(x, y, 0.7, 0.7, beads[i])), F(E(x - 0.2, y - 0.25, 0.25, 0.25, '#ffffff')));
  }
  out.push(F(T([[16.4, 33.6 + by], [18.8, 33.6 + by], [17.8, 36.6 + by]], lineOf(BONE))), F(T([[16.8, 33.7 + by], [18.4, 33.7 + by], [17.7, 36 + by]], BONE)));

  // Face on the stem, in the cap's shade.
  const fx = 20 + hx;
  const fy = 25.2 + by;
  out.push(...eyes([[fx - 2.6, fy, 1.55], [fx + 2.4, fy, 1.45]], mood, { cx: fx, skin: stem, glow, brow: '#6a4a5a' }));
  if (!dead && mood !== 'hurt') {
    // War paint: two violet stripes under each eye.
    for (const x of [fx - 3.8, fx - 2.6, fx + 2, fx + 3.2]) out.push(...flatLine([[x, fy + 2], [x - 0.3, fy + 3.2]], 0.5, '#9b6fd6'));
  }
  const my = fy + 3.4;
  switch (mood) {
    case 'angry':
      out.push(F(E(fx, my, 1.6, 1.1, GUM)), F(T([[fx - 1.1, my - 0.8], [fx - 0.3, my - 0.8], [fx - 0.7, my + 0.1]], FANG)), F(T([[fx + 0.3, my - 0.8], [fx + 1.1, my - 0.8], [fx + 0.7, my + 0.1]], FANG)));
      break;
    case 'happy':
      out.push(F(T([[fx - 1.4, my - 0.5], [fx + 1.4, my - 0.5], [fx, my + 1.1]], MOUTH)));
      break;
    case 'hurt':
      out.push(F(E(fx, my, 0.7, 0.9, MOUTH)));
      break;
    case 'dead':
      out.push(...flatLine([[fx - 1.2, my], [fx - 0.4, my - 0.5], [fx + 0.4, my], [fx + 1.2, my - 0.5]], 0.45, INK));
      break;
    default:
      out.push(arc(fx, my - 0.7, 1, 0.8, 25, 155, 0.45, INK));
  }

  // Cap: a frilled dome with a floppy tip, spotted with glow. It casts its shade over the face.
  const ct = (walk ? -Math.sin(p) * 0.9 : Math.sin(it) * 0.5) + (hurt ? -1.2 : 0) + (dead ? 1.4 : 0);
  const cy = 20.4 + by + (dead ? 1.4 : 0);
  const ccx = 16 + hx * 0.6;
  const dome = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (1 + i / 14);
    dome.push([ccx + Math.cos(a) * 15.4, cy + Math.sin(a) * 11.2]);
  }
  const tipPts = [[ccx - 2, cy - 9.6], [ccx - 4, cy - 14.2], [ccx - 7.4 + ct * 0.5, cy - 16.4 + Math.abs(ct) * 0.2], [ccx - 10.6 + ct, cy - 15 + (dead ? 3 : 0)]];
  out.push(F(taper(ext(tipPts, 0.4), 7.6, 1.6, lineOf(cap))), C(taper(tipPts, 6.6, 0.8, cap)));
  out.push(C(T([...dome, [ccx + 15.2, cy + 1.4], [ccx, cy + 2.6], [ccx - 15.2, cy + 1.4]], cap)));
  out.push(F(E(ccx - 3, cy - 7.6, 5.4, 2, capHi)), F(E(ccx - 5.4, cy - 7.2, 1.6, 0.8, '#d2c2f2')));
  // Gills and the ruffled frill along the brim.
  out.push(F(E(ccx, cy + 2.2, 14.6, 1.6, gill)));
  for (let i = 0; i < 11; i++) {
    const x = ccx - 14.2 + i * 2.84;
    const wob = Math.sin(i * 2.2 + (walk ? p : it)) * 0.35;
    const yy = cy + 2.6 + (i % 2) * 0.4 + wob - Math.abs(i - 5) * 0.12;
    out.push(E(x, yy, 1.9, 1.5, frill));
    out.push(...flatLine([[x, yy - 0.9], [x, yy + 0.7]], 0.35, shade(frill, -12)));
  }
  // Glowing spots, pulsing.
  const pulse = walk ? 0.5 + 0.5 * raise : 0.5 + 0.5 * Math.sin(it);
  for (const [x, y, r] of [[-7.6, -4.6, 2.2], [0.4, -8.4, 2.4], [7.4, -4.2, 2], [-3.4, -1.4, 1.3], [3.8, -0.8, 1.2], [11.6, -0.4, 1], [-11.6, -0.6, 0.9], [-9.6, -10.4, 1]]) {
    const rr = r * (0.95 + 0.12 * pulse);
    out.push(F(E(ccx + x, cy + y, rr + 0.6, rr * 0.82 + 0.55, mix(cap, glow, 0.45))), F(E(ccx + x, cy + y, rr, rr * 0.82, glow)), F(E(ccx + x - 0.3, cy + y - 0.3, rr * 0.4, rr * 0.35, TEAL_HI)));
  }

  // Staff and the front arm gripping it.
  out.push(...limb(staffPts, 2.2, 1.7, wood));
  for (const t of [0.25, 0.62, 0.86]) {
    const q = staffPts[Math.round(t * 6)];
    out.push(F(E(q[0], q[1], 1.2, 0.5, shade(wood, -14))));
  }
  // Wrapped cloth and a dangling charm under the pod.
  const tq = lerp(bot, top, 0.9);
  out.push(F(E(tq[0], tq[1], 1.5, 0.9, '#c46f8c')), F(E(tq[0], tq[1] + 1.1, 1.5, 0.7, '#e08aa6')));
  const sw = walk ? Math.sin(p - 1) * 1.2 : Math.sin(it) * 0.4;
  out.push(...flatLine([[tq[0] - 0.8, tq[1] + 1.4], [tq[0] - 1.6 - sw * 0.4, tq[1] + 4]], 0.4, '#7a5a3a'), ...oval(tq[0] - 1.7 - sw * 0.4, tq[1] + 4.6, 0.7, 0.9, PURP));
  // The pod: a glowing bulb held in curling root prongs.
  const o = [top[0] + 0.2, top[1] - 3.4];
  const pg = 1 + 0.12 * raise + (walk ? 0 : 0.06 * Math.sin(it));
  out.push(...limb([top, [o[0] - 3, o[1] + 0.6], [o[0] - 2.8, o[1] - 2.6], [o[0] - 1.4, o[1] - 3.6]], 1.4, 0.4, wood));
  out.push(F(E(o[0], o[1], 3.3 * pg, 3.3 * pg, lineOf(glow))), F(E(o[0], o[1], 2.9 * pg, 2.9 * pg, mix(glow, '#2f9f9a', 0.35))), F(E(o[0], o[1], 2.3 * pg, 2.3 * pg, glow)));
  out.push(F(E(o[0] + 0.3, o[1] + 0.3, 1.2 * pg, 1.2 * pg, TEAL_HI)), F(E(o[0] - 1.1, o[1] - 1.1, 0.6, 0.6, '#ffffff')));
  for (const [dx, dy] of [[-1.2, 0.9], [1.3, -0.7], [0.9, 1.4]]) out.push(F(E(o[0] + dx, o[1] + dy, 0.35, 0.35, PURP)));
  out.push(...limb([top, [o[0] + 2.8, o[1] + 0.8], [o[0] + 3, o[1] - 2.2], [o[0] + 1.6, o[1] - 3.8]], 1.4, 0.4, shade(wood, 6)));
  // Motes rising off the pod, more of them as it is raised.
  const mt = walk ? f / 6 : f / 4;
  for (let i = 0; i < (raise > 0.5 || angry ? 4 : 2); i++) {
    const u = (mt + i / 4) % 1;
    out.push(...mote(o[0] + Math.sin(u * TAU + i * 2) * 3.2, o[1] - 3.6 - u * 3.4, 0.55 - u * 0.2, i % 2 ? PURP : glow));
  }
  const fsx = 22.4;
  const fsy = 30.6 + by;
  const grip = lerp(bot, top, 0.42);
  out.push(...limb([[fsx, fsy], [lerp([fsx, fsy], grip, 0.5)[0], lerp([fsx, fsy], grip, 0.5)[1] + 1], grip], 2.6, 2.1, stem), ...oval(grip[0], grip[1], 1.6, 1.6, stem));
  return { w: 36, h: 44, res: 3, shapes: out };
}

// ---------- Bramble Bear (thornback) ----------
// A hulking bear armored in bark plates, bound in thorny brambles, with moss and glowing toadstools
// on its back, corruption seeping purple between the plates, a bark brow-plate with horn thorns,
// and big pale claws. It trots in diagonal pairs.

function brambleBear(pose, f, mood) {
  const walk = pose === 'walk';
  const p = walk ? (f / 6) * TAU : 0;
  const it = walk ? 0 : (f / 4) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const fur = '#9a7460';
  const furD = '#7d5c4c';
  const belly = '#c7a488';
  const muzzle = '#dcbda0';
  const plate = '#6c5748';
  const plateHi = '#8e7764';
  const vine = '#5f8c5c';
  const thorn = '#ece0c6';
  const glow = dead ? '#a49cb0' : TEAL;
  const pglow = dead ? '#9f94ad' : PURP;
  const bob = walk ? Math.cos(p * 2) * 0.7 : Math.sin(it) * 0.35;
  const breathe = walk ? 0 : (1 + Math.sin(it)) * 0.35;
  const by = bob + (dead ? 2 : 0);
  const hx = hurt ? -2 : angry ? 1 : 0;
  const hy = (dead ? 4.4 : hurt ? -1.4 : angry ? 0.8 : 0) + (walk ? Math.sin(p * 2 + 0.8) * 0.4 : Math.sin(it - 0.6) * 0.3);
  const out = [];

  const leg = (x, top, q, c, w, fore) => {
    const sw = walk ? Math.sin(q) : 0;
    const lift = walk ? Math.max(0, Math.cos(q)) * 2.8 : 0;
    const px = x + sw * 4.2 + (dead ? (fore ? 2 : -2) : 0);
    const py = 46 - lift;
    const knee = [(x + px) / 2 + (fore ? -0.6 : 1.2), (top + by + py) / 2];
    const res = [...limb([[x, top + by], knee, [px, py - 0.8]], w, w * 0.78, c)];
    res.push(...oval(px + 0.8, py, 3.6, 2, c));
    for (const k of [0, 1, 2]) {
      const cx = px + 3.2 - k * 0.3;
      const cy = py - 0.9 + k * 0.9;
      res.push(...limb([[cx, cy], [cx + 1.4, cy + 0.2], [cx + 2.4, cy + 0.9]], 1.1, 0.1, k === 1 ? thorn : shade(thorn, -8)));
    }
    return res;
  };

  // Far legs, darker and a step back.
  out.push(...leg(12.4, 33, p + Math.PI, shade(fur, -12), 6, false));
  out.push(...leg(37.6, 32, p, shade(fur, -12), 5.6, true));

  // Tail: a thorny stub.
  out.push(...oval(7.2, 28 + by, 2.6, 2.4, furD), F(T([[5, 26.6 + by], [3, 24.6 + by], [5.6, 25.8 + by]], thorn)));

  // Body: rump, belly, and the big shoulder hump.
  out.push(E(15.4, 31 + by, 9.6, 9.6 + breathe * 0.5, fur), E(27, 30.6 + by, 18, 11.4 + breathe, fur), E(37.4, 27 + by, 10.6, 10.8 + breathe * 0.5, fur));
  out.push(E(27.4, 36.8 + by, 13, 4, belly));
  out.push(...flatLine([[20, 35.4 + by], [21, 37 + by]], 0.45, shade(belly, -12)), ...flatLine([[27, 36 + by], [27.6, 38 + by]], 0.45, shade(belly, -12)), ...flatLine([[34, 35.4 + by], [34.4, 37.2 + by]], 0.45, shade(belly, -12)));
  // Fur tufts along the underside.
  for (const x of [16, 22, 29, 35]) out.push(T([[x - 1.6, 38.6 + by], [x + 1.6, 38.6 + by], [x + 0.2, 41 + by]], fur));

  // Bark plates fanned over the back, each with a thorn; purple corruption glows in the seams.
  const plates = [[200, 6.6, 4.4], [222, 7.4, 4.8], [246, 7.8, 5], [270, 7.6, 5], [294, 7, 4.6], [315, 5.8, 4]];
  const seams = [];
  plates.forEach(([deg, pw, ph], i) => {
    const a = (deg * Math.PI) / 180;
    const cx = 25.6 + Math.cos(a) * 15.6;
    const cy = 31.6 + by + Math.sin(a) * 15;
    const tx = -Math.sin(a);
    const ty = Math.cos(a);
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const pt = (u, v) => [cx + tx * u * pw * 0.5 + nx * v * ph * 0.5, cy + ty * u * pw * 0.5 + ny * v * ph * 0.5];
    const quad = [pt(-1, -0.7), pt(-0.85, 0.75), pt(0, 1), pt(0.85, 0.75), pt(1, -0.7), pt(0, -1)];
    seams.push(pt(1.05, -0.2));
    out.push(F(T(quad.map(([x, y]) => [x + nx * 0.5, y + ny * 0.5]), lineOf(plate))), C(T(quad, plate)));
    out.push(...flatLine([pt(-0.8, 0.55), pt(0, 0.8), pt(0.8, 0.55)], 0.6, plateHi));
    out.push(...flatLine([pt(-0.2, -0.6), pt(0.1, 0.1), pt(-0.15, 0.6)], 0.4, shade(plate, -14)));
    // Thorn spike.
    const l = i % 2 ? 4.4 : 5.6;
    const b0 = pt(-0.45, 0.8);
    const b1 = pt(0.45, 0.8);
    const tipP = [cx + nx * (ph * 0.5 + l) - tx * 1.2, cy + ny * (ph * 0.5 + l) - ty * 1.2];
    out.push(F(T([[b0[0] - nx * 0.4, b0[1] - ny * 0.4], [tipP[0] + nx * 0.5, tipP[1] + ny * 0.5], [b1[0] - nx * 0.4, b1[1] - ny * 0.4]], lineOf(thorn))), T([b0, tipP, b1], thorn));
    if (i === 1 || i === 3) out.push(F(E(pt(-0.3, 0.2)[0], pt(-0.3, 0.2)[1], 2.2, 1.1, '#7fb26e')), F(E(pt(-0.5, 0.35)[0], pt(-0.5, 0.35)[1], 1.2, 0.6, '#a3d48f')));
  });
  for (const s of seams.slice(0, -1)) out.push(F(E(s[0], s[1], 0.9, 0.9, pglow)), F(E(s[0], s[1], 0.4, 0.4, PURP_HI)));
  // Glowing toadstools sprouting from the rump plate.
  for (const [x, y, s] of [[10.8, 21.4, 1], [13.6, 20.4, 0.75]]) {
    out.push(...limb([[x, y + by + 2.4 * s], [x, y + by]], 0.9, 0.8, BONE), ...oval(x, y + by - 0.4, 2 * s, 1.3 * s, '#4fb8b0'), F(E(x - 0.4, y + by - 0.8, 0.6 * s, 0.4 * s, TEAL_HI)));
  }
  // Brambles wrapped around the body, with little thorns and leaves.
  const wrap = (pts) => {
    const res = [...flatLine(pts, 1.4, lineOf(vine)), ...flatLine(pts, 0.9, vine)];
    for (let i = 1; i < pts.length; i++) {
      const m = lerp(pts[i - 1], pts[i], 0.5);
      res.push(F(T([[m[0] - 0.5, m[1]], [m[0] + 0.5, m[1]], [m[0] + 0.2, m[1] - 1.3]], thorn)));
    }
    return res;
  };
  out.push(...wrap([[18, 21.4 + by], [20.6, 27 + by], [21, 33 + by], [19.6, 38.6 + by]]));
  out.push(...wrap([[30.4, 18.6 + by], [31.4, 25 + by], [30.4, 32 + by], [31.6, 39.4 + by]]));
  out.push(F(E(21.8, 29.6 + by, 1.6, 0.8, '#8fc77a')), F(E(29.6, 34 + by, 1.6, 0.8, '#8fc77a')));
  out.push(...flatLine([[24, 26 + by], [25.4, 28.4 + by], [24.6, 30.6 + by]], 0.55, pglow));

  // Near legs.
  out.push(...leg(16, 34.6, p, fur, 6.6, false));
  out.push(...leg(40.6, 33.6, p + Math.PI, fur, 6.2, true));
  // A bramble coiled around the near foreleg.
  const fl = walk ? Math.sin(p + Math.PI) * 2.1 : 0;
  out.push(...wrap([[37.6 + fl * 0.3, 36.6 + by], [43.4 + fl * 0.5, 38.4 + by * 0.5], [38 + fl * 0.6, 41]]));

  // Head.
  const hcx = 47.4 + hx;
  const hcy = 24.6 + by + hy;
  // Back ear, then the head with a cheek ruff.
  out.push(...oval(hcx - 4.8, hcy - 7, 2.7, 2.7, furD), F(E(hcx - 4.6, hcy - 6.8, 1.3, 1.3, '#8c64b0')));
  for (const [dx, dy] of [[-7.6, 3.6], [-6.4, 6.4], [-3.6, 7.8]]) out.push(T([[hcx + dx - 1.8, hcy + dy - 2.2], [hcx + dx + 1.6, hcy + dy - 1.4], [hcx + dx - 1.2, hcy + dy + 2.2]], fur));
  out.push(C(E(hcx, hcy, 8.4, 7.8, fur)));
  out.push(...oval(hcx + 1.6, hcy - 7.6, 2.9, 2.9, fur), F(E(hcx + 1.7, hcy - 7.4, 1.5, 1.5, '#8c64b0')));
  // Bark brow-plate with two horn thorns, cracked with corruption.
  out.push(F(T([[hcx - 6.2, hcy - 2.6], [hcx - 5.4, hcy - 6.8], [hcx - 1, hcy - 8.2], [hcx + 3.2, hcy - 6.2], [hcx + 3.6, hcy - 3.8], [hcx - 1.2, hcy - 4.4]], lineOf(plate))));
  out.push(T([[hcx - 5.6, hcy - 3], [hcx - 5, hcy - 6.4], [hcx - 1, hcy - 7.6], [hcx + 2.8, hcy - 5.8], [hcx + 3, hcy - 4.2], [hcx - 1.2, hcy - 4.8]], plate));
  out.push(...flatLine([[hcx - 4.6, hcy - 5.6], [hcx - 1, hcy - 6.8], [hcx + 2.2, hcy - 5.4]], 0.5, plateHi));
  out.push(...flatLine([[hcx - 1.6, hcy - 7.2], [hcx - 0.8, hcy - 5.8], [hcx - 1.6, hcy - 4.8]], 0.5, pglow));
  out.push(F(T([[hcx - 4.8, hcy - 6], [hcx - 7.4, hcy - 10.4], [hcx - 3, hcy - 6.8]], lineOf(thorn))), T([[hcx - 4.6, hcy - 6.2], [hcx - 6.8, hcy - 9.8], [hcx - 3.4, hcy - 6.8]], thorn));
  // Muzzle and nose.
  const jaw = angry ? 2.4 : hurt ? 1.2 : dead ? 1.4 : 0;
  out.push(...oval(hcx + 5.6, hcy + 4.2 + jaw * 0.6, 3.8, 2.2, muzzle));
  if (jaw > 0) {
    // Open mouth between the upper muzzle and the lower jaw.
    out.push(F(E(hcx + 6, hcy + 4.4 + jaw * 0.3, 3.4, 1.3 + jaw * 0.5, GUM)), F(E(hcx + 5.6, hcy + 4.8 + jaw * 0.6, 1.9, 0.7, MOUTH)));
    if (!hurt) {
      for (const k of [0, 2.4]) out.push(F(T([[hcx + 4 + k, hcy + 3.2], [hcx + 5.2 + k, hcy + 3.2], [hcx + 4.6 + k, hcy + 4.8 + jaw * 0.1]], FANG)));
      for (const k of [0.6, 2.8]) out.push(F(T([[hcx + 4 + k, hcy + 5.6 + jaw * 0.8], [hcx + 5 + k, hcy + 5.6 + jaw * 0.8], [hcx + 4.5 + k, hcy + 4.4 + jaw * 0.6]], FANG)));
    }
    if (dead) out.push(F(E(hcx + 7.6, hcy + 5.8 + jaw * 0.6, 1, 1.3, '#ff8fa8')));
  }
  out.push(...oval(hcx + 5.4, hcy + 2.4, 4.4, 2.8, muzzle));
  out.push(F(E(hcx + 5, hcy + 1.4, 2, 0.8, mix(muzzle, '#ffffff', 0.4))));
  if (jaw === 0) {
    out.push(...flatLine([[hcx + 2.6, hcy + 4.2], [hcx + 5.4, hcy + 4.6], [hcx + 8.4, hcy + 3.6]], 0.5, lineOf(muzzle)));
    out.push(F(T([[hcx + 6.6, hcy + 4.6], [hcx + 7.6, hcy + 4.3], [hcx + 7.3, hcy + 3.1]], FANG)));
    if (mood === 'happy') out.push(F(E(hcx + 5.4, hcy + 5, 1.2, 0.7, MOUTH)));
  }
  out.push(F(E(hcx + 9, hcy + 1.4, 1.9, 1.4, '#4a3548')), F(E(hcx + 8.6, hcy + 0.9, 0.6, 0.4, '#a08fbf')));
  out.push(...eyes([[hcx - 1.6, hcy - 1, 1.6], [hcx + 3, hcy - 1.4, 1.5]], mood, { cx: hcx + 0.7, skin: fur, glow, brow: '#4a3548' }));
  if (mood === 'idle' || mood === 'happy' || mood === 'blink') out.push(F(E(hcx - 2.8, hcy + 2.2, 1.1, 0.5, BLUSH)));
  return { w: 60, h: 48, res: 3, shapes: out };
}

// ---------- Spore Mite (sporeling) ----------
// A tiny scuttling puffball bug: a fluffy lilac body on six spindly legs, a translucent spore sac
// glowing on its back (puffing from a little vent), a shiny head with big eyes, glow-tipped
// antennae, and wee mandibles.

function sporeMite(pose, f, mood) {
  const walk = pose === 'walk';
  const p = walk ? (f / 4) * TAU : 0;
  const it = walk ? 0 : (f / 3) * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const puff = '#ebc8ea';
  const puffD = '#d2a6d6';
  const shell = '#b98bc8';
  const leg = '#8e6aa0';
  const glow = dead ? '#a49cb0' : TEAL;
  const by = (walk ? (f % 2 ? -0.7 : 0) : Math.sin(it) * 0.3) + (dead ? 1.6 : 0);
  const hx = hurt ? -1 : 0;
  const pulse = walk ? 0.5 + 0.5 * Math.cos(p) : 0.5 + 0.5 * Math.sin(it);
  const out = [];

  const legShape = (x, q, c, out2, far) => {
    const sw = walk ? Math.sin(q) : 0;
    const lift = walk ? Math.max(0, Math.cos(q)) * 1.5 : 0;
    const hip = [x, 13.6 + by - (far ? 0.6 : 0)];
    let foot = [x + out2 * 2.2 + sw * 1.7, 19.4 - lift - (far ? 0.4 : 0)];
    if (dead) foot = [x + out2 * 1.4, 16.4 + by];
    const knee = [(hip[0] + foot[0]) / 2 + out2 * 1.4, Math.min(hip[1], foot[1]) - 1.2];
    return limb([hip, knee, foot], 1.15, 0.6, c);
  };
  // Tripod gait: front and back near legs with the middle far leg, then the others.
  const xs = [7, 11, 15];
  const dirs = [-1, 0, 1];
  xs.forEach((x, i) => out.push(...legShape(x + 1.2, p + (i === 1 ? 0 : Math.PI), shade(leg, -12), dirs[i], true)));

  // The puffball body: fluff bumps around a round core.
  const bx = 10.6;
  const byy = 12.4 + by;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.9 + (i / 8) * 1.25);
    const w = walk ? Math.sin(p + i) * 0.2 : 0;
    out.push(E(bx + Math.cos(a) * 6.4, byy + Math.sin(a) * 4.6 + w, 2.1, 1.9, puff));
  }
  out.push(E(bx, byy, 7.2, 5.4, puff), F(E(bx + 0.4, byy + 3.6, 5.4, 1.3, puffD)));
  for (const [x, y] of [[-4.6, 1], [-1.6, 2.2], [1.8, 1.6], [-3, -1.6]]) out.push(F(E(bx + x, byy + y, 0.5, 0.5, mix(puff, PURP, 0.4))));

  // Spore sac on its back, translucent and pulsing.
  const sr = 3.8 + pulse * 0.5;
  const sx = 8.4;
  const sy = 6.6 + by;
  out.push(...limb([[sx - 2.4, sy - 2.2], [sx - 3.4, sy - 4.2]], 1.6, 1.3, shade(glow, -22)));
  out.push(F(E(sx - 3.5, sy - 4.4, 0.9, 0.5, TEAL_HI)));
  out.push(...oval(sx, sy, sr, sr * 0.92, mix(glow, '#3aa59c', 0.45)));
  out.push(F(E(sx + 0.3, sy + 0.4, sr * 0.78, sr * 0.72, glow)));
  out.push(...flatLine([[sx - 2.4, sy + 1.6], [sx, sy - 0.6], [sx + 2.6, sy + 1]], 0.4, mix(glow, '#2a8f8a', 0.5)));
  for (const [x, y, r] of [[-1.2, 0.8, 0.8], [1.2, -0.6, 0.65], [0.6, 1.8, 0.55], [-0.4, -1.6, 0.5]]) out.push(F(E(sx + x, sy + y, r * (0.8 + pulse * 0.4), r * (0.8 + pulse * 0.4), TEAL_HI)));
  out.push(F(E(sx - 1.4, sy - 1.8, 1, 0.6, '#ffffff')));
  // A puff of spores from the vent.
  if (!dead) {
    const u = walk ? f / 4 : f / 3;
    out.push(...mote(sx - 4.4 - u * 1.6, sy - 5.6 - u * 1.2, 0.7 - u * 0.25, glow), ...mote(sx - 2.6 + u, sy - 6.6 - u * 1.4, 0.5, PURP));
  }

  // Near legs.
  xs.forEach((x, i) => out.push(...legShape(x, p + (i === 1 ? Math.PI : 0), leg, dirs[i], false)));

  // Head: a shiny carapace with big eyes, antennae and mandibles.
  const hcx = 17.4 + hx;
  const hcy = 12.6 + by + (dead ? 1 : 0);
  const aw = walk ? Math.sin(p * 2) * 0.6 : Math.sin(it) * 0.5;
  const ant = (x0, dx, c) => {
    const tip = dead ? [hcx + x0 + 2.6 + dx, hcy - 2.6] : [hcx + x0 + 3.4 + dx + aw * 0.4, hcy - 8 + aw];
    return [...limb([[hcx + x0, hcy - 3], [hcx + x0 + 0.6 + dx, hcy - 6], tip], 0.8, 0.5, c), ...oval(tip[0], tip[1], 0.9, 0.9, glow), F(E(tip[0] - 0.2, tip[1] - 0.2, 0.4, 0.4, TEAL_HI))];
  };
  out.push(...ant(-1.4, -1, shade(shell, -16)));
  for (const s of [-1, 1]) {
    const mo = angry ? 0.6 : 0;
    out.push(...limb([[hcx + 2.4, hcy + 2 + s * 0.8], [hcx + 4.6, hcy + 2.4 + s * (1 + mo)], [hcx + 5.4, hcy + 1.6 + s * (0.2 + mo)]], 1, 0.3, s < 0 ? shade(BONE, -12) : BONE));
  }
  out.push(C(E(hcx, hcy, 4.4, 3.9, shell)), F(E(hcx - 0.8, hcy - 2.4, 2, 0.8, mix(shell, '#ffffff', 0.45))));
  out.push(...ant(0.8, 0, shell));
  out.push(...eyes([[hcx - 0.9, hcy + 0.2, 1.25], [hcx + 2.2, hcy + 0.1, 1.15]], mood, { cx: hcx + 0.65, skin: shell, glow, brow: '#4a3060', flare: false }));
  if (mood === 'idle' || mood === 'happy' || mood === 'blink') out.push(F(E(hcx - 1.8, hcy + 2, 0.8, 0.4, BLUSH)));
  if (mood === 'angry' || mood === 'hurt') out.push(F(E(hcx + 1.8, hcy + 2.6, 0.55, 0.45, GUM)));
  return { w: 24, h: 20, res: 3, shapes: out };
}

// ---------- Corrupted Sapling (sapling) ----------
// A twisted young tree rooted to the floor, its trunk spiraling around a hollow where a corrupted
// heart pulses with purple light, veins of glow spreading through the bark, weeping branches of
// drooping leaves (some gone violet), and a sleepy knot face. It never walks: its "walk" frames
// are a heartbeat (lub-dub, rest).

function sapling(pose, f, mood) {
  const walk = pose === 'walk';
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const beat = dead ? 0 : walk ? [0, 1, 0.5, 0.15][f] : 0.2 + 0.15 * Math.sin((f / 3) * TAU);
  const sway = (walk ? Math.sin((f / 4) * TAU) * 0.7 : Math.sin((f / 3) * TAU) * 0.4) + (hurt ? -1.6 : 0);
  const droop = dead ? 2.4 : 0;
  const bark = '#a98468';
  const barkD = '#80624f';
  const barkL = '#c4a084';
  const leafA = dead ? '#a9a08f' : '#97c48c';
  const leafB = dead ? '#9b8f99' : '#b08ad8';
  const leafC = dead ? '#8f8a80' : '#77a978';
  const heart = dead ? '#8f8599' : '#d65cff';
  const glow = dead ? '#a49cb0' : TEAL;
  const vein = dead ? barkD : mix(barkD, PURP, 0.45 + 0.45 * beat);
  const out = [];
  // Lean: the top of the tree shifts with the sway.
  const sx = (y) => sway * (1 - y / 44) * 1.4;

  // Roots gripping the floor.
  out.push(...limb([[14, 40.6], [11, 44.4], [8.6, 45.6]], 2.4, 0.6, barkD));
  out.push(...limb([[13.4, 39.6], [9.6, 42.6], [5, 44.2], [2.4, 44.6], [1.4, 43.4]], 3.2, 0.5, bark));
  out.push(...limb([[16.4, 39.6], [20.4, 42.6], [25, 44.2], [27.6, 44.6], [28.6, 43.4]], 3.2, 0.5, bark));
  out.push(...limb([[15.2, 41.6], [15.6, 44.4], [17.6, 45.6], [19.4, 45.4]], 2.4, 0.5, barkL));

  // Weeping branches behind the trunk.
  const branch = (pts, side) => {
    const b = pts.map(([x, y]) => [x + sx(y), y + (angry ? -1.2 * Math.abs(x - 15) / 10 : 0)]);
    const res = [...limb(b, 2.4, 0.7, barkD)];
    for (let i = 1; i < b.length; i++) {
      const m = lerp(b[i - 1], b[i], 0.6);
      const dl = droop + (walk ? Math.sin((f / 4) * TAU + i) * 0.3 : 0);
      const c = i % 3 === 1 ? leafB : i % 2 ? leafA : leafC;
      const lx = m[0] + side * 0.4 + sway * 0.3;
      res.push(...oval(lx, m[1] + 2.4 + dl, 1.1, 2.4, c));
      if (c === leafB && !dead) res.push(F(E(lx, m[1] + 4.2 + dl, 0.6, 0.6, glow)));
    }
    return res;
  };
  out.push(...branch([[14, 20], [10, 15.6], [6, 14.6], [3.2, 16.4], [2.6, 19.6]], -1));
  out.push(...branch([[16.2, 19.4], [20.4, 15], [24.6, 14.2], [27.2, 16], [27.6, 19.2]], 1));

  // The twisted trunk.
  const tc = [[15, 42], [13.8, 37], [16.2, 31.6], [14.6, 25.6], [15.4, 19], [15, 13]].map(([x, y]) => [x + sx(y), y]);
  out.push(F(taper(ext(tc, 0.3), 10.2, 6.4, lineOf(bark))), taper(tc, 9.2, 5.4, bark));
  // Spiral grooves and ridges.
  for (const y of [38, 34, 23, 18.6]) out.push(...flatLine([[11.6 + sx(y), y + 1.4], [15 + sx(y), y - 0.2], [18.4 + sx(y), y - 1.8]], 0.5, barkD));
  for (const y of [36.4, 21]) out.push(...flatLine([[12.4 + sx(y), y + 1], [15.6 + sx(y), y - 0.6]], 0.5, barkL));

  // Hollow with the pulsing heart, and veins of glow spreading out.
  const hcx = 15.6 + sx(32);
  const hcy = 32.4;
  for (const v of [[[hcx - 2.4, hcy - 3.6], [hcx - 3.4, hcy - 6.2], [hcx - 2.6, hcy - 8.4]], [[hcx + 2.6, hcy - 3], [hcx + 3.4, hcy - 5.6]], [[hcx - 2.8, hcy + 3], [hcx - 3.8, hcy + 6], [hcx - 3.2, hcy + 8]], [[hcx + 2.6, hcy + 3.4], [hcx + 3.6, hcy + 6.6]]]) {
    out.push(...flatLine(v, 0.55 + beat * 0.2, vein));
    if (!dead) out.push(F(E(v[v.length - 1][0], v[v.length - 1][1], 0.5 + beat * 0.3, 0.5 + beat * 0.3, mix(PURP, PURP_HI, beat))));
  }
  out.push(F(E(hcx, hcy, 3.9, 4.8, barkL)), F(E(hcx + 0.2, hcy + 0.2, 3.3, 4.2, '#24182f')));
  out.push(F(E(hcx, hcy + 0.4, 2.6 + beat * 0.7, 3.2 + beat * 0.7, dead ? '#3a3040' : mix('#3a1f55', PURP, 0.3 + beat * 0.35))));
  const s = 0.85 + beat * 0.35;
  const hy = hcy + 0.2;
  const heartShape = (k, c) => [
    F(E(hcx - 0.95 * s, hy - 0.6 * s, 1.25 * s * k, 1.2 * s * k, c)), F(E(hcx + 0.95 * s, hy - 0.6 * s, 1.25 * s * k, 1.2 * s * k, c)),
    F(T([[hcx - 2.15 * s * k, hy - 0.3 * s], [hcx + 2.15 * s * k, hy - 0.3 * s], [hcx, hy + 2.3 * s * k]], c)),
  ];
  out.push(...heartShape(1.12, lineOf(heart)), ...heartShape(1, heart));
  out.push(F(E(hcx - 1, hy - 0.9 * s, 0.6 * s, 0.5 * s, dead ? '#c0b8c8' : PURP_HI)));
  // Roots grown over the hollow's rim, like a cage.
  out.push(...limb([[hcx - 3.4, hcy - 2], [hcx - 1, hcy - 0.6], [hcx + 0.6, hcy + 2.2], [hcx + 3.2, hcy + 3.6]], 0.9, 0.7, barkD));

  // Face: sleepy knot eyes and a crack of a mouth.
  const fx = 15.4 + sx(22) + (hurt ? -0.4 : 0);
  const fy = 22.6 + (dead ? 0.6 : 0);
  out.push(F(E(fx - 2.4, fy - 2.3, 1.8, 0.5, barkD)), F(E(fx + 2.4, fy - 2.3, 1.8, 0.5, barkD)));
  out.push(...eyes([[fx - 2.3, fy, 1.4], [fx + 2.3, fy, 1.4]], mood, { cx: fx, skin: bark, glow: dead ? glow : mix(TEAL, PURP, 0.25 * beat), brow: '#4a3548' }));
  const my = fy + 2.8;
  switch (mood) {
    case 'angry':
      out.push(F(E(fx, my, 1.7, 0.9, GUM)), F(T([[fx - 1.2, my - 0.6], [fx - 0.4, my - 0.6], [fx - 0.8, my + 0.4]], FANG)), F(T([[fx + 0.4, my - 0.6], [fx + 1.2, my - 0.6], [fx + 0.8, my + 0.4]], FANG)));
      break;
    case 'happy':
      out.push(F(T([[fx - 1.3, my - 0.4], [fx + 1.3, my - 0.4], [fx, my + 1]], MOUTH)));
      break;
    case 'hurt':
      out.push(F(E(fx, my + 0.1, 0.7, 0.8, GUM)));
      break;
    case 'dead':
      out.push(...flatLine([[fx - 1.2, my], [fx - 0.4, my - 0.4], [fx + 0.4, my], [fx + 1.2, my - 0.4]], 0.45, INK));
      break;
    default:
      out.push(...flatLine([[fx - 1.2, my - 0.2], [fx - 0.3, my + 0.3], [fx + 0.5, my], [fx + 1.2, my + 0.3]], 0.45, '#4a3548'));
  }
  if (mood === 'idle' || mood === 'happy' || mood === 'blink') out.push(F(E(fx - 3.4, fy + 1.8, 0.9, 0.45, BLUSH)), F(E(fx + 3.4, fy + 1.8, 0.9, 0.45, BLUSH)));

  // Crown: drooping clumps of leaves, a curled shoot, and a fringe of hanging leaves.
  const cx = 15.2 + sx(8);
  const cy = 9.6 + droop * 0.5;
  out.push(...limb([[cx, cy - 3], [cx + 0.6, cy - 6.4], [cx - 0.8, cy - 8.2], [cx - 2.2, cy - 7.4]], 1.4, 0.5, barkD));
  out.push(F(E(cx - 2.3, cy - 7.4, 0.7, 0.7, dead ? '#9b8f99' : PURP)));
  for (const [x, y, rx, ry, c] of [[-5.2, 1.6, 4.4, 3.4, leafC], [5.4, 1.4, 4.4, 3.4, leafC], [0, 0, 6.6, 4.6, leafA], [-2.6, -2.6, 3.8, 2.8, leafA], [3, -2.4, 3.6, 2.6, leafB], [0.4, -3.8, 2.8, 2, mix(leafA, '#ffffff', 0.15)]]) {
    out.push(C(E(cx + x, cy + y, rx, ry, c)));
  }
  out.push(F(E(cx - 2.4, cy - 3.2, 1.6, 0.7, mix(leafA, '#ffffff', 0.45))), F(E(cx + 3.6, cy - 2.6, 1, 0.5, mix(leafB, '#ffffff', 0.45))));
  for (let i = 0; i < 7; i++) {
    const x = cx - 7.2 + i * 2.4;
    const l = 2 + (i % 3) * 0.8 + droop;
    const w = walk ? Math.sin((f / 4) * TAU + i * 0.9) * 0.4 : Math.sin((f / 3) * TAU + i) * 0.25;
    const c = i % 3 === 2 ? leafB : i % 2 ? leafA : leafC;
    out.push(...oval(x + w, cy + 3.4 + l * 0.6, 0.9, l * 0.6, c));
    if (c === leafB && !dead) out.push(F(E(x + w, cy + 3.6 + l * 1.15, 0.5, 0.5, glow)));
  }
  for (const [x, y] of [[-4.4, -0.4], [4, 1], [1.2, -1.6]]) out.push(F(E(cx + x, cy + y, 0.6, 0.6, dead ? '#9b8f99' : PURP)), F(E(cx + x - 0.2, cy + y - 0.2, 0.25, 0.25, PURP_HI)));
  // Spore motes drifting off as the heart beats.
  if (!dead && beat > 0.4) out.push(...mote(hcx + 5.4, hcy - 4 - beat * 2, 0.6, PURP), ...mote(hcx - 5, hcy - 6 - beat, 0.5, glow));
  return { w: 30, h: 46, res: 3, shapes: out };
}

export const ART = {
  rootling: { walk: 6, idle: 4, draw: rootImp },
  sporecap: { walk: 6, idle: 4, draw: myconid },
  thornback: { walk: 6, idle: 4, draw: brambleBear },
  sporeling: { walk: 4, idle: 3, draw: sporeMite },
  sapling: { walk: 4, idle: 3, draw: sapling },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  rootling: { name: 'Root Imp', w: 22, h: 30 },
  sporecap: { name: 'Myconid Shaman', w: 22, h: 34 },
  thornback: { name: 'Bramble Bear', w: 46, h: 34 },
  sporeling: { name: 'Spore Mite', w: 18, h: 14 },
  sapling: { name: 'Corrupted Sapling', w: 18, h: 36 },
};
