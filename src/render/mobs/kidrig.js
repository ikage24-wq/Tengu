// The chibi kid rig kit (2026-11-13): turns a kid drawn in named layers (kidbase.js) into a live
// rig on rig.js, every layer its own part. Any future little-folk monster is built the same way:
//
//   const K = kidKit('mykid', (mood) => myKidShapes(mood), MY_JOINTS);
//   parts: K.twoPass([
//     K.layer('coatL', { parent: 'torso', pivot: 'waist', soft: K.CLOTH }),
//     K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R, face: true }),
//     ...
//   ])
//
// A layer is drawn once as its own crisp sprite (outlined, and bare for the outer-outline pass),
// placed at its pivot joint, and, when `soft`, swings on its own physics (rig.js, Soft layers),
// so an outfit's panels, flaps, collars, petals and locks all trail, bounce and settle by
// themselves. `dir` (where the layer's middle is from its pivot) is worked out from the drawing.

import { part, partBare, smooth } from './rig.js';
import { W, H, CX, G, mapShape } from './kidbase.js';

export const D2R = Math.PI / 180;
const SC = 1 / 3;
const FACES = new Set(['idle', 'happy', 'angry', 'hurt', 'blink']);
export const moodOf = (m) => (m === 'dead' ? 'hurt' : FACES.has(m) ? m : 'idle');

// How a layer of each sort swings (rig.js, Soft layers). Tune per layer with { ...K.CLOTH, k: 90 }.
export const SOFT = {
  // A coat panel or a skirt: hangs, sways behind the body, flares a little on landings.
  // (Tuned so each sort swings well short of its limit in a normal walk and idle: a layer that
  // keeps hitting its stop looks jittery. The push grows as a layer gets shorter, so small flaps
  // and leaves have the lowest gain.)
  CLOTH: { k: 95, c: 6.5, gain: 0.55, turn: 0.9, hang: 0.55, max: 16 },
  // A small flap (pocket flap, collar point, cuff): quick and bouncy.
  FLAP: { k: 170, c: 6, gain: 0.28, turn: 0.7, max: 24 },
  // Hair hanging from the head (the back of a bob, a pigtail): floppy, lags the head's turns.
  HAIR: { k: 70, c: 6, gain: 0.55, turn: 1, hang: 0.6, max: 18, flutter: 2.5, hz: 0.45 },
  // The fringe over the face: only a little, so the face never shows a gap.
  FRINGE: { k: 160, c: 10, gain: 0.35, turn: 0.4, max: 4 },
  // A petal or a leaf: light, flutters in the air.
  PETAL: { k: 120, c: 5, gain: 0.42, turn: 0.8, max: 26, flutter: 3, hz: 0.8 },
  // A prop on a hand or a stem (a lily pad, a dandelion puff): bobs on its stem.
  PROP: { k: 85, c: 5.5, gain: 0.25, turn: 0.6, max: 24, flutter: 2, hz: 0.5 },
  // A dangling limb (a fairy's legs): a heavy pendulum.
  LIMB: { k: 60, c: 5, gain: 0.9, turn: 0.9, hang: 0.8, max: 38 },
  // A loose hood or scarf behind the neck.
  HOOD: { k: 75, c: 6, gain: 0.55, turn: 0.9, hang: 0.5, max: 18 },
};

// The middle of a layer's drawing (the centre of its bounds), in the drawing's units.
function middleOf(shapes) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const take = (x, y) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (const s of shapes) {
    if (!s) continue;
    if (s.t === 'e') {
      take(s.x - s.rx, s.y - s.ry);
      take(s.x + s.rx, s.y + s.ry);
    } else if (s.t === 'r') {
      take(s.x, s.y);
      take(s.x + s.w, s.y + s.h);
    } else if (s.pts) for (const [x, y] of s.pts) take(x + (s.x ?? 0), y + (s.y ?? 0));
  }
  return Number.isFinite(x0) ? [(x0 + x1) / 2, (y0 + y1) / 2] : null;
}

// A held stretch of a loop: 0 before a, easing to 1 by b, held to c, easing back by d.
export const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));

