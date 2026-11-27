// Sol and Luna, the Eclipse Twins (remade 2026-11-27): their rig is a copy of Folio's copy of the blank bases'
// hooked rig (render/folio/rig.js; render/mobs/blankrigs.js at the root), kept here so the bases and the
// other copies stay untouched; nothing that moves is changed. Folio's notes follow.
// Folio, the Archivist (remade 2026-11-27): her rig is a copy of Queen Coralie's copy of the blank bases'
// hooked rig (render/coralie/rig.js; render/mobs/blankrigs.js at the root), kept here so the bases and the
// other copies stay untouched; nothing that moves is changed. Coralie's notes follow.
// Queen Coralie, the Drowned Queen (remade 2026-11-26): her rig is a copy of Lady Abyssia's copy of the blank
// bases' hooked rig (render/abyssia/rig.js; render/mobs/blankrigs.js at the root, by way of Tuskar's and
// Lady Marigold's copies), kept here so the bases and the other copies stay untouched; nothing that moves
// is changed. The hooks and the bases' notes follow.
// Tuskar's rig (2026-11-26, the Boar Den boss remade as the woolly mammoth calf): a copy of the blank
// bases' rig (render/mobs/blankrigs.js), kept here so the bases themselves stay clean (the player:
// "never edit the bases just copy the base and edit that"). Unchanged in everything that moves (its
// skeleton, gait, sway, moves and springs; its walk reports its gait, a.gait, for the walk-pace
// check). What this copy adds: any of the human-style kinds (his own `mammoth` build, body.js), and a
// live dress, `opts`:
//   opts.id        its own name (its pictures' keys)
//   opts.skin      its skin tones { lt, base, sh, deep, ink, out, guides }
//   opts.under / opts.over  { part: (ctx, a, mode, S, D) } drawn live just under / over a part of
//                  the base's (torso, chest, armF, handFskin, legF, footFskin, legN, footNskin,
//                  torsoSkin, neckSkin, head, armN, handN, handNskin, tail ...), in both passes
//                  (mode 'line': its outline, 'fill': itself), so only its outer edge is outlined;
//                  D the kit: D.frame(ctx, a, bone) enters a bone's frame (its pivot joint at 0, 0,
//                  game px), D.loc(joint, bone) a joint in it, D.H, D.SC, D.K, D.J
//   opts.noMoves   the base's own attack moves left out (its fight is drawn by its own pose)
//   opts.hide      names of the base's own parts left undrawn (its own pieces draw them)
//   opts.liveHead  the mannequin's head left undrawn (its own head drawn over 'head')
//   opts.pose      (m, a, out, c) its own idle act and moves, over the base's channels
//   opts.fx / opts.under2  (ctx, m, a, S, matOf, D) extras over everything / under everything
//
//   dressRig(kind, opts) -> { rig, still, stride, speed, w, h, H, D }
//
// The blank rigs' own notes follow.
// (base) The blank bases, rigged and game-ready (2026-11-22, the player: "rig them to perfection", then
// "heavily animate all of them to be game ready so they can be easily used ... attacks for common
// weapons, common attacks and punches and other martial arts, guns etc"): each blank base
// (blankbase.js, blankbases.js) as a live rig on the kid rig (kidrig.js), at its true size, with the
// whole move set (blankmoves.js), plain weapons (blankprops.js) and legs that walk and run
// (blankgait.js). They're not monsters in the game: dev pages and new builds use them (BLANK_ARTS).
// The player base is a reference for the player character's build only, never a monster's body.
//
// Using one in the game (a monster def on a base):
//   weapon  def.weapon (or m.weapon): sword, dagger, spear, axe, hammer, staff, bow, pistol, rifle,
//           ball; held at rest, carried on the walk and the run, and its moves used to attack
//   moves   def.moves: its own list of attacks (default: the weapon's, or fists and feet, or
//           def.caster's magic); each attack takes the next in turn, so a fight never repeats one
//           swing; m.move forces one
//   the rest is the game's own: the wind-up (m.windup, def.fight.windup) is the move's wind-up,
//   m.attackAt its release; a hit (m.flash) plays a flinch on top of the rig's kick; beaten
//   (hp <= 0) it slumps as it falls; gloating (m.gloatAt) it cheers; m.guard holds a block; m.act
//   = { name, at } plays any move or action on the clock (cutscenes, sheets): jump, dash, dodge,
//   block, hurt, knockdown, cheer as well as every attack.
//
// How each moves at rest:
//   idle    breathing; a slow shift of weight from foot to foot; the arms easing with the breath;
//           every 9 s a glance back over the shoulder and back again.
//   walk    the kid walk (the hero's approved walk on its legs): heel down, roll, toe off, the hips
//           sinking just as far as the planted feet need; the arms swinging opposite the legs.
//   run     past a brisk walk: a longer stride with both feet off the ground between steps, a lean,
//           elbows bent and pumping.
//   poses   (m.pose, for sheets) tpose, wave, crouch; fly (winged): up off the ground, flapping.
//   creature  its tail and round ears swing on their own.
//   spirit  no legs: it hovers, bobbing; it glides leaning forward with its arms out in front,
//           hands drooping, its wisp trailing; a wisp lash for a kick.
//   serpent no legs: it slithers, waves running back down its tail, its upper body swaying like a
//           dancer's; a tail whip for a kick.
//   winged  its wings breathe at rest, lift with the walk, spread on a wind-up and sweep on a blow,
//           swinging on their own; a wing buffet.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { kidKit, SOFT, hold, D2R } from '../mobs/kidrig.js';
import { CX, G, mapShape } from '../mobs/kidbase.js';
import { blit, sprite } from '../pixel.js';
import { blankBase, blankSkinSpec } from '../mobs/blankbase.js';
import { blankBody, BODIES, skinSpec } from './body.js';
import { makeSkin } from './skin.js';
import { blankGait } from '../mobs/blankgait.js';
import { weaponOf, weaponSprite, inSprite } from '../mobs/blankprops.js';
import { MOVES, HOLDS, POOLS, LEGLESS, poseAt, lengthOf, inWindow, since } from '../mobs/blankmoves.js';
import { legDefs, legPhase, stepAt, lowAngle, sinks, placeLeg } from '../mobs/blankquad.js';


// A base drawn standing (arms hanging), fitted into the kid box (160 x 150, feet on G) at `1 / f` of
// its size; the kit draws it back at `f`, so it keeps its true size, every part re-rendered, never
// stretched. Also where its near hand holds things, how big the hand is, and the tips a trail is
// drawn from (the toes, the serpent's tail, the spirit's wisp).
function fitted(kind) {
  if (kind === 'kid') {
    const b = blankBase({ tpose: false, guides: true });
    const J = { ...b.J };
    J.handN = [J.wrN[0], J.wrN[1] + 4];
    J.handF = [J.wrF[0], J.wrF[1] + 4];
    J.toeN = [J.ankN[0] + 3, J.ankN[1] + 2];
    const spec = blankSkinSpec();
    J.ribs = spec.ribs;
    J.navel = spec.navel;
    J.stern = spec.stern;
    return { groups: b.groups, J, f: 1, r: 4.2, spec };
  }
  const b = blankBody(kind, { tpose: false, guides: true });
  const B = BODIES[kind];
  const f = Math.max(b.box[0] / 160, b.box[1] / 148);
  const m = ([x, y]) => [CX + (x - B.cx) / f, G - (b.g - y) / f];
  const groups = {};
  for (const [n, list] of Object.entries(b.groups)) groups[n] = list.map((sh) => mapShape(sh, m, 1 / f));
  // (The ears ride on the head.)
  groups.head = [...(groups.ears ?? []), ...(groups.head ?? [])];
  delete groups.ears;
  const J = Object.fromEntries(Object.entries(b.J).map(([k, v]) => [k, m(v)]));
  if (B.tail) J.tail = m([B.cx - 10, 110]);
  const hr = B.arm[4];
  J.handN = m([b.J.wrN[0], b.J.wrN[1] + hr * 0.9]);
  J.handF = m([b.J.wrF[0], b.J.wrF[1] + hr * 0.9]);
  J.toeN = m([b.J.ankN[0] + B.foot * 0.5, b.J.ankN[1] + B.foot * 0.2]);
  if (B.lower === 'serpent') J.tailTip = m([B.cx - 113, b.g - 23.6]);
  if (B.lower === 'ghost') J.wispTip = m([B.cx - 26, B.hips[0] + 44]);
  // Its skin's shape, in the kid box too.
  const sp = skinSpec(kind);
  const my = (y) => G - (b.g - y) / f;
  const w = (v) => v / f;
  const spec = {
    right: sp.right.map(m),
    left: sp.left.map(m),
    cx: m([sp.cx, 0])[0],
    shoulder: { y: my(sp.shoulder.y), w: w(sp.shoulder.w), neckW: w(sp.shoulder.neckW) },
    lines: Object.fromEntries(Object.entries(sp.lines).map(([k, v]) => [k, my(v)])),
    neck: { base: m(sp.neck.base), top: m(sp.neck.top), chin: my(sp.neck.chin), w: w(sp.neck.w) },
    arm: Object.fromEntries(Object.entries(sp.arm).map(([k, v]) => [k, w(v)])),
    leg: { tw: w(sp.leg.tw), kw: w(sp.leg.kw), anw: w(sp.leg.anw), top: my(sp.leg.top), heel: w(sp.leg.heel), toe: w(sp.leg.toe), ftop: w(sp.leg.ftop), fbot: w(sp.leg.fbot) },
    collar: sp.collar.map((c) => c.map(m)),
    belly: sp.belly ? { x: m([sp.belly.x, sp.belly.y])[0], y: m([sp.belly.x, sp.belly.y])[1], rx: w(sp.belly.rx), ry: w(sp.belly.ry) } : null,
    fine: w(sp.fine),
    legs: sp.legs,
    horse: sp.horse
      ? {
          name: sp.horse.name,
          barrel: sp.horse.barrel.map(([x, y, kf, kh]) => [...m([B.cx + x, y]), kf, kh]),
          fore: { top: m([B.cx + sp.horse.fore.top[0], sp.horse.fore.top[1]]), bones: sp.horse.fore.bones.map(([x, y]) => [w(x), w(y)]), w: sp.horse.fore.w.map(w) },
          hind: { top: m([B.cx + sp.horse.hind.top[0], sp.horse.hind.top[1]]), bones: sp.horse.hind.bones.map(([x, y]) => [w(x), w(y)]), w: sp.horse.hind.w.map(w) },
          far: sp.horse.far.map(w),
          hoof: { w: w(sp.horse.hoof.w), h: w(sp.horse.hoof.h), up: w(sp.horse.hoof.up), cloven: sp.horse.hoof.cloven },
          tail: { kind: sp.horse.tail.kind, root: m([B.cx + sp.horse.tail.root[0], sp.horse.tail.root[1]]), len: w(sp.horse.tail.len), w: sp.horse.tail.w.map(w) },
        }
      : null,
  };
  J.ribs = m(sp.ribs);
  J.navel = m(sp.navel);
  J.stern = m(sp.stern);
  return { groups, J, f, r: hr / f, spec, m };
}

