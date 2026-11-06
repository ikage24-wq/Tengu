// Monster art: Petal Meadow's new residents (the player's picks, 2026-11-01).
//   bumble       Bumble: a chubby little bee from the giant hive, all fuzz and big shiny eyes,
//                its wings a buzzing blur. It stings by curling its striped tail under and diving.
//   petalsprite  Petal Sprite: a tiny blossom fairy drifting on the Petal Clouds, a cherry bloom
//                for a hat, a petal skirt and petal wings; shy, sleepy-eyed, it flings petals.
//   queenbee     The Queen Bee (Petal Meadow's area boss): a big, haughty, very round queen in a
//                honeycomb crown and a lace ruff, lacy wings, a long striped train of a tail and a
//                honey dipper for a scepter, which she brings down in a splash of honey.
// All three fly: their walk is the flight loop (bob and wingbeat), their idle a hover. Every
// design faces right; see kit.js for the shapes and faces.js for the faces.

import { E, T, F, mix, shade, stroke } from './kit.js';
import { easyEye, mouth, blush as cheek, sweat, tear, vein, deadEye, simpleEye, simpleMouth } from './faces.js';
import { ramp, crescent, shine, smear, breath, sway, chain, wave } from './meadow.js';
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const shift = (shapes, dx, dy) => shapes.map((s) => s && (s.t === 'p' ? { ...s, pts: s.pts.map(([x, y]) => [x + dx, y + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
// Turns shapes about (cx, cy) by deg.
function spin(shapes, cx, cy, deg) {
  if (!deg) return shapes;
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const r = (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return shapes.map((q) => {
    if (!q) return q;
    if (q.t === 'p') return { ...q, x: 0, y: 0, pts: q.pts.map(([px, py]) => r(q.x + px, q.y + py)) };
    const [x, y] = q.t === 'e' ? r(q.x, q.y) : r(q.x + q.w / 2, q.y + q.h / 2);
    return q.t === 'e' ? { ...q, x, y } : { ...q, x: x - q.w / 2, y: y - q.h / 2 };
  });
}
// A rotated oval as a polygon.
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
// A stripe across an oval body: the slice of the oval between x0 and x1.
function stripe(cx, cy, rx, ry, x0, x1, c) {
  const top = [];
  const bot = [];
  for (let i = 0; i <= 6; i++) {
    const x = lerp(x0, x1, i / 6);
    const k = Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) * 0.98;
    top.push([x, cy - ry * k]);
    bot.push([x, cy + ry * k]);
  }
  return F(T([...top, ...bot.reverse()], c));
}
// A soft-edged wing: a long oval from its root along deg, pale and see-through looking (a lighter
// inner panel and two veins), its rim a shade of its own color.
function wing(x, y, deg, len, wid, c, vein) {
  const a = deg * D2R;
  const cx = x + Math.cos(a) * len * 0.5;
  const cy = y + Math.sin(a) * len * 0.5;
  return [O(cx, cy, len * 0.5, wid, deg, c), F(O(cx + Math.cos(a) * 0.6, cy + Math.sin(a) * 0.6 - 0.4, len * 0.36, wid * 0.55, deg, mix(c, '#ffffff', 0.55))),
    ...stroke([[x, y], [x + Math.cos(a - 0.12) * len * 0.8, y + Math.sin(a - 0.12) * len * 0.8]], 0.35, vein), ...stroke([[x, y], [x + Math.cos(a + 0.18) * len * 0.6, y + Math.sin(a + 0.18) * len * 0.6]], 0.3, vein)];
}
// A four-point sparkle.
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), F(E(x, y, k * 0.9, k * 0.9, core))];
}
// A petal: rounded at the tip with a little notch, narrowing to its base at (bx, by).
function petal(bx, by, deg, len, wid, c, notch = true) {
  const a = deg * D2R;
  const p = (u, v) => [bx + Math.cos(a) * len * u - Math.sin(a) * wid * v, by + Math.sin(a) * len * u + Math.cos(a) * wid * v];
  const pts = [p(0, 0.2), p(0.3, 0.8), p(0.7, 1), p(0.95, 0.6), p(notch ? 0.86 : 1, 0), p(0.95, -0.6), p(0.7, -1), p(0.3, -0.8), p(0, -0.2)];
  return T(pts, c);
}

const HONEY = ramp('#ffc93c', { step: 10, turn: 14, sat: 4 });
const COCOA = ramp('#6e4a5e', { step: 8, turn: 10 });
const FUZZ = ramp('#fff1cc', { step: 6, turn: 30 });
const WING = '#dff2ff';
const WINGV = '#a9c8ea';

// The bee's face shared by Bumble and the Queen: simple eyes and mouth acting each mood, cheeks,
// and the little acting marks.
function beeFace(out, hx, hy, k, mood, attacking, { queen = false } = {}) {
  const dead = mood === 'dead';
  const angry = mood === 'angry' || attacking;
  const hurt = mood === 'hurt';
  const happy = mood === 'happy';
  const ink = queen ? '#2e1630' : '#2a1a2e';
  const ey = hy + 0.4 * k;
  const far = [hx - 0.4 * k, ey];
  const near = [hx + 3.4 * k, ey];
  const em = angry ? 'angry' : hurt ? 'hurt' : happy ? 'happy' : mood === 'blink' ? 'blink' : 'idle';
  // A Bumble's eyes are round and warm honey; the queen's narrower, violet, lashed with a wing.
  const eo = queen ? { iris: '#a04ad0', ink, lash: 1.25, wing: 1 } : { iris: '#c98a2e', ink, lash: 1 };
  // (Both eyes the same size, as on every creature face.)
  const [fw, fh, nw, nh] = queen ? [1.6, 1.95, 1.6, 1.95] : [1.7, 2.1, 1.7, 2.1];
  if (dead) out.push(...deadEye(far[0], far[1], 1.55 * k, { type: 'swirl', s: -1, c: ink }), ...deadEye(near[0], near[1], 1.55 * k, { type: 'swirl', c: ink }));
  else out.push(...simpleEye(far[0], far[1], { ...eo, s: -1, w: fw * k, h: fh * k, mood: em }), ...simpleEye(near[0], near[1], { ...eo, s: 1, w: nw * k, h: nh * k, mood: em }));
  if (!dead) out.push(...cheek(hx - 2.4 * k, ey + 2.4 * k, 1 * k, { lines: happy ? 2 : 0 }), ...cheek(hx + 5.4 * k, ey + 2.6 * k, 1.1 * k, { lines: happy || hurt ? 3 : 0 }));
  // The mouth on the centre line, between the eyes and nearer the far one.
  const mm = dead ? 'dead' : attacking ? 'shout' : angry ? 'angry' : hurt ? 'hurt' : happy ? 'happy' : 'idle';
  out.push(...simpleMouth(hx + 1.6 * k, hy + 3.6 * k, { k, mood: mm, smug: queen, lip: queen ? '#c2386a' : '#8a3550' }));
  if (angry && !attacking) out.push(...vein(hx - 3 * k, hy - 3.6 * k, 0.9 * k));
  if (hurt) out.push(...sweat(hx - 4.4 * k, hy - 3 * k, 1 * k), ...tear(near[0] + 0.8 * k, ey + 2.2 * k, 0.8 * k, { type: 'stream', len: 2 * k }));
}

// ---------- Bumble ----------

// Attack: a sting. curl: the tail curled under (deg), bx/by: body shift, rot: body tilt (+ nose
// down), arms: little arms flung, imp: the sting's spark.
const BUM_ATK = [
  // Wind-up (held): reared back, tail curled under and aimed, arms up.
  { curl: 38, bx: -2.2, by: -1.4, rot: -14, arms: 1, imp: 0 },
  // Dive: thrown forward and down, the stinger leading (a smear behind).
  { curl: 52, bx: 2.6, by: 1.6, rot: 16, arms: -0.6, imp: 0 },
  // Impact (held): the sting lands, a spark at its point.
  { curl: 56, bx: 3, by: 2, rot: 20, arms: -0.8, imp: 1 },
  // Recover: bobbing back up, tail uncurling past rest.
  { curl: 8, bx: 0.4, by: -0.4, rot: -3, arms: 0.3, imp: 0 },
];

function bumble(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? BUM_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const out = [];
  // Flight: a quick bob twice a loop (each wingbeat pair lifts it), a wobble that lags behind;
  // idle, a lazy hover with a breath. The wings blur: up on even frames, down on odd.
  const br = idle ? breath(q) : 0;
  const bob = dead ? 3 : A ? A.by : walk ? -1.6 * Math.sin(2 * TAU * q) : -br * 1.8 + sway(q) * 0.9;
  const bx = 15 + (A ? A.bx : 0) + (hurt ? -1.6 : 0) + (walk ? 0.5 * Math.sin(TAU * q - 1) : 0);
  const by = 17 + bob;
  const rot = dead ? 160 : A ? A.rot : hurt ? -10 : walk ? 4 + 5 * Math.sin(2 * TAU * q - 1.2) : sway(q) * 5;
  const up = Math.round(f) % 2 === 0;
  const flap = dead ? -10 : hurt ? -70 : up ? -78 : -18;

  // Far wings (behind everything), a lighter blur copy where the wing was.
  const W = (dx, dg, k) => wing(bx + dx, by - 5, -90 + flap * 0.6 + dg - 40, 9 * k, 3.4 * k, WING, WINGV);
  if (!dead) out.push(...wing(bx - 1, by - 5, -90 + (up ? -18 : -78) * 0.6 - 30, 8, 3, mix(WING, '#ffffff', 0.6), mix(WINGV, '#ffffff', 0.6)));
  out.push(...W(-1.4, 6, 0.9));

  // The tail: a striped round abdomen hung off the thorax, curling under to sting.
  const curl = (A ? A.curl : angry ? 14 : 0) + (walk ? 4 * Math.sin(2 * TAU * q - 2) : 0);
  const tail = [];
  const tx = bx - 6.6;
  const ty = by + 1.6;
  tail.push(E(tx, ty, 7, 6.2, HONEY.base), stripe(tx, ty, 7, 6.2, tx - 3.4, tx - 1.4, COCOA.base), stripe(tx, ty, 7, 6.2, tx + 0.6, tx + 2.6, COCOA.base),
    crescent(tx, ty, 7, 6.2, HONEY.sh, { k: 0.3, a0: 50, a1: 220 }), shine(tx, ty, 7, 6.2, HONEY.hi, 0, 1));
  const tip = curl > 30 || dead ? 0 : 1;
  tail.push(F(T([[tx - 6.6, ty - 1], [tx - 9.6 - tip, ty + 0.4], [tx - 6.4, ty + 1.6]], COCOA.deep)));
  out.push(...spin(tail, bx - 1, by, curl + rot * 0.6));

  // Legs: three little pairs dangling, swinging a beat behind the bob.
  const swing = walk ? Math.sin(2 * TAU * q - 2.4) * 1.2 : sway(q) * 0.6;
  for (const [x, k] of [[-1.6, 0.8], [0.8, 1], [3, 0.9]]) {
    const top = [bx + x, by + 4];
    const foot = [bx + x - 0.6 + swing * k, by + 8 + (A ? -1.4 : 0)];
    out.push(...stroke([top, [lerp(top[0], foot[0], 0.5) + 0.6, lerp(top[1], foot[1], 0.5)], foot], 0.9, COCOA.base, false), F(E(foot[0], foot[1] + 0.3, 0.8, 0.6, COCOA.sh)));
  }

  // The thorax: a fuzzy cream collar ringed in tufts round the front of the body.
  const thor = [E(bx, by, 5.6, 5.4, HONEY.base), crescent(bx, by, 5.6, 5.4, HONEY.sh, { k: 0.3, a0: 60, a1: 210, jag: 0.5 })];
  for (let i = 0; i < 7; i++) {
    const a = (-30 + i * 32) * D2R;
    thor.push(E(bx + 1.6 + Math.cos(a) * 4, by - 2.6 + Math.sin(a) * 1.6, 2.2, 1.8, i % 2 ? FUZZ.base : FUZZ.hi));
  }
  thor.push(crescent(bx + 1.6, by - 2, 5, 2.2, FUZZ.sh, { k: 0.4, a0: 70, a1: 160 }));
  out.push(...spin(thor, bx, by, rot * 0.5));

  // Arms: tiny, rubbing together when idle, flung up winding up a sting.
  const rub = idle ? Math.sin(TAU * q * 2) * 0.8 : 0;
  const ar = A ? A.arms : hurt ? 1 : 0;
  for (const [dx, k] of [[2.4, 1], [4.6, -1]]) {
    const sh = [bx + dx, by + 1];
    const hand = [sh[0] + 2 + rub * k * 0.6, sh[1] + 2.4 - ar * 4.4];
    out.push(...stroke([sh, hand], 1, COCOA.base, false), E(hand[0], hand[1], 1, 1, COCOA.sh));
  }

  // The head: a big honey-cream ball with cocoa cheeks of fuzz, antennae on top with pink pom tips
  // that bob a beat behind everything.
  const hx = bx + 6.4;
  const hy = by - 5.4 + (walk ? -0.4 * Math.sin(2 * TAU * q - 1.4) : 0);
  const head = [];
  const aph = walk ? 2 * TAU * q - 2.6 : TAU * q - 1.4;
  const droop = dead ? 70 : hurt ? 40 : angry ? -10 : 0;
  for (const [x, a0, near] of [[-1.6, -112, false], [1.6, -70, true]]) {
    const pts = chain(hx + x, hy - 5.6, a0 + droop * (near ? 1 : 0.7), [2.6, 2.6, 2.4], (i) => (i ? 14 : 0) + wave(aph + (near ? 0 : 0.8), idle ? 6 : 9)(i));
    head.push(...stroke(pts.map(([x2, y2]) => [x2, y2]), 0.7, COCOA.base, false));
    const t = pts.at(-1);
    head.push(E(t[0], t[1], 1.4, 1.4, near ? '#ff9ec7' : '#f088b4'), F(E(t[0] + 0.4, t[1] - 0.5, 0.5, 0.4, '#ffe0ee')));
  }
  head.push(E(hx, hy, 7, 6.6, FUZZ.base), crescent(hx, hy, 7, 6.6, FUZZ.sh, { k: 0.3, a0: 100, a1: 230, jag: 0.5 }), shine(hx, hy, 7, 6.6, '#ffffff', 0, 1.1));
  // A honey-gold forelock of fuzz.
  head.push(F(T([[hx - 3.6, hy - 5.4], [hx - 1.4, hy - 7.4], [hx + 0.4, hy - 5.8], [hx + 2, hy - 7.2], [hx + 3.4, hy - 5.2], [hx + 0.2, hy - 4.2]], HONEY.base)));
  beeFace(head, hx - 0.8, hy, 1, mood, Boolean(A) && f < 3);
  out.push(...spin(head, bx, by, rot * 0.35));

  // Near wings, blurred: the wing where it is and a pale ghost of where it was.
  if (!dead) out.push(...wing(bx + 1.4, by - 5.4, -90 + (up ? -18 : -78) * 0.6 - 18, 9, 3.2, mix(WING, '#ffffff', 0.55), mix(WINGV, '#ffffff', 0.55)));
  out.push(...wing(bx + 1.4, by - 5.4, -90 + flap * 0.6 - 26, 10, 3.6, WING, WINGV));

  let shapes = out;
  if (A && f === 1) shapes.push(smear([[bx - 14, by - 8], [bx - 6, by - 2], [bx + 2, by + 6]], 4, '#fff2c0'));
  if (A?.imp) shapes.push(...star(bx - 2, by + 11, 3, '#ffd65a'), ...star(bx + 3, by + 9, 1.6, '#ffffff', '#ffd65a'));
  return { w: 34, h: 32, res: 3, shapes: shift(shapes, 2, 4) };
}

// ---------- Petal Sprite ----------

// Attack: a flung petal. arm: the throwing arm (deg from down, + forward), lean: body lean, pet:
// the thrown petal [dx, dy, size] from the hand (null while held), burst: petals scattering.
const SPRITE_ATK = [
  // Wind-up (held): leaning back, the petal drawn back behind her head.
  { arm: -150, lean: -10, pet: null, burst: 0 },
  // Fling: whipped forward, the petal away (a smear behind it).
  { arm: 40, lean: 12, pet: [9, 2, 2.4], burst: 0 },
  // Impact (held): the petal bursts into a puff of petals.
  { arm: 60, lean: 8, pet: [14, 4, 0], burst: 1 },
  // Recover: settling back, hands to her cheeks, a little embarrassed.
  { arm: -20, lean: -2, pet: null, burst: 0 },
];

const PINK = ramp('#ffb7d3', { step: 9, turn: 18, sat: 4 });
const SKIN = ramp('#fff0ea', { step: 6, turn: 40 });

function petalsprite(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? SPRITE_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const out = [];
  // A slow drifting float: she rises and sinks once a loop, swaying like a falling petal; her
  // wings beat slowly (open, closing, closed, opening).
  const br = idle ? breath(q) : 0;
  const bob = dead ? 5 : walk ? -2.4 * Math.sin(TAU * q) : -br * 2.2;
  const x0 = 16 + (walk ? 1.2 * Math.sin(TAU * q - 1.6) : 0) + (hurt ? -1.4 : 0);
  const y0 = 24 + bob;
  const lean = dead ? 70 : A ? A.lean : hurt ? -14 : walk ? 6 + 6 * Math.sin(TAU * q - 1.6) : sway(q) * 7;
  const beat = walk ? Math.sin(TAU * q * 2) : Math.sin(TAU * q);
  const open = dead ? 0.2 : hurt ? 1 : 0.55 + 0.45 * beat;
  const WP = mix(PINK.hi, '#ffffff', 0.35);

  // Petal wings from her back (behind her, to the left), an upper and a lower pair, beating slowly.
  const back = [x0 - 2.4, y0 - 1.6];
  const wings = (k, c) => [
    ...wing(back[0], back[1], -150 + 34 * (1 - open), 9 * k, 3.2 * k, c, '#ffffff'),
    ...wing(back[0], back[1] + 1.4, 165 - 26 * (1 - open), 6.4 * k, 2.4 * k, c, '#ffffff'),
  ];
  out.push(...spin(wings(0.85, mix(WP, PINK.base, 0.35)), x0, y0, lean));

  const body = [];
  // Legs: two tiny ones dangling under the skirt, kicking a little as she drifts.
  const kick = walk ? Math.sin(TAU * q - 2) * 1.2 : 0.4 * sway(q);
  body.push(...stroke([[x0 - 1, y0 + 4], [x0 - 1.6 + kick, y0 + 8.4]], 1.1, SKIN.sh, false), ...stroke([[x0 + 1.2, y0 + 4], [x0 + 1.6 - kick, y0 + 8.8]], 1.1, SKIN.base, false),
    F(E(x0 - 1.6 + kick, y0 + 8.7, 1, 0.8, PINK.sh)), F(E(x0 + 1.6 - kick, y0 + 9.1, 1, 0.8, PINK.base)));
  // The petal skirt: five petals hanging from the waist, back ones darker, hems swinging late.
  const hem = walk ? Math.sin(TAU * q - 2.4) * 8 : sway(q - 0.2) * 5;
  [[140, PINK.sh], [40, PINK.sh], [115, PINK.base], [65, PINK.base], [90, PINK.hi]].forEach(([a, c]) => body.push(petal(x0, y0 + 0.6, a + hem * 0.3, 6, 3, c)));
  body.push(E(x0, y0 - 0.4, 2.8, 2.6, SKIN.base), crescent(x0, y0 - 0.4, 2.8, 2.6, SKIN.sh, { k: 0.3, a0: 100, a1: 220 }));
  out.push(...spin(body, x0, y0, lean * 0.6));

  // Arms: the far one tucked, the near one waving, or throwing.
  const armA = A ? A.arm : hurt ? -140 : idle ? -30 + 20 * Math.sin(TAU * q) : -10 + 8 * Math.sin(TAU * q - 1);
  const sh = [x0 + 1.6, y0 - 1.6];
  const hand = [sh[0] + Math.sin(armA * D2R) * 4.6, sh[1] + Math.cos(armA * D2R) * 4.6];
  const armShapes = [...stroke([sh, hand], 1.2, SKIN.base, false), E(hand[0], hand[1], 1, 1, SKIN.base)];
  if (A && !A.pet) armShapes.push(petal(hand[0], hand[1], -60, 3.6, 1.8, PINK.base, false));
  out.push(...spin([...stroke([[x0 - 1.4, y0 - 1.6], [x0 - 2.6, y0 + 1.8]], 1.2, SKIN.sh, false)], x0, y0, lean * 0.6));

  // The head: big and round (she is a chibi), under a cherry-bloom hat with petal bangs.
  const hx = x0 + 1;
  const hy = y0 - 9.6 + (walk ? -0.5 * Math.sin(TAU * q - 2.2) : 0);
  const head = [];
  head.push(E(hx, hy, 7, 6.6, SKIN.base), crescent(hx, hy, 7, 6.6, SKIN.sh, { k: 0.28, a0: 115, a1: 215 }), shine(hx, hy, 7, 6.6, '#ffffff', 0, 0.9));
  // Soft pink hair: a bob of petal locks round the back and sides of the head.
  for (const [x, y, a, c] of [[-5.6, 0.6, 105, PINK.sh], [-4.6, -2.8, 150, PINK.base], [-6.4, 3.6, 95, PINK.sh]]) head.push(petal(hx + x, hy + y, a, 5, 2.6, c, false));
  // The bloom hat: five big petals round a golden heart, tilted back, two leaves.
  const tilt = walk ? Math.sin(TAU * q - 2.8) * 6 : sway(q - 0.3) * 4;
  const hat = [];
  const cx = hx - 1;
  const cy = hy - 6;
  hat.push(O(cx - 5.4, cy + 1.6, 2.8, 1.2, 160, '#7fd07a'), O(cx + 5.2, cy + 2, 2.6, 1.1, 20, '#6cc46c'));
  for (let i = 0; i < 5; i++) hat.push(petal(cx, cy, -90 + (i - 2) * 44, 5.4, 2.8, i === 2 ? PINK.hi : i % 2 ? PINK.base : PINK.sh));
  hat.push(E(cx, cy, 1.8, 1.5, '#ffe17a'), F(E(cx - 0.4, cy - 0.5, 0.6, 0.45, '#fff6c8')));
  for (const [dx, dy] of [[-1, -1.6], [1.2, -1.2], [0, 1.4]]) hat.push(F(E(cx + dx * 1.5, cy + dy, 0.35, 0.35, '#e09a2a')));
  head.push(...spin(hat, cx, cy + 2, tilt));
  // Petal bangs across the brow.
  for (const [x, a] of [[-2.4, 96], [0.6, 84], [3.4, 70]]) head.push(petal(hx + x, hy - 5.4, a, 3.6, 1.8, x > 0 ? PINK.base : PINK.sh, false));
  // Face (the front half of the head): shy droopy eyes, rosy cheeks, a small smile; a determined
  // look flinging a petal.
  const ey = hy + 1.2;
  const lashC = '#5a2a4a';
  const iris = ['#4a1a3e', '#a8407e', '#ffb8dc'];
  const act = A && f < 3 ? { lid: 0.2, slant: 0.6 } : mood === 'angry' ? { lid: 0.2, slant: 0.7, raise: 0.2 } : hurt ? { closed: 'squeeze' } : mood === 'happy' ? { closed: 'happy' } : mood === 'blink' ? { closed: 'blink' } : { lid: 0.3 };
  const fe = [hx + 0.4, ey];
  const ne = [hx + 4.4, ey - 0.1];
  if (dead) head.push(...deadEye(fe[0], fe[1], 1.5, { type: 'swirl', s: -1, c: lashC }), ...deadEye(ne[0], ne[1], 1.7, { type: 'swirl', c: lashC }));
  else head.push(...easyEye(fe[0], fe[1], { shape: 'animal', iris, lashC, lash: 0.6, flicks: 0, irisW: 1, irisH: 1, ...act, s: -1, w: 1.8, h: 2.3 }), ...easyEye(ne[0], ne[1], { shape: 'animal', iris, lashC, lash: 0.6, flicks: 0, irisW: 1, irisH: 1, ...act, s: 1, w: 2.1, h: 2.5 }));
  if (!dead) head.push(...cheek(fe[0] - 1.4, ey + 2.6, 1.1, { lines: 2 }), ...cheek(ne[0] + 1.6, ey + 2.6, 1.2, { lines: 2 }));
  const mx = hx + 2.8;
  const my = hy + 4.2;
  const mo = { s: 1, ink: '#a0386a' };
  if (A && f === 1) head.push(...mouth(mx, my, { ...mo, type: 'shout', open: 0.7, w: 0.9, h: 1.2, fangs: 0 }));
  else if (hurt) head.push(...mouth(mx, my, { ...mo, type: 'pained', open: 1, w: 1, h: 1 }));
  else if (dead) head.push(...mouth(mx, my, { ...mo, type: 'wavy', w: 1, amp: 0.15 }));
  else head.push(...mouth(mx, my, { ...mo, type: mood === 'angry' ? 'frown' : 'smile', w: 1, curve: mood === 'angry' ? -0.4 : 0.55 }));
  if (hurt) head.push(...sweat(hx - 5, hy - 3, 0.9));
  out.push(...spin(head, x0, y0, lean * 0.4), ...spin(armShapes, x0, y0, lean * 0.6));
  // The near wings, over her shoulder, a lighter pink.
  out.push(...spin(wings(1, WP).slice(0, 4), x0, y0, lean));

  // A petal always drifting off her.
  const drift = (q + 0.3) % 1;
  if (!dead) out.push(F(petal(x0 - 5 - drift * 6, y0 + 4 + drift * 12, 40 + drift * 200, 2.2, 1.1, PINK.base, false)));
  if (A?.pet) {
    const [dx, dy, sz] = A.pet;
    if (sz > 0) out.push(smear([[hand[0] - 4, hand[1] - 2], [hand[0] + dx * 0.5, hand[1] + dy * 0.5], [hand[0] + dx - 1.4, hand[1] + dy]], 2.6, '#ffe0ee'), petal(hand[0] + dx - 2, hand[1] + dy, 0, 3 * sz, 1.6 * sz, PINK.base, false));
    if (A.burst) for (let i = 0; i < 6; i++) out.push(F(petal(x0 + 15, y0, i * 60 + 15, 4, 1.4, i % 2 ? PINK.base : PINK.hi, false)), ...star(x0 + 15, y0, 2.2, '#ffd2ea'));
  }
  return { w: 36, h: 40, res: 3, shapes: shift(out, 2, 4) };
}

// ---------- Queen Bee (area boss) ----------

// Attack: the honey dipper slam. lift: the dipper raised (deg of the arm), rear: body reared back,
// dive: body dropped forward, splash: honey bursting where it lands.
const QUEEN_ATK = [
  // Wind-up (held): rising tall, the dipper hoisted high, chin up, wings flared.
  { arm: -165, rear: -10, drop: -3, splash: 0 },
  // Slam: the dipper brought down hard, the whole body following (a smear behind it).
  { arm: 40, rear: 10, drop: 2, splash: 0 },
  // Impact (held): honey bursting out in a ring of drops.
  { arm: 55, rear: 12, drop: 3, splash: 1 },
  // Lingering: the drops falling, the queen straightening, smug.
  { arm: 30, rear: 4, drop: 1, splash: 0.6 },
  // Recover: back to her haughty hover.
  { arm: -10, rear: -2, drop: 0, splash: 0 },
];

const GOLD = ramp('#ffd23c', { step: 9, turn: 12 });
const LACE = '#fffaf2';

function queenbee(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? QUEEN_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const out = [];
  // A heavy, regal hover: one slow rise and settle a loop, the train of her tail swaying after.
  const br = idle ? breath(q) : 0;
  const bob = dead ? 10 : A ? A.drop : walk ? -3.2 * Math.sin(TAU * q) : -br * 2.8;
  const bx = 40 + (hurt ? -2.4 : 0) + (walk ? Math.sin(TAU * q - 1.2) : 0);
  const by = 44 + bob;
  const rot = dead ? 30 : A ? A.rear : hurt ? -8 : walk ? 4 * Math.sin(TAU * q - 1.6) : sway(q) * 3;
  const up = Math.round(f) % 2 === 0;
  const flap = dead ? -10 : A?.arm < -100 ? -95 : hurt ? -80 : walk || idle ? (up ? -80 : -30) : -40;

  // Far wings: big and lacy, with a pale blur of the other stroke.
  if (!dead) out.push(...wing(bx - 6, by - 10, -90 + (up ? -30 : -80) * 0.6 - 40, 20, 7, mix(WING, '#ffffff', 0.6), mix(WINGV, '#ffffff', 0.6)));
  out.push(...wing(bx - 7, by - 10, -90 + flap * 0.6 - 48, 22, 8, WING, WINGV));

  // Her long train of a tail: a big striped abdomen sweeping down behind her, swaying a beat late.
  const tsw = walk ? 5 * Math.sin(TAU * q - 2.6) : idle ? sway(q - 0.3) * 3 : A ? -A.rear * 0.8 : 0;
  const tail = [];
  const tx = bx - 16;
  const ty = by + 6;
  tail.push(E(tx, ty, 16, 12, HONEY.base));
  for (const [x0, x1] of [[-11, -7], [-3, 1], [5, 9]]) tail.push(stripe(tx, ty, 16, 12, tx + x0, tx + x1, COCOA.base));
  tail.push(crescent(tx, ty, 16, 12, HONEY.sh, { k: 0.3, a0: 40, a1: 230 }), shine(tx, ty, 16, 12, HONEY.hi, 0, 1.1));
  tail.push(F(T([[tx - 15.4, ty - 2], [tx - 21, ty + 1], [tx - 15, ty + 3.4]], COCOA.deep)));
  out.push(...spin(tail, bx - 6, by, tsw + rot * 0.5));

  // Legs: dainty, crossed at the ankle, cocoa with gold cuffs.
  for (const [x, k] of [[-4, 0.8], [0, 1], [4, 0.9]]) {
    const top = [bx + x, by + 9];
    const foot = [bx + x - 1 + (walk ? Math.sin(TAU * q - 2.4) * 1.6 * k : 0), by + 18];
    out.push(...stroke([top, [lerp(top[0], foot[0], 0.5) + 1.2, lerp(top[1], foot[1], 0.5)], foot], 1.8, COCOA.base, false), F(E(top[0] + 0.6, top[1] + 4.6, 1.4, 0.8, GOLD.base)), E(foot[0], foot[1] + 0.4, 1.5, 1, COCOA.sh));
  }

  // The body: round and royal, in a golden bodice with a honeycomb pattern.
  const body = [E(bx, by, 13, 12, HONEY.base), crescent(bx, by, 13, 12, HONEY.sh, { k: 0.3, a0: 50, a1: 220, jag: 0.6 })];
  for (const [x, y] of [[-3, 2], [2, 2], [-0.5, 6], [4.5, 6], [-5.5, 6], [2, 10]]) {
    const pts = [];
    for (let k = 0; k < 6; k++) pts.push([bx + x + Math.cos((k / 6) * TAU) * 2.2, by + y + Math.sin((k / 6) * TAU) * 2]);
    body.push(F(T(pts, GOLD.hi)), ...stroke([...pts, pts[0]], 0.35, GOLD.sh));
  }
  body.push(shine(bx, by, 13, 12, '#fff6d0', 0, 1));
  // The lace ruff: a ring of scalloped white puffs standing up round her neck.
  for (let i = 0; i < 9; i++) {
    const a = (-10 + i * 22) * D2R;
    body.push(E(bx + 5 + Math.cos(a) * 9, by - 6 + Math.sin(a) * 3, 4.2, 3.4, i % 2 ? LACE : '#ffffff'), F(E(bx + 5 + Math.cos(a) * 9, by - 4.8 + Math.sin(a) * 3, 1.4, 0.9, '#f0e0ee')));
  }
  out.push(...spin(body, bx, by, rot * 0.6));


  // Near wing, from her back, behind her head.
  out.push(...wing(bx - 4, by - 11, -90 + flap * 0.6 - 30, 24, 8.6, mix(WING, '#ffffff', 0.2), WINGV));

  // The head: a big fuzzy cream ball, haughty chin tilted up, under her honeycomb crown with a
  // honey-drop jewel; long antennae curling back with gold pom tips.
  const hx = bx + 10;
  const hy = by - 20 + (walk ? -0.6 * Math.sin(TAU * q - 2) : 0) + (A ? -A.rear * 0.15 : 0);
  const head = [];
  const aph = walk ? TAU * q - 2.6 : TAU * q - 1.4;
  for (const [x, a0, near] of [[-3, -120, false], [2, -80, true]]) {
    const pts = chain(hx + x - 2, hy - 12, a0 + (dead ? 60 : hurt ? 30 : 0), [4, 4, 3.6, 3], (i) => (i ? -18 : 0) + wave(aph + (near ? 0 : 0.9), 5)(i));
    head.push(...stroke(pts.map(([x2, y2]) => [x2, y2]), 1, COCOA.base, false));
    const t = pts.at(-1);
    head.push(E(t[0], t[1], 2, 2, near ? GOLD.base : GOLD.sh), F(E(t[0] + 0.5, t[1] - 0.6, 0.7, 0.5, '#fff6d0')));
  }
  head.push(E(hx, hy, 13, 12.2, FUZZ.base), crescent(hx, hy, 13, 12.2, FUZZ.sh, { k: 0.3, a0: 100, a1: 230, jag: 0.6 }), shine(hx, hy, 13, 12.2, '#ffffff', 0, 1.1));
  // Honey-gold hair swept up in a bouffant under the crown, a curl at the front.
  head.push(E(hx - 3, hy - 8, 10.4, 6, HONEY.base), crescent(hx - 3, hy - 8, 10.4, 6, HONEY.sh, { k: 0.35, a0: 120, a1: 220 }), O(hx + 7.4, hy - 6.4, 3.4, 2.2, -30, HONEY.base), F(E(hx - 4, hy - 10.6, 4, 1.4, HONEY.hi)));
  // The crown: a band of honeycomb cells with three points, a honey-drop jewel in the middle.
  const crown = [];
  const cx = hx - 2;
  const cy = hy - 13.4;
  crown.push(T([[cx - 7, cy + 2], [cx - 7, cy - 3], [cx - 4.6, cy - 1], [cx - 2.4, cy - 6], [cx, cy - 1.4], [cx + 2.4, cy - 6], [cx + 4.6, cy - 1], [cx + 7, cy - 3], [cx + 7, cy + 2]], GOLD.base),
    F(T([[cx - 7, cy + 2], [cx - 7, cy - 0.6], [cx + 7, cy - 0.6], [cx + 7, cy + 2]], GOLD.sh)));
  for (const x of [-4.6, -1.6, 1.4, 4.4]) crown.push(...stroke([[cx + x - 1, cy + 0.6], [cx + x, cy - 0.2], [cx + x + 1, cy + 0.6], [cx + x, cy + 1.4], [cx + x - 1, cy + 0.6]], 0.3, GOLD.sh));
  crown.push(F(T([[cx, cy - 4.8], [cx + 1.4, cy - 2.6], [cx + 1.2, cy - 1.4], [cx, cy - 0.8], [cx - 1.2, cy - 1.4], [cx - 1.4, cy - 2.6]], '#ff9a2a')), F(E(cx - 0.4, cy - 2.6, 0.4, 0.6, '#fff0c8')));
  for (const x of [-7, 7, -2.4, 2.4]) crown.push(F(E(cx + x, cy + (Math.abs(x) > 5 ? -3 : -6), 0.7, 0.7, '#ffffff')));
  head.push(...spin(crown, cx, cy, -8 + (A ? A.rear * 0.3 : 0)));
  // Her face: heavy-lidded, long-lashed, a beauty mark; furious when she means it.
  beeFace(head, hx - 0.6, hy + 1, 1.85, mood, Boolean(A) && f < 3, { queen: true });
  if (!dead) head.push(F(E(hx + 9, hy + 6.6, 0.5, 0.5, '#5a2a3a')));
  out.push(...spin(head, bx, by, rot * 0.3 - 4));

  // The near arm and the honey dipper scepter, raised and brought down in the slam; idle, she
  // twirls it lazily; hurt, it flails.
  const armA = A ? A.arm : hurt ? -120 : angry ? -40 : idle ? -10 + 10 * Math.sin(TAU * q) : walk ? 5 * Math.sin(TAU * q - 1) : 0;
  const sh = [bx + 8, by - 4];
  const el = [sh[0] + Math.sin((armA + 20) * D2R) * 5, sh[1] + Math.cos((armA + 20) * D2R) * 5];
  const hand = [el[0] + Math.sin(armA * D2R) * 5, el[1] + Math.cos(armA * D2R) * 5];
  const dip = [];
  // The dipper: a long wooden handle and a fat ridged honey-dripping head.
  const da = armA * D2R;
  const dirx = Math.sin(da);
  const diry = Math.cos(da);
  const end = [hand[0] + dirx * 13, hand[1] + diry * 13];
  dip.push(...stroke([[hand[0] - dirx * 3, hand[1] - diry * 3], end], 1.6, '#c98a5a', false));
  const dh = [end[0] + dirx * 3, end[1] + diry * 3];
  dip.push(O(dh[0], dh[1], 4.4, 3, armA + 90, GOLD.base));
  for (const k of [-2, 0, 2]) dip.push(...stroke([[dh[0] + dirx * k - diry * 3, dh[1] + diry * k + dirx * 3], [dh[0] + dirx * k + diry * 3, dh[1] + diry * k - dirx * 3]], 0.5, GOLD.sh));
  if (!dead) dip.push(F(E(dh[0] + 0.4, dh[1] + 4.4 + (q * 3) % 2, 1, 1.4, '#ffb020')));
  out.push(...stroke([sh, el, hand], 2.4, COCOA.base, false), E(hand[0], hand[1], 1.8, 1.8, COCOA.sh), ...dip);


  if (A && f === 1) out.push(smear([[bx + 12, by - 34], [bx + 24, by - 16], [bx + 26, by + 6]], 6, '#fff2c0'));
  if (A?.splash) {
    const k = A.splash;
    for (let i = 0; i < 8; i++) {
      const a = (-170 + i * 22) * D2R;
      const r = 10 + 10 * k;
      out.push(E(bx + 26 + Math.cos(a) * r, by + 18 + Math.sin(a) * r * 0.5 + (1 - k) * 6, 2 * k + 1, 2.4 * k + 1, i % 2 ? GOLD.base : '#ffb020'));
    }
    out.push(...star(bx + 26, by + 14, 5 * k, '#ffe17a'));
  }
  return { w: 84, h: 76, res: 3, shapes: shift(out, 6, 6) };
}

// ---------- The Queen Bee, rigged ----------
// (2026-11-03, the boss reanimation.) A live skeleton (render/mobs/rig.js): her lacy wings really
// buzz, her striped train of an abdomen trails behind her hover, her dainty legs dangle and sway,
// her antennae bounce, her crown wobbles, and her honey dipper swings up over her head and down
// into a splash of honey. Rig space: the floor under her at (0, 0).
const QB = {
  // (The wing's own two shapes, with its veins drawn a touch thicker to read at a part's size.)
  wing: (key, len, wid, c, v) => part(`qbee|wing|${key}`, len + 4, wid * 2 + 4, () => [...wing(2, wid + 2, 0, len, wid, c, v).slice(0, 2), ...stroke([[2, wid + 2], [2 + len * 0.8, wid + 2 - len * 0.1]], 0.8, v), ...stroke([[2, wid + 2], [2 + len * 0.6, wid + 2 + len * 0.1]], 0.8, v)]),
  tail: () => part('qbee|tail', 40, 30, () => {
    const tx = 22;
    const ty = 15;
    const out = [E(tx, ty, 16, 12, HONEY.base)];
    for (const [x0, x1] of [[-11, -7], [-3, 1], [5, 9]]) out.push(stripe(tx, ty, 16, 12, tx + x0, tx + x1, COCOA.base));
    out.push(crescent(tx, ty, 16, 12, HONEY.sh, { k: 0.3, a0: 40, a1: 230 }), shine(tx, ty, 16, 12, HONEY.hi, 0, 1.1), F(T([[tx - 15.4, ty - 2], [tx - 21, ty + 1], [tx - 15, ty + 3.4]], COCOA.deep)));
    return out;
  }),
  legs: () => part('qbee|legs', 18, 16, () => {
    const out = [];
    for (const [x] of [[-4], [0], [4]]) {
      const top = [9 + x, 2];
      const foot = [8 + x, 11];
      out.push(...stroke([top, [top[0] + 1.2, 6.5], foot], 1.8, COCOA.base, false), F(E(top[0] + 0.6, top[1] + 4.6, 1.4, 0.8, GOLD.base)), E(foot[0], foot[1] + 0.4, 1.5, 1, COCOA.sh));
    }
    return out;
  }),
  body: () => part('qbee|body', 44, 40, () => {
    const bx = 20;
    const by = 22;
    const out = [E(bx, by, 13, 12, HONEY.base), crescent(bx, by, 13, 12, HONEY.sh, { k: 0.3, a0: 50, a1: 220, jag: 0.6 })];
    for (const [x, y] of [[-3, 2], [2, 2], [-0.5, 6], [4.5, 6], [-5.5, 6], [2, 10]]) {
      const pts = [];
      for (let k = 0; k < 6; k++) pts.push([bx + x + Math.cos((k / 6) * TAU) * 2.2, by + y + Math.sin((k / 6) * TAU) * 2]);
      out.push(F(T(pts, GOLD.hi)), ...stroke([...pts, pts[0]], 0.35, GOLD.sh));
    }
    out.push(shine(bx, by, 13, 12, '#fff6d0', 0, 1));
    for (let i = 0; i < 9; i++) {
      const a = (-10 + i * 22) * D2R;
      out.push(E(bx + 5 + Math.cos(a) * 9, by - 6 + Math.sin(a) * 3, 4.2, 3.4, i % 2 ? LACE : '#ffffff'), F(E(bx + 5 + Math.cos(a) * 9, by - 4.8 + Math.sin(a) * 3, 1.4, 0.9, '#f0e0ee')));
    }
    return out;
  }),
  head: (mood, atk) => part(`qbee|head|${mood}|${atk}`, 36, 36, () => {
    const hx = 18;
    const hy = 20;
    const out = [E(hx, hy, 13, 12.2, FUZZ.base), crescent(hx, hy, 13, 12.2, FUZZ.sh, { k: 0.3, a0: 100, a1: 230, jag: 0.6 }), shine(hx, hy, 13, 12.2, '#ffffff', 0, 1.1)];
    out.push(E(hx - 3, hy - 8, 10.4, 6, HONEY.base), crescent(hx - 3, hy - 8, 10.4, 6, HONEY.sh, { k: 0.35, a0: 120, a1: 220 }), O(hx + 7.4, hy - 6.4, 3.4, 2.2, -30, HONEY.base), F(E(hx - 4, hy - 10.6, 4, 1.4, HONEY.hi)));
    beeFace(out, hx - 0.6, hy + 1, 1.85, mood, Boolean(atk), { queen: true });
    if (mood !== 'dead') out.push(F(E(hx + 9, hy + 6.6, 0.5, 0.5, '#5a2a3a')));
    return out;
  }),
  crown: () => part('qbee|crown', 18, 12, () => {
    const cx = 9;
    const cy = 8;
    const out = [T([[cx - 7, cy + 2], [cx - 7, cy - 3], [cx - 4.6, cy - 1], [cx - 2.4, cy - 6], [cx, cy - 1.4], [cx + 2.4, cy - 6], [cx + 4.6, cy - 1], [cx + 7, cy - 3], [cx + 7, cy + 2]], GOLD.base), F(T([[cx - 7, cy + 2], [cx - 7, cy - 0.6], [cx + 7, cy - 0.6], [cx + 7, cy + 2]], GOLD.sh))];
    out.push(F(T([[cx, cy - 4.8], [cx + 1.4, cy - 2.6], [cx + 1.2, cy - 1.4], [cx, cy - 0.8], [cx - 1.2, cy - 1.4], [cx - 1.4, cy - 2.6]], '#ff9a2a')));
    return out;
  }),
  pom: (near) => part(`qbee|pom|${near}`, 6, 6, () => [E(3, 3, 2, 2, near ? GOLD.base : GOLD.sh), F(E(3.5, 2.4, 0.7, 0.5, '#fff6d0'))]),
  arm: () => part('qbee|arm', 14, 8, () => [...stroke([[2, 4], [11, 4]], 2.4, COCOA.base, false), E(11, 4, 1.8, 1.8, COCOA.sh)]),
  // The dipper along +x from the grip at (4, 6): the handle, then the fat ridged honey head.
  dipper: () => part('qbee|dipper', 26, 12, () => {
    const out = [...stroke([[1, 6], [17, 6]], 1.6, '#c98a5a', false), O(20, 6, 4.4, 3, 0, GOLD.base)];
    for (const k of [-2, 0, 2]) out.push(...stroke([[20 + k, 3], [20 + k, 9]], 0.5, GOLD.sh));
    return out;
  }),
};
const queenBeeRig = makeRig({
  w: 60,
  h: 64,
  stride: 1e9,
  fast: ['arm', 'rear'],
  kick: { rear: -1.6, crown: 4, a0: 4 },
  springs: { tail: [70, 5], legs: [60, 4], crown: [90, 5], a0: [70, 5], a1: [60, 4], a2: [50, 3.5], a3: [45, 3] },
  pose(m, a) {
    const t = a.t;
    const idle = { bob: -Math.sin(t * 2) * 2.8, rear: Math.sin(t * 1.2) * 0.05, arm: (-10 + 10 * Math.sin(t * 1.6)) * D2R, x: 0 };
    const walk = { bob: -3.2 * Math.sin(t * 6), rear: 4 * D2R * Math.sin(t * 6 - 1.6), arm: 5 * D2R * Math.sin(t * 6 - 1), x: Math.sin(t * 6 - 1.2) };
    const antic = { bob: 3, rear: -10 * D2R, arm: -165 * D2R, x: 0 };
    const strike = { bob: -3, rear: 12 * D2R, arm: 52 * D2R, x: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S, a) => ({ tail: -S.rear * 1.6 + Math.sin(a.t * 2 - 1) * 0.06, legs: -S.rear * 1.2 - S.bob * 0.02, crown: -8 * D2R - S.rear * 0.8, a0: -2.1 - S.rear * 1.5, a1: -18 * D2R + Math.sin(a.t * 2.4) * 0.15, a2: -18 * D2R + Math.sin(a.t * 2.4 - 1) * 0.15, a3: -18 * D2R + Math.sin(a.t * 2.4 - 2) * 0.15 }),
  parts: [
    { name: 'root', at: (S) => [S.x, -26 + S.bob], rot: (S) => S.rear * 0.6 },
    // The wings buzz: a fast beat between two angles (a pale blur of the other stroke behind).
    { name: 'wingBlur', parent: 'root', pivot: [2, 9], at: () => [-6, -10], rot: (S, a) => (-90 - 48 + (0.5 + 0.5 * Math.sin(a.t * 38 + 1.5)) * -30) * D2R, s: () => QB.wing('blur', 20, 7, mix(WING, '#ffffff', 0.6), mix(WINGV, '#ffffff', 0.6)) },
    { name: 'wingFar', parent: 'root', pivot: [2, 10], at: () => [-7, -10], rot: (S, a) => (-90 - 48 + lerp(-80, -30, 0.5 + 0.5 * Math.sin(a.t * 38)) * 0.6) * D2R, s: () => QB.wing('far', 22, 8, WING, WINGV) },
    { name: 'tail', parent: 'root', pivot: [32, 9], at: () => [-6, 0], rot: (S) => S.tail, s: () => QB.tail() },
    { name: 'legs', parent: 'root', pivot: [9, 2], at: () => [0, 8], rot: (S) => S.legs, s: () => QB.legs() },
    { name: 'body', parent: 'root', pivot: [20, 22], at: () => [0, 0], s: () => QB.body() },
    { name: 'wingNear', parent: 'root', pivot: [2, 10.6], at: () => [-4, -11], rot: (S, a) => (-90 - 30 + lerp(-80, -30, 0.5 + 0.5 * Math.sin(a.t * 38 + 0.4)) * 0.6) * D2R, s: () => QB.wing('near', 24, 8.6, mix(WING, '#ffffff', 0.2), WINGV) },
    { name: 'head', parent: 'root', pivot: [18, 20], at: () => [10, -20], rot: (S) => -4 * D2R - S.rear * 0.3, s: (a) => QB.head(a.face, a.atk) },
    ...[[-3, false], [2, true]].flatMap(([x, near], j) => [
      ...chainParts(`ant${j}`, { parent: 'head', at: () => [x - 2, -12], key: 'qbee|ant', segs: [[4, 1, 1], [4, 1, 1], [3.6, 1, 1], [3, 1, 1]], color: COCOA.base, rot: (S, a, i) => S[`a${i}`] + (i === 0 && near ? 0.7 : 0) }),
      { name: `pom${j}`, parent: `ant${j}3`, pivot: [3, 3], at: () => [3, 0], s: () => QB.pom(near) },
    ]),
    { name: 'crown', parent: 'head', pivot: [9, 8], at: () => [-2, -13.4], rot: (S) => S.crown, s: () => QB.crown() },
    // (The dipper's angle reads like the old frames: 0 straight down, + swinging forward.)
    { name: 'arm', parent: 'root', pivot: [2, 4], at: () => [8, -4], rot: (S) => Math.PI / 2 - S.arm, s: () => QB.arm() },
    { name: 'dipper', parent: 'arm', pivot: [4, 6], at: () => [10, 0], s: () => QB.dipper() },
  ],
  fx(ctx, m, a, S, mat) {
    // A drop of honey hanging off the dipper, and the splash where it lands.
    inPart(ctx, mat, 'dipper', () => {
      ctx.globalAlpha = a.alpha;
      ctx.fillStyle = '#ffb020';
      ctx.beginPath();
      ctx.arc(16, 4 + (a.t * 3) % 2, 1.2, 0, TAU);
      ctx.fill();
    });
    if (a.ph.since >= 0 && a.ph.since < 0.5) {
      const u = a.ph.since / 0.5;
      for (let i = 0; i < 8; i++) {
        const ang = (-170 + i * 22) * D2R;
        const r = 10 + 10 * u;
        ctx.globalAlpha = a.alpha * (1 - u);
        ctx.fillStyle = i % 2 ? GOLD.base : '#ffb020';
        ctx.beginPath();
        ctx.ellipse(28 + Math.cos(ang) * r, -6 + Math.sin(ang) * r * 0.5, 2 + u, 2.4 + u, 0, 0, TAU);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  bumble: { walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [60, 220, 160], draw: bumble },
  petalsprite: { walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 240, 200], draw: petalsprite },
  queenbee: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [120, 420, 200, 240], draw: queenbee, rig: queenBeeRig },
};

export const INFO = {
  bumble: { name: 'Bumble', w: 24, h: 24 },
  petalsprite: { name: 'Petal Sprite', w: 22, h: 32 },
  queenbee: { name: 'The Queen Bee', w: 60, h: 64 },
};
