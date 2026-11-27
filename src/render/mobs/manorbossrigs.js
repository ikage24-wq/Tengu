// The Moonlit Manor's bosses, remade from scratch for Chapter 4 (2026-11-18). Live puppets on the rig
// (rig.js), chibi, outer outline only, faces bare; everything that grows out of them is rooted in
// them (plumes and ribbons at their sockets, capes at the shoulders, keys at the belt).
//
//   velvet       Madame Velvet, the Head Housekeeper: a plump ghost cat, a plum velvet bodice and short
//                peplum with an apron, her ghost body tapering into a wisp (redrawn 2026-11-19), mob
//                cap, half-moon spectacles, keys at her belt, a teapot always in hand.
//
// (The Ballroom's pair, once the Waltzing Armours, were remade 2026-11-26 as Dame Rondo the Tailcoat
// Penguin and Dame Minuet the Upside-down Bat, on their own base copies: render/waltzrondo/ and
// render/waltzminuet/; Lady Marigold, the Eternal Hostess, was remade the same day on her own copy of
// the spirit base: render/marigold/.) Madame Velvet pours tea high when "Tea is served!", spins and flings plates
// along the floor, and rings a bell for the maids.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, inPart, TAU } from './rig.js';
import { D2R, INK, fr, arcP, taper, faceSprite, hold, window1, put, shift, MOODS, moodOf, dot, puff, sparkle, note } from './rigkit.js';
import { sprite } from '../pixel.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
// A closed shape through these points, its corners rounded (corner cutting).
const blob = (pts, c, n = 3) => {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      out.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = out;
  }
  return T(q, c);
};
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
// Moves a pose toward another by k (0..1); the springs then ease it.
const blendIn = (o, k, pose) => {
  if (k <= 0) return;
  for (const key of Object.keys(pose)) o[key] = (o[key] ?? 0) + (pose[key] - (o[key] ?? 0)) * k;
};
// A turn: the whole of her mirrored for half of each turn (wraps a rig's draw).
const spinWrap = (rig, spinning) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => draw(ctx, m, spinning(m, a) ? { ...a, flip: !a.flip, spun: true } : a);
  return rig;
};