const CHANNELS = ['x', 'lift', 'hop', 'drop', 'pitch', 'paw', 'tilt', 'pelvis', 'waist', 'chest', 'neckR', 'shrugN', 'shrugF', 'reachN', 'reachF', 'hwN', 'hwF', 'turnC', 'turnP', 'head', 'shF', 'elF', 'shN', 'elN', 'wa', 'fxN', 'fyN', 'fxF', 'fyF', 'toeN', 'toeF', 'wing', 'wisp', 'tailW'];
// (Guns lie along the forearm; everything else sticks out of the fist across it.)
const ALONG = new Set(['pistol', 'rifle']);
const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
// (a point turned about the origin, radians)
const rotR = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const DEAD = { drop: 0.35, tilt: 18, waist: 12, head: 22, shN: 8, elN: -5, shF: -8, elF: 5, fxN: 0.1, fxF: -0.05, wing: -10, wisp: 10 };
const isBow = (w) => w === 'bow' || w === 'bowDrawn';
const BLANK_COLORS = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6' };
// A part drawn live by the skin (blankskin.js) rather than from a sprite: it sits at the rig's root
// and draws in the rig's space, its outline in the first pass and its fill in the second.
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
const live = (name, draw) => ({ name, live: draw });
// The two passes, as twoPass (kidrig.js) does for drawn parts: every part's outline first, then every
// part's fill, so only the figure's outer edge is outlined; live parts draw their outline, then
// their fill, in the same order.
function skinPasses(list) {
  const liveAs = (p, mode, suffix) => ({ name: `${p.name}${suffix}`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a, S) => p.live(ctx, a, mode, S) });
  const first = list.map((p) => (p.live ? liveAs(p, 'line', '') : p.s ? { ...p, paint: undefined, s: (a, S) => p.s(a, S, false) } : p));
  const second = list.filter((p) => p.s || p.live).map((p) => (p.live ? liveAs(p, 'fill', '~b') : { ...p, name: `${p.name}~b`, s: (a, S) => p.s(a, S, true) }));
  return [...first, ...second];
}
// The rig's bones (2026-11-23, the player: "the whole body shouldn't move when animating ... a
// complex rig system that has many parts"): the hips (the pelvis, the root: the legs hang from it),
// the waist (the belly, bending from the hips at the navel), the chest (the ribcage, bending from
// the waist at the ribs), a collarbone each side from the top of the breastbone (the shoulder
// rising, `shrug`, and coming forward, `reach`, with its arm), the neck (from the breastbone) and
// the head on it, the arms on the collarbones, the hands turning at the wrists (`hw`), the legs.
// A lean (`tilt`) is shared up the spine, least at the hips, most in the chest, so a lean bends the
// back and the hips stay over the feet; `pelvis`, `waist`, `chest` turn each on top; `turnC` and
// `turnP` turn the chest and the hips round toward or away (their lines slide round, blankskin.js).
const rootAng = (S) => (S.tilt ?? 0) * 0.25 + (S.pelvis ?? 0);
const waistRel = (S) => (S.tilt ?? 0) * 0.35 + (S.waist ?? 0) * 0.55;
const chestRel = (S) => (S.tilt ?? 0) * 0.4 + (S.waist ?? 0) * 0.45 + (S.chest ?? 0);
const chestAng = (S) => (S.tilt ?? 0) + (S.pelvis ?? 0) + (S.waist ?? 0) + (S.chest ?? 0);