// Every part twice: the outlined pass in order, then the bare pass in the same order over it.
export function twoPass(list) {
  const first = list.map((p) => (p.s ? { ...p, paint: undefined, s: (a, S) => p.s(a, S, false) } : p));
  const second = list.filter((p) => p.s).map((p) => ({ ...p, name: `${p.name}~b`, s: (a, S) => p.s(a, S, true) }));
  return [...first, ...second];
}

// The kit for one kid: `draw(mood)` returns { groups } (kidbase `groups()`), `joints` its pivots.
export function kidKit(kind, draw, joints) {
  const BW = Math.ceil(W * SC);
  const BH = Math.ceil(H * SC);
  const scaled = (shapes) => shapes.map((sh) => mapShape(sh, ([x, y]) => [x * SC, y * SC], SC));
  const J = (j) => {
    const v = joints[j];
    if (!v) throw new Error(`${kind}: no joint ${j}`);
    return v;
  };
  // A joint in the rig's space (the feet at 0, 0), or relative to another joint.
  const rel = (j, from) => {
    const a = J(j);
    const b = from ? J(from) : [CX, G];
    return [(a[0] - b[0]) * SC, (a[1] - b[1]) * SC];
  };
  const pv = (j) => [J(j)[0] * SC, J(j)[1] * SC];
  // Where a joint of a layer's drawing is now, in the rig's space (M from matOf, `pivot` the
  // layer's pivot joint).
  const through = (M, j, pivot) => {
    const x = (J(j)[0] - J(pivot)[0]) * SC;
    const y = (J(j)[1] - J(pivot)[1]) * SC;
    return [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
  };
  const groupsOf = (mood) => draw(mood ?? 'idle').groups;
  const piece = (name, mood, bare) => {
    const key = `kid|${kind}|${name}|${mood ?? ''}`;
    const shapes = () => scaled(groupsOf(mood)[name] ?? []);
    return bare ? partBare(key, BW, BH, shapes, 4, 3) : part(key, BW, BH, shapes, 4, 3);
  };
  // Where a layer's middle sits from its pivot, in game pixels (its soft swing's `dir`).
  const dirOf = (name, pivot) => {
    const mid = middleOf(groupsOf('idle')[name] ?? []);
    if (!mid) return [0, 1];
    return [(mid[0] - J(pivot)[0]) * SC, (mid[1] - J(pivot)[1]) * SC];
  };
  // The face for the moment: dead and hurt wince, a fierce face through an attack, a blink.
  const faceOf = (a) => {
    if (a.face === 'dead') return 'hurt';
    if (a.ph.atk) return 'angry';
    const f = moodOf(a.face);
    if (f === 'idle' && ((a.t + ((a.m?.uid ?? 0) % 7) * 0.61) % 4.2) < 0.13) return 'blink';
    return f;
  };
  // One layer as a rig part. `pivot`: the joint it turns about; `parent`: the part it rides on
  // (null: the feet), placed at its pivot measured from the parent's pivot (`from`, default the
  // parent's own pivot joint); `rot`: its posed turn; `soft`: a SOFT preset (dir filled in);
  // `face`: drawn per face (the head). Anything else (at, alpha, paint, when) passes through.
  const pivots = {};
  const layer = (name, o = {}) => {
    const pivot = o.pivot;
    pivots[name] = pivot;
    const from = o.from ?? (o.parent ? pivots[o.parent] : null);
    const soft = o.soft ? { dir: dirOf(o.group ?? name, pivot), ...o.soft } : undefined;
    const group = o.group ?? name;
    return {
      name,
      parent: o.parent ?? null,
      s: o.joint ? undefined : (a, S, b) => piece(group, o.face ? faceOf(a) : null, b),
      pivot: pv(pivot),
      at: o.at ?? (() => rel(pivot, from)),
      rot: o.rot,
      soft,
      paint: o.paint,
      alpha: o.alpha,
      when: o.when,
    };
  };
  // A portrait (the Monster Book): every layer at rest.
  const still = (pose, f, mood) => ({ w: BW, h: BH, res: 3, shapes: scaled(Object.values(draw(moodOf(mood)).groups).flat().filter(Boolean)) });
  return { BW, BH, SC, J, rel, pv, through, piece, dirOf, faceOf, layer, still, SOFT, twoPass, hold };
}