// =====================================================================================
// Madame Velvet
// =====================================================================================
const PLUM = ramp('#8a4a9a', { step: 9, turn: 8, lift: 12 });
const GHOSTV = ramp('#f0eaff', { step: 8, turn: 8, lift: 3 });
// (2026-11-27, the player: her edge read as a crunchy near-black pixel step beside the soft remakes.
// Her own pair maker, not the shared one: the outlined pass draws a smooth anti-aliased ring in a
// deeper shade of each part's own colour (`ink: 'own'`), the bare pass as before.)
const vv = (key, w, h, shapes, pad = 3) => [
  () => sprite(`rig|vv|${key}|own`, () => ({ w: Math.ceil(w), h: Math.ceil(h), shapes: shapes(), res: 2, soft: 'cel', crisp: true, selout: true, pad, ink: 'own' })),
  () => sprite(`rig|vv|${key}|bare`, () => ({ w: Math.ceil(w), h: Math.ceil(h), shapes: shapes(), res: 2, soft: 'cel', crisp: true, bare: true, pad })),
];
// Below the waist (redrawn 2026-11-19, the player's pick "A, Ghost Cat Housekeeper": her long dress
// became this): a short velvet peplum with a lace edge and a short apron over her ghost body, which
// tapers away into the wisp her tail curls from. Box 62 x 40; the waist at (31, 1).
const vvDress = () => {
  const out = [blob([[13, 0.6], [49, 0.6], [47, 13], [40, 26], [33, 35], [28, 35], [22, 24], [16, 12]], GHOSTV.base, 2)];
  out.push(crescent(31, 16, 17, 19, GHOSTV.sh, { k: 0.16, a0: 100, a1: 220 }), F(taper([[38, 6], [36, 24]], 1.6, 1, '#ffffff')));
  out.push(T([[15, 0.6], [47, 0.6], [51, 9], [11, 9]], PLUM.base), F(T([[15, 0.6], [19, 0.6], [15, 9], [11, 9]], PLUM.sh)));
  for (let i = 0; i < 11; i++) out.push(E(12 + i * 3.8, 9.6 + (i % 2) * 0.6, 2.2, 1.8, '#fff2f8'));
  out.push(T([[27, 2], [41, 2], [43, 15], [25, 15]], '#ffffff'), F(R(30, 6, 8, 4, '#f2ecf8')), F(R(30, 6, 8, 0.8, '#d8d0e8')));
  for (let i = 0; i < 5; i++) out.push(E(26 + i * 4, 15.4, 1.8, 1.4, '#ffffff'));
  return out;
};
// The bodice: plump, a white apron bib, gold buttons, a white collar. Box 44 x 28; the waist at (22, 27).
const vvTorso = () => [
  E(22, 15, 18, 12.4, PLUM.base),
  F(T([[22, 4], [34, 7], [38, 18], [30, 27], [24, 27]], '#ffffff')),
  ...[0, 1, 2].map((k) => F(E(27, 10 + k * 5, 1, 1, GOLD.base))),
  T([[10, 4], [22, 0.8], [34, 4], [30, 7.4], [22, 5.4], [14, 7.4]], '#ffffff'),
  crescent(22, 15, 18, 12.4, PLUM.sh, { k: 0.2, a0: 100, a1: 220 }),
];
// Her big round ghost-cat head, fluffy cheeks, whiskers. Box 54 x 46; the neck at (27, 44).
const vvHead = () => [
  E(27, 23, 23.4, 20.6, GHOSTV.base),
  E(10, 33, 6, 4.6, GHOSTV.base), E(45, 32, 6, 4.6, GHOSTV.base),
  ...stroke([[44, 30], [51, 28.6]], 0.6, '#c8b8d8'), ...stroke([[44, 32.4], [51, 33]], 0.6, '#c8b8d8'),
  crescent(27, 23, 23.4, 20.6, GHOSTV.sh, { k: 0.2, a0: 100, a1: 220 }),
  shine(27, 22, 23.4, 20.6, '#ffffff', 0, 0.7),
];
const vvEar = (far) => () => [T([[1, 13], [4, 1], [13, 13]], far ? GHOSTV.sh : GHOSTV.base), F(T([[3.6, 11.6], [5, 4.4], [10, 11.6]], '#ffc8d8'))];
// The mob cap: a white frilled cap, a plum ribbon round it. Box 46 x 18; sits at (23, 15).
const vvCap = () => {
  const out = [E(23, 9, 17, 7.6, '#ffffff')];
  for (let i = 0; i < 9; i++) out.push(E(5 + i * 4.5, 14 + (i % 2) * 0.6, 2.6, 2.2, '#ffffff'));
  out.push(F(R(8, 10.4, 30, 2, PLUM.base)), F(T([[33, 11.4], [39, 8], [39.6, 14.6]], PLUM.hi)), F(E(33, 11.4, 1.4, 1.4, PLUM.sh)));
  return out;
};
// Half-moon spectacles (drawn bare over her face). Same box as the head.
const vvSpecs = () => [
  ...stroke(arcP(31, 24.6, 4.4, 4, 0, 180, 10), 1, GOLD.base), ...stroke([[26.6, 24.6], [35.4, 24.6]], 0.9, GOLD.base),
  ...stroke(arcP(41.4, 24, 3.8, 3.6, 0, 180, 10), 1, GOLD.base), ...stroke([[37.6, 24], [45.2, 24]], 0.9, GOLD.base),
  ...stroke([[35.4, 24.6], [37.6, 24]], 0.8, GOLD.base),
  F(E(30, 26.6, 1.6, 0.8, '#ffffff')),
];
// A plump arm in a velvet sleeve, a white cuff, a ghostly paw. Box 24 x 14; the shoulder at (4, 7),
// the paw 14.6 along.
const vvArm = (far) => () => [taper([[4, 7], [15, 7]], 9.6, 8, far ? PLUM.sh : PLUM.base), F(R(13.4, 3.2, 2, 7.6, '#ffffff')), E(18.6, 7, 4.6, 4.4, far ? GHOSTV.sh : GHOSTV.base)];
// Her teapot, held by the handle. Box 26 x 18; gripped at (4, 9), its spout's tip at (24.6, 3.6).
const vvPot = () => [
  ...stroke(arcP(6, 9, 3.4, 4.4, 90, 270, 8), 1.8, '#e8e0f8', false),
  taper([[19, 10], [23, 6], [24.6, 3.6]], 3, 1.6, '#f4f0ff'),
  E(13.6, 10, 8, 6.6, '#f4f0ff'),
  E(13.6, 3.6, 4.6, 1.8, '#e8e0f8'), E(13.6, 2, 1.4, 1.4, GOLD.base),
  ...[[10, 9], [16, 12], [12, 13.4]].flatMap(([x, y]) => [F(E(x, y, 1.4, 1.4, '#c89ae8')), F(E(x, y, 0.6, 0.6, GOLD.base))]),
  shine(13.6, 10, 8, 6.6, '#ffffff', 0, 0.7),
];
// The handbell she calls the maids with. Box 12 x 18; held at (6, 2), hanging down.
const vvBell = () => [taper([[6, 1], [6, 6.4]], 2, 2, '#8a6a5a'), T([[3.6, 6], [8.4, 6], [10.4, 13], [11.4, 15.4], [0.6, 15.4], [1.6, 13]], GOLD.base), F(taper([[4.6, 8], [3, 14]], 0.9, 0.6, GOLD.hi)), E(6, 16.2, 1.3, 1.3, GOLD.sh)];
// The keys at her belt on their ring. Box 16 x 20; hung at (8, 2).
const vvKeys = () => [
  ...stroke(arcP(8, 4, 3, 3, 0, 360, 12), 1.1, GOLD.base, false),
  ...[[-3, 15], [0, 17], [3.4, 14]].flatMap(([dx, len]) => [taper([[8 + dx * 0.3, 6.4], [8 + dx, len]], 1.2, 1, GOLD.base), R(8 + dx, len - 2.4, 2, 1.2, GOLD.base), E(8 + dx * 0.3, 6.6, 1.2, 1.2, GOLD.sh)]),
];
// A wisp of her tail, curling out from under her hem. Box 20 x 14; root at (6, 7), the next 10 along.
const VV_TW = [11, 8.4, 5.6, 1.4];
const vvTail = (k) => () => [E(6, 7, VV_TW[k] / 2, VV_TW[k] / 2, GHOSTV.base), taper([[6, 7], [16, 7]], VV_TW[k], VV_TW[k + 1], GHOSTV.base), ...(k < 2 ? [E(16, 7, VV_TW[k + 1] / 2, VV_TW[k + 1] / 2, GHOSTV.base)] : [])];
const VV_DRESS = vv('dress', 62, 40, vvDress);
const VV_TORSO = vv('torso', 44, 28, vvTorso);
const VV_HEAD = vv('head', 54, 46, vvHead);
const VV_EAR = [false, true].map((f) => vv(`ear${f ? 1 : 0}`, 14, 14, vvEar(f)));
const VV_CAP = vv('cap', 46, 18, vvCap);
const VV_ARM = [false, true].map((f) => vv(`arm${f ? 1 : 0}`, 24, 14, vvArm(f)));
const VV_POT = vv('pot', 26, 18, vvPot);
const VV_BELL = vv('bell', 12, 18, vvBell);
const VV_KEYS = vv('keys', 16, 20, vvKeys);
const VV_TAIL = [0, 1, 2].map((k) => vv(`tail${k}`, 20, 14, vvTail(k)));
const vvSpecsSprite = () => sm('vv|specs', 54, 46, vvSpecs);
// Her own face, a stern ghost cat's: heavy lids level with the top of her half-moon specs, violet eyes
// with slit pupils peering down through them, one fine brow raised, a little pink nose and a prim cat
// mouth; she hisses with her fangs out when cross and rings out wide-eyed. Box 54 x 46.
const oLn = (pts, w, c = INK) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = ((-(by - ay) / d) * w) / 2;
    const ny = (((bx - ax) / d) * w) / 2;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return [F(T([...l, ...r.reverse()], c))];
};
const oArc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const oRing = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const oCut = (pts, lid) => pts.map(([px, py]) => [px, Math.max(py, lid(px))]);
const oSquint = (x, y, s, r, w, c = INK) => oLn([[x + s * r, y - r], [x - s * r * 0.8, y], [x + s * r, y + r]], w, c);
const oSpiral = (x, y, r, w, c, s = 1) => oLn(Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.8 * s) * r * (0.12 + i / 15), y + Math.sin(i * 0.8 * s) * r * (0.12 + i / 15)]), w, c);
const oDrop = (x, y, r, c = '#9ad8ff') => [F(E(x, y, r * 0.7, r, c)), F(E(x - r * 0.2, y - r * 0.3, r * 0.25, r * 0.25, '#ffffff'))];
const oStar = (x, y, r, c, n = 5, k = 0.45) => F(T(Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const oX = (x, y, w, h, wd, c = INK) => [...oLn([[x - w * 0.7, y - h * 0.55], [x + w * 0.7, y + h * 0.55]], wd, c), ...oLn([[x - w * 0.7, y + h * 0.55], [x + w * 0.7, y - h * 0.55]], wd, c)];
const oWave = (mx, my, hw, wd, c = INK) => oLn(Array.from({ length: 5 }, (_, i) => [mx - hw + (i * hw) / 2, my + (i % 2 ? -0.3 : 0.3)]), wd, c);
const VV_EYES = [[31, 26.4, -1, 2.6, 3.2], [41.4, 25.8, 1, 2.2, 2.8]];
const VV_BROW = '#9a7ab8';
const VV_MOUTH = '#6a2a4a';
const vvFang = (x, y) => F(T([[x - 0.45, y], [x + 0.45, y], [x, y + 0.9]], '#ffffff'));
const vvOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of VV_EYES) {
    // Fine brows: the far one raised (she doubts you), both down to scold, both up when pleased.
    const raise = mood === 'angry' ? 0 : mood === 'happy' || mood === 'shout' ? -0.8 : s > 0 ? -1.1 : 0;
    const inner = mood === 'angry' ? 1.1 : mood === 'hurt' ? -0.8 : 0;
    out.push(...oLn([[x - s * w * 1, y - h * 1.25 + raise + inner], [x + s * w * 0.1, y - h * 1.48 + raise], [x + s * w * 1.05, y - h * 1.32 + raise * 0.6]], 0.6, VV_BROW));
    if (mood === 'blink' || mood === 'sleep') out.push(...oLn(oArc(x, y + 0.2, w, h * 0.3, 15, 165, 8), 0.85));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 0.85));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.8, 0.85));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.7, '#8a5ac8', s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.8));
    else {
      const lid = mood === 'angry' ? (px) => y - h * 0.4 + (px - x) * -s * 0.55 : mood === 'shout' ? () => -99 : () => y - h * 0.56;
      const wide = mood === 'shout';
      const dy = wide ? 0 : h * 0.15;
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.08, w * 0.82, h * 0.84), lid), '#8a5ac8')), F(T(oCut(oRing(x, y + h * 0.45, w * 0.62, h * 0.4), lid), '#c8a8f0')));
      out.push(F(T(oCut(oRing(x, y + dy, w * (wide ? 0.3 : mood === 'angry' ? 0.12 : 0.18), h * (wide ? 0.34 : 0.6)), lid), INK)));
      out.push(F(T(oCut(oRing(x + w * 0.32, y + dy - h * 0.12, w * 0.2, w * 0.2, 0, 8), lid), '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 10), (px) => lid(px) - 0.25), 0.95));
    }
  }
  if (mood !== 'dead') for (const [bx, by, r] of [[27, 31, 2.2], [45, 30.4, 1.6]]) out.push(F(E(bx, by, r, r * 0.5, '#f4b4d4')));
  const [mx, my] = [37, 33];
  out.push(F(T([[mx - 0.65, my - 1.6], [mx + 0.65, my - 1.6], [mx, my - 0.85]], '#ff9ab8')));
  const omega = (k = 0) => [...oLn([[mx - 1.6, my - 0.3 - k], [mx - 0.8, my + 0.4], [mx, my - 0.15]], 0.5), ...oLn([[mx, my - 0.15], [mx + 0.8, my + 0.4], [mx + 1.6, my - 0.3 - k]], 0.5)];
  if (mood === 'shout') out.push(F(E(mx, my + 0.9, 1.6, 1.8, VV_MOUTH)), F(E(mx, my + 1.9, 0.9, 0.45, '#ff8fab')), vvFang(mx - 0.8, my - 0.7), vvFang(mx + 0.8, my - 0.7));
  else if (mood === 'angry') out.push(F(T(oArc(mx, my - 0.2, 1.8, 1.6, 0, 180, 8), VV_MOUTH)), vvFang(mx - 0.9, my - 0.15), vvFang(mx + 0.9, my - 0.15));
  else if (mood === 'happy') out.push(...omega(0.5), F(E(mx, my + 0.75, 0.55, 0.45, '#c84a7a')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1.6, 0.5));
  else if (mood === 'dead') out.push(...oLn([[mx - 1.2, my + 0.2], [mx + 1.2, my + 0.2]], 0.5));
  else out.push(...omega());
  if (mood === 'hurt') out.push(...oDrop(25.6, 28.6, 0.9));
  return out;
};
const vvFace = (mood) => sm(`vv|face|${mood}`, 54, 46, () => vvOwnFace(mood));
const vvPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({ name: `tail${k}${tag}`, parent: k ? `tail${k - 1}${tag}` : 'float', s: VV_TAIL[k][i], pivot: [6, 7], at: k ? () => [10, 0] : () => [-1.6, 0], rot: (S, a) => ((k ? 40 : 112) + Math.sin(a.t * 2.4 - k * 0.9) * 10 + S.tail * (k + 1) * 0.5) * D2R })),
    { name: `earF${tag}`, parent: 'neck', s: VV_EAR[1][i], pivot: [7, 13], at: () => [-13, -37], rot: (S) => (-16 + S.ear) * D2R },
    { name: `armF${tag}`, parent: 'waist', s: VV_ARM[1][i], pivot: [4, 7], at: () => [-8, -19], rot: (S) => (60 + S.armF) * D2R },
    { name: `dress${tag}`, parent: 'waist', s: VV_DRESS[i], pivot: [31, 1], rot: (S) => S.skirt * D2R },
    { name: `keys${tag}`, parent: 'waist', s: VV_KEYS[i], pivot: [8, 2], at: () => [13, 2], rot: (S) => clamp(S.keys, -40, 40) * D2R },
    { name: `torso${tag}`, parent: 'waist', s: VV_TORSO[i], pivot: [22, 27] },
    { name: `head${tag}`, parent: 'neck', s: VV_HEAD[i], pivot: [27, 44] },
    { name: `cap${tag}`, parent: 'neck', s: VV_CAP[i], pivot: [23, 15], at: () => [0, -34], rot: (S) => S.cap * D2R },
    { name: `earN${tag}`, parent: 'neck', s: VV_EAR[0][i], pivot: [7, 13], at: () => [11, -38], rot: (S) => (12 + S.ear) * D2R },
    { name: `pot${tag}`, parent: 'hand', s: VV_POT[i], pivot: [4, 9], alpha: (a) => 1 - (a.vvBell ?? 0), rot: (S) => (S.pot - (60 + S.armN) - S.lean) * D2R },
    { name: `bell${tag}`, parent: 'hand', s: VV_BELL[i], pivot: [6, 2], alpha: (a) => a.vvBell ?? 0, rot: (S, a) => (-(60 + S.armN) - S.lean + Math.sin(a.now * 26) * 34 * (a.vvBell ?? 0)) * D2R },
    { name: `armN${tag}`, parent: 'waist', s: VV_ARM[0][i], pivot: [4, 7], at: () => [9, -18], rot: (S) => (60 + S.armN) * D2R },
  ];
};
// The plates she flings: a stream of them skimming out along the floor both ways.
function vvPlates(ctx, m, a) {
  const start = m.slamming - 1.6;
  const s = a.now - start;
  if (s < 0.3 || s > 1.6) return;
  for (let k = 0; k < 8; k++) {
    const u = clamp((s - 0.3 - (k >> 1) * 0.16) / 1.0, 0, 1);
    if (u <= 0 || u >= 1) continue;
    const side = k % 2 ? 1 : -1;
    const x = side * (24 + u * 230);
    const y = -6 - Math.sin(u * Math.PI * 3) * 3;
    const rx = 7;
    const ry = Math.max(1.4, Math.abs(Math.cos(a.now * 18 + k)) * 6);
    const al = a.alpha * Math.min(1, (1 - u) * 4);
    ctx.globalAlpha = al;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6a8ad8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c8d8ff';
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.5, ry * 0.5, 0, 0, TAU);
    ctx.fill();
    puff(ctx, a, x - side * 10, -3, 5, 0.25 * (1 - u));
  }
}
export const velvetRig = spinWrap(makeRig({
  w: 120,
  h: 126,
  soft: true,
  stride: 30,
  recover: 0.8,
  springs: {
    x: [160, 16], bob: [80, 8], lean: [110, 11], head: [120, 10], ear: [120, 7], cap: [90, 7], armN: [150, 12], armF: [130, 11], pot: [140, 11], skirt: [100, 8], specY: [140, 12],
    keys: [60, 5], tail: [60, 6],
  },
  fast: ['x', 'lean', 'armN', 'pot'],
  kick: { lean: -120, head: -200, ear: 400, cap: 300, keys: 400, tail: 200 },
  turnKick: { ear: 260, keys: 300, skirt: 160, tail: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.1;
    const t = a.t + a.uidOff;
    const now = a.now;
    const br = Math.sin(t * 1.8);
    const lu = t % 12;
    const still = 1 - a.walkW;
    // (Between moves: a tsk-tsk with a shake of the head, polishing her teapot, a glance about over
    // her spectacles.)
    const tsk = hold(lu, 1.4, 1.7, 3, 3.4) * still;
    const polish = hold(lu, 5, 5.5, 7, 7.5) * still;
    const glance = hold(lu, 9, 9.4, 10.4, 10.8) * still;
    const tea = window1(now, m.teaAt, 1.9, 0.3, 0.4);
    const bell = window1(now, m.callAt, 1.7, 0.2, 0.35);
    const plates = m.slamming > now ? 1 : 0;
    const wind = plates && m.slamming - now > 1.3 ? 1 : 0;
    a.vvTea = tea;
    a.vvBell = bell;
    a.vvPlates = plates;
    a.vvPolish = polish;
    const idle = {
      x: 0, bob: br * 2, lean: 0, head: tsk * Math.sin(t * 9) * 7 - glance * 8, ear: br * 3 + tsk * 10, cap: 0, skirt: br * 1.4,
      armN: 30 - polish * 90, armF: 40 - tsk * 20, pot: polish * (-10 + Math.sin(t * 4) * 16), specY: glance * 1.6,
    };
    const walk = { x: 0, bob: Math.sin(t * 3) * 1.6, lean: 8, head: -2, ear: -10, cap: -4, skirt: -6, armN: 40, armF: 50, pot: 10, specY: 0 };
    // Her slap of tea: the pot drawn back, then flung forward, splashing.
    const antic = { x: -2, bob: 1, lean: -8, head: -6, ear: -12, cap: 4, skirt: 4, armN: 70, armF: 20, pot: -40, specY: 0 };
    const strike = { x: 6, bob: 0, lean: 10, head: 6, ear: 14, cap: -4, skirt: -6, armN: -70, armF: 50, pot: 95, specY: 0.6 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // "Tea is served!": the pot raised high and poured, a hostess's smile.
    blendIn(out, tea, { lean: -6, head: -6, armN: -110, pot: 72, ear: 6 });
    // The bell rung over her head.
    blendIn(out, bell, { lean: -4, head: -8, armN: -130, ear: -16, cap: 6 });
    // Plates: arms crossed to wind up, then flung wide as she spins.
    blendIn(out, plates, wind ? { lean: -6, bob: -2, armN: 90, armF: 90, pot: 0, head: 4 } : { lean: 0, bob: 3, armN: -60, armF: -60, pot: 20, head: -4, skirt: 8 });
    if (m.hp <= 0) blendIn(out, 1, { lean: 10, head: 18, armN: 60, armF: 60, pot: 120, bob: -4 });
    a.vvMood = bell > 0.3 ? 'shout' : tea > 0.3 || polish > 0.5 ? 'happy' : plates || tsk > 0.4 ? 'angry' : null;
    return out;
  },
  follow: (S, a) => ({ keys: -S.lean * 1.6 + a.walkW * 14 + Math.sin(a.t * 7) * 6 * a.walkW, tail: a.walkW * -18 + S.lean * 0.6 }),
  parts: [
    // (Floating 16 px higher, 2026-11-19: her ghost tail sank through the floor.)
    { name: 'float', parent: null, at: (S) => [S.x, -26 - S.bob], rot: (S) => S.lean * D2R },
    { name: 'waist', parent: 'float', at: () => [0, -34] },
    { name: 'neck', parent: 'waist', at: () => [1, -23], rot: (S) => S.head * D2R },
    { name: 'hand', parent: 'armN', at: () => [14.6, 0] },
    ...vvPass(false),
    ...vvPass(true),
    { name: 'face', parent: 'neck', s: (a) => vvFace(moodOf(a, a.vvMood)), pivot: [27, 44] },
    { name: 'specs', parent: 'neck', s: vvSpecsSprite, pivot: [27, 44], at: (S) => [0, S.specY] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The tea: poured from the spout in an arc, steam off it.
    const pourK = Math.max(a.vvTea, a.ph.strike);
    if (pourK > 0.05 && (a.vvBell ?? 0) < 0.5) {
      const M = mat('pot');
      const [lx, ly] = [20.6, -5.4];
      const sx = M[0] * lx + M[2] * ly + M[4];
      const sy = M[1] * lx + M[3] * ly + M[5];
      ctx.lineCap = 'round';
      ctx.globalAlpha = a.alpha * pourK * 0.9;
      ctx.strokeStyle = '#c8864a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i <= 8; i++) {
        const q = i / 8;
        ctx.lineTo(sx + q * 26, sy + q * q * Math.max(8, -sy - 6));
      }
      ctx.stroke();
      for (let k = 0; k < 5; k++) {
        const u = fr(a.now * 2.4 + k / 5);
        dot(ctx, a, sx + u * 26 + Math.sin(k * 3) * 2, sy + u * u * Math.max(8, -sy - 6), 1.4 * (1 - u * 0.5), pourK * 0.9, k % 2 ? '#e8b47a' : '#c8864a');
        puff(ctx, a, sx + u * 20, sy - 4 - u * 16, 2.4 + u * 4, pourK * 0.35 * Math.sin(u * Math.PI));
      }
    }
    // The bell's ring: little arcs flying off it, notes.
    if (a.vvBell > 0.2) inPart(ctx, mat, 'bell', () => {
      ctx.strokeStyle = '#fff6c0';
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) {
        const u = fr(a.now * 3 + k / 3);
        ctx.globalAlpha = a.alpha * a.vvBell * (1 - u);
        ctx.beginPath();
        ctx.arc(0, 10, 8 + u * 12, -0.6 + Math.PI, 0.6 + Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 10, 8 + u * 12, -0.6, 0.6);
        ctx.stroke();
      }
    });
    if (a.vvBell > 0.2) for (let k = 0; k < 2; k++) {
      const u = fr(a.now * 1.2 + k / 2);
      note(ctx, a, 16 + k * 8 + Math.sin(u * 6) * 3, -100 - u * 20, Math.sin(u * Math.PI) * a.vvBell, k ? '#ffe36b' : '#ffffff', 9);
    }
    if (a.vvPlates) vvPlates(ctx, m, a);
    // Her polishing makes the pot shine.
    if (a.vvPolish > 0.4) inPart(ctx, mat, 'pot', () => sparkle(ctx, a, 12, -6, 3 + Math.sin(a.now * 9) * 1.2, a.vvPolish));
  },
}), (m, a) => m.hp > 0 && m.slamming > a.now && m.slamming - a.now < 1.3 && fr(a.now * 3) > 0.5);
export function velvetStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const fy = -10;
  const wy = fy - 34;
  const [nx, ny] = [1, wy - 23];
  const hand = [9 + Math.cos(90 * D2R) * 14.6, wy - 18 + Math.sin(90 * D2R) * 14.6];
  return {
    w: 110,
    h: 124,
    res: 2,
    shapes: shift([
      ...put(vvTail(0)(), [6, 7], -1.6, fy, 112), ...put(vvEar(true)(), [7, 13], nx - 13, ny - 37, -16), ...put(vvArm(true)(), [4, 7], -8, wy - 19, 100),
      ...put(vvDress(), [31, 1], 0, wy), ...put(vvKeys(), [8, 2], 13, wy + 2), ...put(vvTorso(), [22, 27], 0, wy),
      ...put(vvHead(), [27, 44], nx, ny), ...put(vvCap(), [23, 15], nx, ny - 34), ...put(vvEar(false)(), [7, 13], nx + 11, ny - 38, 12),
      ...put(vvOwnFace(fm), [27, 44], nx, ny), ...put(vvSpecs(), [27, 44], nx, ny),
      ...put(vvPot(), [4, 9], hand[0], hand[1], 0), ...put(vvArm(false)(), [4, 7], 9, wy - 18, 90),
    ], 55, 122),
  };
}