export function dressRig(kind = 'kid', opts = {}) {
  const B = BODIES[kind] ?? {};
  const { groups, J, f, r: handR, spec, m: toKid0 } = fitted(kind);
  const toKid = toKid0 ?? ((p) => p);
  if (opts.liveHead) groups.head = [];
  if (opts.liveWings) {
    groups.wingF = [];
    groups.wingN = [];
  }
  const K = kidKit(`tk${opts.id ?? kind}`, () => ({ groups }), J, { scale: f, flat: true });
  const { rel, SC } = K;
  const skin = makeSkin({ J, SC, C: opts.skin ?? BLANK_COLORS, spec });
  // (the dress's kit: each bone's pivot joint, a bone's frame, a joint in it)
  const PIV = { torso: 'hip', waistB: 'navel', chest: 'ribs', claF: 'stern', claN: 'stern', neckB: 'stern', head: 'neck', wingF: 'wingF', wingN: 'wingN', armFu: 'shF', armFf: 'elF', handF: 'wrF', armNu: 'shN', armNf: 'elN', handN: 'wrN', thighF: 'hipF', shinF: 'kneeF', footF: 'ankF', thighN: 'hipN', shinN: 'kneeN', footN: 'ankN' };
  const D = {
    K, J, SC, skin, PIV, spec,
    // (a point in the base's own units, in a bone's frame, game px)
    base: (bone, p) => {
      const k = toKid(p);
      return [(k[0] - J[PIV[bone]][0]) * SC, (k[1] - J[PIV[bone]][1]) * SC];
    },
    loc: (j, bone) => [(J[j][0] - J[PIV[bone]][0]) * SC, (J[j][1] - J[PIV[bone]][1]) * SC],
    frame: (ctx, a, bone) => ctx.transform(...a.blMat(bone)),
    at: (a, bone, p) => {
      const M = a.blMat(bone);
      return [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
    },
  };
  // (her pieces round the base's own parts, live, in both passes)
  // (a hidden part stays as a joint for the dress to follow, drawn by nothing)
  const dressParts = (list) => list.map((p) => ((opts.hide ?? []).includes(p.name) ? { ...p, s: null, paint: undefined } : p)).flatMap((p) => [
    ...(opts.under?.[p.name] ? [live(`${p.name}<`, (ctx, a, mode, S) => opts.under[p.name](ctx, a, mode, S, D))] : []),
    p,
    ...(opts.over?.[p.name] ? [live(`${p.name}>`, (ctx, a, mode, S) => opts.over[p.name](ctx, a, mode, S, D))] : []),
  ]);
  const legs = B.legs !== false;
  const spirit = B.lower === 'ghost';
  const serpent = B.lower === 'serpent';
  const wings = Boolean(B.wings);
  // Its size: H its height (game px), `leg` its leg's length; every move's distances come from
  // these, so a tall queen lunges as far for her height as the kid does for its.
  const sz = f;
  const leg = (J.ankN[1] - J.hipN[1]) * SC;
  const Hk = G - J.crown[1];
  const H = Hk * SC;
  // (A four-legged lower half, blankquad.js: its legs at rest, a foreleg's length; it strides on them.)
  const horse = spec.horse;
  const QL = horse ? legDefs(horse, (v) => v * SC) : null;
  const hLF = QL ? QL.foreN.lens.reduce((x, y) => x + y, 0) : 0;
  const stride = (horse ? hLF : leg) * 1.15;
  const key = `tk${opts.id ?? kind}`;
  const walkSpeed = stride * 1.4;
  const WK = blankGait(K, { stride, kick: leg * 0.24, key, walkSpeed, lean: rootAng });
  const tail = Boolean(groups.tail);
  const dist = (p, q) => Math.hypot(J[q][0] - J[p][0], J[q][1] - J[p][1]) * SC;
  const sub = (p, q) => [(J[p][0] - J[q][0]) * SC, (J[p][1] - J[q][1]) * SC];

  // Its weapons, sized to it (the bow's draw a little less than its arm's reach).
  const reach = (Math.hypot(J.elN[0] - J.shN[0], J.elN[1] - J.shN[1]) + Math.hypot(J.wrN[0] - J.elN[0], J.wrN[1] - J.elN[1])) * 0.85;
  const W = {};
  const weapon = (w) => (W[w] ??= w === 'bowDrawn' ? weaponOf('bow', Hk, handR, reach, true) : weaponOf(w, Hk, handR, reach));
  const handAt = sub('handN', 'elN');

  // The serpent's tail: each piece's turn as the waves pass (and as it whips), so the joints rise to
  // the waves' heights (the first stays on the ground where the body comes down to it).
  const LA = serpent ? dist('serp0', 'serp1') : 1;
  const LB = serpent ? dist('serp1', 'serp2') : 1;
  const LC = LB * 0.55;
  const hgt = serpent ? (J.serp0[1] - J.hip[1]) * SC : 1;
  const segs = (S, a) => {
    const c = a.blSegs;
    if (c?.S === S) return c.v;
    const w = a.walkW ?? 0;
    const ph = a.blSl ?? 0;
    const amp = (0.25 + 1.1 * w) * sz;
    const h = [0, 1, 2, 3].map((j) => (j ? amp * (0.5 + 0.5 * Math.sin(ph - j * 1.7)) : 0));
    const ang = (d, L) => Math.asin(clamp(d / L, -0.7, 0.7));
    const tw = S.tailW ?? 0;
    const A = ang(h[1] - h[0], LA) + tw * 0.62;
    const Bt = ang(h[2] - h[1], LB) + tw * 1.45;
    const C = ang(h[3] - h[2], LC) + Math.sin(ph - 5.6) * (0.06 + 0.1 * w) + tw * 2.4;
    const v = [A, Bt - A, C - Bt];
    a.blSegs = { S, v };
    return v;
  };

  // Where the near hand is for a pose (the rig's space, feet at 0, 0, y down), and the weapon's
  // angle turned up from the ground if its tip or head would be under it.
  const rot2 = ([x, y], deg) => {
    const r = deg * D2R;
    return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  };
  const navelAt = rel('navel', 'hip');
  const ribsAt = rel('ribs', 'navel');
  const sternAt = rel('stern', 'ribs');
  const shoulderAt = rel('shN', 'stern');
  const elbowAt = rel('elN', 'shN');
  function aboveGround(P, wn, drawn) {
    const [hx, hy] = rel('hip');
    const T = [hx + P.x, hy - P.lift - P.hop];
    const C = chestAng(P);
    const nv = rot2(navelAt, rootAng(P));
    const rb = rot2(ribsAt, rootAng(P) + waistRel(P));
    const st = rot2([sternAt[0] + (P.reachN ?? 0), sternAt[1]], C);
    const sh = rot2(shoulderAt, C - (P.shrugN ?? 0));
    const el = rot2(elbowAt, C + P.shN);
    const hd = rot2(handAt, C + P.shN + P.elN);
    const hand = [T[0] + nv[0] + rb[0] + st[0] + sh[0] + el[0] + hd[0], T[1] + nv[1] + rb[1] + st[1] + sh[1] + el[1] + hd[1]];
    const w = weapon(drawn ? 'bowDrawn' : wn);
    const pts = [w.tip, [w.box[0], 0], [w.box[2], 0]].map(([x, y]) => [x * SC, y * SC]);
    const along = ALONG.has(wn);
    const lowest = (wa) => Math.max(...pts.map((p) => hand[1] + rot2(p, along ? wa : wa + 90)[1]));
    const floor = -0.6;
    let wa = P.wa;
    if (lowest(wa) <= floor) return wa;
    // (Turned toward level on the side it points to, a few degrees at a time.)
    const dir = Math.sin(wa * D2R) > 0 ? 1 : -1;
    for (let i = 0; i < 40 && lowest(wa) > floor; i++) wa += dir * 3 * (Math.cos(wa * D2R) > 0 ? 1 : -1);
    return wa;
  }

  // A four-legged lower half (blankbases.js HORSE, DEER; its legs blankquad.js): its body rides level
  // under the rider's lean (and pitches up to rear, about its hind legs) and rocks over its legs as
  // they step, about the rider's hips (so she stays on it), flexing along its back with the stride;
  // each leg, three bones, reaches its hoof's place from its top joint inside the body; walking, the
  // hooves step one at a time, trotting in diagonal pairs, galloping gathered, hinds then fores;
  // jumping the legs tuck up, rearing the forelegs paw the air; the body's outline follows the near
  // legs' upper bones (blankskin.js); the tail flows from the rump (a pony's) or flicks up (a deer's).
  let Dh = 0;
  if (horse) Dh = (J.hip[0] - horse.hind.top[0]) * SC;
  // The step this frame: each hoof's place, how low each end is held, walk, trot or gallop.
  const horseGait = (a) => {
    const u = a[`${key}U`] ?? 0;
    const R = a[`${key}R`] ?? 0;
    const trot = smoothstep(R / 0.5);
    const run = smoothstep((R - 0.5) / 0.5);
    const cyc = stride * (1 + 0.75 * R);
    const steps = {};
    for (const k of Object.keys(QL)) steps[k] = stepAt(u, legPhase(k, trot, run), run, cyc, hLF);
    return { u, trot, run, steps, ...sinks(QL, steps) };
  };
  function horseUnder(S, a, matOf) {
    const M = matOf('barrel');
    const w = a.walkW ?? 0;
    const t = a.t;
    const hop = S.hop ?? 0;
    const gt = horseGait(a);
    const bang = Math.atan2(M[1], M[0]);
    // (rocking: the back end held lower as the hind legs slant; the back flexing behind its middle)
    const D = (horse.fore.top[0] - horse.hind.top[0]) * SC;
    const rock = -Math.atan2((gt.hS - gt.fS) * w, D);
    const flex = Math.sin(4 * Math.PI * gt.u + 0.5) * (0.8 + 1.2 * gt.trot + 4 * gt.run) * w * D2R;
    const kOf = (p) => smoothstep(((J.hip[0] - p[0]) * SC - D * 0.35) / (D * 0.45));
    const angAt = (p) => bang + rock + flex * kOf(p);
    const loc = (p) => {
      const q = rotR([(p[0] - J.hip[0]) * SC, (p[1] - J.hip[1]) * SC], rock + flex * kOf(p));
      return [M[0] * q[0] + M[2] * q[1] + M[4], M[1] * q[0] + M[3] * q[1] + M[5]];
    };
    const tuck = clamp(hop / (H * 0.15), 0, 1);
    const paw = clamp(S.paw ?? 0, 0, 1);
    const ground = -horse.hoof.up * SC;
    // (brought low, knocked down or beaten, its legs fold under it as it lies: the forelegs' cannons
    // tucked back under the chest, the hind legs' along the ground under the belly)
    const low = smoothstep((M[5] - (J.hip[1] - G) * SC - hLF * 0.12) / (hLF * 0.4)) * (1 - tuck);
    const legs = {};
    for (const [k, L] of Object.entries(QL)) {
      const g = gt.steps[k];
      // (the shoulder blade slides along the ribs with the foreleg's swing; the hip is fixed)
      const T = loc(L.hind ? L.top : [L.top[0] + (g.dx / SC) * 0.1 * w, L.top[1]]);
      let foot = [(L.rest[3][0] - CX) * SC + g.dx * w + (S.x ?? 0) * 0.3 * (1 - w), ground - g.lift * w - hop];
      let a3 = L.a3 + (lowAngle(L, g) - L.a3) * w;
      const to = (q, ang, k2) => {
        foot = [foot[0] + (q[0] - foot[0]) * k2, foot[1] + (q[1] - foot[1]) * k2];
        a3 += (ang - a3) * k2;
      };
      // (leaping, the legs fold up under the belly: the forelegs' cannons folded back under the
      // forearms, the hind legs' hocks flexed tight, their cannons forward under the body)
      if (tuck > 0) to([T[0] + hLF * (L.hind ? 0.15 : 0.08), T[1] + hLF * (L.hind ? 0.42 : 0.3)], L.hind ? 1.5 : -2.2, tuck);
      if (low > 0) to([T[0] + hLF * (L.hind ? 0.42 : 0.3), ground], L.hind ? 1.5 : -2.2, low);
      if (!L.hind && paw > 0) {
        // (rearing, the forelegs paw the air in turn)
        const ph = t * 13 + (L.far ? 1.7 : 0);
        to([T[0] + hLF * (0.3 + 0.14 * Math.sin(ph)), T[1] + hLF * (0.44 - 0.12 * Math.abs(Math.cos(ph)))], -1.5 + 0.55 * Math.sin(ph), paw);
      }
      const bones = placeLeg(L, T, foot, a3);
      // (a planted hoof stands flat, rolling over its toe as it leaves; a lifted one tips with its leg)
      const flat = g.v < 0 && Math.max(tuck, low) < 0.5 && (L.hind || paw < 0.5) ? 0.22 : 0.62;
      legs[k] = { hind: L.hind, far: L.far, ...bones, rot: (a3 - L.a3) * flat, w: L.w };
    }
    // The body's outline: each point follows the body, and near the near legs those legs' upper
    // bones (the chest's bottom by the elbow turning with the upper arm, the haunch with the thigh).
    const dF = legs.foreN.up - (QL.foreN.up + angAt(QL.foreN.top));
    const dH = legs.hindN.up - (QL.hindN.up + angAt(QL.hindN.top));
    const turnAbout = (q, c, ang) => {
      const [x, y] = rotR([q[0] - c[0], q[1] - c[1]], ang);
      return [c[0] + x, c[1] + y];
    };
    const mix = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
    const bodyPt = (p) => {
      let q = loc(p);
      if (p[2]) q = mix(q, turnAbout(q, legs.foreN.T, dF), p[2]);
      if (p[3]) q = mix(q, turnAbout(q, legs.hindN.T, dH), p[3]);
      return q;
    };
    const root = loc(horse.tail.root);
    const ra = angAt(horse.tail.root);
    const tail = [root];
    if (horse.tail.kind === 'flag') {
      // A deer's: short, out back from the rump and a little down, flicking up now and then (a few
      // quick flips), raised like a flag as it runs or leaps.
      const fl = hold(t % 4.7, 1, 1.08, 1.5, 1.7);
      const raise = Math.min(1, fl * (0.55 + 0.45 * Math.abs(Math.sin(t * 19))) + gt.run * 0.9 + w * 0.15 + tuck * 0.8);
      const seg = (horse.tail.len * SC) / 3;
      for (let i = 1; i <= 3; i++) {
        const th = ra + Math.PI - 0.55 + raise * 1.15 - (i - 1) * (0.32 - raise * 0.2);
        const [px, py] = tail[i - 1];
        tail.push([px + Math.cos(th) * seg, py + Math.sin(th) * seg]);
      }
    } else {
      // A pony's: out back from the croup first, then falling away down, an arc, never a stick;
      // moving, it streams out behind; a sway runs down it, the tip a beat behind the root.
      const seg = (horse.tail.len * SC) / 6;
      for (let i = 1; i <= 6; i++) {
        const k = i / 6;
        const th = ra + 2.75 - 1.05 * k ** 0.8 + (w * 0.35 + gt.run * 0.45) * k + Math.sin(t * 1.8 - i * 0.6) * (0.05 + 0.1 * w) * (k + 0.3) - tuck * 0.35 * k;
        const [px, py] = tail[i - 1];
        tail.push([px + Math.cos(th) * seg, py + Math.sin(th) * seg]);
      }
    }
    a.blHorse = { legs, tail, bodyPt };
  }

  // The move playing now: [move, time from its release (< 0: winding up), how far into the wind-up].
  function moveNow(m, a, st, weaponHeld) {
    if (m.act && MOVES[m.act.name]) {
      const mv = MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    // An attack: the next move off its list, picked as it starts winding up (or as it strikes).
    const on = a.ph.antic > 0 || a.ph.since >= 0;
    if (on) {
      if (!st.blAtk) {
        const pool = m.def.moves ?? POOLS[weaponHeld ?? (m.def.caster ? 'magic' : 'fist')] ?? POOLS.fist;
        st.blN = (st.blN ?? m.uid) + 1;
        st.blPick = m.move ?? pool[st.blN % pool.length];
      }
      st.blAtk = true;
      const mv = MOVES[m.move ?? st.blPick];
      if (mv) {
        if (a.ph.since >= 0) return [mv, a.ph.since, 1];
        return [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
      }
    } else st.blAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(MOVES.hurt)) return [MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(MOVES.cheer)) return [MOVES.cheer, gl, 1];
    return [null, 0, 0];
  }

  const rig = makeRig({
    w: K.BW,
    h: K.BH,
    soft: true,
    stride,
    recover: 1.4,
    springs: {
      x: [170, 15], lift: [170, 13], hop: [140, 13], tilt: [130, 11], pelvis: [150, 13], waist: [150, 13], chest: [150, 13], neckR: [120, 11], head: [110, 10], pitch: [150, 13], paw: [200, 16],
      shrugN: [170, 14], shrugF: [170, 14], reachN: [170, 14], reachF: [170, 14], hwN: [220, 17], hwF: [220, 17], turnC: [140, 12], turnP: [140, 12],
      shF: [150, 12], elF: [160, 12], shN: [150, 12], elN: [160, 12], wa: [170, 14],
      fxN: [260, 22], fyN: [260, 22], fxF: [260, 22], fyF: [260, 22], toeN: [400, 30], toeF: [400, 30],
      wing: [260, 16], wisp: [90, 8], tailW: [140, 12],
    },
    walkStiff: { x: [500, 44], lift: [1400, 75], tilt: [400, 38], pelvis: [380, 34], waist: [380, 34], chest: [380, 34], head: [260, 28], neckR: [260, 28], shrugN: [300, 30], shrugF: [300, 30], reachN: [300, 30], reachF: [300, 30], turnC: [320, 32], turnP: [320, 32], shN: [320, 32], shF: [320, 32], elN: [200, 22], elF: [200, 22], wa: [320, 32] },
    fast: CHANNELS,
    fastNow: (m, a) => Boolean(a.mo.rig?.blActive),
    kick: { tilt: -40, head: 60 },
    turnKick: { tilt: 24, head: -30 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      const U0 = a[`${key}U`] ?? st[`${key}U`] ?? 0;
      WK.step(m, a);
      const U = a[`${key}U`] ?? 0;
      const run = a[`${key}R`] ?? 0;
      // (The slither's phase: run on by the distance slithered, and slowly at rest; kept, never
      // worked out from the clock, so it never jumps as the walk eases in and out.)
      st.blSl = ((st.blSl ?? 0) + (((U - U0 + 1) % 1) * TAU) + Math.max(0, a.dt) * 1.2 * (1 - (a.walkW ?? 0))) % (TAU * 64);
      a.blSl = st.blSl;
      const held = m.weapon ?? m.def.weapon ?? null;
      const [mv0, mt, anticW] = opts.noMoves ? [null, 0, 0] : moveNow(m, a, st, held);
      // (A body without legs fights with its tail or wisp instead of a kick.)
      const mv = mv0?.legs && !legs ? MOVES[LEGLESS[B.lower]] : mv0;
      const weaponNow = held ?? mv?.weapon ?? null;
      a.blWeaponHeld = Boolean(weaponNow);

      // The rest pose: idle, walk, run, holding its weapon.
      const breath = Math.sin(t * 1.5);
      const shift = Math.sin(t * 0.45);
      const glance = hold(t % 9, 4, 4.7, 6, 6.8) * (a.calm ?? 1);
      const hover = spirit ? (0.7 + 0.6 * Math.sin(t * 2.1)) * sz : 0;
      const idle = {
        // (Standing still: the feet and the hips stay put. The weight shifting from foot to foot
        // drops one hip, the waist and chest righting the body over it, the chest turning a touch
        // against the hips; each breath lifts the chest and the shoulders, never the whole body; a
        // glance turns the neck, then the head.)
        x: shift * 0.12 * sz, lift: hover, hop: 0, drop: 0, tilt: 0, pelvis: shift * 2.6, waist: -shift * 1.8, chest: -shift * 0.7 - breath * 0.7, neckR: -breath * 0.4 - glance * 2.6, head: breath * 0.3 - glance * 4.6,
        shF: 4 + breath * 1.2, elF: 6 + breath, shN: -4 - breath * 1.2, elN: -6 - breath, wa: -100,
        fxN: shift * 0.25 * sz, fyN: 0, fxF: -shift * 0.12 * sz, fyF: 0, toeN: 0, toeF: 0,
        shrugN: 1 + breath * 1.5, shrugF: 1 + breath * 1.5, reachN: 0, reachF: 0, hwN: 4 + breath, hwF: -4 - breath, turnC: shift * 0.08, turnP: -shift * 0.06,
        wing: 3 + Math.sin(t * 1.6) * 3, wisp: Math.sin(t * 2.2) * 5, tailW: 0,
      };
      const p = U * TAU;
      const roll = Math.sin(p - 0.5);
      const fold = (v) => (1 - Math.cos(v)) / 2;
      const swing = Math.cos(p - 0.15);
      const walk = {
        // (Walking: the hips rock with each step and turn with the forward leg, the chest turns
        // against them with the swinging arms, each shoulder coming forward with its arm; the head
        // rides steady on the neck.)
        x: (0.2 + roll * 0.25) * sz, lift: -WK.sink(a) - 0.6 * sz + WK.bob(a) * 1.3 * sz, hop: 0, drop: 0, tilt: 1 + roll * 0.8, pelvis: Math.sin(p - 0.3) * 3, waist: 1 - Math.sin(p - 0.3) * 2.4, chest: -Math.sin(p - 0.3) * 1.2, neckR: -1 + WK.headBob(a) * 2, head: -1 - roll * 0.5 + WK.headBob(a) * 3,
        shF: 4 - swing * 18, elF: 8 - fold(p - 0.4) * 16, shN: -4 + swing * 18, elN: -8 - fold(p - 0.4 + Math.PI) * 16, wa: -100,
        fxN: 0, fyN: 0, fxF: 0, fyF: 0, toeN: 0, toeF: 0,
        shrugN: 1.5 + swing * 1.2, shrugF: 1.5 - swing * 1.2, reachN: -swing * H * 0.014, reachF: swing * H * 0.014, hwN: 6, hwF: -6, turnC: -swing * 0.22, turnP: swing * 0.17,
        wing: 6 + Math.sin(p * 2 - 0.6) * 4, wisp: 0, tailW: 0,
      };
      // The run: leaning in, elbows bent and pumping, the head steady.
      if (run > 0 && legs) {
        const rn = {
          x: 0.6 * sz, lift: -WK.sink(a) - 0.4 * sz + WK.bob(a) * H * 0.045, tilt: 9 + roll * 1.4, pelvis: Math.sin(p - 0.3) * 3.6, waist: 5 - Math.sin(p - 0.3) * 3, chest: 2 - Math.sin(p - 0.3) * 1.6, neckR: -3, head: -3 + WK.headBob(a) * 3,
          shrugN: 3 + swing * 2.5, shrugF: 3 - swing * 2.5, reachN: -swing * H * 0.026, reachF: swing * H * 0.026, turnC: -swing * 0.36, turnP: swing * 0.26, hwN: 10, hwF: -10,
          shF: 6 - swing * 38, elF: -78 + swing * 10, shN: -6 + swing * 38, elN: -78 - swing * 10, wing: 12 + Math.sin(p * 2) * 5,
        };
        for (const [k2, v] of Object.entries(rn)) walk[k2] += (v - walk[k2]) * run;
      }
      if (spirit) {
        // The glide: leaning forward, arms out in front with the hands drooping, the wisp trailing.
        const sw = Math.sin(t * 2.1);
        Object.assign(walk, { x: 0.6 * sz, lift: hover + 0.6 * sz, tilt: 8 + sw * 0.8 + run * 6, pelvis: -4 + sw, waist: 4 - sw, chest: 2 + sw, shrugN: 6, shrugF: 6, reachN: H * 0.02, reachF: H * 0.01, head: -5 + sw, shF: -58 + sw * 3, elF: 38, shN: -68 + sw * 3, elN: 42, wisp: 14 + run * 10 + Math.sin(t * 4) * 5 });
      } else if (serpent) {
        // The slither: the upper body swaying forward and back with the waves, a dancer's arms.
        const ph = a.blSl;
        Object.assign(walk, { x: Math.sin(ph) * 0.9 * sz, lift: Math.cos(ph * 2) * 0.3 * sz, tilt: 3 + run * 5 + Math.sin(ph) * 2.4, pelvis: Math.sin(ph) * 2.4, waist: -Math.sin(ph - 0.6) * 4, chest: -Math.sin(ph - 1.2) * 2, turnC: Math.sin(ph - 0.8) * 0.3, turnP: -Math.sin(ph) * 0.2, shrugN: 2 + Math.sin(ph) * 2, shrugF: 2 - Math.sin(ph) * 2, head: -Math.sin(ph) * 2.4, shF: 10 + Math.sin(ph) * 8, elF: 16 - Math.sin(ph) * 6, shN: -12 + Math.sin(ph) * 8, elN: -18 + Math.sin(ph) * 6 });
        Object.assign(idle, { x: Math.sin(ph) * 0.3 * sz, tilt: Math.sin(ph) * 1, pelvis: Math.sin(ph) * 1.6, waist: -Math.sin(ph - 0.6) * 2.6, chest: -Math.sin(ph - 1.2) * 1.2, turnC: Math.sin(ph - 0.8) * 0.18, turnP: -Math.sin(ph) * 0.12 });
      }
      if (horse) {
        // (The rider rides its steps: lower as the forelegs slant under her, floating in a gallop's
        // flight, no stepping of her own.)
        const gt = horseGait(a);
        Object.assign(walk, { x: 0.2 * sz, lift: -gt.fS + (gt.down ? 0 : hLF * 0.07 * gt.run), tilt: 1 + roll * 0.5 + run * 4 });
        idle.x = shift * 0.05 * sz;
      }
      // Holding a weapon: the near arm keeps it ready (swinging a little on the walk), and the far
      // hand stays on a two-handed one.
      const hp0 = weaponNow ? HOLDS[weaponNow] : null;
      if (hp0) {
        for (const [k2, v] of Object.entries(hp0)) {
          idle[k2] = v + (k2 === 'shN' || k2 === 'shF' ? breath * 1.2 : 0) + (k2 === 'wa' ? Math.sin(t * 1.3) * 3 : 0);
          walk[k2] = v + (k2 === 'shN' ? swing * 5 : k2 === 'shF' ? -swing * 5 : 0) + (k2 === 'wa' ? Math.sin(p) * 4 : 0);
        }
      }
      // In move units: body offsets in body heights, feet and sitting in leg lengths.
      const base = {};
      for (const k2 of CHANNELS) base[k2] = (idle[k2] ?? 0) * (1 - a.walkW) + (walk[k2] ?? 0) * a.walkW;
      for (const k2 of ['x', 'lift', 'hop']) base[k2] /= H;
      for (const k2 of ['drop', 'fxN', 'fyN', 'fxF', 'fyF']) base[k2] /= leg;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      // A block held (m.guard), eased in and out.
      st.blGuard = (st.blGuard ?? 0) + ((m.guard && !mv ? 1 : 0) - (st.blGuard ?? 0)) * Math.min(1, a.dt * 12);
      if (st.blGuard > 0.001) {
        const g = poseAt(MOVES.block, 0.4, 1, out);
        for (const k2 of CHANNELS) out[k2] += (g[k2] - out[k2]) * st.blGuard;
      }
      // Beaten: it slumps as it falls.
      if (m.hp <= 0) {
        st.blDeadAt ??= a.now;
        const w = Math.min(1, (a.now - st.blDeadAt) / 0.3);
        for (const [k2, v] of Object.entries(DEAD)) out[k2] += (v - out[k2]) * w;
      } else st.blDeadAt = undefined;
      // Set poses, for sheets and checks.
      const lay = (pose) => {
        for (const [k2, v] of Object.entries(pose)) out[k2] = v;
      };
      const hv = hover / H;
      if (m.pose === 'tpose') lay({ x: 0, lift: hv, hop: 0, drop: 0, tilt: 0, pelvis: 0, waist: 0, head: 0, shF: 90, elF: 0, shN: -90, elN: 0, fxN: 0, fxF: 0, fyN: 0, fyF: 0, toeN: 0, toeF: 0, wing: 0, wisp: 0 });
      else if (m.pose === 'wave') lay({ x: 0, lift: (breath * 0.2 * sz + hover) / H, hop: 0, tilt: -3, pelvis: 2, waist: -3, head: -4, shF: 6, elF: 8, shN: -84, elN: -72 + Math.sin(t * 8) * 14, fxN: 0, fxF: 0, wing: 4 + Math.sin(t * 2) * 3 });
      else if (m.pose === 'crouch') {
        if (spirit) lay({ x: (-0.4 * sz) / H, lift: (hover - 1.6 * sz) / H, hop: 0, tilt: 9, head: -7, shF: 20, elF: 40, shN: -26, elN: -56, wisp: 26 });
        else lay({ x: (-0.6 * sz) / H, lift: (-leg * 0.16) / H, hop: 0, tilt: 7, head: -6, shF: 16, elF: 30, shN: -30, elN: -50, fxN: (1.4 * sz) / leg, fxF: (-0.7 * sz) / leg, wing: 12 });
      } else if (m.pose === 'fly') {
        // Up off the ground, flapping: the body rises on each downstroke, the feet hang, toes down.
        const fl = Math.sin(t * 7);
        lay({ x: 0, lift: 0, hop: ((5 + Math.sin(t * 7 - 1.2) * 0.8) * sz) / H, tilt: 4, pelvis: -4, waist: Math.sin(t * 7 - 0.6) * 3, head: -3, shF: 22, elF: 20, shN: -22, elN: -20, fxN: (0.6 * sz) / leg, fxF: (-0.3 * sz) / leg, fyN: (0.8 * sz) / leg, toeN: 26, toeF: 22, wing: 4 + fl * 28 });
      }
      // (her own idle act, flying and moves)
      opts.pose?.(m, a, out, { t, H, leg, sz, mv, mt, breath, st });
      // Back to game pixels. (A serpent can't leave the ground: a jump rears it up instead; a fall coils
      // it lower. A spirit sinks only so far.)
      const res = {};
      for (const k2 of CHANNELS) res[k2] = out[k2] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      res.lift = out.lift * H - out.drop * leg * (serpent ? 0.3 : spirit ? 0.5 : horse ? 0.55 : 1);
      // (Rearing pitches the barrel up about its hind legs: the front rises with it.)
      if (horse) res.lift += Dh * Math.sin(clamp(out.pitch ?? 0, -40, 60) * D2R);
      if (serpent) {
        // (Its body can't leave its tail: it rears back instead, the tail lifting with it.)
        res.lift = Math.min(res.lift, H * 0.03) + Math.min(res.hop * 0.15, H * 0.02);
        res.tilt -= (res.hop / H) * 22;
        res.tailW += (res.hop / H) * 1.3;
        res.hop = 0;
      }
      for (const k2 of ['fxN', 'fyN', 'fxF', 'fyF']) res[k2] = out[k2] * leg;
      delete res.drop;
      res.elN = clamp(res.elN, -150, 150);
      res.elF = clamp(res.elF, -150, 150);
      // The shoulders and the chest follow the arms, in every pose and move: an arm raised past the
      // shoulder lifts its collarbone; an arm reaching ahead brings its shoulder forward and turns
      // the chest into it (an arm drawn back, back and away), the hips turning a little against
      // the chest; so a punch is thrown from the shoulder and the body, not the whole figure.
      {
        const raise = (v) => {
          const u = clamp((Math.abs(v) - 55) / 125, 0, 1);
          return u * u * (3 - 2 * u);
        };
        res.shrugN += 16 * raise(res.shN);
        res.shrugF += 16 * raise(res.shF);
        const ext = (el) => 1 - Math.min(1, Math.abs(el) / 130);
        const fwdN = Math.max(0, -Math.sin(res.shN * D2R)) * (0.4 + 0.6 * ext(res.elN));
        const backN = Math.max(0, Math.sin(res.shN * D2R));
        const fwdF = Math.max(0, -Math.sin(res.shF * D2R)) * (0.4 + 0.6 * ext(res.elF));
        const set = m.pose === 'tpose' || m.pose === 'wave';
        if (!set) {
          res.reachN += H * (0.034 * fwdN - 0.022 * backN);
          res.reachF += H * 0.026 * fwdF;
        }
        // (Not in a set pose: a T-pose's arm out to the side isn't reaching anywhere.)
        const turn = set ? 0 : 0.42 * fwdN - 0.34 * backN - 0.2 * fwdF;
        res.turnC = clamp(res.turnC + turn, -0.85, 0.85);
        res.turnP = clamp(res.turnP - turn * 0.35, -0.6, 0.6);
        // (A hand holding a weapon keeps it square in the fist.)
        if (a.blWeaponHeld) res.hwN = 0;
      }
      // Follow-through, from how fast each part was moving last frame: a hand trails its arm's swing
      // at the wrist and snaps through after it; the neck and head trail the chest's turn a beat;
      // the chest trails the hips when they lunge or pull back; so a move flows out through the body
      // and settles, never all of it at once.
      {
        const vel = (n) => st[n]?.v ?? 0;
        if (!a.blWeaponHeld) res.hwN += clamp(-(vel('shN') + vel('elN')) * 0.02, -20, 20);
        res.hwF += clamp(-(vel('shF') + vel('elF')) * 0.02, -20, 20);
        const chestV = vel('tilt') * 0.4 + vel('pelvis') + vel('waist') * 0.45 + vel('chest');
        res.neckR += clamp(-chestV * 0.012, -6, 6);
        res.head += clamp(-chestV * 0.02, -9, 9);
        res.waist += clamp((-vel('x') / H) * 5, -5, 5);
      }
      // (A weapon never digs into the ground: where its tip would go under, it turns up just enough.)
      if (weaponNow && !(mv && mv.ground === false)) res.wa = aboveGround(res, weaponNow, isBow(weaponNow) && mv && inWindow(mv.drawn, mt));
      // (The weapon's angle kept within a turn of the last, so it never spins the long way round.)
      res.wa = st.blWa == null ? res.wa : res.wa + 360 * Math.round((st.blWa - res.wa) / 360);
      st.blWa = res.wa;
      // For the parts and effects: the move, its time, the weapon in hand.
      st.blActive = Boolean(mv);
      const shown = isBow(weaponNow) && mv && inWindow(mv.drawn, mt) ? 'bowDrawn' : weaponNow;
      a.blWeapon = weaponNow === 'ball' && mv?.ball && !inWindow(mv.ball, mt) ? null : shown;
      a.blMove = mv ? { mv, t: mt } : null;
      return res;
    },
    // (Each frame the bones are placed first, so the skin can follow them.)
    under: (ctx, m, a, S, matOf) => {
      a.blMat = matOf;
      D.H = H;
      opts.under2?.(ctx, m, a, S, matOf, D);
      if (horse) horseUnder(S, a, matOf);
    },
    parts: skinPasses(dressParts([
      // The spine: the hips at the root (the legs hang from their sockets), the waist bending from
      // them at the navel, the chest from the waist at the ribs.
      K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift - (S.hop ?? 0)], rot: (S) => rootAng(S) * D2R }),
      K.layer('waistB', { joint: true, parent: 'torso', pivot: 'navel', from: 'hip', rot: (S) => waistRel(S) * D2R }),
      K.layer('chest', { joint: true, parent: 'waistB', pivot: 'ribs', rot: (S) => chestRel(S) * D2R }),
      // (Wings from the shoulder blades, behind everything; the far one lifts turning one way, the
      // near the other.)
      ...(wings
        ? [
            K.layer('wingF', { parent: 'chest', pivot: 'wingF', rot: (S) => S.wing * D2R, soft: { ...SOFT.FLAP, max: 10, gain: 0.3 } }),
            K.layer('wingN', { parent: 'chest', pivot: 'wingN', rot: (S) => -S.wing * D2R, soft: { ...SOFT.FLAP, max: 10, gain: 0.3 } }),
          ]
        : []),
      ...(tail ? [K.layer('tail', { parent: 'torso', pivot: 'tail', from: 'hip', soft: { ...SOFT.HAIR, k: 60, max: 14, gain: 0.5, hang: 0.3 } })] : []),
      // The collarbones, from the top of the breastbone: each lifts (`shrug`) and slides forward
      // (`reach`) its shoulder; the neck from the breastbone too.
      K.layer('claF', { joint: true, parent: 'chest', pivot: 'stern', from: 'ribs', at: (S) => [rel('stern', 'ribs')[0] + (S.reachF ?? 0), rel('stern', 'ribs')[1]], rot: (S) => (S.shrugF ?? 0) * D2R }),
      K.layer('claN', { joint: true, parent: 'chest', pivot: 'stern', from: 'ribs', at: (S) => [rel('stern', 'ribs')[0] + (S.reachN ?? 0), rel('stern', 'ribs')[1]], rot: (S) => -(S.shrugN ?? 0) * D2R }),
      K.layer('neckB', { joint: true, parent: 'chest', pivot: 'stern', from: 'ribs', rot: (S) => (S.neckR ?? 0) * D2R }),
      // The far arm (behind the body), on its collarbone (its angle kept as the arm's own).
      K.layer('armFu', { joint: true, parent: 'claF', pivot: 'shF', from: 'stern', rot: (S) => (S.shF - (S.shrugF ?? 0)) * D2R }),
      K.layer('armFf', { joint: true, parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
      K.layer('handF', { joint: true, parent: 'armFf', pivot: 'wrF', rot: (S) => (S.hwF ?? 0) * D2R }),
      live('armF', (ctx, a, mode, S) => skin.arm(ctx, a, mode, S, 'F')),
      live('handFskin', (ctx, a, mode, S) => skin.hand(ctx, a, mode, S, 'F')),
      // The legs, far then near, running up into the hips.
      ...(legs
        ? [
            ...WK.parts().map((p) => ({ ...p, s: undefined })),
            live('legF', (ctx, a, mode, S) => skin.leg(ctx, a, mode, S, 'F')),
            live('footFskin', (ctx, a, mode, S) => skin.foot(ctx, a, mode, S, 'F')),
            live('legN', (ctx, a, mode, S) => skin.leg(ctx, a, mode, S, 'N')),
            live('footNskin', (ctx, a, mode, S) => skin.foot(ctx, a, mode, S, 'N')),
          ]
        : []),
      // (The serpent's tail, from the tip forward, each piece over the joint of the one behind it;
      // its body piece leans with the hips about where it meets the ground. Listed before the pieces
      // they hang from, so each names its parent's joint itself.)
      ...(serpent
        ? [
            K.layer('tailC', { parent: 'tailB', pivot: 'serp2', from: 'serp1', rot: (S, a) => segs(S, a)[2] }),
            K.layer('tailB', { parent: 'tailA', pivot: 'serp1', from: 'serp0', rot: (S, a) => segs(S, a)[1] }),
            K.layer('tailA', { pivot: 'serp0', rot: (S, a) => segs(S, a)[0] }),
            K.layer('lower', { pivot: 'serp0', rot: (S) => Math.asin(clamp(S.x / hgt, -0.4, 0.4)) }),
          ]
        : []),
      // (The spirit's wisp hangs from its hips and trails, curling on its own.)
      ...(spirit ? [K.layer('lower', { parent: 'torso', pivot: 'lower', from: 'hip', rot: (S) => S.wisp * D2R, soft: { ...SOFT.CLOTH, max: 12 } })] : []),
      // (A centaur's barrel, level under the rider's lean, pitching up to rear; its far legs and
      // its tail behind the body.)
      ...(horse
        ? [
            K.layer('barrel', { joint: true, parent: 'torso', pivot: 'hip', rot: (S) => (-rootAng(S) - (S.pitch ?? 0)) * D2R }),
            live('hindF', (ctx, a, mode, S) => skin.horseLeg(ctx, a, mode, S, 'hindF')),
            live('foreF', (ctx, a, mode, S) => skin.horseLeg(ctx, a, mode, S, 'foreF')),
            live('horseTail', (ctx, a, mode, S) => skin.horseTail(ctx, a, mode, S)),
          ]
        : []),
      // The body, one smooth shape over the three bones; the neck up into the head.
      live('torsoSkin', (ctx, a, mode, S) => skin.torso(ctx, a, mode, S)),
      // (The barrel over the rider's hips, so the body rises out of it; the near legs in front.)
      ...(horse
        ? [
            live('barrelSkin', (ctx, a, mode, S) => skin.horseBarrel(ctx, a, mode, S)),
            live('hindN', (ctx, a, mode, S) => skin.horseLeg(ctx, a, mode, S, 'hindN')),
            live('foreN', (ctx, a, mode, S) => skin.horseLeg(ctx, a, mode, S, 'foreN')),
          ]
        : []),
      live('neckSkin', (ctx, a, mode, S) => skin.neck(ctx, a, mode, S)),
      K.layer('head', { joint: Boolean(opts.liveHead), parent: 'neckB', pivot: 'neck', from: 'stern', rot: (S) => S.head * D2R }),
      // The near arm (in front) on its collarbone, the weapon in its hand under the fingers.
      K.layer('armNu', { joint: true, parent: 'claN', pivot: 'shN', from: 'stern', rot: (S) => (S.shN + (S.shrugN ?? 0)) * D2R }),
      K.layer('armNf', { joint: true, parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
      live('armN', (ctx, a, mode, S) => skin.arm(ctx, a, mode, S, 'N')),
      {
        name: 'weapon',
        parent: 'armNf',
        when: (a) => Boolean(a.blWeapon),
        s: (a, S, bare) => weaponSprite(`${kind}|${a.blWeapon}`, weapon(a.blWeapon), SC, bare),
        pivot: (a) => inSprite(weapon(a.blWeapon ?? 'sword'), [0, 0], SC),
        at: () => handAt,
        rot: (S, a) => (S.wa - chestAng(S) - S.shN - S.elN + (ALONG.has(a.blWeapon) ? 0 : 90)) * D2R,
      },
      K.layer('handN', { joint: true, parent: 'armNf', pivot: 'wrN', rot: (S) => (S.hwN ?? 0) * D2R }),
      live('handNskin', (ctx, a, mode, S) => skin.hand(ctx, a, mode, S, 'N')),
    ])),
    fx: (ctx, m, a, S, matOf) => {
      drawFx(ctx, m, a, S, matOf);
      D.H = H;
      opts.fx?.(ctx, m, a, S, matOf, D);
    },
  });

  // ---------- Effects ----------
  // A point of a part's drawing (kid-box units), where it is now in the rig's space.
  const at = (M, [x, y], pivot) => {
    const lx = (x - J[pivot][0]) * SC;
    const ly = (y - J[pivot][1]) * SC;
    return [M[0] * lx + M[2] * ly + M[4], M[1] * lx + M[3] * ly + M[5]];
  };
  const wpt = (a, matOf, pt, w = weapon(a.blWeapon ?? 'sword')) => {
    const M = matOf('weapon');
    const [px, py] = inSprite(w, [0, 0], SC);
    const [sx, sy] = inSprite(w, pt, SC);
    return [M[0] * (sx - px) + M[2] * (sy - py) + M[4], M[1] * (sx - px) + M[3] * (sy - py) + M[5]];
  };
  // Where a trail, a sparkle or a puff comes from: [the point, a second point back along it].
  const source = (src, a, matOf) => {
    const w = a.blWeapon ? weapon(a.blWeapon) : null;
    if ((src === 'weapon' || src === 'tip') && w) return [wpt(a, matOf, w.tip), wpt(a, matOf, w.mid)];
    if (src === 'foot' && legs) {
      const M = matOf('footN');
      return [at(M, J.toeN, 'ankN'), at(M, J.ankN, 'ankN')];
    }
    if (src === 'tail' && serpent) {
      const M = matOf('tailC');
      return [at(M, J.tailTip, 'serp2'), at(M, J.serp2, 'serp2')];
    }
    if (src === 'wisp' && spirit) {
      const M = matOf('lower');
      return [at(M, J.wispTip, 'lower'), at(M, J.lower, 'lower')];
    }
    const M = matOf('handN');
    return [at(M, J.handN, 'wrN'), at(M, J.wrN, 'wrN')];
  };
  const star = (ctx, x, y, s, rot, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? s * 0.32 : s;
      const an = rot + (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const puff = (ctx, x, y, rr, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f3eefa';
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, rr * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const glowBall = (ctx, x, y, rr) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.45, 'rgba(226,206,255,0.75)');
    gr.addColorStop(1, 'rgba(200,170,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, TAU);
    ctx.fill();
  };
  // A sprite drawn about a point of it, turned.
  const stamp = (ctx, s, px, py, x, y, rot, alpha) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    blit(ctx, s, -px, -py, { alpha });
    ctx.restore();
  };

  function drawFx(ctx, m, a, S, matOf) {
    const st = a.mo.rig;
    const mv = a.blMove?.mv;
    const t = a.blMove?.t ?? 0;
    // A swing's trail: the path its edge (or fist, foot, tail, wisp) swept these last moments.
    const TR = 0.14;
    const trail = (st.blTrail ??= []);
    const win = mv?.trail?.find((w) => t >= w[0] && t <= w[1]);
    if (win) {
      const [p0, p1] = source(win[2], a, matOf);
      // (A weapon's swing is drawn round the shoulder it turns from, so it curves as the swing does.)
      const Ms = matOf('armNu');
      trail.push({ at: a.now, p0, p1, kind: win[2], c: [Ms[4], Ms[5]] });
      if (trail.length > 30) trail.shift();
    }
    while (trail.length && (a.now - trail[0].at > TR || a.now < trail[0].at)) trail.shift();
    if (trail.length > 1) {
      ctx.save();
      for (let i = 1; i < trail.length; i++) {
        const A = trail[i - 1];
        const Bq = trail[i];
        const k = 1 - (a.now - A.at) / TR;
        if (k <= 0 || A.kind !== Bq.kind) continue;
        if (A.kind === 'weapon') {
          // A crescent between the paths of the tip and the middle of the blade, swept round the
          // shoulder from one moment to the next (a fast swing covers a wide arc in a frame), the
          // tip's edge lit.
          const [cx0, cy0] = Bq.c;
          const pol = ([x, y]) => [Math.atan2(y - cy0, x - cx0), Math.hypot(x - cx0, y - cy0)];
          const [a0, r0] = pol(A.p0);
          let [a1, r1] = pol(Bq.p0);
          const [b0, q0] = pol(A.p1);
          let [b1, q1] = pol(Bq.p1);
          a1 = a0 + Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
          b1 = b0 + Math.atan2(Math.sin(b1 - b0), Math.cos(b1 - b0));
          const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.12));
          const outer = [];
          const inner = [];
          for (let j = 0; j <= n; j++) {
            const u = j / n;
            const ao = a0 + (a1 - a0) * u;
            const ro = r0 + (r1 - r0) * u;
            const ai = b0 + (b1 - b0) * u;
            const ri = q0 + (q1 - q0) * u;
            outer.push([cx0 + Math.cos(ao) * ro, cy0 + Math.sin(ao) * ro]);
            inner.push([cx0 + Math.cos(ai) * ri, cy0 + Math.sin(ai) * ri]);
          }
          const k1 = 1 - (a.now - Bq.at) / TR;
          ctx.globalAlpha = 0.5 * (k + k1) * 0.5;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          outer.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          for (let j = inner.length - 1; j >= 0; j--) ctx.lineTo(inner[j][0], inner[j][1]);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 0.9 * (k + k1) * 0.5;
          ctx.strokeStyle = '#efe6ff';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = Math.max(0.5, H * 0.016);
          ctx.beginPath();
          outer.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        } else {
          ctx.globalAlpha = 0.55 * k;
          ctx.strokeStyle = '#ffffff';
          ctx.lineCap = 'round';
          ctx.lineWidth = Math.max(0.6, H * 0.07 * k);
          ctx.beginPath();
          ctx.moveTo(A.p0[0], A.p0[1]);
          ctx.lineTo(Bq.p0[0], Bq.p0[1]);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (!mv) {
      st.blShot = null;
      st.blThrow = null;
      return;
    }
    ctx.save();
    // Magic gathering: a soft glow at the staff's crystal (or at the hands), pulsing, with sparkles
    // circling in.
    if (mv.glow && inWindow(mv.glow, t)) {
      const k = Math.max(0, Math.min(1, (t - mv.glow[0]) / 0.15, (mv.glow[1] - t) / 0.1));
      const [[gx0, gy]] = source(mv.glow[2] === 'tip' ? 'tip' : 'fist', a, matOf);
      const gx = gx0 + (mv.glow[2] === 'hand' ? H * 0.05 : 0);
      const rr = H * 0.11 * (1 + 0.12 * Math.sin(a.now * 24));
      ctx.globalAlpha = k;
      glowBall(ctx, gx, gy, rr);
      for (let i = 0; i < 3; i++) {
        const an = a.now * 5 + (i * TAU) / 3;
        const d = rr * (1.5 - ((a.now * 1.5 + i / 3) % 1) * 0.9);
        star(ctx, gx + Math.cos(an) * d, gy + Math.sin(an) * d, H * 0.024, an, '#fff6c8');
      }
    }
    // A spell going off: a flash and a ring of sparkles opening out, and an orb of light flying on.
    if (mv.burst) {
      const bp = since([mv.burst[0]], t, 0.4);
      const op = since([mv.burst[0]], t, 0.45);
      if (op >= 0 && !st.blOrb) st.blOrb = source(mv.burst[1] === 'tip' ? 'tip' : 'fist', a, matOf)[0];
      if (op < 0) st.blOrb = null;
      if (bp >= 0 && st.blOrb) {
        const [bx, by] = st.blOrb;
        const e = 1 - (1 - bp) ** 3;
        ctx.globalAlpha = 1 - bp;
        glowBall(ctx, bx, by, H * 0.14 * (1 - bp * 0.5));
        for (let i = 0; i < 8; i++) {
          const an = (i * TAU) / 8 + 0.3;
          star(ctx, bx + Math.cos(an) * H * 0.24 * e, by + Math.sin(an) * H * 0.24 * e, H * 0.04 * (1 - bp * 0.5), an, i % 2 ? '#e8d8ff' : '#fff2b8');
        }
      }
      if (op >= 0 && st.blOrb && mv !== MOVES.palm) {
        const [bx, by] = st.blOrb;
        const ox = bx + H * 2.4 * op;
        ctx.globalAlpha = Math.min(1, (1 - op) * 3);
        glowBall(ctx, ox, by, H * 0.1);
        for (let i = 1; i < 4; i++) star(ctx, ox - i * H * 0.08, by + Math.sin(a.now * 30 + i) * H * 0.02, H * 0.028 * (1 - i * 0.2), a.now * 8 + i, '#fff6c8');
      }
    }
    // Hit sparkles: a four-point star and a few little ones flying out.
    for (const s0 of mv.spark ?? []) {
      const sp = since([s0], t, 0.22);
      if (sp < 0) continue;
      const src = mv.sparkAt ?? mv.trail?.find((w) => s0 >= w[0] - 0.02 && s0 <= w[1] + 0.02)?.[2] ?? (a.blWeapon ? 'weapon' : 'fist');
      const [[sx, sy]] = source(src, a, matOf);
      const e = 1 - (1 - sp) ** 3;
      ctx.globalAlpha = 1 - sp;
      star(ctx, sx, sy, H * 0.1 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
      star(ctx, sx, sy, H * 0.05 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const an = (i * TAU) / 4 + 0.6;
        star(ctx, sx + Math.cos(an) * H * 0.14 * e, sy + Math.sin(an) * H * 0.14 * e, H * 0.025, an, i % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    // A gun's muzzle flash and a puff of smoke.
    const held = a.blWeapon ? weapon(a.blWeapon) : null;
    for (const f0 of mv.flash ?? []) {
      const fp = since([f0], t, 0.08);
      const sm = since([f0], t, 0.5);
      if (sm < 0 || !held?.muzzle) continue;
      const [mx, my] = wpt(a, matOf, held.muzzle);
      const [qx, qy] = wpt(a, matOf, [held.muzzle[0], held.muzzle[1] + 1]);
      const dl = Math.hypot(qx - mx, qy - my) || 1;
      const ux = (qx - mx) / dl;
      const uy = (qy - my) / dl;
      if (fp >= 0) {
        const L = H * 0.17 * (1 - fp * 0.6);
        ctx.globalAlpha = 1 - fp;
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.moveTo(mx - uy * L * 0.35, my + ux * L * 0.35);
        ctx.lineTo(mx + ux * L, my + uy * L);
        ctx.lineTo(mx + uy * L * 0.35, my - ux * L * 0.35);
        ctx.closePath();
        ctx.fill();
        star(ctx, mx + ux * L * 0.25, my + uy * L * 0.25, L * 0.45, fp, '#ffffff');
      }
      puff(ctx, mx + ux * H * 0.04 + H * 0.03 * sm, my - H * 0.12 * sm, H * 0.035 * (0.6 + sm), 0.5 * (1 - sm));
    }
    // The shot leaving: an arrow flying on, or a bullet's streak; where from and which way fixed at
    // the moment it left.
    for (const s0 of mv.shot ?? []) {
      const bowShot = isBow(a.blWeapon);
      const sp = since([s0], t, bowShot ? 0.42 : 0.14);
      const id = `${s0}`;
      if (sp < 0) {
        if (st.blShot?.id === id) st.blShot = null;
        continue;
      }
      if (st.blShot?.id !== id) {
        const from = bowShot ? wpt(a, matOf, [0, 0]) : wpt(a, matOf, held?.muzzle ?? held?.tip ?? [0, 0]);
        const M = matOf('armNf');
        const dl = Math.hypot(M[2], M[3]) || 1;
        st.blShot = { id, from, dir: [M[2] / dl, M[3] / dl] };
      }
      const { from, dir } = st.blShot;
      if (bowShot) {
        const d = H * 2.6 * sp;
        const ar = weapon('arrow');
        const [px, py] = inSprite(ar, [0, 0], SC);
        stamp(ctx, weaponSprite(`${kind}|arrow`, ar, SC, false), px, py, from[0] + dir[0] * d, from[1] + dir[1] * d, Math.atan2(dir[1], dir[0]) - Math.PI / 2, Math.min(1, (1 - sp) * 4));
      } else {
        const d = H * 3.2 * sp;
        const tl = H * 0.35;
        ctx.globalAlpha = 1 - sp * 0.6;
        ctx.strokeStyle = '#fff6cc';
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(0.6, H * 0.024);
        ctx.beginPath();
        ctx.moveTo(from[0] + dir[0] * Math.max(0, d - tl), from[1] + dir[1] * Math.max(0, d - tl));
        ctx.lineTo(from[0] + dir[0] * d, from[1] + dir[1] * d);
        ctx.stroke();
      }
    }
    // The thrown ball, in an arc ahead, spinning.
    for (const s0 of mv.throwAt ?? []) {
      const sp = since([s0], t, 0.5);
      if (sp < 0) {
        st.blThrow = null;
        continue;
      }
      st.blThrow ??= source('fist', a, matOf)[0];
      const from = st.blThrow;
      const bw = weapon('ball');
      const [px, py] = inSprite(bw, bw.tip, SC);
      stamp(ctx, weaponSprite(`${kind}|ball`, bw, SC, false), px, py, from[0] + H * 2.2 * sp, from[1] - H * 0.3 * Math.sin(Math.PI * sp) + H * 0.25 * sp * sp, sp * 9, Math.min(1, (1 - sp) * 4));
    }
    // Dust where something lands: soft round puffs rolling out along the ground.
    for (const [d0, where] of mv.dust ?? []) {
      const dp = since([d0], t, 0.45);
      if (dp < 0) continue;
      let gx = S.x * 0.5;
      if (where === 'tip' && held) gx = wpt(a, matOf, held.tip)[0];
      else if (where === 'foot' || where === 'tail') gx = source(where, a, matOf)[0][0];
      else if (where === 'hips') gx = S.x;
      else if (where === 'front' && a.blHorse) gx = (a.blHorse.legs.foreN.P[0] + a.blHorse.legs.foreF.P[0]) / 2;
      const e = 1 - (1 - dp) ** 2;
      for (const s2 of [-1, 1]) {
        for (let i = 0; i < 2; i++) {
          const rr = H * (0.05 - i * 0.012) * (0.6 + e * 0.8);
          puff(ctx, gx + s2 * H * (0.06 + i * 0.07) * (0.4 + e), -rr * 0.7 - H * 0.02 * e, rr, 0.75 * (1 - dp));
        }
      }
    }
    // Speed lines behind a dash.
    if (mv.lines && inWindow(mv.lines, t)) {
      const k = Math.max(0, Math.min(1, (t - mv.lines[0]) / 0.05, (mv.lines[1] - t) / 0.1));
      ctx.globalAlpha = 0.75 * k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.5, H * 0.02);
      for (let i = 0; i < 4; i++) {
        const y = -H * (0.22 + i * 0.17);
        const x0 = S.x - H * (0.24 + ((t * 3 + i * 0.37) % 1) * 0.25);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 - H * (0.22 + (i % 2) * 0.1), y);
        ctx.stroke();
      }
    }
    // A gust from the wings: arcs of wind rolling ahead.
    for (const g0 of mv.gust ?? []) {
      const gp = since([g0], t, 0.45);
      if (gp < 0) continue;
      ctx.globalAlpha = 0.8 * (1 - gp);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.5, H * 0.022);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(S.x + H * (0.3 + gp * 0.9 + i * 0.08), -H * (0.35 + (i - 1) * 0.2), H * 0.12, -0.9, 0.9);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  return { rig, still: K.still, stride, speed: walkSpeed, h: Math.round(K.BH * 0.86), w: Math.round(K.BW * 0.5), H, D };
}
