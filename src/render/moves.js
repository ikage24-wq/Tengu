// Attack and skill moves for the hero. Each move maps its progress (0-1) to:
//   weapon, arm  — weapon angle (deg, 0 = up, + tips forward) and attack-arm angle (deg, 0 = down,
//                  90 = straight forward, 180 = straight up)
//   rig(r)       — body tweaks on the solved rig (lean, squat, legs, the free arm, face)
//   lift, lunge  — whole-body hop (px up) and forward shove (px), drawn only (no physics)
//   tilt         — whole-body lean in radians (+ forward), turn (for spins: only its sign is drawn,
//                  as a clean mirror flip), stretch (ignored: the figure never squashes or stretches)
//   orbit        — the weapon angle is the blade's path around the body as seen, so it keeps that
//                  path when a turn flips the figure (a spin's sweep runs on instead of mirroring)
//   trail        — whether the weapon tip leaves a ribbon
//   pull, nock   — for bows: how far the string is drawn back (0-1) and whether an arrow is on it;
//   twang, spares  the string ringing after the loose (0-1), and spare arrows held in the draw hand
// `dur` is the move's length in seconds, so long ultimates can loop their motion.

import { LIFE_MOVES, LIFE_MIN } from './life-moves.js';
import { SOCIAL_MOVES, SOCIAL_MIN } from './social-moves.js';
import { EMOTE_MOVES, EMOTE_MIN } from './emote-moves.js';
import { VILLAIN_MOVES, VILLAIN_MIN } from './villain-moves.js';

const RES = 2;
const q = (v) => Math.round(v * RES) / RES;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t;
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));

// The string ringing after the loose: 1 at the release frame, gone over the next few frames (the
// bow springs straight in about 0.03 s, then rings down; research/archery.md 4, 6).
const twang = (p, at) => (p < at ? 0 : Math.max(0, 1 - (p - at) / 0.14));

// The Arbalist Engineer's aim: the crossbow pushed out to arm's length at chest height, clear of her
// body and below her face (at the hip it hid her whole torso and her knees).
const AE_AIM = 86;

function tuck(r) {
  r.air = true;
  r.frontLeg = [2.6, -5, 10];
  r.backLeg = [-1.6, -2.6, -10];
}
function lungeLegs(r, k = 1) {
  r.frontLeg = [q(3.6 * k), 0, 4];
  r.backLeg = [q(-3 * k), 0, -10];
}
function wideLegs(r) {
  r.frontLeg = [3, 0, 2];
  r.backLeg = [-3, 0, -2];
}
function strikeFace(r) {
  r.mouth = 'open';
}

// Easing for slow, flowing figures (a sine in-out, never the snap of a strike), and legs that
// glide between stances: `danceLegs` starts from standing and blends toward each
// [weight, frontLeg, backLeg] in turn. Held poses breathe
// (`breathe`, a small rise and fall over the figure) so a long hold never freezes.
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
function danceLegs(r, ...stances) {
  let f = [0.8, 0, 0];
  let b = [-0.8, 0, 0];
  for (const [w, front, back] of stances) {
    const k = clamp01(w);
    f = f.map((v, i) => lerp(v, front[i], k));
    b = b.map((v, i) => lerp(v, back[i], k));
  }
  const grid = ([dx, dy, a]) => [q(dx), q(dy), Math.round(a / 2) * 2];
  r.frontLeg = grid(f);
  r.backLeg = grid(b);
}
const breathe = (p) => Math.sin(p * Math.PI * 3);
// While a thrown weapon is in flight (the Blade Dancer's ring), between two moments of a move.
const rel = (p, a, b) => (p >= a && p < b ? 1 : 0);
// The dancers' footwork (the 2026-11-04 footwork pass). `ballon`: after a figure lands she rebounds
// off the floor twice, a little temps levé and a smaller one (back to rest by the end), so a held
// line keeps dancing instead of freezing. `SAUTE`: the legs in a ballet hop, front foot tucked and
// the back heel kicked up behind, toe pointed. `KICKLINE`: the Blade Dancer's showgirl skip, the
// front knee popped up high. `cabriole`: the Sky Dancer's legs beating together in the air.
const ballon = (p, a) => 2.4 * bump(p, a, a + (1 - a) * 0.45) + 0.9 * bump(p, a + (1 - a) * 0.45, a + (1 - a) * 0.85);
const SAUTE = [[1.6, -2.6, 14], [-2.6, -4.6, -58]];
const KICKLINE = [[3.2, -7, 46], [-1.2, -1.4, -12]];
const CABRIOLE = [[1.4, -7, 30], [-0.4, -7.4, 30]];
const dancerTurn = (a) => Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2)));
// A dancer's working leg held long at `deg` from straight down at the hip (90 straight forward, 180
// straight up, negative behind her), as a foot offset for danceLegs; `len` is hip to ankle.
const dancerLeg = (deg, len = 14.6, tilt = 0) => [len * Math.sin((deg * Math.PI) / 180), len * Math.cos((deg * Math.PI) / 180) - 15.4, tilt];
// A dancer's free hand: it may fly wide or low, but never up past her jaw (the big chibi head
// starts right above the shoulder, so a raised free hand lands on her cheek).
const dancerHand = ([x, y]) => [x, Math.max(-8, y)];


// A backflip (the Thief's way out of a finisher): spring up and turn right over backwards, tucked,
// and land low. `k` scales the height.
function backflip(t, k = 1) {
  const f = ease(t);
  const hop = Math.sin(t * Math.PI);
  const land = bump(t, 0.82, 1);
  return {
    weapon: 25, arm: 60, lift: 24 * k * hop, tilt: -f * Math.PI * 2,
    rig: (r) => { if (hop > 0.25) tuck(r); else if (t > 0) { r.squat = land > 0.2 ? 2 : 1; wideLegs(r); } r.backArm = [-2, -3]; r.hairLift = hop > 0.3 ? -1 : 0; r.cape -= hop > 0.3 ? 3 : 0; },
  };
}

// One bow shot inside a move: drawn from `a` to `at`, loosed at `at` with a kick of recoil. Returns
// the pose's pull, nock and twang, and `snap` (loosed) and `kick` (the recoil) to pose round it.
function bowShot(p, a, at) {
  const pull = ease(seg(p, a, at));
  const snap = seg(p, at, at + 0.08);
  return { pull: snap > 0 ? 0 : pull, nock: snap === 0 && pull > 0.05, twang: twang(p, at), snap, kick: bump(p, at, at + 0.14) };
}

export const MOVES = {
  // A forward slash: wind up behind the head, cut down and through.
  slash(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: 25 - 110 * t, arm: 40 + 125 * t, tilt: -0.05 * t, rig: (r) => { r.tx = -1; r.by = 0; r.backArm = [-2, -1]; } };
    }
    const t = ease(seg(p, 0.3, 0.65));
    return {
      weapon: -85 + 235 * t, arm: 165 - 120 * t, lunge: 3 * t * (1 - seg(p, 0.7, 1)), tilt: 0.1 * t * (1 - seg(p, 0.7, 1)), trail: p < 0.75,
      rig: (r) => { r.tx = p < 0.7 ? 2 : 1; r.squat = p < 0.7 ? 1 : 0; lungeLegs(r, p < 0.7 ? 1 : 0.6); r.backArm = [-3, -1]; strikeFace(r); },
    };
  },

  // The backhand: a rising cut from low in front up and over the shoulder.
  slash2(p) {
    if (p < 0.25) {
      const t = ease(p / 0.25);
      return { weapon: lerp(40, 150, t), arm: lerp(60, 25, t), rig: (r) => { r.squat = 1; r.tx = -1; r.backArm = [1, 0]; } };
    }
    const t = ease(seg(p, 0.25, 0.6));
    const back = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(150, -70, t) + 95 * back, arm: lerp(25, 172, t) - 110 * back, lift: 3 * bump(p, 0.25, 0.8), tilt: -0.08 * t * (1 - back), trail: p < 0.7,
      rig: (r) => { r.tx = 2; lungeLegs(r, 0.8); r.backArm = [-3, -2]; strikeFace(r); r.hairLift = -1; },
    };
  },

  // A heavy two-handed smash: hop up with the weapon high behind, then slam it into the ground.
  overhead(p) {
    if (p < 0.38) {
      const t = ease(p / 0.38);
      return { weapon: lerp(20, -115, t), arm: lerp(60, 180, t), lift: 7 * t, tilt: -0.14 * t, rig: (r) => { tuck(r); r.backArm = [-1, -5]; r.hairLift = -1; } };
    }
    const t = easeIn(seg(p, 0.38, 0.55));
    const settle = seg(p, 0.6, 1);
    return {
      weapon: lerp(-115, 165, t) - 45 * ease(seg(p, 0.75, 1)), arm: lerp(180, 45, t) + 20 * ease(seg(p, 0.75, 1)), lift: 7 * (1 - t), tilt: lerp(-0.14, 0.2, t) * (1 - settle), trail: p < 0.62,
      rig: (r) => { if (t >= 1) { r.squat = settle < 0.5 ? 2 : 1; wideLegs(r); } r.tx = 2; r.backArm = [-2, 1]; strikeFace(r); },
    };
  },

  // A straight stab: draw back, then drive the point forward with a lunge.
  thrust(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: 92, arm: lerp(80, 55, t), lunge: -2 * t, tilt: -0.04 * t, rig: (r) => { r.tx = -1; r.backArm = [1, -1]; } };
    }
    const t = ease(seg(p, 0.3, 0.5));
    const back = seg(p, 0.6, 1);
    return {
      weapon: 90, arm: lerp(55, 105, t) - 25 * back, lunge: lerp(-2, 8, t) * (1 - back * 0.8), tilt: 0.12 * t * (1 - back),
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.2); r.backArm = [-3, -1]; strikeFace(r); },
    };
  },

  // A blur of stabs: the arm pumps in and out while the point jitters up and down.
  flurry(p, dur) {
    const n = Math.max(4, Math.round(dur * 12));
    const k = Math.abs(Math.sin(p * Math.PI * n));
    const which = Math.floor(p * n) % 3;
    return {
      weapon: 90 + [-14, 6, 18][which] * k, arm: 60 + 45 * k, lunge: 2 + 4 * k, tilt: 0.08,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1); r.backArm = [-3 + (which % 2) * 2, -1]; strikeFace(r); },
    };
  },

  // A full spin: the body turns through, the weapon sweeping all the way around.
  spin(p, dur) {
    const turns = dur > 0.8 ? 2 : 1;
    const a = ease(seg(p, 0.08, 0.85)) * turns;
    return {
      weapon: 95 + a * 360, arm: 100, orbit: true, turn: Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))), lift: 4 * bump(p, 0.1, 0.85), trail: p > 0.08 && p < 0.88,
      rig: (r) => { r.squat = p < 0.08 || p > 0.88 ? 1 : 0; wideLegs(r); r.backArm = [-3, -3]; r.hairLift = -1; strikeFace(r); },
    };
  },

  // Cross Slash (cuts at ~0.3 and ~0.52): he steps in and raises the blade high over his back
  // shoulder, chops it down hard across in front of him to low behind, plants, and whips it straight
  // back up in a rising backhand that crosses the first cut; he holds the blade up high, free fist
  // pulled back, as the steel cross burns on them, then settles.
  crossslash(p) {
    const wind = soft(seg(p, 0, 0.2));
    const chop = ease(seg(p, 0.22, 0.34));
    const rise = ease(seg(p, 0.42, 0.54));
    const hold = soft(seg(p, 0.56, 0.7));
    const end = soft(seg(p, 0.86, 1));
    return {
      weapon: lerp(lerp(lerp(60, -20, wind), 175, chop), 10, rise) + 50 * end,
      arm: lerp(lerp(lerp(lerp(60, 160, wind), 30, chop), 160, rise), 130, hold) - 60 * end,
      lunge: 4 * chop + 6 * rise * (1 - end), tilt: -0.1 * wind * (1 - chop) + 0.16 * chop * (1 - rise) - 0.12 * rise * (1 - end), lift: 3 * bump(p, 0.42, 0.62),
      trail: (p > 0.22 && p < 0.36) || (p > 0.42 && p < 0.56),
      rig: (r) => {
        r.squat = q(2 * chop * (1 - rise) + 1);
        wideLegs(r);
        r.backArm = [q(lerp(-2, -4, rise)), q(lerp(-1, -3, hold))];
        r.hairLift = rise > 0.3 && end < 0.5 ? -1 : 0;
        if (chop > 0.1 && end < 0.6) strikeFace(r);
      },
    };
  },

  // The Paladin's Cross Slash (cuts at ~0.3 and ~0.5): she raises the blade upright in a knight's
  // salute beside her, then cuts down and across in one clean stroke, steps through and cuts the
  // rising stroke back the other way; she finishes by turning the blade point-down and planting it
  // in front of her, both hands on the hilt, chin up.
  plcross(p) {
    const salute = soft(seg(p, 0, 0.18));
    const down = ease(seg(p, 0.2, 0.32));
    const up = ease(seg(p, 0.4, 0.52));
    const plant = soft(seg(p, 0.62, 0.76));
    const end = soft(seg(p, 0.9, 1));
    return {
      weapon: lerp(lerp(lerp(lerp(60, 0, salute), 170, down), 20, up), 180, plant) - 120 * end,
      arm: lerp(lerp(lerp(lerp(60, 120, salute), 35, down), 150, up), 60, plant) + 10 * end,
      lunge: 3 * down + 5 * up * (1 - plant * 0.5), tilt: 0.1 * down * (1 - up) - 0.06 * up * (1 - plant), lift: 0,
      trail: (p > 0.2 && p < 0.34) || (p > 0.4 && p < 0.54),
      rig: (r) => {
        r.squat = q(1.5 * down * (1 - up) + 1.5 * plant * (1 - end));
        wideLegs(r);
        r.backArm = plant > 0.4 ? [q(4 * (1 - end)), q(1)] : [-2, q(-2 - 2 * salute)];
        if (plant > 0.5 && end < 0.6) r.eyes = 'half';
        else if (down > 0.1) strikeFace(r);
      },
    };
  },
  // The Berserker's Cross Slash (cuts at ~0.34 and ~0.54): he hunches and leaps in with the axe
  // flung right back over his head, hacks it down as he lands, and wrenches it straight back up
  // in a whirling backhand that heaves him up onto his toes; he ends hunched low, axe hanging, roaring.
  bkcross(p) {
    const coil = soft(seg(p, 0, 0.2));
    const leap = bump(p, 0.14, 0.36);
    const hack = ease(seg(p, 0.26, 0.36));
    const wrench = ease(seg(p, 0.44, 0.56));
    const roar = soft(seg(p, 0.62, 0.74)) * (1 - soft(seg(p, 0.9, 1)));
    return {
      weapon: lerp(lerp(lerp(70, -40, coil), 190, hack), -10, wrench) + 70 * roar,
      arm: lerp(lerp(lerp(60, 170, coil), 15, hack), 170, wrench) - 110 * roar,
      lunge: 8 * leap + 4 * hack + 4 * wrench * (1 - roar), lift: 10 * leap, tilt: -0.14 * coil * (1 - hack) + 0.24 * hack * (1 - wrench) - 0.1 * wrench * (1 - roar) + 0.18 * roar,
      trail: (p > 0.26 && p < 0.38) || (p > 0.44 && p < 0.58),
      rig: (r) => {
        r.air = leap > 0.4;
        r.squat = q(2 * coil * (1 - leap) + 2.5 * roar);
        if (r.air) tuck(r);
        else wideLegs(r);
        r.backArm = [q(lerp(2, -4, wrench)), q(lerp(-4, 0, roar))];
        r.hairLift = leap > 0.3 ? -1 : wrench > 0.3 && roar < 0.5 ? 1 : 0;
        if (hack > 0.1 || roar > 0.3) strikeFace(r);
        if (roar > 0.3) r.mouth = 'open';
      },
    };
  },

  // An uppercut: crouch low, then launch upward with the blade rising.
  rising(p) {
    if (p < 0.25) {
      const t = ease(p / 0.25);
      return { weapon: lerp(30, 160, t), arm: lerp(60, 20, t), rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [1, 1]; } };
    }
    const up = ease(seg(p, 0.25, 0.55));
    const down = soft(seg(p, 0.6, 1));
    return {
      weapon: lerp(160, -30, up) + 30 * down, arm: lerp(20, 176, up), lift: 16 * up * (1 - easeIn(down)), tilt: -0.16 * up * (1 - down), trail: p < 0.62,
      rig: (r) => { if (down < 0.9) tuck(r); r.backArm = [-3, -4]; r.hairLift = -1; strikeFace(r); },
    };
  },

  // Leap high, then dive down and drive the weapon into the ground.
  plunge(p) {
    if (p < 0.4) {
      const t = ease(p / 0.4);
      return { weapon: lerp(20, -10, t), arm: lerp(90, 176, t), lift: 26 * t, tilt: -0.12 * t, rig: (r) => { tuck(r); r.backArm = [-2, -5]; r.hairLift = -1; } };
    }
    const t = easeIn(seg(p, 0.4, 0.58));
    const settle = seg(p, 0.65, 1);
    return {
      weapon: lerp(-10, 178, ease(seg(p, 0.4, 0.5))), arm: lerp(176, 35, t), lift: 26 * (1 - t), tilt: 0.25 * t * (1 - settle), trail: p < 0.6,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = 2; wideLegs(r); } r.backArm = [-2, 1]; strikeFace(r); },
    };
  },

  // A lean-forward dash, blade trailing low, legs in a long stride.
  dash(p) {
    const k = bump(p, 0, 1);
    return {
      weapon: 120, arm: 105, tilt: 0.32 * k, lunge: 6 * k, stretch: 1 - 0.06 * k, trail: p > 0.1 && p < 0.8,
      rig: (r) => { r.frontLeg = [4.5, 0, 8]; r.backLeg = [-4.5, 0, -14]; r.backArm = [-4, -1]; r.tx = 2; strikeFace(r); r.hairLift = -1; r.cape = -4; },
    };
  },

  // Shield Rush (the Paladin's charge): she brings the blade up flat before her like a shield,
  // marches in behind it in heavy, deliberate steps (a real stride, the body upright and braced),
  // then drives it point-down into the ground and holds the low guard. The plant lands at 0.8.
  shieldrush(p) {
    if (p < 0.14) {
      const t = ease(p / 0.14);
      return { weapon: lerp(25, 8, t), arm: lerp(60, 98, t), tilt: -0.06 * t, rig: (r) => { r.squat = 1; wideLegs(r); r.backArm = [3, -2]; r.cape = -2; } };
    }
    if (p < 0.72) {
      const u = (p - 0.14) / 0.58;
      const s = Math.sin(u * Math.PI * 4);
      const plant = Math.abs(s) < 0.35;
      return {
        weapon: 8 + 3 * s, arm: 98, tilt: 0.1, lift: plant ? 0 : 1.5 * Math.abs(s), lunge: 2,
        rig: (r) => { r.frontLeg = [q(3.4 * s), s > 0 ? q(-1.6 * s) : 0, 16 * s]; r.backLeg = [q(-3.4 * s), s < 0 ? q(1.6 * s) : 0, -16 * s]; r.backArm = [3, -2]; r.tx = 1; r.cape = -4; r.hairLift = -1; strikeFace(r); },
      };
    }
    const t = easeIn(seg(p, 0.72, 0.8));
    const settle = ease(seg(p, 0.86, 1));
    return {
      weapon: lerp(8, 180, t), arm: lerp(98, 75, t) + 10 * settle, tilt: lerp(0.1, 0.18, t) * (1 - settle), lunge: 2 + 3 * t,
      rig: (r) => { if (t >= 1 && settle < 0.7) { r.squat = 3; r.frontLeg = [3.5, 0, 6]; r.backLeg = [-3, 2, -30]; } else wideLegs(r); r.backArm = [3, -1]; r.tx = 1; strikeFace(r); },
    };
  },

  // Reckless Charge (the Berserker's): hunched low, he sprints in a long running stride with the
  // axe dragged along the ground behind him, then leaps with it hauled up overhead and crashes down
  // in a cleave, holding the deep crouch. The cleave lands at 0.8.
  recklesscharge(p) {
    if (p < 0.1) {
      const t = ease(p / 0.1);
      return { weapon: lerp(25, 200, t), arm: lerp(60, 25, t), tilt: 0.25 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [2, 1]; r.tx = 1; } };
    }
    if (p < 0.62) {
      const u = (p - 0.1) / 0.52;
      const s = Math.sin(u * Math.PI * 6);
      return {
        weapon: 212 + 4 * s, arm: 22, tilt: 0.36, lift: 2.5 * Math.abs(s), lunge: 4,
        rig: (r) => { r.frontLeg = [q(4 * s), s > 0 ? q(-2.4 * s) : 0, 22 * s]; r.backLeg = [q(-4 * s), s < 0 ? q(2.4 * s) : 0, -22 * s]; r.backArm = [q(-4 * s), -1]; r.tx = 2; r.cape = -6; r.hairLift = -1; strikeFace(r); },
      };
    }
    if (p < 0.78) {
      const t = ease(seg(p, 0.62, 0.74));
      return {
        weapon: lerp(212, -150, t), arm: lerp(22, 188, t), lift: 22 * Math.sin(seg(p, 0.62, 0.8) * Math.PI * 0.62), lunge: 4 + 4 * t, tilt: lerp(0.36, -0.3, t),
        rig: (r) => { tuck(r); r.backArm = [-1, -6]; r.hairLift = -1; r.cape = -6; strikeFace(r); },
      };
    }
    const t = easeIn(seg(p, 0.78, 0.8));
    const settle = ease(seg(p, 0.86, 1));
    return {
      weapon: lerp(-150, 165, t) - 20 * settle, arm: lerp(188, 40, t) + 15 * settle, lift: 22 * Math.sin(0.62 * Math.PI) * (1 - t) * 0.6, lunge: 8, tilt: lerp(-0.3, 0.38, t) * (1 - settle),
      trail: p < 0.86,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [3, 2]; r.cape = -5; strikeFace(r); },
    };
  },

  // Wind the arm back behind the head and fling.
  throw(p) {
    if (p < 0.35) {
      const t = ease(p / 0.35);
      return { weapon: lerp(60, -30, t), arm: lerp(90, 185, t), tilt: -0.1 * t, rig: (r) => { r.tx = -1; r.backArm = [2, -2]; wideLegs(r); } };
    }
    const t = ease(seg(p, 0.35, 0.55));
    return {
      weapon: lerp(-30, 130, t), arm: lerp(185, 60, t), tilt: 0.14 * t * (1 - seg(p, 0.7, 1)), lunge: 3 * t,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1); r.backArm = [-3, -1]; strikeFace(r); },
    };
  },

  // Three quick throws in a row, alternating high and low.
  barrage(p) {
    const n = 3;
    const sub = (p * n) % 1;
    const i = Math.floor(p * n);
    const fling = ease(seg(sub, 0.3, 0.7));
    return {
      weapon: lerp(-20, 120, fling), arm: lerp(170, 55, fling) + (i % 2) * 15, tilt: 0.08 * fling, lunge: 2 * fling,
      rig: (r) => { r.tx = fling > 0.5 ? 2 : 0; lungeLegs(r, 0.9); r.backArm = [-2, -1 - i]; strikeFace(r); },
    };
  },

  // A full bow draw: pull the string back slowly, then release with a snap of recoil.
  draw(p) {
    // Swing the bow up from across the body to upright, draw and hold the aim, then loose.
    const raise = ease(seg(p, 0, 0.2));
    const pull = ease(seg(p, 0.12, 0.55));
    const snap = seg(p, 0.55, 0.7);
    const shiver = p > 0.42 && p < 0.55 ? Math.sin(p * 220) * 1.5 : 0;
    return {
      weapon: lerp(-55, 0, raise) + shiver, arm: lerp(60, 95, raise), lunge: -2 * snap * (1 - seg(p, 0.7, 1)), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.55), tilt: -0.06 * pull * (1 - snap) - 0.05 * snap,
      rig: (r) => { r.backArm = snap > 0 ? [q(-7 + 3 * seg(p, 0.85, 1)), -3] : [q(2 - 6 * pull), -3]; r.frontLeg = [2.6, 0, 0]; r.backLeg = [-2.6, 0, 0]; r.tx = snap > 0 ? -1 : 0; },
    };
  },

  // A snap shot: swing the bow up, a short sharp pull, loose, and a kick of recoil.
  quickshot(p) {
    const raise = ease(seg(p, 0, 0.22));
    const pull = ease(seg(p, 0.18, 0.46));
    const snap = seg(p, 0.48, 0.58);
    const back = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-40, 0, raise) - 6 * snap * (1 - back), arm: lerp(70, 95, raise) + 4 * snap * (1 - back), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.48),
      lunge: -3 * snap * (1 - back), tilt: -0.04 * pull * (1 - snap) - 0.07 * snap * (1 - back),
      rig: (r) => { r.backArm = snap > 0 ? [q(-7 + 5 * back), -3] : [q(2 - 6 * pull), -3]; r.frontLeg = [2.6, 0, 0]; r.backLeg = [-2.8, 0, -2]; r.tx = snap > 0 && back < 0.5 ? -1 : 0; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },

  // Rapid fire: three quick pull-and-release pulses with a kick each time.
  rapid(p) {
    const k = Math.abs(Math.sin(p * Math.PI * 3));
    return {
      weapon: -4 * k, arm: 95 + 4 * k, lunge: -2 * k, tilt: -0.04 * k, pull: 1 - k, nock: k < 0.6, spares: p < 0.17 ? 2 : p < 0.5 ? 1 : 0,
      rig: (r) => { r.backArm = [q(2 - 5 * k), -3]; r.frontLeg = [2.6, 0, 0]; r.backLeg = [-2.6, 0, 0]; },
    };
  },

  // The sniper: drop into a steady crouch, hold the aim, then a big recoil kick.
  aimshot(p) {
    const settle = ease(seg(p, 0, 0.3));
    const kick = seg(p, 0.65, 0.75);
    const back = seg(p, 0.75, 1);
    return {
      weapon: -18 * kick * (1 - back), arm: 95 + 10 * kick * (1 - back), lunge: -7 * kick * (1 - back * 0.7), tilt: 0.05 * settle * (1 - kick) - 0.16 * kick * (1 - back),
      rig: (r) => { r.squat = kick > 0 ? 1 : 2; r.frontLeg = [3, 0, 2]; r.backLeg = [-3.5, 0, -4]; r.backArm = [q(2 - 5 * settle), -3]; },
    };
  },

  // Fire up into the sky: lean back and loose at a steep angle.
  skyshot(p) {
    const pull = ease(seg(p, 0, 0.5));
    const snap = seg(p, 0.5, 0.65);
    return {
      weapon: -45, arm: 140, tilt: -0.18 * pull, lunge: -2 * snap, lift: 2 * snap, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.5),
      rig: (r) => { r.backArm = snap > 0 ? [-6, -4] : [q(1 - 5 * pull), -5]; wideLegs(r); r.hairLift = -1; },
    };
  },

  // Raise the weapon, then thrust it forward to send the spell.
  castforward(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(20, -15, t), arm: lerp(100, 160, t), tilt: -0.06 * t, rig: (r) => { r.backArm = [-2, -4]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.3, 0.5));
    return {
      weapon: lerp(-15, 75, t), arm: lerp(160, 92, t), lunge: 4 * t * (1 - seg(p, 0.7, 1)), tilt: 0.08 * t,
      rig: (r) => { r.tx = 1; lungeLegs(r, 0.8); r.backArm = [-3, -3]; r.hairLift = -1; r.cape -= 3; strikeFace(r); },
    };
  },

  // Channel: float up with the weapon held high overhead, trembling with power, then bring it down.
  castup(p, dur) {
    const rise = ease(seg(p, 0, 0.3));
    const down = ease(seg(p, 0.82, 1));
    const shake = dur > 0.8 ? Math.sin(p * dur * 70) * 0.6 * (1 - down) * rise : 0;
    return {
      weapon: lerp(10, -2, rise) + 80 * down, arm: lerp(120, 180, rise) - 70 * down, lift: 6 * rise * (1 - down), lunge: shake, tilt: -0.08 * rise * (1 - down),
      rig: (r) => { r.backArm = [-3, -5]; r.hairLift = -1; r.cape -= 3; tuck(r); if (rise < 0.3 || down > 0.7) { r.air = false; r.frontLeg = [2, 0, 0]; r.backLeg = [-2, 0, 0]; } strikeFace(r); },
    };
  },

  // Twirl the staff around, then point it forward.
  castspin(p) {
    const spin = ease(seg(p, 0, 0.65));
    const point = ease(seg(p, 0.6, 0.75));
    return {
      weapon: spin * 720 + 75 * point, arm: lerp(150, 95, point), lift: 3 * bump(p, 0, 0.7), tilt: 0.06 * point,
      rig: (r) => { r.backArm = [-3, -4]; r.hairLift = -1; r.cape -= 2; if (point > 0) { lungeLegs(r, 0.8); strikeFace(r); } },
    };
  },

  // A ground pound: hop, then slam the weapon (or fist) into the earth in a deep crouch.
  slam(p) {
    if (p < 0.32) {
      const t = ease(p / 0.32);
      return { weapon: lerp(20, -130, t), arm: lerp(60, 180, t), lift: 9 * t, tilt: -0.1 * t, rig: (r) => { tuck(r); r.backArm = [-2, -5]; } };
    }
    const t = easeIn(seg(p, 0.32, 0.46));
    const settle = seg(p, 0.6, 1);
    return {
      weapon: lerp(-130, 172, t), arm: lerp(180, 30, t), lift: 9 * (1 - t), tilt: 0.24 * t * (1 - settle),
      rig: (r) => { if (t >= 1) { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [2, 2]; strikeFace(r); },
    };
  },

  // A backflip: a full rotation backward through a high arc.
  flip(p) {
    const t = ease(seg(p, 0.05, 0.85));
    return {
      weapon: 25, arm: 60, lift: 22 * Math.sin(t * Math.PI), tilt: -t * Math.PI * 2,
      rig: (r) => { if (t > 0 && t < 1) tuck(r); r.backArm = [-2, -3]; r.hairLift = -1; },
    };
  },

  // Vanish into a thin streak and pop back.
  vanish(p) {
    const out = ease(seg(p, 0, 0.3));
    const back = ease(seg(p, 0.3, 0.6));
    const k = out * (1 - back);
    return { weapon: 25, arm: 60, turn: 1 - 0.85 * k, stretch: 1 + 0.6 * k, lift: 4 * k, rig: (r) => { r.backArm = [-1, -2]; } };
  },

  // A power-up roar: brace, then throw the arms open and bellow, shaking with energy.
  roar(p) {
    const brace = ease(seg(p, 0, 0.2));
    const open = ease(seg(p, 0.2, 0.4));
    const calm = seg(p, 0.85, 1);
    const shake = Math.sin(p * 90) * 0.8 * open * (1 - calm);
    return {
      weapon: lerp(25, -40, open), arm: lerp(60, 150, open), lift: 2 * open * (1 - calm), lunge: shake, tilt: -0.1 * open * (1 - calm),
      rig: (r) => { r.squat = brace > 0.5 && open < 0.5 ? 2 : 0; wideLegs(r); r.backArm = open > 0.3 ? [-4, -4] : [1, 1]; r.hairLift = -1; strikeFace(r); },
    };
  },

  // The sword finisher: coil back with the blade high behind, then unwind in one huge spinning
  // sweep that carries you forward off your feet, and land in a low crouch.
  cleave(p) {
    if (p < 0.38) {
      const t = ease(p / 0.38);
      return { weapon: lerp(25, -135, t), arm: lerp(60, 175, t), tilt: -0.16 * t, lunge: -3 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.tx = -1; r.backArm = [2, -1]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.38, 0.62));
    const settle = seg(p, 0.7, 1);
    const turn = Math.cos(t * Math.PI * 2);
    return {
      weapon: lerp(-135, 225, t) - 40 * ease(settle), arm: lerp(175, 85, t), lunge: 8 * t * (1 - settle * 0.6), lift: 6 * bump(p, 0.38, 0.7),
      orbit: true, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)), tilt: 0.16 * t * (1 - settle), trail: p < 0.7,
      rig: (r) => { r.tx = 2; if (p < 0.66) tuck(r); else { r.squat = settle < 0.5 ? 2 : 1; wideLegs(r); } r.backArm = [-4, -2]; r.hairLift = -1; r.cape = -4; strikeFace(r); },
    };
  },

  // Two quick cuts in one breath: a downward slash, then the backhand.
  cross(p) {
    return p < 0.5 ? MOVES.slash(snap(p / 0.5)) : MOVES.slash2(snap((p - 0.5) / 0.5));
  },

  // ---------- The Warrior's greatsword (the player's pick: big anime swings off the shoulder) ----------
  // Every swing starts from the blade on her shoulder and wheels round her fist, which stays down
  // at her chest, so the face is never covered; the blade passes behind her head on the way back
  // (drawn behind the body, see hero.js `behind`).

  // Shoulder Drop: the blade rocks further back off the shoulder, then comes over the top in one
  // huge arc and buries its weight low in front, a step into it.
  gsdrop(p) {
    if (p < 0.28) {
      const t = ease(p / 0.28);
      return { weapon: lerp(-58, -92, t), arm: lerp(60, 48, t), tilt: -0.1 * t, lunge: -2 * t, rig: (r) => { r.squat = 1; r.tx = -1; wideLegs(r); r.backArm = [2, -2]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.28, 0.5));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-92, 150, t) - 18 * settle, arm: lerp(48, 56, t) - 16 * settle, lunge: lerp(-2, 7, t) * (1 - 0.6 * settle), tilt: 0.15 * t * (1 - settle), trail: p < 0.62,
      rig: (r) => { r.tx = 2; r.squat = settle < 0.6 ? 1 : 0; lungeLegs(r, 1 - 0.4 * settle); r.backArm = [-3, -1]; strikeFace(r); r.cape = -2; },
    };
  },

  // Rising Return: the blade drags low along the ground, then she rips it up and over in a rising
  // arc with a hop, all the way back onto her shoulder.
  gsrise(p) {
    if (p < 0.25) {
      const t = ease(p / 0.25);
      return { weapon: lerp(132, 188, t), arm: lerp(40, 28, t), tilt: 0.06 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.tx = 1; r.backArm = [1, 1]; } };
    }
    const t = ease(seg(p, 0.25, 0.55));
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: lerp(188, -42, t) - 16 * back, arm: lerp(28, 60, t) - 4 * back, lift: 7 * bump(p, 0.25, 0.85), tilt: lerp(0.06, -0.12, t) * (1 - back), trail: p < 0.66,
      rig: (r) => { r.tx = 2; if (p < 0.75) tuck(r); else { r.squat = 1; wideLegs(r); } r.backArm = [-4, -3]; strikeFace(r); r.hairLift = -1; r.cape = -3; },
    };
  },

  // Whirlwind: a quick cut down off the shoulder, then the whole body spins once with the blade
  // out flat, and the second cut lands as she comes round.
  gsspin(p) {
    if (p < 0.3) {
      const w = ease(seg(p, 0, 0.12));
      const t = ease(seg(p, 0.12, 0.3));
      return {
        weapon: lerp(lerp(-58, -92, w), 128, t), arm: lerp(58, 56, t), lunge: 4 * t, tilt: 0.1 * t, trail: t > 0 && t < 1,
        rig: (r) => { r.tx = t > 0 ? 2 : -1; lungeLegs(r, 0.8); r.backArm = [-2, -1]; if (t > 0) strikeFace(r); },
      };
    }
    const u = ease(seg(p, 0.34, 0.74));
    const settle = ease(seg(p, 0.78, 1));
    const turn = Math.cos(u * Math.PI * 2);
    return {
      weapon: lerp(128, 95, ease(seg(p, 0.3, 0.38))) + 360 * u + 40 * settle, arm: 56 - 14 * settle, lift: 6 * bump(p, 0.34, 0.8), lunge: 4 + 5 * u * (1 - 0.5 * settle),
      orbit: true, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)), tilt: 0.1 * (1 - settle), trail: p > 0.34 && p < 0.8,
      rig: (r) => { r.tx = 2; if (u > 0 && u < 1) tuck(r); else { r.squat = 1; lungeLegs(r, 0.7); } r.backArm = [-4, -2]; r.hairLift = u > 0.1 && u < 0.9 ? -1 : 0; r.cape = -4; strikeFace(r); },
    };
  },

  // Greatsword Cleave (the finisher): a crouch, a big leap with the blade hauled up behind her,
  // and a falling overhead slam that buries it in the ground; she holds the landing.
  gscleave(p) {
    if (p < 0.32) {
      const crouch = ease(seg(p, 0, 0.1));
      const up = ease(seg(p, 0.1, 0.32));
      return {
        weapon: lerp(-58, -100, ease(p / 0.32)), arm: lerp(60, 50, up), lift: 16 * up, tilt: -0.16 * up, lunge: 3 * up,
        rig: (r) => { if (up > 0.15) tuck(r); else { r.squat = 2 * crouch; wideLegs(r); } r.tx = -1; r.backArm = [-1, -5]; r.hairLift = up > 0.2 ? -1 : 0; r.cape = up > 0.2 ? -3 : 0; },
      };
    }
    const t = easeIn(seg(p, 0.32, 0.5));
    const settle = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(-100, 138, t) - 12 * settle, arm: lerp(50, 56, t) - 16 * settle, lift: 16 * (1 - t), lunge: 3 + 8 * t * (1 - 0.4 * settle), tilt: lerp(-0.16, 0.3, t) * (1 - settle), trail: p < 0.6,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.5 ? 2 : 1; wideLegs(r); } r.tx = 2; r.backArm = [-4, 1]; strikeFace(r); r.hairLift = t < 1 ? -1 : 0; r.cape = -4; },
    };
  },

  // ---------- Skills that used to borrow a generic pose or a combo move, given moves of their own ----------

  // Overclock (the Arbalist Engineer): she props the crossbow up on her hip, cranks it hard past
  // its limit (it shudders), a puff of steam, and a hop with a thumbs-up (takes at 0.75).
  aeoverclock(p) {
    const prop = soft(seg(p, 0, 0.14)) * (1 - soft(seg(p, 0.84, 1)));
    const crank = seg(p, 0.14, 0.62);
    const shudder = crank > 0.4 && crank < 1 ? Math.sin(p * 120) * 4 * crank : 0;
    const hop = bump(p, 0.68, 0.86);
    const thumb = soft(seg(p, 0.7, 0.8));
    return {
      weapon: lerp(55, 20, prop) + shudder, arm: lerp(30, 40, prop), lift: 5 * hop, tilt: -0.05 * prop,
      rig: (r) => {
        r.squat = q(1 * prop * (1 - hop));
        r.backArm = crank > 0 && crank < 1 ? [q(3 + 2.2 * Math.cos(crank * Math.PI * 8)), q(1 + 2.2 * Math.sin(crank * Math.PI * 8))] : thumb > 0 ? [q(-3 * thumb), q(-7 * thumb)] : [3, 0];
        wideLegs(r);
        if (hop > 0.2) r.air = true;
        if (crank > 0.2 && crank < 1) r.mouth = 'grin';
        if (thumb > 0.4) [r.eyes, r.mouth] = ['wink', 'grin'];
      },
    };
  },

  // Star Pebble (the Novice): a wind-up with the pebble behind her, and a flick (released at 0.5).
  pebbleflick(p) {
    const wind = soft(seg(p, 0, 0.4));
    const flick = ease(seg(p, 0.42, 0.55));
    const settle = soft(seg(p, 0.7, 1));
    return {
      weapon: 0, arm: lerp(lerp(30, 8, wind), 92, flick) - 40 * settle, lunge: 3 * flick * (1 - settle), tilt: lerp(-0.08 * wind, 0.1, flick) * (1 - settle),
      rig: (r) => { r.tx = flick > 0 ? 1 : -1; lungeLegs(r, 0.6 + 0.4 * flick); r.backArm = [q(2 - 4 * flick), -1]; if (flick > 0.3 && settle < 0.5) r.mouth = 'open'; },
    };
  },

  // Quick Step (the Novice): two quick hops in place and a heel click (it takes at 0.75).
  qstep(p) {
    const h1 = bump(p, 0.08, 0.36);
    const h2 = bump(p, 0.42, 0.8);
    const click = bump(p, 0.52, 0.7);
    return {
      weapon: 25, arm: 30, lift: 5 * h1 + 9 * h2,
      rig: (r) => {
        if (h1 > 0.2 || h2 > 0.2) r.air = true;
        r.frontLeg = click > 0.2 ? [1, -2, -10] : [1.2, -2 * (h1 + h2), 6 * h2];
        r.backLeg = click > 0.2 ? [-1, -2, 10] : [-1.2, -2 * (h1 + h2), -6 * h2];
        r.backArm = [q(-3 * h2), q(-4 * h2)];
        if (h2 > 0.4) [r.eyes, r.mouth] = ['happy', 'grin'];
      },
    };
  },

  // ---------- The Warrior line's finishers, remade for the big weapons (2026-11-03) ----------

  // Titan Breaker: a deep crouch with the blade dropped back low, then a huge leap with two
  // forward somersaults, the greatsword held out so it wheels round her (a wheel of steel); a
  // hang at the top with the blade hauled back over her shoulder as the giant sword forms above,
  // then she falls with it in one overhead slam (lands at 0.62) and holds the landing, buried.
  gstitan(p, dur) {
    if (p < 0.1) {
      const t = ease(p / 0.1);
      const shake = t > 0.7 ? Math.sin(p * dur * 70) * 0.6 : 0;
      return { weapon: lerp(-58, -122, t), arm: lerp(48, 30, t), lunge: -2 * t + shake, tilt: 0.1 * t, rig: (r) => { r.squat = 3; wideLegs(r); r.backArm = [2, 1]; r.eyes = t > 0.6 ? 'half' : undefined; } };
    }
    if (p < 0.42) {
      const u = ease(seg(p, 0.1, 0.42));
      const out = ease(seg(p, 0.1, 0.18));
      return {
        weapon: lerp(-122, 92, out), arm: lerp(30, 50, out), lift: 62 * Math.sin(u * Math.PI / 2), tilt: u * Math.PI * 4, trail: true,
        rig: (r) => { tuck(r); r.backArm = [-2, -3]; r.hairLift = -1; r.cape -= 3; strikeFace(r); },
      };
    }
    if (p < 0.56) {
      const t = ease(seg(p, 0.42, 0.5));
      const hang = Math.sin(seg(p, 0.42, 0.56) * Math.PI) * 2;
      return { weapon: lerp(92, -62, t), arm: lerp(50, 44, t), lift: 62 + hang, tilt: -0.16 * t, rig: (r) => { r.frontLeg = [2, -3, 8]; r.backLeg = [-2.5, -1, -14]; r.air = true; r.backArm = [-3, -4]; r.hairLift = -1; r.cape -= 3; strikeFace(r); } };
    }
    const t = easeIn(seg(p, 0.56, 0.62));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-62, 150, ease(seg(p, 0.56, 0.61))) - 10 * settle, arm: lerp(44, 56, t) - 18 * settle, lift: 64 * (1 - t), lunge: 6 * t, tilt: lerp(-0.16, 0.3, t) * (1 - settle), trail: p < 0.68,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [-4, 1]; strikeFace(r); r.cape = -4; },
    };
  },

  // Grand Verdict: she drives the blade point-down into the ground before her and kneels behind it
  // with her head bowed while a sun of light rises over her; then she rises on the light, pulls the
  // blade up round behind her, and swings it in one great rising arc as the sword of light falls
  // (lands at 0.66), and holds it out toward them.
  plverdict(p, dur) {
    if (p < 0.08) {
      const t = ease(p / 0.08);
      return { weapon: lerp(-58, 160, t), arm: lerp(48, 66, t), tilt: 0.06 * t, rig: (r) => { r.squat = 2 * t; wideLegs(r); r.backArm = [2, 0]; } };
    }
    if (p < 0.4) {
      const breath = Math.sin(p * dur * 6) * 0.3;
      // (The blade planted point-down out in front, her hand high on the pommel, so it stays in sight.)
      return { weapon: 160, arm: 66, tilt: 0.08, lunge: breath, rig: (r) => { r.squat = 3; r.frontLeg = [2.5, 0, 6]; r.backLeg = [-2, 1, -16]; r.backArm = [2, 1]; r.eyes = 'blink'; } };
    }
    if (p < 0.55) {
      const t = ease(seg(p, 0.4, 0.55));
      return { weapon: lerp(160, 264, t), arm: lerp(66, 40, t), lift: 10 * t, tilt: lerp(0.08, -0.08, t), rig: (r) => { r.frontLeg = [1.5, -1, 4]; r.backLeg = [-2, -1, -6]; r.air = t > 0.3; r.backArm = [-2, -4]; r.hairLift = -1; r.cape = -3; } };
    }
    const t = ease(seg(p, 0.55, 0.66));
    const settle = ease(seg(p, 0.78, 1));
    return {
      weapon: lerp(-96, -282, t) + 24 * settle, arm: lerp(40, 56, t) - 8 * settle, lift: 10 * (1 - t), lunge: 6 * t * (1 - 0.5 * settle), tilt: lerp(-0.08, -0.12, t) * (1 - settle), trail: p < 0.72,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.1 - 0.3 * settle); r.backArm = [-5, -4]; strikeFace(r); r.hairLift = -1; r.cape = -4; },
    };
  },

  // Crimson Eclipse: he hauls the axe back and hurls it spinning round him in a great circle that
  // drags them in, bracing and turning to follow it; catches it, leaps up against the blood moon
  // with it raised behind him while a giant axe of fire forms over him, and smashes straight down
  // (lands at 0.68).
  bkeclipse(p, dur) {
    if (p < 0.06) {
      const t = ease(p / 0.06);
      return { weapon: lerp(-52, -110, t), arm: lerp(46, 34, t), tilt: -0.15 * t, rig: (r) => { r.squat = 1; wideLegs(r); r.tx = -1; r.backArm = [3, -1]; r.hairLift = -1; } };
    }
    if (p < 0.42) {
      const u = seg(p, 0.06, 0.42);
      const turn = Math.cos(u * Math.PI * 2);
      const shake = Math.sin(p * dur * 60) * 0.4;
      return {
        weapon: 90, arm: lerp(60, 50, u), thrown: 1, lunge: shake, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)), tilt: 0.05,
        rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [-5, -3]; strikeFace(r); r.hairLift = -1; r.cape = -3; },
      };
    }
    if (p < 0.62) {
      const catchT = ease(seg(p, 0.42, 0.47));
      const up = ease(seg(p, 0.47, 0.56));
      const shake = Math.sin(p * dur * 70) * 0.6 * up;
      return {
        weapon: lerp(90, 250, catchT) + 40 * up, arm: lerp(50, 40, catchT), lift: 36 * up, lunge: shake, tilt: -0.18 * up,
        rig: (r) => { if (up > 0.1) tuck(r); else { r.squat = 2; wideLegs(r); } r.backArm = [-1, -5]; r.hairLift = -1; r.cape = -3; strikeFace(r); },
      };
    }
    const t = easeIn(seg(p, 0.62, 0.68));
    const settle = ease(seg(p, 0.74, 1));
    return {
      weapon: lerp(290, 520, ease(seg(p, 0.62, 0.67))) - 10 * settle, arm: lerp(40, 40, t) - 8 * settle, lift: 36 * (1 - t), lunge: 4 * t, tilt: lerp(-0.18, 0.3, t) * (1 - settle), trail: p < 0.72,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [-4, 1]; strikeFace(r); r.cape = -4; },
    };
  },

  // ---------- The warrior paths' own versions of the Warrior's skills (data/path-skills.js) ----------

  // Heaven's Seal (the Paladin's Titan Breaker, 1.38 s; blows at 0.6 and 0.8). No leap and no
  // somersaults: a knight's rite. She raises the blade upright in a salute (drawn behind her head)
  // and rises slowly onto her toes, eyes closed, while the crest of light gathers over her; draws it
  // back over her shoulder, then brings it down in one planted two-handed chop with a stamp (0.6);
  // sweeps it back up to the heavens as the pillars of light answer (0.8), and lowers it to hold it
  // out before her, low and level, like a knight at the end of an oath.
  plseal(p, dur) {
    const raise = soft(seg(p, 0, 0.14));
    const rise = soft(seg(p, 0.14, 0.42));
    const back = soft(seg(p, 0.42, 0.52));
    const chop = easeIn(seg(p, 0.52, 0.6));
    const turnDown = ease(seg(p, 0.7, 0.8));
    const drive = soft(seg(p, 0.84, 0.96));
    const settle = soft(seg(p, 0.86, 1));
    const breath = Math.sin(p * dur * 6) * 0.4 * rise * (1 - back);
    let weapon = lerp(-58, 6, raise) - 46 * back;
    if (chop > 0) weapon = lerp(-40, 150, chop);
    if (turnDown > 0) weapon = lerp(150, 372, turnDown) - 268 * drive;
    weapon -= 6 * settle;
    const lifted = 3 * rise * (1 - back) + 4 * turnDown * (1 - drive);
    return {
      weapon, arm: lerp(48, 52, raise) - 6 * back + 4 * chop - 4 * turnDown - 4 * drive,
      lift: lifted + breath, lunge: 6 * chop * (1 - 0.6 * turnDown) - 1.5 * back, tilt: -0.08 * back + 0.2 * chop * (1 - turnDown) - 0.08 * turnDown * (1 - drive),
      trail: p > 0.5 && p < 0.82,
      rig: (r) => {
        if (chop <= 0) {
          // Heels together, up on her toes for the rite.
          r.frontLeg = [q(lerp(0.8, 1.2, rise)), q(-0.8 * rise), 4];
          r.backLeg = [q(lerp(-0.8, -1.4, rise)), q(-0.8 * rise), -4];
          r.backArm = [q(-1 - 2 * back), q(-1 - 2 * rise)];
          r.eyes = rise > 0.2 && back < 0.5 ? 'blink' : undefined;
        } else {
          if (turnDown > 0.5) { r.squat = q(1 - drive); wideLegs(r); } else lungeLegs(r, 1.2);
          r.backArm = turnDown > 0.5 && drive < 0.5 ? [-4, -5] : drive >= 0.5 ? [2, 1] : [-3, -2];
          r.tx = 1;
          if (settle < 0.5) strikeFace(r);
        }
        r.cape = -3 * Math.max(back, chop * (1 - settle));
        r.hairLift = rise > 0.3 && chop < 1 ? -1 : 0;
      },
    };
  },

  // Halo Rotor (the Paladin's Whirlwind, 0.9 s; four pulling blows, the fling at 0.75): the blade
  // turned flat over her head like the rotor of a great bell-tower clock, sweeping round over her
  // twice as she marches round under it; then she brings it down and drives it forward in a
  // shield-shove (0.75), and holds it out level.
  plrotor(p) {
    const up = soft(seg(p, 0, 0.1));
    const u = seg(p, 0.08, 0.68);
    const spinning = p > 0.08 && p < 0.68;
    const ph = u * Math.PI * 4;
    const down = easeIn(seg(p, 0.68, 0.75));
    const settle = soft(seg(p, 0.82, 1));
    // Over the top, front to back and round again (a half turn each sweep).
    const over = 78 * Math.sin(ph);
    const weapon = spinning ? over : down > 0 ? lerp(0, 112, down) - 8 * settle : lerp(-58, 0, up);
    return {
      weapon, arm: lerp(48, 56, up) - 4 * down, orbit: spinning, turn: spinning ? Math.sign(Math.cos(ph / 2) || 1) * Math.max(0.4, Math.abs(Math.cos(ph / 2))) : 1,
      lift: 2 * bump(p, 0.08, 0.68), lunge: 7 * down * (1 - 0.5 * settle), tilt: 0.16 * down * (1 - settle) - 0.04 * up * (1 - down),
      trail: spinning || (p > 0.66 && p < 0.78),
      rig: (r) => {
        if (spinning) {
          const s = Math.sin(ph);
          r.frontLeg = [q(1.6 + 1.6 * s), s > 0 ? q(-1.4 * s) : 0, Math.round(12 * s / 2) * 2];
          r.backLeg = [q(-1.6 + 1.6 * s), s < 0 ? q(1.4 * s) : 0, Math.round(-12 * s / 2) * 2];
        } else if (down > 0) lungeLegs(r, 1.2 - 0.3 * settle);
        else wideLegs(r);
        r.backArm = down > 0 ? [3, -2] : [-2, -2];
        r.cape = spinning ? -4 : -2;
        r.hairLift = spinning ? -1 : 0;
        if (spinning || (down > 0.3 && settle < 0.5)) strikeFace(r);
      },
    };
  },

  // Skyfall Rend (the Berserker's Titan Breaker, 1.38 s; blows at 0.62 and 0.8). A beast's pounce,
  // not a knight's leap: he drops into a crouch with the axe trailing back and the free hand clawed
  // at the ground, shaking and howling as fire flares under him; springs high and long with the axe
  // flung back over his head, body arched and limbs spread like a leaping cat; tips over and falls
  // on them head-first in a meteor of fire, smashing the axe down (0.62) and crouching over it,
  // shaking; then wrenches it up out of the ground (0.8) and roars with it held out to the side.
  bkpounce(p, dur) {
    const crouch = soft(seg(p, 0, 0.14));
    const howl = p < 0.2 ? Math.sin(p * dur * 70) * 0.7 * crouch : 0;
    const leap = seg(p, 0.18, 0.62);
    const air = p > 0.18 && p < 0.62;
    const arch = soft(seg(p, 0.18, 0.3)) * (1 - soft(seg(p, 0.4, 0.52)));
    const dive = soft(seg(p, 0.42, 0.56)) * (1 - ease(seg(p, 0.6, 0.64)));
    const smash = easeIn(seg(p, 0.54, 0.62));
    const buried = p >= 0.62 && p < 0.75;
    const shake = buried ? Math.sin(p * dur * 80) * 0.6 * (1 - seg(p, 0.62, 0.75)) : 0;
    const rip = ease(seg(p, 0.75, 0.8));
    const roar = soft(seg(p, 0.82, 0.9));
    const settle = soft(seg(p, 0.9, 1));
    let weapon = lerp(-58, -128, crouch);
    if (air) weapon = lerp(-128, -196, soft(seg(p, 0.18, 0.34))) + 356 * smash;
    if (p >= 0.62) weapon = lerp(160, 40, rip) + 64 * roar - 8 * settle;
    const lift = air ? 66 * Math.sin(Math.PI * leap) ** 0.8 : 0;
    return {
      weapon, arm: air ? lerp(30, 56, smash) : p >= 0.62 ? lerp(40, 56, rip) - 10 * roar : lerp(48, 28, crouch),
      lift: lift + (buried ? 0 : 3 * rip * (1 - roar)), lunge: howl + shake + (air ? 4 * dive : 0) + 4 * rip * (1 - roar),
      tilt: 0.34 * crouch * (p < 0.2 ? 1 : 0) - 0.3 * arch + 0.55 * dive + (p >= 0.62 ? 0.3 * (1 - rip) - 0.18 * rip * (1 - roar) : 0) * (1 - settle),
      trail: p > 0.5 && p < 0.82,
      rig: (r) => {
        if (p < 0.18) {
          r.squat = q(3 * crouch);
          r.frontLeg = [q(3.4 * crouch + 0.8), 0, Math.round(10 * crouch / 2) * 2];
          r.backLeg = [q(-4 * crouch - 0.8), q(1 * crouch), Math.round(-40 * crouch / 2) * 2];
          r.backArm = [q(2 + 3 * crouch), q(2 * crouch)];
          if (crouch > 0.4) strikeFace(r);
          r.hairLift = crouch > 0.5 ? 1 : 0;
        } else if (air) {
          r.air = true;
          // Limbs flung out in the leap, gathered in as he dives.
          legsTo(r, 1, arch > 0.3 ? [3.4, -4.6, 34] : [2.6, -5, 10], arch > 0.3 ? [-4, -5.6, -76] : [-1.6, -2.6, -10]);
          r.backArm = arch > 0.3 ? [-6, -6] : [3, -2];
          r.hairLift = -1;
          r.cape = -6;
          strikeFace(r);
        } else {
          if (rip < 0.5) { r.squat = 3; wideLegs(r); } else { r.squat = q(1 - settle); r.frontLeg = [3.4, 0, 6]; r.backLeg = [-3.6, 0, -12]; }
          r.backArm = roar > 0.2 ? [q(-6 * roar), q(-5 * roar)] : [3, 2];
          r.hairLift = rip > 0.3 ? -1 : 1;
          if (settle < 0.7) strikeFace(r);
        }
      },
    };
  },

  // Maelstrom (the Berserker's Whirlwind, 0.9 s; four pulling blows, the heave at 0.75): the axe
  // swung out at arm's length and its weight drags him round, three turns faster and faster, leaning
  // back against it with his feet skidding and stumbling along; he wrenches it up over his shoulder
  // and heaves it down in front of him (0.75), and stands bent over it, panting.
  bkmaelstrom(p) {
    const wind = soft(seg(p, 0, 0.08));
    const u = seg(p, 0.08, 0.66);
    const spinning = p > 0.08 && p < 0.66;
    // (Slow to get going, then faster and faster: three whole turns.)
    const turns = 3 * u ** 1.5;
    const a = turns * Math.PI * 2;
    const lift = ease(seg(p, 0.66, 0.71));
    const heave = easeIn(seg(p, 0.71, 0.75));
    const settle = soft(seg(p, 0.82, 1));
    const pant = p > 0.82 ? Math.sin(p * 40) * 0.4 * (1 - settle) : 0;
    let weapon = lerp(-58, 100, wind);
    if (spinning) weapon = 100 + turns * 360;
    if (p >= 0.66) weapon = 1180 - 130 * lift + 190 * heave - 6 * settle;
    const wob = spinning ? Math.sin(a * 1.5) : 0;
    return {
      weapon, arm: spinning ? 58 : lerp(56, 46, heave) - 6 * settle, orbit: spinning,
      turn: spinning ? Math.sign(Math.cos(a) || 1) * Math.max(0.35, Math.abs(Math.cos(a))) : 1,
      lift: (spinning ? 2 * Math.abs(wob) : 0) + 4 * lift * (1 - heave), lunge: 2 * wob + 6 * heave * (1 - 0.5 * settle) + pant, tilt: (spinning ? -0.14 : 0) - 0.16 * lift * (1 - heave) + 0.32 * heave * (1 - settle),
      trail: spinning || (p > 0.66 && p < 0.8),
      rig: (r) => {
        if (spinning) {
          r.frontLeg = [q(3 + wob), wob > 0 ? q(-1.6 * wob) : 0, Math.round(16 * wob / 2) * 2];
          r.backLeg = [q(-3 + wob), wob < 0 ? q(1.6 * wob) : 0, -14];
          r.backArm = [-5, -4];
          r.hairLift = -1;
          r.cape = -6;
          strikeFace(r);
        } else if (p >= 0.66) {
          r.squat = heave > 0.5 ? q(3 - 2 * settle) : 0;
          if (heave > 0) wideLegs(r); else lungeLegs(r, 0.8);
          r.backArm = heave > 0.5 ? [3, 2] : [-3, -4];
          if (settle < 0.6) strikeFace(r);
          else r.mouth = 'open';
        } else { r.squat = q(wind); wideLegs(r); r.backArm = [2, 0]; }
      },
    };
  },

  // ---------- The Paladin's own greatsword forms (a holy knight: measured, upright, solemn) ----------
  // Replacing the Warrior's swings she used to borrow. Steadier than the Warrior: planted feet,
  // held salutes, blows that come down like verdicts; every one keeps the fist at the chest.

  // Oath Cut: the blade swung off the shoulder out level in a knight's salute, held a beat, then
  // brought down in one firm, upright chop.
  ploath(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(-58, 84, t), arm: lerp(48, 56, t), tilt: -0.04 * t, rig: (r) => { r.frontLeg = [1.5, 0, 0]; r.backLeg = [-2, 0, -2]; r.backArm = [q(-1 * t), q(-2 * t)]; } };
    }
    const t = easeIn(seg(p, 0.36, 0.48));
    const settle = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(84, 152, t) - 14 * settle, arm: lerp(56, 40, t), lunge: 4 * t * (1 - 0.5 * settle), tilt: 0.12 * t * (1 - settle), trail: p > 0.34 && p < 0.6,
      rig: (r) => { r.tx = 1; r.squat = t >= 1 && settle < 0.5 ? 1 : 0; lungeLegs(r, 0.8); r.backArm = [-2, -1]; if (t > 0) strikeFace(r); },
    };
  },

  // Dawn Step: a long gliding step with the blade trailing low behind her, then it sweeps under
  // and up in front as she arrives, like the sun coming up.
  pldawn(p) {
    if (p < 0.34) {
      const t = ease(p / 0.34);
      return { weapon: lerp(-58, -128, t), arm: lerp(48, 30, t), lunge: 4 * t, tilt: 0.08 * t, rig: (r) => { r.tx = 1; lungeLegs(r, 1.2); r.backArm = [-2, -2]; r.cape = -3; } };
    }
    const t = ease(seg(p, 0.34, 0.52));
    const settle = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(-128, -276, t) + 36 * settle, arm: lerp(30, 54, t) - 6 * settle, lunge: 4 + 4 * t * (1 - 0.6 * settle), lift: 2 * bump(p, 0.34, 0.7), tilt: lerp(0.08, -0.06, t) * (1 - settle), trail: p < 0.62,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1 - 0.3 * settle); r.backArm = [-3, -3]; strikeFace(r); r.cape = -3; },
    };
  },

  // Halo Turn: she turns her back with the blade held low behind her, and as she turns round
  // again it comes round with her, level, in a wide ring.
  plhalo(p) {
    const u = ease(seg(p, 0.05, 0.62));
    const settle = ease(seg(p, 0.72, 1));
    const turn = Math.cos(u * Math.PI * 2);
    return {
      weapon: lerp(-58, 92, ease(seg(p, 0, 0.12))) + 360 * u + 50 * settle, arm: lerp(48, 52, u) - 8 * settle, lift: 3 * bump(p, 0.1, 0.65), lunge: 3 * u,
      orbit: true, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)), tilt: 0.06 * (1 - settle), trail: p > 0.2 && p < 0.66,
      rig: (r) => { r.tx = 1; r.frontLeg = [1.5, 0, 2]; r.backLeg = [-2.5, 0, -4]; r.backArm = [-3, -1]; r.cape = -3; if (u > 0.5) strikeFace(r); },
    };
  },

  // Lance of Dawn: the blade on her shoulder lowers to point straight ahead like a couched
  // lance as she drives forward behind it, and holds there, steady.
  pllance(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(-58, 30, t), arm: lerp(48, 34, t), lunge: -3 * t, tilt: -0.06 * t, rig: (r) => { r.squat = 1; wideLegs(r); r.tx = -1; r.backArm = [2, -1]; } };
    }
    const t = ease(seg(p, 0.3, 0.44));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(30, 90, t) + 30 * settle, arm: lerp(34, 50, t) - 8 * settle, lunge: lerp(-3, 12, t) * (1 - 0.6 * settle), tilt: 0.14 * t * (1 - settle), trail: p < 0.5,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.4 - 0.5 * settle); r.backArm = [-4, -1]; strikeFace(r); r.cape = -4; },
    };
  },

  // Crusader's Fall (a finisher): she leaps straight up with the blade turned point-down beneath
  // her, and drops onto them, planting it in the ground like a banner; she lands kneeling by it.
  plfall(p) {
    if (p < 0.4) {
      const crouch = ease(seg(p, 0, 0.1));
      const up = ease(seg(p, 0.1, 0.4));
      return {
        weapon: lerp(-58, -182, ease(seg(p, 0.05, 0.36))), arm: lerp(48, 20, up), lift: 18 * up,
        rig: (r) => { if (up > 0.15) tuck(r); else { r.squat = 2 * crouch; wideLegs(r); } r.backArm = [2, -1]; r.hairLift = up > 0.2 ? -1 : 0; r.cape = up > 0.2 ? -3 : 0; },
      };
    }
    const t = easeIn(seg(p, 0.4, 0.55));
    const settle = ease(seg(p, 0.75, 1));
    return {
      weapon: -182, arm: lerp(20, 12, t), lift: 18 * (1 - t), lunge: 2 * t, tilt: 0.06 * t * (1 - settle),
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 2; r.frontLeg = [2.5, 0, 6]; r.backLeg = [-2, 1, -16]; } r.backArm = [2, 1]; strikeFace(r); r.cape = t < 1 ? -3 : 0; },
    };
  },

  // Sunrise Judgment (a finisher): she kneels with the blade on her shoulder and bows her head,
  // a long held beat; then rises and swings it from behind her, down under and up in front in one
  // huge rising arc, and holds it out high toward them.
  plsunrise(p) {
    if (p < 0.42) {
      const t = ease(p / 0.2);
      const hold = Math.sin(p * 50) * 0.3 * ease(seg(p, 0.2, 0.42));
      return { weapon: lerp(-58, -96, t), arm: lerp(48, 40, t), tilt: 0.1 * t, lunge: hold, rig: (r) => { r.squat = 3; r.frontLeg = [2.5, 0, 6]; r.backLeg = [-2, 1, -16]; r.backArm = [2, 0]; r.eyes = 'blink'; } };
    }
    const t = ease(seg(p, 0.42, 0.62));
    const settle = ease(seg(p, 0.8, 1));
    return {
      weapon: lerp(-96, -282, t) + 30 * settle, arm: lerp(40, 58, t) - 10 * settle, lift: 5 * bump(p, 0.42, 0.85), lunge: 6 * t * (1 - 0.5 * settle), tilt: lerp(0.1, -0.12, t) * (1 - settle), trail: p < 0.7,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.1 - 0.3 * settle); r.backArm = [-5, -4]; strikeFace(r); r.hairLift = -1; r.cape = -4; },
    };
  },

  // In the air: an oath chop, the blade out level, then down (both air steps).
  plaircut(p) {
    const out = ease(seg(p, 0, 0.3));
    const t = easeIn(seg(p, 0.32, 0.46));
    const settle = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(-58, 86, out) + 66 * t - 20 * settle, arm: lerp(46, 54, out) - 10 * t, tilt: 0.1 * t * (1 - settle), trail: p > 0.3 && p < 0.6,
      rig: (r) => { tuck(r); r.backArm = [-2, -2]; r.cape = -3; if (t > 0) strikeFace(r); },
    };
  },

  // The air dive: the blade turned point-down beneath her, dropping on them like a banner planted.
  pldive(p) {
    const turn = ease(seg(p, 0, 0.3));
    return {
      weapon: lerp(-58, -182, turn), arm: lerp(46, 18, turn), tilt: 0.05 * turn,
      rig: (r) => { tuck(r); r.backArm = [2, -1]; r.hairLift = -1; r.cape = -3; if (turn > 0.8) strikeFace(r); },
    };
  },

  // ---------- The Berserker's own command moves ----------
  // In the air: he pitches forward into a wild overhead hack, the axe from behind his back.
  bkairchop(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(-52, -100, t), arm: lerp(46, 40, t), tilt: -0.2 * t, rig: (r) => { tuck(r); r.backArm = [2, -4]; r.hairLift = -1; } };
    }
    const t = easeIn(seg(p, 0.3, 0.46));
    const settle = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(-100, 165, t) - 25 * settle, arm: lerp(40, 38, t) - 6 * settle, tilt: lerp(-0.2, 0.3, t) * (1 - 0.7 * settle), trail: p < 0.6,
      rig: (r) => { tuck(r); r.backArm = [-4, 1]; strikeFace(r); r.hairLift = -1; r.cape = -4; },
    };
  },

  // The air dive: the axe hauled up behind him, then he drops with it driven down in front.
  bkdive(p) {
    const cock = ease(seg(p, 0, 0.22));
    const drive = ease(seg(p, 0.22, 0.38));
    return {
      weapon: lerp(lerp(-52, -100, cock), 160, drive), arm: lerp(lerp(46, 40, cock), 28, drive), tilt: lerp(-0.18 * cock, 0.2, drive), trail: drive > 0 && drive < 1,
      rig: (r) => { tuck(r); r.backArm = [-3, -3]; r.hairLift = -1; if (drive > 0) strikeFace(r); r.cape = -4; },
    };
  },

  // Gore (running): he drops his head and plows in shoulder-first with the axe held out wide,
  // then hacks it across in front of him as he hits.
  bkgore(p) {
    if (p < 0.4) {
      const t = ease(p / 0.4);
      return { weapon: lerp(-52, -78, t), arm: lerp(46, 34, t), tilt: 0.3 * t, lunge: 3 * t, rig: (r) => { r.squat = 2; r.tx = 2; lungeLegs(r, 1.5); r.backArm = [3, 1]; r.cape = -4; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.4, 0.56));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-78, 128, t) - 15 * settle, arm: lerp(34, 52, t) - 10 * settle, tilt: 0.3 * (1 - settle), lunge: 3 + 7 * t * (1 - 0.6 * settle), trail: p < 0.66,
      rig: (r) => { r.squat = settle < 0.5 ? 2 : 1; r.tx = 2; lungeLegs(r, 1.5 - 0.5 * settle); r.backArm = [-4, 0]; strikeFace(r); r.cape = -4; },
    };
  },

  // ---------- The Warrior's alternate combo swings (see PATH_VARIANTS in world/melee.js) ----------
  // Each stands in for a step of his combo now and then, so the string keeps changing. They're
  // played big, for power (the player asked for exaggerated, fun swings): deep crouches, long
  // lunges, hard leans and high hops. Never by squashing or stretching the figure, though: the
  // power is in the pose, the reach and the timing (quick ones snap, heavy ones hold the wind-up).

  // A wide sweep at hip height: coil hard with the shoulders turned away and the blade trailing flat
  // behind, then unwind and rip it level through everything in front. Lands at about 0.45.
  sweep(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(25, -105, t), arm: lerp(60, 72, t), tilt: -0.14 * t, lunge: -5 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.tx = -1; r.backArm = [3, 0]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.3, 0.52));
    const settle = ease(seg(p, 0.64, 1));
    return {
      weapon: lerp(-105, 118, t) - 55 * settle, arm: lerp(72, 100, t) - 25 * settle, lunge: lerp(-5, 10, t) * (1 - settle * 0.6), tilt: 0.18 * t * (1 - settle), trail: p < 0.66,
      rig: (r) => { r.tx = 2; r.squat = settle < 0.5 ? 2 : 1; lungeLegs(r, 1.3); r.backArm = [-5, 0]; r.cape = -4; r.hairLift = -1; strikeFace(r); },
    };
  },

  // A spinning backhand: whip all the way round on the front foot with the blade low, hopping off
  // the ground, and come out of the turn cutting up and over. Lands at about 0.55.
  spinback(p) {
    if (p < 0.45) {
      const a = ease(p / 0.45);
      const turn = Math.cos(a * Math.PI * 2);
      return {
        weapon: lerp(40, 150, a), arm: lerp(60, 30, a), orbit: true, turn: Math.sign(turn || 1), lift: 6 * bump(p, 0.05, 0.45), tilt: -0.08 * a,
        rig: (r) => { r.squat = 1; wideLegs(r); r.backArm = [-4, -3]; r.hairLift = -1; r.cape = -5; },
      };
    }
    const t = ease(seg(p, 0.45, 0.64));
    const back = ease(seg(p, 0.74, 1));
    return {
      weapon: lerp(150, -75, t) + 100 * back, arm: lerp(30, 176, t) - 114 * back, lunge: 7 * t * (1 - back), lift: 3 * bump(p, 0.45, 0.8), tilt: -0.16 * t * (1 - back), trail: p < 0.74,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.1); r.backArm = [-4, -3]; r.hairLift = -1; strikeFace(r); },
    };
  },

  // A shoulder check: drop the blade low at the side, sink deep, then slam the shoulder into them
  // in a short, brutal shove, and rock back. Lands at about 0.42.
  shove(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(25, 135, t), arm: lerp(60, 28, t), lunge: -6 * t, tilt: -0.16 * t, rig: (r) => { r.squat = t > 0.4 ? 3 : 1; wideLegs(r); r.tx = -1; r.backArm = [3, -1]; } };
    }
    const t = ease(seg(p, 0.3, 0.4));
    const back = ease(seg(p, 0.56, 1));
    return {
      weapon: 135 - 20 * back, arm: 28 + 10 * back, lunge: lerp(-6, 16, t) * (1 - back * 0.85), tilt: lerp(-0.16, 0.42, t) * (1 - back),
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.5); r.backArm = [3, -3]; r.cape = -5; r.hairLift = -1; strikeFace(r); },
    };
  },

  // A pommel bash: the blade flipped back over the shoulder so the hilt leads, a short hop-step in
  // and the pommel driven into their face, then the blade swung back down to guard. Lands at 0.4.
  pommel(p) {
    if (p < 0.28) {
      const t = ease(p / 0.28);
      return { weapon: lerp(25, -60, t), arm: lerp(60, 48, t), lunge: -2 * t, tilt: -0.08 * t, rig: (r) => { r.tx = -1; r.squat = 1; r.backArm = [1, -2]; } };
    }
    const t = ease(seg(p, 0.28, 0.4));
    const back = ease(seg(p, 0.55, 1));
    return {
      weapon: -60 + 85 * back, arm: lerp(48, 104, t) - 44 * back, lunge: lerp(-2, 9, t) * (1 - back * 0.8), lift: 2 * bump(p, 0.26, 0.44), tilt: lerp(-0.08, 0.26, t) * (1 - back),
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.2); r.backArm = [-3, -2]; r.hairLift = t > 0.5 && back < 0.5 ? -1 : 0; strikeFace(r); },
    };
  },

  // Guard spin (the Paladin): a low turn right round with the blade held out flat, light trailing
  // the edge, coming out of it into her guard, blade upright before her. Lands at 0.5.
  guardspin(p) {
    const a = ease(seg(p, 0.12, 0.62));
    const turn = Math.cos(a * Math.PI * 2);
    const set = ease(seg(p, 0.66, 1));
    return {
      weapon: lerp(95 + a * 360, 370, set), arm: lerp(lerp(60, 98, ease(seg(p, 0, 0.12))), 70, set), orbit: true, turn: Math.sign(turn || 1) * Math.max(0.35, Math.abs(turn)),
      lift: 3 * bump(p, 0.12, 0.62), tilt: -0.06 * bump(p, 0.1, 0.62), trail: p > 0.12 && p < 0.66,
      rig: (r) => { r.squat = p < 0.12 || set > 0.3 ? 1 : 2; wideLegs(r); r.backArm = set > 0.3 ? [2, -4] : [-3, -3]; r.cape -= 3 * bump(p, 0.12, 0.62); r.hairLift = p > 0.15 && p < 0.6 ? -1 : 0; if (p > 0.3 && p < 0.66) strikeFace(r); },
    };
  },

  // A kneeling stab (the Paladin): she drops onto one knee, drawing the blade back level at her
  // hip, then drives it straight out low through them as holy light flashes off the point; she
  // holds the kneel a beat and rises. Lands at 0.45.
  kneelstab(p) {
    const kneel = ease(seg(p, 0, 0.26)) * (1 - ease(seg(p, 0.76, 1)));
    const t = ease(seg(p, 0.3, 0.45));
    const back = ease(seg(p, 0.62, 1));
    return {
      weapon: 90, arm: lerp(lerp(60, 40, kneel), 92, t) - 30 * back, lunge: lerp(-2 * kneel, 10, t) * (1 - back * 0.8), tilt: lerp(-0.04, 0.16, t) * (1 - back),
      rig: (r) => {
        r.squat = kneel > 0.4 ? 3 : kneel > 0.1 ? 1 : 0;
        // One knee to the ground: the back leg folded under her, the front planted.
        r.frontLeg = [q(lerp(0.8, 3.4, kneel)), 0, Math.round(lerp(0, 8, kneel))];
        r.backLeg = [q(lerp(-0.8, -3.8, kneel)), q(lerp(0, 1.2, kneel)), Math.round(lerp(0, -60, kneel))];
        r.tx = t > 0 ? 2 : -1; r.backArm = [-3, -2]; if (t > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },

  // Triple fan (the Archer): three arrows nocked at once, the bow canted flat, a full draw and all
  // three loosed in a spread. Shot at 0.55.
  tripleshot(p) {
    const raise = ease(seg(p, 0, 0.2));
    const pull = ease(seg(p, 0.2, 0.5));
    const snap = seg(p, 0.55, 0.64);
    const back = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-40, 38, raise) - 10 * snap * (1 - back) - 38 * back, arm: lerp(70, 92, raise) + 5 * snap * (1 - back), pull: snap > 0 ? 0 : pull, nock: snap === 0, spares: snap > 0 ? 0 : raise > 0.5 ? 2 : 0, twang: twang(p, 0.55),
      lunge: -4 * snap * (1 - back), tilt: -0.05 * pull * (1 - snap) - 0.1 * snap * (1 - back),
      rig: (r) => { r.backArm = snap > 0 ? [q(-7 + 5 * back), -3] : [q(2 - 6 * pull), -3]; wideLegs(r); r.squat = pull > 0.4 && snap < 1 ? 1 : 0; if (snap > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // A lob shot (the Archer): leaning back, the bow raised high, an arrow arced up over them to
  // drop on their head. Shot at 0.5.
  lobshot(p) {
    const raise = ease(seg(p, 0, 0.24));
    const pull = ease(seg(p, 0.2, 0.46));
    const snap = seg(p, 0.5, 0.6);
    const back = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(-40, -40, raise) - 6 * snap * (1 - back), arm: lerp(70, 132, raise) - 50 * back, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.5),
      lunge: -2 * snap * (1 - back), tilt: -0.14 * raise * (1 - back),
      rig: (r) => { r.backArm = snap > 0 ? [q(-6 + 4 * back), -5] : [q(1 - 5 * pull), -5]; r.frontLeg = [2.4, 0, 2]; r.backLeg = [-3, 0, -6]; r.hairLift = raise > 0.5 && back < 0.5 ? -1 : 0; if (snap > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // ---------- Bare hands ----------

  // A haymaker: the fist wound way back, the body twisting round behind it, a huge looping punch
  // with a lunge, and a wobble on the follow-through. Lands at 0.5.
  haymaker(p) {
    if (p < 0.36) {
      const t = ease(p / 0.36);
      return { weapon: 0, arm: lerp(60, 150, t), lunge: -4 * t, tilt: -0.18 * t, rig: (r) => { r.tx = -1; r.squat = 1; wideLegs(r); r.backArm = [2, -3]; r.mouth = 'grit'; } };
    }
    const t = ease(seg(p, 0.36, 0.5));
    const wob = Math.sin(seg(p, 0.6, 1) * Math.PI * 3) * (1 - seg(p, 0.6, 1));
    const back = ease(seg(p, 0.7, 1));
    return {
      weapon: 0, arm: lerp(150, 92, t) - 30 * back, lunge: lerp(-4, 12, t) * (1 - back * 0.7), tilt: lerp(-0.18, 0.34, t) * (1 - back) + 0.08 * wob, trail: p < 0.6,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.4); r.backArm = [-4, -1]; r.hairLift = -1; strikeFace(r); },
    };
  },
  // A flying kick: a hop forward, one leg shot straight out, the other tucked, arms flung back.
  // Lands at 0.45.
  flyingkick(p) {
    const hop = Math.sin(seg(p, 0.12, 0.78) * Math.PI);
    const kick = bump(p, 0.3, 0.66);
    const land = bump(p, 0.76, 1);
    return {
      weapon: 0, arm: 40, lift: 14 * hop, lunge: 14 * ease(seg(p, 0.12, 0.6)) * (1 - 0.6 * seg(p, 0.7, 1)), tilt: -0.14 * kick,
      rig: (r) => {
        if (hop > 0.15) {
          r.air = true;
          r.frontLeg = [q(2.6 + 4 * kick), q(-5 + 2 * kick), Math.round(10 + 72 * kick)];
          r.backLeg = [-1.6, -3, -20];
        } else if (land > 0.3) { r.squat = 2; wideLegs(r); }
        r.backArm = [-5, -4]; r.hairLift = hop > 0.3 ? -1 : 0; r.cape -= 3 * hop; if (kick > 0.4) strikeFace(r);
      },
    };
  },
  // A headbutt: she leans way back, then snaps her forehead into them; a wobble, and she sees stars
  // for a beat. Lands at 0.42.
  headbutt(p) {
    const lean = ease(seg(p, 0, 0.3));
    const t = ease(seg(p, 0.3, 0.42));
    const back = ease(seg(p, 0.55, 1));
    const daze = p > 0.46 && p < 0.92;
    return {
      weapon: 0, arm: 30, lunge: (-3 * lean + 11 * t) * (1 - back * 0.8), tilt: (-0.26 * lean * (1 - t) + 0.42 * t) * (1 - back) + (daze ? 0.05 * Math.sin(p * 40) : 0),
      rig: (r) => {
        r.tx = t > 0 ? 2 : -1; lungeLegs(r, 1.1); r.backArm = t > 0 ? [-4, -2] : [2, -1]; r.hairLift = t > 0.5 && back < 0.5 ? -1 : 0;
        if (daze) { r.mouth = 'wavy'; r.face = { ...(r.face ?? {}), extra: [`orbit${Math.floor(p * 40) % 8}`] }; } else if (t > 0.3) strikeFace(r);
      },
    };
  },
  // A cartwheel kick: she throws her hands down and goes over forwards, legs scissoring over the
  // top through them, and lands back on her feet. Kicks at 0.48.
  cartwheel(p) {
    const f = ease(seg(p, 0.12, 0.84));
    const hop = Math.sin(seg(p, 0.1, 0.86) * Math.PI);
    return {
      weapon: 0, arm: 170, lift: 10 * hop, lunge: 10 * f, tilt: f * Math.PI * 2,
      rig: (r) => {
        if (hop > 0.15) {
          r.air = true;
          r.frontLeg = [3.4, -2.4, Math.round(40 + 40 * hop)];
          r.backLeg = [-3.4, -1.4, Math.round(-40 - 30 * hop)];
        } else { r.squat = p > 0.85 ? 1 : 0; wideLegs(r); }
        r.backArm = [-1, -6]; r.hairLift = -1; r.cape -= 3 * hop; if (hop > 0.5) strikeFace(r);
      },
    };
  },

  // A shield rush (the Paladin): blade held low and flat across her like a shield, a few quick
  // running steps, and her shoulder driven in behind a flare of light. Lands at 0.42.
  shieldrush(p) {
    const run = seg(p, 0.06, 0.4);
    const step = Math.sin(run * Math.PI * 4);
    const hit = ease(seg(p, 0.36, 0.44));
    const back = ease(seg(p, 0.58, 1));
    return {
      weapon: 120 - 20 * back, arm: 40 + 10 * back, lunge: (4 * run + 8 * hit) * (1 - back * 0.85), lift: run < 1 ? 1.5 * Math.abs(step) : 0, tilt: (0.18 * Math.min(1, run * 3) + 0.2 * hit) * (1 - back),
      rig: (r) => {
        if (run > 0 && run < 1) { r.frontLeg = [q(2 + 2 * step), q(-Math.max(0, step) * 2), Math.round(20 * step)]; r.backLeg = [q(-2 + 2 * step), q(-Math.max(0, -step) * 2), Math.round(20 * step)]; }
        else lungeLegs(r, 1.4);
        r.tx = 2; r.backArm = [3, -3]; r.cape = -5; r.hairLift = -1; if (hit > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },

  // A rising diagonal: drop low with the blade down and back, then rip up through them and on
  // past the shoulder, springing off the ground with it (it pops monsters up). Lands at 0.42.
  risecut(p) {
    if (p < 0.28) {
      const t = ease(p / 0.28);
      return { weapon: lerp(30, 210, t), arm: lerp(60, 20, t), lunge: 3 * t, tilt: 0.12 * t, rig: (r) => { r.squat = 3; lungeLegs(r, 1.2); r.tx = -1; r.backArm = [1, 1]; } };
    }
    const t = ease(seg(p, 0.28, 0.5));
    const settle = ease(seg(p, 0.66, 1));
    return {
      weapon: lerp(210, 10, t) + 30 * settle, arm: lerp(20, 168, t) - 36 * settle, lift: 12 * bump(p, 0.3, 0.8), lunge: 3 + 7 * t * (1 - settle * 0.6), tilt: lerp(0.12, -0.24, t) * (1 - settle), trail: p < 0.64,
      rig: (r) => { if (p > 0.36 && p < 0.72) tuck(r); else lungeLegs(r, 0.9); r.tx = 2; r.backArm = [-4, -4]; r.hairLift = -1; strikeFace(r); },
    };
  },

  // A leaping chop: a big hop forward with the blade raised high in both hands, then chop straight
  // down as you land and hold the low crouch. Lands at about 0.52.
  leapchop(p) {
    if (p < 0.36) {
      const t = ease(p / 0.36);
      return { weapon: lerp(25, -75, t), arm: lerp(60, 186, t), lift: 20 * Math.sin(t * Math.PI * 0.55), lunge: 6 * t, tilt: -0.2 * t, rig: (r) => { tuck(r); r.backArm = [-1, -6]; r.hairLift = -1; } };
    }
    const t = easeIn(seg(p, 0.36, 0.5));
    const settle = ease(seg(p, 0.64, 1));
    return {
      weapon: lerp(-75, 165, t) - 25 * settle, arm: lerp(186, 40, t) + 15 * settle, lift: 20 * Math.sin(Math.PI * 0.55) * (1 - t), lunge: 6 + 5 * t, tilt: lerp(-0.2, 0.36, t) * (1 - settle), trail: p < 0.6,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.tx = 2; r.backArm = [-2, 1]; r.cape = -5; strikeFace(r); },
    };
  },

  // Lightning jabs: three stabs so fast the arm blurs, the point snapping out low, high, then dead
  // centre on the last and hardest. Stabs land at about 0.2, 0.45 and 0.7.
  jabs(p) {
    const at = [0.2, 0.45, 0.7];
    const i = p < 0.33 ? 0 : p < 0.58 ? 1 : 2;
    const k = Math.max(0, Math.sin(clamp01((p - at[i] + 0.11) / 0.22) * Math.PI));
    const last = i === 2 ? 1.3 : 1;
    return {
      weapon: 90 + [10, -10, 0][i] * k, arm: 50 + 58 * k * last, lunge: 2 + 9 * k * last, tilt: 0.06 + 0.12 * k * last, trail: k > 0.6,
      rig: (r) => { r.tx = 2; r.squat = 1; lungeLegs(r, 1.2); r.backArm = [-4 + 3 * k, -1]; r.hairLift = k > 0.5 ? -1 : 0; strikeFace(r); },
    };
  },

  // A flash cut: drop into a crouch with the blade held low and back, then blur forward across the
  // ground in one level cut, ending far past them with the blade swept out behind. Lands at 0.4.
  flashcut(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(25, 150, t), arm: lerp(60, 20, t), lunge: -4 * t, tilt: 0.14 * t, rig: (r) => { r.squat = 3; wideLegs(r); r.tx = -1; r.backArm = [3, 1]; } };
    }
    const t = ease(seg(p, 0.3, 0.42));
    const settle = ease(seg(p, 0.6, 1));
    return {
      weapon: lerp(150, -95, t) + 60 * settle, arm: lerp(20, 100, t) - 30 * settle, lunge: lerp(-4, 12, t) * (1 - settle * 0.7), tilt: 0.3 * (1 - settle), trail: p < 0.55,
      rig: (r) => { r.tx = 2; r.squat = settle < 0.6 ? 2 : 1; lungeLegs(r, 1.6); r.backArm = [-5, 1]; r.cape = -5; r.hairLift = -1; strikeFace(r); },
    };
  },

  // A driving stab: pull the blade right back past the hip and coil, then explode forward behind
  // the point with the whole body, far out over the front foot, and hold. Lands at about 0.42.
  drivestab(p) {
    if (p < 0.32) {
      const t = ease(p / 0.32);
      return { weapon: 95, arm: lerp(70, 30, t), lunge: -7 * t, tilt: -0.2 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.tx = -2; r.backArm = [4, -1]; } };
    }
    const t = ease(seg(p, 0.32, 0.42));
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 92, arm: lerp(30, 110, t) - 30 * back, lunge: lerp(-7, 18, t) * (1 - back * 0.8), tilt: lerp(-0.2, 0.34, t) * (1 - back), trail: p > 0.32 && p < 0.55,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.7); r.backArm = [-5, -1]; r.cape = -5; r.hairLift = -1; strikeFace(r); },
    };
  },

  // A home-run swing: haul the blade back over the far shoulder and hold it there, trembling with
  // the load, then let go in one enormous level swing that carries the whole body round and
  // through. The heavy blow mid-combo. Lands at about 0.56.
  hammer(p) {
    if (p < 0.46) {
      const t = ease(seg(p, 0, 0.3));
      const shake = p > 0.3 ? Math.sin(p * 140) * 1.5 : 0;
      return { weapon: lerp(25, -130, t) + shake, arm: lerp(60, 172, t), lunge: -5 * t, tilt: -0.22 * t, rig: (r) => { r.squat = t > 0.5 ? 3 : 1; wideLegs(r); r.tx = -2; r.backArm = [4, -2]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.46, 0.6));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-130, 205, t) - 60 * settle, arm: lerp(172, 78, t) + 10 * settle, lunge: lerp(-5, 13, t) * (1 - settle * 0.6), lift: 4 * bump(p, 0.46, 0.75), tilt: lerp(-0.22, 0.34, t) * (1 - settle), trail: p < 0.74,
      rig: (r) => { r.tx = 2; r.squat = settle < 0.6 ? 2 : 1; lungeLegs(r, 1.5); r.backArm = [-5, -1]; r.cape = -6; r.hairLift = -1; strikeFace(r); },
    };
  },

  // A sky-splitter: sink deep, spring high into the air with the blade swung all the way back over
  // the head and the body arched, hang a beat at the top, then crash straight down and split the
  // ground, and hold the deep crouch. The heaviest finisher. Lands at about 0.6.
  skysplit(p) {
    if (p < 0.16) {
      const t = ease(p / 0.16);
      return { weapon: lerp(25, 60, t), arm: lerp(60, 40, t), tilt: 0.14 * t, rig: (r) => { r.squat = 3; wideLegs(r); r.backArm = [2, 2]; } };
    }
    if (p < 0.5) {
      const t = ease(seg(p, 0.16, 0.42));
      return { weapon: lerp(60, -165, t), arm: lerp(40, 192, t), lift: 30 * Math.sin(t * Math.PI * 0.55), lunge: 6 * t, tilt: -0.34 * t, rig: (r) => { tuck(r); r.backArm = [-1, -6]; r.hairLift = -1; strikeFace(r); } };
    }
    const t = easeIn(seg(p, 0.5, 0.6));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-165, 168, t) - 20 * settle, arm: lerp(192, 36, t) + 18 * settle, lift: 30 * Math.sin(Math.PI * 0.55) * (1 - t), lunge: 6 + 6 * t, tilt: lerp(-0.34, 0.42, t) * (1 - settle), trail: p < 0.66,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.7 ? 3 : 1; wideLegs(r); } r.tx = 2; r.backArm = [3, 2]; r.cape = -6; strikeFace(r); },
    };
  },

  // A shield shove: brace low behind the guard, then drive forward shoulder and hilt first (the
  // shield of light flares at the front of it), and settle back.
  bash(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(25, 70, t), arm: lerp(60, 75, t), tilt: -0.1 * t, lunge: -3 * t, rig: (r) => { r.squat = t > 0.5 ? 2 : 1; wideLegs(r); r.backArm = [3, -2]; r.tx = -1; } };
    }
    const t = ease(seg(p, 0.3, 0.44));
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 70, arm: lerp(75, 100, t) - 20 * back, lunge: lerp(-3, 9, t) * (1 - back * 0.8), tilt: lerp(-0.1, 0.25, t) * (1 - back), stretch: 1 - 0.05 * t * (1 - back),
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.2); r.backArm = [-4, -1]; strikeFace(r); r.cape = -3; },
    };
  },

  // Rampage: three wild cleaves, back and forth, each quicker than a normal one, then the
  // skull-splitter. The cleaves land at about 0.064, 0.227 and 0.384, the smash at 0.724.
  rampage(p) {
    if (p < 0.16) return MOVES.cleave1(p / 0.16);
    if (p < 0.32) return MOVES.cleave2((p - 0.16) / 0.16);
    if (p < 0.48) return MOVES.cleave1((p - 0.32) / 0.16);
    return MOVES.reaver((p - 0.48) / 0.52);
  },

  // Air cuts: the same slash and backhand with the legs tucked up under you.
  airslash(p) {
    const m = MOVES.slash(p);
    // (In the air the free arm balances the cut: flung back and up as the blade comes through.)
    const fling = bump(p, 0.15, 0.85);
    return { ...m, lunge: 0, rig: (r) => { m.rig?.(r); tuck(r); r.squat = 0; r.hairLift = -1; r.backArm = [q(r.backArm[0] - 3 * fling), q(r.backArm[1] - 2.5 * fling)]; } };
  },
  airslash2(p) {
    const m = MOVES.slash2(p);
    return { ...m, lift: 0, rig: (r) => { m.rig?.(r); tuck(r); r.squat = 0; r.hairLift = -1; } };
  },

  // The air finisher: a beat with the weapon cocked high, then the point driven straight down as
  // you dive (held until you land; see `landslam`).
  meteor(p) {
    const cock = ease(seg(p, 0, 0.25));
    const drive = ease(seg(p, 0.25, 0.4));
    return {
      weapon: lerp(lerp(20, -120, cock), 178, drive), arm: lerp(lerp(90, 180, cock), 30, drive), tilt: lerp(-0.18 * cock, 0.3, drive), stretch: 1 + 0.08 * drive,
      trail: drive > 0 && drive < 1,
      rig: (r) => { tuck(r); r.backArm = [-2, -5]; r.hairLift = -1; if (drive > 0) strikeFace(r); r.cape = -4; },
    };
  },

  // Touchdown from a dive: the weapon buried in the floor in a deep crouch, then rising out of it.
  landslam(p) {
    return MOVES.slam(0.46 + 0.54 * p);
  },

  // A dash attack: lean way in with the point leading and drive through the line.
  dashstab(p) {
    if (p < 0.25) {
      const t = ease(p / 0.25);
      return { weapon: 92, arm: lerp(80, 50, t), tilt: 0.1 * t, lunge: -1 * t, rig: (r) => { r.squat = 1; r.frontLeg = [4, 0, 6]; r.backLeg = [-4, 0, -12]; r.backArm = [1, -1]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.25, 0.42));
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 90, arm: lerp(50, 108, t) - 25 * back, tilt: lerp(0.1, 0.34, t) * (1 - back), lunge: 9 * t * (1 - back * 0.8), stretch: 1 - 0.05 * t * (1 - back),
      trail: p < 0.6,
      rig: (r) => { r.tx = 2; r.frontLeg = [5, 0, 10]; r.backLeg = [-5, 0, -16]; r.backArm = [-4, -1]; strikeFace(r); r.hairLift = -1; r.cape = -5; },
    };
  },

  // Grand Verdict (the Paladin's finisher): kneel and raise the blade to the sky, rise on the light
  // with it held high, hang a beat, then drive it down into the ground in one blow and hold the
  // crouch while the light breaks. The blow lands at about 0.66.
  verdict(p, dur) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      const shake = Math.sin(p * dur * 60) * 0.5 * t;
      return { weapon: lerp(25, -8, t), arm: lerp(60, 178, t), lunge: shake, tilt: -0.06 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [-3, -5]; r.hairLift = -1; r.eyes = t > 0.5 ? 'blink' : undefined; } };
    }
    if (p < 0.6) {
      const t = ease(seg(p, 0.3, 0.5));
      const hang = Math.sin(seg(p, 0.5, 0.6) * Math.PI) * 1.5;
      return { weapon: lerp(-8, -150, ease(seg(p, 0.45, 0.6))), arm: 178, lift: 34 * t + hang, tilt: -0.12 * t, rig: (r) => { tuck(r); r.backArm = [-2, -5]; r.hairLift = -1; r.cape -= 3; strikeFace(r); } };
    }
    const t = easeIn(seg(p, 0.6, 0.66));
    const settle = seg(p, 0.72, 1);
    return {
      weapon: lerp(-150, 175, ease(seg(p, 0.6, 0.65))), arm: lerp(178, 30, t), lift: 35 * (1 - t), tilt: 0.25 * t * (1 - settle), trail: p < 0.7,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [2, 2]; strikeFace(r); },
    };
  },

  // Crimson Eclipse (the Berserker's finisher): a whirlwind that spins you up into the air, a beat
  // at the top with the axe raised against the red moon, then a crash straight down. The crash
  // lands at about 0.68.
  eclipse(p, dur) {
    if (p < 0.45) {
      const a = ease(seg(p, 0, 0.45)) * 2;
      const rise = ease(seg(p, 0.05, 0.45));
      return {
        weapon: 95 + a * 360, arm: 100, orbit: true, turn: Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))), lift: 30 * rise, trail: true,
        rig: (r) => { tuck(r); r.backArm = [-3, -3]; r.hairLift = -1; strikeFace(r); },
      };
    }
    if (p < 0.62) {
      const t = ease(seg(p, 0.45, 0.55));
      const shake = Math.sin(p * dur * 70) * 0.6;
      return { weapon: lerp(95, -125, t), arm: lerp(100, 182, t), lift: 30 + 3 * t, lunge: shake, tilt: -0.16 * t, rig: (r) => { tuck(r); r.backArm = [-1, -5]; r.hairLift = -1; strikeFace(r); } };
    }
    const t = easeIn(seg(p, 0.62, 0.68));
    const settle = seg(p, 0.74, 1);
    return {
      weapon: lerp(-125, 170, ease(seg(p, 0.62, 0.67))), arm: lerp(182, 40, t), lift: 33 * (1 - t), tilt: 0.26 * t * (1 - settle), trail: p < 0.72,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [2, 1]; strikeFace(r); },
    };
  },

  // ---------- Paladin: upright and disciplined, the shield arm always leading ----------

  // A measured cut: the shield arm held out in front, a short draw back, then a clean diagonal
  // stroke that stops dead and holds. Lands at 0.45.
  pslash(p) {
    const m = MOVES.slash(p);
    return { ...m, tilt: m.tilt * 0.5, lunge: (m.lunge ?? 0) * 0.8, rig: (r) => { m.rig?.(r); r.backArm = [3, -1]; r.hairLift = 0; } };
  },

  // A lunging thrust past the raised shield arm, the body square behind it. Lands at 0.42.
  pthrust(p) {
    const m = MOVES.thrust(p);
    return { ...m, tilt: m.tilt * 0.6, rig: (r) => { m.rig?.(r); r.backArm = [3, -2]; } };
  },

  // Rising cut: the blade comes up from low behind in one long arc while the body rises tall onto
  // its toes, and holds high, pointing at the sky, for a beat. Lands at 0.45.
  ascend(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(40, 205, t), arm: lerp(60, 15, t), tilt: 0.05 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [3, 0]; r.tx = 0; } };
    }
    const t = ease(seg(p, 0.3, 0.5));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(205, -10, t) + 35 * settle, arm: lerp(15, 172, t) - 100 * settle, lift: 11 * Math.sin(Math.PI * seg(p, 0.3, 0.8)), stretch: 1 + 0.05 * t * (1 - settle), tilt: -0.1 * t * (1 - settle), trail: p < 0.6,
      rig: (r) => { r.tx = 1; r.frontLeg = [2.6, 0, 2]; r.backLeg = [-2.4, 0, -4]; r.backArm = [-2, -3]; strikeFace(r); },
    };
  },

  // The smite: both hands lift the blade straight overhead, the body leaning back and holding it
  // there, then one vertical chop with a long step in that drives into a deep crouch. Lands at 0.43.
  smite(p) {
    if (p < 0.34) {
      const t = ease(p / 0.34);
      const hold = Math.sin(p * 60) * 0.3 * t;
      return { weapon: lerp(25, -12, t), arm: lerp(60, 182, t), tilt: -0.12 * t, lunge: -2 * t + hold, rig: (r) => { r.squat = 0; r.frontLeg = [1.5, 0, 0]; r.backLeg = [-2, 0, -2]; r.backArm = [1, -6]; r.hairLift = -1; } };
    }
    const t = easeIn(seg(p, 0.34, 0.44));
    const settle = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(-12, 155, t) - 25 * settle, arm: lerp(182, 48, t) + 15 * settle, lunge: 9 * t * (1 - 0.6 * settle), tilt: lerp(-0.12, 0.2, t) * (1 - settle), stretch: 1 + 0.06 * (t < 1 ? t : 0), trail: p < 0.55,
      rig: (r) => { r.tx = 2; if (t >= 1) { r.squat = settle < 0.5 ? 3 : 1; } lungeLegs(r, 1.3); r.backArm = [2, 1]; strikeFace(r); },
    };
  },

  // The shield slam: she sweeps the blade up flat over her head in both hands like a raised
  // shield, rises onto her toes with a little hop, then brings it crashing down flat in front of
  // her as a shield of light slams onto them, and holds the low guard. Lands at 0.5.
  shieldslam(p) {
    if (p < 0.38) {
      const t = ease(p / 0.38);
      return { weapon: lerp(25, -88, t), arm: lerp(60, 172, t), lift: 6 * bump(p, 0.12, 0.5), tilt: -0.1 * t, rig: (r) => { if (t > 0.4) tuck(r); else wideLegs(r); r.backArm = [1, -6]; r.hairLift = -1; } };
    }
    const t = easeIn(seg(p, 0.38, 0.5));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-88, 88, t) - 50 * settle, arm: lerp(172, 70, t) - 10 * settle, lunge: 8 * t * (1 - 0.6 * settle), tilt: lerp(-0.1, 0.3, t) * (1 - settle), trail: p < 0.6,
      rig: (r) => { r.tx = 2; if (t >= 1) r.squat = settle < 0.6 ? 3 : 1; lungeLegs(r, 1.3); r.backArm = [-4, -2]; r.cape = -4; strikeFace(r); },
    };
  },

  // Hallowed Ground: the blade turned point-down and raised overhead in both hands, a rise onto the
  // toes, then driven straight down into the floor in front as she drops to one knee, and held
  // there while the light rises. Lands at 0.46.
  consecrate(p) {
    if (p < 0.38) {
      const t = ease(p / 0.38);
      return { weapon: lerp(25, 182, t), arm: lerp(60, 170, t), lift: 3 * t, stretch: 1 + 0.04 * t, tilt: -0.06 * t, rig: (r) => { r.frontLeg = [1.5, 0, 0]; r.backLeg = [-1.5, 0, 0]; r.backArm = [1, -6]; r.hairLift = -1; } };
    }
    const t = easeIn(seg(p, 0.38, 0.46));
    const up = ease(seg(p, 0.86, 1));
    return {
      weapon: 180, arm: lerp(170, 95, t) - 30 * up, lift: 3 * (1 - t), lunge: 3 * t * (1 - up), tilt: 0.12 * t * (1 - up),
      rig: (r) => { if (t >= 1 && up < 0.6) { r.squat = 3; r.frontLeg = [3.5, 0, 6]; r.backLeg = [-3, 2, -30]; r.eyes = 'blink'; } else wideLegs(r); r.backArm = [3, -1]; r.tx = 1; },
    };
  },

  // A knight's salute: the blade raised upright before the face, the free hand over the heart,
  // eyes closed, rising a little on the light.
  salute(p) {
    const k = ease(seg(p, 0, 0.3)) * (1 - ease(seg(p, 0.85, 1)));
    return {
      weapon: lerp(25, -2, k), arm: lerp(60, 128, k), lift: 2 * k, tilt: -0.04 * k,
      rig: (r) => { r.backArm = [q(3 * k), q(-3 * k)]; r.frontLeg = [1.5, 0, 0]; r.backLeg = [-1.5, 0, 0]; if (k > 0.5) r.eyes = 'blink'; r.cape -= 1; },
    };
  },

  // ---------- Berserker: wild, twisting, everything thrown into each swing ----------

  // The cleave: the whole body winds up away from the target with the axe far behind, then
  // unwinds in a huge horizontal sweep that over-rotates and drags him forward. Lands at 0.4.
  cleave1(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(25, -120, t), arm: lerp(60, 150, t), turn: lerp(1, 0.84, t), tilt: -0.16 * t, lunge: -3 * t, rig: (r) => { r.squat = 1 + Math.round(t); wideLegs(r); r.tx = -1; r.backArm = [-3, -2]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.3, 0.42));
    const over = ease(seg(p, 0.42, 0.6));
    const settle = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(-120, 100, t) + 60 * over - 50 * settle, arm: lerp(150, 92, t) - 20 * over + 10 * settle, turn: lerp(0.84, 1, t),
      lunge: 10 * t * (1 - 0.6 * settle), tilt: lerp(-0.16, 0.24, t) * (1 - settle), trail: p < 0.65,
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.4); r.squat = settle < 0.5 ? 2 : 1; r.backArm = [-4, -1]; strikeFace(r); r.hairLift = -1; r.cape = -4; },
    };
  },

  // The return cleave: from low in front, a rising backhand that hauls the axe up and over the
  // shoulder, the body twisting the other way with a hop. Lands at 0.42.
  cleave2(p) {
    if (p < 0.28) {
      const t = ease(p / 0.28);
      return { weapon: lerp(100, 170, t), arm: lerp(80, 30, t), turn: lerp(1, 0.86, t), tilt: 0.14 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [2, 1]; r.tx = 1; } };
    }
    const t = ease(seg(p, 0.28, 0.44));
    const settle = ease(seg(p, 0.66, 1));
    return {
      weapon: lerp(170, -80, t) + 90 * settle, arm: lerp(30, 178, t) - 110 * settle, turn: lerp(0.86, 1, t), lift: 6 * bump(p, 0.3, 0.75), lunge: 5 * t * (1 - settle),
      tilt: -0.16 * t * (1 - settle), trail: p < 0.62,
      rig: (r) => { r.tx = 1; if (p < 0.7) tuck(r); else wideLegs(r); r.backArm = [-3, -4]; strikeFace(r); r.hairLift = -1; },
    };
  },

  // A low whirl: dropping into a crouch, leaning in, the axe sweeping all the way round at knee
  // height. Lands at 0.5.
  gyre(p) {
    const a = ease(seg(p, 0.12, 0.8));
    return {
      weapon: 110 + a * 360, arm: 95, orbit: true, turn: Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))), tilt: 0.2 * bump(p, 0.05, 0.95), trail: p > 0.12 && p < 0.85,
      rig: (r) => { r.squat = p < 0.08 || p > 0.9 ? 1 : 3; wideLegs(r); r.backArm = [-4, -2]; r.hairLift = -1; strikeFace(r); r.cape = -4; },
    };
  },

  // The skull-splitter: a deep crouch, a leap with the axe swung all the way back behind the head
  // and the body arched, then a crash straight down into a crater and a long held crouch.
  // Lands at 0.47.
  reaver(p) {
    if (p < 0.18) {
      const t = ease(p / 0.18);
      return { weapon: lerp(25, 60, t), arm: lerp(60, 40, t), tilt: 0.1 * t, rig: (r) => { r.squat = 3; wideLegs(r); r.backArm = [2, 2]; } };
    }
    if (p < 0.4) {
      const t = ease(seg(p, 0.18, 0.4));
      return { weapon: lerp(60, -160, t), arm: lerp(40, 188, t), lift: 20 * Math.sin(t * Math.PI * 0.6), tilt: -0.28 * t, stretch: 1 + 0.06 * t, rig: (r) => { tuck(r); r.backArm = [-1, -6]; r.hairLift = -1; strikeFace(r); } };
    }
    const t = easeIn(seg(p, 0.4, 0.47));
    const settle = ease(seg(p, 0.66, 1));
    return {
      weapon: lerp(-160, 148, t) - 20 * settle, arm: lerp(188, 44, t) + 15 * settle, lift: 16 * (1 - t), tilt: lerp(-0.28, 0.32, t) * (1 - settle), stretch: t < 1 ? 1.1 : 1, lunge: 4 * t,
      trail: p < 0.55,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [3, 2]; strikeFace(r); },
    };
  },

  // The axe hurl: he winds the axe back, then flings it out at the full length of his arm and lets
  // it drag him round twice, a wide whirl of steel all round him, and staggers out of it still
  // turning. Its two passes land at about 0.42 and 0.68.
  axehurl(p) {
    if (p < 0.22) {
      const t = ease(p / 0.22);
      return { weapon: lerp(25, -60, t), arm: lerp(60, 120, t), tilt: -0.14 * t, lunge: -3 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.tx = -1; r.backArm = [-3, -2]; r.hairLift = -1; } };
    }
    const a = ease(seg(p, 0.22, 0.84));
    const settle = ease(seg(p, 0.84, 1));
    const c = Math.cos(a * Math.PI * 4);
    return {
      weapon: -60 + a * 720 + 30 * settle, arm: 98 - 30 * settle, orbit: true, turn: Math.sign(c || 1) * Math.max(0.35, Math.abs(c)),
      lunge: 6 * a * (1 - settle * 0.5), lift: 3 * bump(p, 0.3, 0.8), tilt: -0.1 * bump(p, 0.22, 0.9) + 0.12 * settle * (1 - settle), trail: p > 0.24 && p < 0.86,
      rig: (r) => { r.tx = 1; wideLegs(r); r.squat = p > 0.86 ? 2 : 1; r.backArm = [-5, -3]; r.hairLift = -1; r.cape = -5; strikeFace(r); },
    };
  },

  // The body slam: a deep crouch, a leap up and forward with the axe flung back out of the way,
  // the body turning sideways in the air, then a crash down shoulder first into the ground that
  // throws everything round him off its feet, and he heaves himself back up. Lands at 0.55.
  bodyslam(p) {
    if (p < 0.2) {
      const t = ease(p / 0.2);
      return { weapon: lerp(25, 120, t), arm: lerp(60, 30, t), tilt: 0.16 * t, rig: (r) => { r.squat = 3; wideLegs(r); r.backArm = [3, 2]; r.tx = -1; } };
    }
    if (p < 0.55) {
      const t = ease(seg(p, 0.2, 0.46));
      const fall = easeIn(seg(p, 0.46, 0.55));
      return {
        weapon: lerp(120, -120, t), arm: lerp(30, 150, t), lift: 26 * Math.sin(t * Math.PI * 0.6) * (1 - fall), lunge: 4 + 12 * t + 4 * fall, tilt: lerp(0, -0.3, t) + 0.95 * fall,
        rig: (r) => { tuck(r); r.backArm = [5, -1]; r.hairLift = -1; r.cape = -6; strikeFace(r); },
      };
    }
    const up = ease(seg(p, 0.7, 1));
    return {
      weapon: -120 + 150 * up, arm: 150 - 90 * up, lunge: 20 - 8 * up, tilt: 0.95 * (1 - up), lift: 0,
      rig: (r) => { r.squat = up < 0.6 ? 3 : 1; wideLegs(r); r.tx = 2; r.backArm = [-4, 2]; r.cape = -4; if (up < 0.3) r.eyes = 'blink'; else strikeFace(r); },
    };
  },

  // The drag-and-rip: the axe dropped point first onto the ground behind him and dragged along it
  // as he charges, throwing sparks, then torn up out of the ground in one huge uppercut that lifts
  // him off his feet, and he lands with it high over his shoulder. Lands at 0.5.
  dragrise(p) {
    if (p < 0.16) {
      const t = ease(p / 0.16);
      return { weapon: lerp(25, 215, t), arm: lerp(60, 18, t), tilt: 0.1 * t, lunge: -2 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.tx = -1; r.backArm = [2, 1]; } };
    }
    if (p < 0.42) {
      const t = seg(p, 0.16, 0.42);
      const run = Math.sin(t * Math.PI * 6);
      return {
        weapon: 215 + 4 * run, arm: 18, lunge: lerp(-2, 10, t), tilt: 0.28, lift: Math.abs(run) * 1.5,
        rig: (r) => { r.squat = 2; r.frontLeg = [q(3 * run), 0, 6 * run]; r.backLeg = [q(-3 * run), 0, -6 * run]; r.tx = 2; r.backArm = [-4, -2]; r.hairLift = -1; r.cape = -5; },
      };
    }
    const t = ease(seg(p, 0.42, 0.54));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(215, -20, t) + 30 * settle, arm: lerp(18, 182, t) - 70 * settle, lift: 18 * bump(p, 0.44, 0.86), lunge: 10 + 6 * t * (1 - settle), tilt: lerp(0.28, -0.3, t) * (1 - settle), trail: p < 0.7,
      rig: (r) => { if (p > 0.48 && p < 0.82) tuck(r); else wideLegs(r); r.tx = 2; r.backArm = [-4, -5]; r.hairLift = -1; r.cape = -6; strikeFace(r); },
    };
  },

  // A war roar: hunched low gathering it in, then reared back with the axe thrust up one-handed,
  // the whole body shaking.
  warroar(p) {
    const hunch = ease(seg(p, 0, 0.25));
    const rear = ease(seg(p, 0.25, 0.4));
    const calm = seg(p, 0.85, 1);
    const shake = Math.sin(p * 120) * 1.1 * rear * (1 - calm);
    return {
      weapon: lerp(lerp(25, 80, hunch), -20, rear), arm: lerp(lerp(60, 40, hunch), 175, rear), lunge: shake, tilt: lerp(0.18 * hunch, -0.18, rear) * (1 - calm), lift: 2 * rear * (1 - calm),
      rig: (r) => { r.squat = rear < 0.5 ? 2 : 0; wideLegs(r); r.backArm = rear > 0.3 ? [-4, -5] : [2, 2]; r.hairLift = -1; r.mouth = 'open'; },
    };
  },

  // ---------- Ranger: light on her feet, the bow always moving with her ----------
  // (Timing after MapleStory's shoot2, 160 / 160 / 250 / 100 / 150 ms: a short raise, a short
  // draw, a held aim, the loose, a settle. A player's anticipation stays compressed.)

  // A twirl shot: loose one arrow, spin a full turn on the spot with the bow swung out, and loose
  // another as she comes back round. Shots at 0.32 and 0.72.
  spinshot(p) {
    const spin = ease(seg(p, 0.36, 0.62));
    const turn = Math.cos(spin * Math.PI * 2);
    const pull = (a, b) => ease(seg(p, a, b));
    const k = p < 0.36 ? pull(0.05, 0.3) * (1 - seg(p, 0.3, 0.36)) : pull(0.6, 0.7) * (1 - seg(p, 0.72, 0.8));
    return {
      weapon: -4 * k - 30 * Math.sin(spin * Math.PI), arm: 95 - 25 * Math.sin(spin * Math.PI), pull: k, nock: k > 0.05, spares: p < 0.32 ? 1 : 0, turn: Math.sign(turn || 1) * Math.max(0.3, Math.abs(turn)), lift: 3 * Math.sin(spin * Math.PI), lunge: 3 * spin * (1 - seg(p, 0.8, 1)),
      rig: (r) => { r.backArm = [q(2 - 6 * k), -3]; if (spin > 0 && spin < 1) { r.hairLift = -1; r.cape -= 2; r.frontLeg = [2, -1, 6]; r.backLeg = [-2, 0, -6]; } else { r.frontLeg = [2.6, 0, 0]; r.backLeg = [-2.6, 0, 0]; } if (k > 0.8) strikeFace(r); },
    };
  },

  // A leaping fan: crouch, hop up and back, and loose a spread of arrows down at them from the top
  // of the hop. Shot at 0.55.
  // The leap is a backflip (MapleStory builds its somersault by turning the whole body, 0 to 360,
  // on a steady beat; archery.md 11): she comes round upright at the top and looses from there.
  leapshot(p) {
    const crouch = bump(p, 0, 0.22);
    const hop = Math.sin(seg(p, 0.15, 0.9) * Math.PI);
    const pull = ease(seg(p, 0.25, 0.52));
    const snap = seg(p, 0.55, 0.66);
    const flip = soft(seg(p, 0.14, 0.98));
    return {
      weapon: 25 * hop - 8 * snap * (1 - seg(p, 0.7, 1)), arm: 80 - 12 * hop, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.55), lift: 34 * hop, tilt: -flip * Math.PI * 2 + 0.14 * hop - 0.08 * snap, lunge: -2 * snap,
      rig: (r) => { if (hop > 0.15) tuck(r); else if (crouch > 0.3) r.squat = 2; r.backArm = snap > 0 ? [-7, -2] : [q(2 - 6 * pull), -2]; r.hairLift = hop > 0.3 ? -1 : 0; if (snap > 0 && snap < 1) strikeFace(r); },
    };
  },

  // The gale shot: a wide low stance, a long full draw as the wind gathers at the arrowhead, then
  // a loose that rocks her back on her heels. Shot at 0.6.
  galeshot(p) {
    const raise = ease(seg(p, 0, 0.16));
    const pull = ease(seg(p, 0.12, 0.5));
    const shiver = p > 0.42 && p < 0.58 ? Math.sin(p * 260) * 1.2 : 0;
    const snap = seg(p, 0.6, 0.7);
    const back = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-50, 0, raise) + shiver - 10 * snap * (1 - back), arm: lerp(60, 95, raise) + 6 * snap * (1 - back), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.6), lunge: -6 * snap * (1 - back * 0.6), tilt: -0.08 * pull * (1 - snap) - 0.14 * snap * (1 - back),
      rig: (r) => { r.squat = snap > 0 ? 1 : pull > 0.3 ? 2 : 0; wideLegs(r); r.backArm = snap > 0 ? [q(-8 + 5 * back), -3] : [q(2 - 7 * pull), -3]; r.hairLift = -1; r.cape -= 2; if (snap > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // Tailwind: a quick twirl with the bow raised high as the wind wraps round her, ending on a
  // light skip.
  tailwind(p) {
    const spin = ease(seg(p, 0.1, 0.6));
    const turn = Math.cos(spin * Math.PI * 2);
    const skip = bump(p, 0.6, 0.9);
    return {
      weapon: lerp(10, -20, spin), arm: 150 - 40 * skip, turn: Math.sign(turn || 1) * Math.max(0.3, Math.abs(turn)), lift: 4 * Math.sin(spin * Math.PI) + 5 * skip,
      rig: (r) => { r.backArm = [-3, -5]; r.hairLift = -1; r.cape -= 3; if (skip > 0.2) tuck(r); r.mouth = 'open'; },
    };
  },

  // Storm Volley (the Ranger's finisher): a gust throws her spinning up into the air; at the top
  // she whirls, loosing arrows every way; then she dives down bow first and lands in a crouch as
  // the storm bursts. The pours land 0.3-0.54; the dive's burst at 0.8.
  stormvolley(p, dur) {
    if (p < 0.24) {
      const rise = ease(seg(p, 0.04, 0.24));
      const crouch = bump(p, 0, 0.1);
      return { weapon: -40 * rise, arm: 120 + 40 * rise, lift: 40 * rise, tilt: -0.2 * rise, rig: (r) => { if (rise > 0.1) tuck(r); else if (crouch > 0.3) r.squat = 2; r.backArm = [-2, -4]; r.hairLift = -1; r.cape -= 3; } };
    }
    if (p < 0.66) {
      // Whirling at the top: two full turns, each beat a pull and a loose up and out.
      const a = seg(p, 0.24, 0.66) * 2;
      const turn = Math.cos(a * Math.PI * 2);
      const k = Math.abs(Math.sin(p * dur * 14));
      return {
        weapon: -45 + 20 * Math.sin(a * Math.PI * 2), arm: 140, pull: 1 - k, nock: k < 0.6, turn: Math.sign(turn || 1) * Math.max(0.3, Math.abs(turn)), lift: 40 + 3 * Math.sin(a * Math.PI * 2), tilt: -0.1,
        rig: (r) => { tuck(r); r.backArm = [q(1 - 5 * k), -5]; r.hairLift = -1; r.cape -= 3; strikeFace(r); },
      };
    }
    const t = easeIn(seg(p, 0.66, 0.8));
    const settle = seg(p, 0.82, 1);
    return {
      weapon: lerp(-45, 60, t), arm: lerp(140, 70, t), lift: 40 * (1 - t), tilt: 0.3 * t * (1 - settle), trail: p < 0.82,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [-2, -1]; strikeFace(r); },
    };
  },

  // In the air: the bow tipped down at them, a quick pull and loose. Shot at 0.45 (0.5 for the
  // second, a fuller draw).
  airshot(p) {
    const pull = ease(seg(p, 0.05, 0.42));
    const snap = seg(p, 0.45, 0.56);
    return {
      weapon: 35 - 6 * snap, arm: 55, tilt: 0.4 - 0.12 * snap, lift: 3 * bump(p, 0.45, 0.8), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.45),
      rig: (r) => { tuck(r); r.backArm = snap > 0 ? [-4, 0] : [q(2 - 6 * pull), -1]; r.hairLift = -1; if (snap > 0 && snap < 1) strikeFace(r); },
    };
  },
  airshot2(p) {
    const pull = ease(seg(p, 0.05, 0.48));
    const snap = seg(p, 0.5, 0.62);
    return {
      weapon: 40 - 10 * snap, arm: 50, tilt: 0.45 - 0.15 * snap, lift: 4 * bump(p, 0.5, 0.85), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.5),
      rig: (r) => { tuck(r); r.backArm = snap > 0 ? [-5, 0] : [q(2 - 7 * pull), -1]; r.hairLift = -1; r.cape -= 2; if (snap > 0) strikeFace(r); },
    };
  },

  // A hop-back shot: spring up and back off both feet, draw at the top of the hop, loose down at
  // them, and drop into a crouch. Shot at 0.5.
  hopshot(p) {
    const crouch = bump(p, 0, 0.18);
    const hop = Math.sin(seg(p, 0.12, 0.82) * Math.PI);
    const pull = ease(seg(p, 0.18, 0.46));
    const snap = seg(p, 0.5, 0.6);
    const land = bump(p, 0.8, 1);
    return {
      weapon: 18 * hop - 10 * snap * (1 - seg(p, 0.65, 1)), arm: 88 - 10 * hop, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.5), lift: 22 * hop, tilt: 0.1 * hop - 0.1 * snap * (1 - seg(p, 0.65, 1)), lunge: -2 * snap,
      rig: (r) => { if (hop > 0.25) tuck(r); else if (crouch > 0.3 || land > 0.3) r.squat = 2; r.backArm = snap > 0 ? [-7, -2] : [q(2 - 6 * pull), -2]; r.hairLift = hop > 0.3 ? -1 : 0; if (snap > 0 && snap < 1) strikeFace(r); },
    };
  },

  // Point blank: a stomping front kick into them, then the bow brought up close and a shot loosed
  // right into them that rocks her back. Kick at 0.3, shot at 0.62.
  pointblank(p) {
    const kick = bump(p, 0.12, 0.42);
    const raise = ease(seg(p, 0.38, 0.5));
    const pull = ease(seg(p, 0.42, 0.6));
    const snap = seg(p, 0.62, 0.7);
    const back = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(-50, 0, raise) - 14 * snap * (1 - back), arm: lerp(60, 95, raise) + 8 * snap * (1 - back), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.62),
      lunge: 6 * kick - 6 * snap * (1 - back * 0.6), tilt: -0.12 * kick - 0.14 * snap * (1 - back),
      rig: (r) => { r.frontLeg = kick > 0.2 ? [q(3 + 4 * kick), q(-3 * kick), 70 * kick] : [2.6, 0, 0]; r.backLeg = [-2.8, 0, -4]; r.backArm = snap > 0 ? [q(-8 + 5 * back), -3] : [q(2 - 6 * pull), -3]; if ((kick > 0.6) || (snap > 0 && back < 0.5)) strikeFace(r); },
    };
  },

  // Hip fire: no kneel, no aim; the crossbow snapped up at the hip and fired fast, a jolt of recoil.
  // Shot at 0.4.
  hipfire(p) {
    const up = ease(seg(p, 0, 0.25));
    const kick = seg(p, 0.4, 0.48);
    const back = ease(seg(p, 0.5, 1));
    return {
      weapon: lerp(-30, -8, up) - 16 * kick * (1 - back), arm: lerp(70, 84, up) + 10 * kick * (1 - back), lunge: -4 * kick * (1 - back), tilt: -0.1 * kick * (1 - back),
      rig: (r) => { r.frontLeg = [2.8, 0, 2]; r.backLeg = [-3, 0, -4]; r.backArm = [-1, -2]; if (kick > 0 && back < 0.4) strikeFace(r); },
    };
  },

  // Down shot: lean out over the edge, the bow tipped down at whatever is below, a full pull, and a
  // loose that rocks her back up. Shot at 0.5.
  downshot(p) {
    const lean = ease(seg(p, 0, 0.25));
    const pull = ease(seg(p, 0.12, 0.46));
    const snap = seg(p, 0.5, 0.6);
    const back = ease(seg(p, 0.65, 1));
    return {
      weapon: lerp(0, 38, lean) * (1 - back) - 6 * snap * (1 - back), arm: lerp(95, 55, lean * (1 - back)), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.5),
      tilt: 0.3 * lean * (1 - back) - 0.08 * snap * (1 - back), lunge: 2 * lean * (1 - back),
      rig: (r) => { r.squat = lean > 0.4 && back < 0.6 ? 1 : 0; r.frontLeg = [3, 0, 4]; r.backLeg = [-3, 0, -6]; r.backArm = snap > 0 ? [q(-5 + 3 * back), 0] : [q(2 - 6 * pull), -1]; if (snap > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // Comet Arrow (the Archer's finisher): a deep crouch, a leap high into the air, a hang at the top
  // with the bow aimed straight down and a long pull (the arrow catching fire), the loose at 0.5
  // that kicks her a little higher, then the drop back down into a crouch as the comet lands.
  comet(p) {
    const crouch = bump(p, 0, 0.14);
    const up = ease(seg(p, 0.1, 0.3));
    const down = ease(seg(p, 0.56, 0.74));
    const pull = ease(seg(p, 0.24, 0.48));
    const snap = seg(p, 0.5, 0.58);
    const kick = bump(p, 0.5, 0.62);
    const land = bump(p, 0.72, 0.9);
    const high = up * (1 - down);
    return {
      weapon: lerp(0, 50, high) - 8 * snap * (1 - down), arm: lerp(95, 45, high), pull: snap > 0 ? 0 : pull, nock: snap === 0 && pull > 0.05, twang: twang(p, 0.5),
      lift: 72 * high + 8 * kick, tilt: 0.5 * high - 0.12 * snap * (1 - down),
      rig: (r) => { if (high > 0.3) tuck(r); else if (crouch > 0.3 || land > 0.3) r.squat = 2; r.backArm = snap > 0 ? [-4, 0] : [q(2 - 6 * pull), -1]; r.hairLift = high > 0.3 ? -1 : 0; r.cape -= high > 0.3 ? 3 : 0; r.eyes = pull > 0.5 && snap === 0 ? 'half' : undefined; if (snap > 0 && down < 0.5) strikeFace(r); },
    };
  },

  // Vault: a quick crouch, a spring up and over them in a front flip (the whole body turning, never
  // stretched), a light landing behind them, then the bow up and a shot back the way she came (the
  // strike turns her round). Shot at 0.8.
  vault(p) {
    const crouch = bump(p, 0, 0.16);
    const hop = Math.sin(seg(p, 0.12, 0.66) * Math.PI);
    const flip = ease(seg(p, 0.16, 0.6));
    const land = bump(p, 0.62, 0.78);
    const raise = ease(seg(p, 0.66, 0.78));
    const snap = seg(p, 0.8, 0.88);
    const back = ease(seg(p, 0.9, 1));
    return {
      weapon: lerp(30, 0, raise) - 10 * snap * (1 - back), arm: lerp(60, 95, raise), pull: snap > 0 ? 0 : raise, nock: snap === 0 && raise > 0.2, twang: twang(p, 0.8),
      lift: 40 * hop, tilt: flip * Math.PI * 2 + 0.1 * crouch, lunge: -3 * snap * (1 - back),
      rig: (r) => { if (hop > 0.2) tuck(r); else if (crouch > 0.3 || land > 0.3) r.squat = 2; r.backArm = snap > 0 ? [q(-7 + 4 * back), -3] : [q(2 - 6 * raise), -3]; r.hairLift = hop > 0.3 ? -1 : 0; r.cape -= hop > 0.3 ? 3 : 0; if (snap > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // A slide shot: drop into a low skid along the ground, loosing an arrow, then another as she
  // comes up out of it. Shots at 0.35 and 0.62.
  slideshot(p) {
    const low = ease(seg(p, 0, 0.15)) * (1 - ease(seg(p, 0.6, 0.85)));
    const k = Math.abs(Math.sin(seg(p, 0.15, 0.7) * Math.PI * 2));
    return {
      weapon: -10 * low - 4 * k, arm: 95 + 4 * k, tilt: -0.3 * low, lunge: 0, pull: 1 - k, nock: k < 0.6 && p < 0.75,
      rig: (r) => { r.squat = low > 0.4 ? 3 : low > 0.1 ? 1 : 0; r.frontLeg = [q(3 + 2 * low), 0, 30 * low]; r.backLeg = [q(-3 - 1 * low), 0, -8]; r.backArm = [q(2 - 5 * k), -3]; r.hairLift = -1; r.cape -= 3; },
    };
  },

  // ---------- Sniper: planted, patient, every bolt a heavy kick ----------

  // Drop to one knee, settle the stock, a held beat, then the bolt and a sharp kick of recoil.
  // Shot at 0.56.
  kneelshot(p) {
    const kneel = ease(seg(p, 0, 0.22));
    const hold = seg(p, 0.22, 0.56);
    const kick = seg(p, 0.56, 0.64);
    const back = ease(seg(p, 0.66, 1));
    const sway = Math.sin(hold * Math.PI * 2) * 0.6 * (1 - hold);
    return {
      weapon: sway - 16 * kick * (1 - back), arm: 92 + 10 * kick * (1 - back), lunge: -5 * kick * (1 - back * 0.7), tilt: 0.04 * kneel * (1 - kick) - 0.14 * kick * (1 - back),
      rig: (r) => { r.squat = kneel > 0.5 ? (kick > 0 && back < 0.5 ? 2 : 3) : 1; r.frontLeg = [3.4, 0, 6]; r.backLeg = [-3.6, -1, -30 * kneel * (1 - back)]; r.backArm = [q(-1 - 7 * bump(p, 0.62, 0.95)), q(-2 + 2 * bump(p, 0.62, 0.95))]; r.eyes = hold > 0.3 && kick === 0 ? 'half' : undefined; if (kick > 0 && back < 0.4) strikeFace(r); },
    };
  },

  // Crank and fire: the crossbow tipped down as she winds the crank twice, then up, a bolt, a
  // quick re-aim, and a second. Shots at 0.5 and 0.8.
  crankshot(p) {
    const down = ease(seg(p, 0, 0.12)) * (1 - ease(seg(p, 0.34, 0.44)));
    const crank = seg(p, 0.1, 0.36);
    const kick = (a) => seg(p, a, a + 0.07) * (1 - ease(seg(p, a + 0.08, a + 0.22)));
    const k = Math.max(kick(0.5), kick(0.8));
    return {
      weapon: 18 * down - 14 * k, arm: 95 - 12 * down + 8 * k, lunge: -4 * k, tilt: 0.06 * down - 0.1 * k,
      rig: (r) => { r.squat = 1; wideLegs(r); r.backArm = down > 0.3 ? [q(1 + 2 * Math.cos(crank * Math.PI * 4)), q(1 + 2 * Math.sin(crank * Math.PI * 4))] : [-1, -2]; if (k > 0.5) strikeFace(r); },
    };
  },

  // The ballista bolt: brace wide and low, a long steady aim, then a kick that shoves her back and
  // throws the crossbow up. Shot at 0.62.
  ballista(p) {
    const brace = ease(seg(p, 0, 0.22));
    const hold = seg(p, 0.22, 0.62);
    const kick = seg(p, 0.62, 0.68);
    const back = ease(seg(p, 0.72, 1));
    const shake = hold > 0.6 ? Math.sin(p * 300) * 0.8 : 0;
    return {
      weapon: shake - 34 * kick * (1 - back), arm: 92 + 22 * kick * (1 - back), lunge: -9 * kick * (1 - back * 0.5), tilt: 0.06 * brace * (1 - kick) - 0.24 * kick * (1 - back),
      rig: (r) => { r.squat = kick > 0 && back < 0.5 ? 1 : 2; wideLegs(r); r.backArm = [q(-1 - 8 * bump(p, 0.68, 0.98)), q(-2 + 2 * bump(p, 0.68, 0.98))]; r.hairLift = kick > 0 && back < 0.6 ? -1 : 0; r.cape -= kick > 0 ? 3 : 0; r.eyes = hold > 0.3 && kick === 0 ? 'half' : undefined; if (kick > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // A roll: tuck and tumble forward along the ground, and come up on one knee for the bolt.
  // Shot at 0.66.
  rollshot(p) {
    const roll = ease(seg(p, 0.02, 0.45));
    const kneel = seg(p, 0.45, 0.6);
    const kick = seg(p, 0.66, 0.74);
    const back = ease(seg(p, 0.76, 1));
    if (roll < 1) return { weapon: 40, arm: 60, tilt: roll * Math.PI * 2, lift: 4 * Math.sin(roll * Math.PI), rig: (r) => { tuck(r); r.squat = 2; r.backArm = [1, 0]; r.hairLift = -1; } };
    return {
      weapon: -16 * kick * (1 - back), arm: lerp(70, 92, ease(kneel)) + 10 * kick * (1 - back), lunge: -5 * kick * (1 - back), tilt: -0.14 * kick * (1 - back),
      rig: (r) => { r.squat = 3 - (back > 0.6 ? 2 : 0); r.frontLeg = [3.4, 0, 6]; r.backLeg = [-3.6, -1, -30 * (1 - back)]; r.backArm = [-1, -2]; if (kick > 0 && back < 0.4) strikeFace(r); },
    };
  },

  // Steady Aim: lift the crossbow to the eye, a slow breath (the body rises and settles), and a
  // calm nod.
  steadyaim(p) {
    const lift = ease(seg(p, 0, 0.25));
    const breath = Math.sin(seg(p, 0.25, 0.85) * Math.PI);
    const nod = bump(p, 0.8, 1);
    return {
      weapon: lerp(30, 0, lift), arm: lerp(60, 95, lift), lift: 1.5 * breath, tilt: -0.03 * breath + 0.04 * nod,
      rig: (r) => { r.frontLeg = [2.8, 0, 0]; r.backLeg = [-2.8, 0, 0]; r.backArm = [-1, -2]; r.eyes = breath > 0.4 ? 'blink' : undefined; },
    };
  },

  // Heartseeker (the Sniper's finisher): drop to a knee, a long, steady aim while the sights close
  // in (the body barely breathes, the bow trembles just before), then the bolt: a kick that throws
  // her back along the ground, and a slow rise. The bolt at 0.6, the shockwave at 0.74.
  heartseeker(p, dur) {
    const kneel = ease(seg(p, 0, 0.14));
    const hold = seg(p, 0.14, 0.6);
    const kick = seg(p, 0.6, 0.65);
    const back = ease(seg(p, 0.7, 1));
    const tremble = hold > 0.8 ? Math.sin(p * dur * 90) * 0.9 : Math.sin(hold * Math.PI * 3) * 0.3;
    return {
      weapon: tremble - 40 * kick * (1 - back), arm: 92 + 26 * kick * (1 - back), lunge: -10 * kick * (1 - back * 0.4), tilt: 0.05 * kneel * (1 - kick) - 0.3 * kick * (1 - back),
      rig: (r) => { r.squat = kick > 0 && back < 0.4 ? 2 : back > 0.7 ? 1 : 3; r.frontLeg = [3.4, 0, 6]; r.backLeg = [-3.6, -1, -30 * (1 - back)]; r.backArm = [-1, -2]; r.hairLift = kick > 0 && back < 0.6 ? -1 : 0; r.cape -= kick > 0 && back < 0.6 ? 4 : 0; r.eyes = hold > 0.1 && kick === 0 ? 'half' : undefined; if (kick > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // Titan Breaker (the Warrior's finisher): sink into a deep crouch with the blade drawn back,
  // spring high with it raised over the head (the giant steel sword forms above), hang a beat at the
  // top, then crash straight down splitting the ground. The crash lands at about 0.62.
  titanbreak(p, dur) {
    if (p < 0.24) {
      const t = ease(p / 0.24);
      const shake = t > 0.7 ? Math.sin(p * dur * 70) * 0.6 : 0;
      return { weapon: lerp(25, 60, t), arm: lerp(60, 40, t), lunge: -3 * t + shake, tilt: 0.08 * t, rig: (r) => { r.squat = 3; wideLegs(r); r.backArm = [2, 1]; r.eyes = t > 0.6 ? 'half' : undefined; } };
    }
    if (p < 0.56) {
      const t = ease(seg(p, 0.24, 0.42));
      const hang = Math.sin(seg(p, 0.42, 0.56) * Math.PI) * 2;
      return { weapon: lerp(60, -160, t), arm: lerp(40, 178, t), lift: 58 * t + hang, tilt: -0.14 * t, rig: (r) => { tuck(r); r.backArm = [-2, -5]; r.hairLift = -1; r.cape -= 3; strikeFace(r); } };
    }
    const t = easeIn(seg(p, 0.56, 0.62));
    const settle = seg(p, 0.7, 1);
    return {
      weapon: lerp(-160, 178, ease(seg(p, 0.56, 0.61))), arm: lerp(178, 25, t), lift: 60 * (1 - t), tilt: 0.28 * t * (1 - settle), trail: p < 0.68,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [2, 2]; strikeFace(r); },
    };
  },

  // Backstab: crouch and dart forward low through the monster (squashed thin as if into smoke),
  // then turn and stab. The game turns the hero round as the stab lands (about 0.62).
  backstab(p) {
    // She dips and melts into smoke, is gone while she slips through (the step carries her behind
    // it), then steps out of the smoke already turned with the dagger drawn back, and stabs.
    if (p < 0.45) {
      const t = seg(p, 0, 0.45);
      const dart = MOVES.dashstab(t * 0.6);
      return { ...dart, fade: clamp01(seg(t, 0.25, 0.42) * (1 - seg(t, 0.85, 1))) };
    }
    return { ...MOVES.thrust(seg(p, 0.45, 1)), fade: 1 - seg(p, 0.45, 0.52) };
  },

  // Moonlit Assassination: crouch as night falls, vanish (squashed to a sliver as she blinks from
  // monster to monster), then reappear high with the dagger raised and cut down as the crescent
  // moon falls (about 0.74), and settle.
  assassinate(p, dur) {
    if (p < 0.2) {
      const t = ease(p / 0.2);
      return { weapon: lerp(25, 70, t), arm: lerp(60, 40, t), tilt: 0.1 * t, rig: (r) => { r.squat = 3; wideLegs(r); r.backArm = [2, 1]; r.eyes = 'half'; } };
    }
    if (p < 0.62) {
      const flick = Math.abs(Math.sin(p * dur * 30));
      return { weapon: 92, arm: 100, turn: 0.08 + 0.12 * flick, stretch: 1.4, lift: 6, tilt: 0.2, rig: (r) => { tuck(r); r.hairLift = -1; } };
    }
    if (p < 0.72) {
      const t = ease(seg(p, 0.62, 0.7));
      return { weapon: lerp(-150, -150, t), arm: 178, lift: 30 * (1 - t * 0.3), tilt: -0.1, rig: (r) => { tuck(r); r.backArm = [-2, -5]; r.hairLift = -1; strikeFace(r); } };
    }
    const t = easeIn(seg(p, 0.72, 0.76));
    const settle = seg(p, 0.8, 1);
    return {
      weapon: lerp(-150, 170, ease(seg(p, 0.72, 0.76))), arm: lerp(178, 30, t), lift: 21 * (1 - t), tilt: 0.25 * t * (1 - settle), trail: p < 0.8,
      rig: (r) => { if (t < 1) tuck(r); else { r.squat = settle < 0.6 ? 3 : 1; wideLegs(r); } r.backArm = [2, 2]; strikeFace(r); },
    };
  },

  // ---------- The Thief's own swings and throws (her pool, PATH_VARIANTS in world/melee.js) ----------
  // Light, quick and acrobatic: she flips, spins and kicks where a warrior plants and heaves, and
  // springs back out of every finisher in a backflip (the hit kicks her back, `kickback`).

  // The cross-cut, quicker, then a backflip out of it. Cuts at about 0.11 and 0.36.
  crossflip(p) {
    if (p < 0.5) return MOVES.cross(p / 0.5);
    return backflip(seg(p, 0.52, 0.92), 0.6);
  },

  // ---------- The Wind Dancer's moves (her own; docs/design/wind-dancer.md) ----------
  // She moves like a dancer, never a fighter: every blow is a dance figure, and the chakram (held by
  // its rim) or the wind from her gloved hands follows the figure. Weight goes up onto her toes, the
  // free arm always finishes the line (port de bras), the working leg points, turns are clean mirror
  // flips (never a squeeze), and every figure ends in a held pose before the next. Each blow lands
  // early (about a fifth of a second in) so she still feels quick.
  // Reading at game size (the 2026-11-03 pass): her head is most of her height, so a figure only
  // reads in the silhouette round it: the working leg goes long and clear of the body (`dancerLeg`,
  // a straight leg at an angle from the hip), the body tips into the figure, and each figure has its
  // own shape. The weapon arm never rises past about 112 degrees (higher, the hand comes up over her
  // face) and a raised ring tips forward, out past her cheek; the free hand flies wide or low but
  // never above her jaw (`dancerHand`: her head starts right over the shoulders), and the arm and ring
  // keep to their drawn line with no run-on (`DANCER_LINES`). Big swings go under, never over the top.

  // Piqué cut (opener, hits at ~0.42): she sinks into a plié with the ring drawn back low behind
  // her, then steps up onto her front toe and scoops the ring under and up into a high line out in
  // front, the back leg swinging up into attitude and the free arm opening wide behind; she holds the
  // line a beat, then comes down.
  wdpique(p) {
    const prep = soft(seg(p, 0, 0.3));
    const cut = ease(seg(p, 0.3, 0.46));
    const down = soft(seg(p, 0.66, 0.9));
    const up = cut * (1 - down);
    const hop = bump(p, 0.3, 0.62);
    return {
      weapon: lerp(lerp(lerp(160, 215, prep), 70, cut), 135, down), arm: lerp(lerp(lerp(40, -60, prep), 104, cut), 52, down),
      lift: 4 * up + 5 * hop + ballon(p, 0.64), lunge: -3 * prep * (1 - cut) + 11 * up, tilt: -0.14 * prep * (1 - cut) + 0.16 * up, trail: p > 0.3 && p < 0.6,
      rig: (r) => {
        r.air = hop > 0.35;
        r.squat = q(2.5 * prep * (1 - cut));
        r.backArm = dancerHand([q(lerp(3 * prep, -9, up)), q(lerp(-2 * prep, -10, up))]);
        r.hairLift = up > 0.3 ? -1 : 0;
        r.cape -= q(4 * up);
        danceLegs(r, [prep * (1 - cut), [2.4, 0, 4], [-2.4, 0, -8]], [up, [1.6, -1, -10], dancerLeg(-72, 13.4, -50)], [hop * 0.7, [1.6, -3.4, 16], dancerLeg(-84, 13, -60)]);
        if (up > 0.3) strikeFace(r);
      },
    };
  },
  // Pirouette cut (second, hits at ~0.5): a quick plié, then one clean turn on her toe with the
  // working foot drawn up to her knee (passé), the ring out at arm's length sweeping right round her
  // and the free arm flung wide; she opens out of it with the leg
  // unfolding forward and the ring tipped up.
  wdspin(p) {
    const prep = soft(seg(p, 0, 0.18));
    const into = ease(seg(p, 0.12, 0.24));
    const a = ease(seg(p, 0.16, 0.72));
    const open = soft(seg(p, 0.72, 0.86)) * (1 - soft(seg(p, 0.9, 1)) * 0.5);
    const turning = a > 0 && a < 1;
    const sail = bump(p, 0.16, 0.76);
    return {
      weapon: lerp(lerp(150, 195, prep), 95, into) - 25 * open, arm: lerp(lerp(50, 35, prep), 96, into) + 6 * open,
      turn: turning ? dancerTurn(a) : 1,
      lift: 8 * sail - 1.5 * prep * (1 - into) + 2 * open * (1 - soft(seg(p, 0.86, 1))) + ballon(p, 0.78), lunge: 4 * sail + 3 * open, tilt: 0.08 * open * (1 - soft(seg(p, 0.9, 1))), trail: turning,
      rig: (r) => {
        r.air = sail > 0.45;
        r.squat = q(2.5 * prep * (1 - into));
        const crown = into * (1 - open);
        r.backArm = dancerHand([q(lerp(lerp(2, -10, crown), -10, open)), q(lerp(lerp(-2, -10, crown), -9, open))]);
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(5 * bump(p, 0.16, 0.76));
        danceLegs(r, [prep * (1 - into), [2.4, 0, 4], [-2.4, 0, -8]], [into, [1.6, -8, 40], [-0.4, -1.6, -8]], [open, dancerLeg(58, 14, 40), [-1, -1, -8]]);
        if (turning || open > 0.4) strikeFace(r);
      },
    };
  },
  // Arabesque (third, hits at ~0.25 and ~0.5): she tips right forward over her standing leg, the
  // back leg stretched long and high behind her and the ring thrust out in front, then flicks the
  // ring through a figure of eight for the second cut before rising out of it.
  wdarabesque(p) {
    const into = ease(seg(p, 0, 0.22));
    const fig = seg(p, 0.26, 0.52);
    const rise = soft(seg(p, 0.64, 0.9));
    const hold = into * (1 - rise);
    // A sissonne between the cuts: she springs off her standing foot, still in the line, and lands.
    const spring = bump(p, 0.26, 0.5);
    return {
      weapon: lerp(lerp(160, 105, into) + 40 * Math.sin(fig * Math.PI * 2) * (1 - rise), 140, rise), arm: lerp(lerp(50, 92, into) - 20 * Math.sin(fig * Math.PI), 52, rise),
      tilt: 0.46 * hold - 0.08 * spring, lunge: 9 * hold + 4 * spring, lift: 2 * hold + 5 * spring + ballon(p, 0.7), trail: p > 0.1 && p < 0.56,
      rig: (r) => {
        r.air = spring > 0.4;
        r.backArm = dancerHand([q(-9 * hold), q(-4 * hold)]);
        r.cape -= q(4 * hold);
        r.hairLift = hold > 0.4 ? 1 : 0;
        danceLegs(r, [hold, [1.4, -1, -6], dancerLeg(-100, 14.6, -70)], [spring * 0.8, [1.8, -4, 20], dancerLeg(-104, 14.6, -72)]);
        if (hold > 0.4) strikeFace(r);
      },
    };
  },
  // Fouetté (the finish, the gust leaves at ~0.4): a deep plié with the ring drawn right back behind
  // her, then she whips round on one toe, the working leg lashing out to the front and snapping back
  // to her knee, and flings the ring out of the turn; she ends in her big pose: ring held high out
  // in front, free arm flung wide, front foot pointed, chin up: ta-da.
  wdfouette(p) {
    const wind = soft(seg(p, 0, 0.22));
    const into = ease(seg(p, 0.18, 0.28));
    const a = ease(seg(p, 0.2, 0.4));
    const pose = soft(seg(p, 0.42, 0.58));
    const end = soft(seg(p, 0.8, 0.96));
    const turning = a > 0 && a < 1;
    const held = pose * (1 - end);
    const whip = Math.sin(a * Math.PI);
    const leap = bump(p, 0.18, 0.48);
    return {
      weapon: lerp(lerp(lerp(160, 225, wind), 95, into), 70, held) + 70 * end, arm: lerp(lerp(lerp(50, -60, wind), 96, into), 104, held) - 55 * end,
      turn: turning ? dancerTurn(a) : 1,
      lift: 10 * leap - 1.5 * wind * (1 - into) + 3 * held + ballon(p, 0.6), tilt: -0.16 * wind * (1 - into) - 0.12 * held, lunge: -5 * wind * (1 - into) + 6 * leap + 6 * held, trail: p > 0.2 && p < 0.5,
      rig: (r) => {
        r.air = leap > 0.35;
        r.squat = q(3.5 * wind * (1 - into));
        r.backArm = dancerHand(turning ? [3, -6] : [q(lerp(lerp(0, 5, wind), -10, held)), q(lerp(lerp(0, -4, wind), -10, held))]);
        r.hairLift = turning || held > 0.5 ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.2, 0.6));
        const lash = [lerp(1.6, 12.4, whip), -8, lerp(40, 50, whip)];
        danceLegs(r, [wind * (1 - into), [3, 0, 6], [-3, 0, -8]], [turning ? 1 : 0, lash, [-0.4, -1.6, -8]], [held, [8, -1, 24], [-1, -1.4, -8]]);
        if (turning || held > 0.4) strikeFace(r);
      },
    };
  },
  // Chassé cut (opener): a gliding chase step forward, the feet meeting in the air, landing long and
  // low in a lunge with the ring sweeping level out in front and the free arm stretched back.
  wdchasse(p) {
    const glide = soft(seg(p, 0, 0.5));
    const draw = soft(seg(p, 0, 0.26));
    const cut = ease(seg(p, 0.26, 0.44));
    const meet = bump(p, 0.1, 0.46);
    const land = soft(seg(p, 0.36, 0.56));
    const settle = soft(seg(p, 0.64, 0.88));
    return {
      weapon: lerp(lerp(160, 210, draw), 105, cut) + 30 * settle, arm: lerp(lerp(40, -60, draw), 88, cut) - 34 * settle,
      lunge: 15 * glide * (1 - settle * 0.4), lift: 9 * meet + ballon(p, 0.62), tilt: 0.2 * cut * (1 - settle), trail: p > 0.24 && p < 0.55,
      rig: (r) => {
        r.air = meet > 0.4;
        r.squat = q(2.5 * land * (1 - settle));
        r.backArm = dancerHand([q(-9 * glide * (1 - settle)), q(-5 * glide * (1 - settle))]);
        r.cape -= q(4 * glide);
        danceLegs(r, [meet, [2.4, -6, 30], [-3, -7, -30]], [land, [7, 0, 6], [-8, -1, -20]], [settle, [2.6, 0, 6], [-2.4, 0, -10]]);
        if (cut > 0.3 && settle < 0.5) strikeFace(r);
      },
    };
  },
  // Fan kick (second): her working leg sweeps up in a great arc in front of her and back down, her
  // body leaning back away from the kick, up on the toe of her standing foot; the ring waits drawn
  // back at her hip while the leg rises and whips out after it as the leg comes down.
  wdfankick(p) {
    const k = ease(seg(p, 0.1, 0.56));
    const back = soft(seg(p, 0.62, 0.88));
    const arc = Math.sin(k * Math.PI);
    const phi = lerp(lerp(15, 120, soft(seg(p, 0.08, 0.36))), 62, ease(seg(p, 0.36, 0.56)));
    const whip = ease(seg(p, 0.34, 0.46));
    return {
      weapon: lerp(lerp(lerp(150, 220, soft(seg(p, 0, 0.3))), 95, whip), 140, back), arm: lerp(lerp(lerp(50, -40, soft(seg(p, 0, 0.3))), 96, whip), 52, back), tilt: -0.28 * arc * (1 - back), lift: 6 * arc + ballon(p, 0.64), lunge: 5 * arc * (1 - back) + 2 * back, trail: p > 0.12 && p < 0.62,
      rig: (r) => {
        r.air = arc > 0.5;
        r.backArm = dancerHand([q(-10 * arc), q(-3 - 7 * arc)]);
        r.hairLift = arc > 0.4 ? 1 : 0;
        r.cape -= q(3 * arc);
        danceLegs(r, [ease(seg(p, 0.04, 0.16)), dancerLeg(phi, 14.6, 50), [-1, -1, -8]], [back, [2.6, 0, 6], [-2.4, 0, -10]]);
        if (arc > 0.4) strikeFace(r);
      },
    };
  },
  // Grand jeté (third): a big leap forward into the flat splits, the ring raised high out in front
  // and the free arm stretched behind, and the ring cuts down as she lands in a lunge.
  wdjete(p) {
    const up = bump(p, 0.08, 0.62);
    const raise = soft(seg(p, 0, 0.24));
    const split = soft(seg(p, 0.1, 0.28)) * (1 - soft(seg(p, 0.46, 0.6)));
    const cut = ease(seg(p, 0.42, 0.54));
    const land = bump(p, 0.56, 0.94);
    return {
      weapon: lerp(lerp(150, 68, raise), 172, cut), arm: lerp(lerp(50, 104, raise), 42, cut), lift: 25 * up - 2 * land + ballon(p, 0.8), lunge: 16 * soft(seg(p, 0.08, 0.6)), tilt: 0.1 * split + 0.18 * cut * (1 - land), trail: p > 0.42 && p < 0.64,
      rig: (r) => {
        if (up > 0.2) r.air = true;
        r.squat = q(3 * land);
        r.backArm = dancerHand([q(-10 * split - 6 * land), q(-10 * split - 3 * land)]);
        r.hairLift = up > 0.3 ? -1 : 0;
        r.cape -= q(5 * up);
        danceLegs(r, [split, [14, -14.4, 60], [-14, -14.4, -60]], [land, [6, 0, 6], [-7, -1, -16]]);
        if (cut > 0.2) strikeFace(r);
      },
    };
  },
  // Chaînés (a finish, and her Pirouette and dash): quick chained turns travelling forward up on her
  // toes, the ring trailing round her at arm's length, and she comes out of them into a deep
  // révérence: the back foot slides behind, she sinks and bows, the ring swept low and the free
  // arm opened wide.
  wdchaine(p, dur) {
    const turns = dur > 0.47 ? 2 : 1;
    const a = ease(seg(p, 0.06, 0.7)) * turns;
    const bow = soft(seg(p, 0.7, 0.88)) * (1 - soft(seg(p, 0.95, 1)));
    const turning = p > 0.06 && p < 0.7;
    return {
      weapon: turning ? 92 : lerp(110, 162, bow), arm: turning ? 96 : lerp(88, 28, bow),
      turn: turning ? dancerTurn(a) : 1,
      lift: 3 * bump(p, 0.06, 0.7) + 2.5 * Math.abs(Math.sin(a * Math.PI * 2)) * (turning ? 1 : 0), tilt: 0.42 * bow, lunge: 4 * bump(p, 0.5, 0.9), trail: turning,
      rig: (r) => {
        r.squat = q(2.5 * bow);
        r.backArm = dancerHand(turning ? [-8, -8] : [q(-10 * bow), q(-3 * bow)]);
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(3 * bump(p, 0.06, 0.7));
        danceLegs(r, [turning ? 1 : 0, [0.6, -2, 10], [-0.6, -2, -10]], [bow, [5, 0, 14], [-5, -2, -20]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning) strikeFace(r);
      },
    };
  },
  // Port de bras push (gloves, opener): both hands gather in to her chest with the front foot drawn
  // up, then she steps into a long lunge and pushes both palms out together, sending the gust.
  wdpalm(p) {
    const gather = soft(seg(p, 0, 0.28));
    const push = ease(seg(p, 0.28, 0.44));
    const back = soft(seg(p, 0.64, 0.9));
    const out = push * (1 - back);
    // A skip in: she springs off the back foot with the front knee drawn up, landing into the push.
    const skip = bump(p, 0.06, 0.34);
    return {
      weapon: 60, arm: lerp(lerp(40, 25, gather), 96, push) - 46 * back, lunge: -2 * gather * (1 - push) + 13 * out + 3 * skip, tilt: -0.1 * gather * (1 - push) + 0.22 * out, lift: 5 * skip + ballon(p, 0.62),
      rig: (r) => {
        r.air = skip > 0.4;
        r.backArm = dancerHand([q(lerp(4 * gather, 8, push) * (1 - back)), q(lerp(-6 * gather, -8, push) * (1 - back))]);
        r.squat = q(1.5 * gather * (1 - push) + 2 * out);
        r.cape -= q(3 * out);
        danceLegs(r, [gather * (1 - push), [1, -4, 20], [-1, 0, -6]], [skip * (1 - push), [1.6, -5, 26], [-2.6, -4.4, -56]], [out, [8, 0, 6], [-9, -1, -22]]);

        if (out > 0.3) strikeFace(r);
      },
    };
  },
  // Rond de bras (gloves, second): her lead arm sweeps from low behind her, down past her hip and
  // up into a high line in front like a wing, while the free arm comes down from high to low behind;
  // the body sways with it and the back leg lifts into attitude.
  wdrond(p) {
    const c = ease(seg(p, 0.08, 0.52));
    const back = soft(seg(p, 0.62, 0.88));
    const s = Math.sin(c * Math.PI);
    return {
      weapon: 60, arm: lerp(lerp(lerp(40, -15, soft(seg(p, 0, 0.08))), 108, c), 50, back), tilt: -0.16 * s + 0.12 * c * (1 - back), lunge: 7 * c * (1 - back), lift: 6 * s + ballon(p, 0.62),
      rig: (r) => {
        r.air = s > 0.55;
        r.backArm = dancerHand([q(lerp(-10, -8, c) * (1 - back * (1 - c))), q(lerp(-10, 0, c) * (1 - back))]);
        r.hairLift = c > 0.3 && c < 0.8 ? -1 : 0;
        danceLegs(r, [c * (1 - back), [1, -1, -6], dancerLeg(-62, 13.4, -60)]);
        if (c > 0.4 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Relevé (gloves, third, and her up command with either weapon): a quick plié, then she rises
  // right up onto one toe with the other foot drawn to her knee, leaning back to look up, the
  // weapon hand sweeping up into a high line in front (a chakram tipped forward) and the free arm
  // flung wide, lifting the wind and whatever is in it.
  wdrise(p) {
    const dip = soft(seg(p, 0, 0.14));
    const up = ease(seg(p, 0.14, 0.4));
    const down = soft(seg(p, 0.64, 0.9));
    const held = up * (1 - down);
    // The relevé springs into a real jump (a sauté in passé) and comes down into two little rebounds.
    const jump = bump(p, 0.14, 0.62);
    return {
      weapon: lerp(lerp(lerp(150, 200, dip), 70, up), 140, down), arm: lerp(lerp(lerp(40, -40, dip), 106, up), 52, down), lift: 4 * held + 9 * jump - 2 * dip * (1 - up) + ballon(p, 0.7), tilt: -0.18 * held, trail: p > 0.14 && p < 0.5,
      rig: (r) => {
        r.air = jump > 0.35;
        r.squat = q(2.5 * dip * (1 - up));
        r.backArm = dancerHand([q(lerp(3 * dip, -10, held)), q(lerp(-2 * dip, -10, held))]);
        r.hairLift = held > 0.4 ? -1 : 0;
        r.cape -= q(4 * held);
        danceLegs(r, [dip * (1 - up), [2.4, 0, 6], [-2.4, 0, -8]], [held, [1.8, -8, 40], [-0.4, -2, -10]]);
        if (held > 0.4) strikeFace(r);
      },
    };
  },
  // Grand port de bras (gloves, finish): a pirouette with both arms flung wide, then she opens into
  // a big pose up on her toe, the front leg kicked up high in front, glove high and free arm flung
  // wide, and the swirl of ribbons bursts round her.
  wdflourish(p) {
    const prep = soft(seg(p, 0, 0.1));
    const a = ease(seg(p, 0.08, 0.48));
    const pose = soft(seg(p, 0.48, 0.6)) * (1 - soft(seg(p, 0.8, 0.96)));
    const turning = a > 0 && a < 1;
    const sail = bump(p, 0.08, 0.5);
    return {
      weapon: 60, arm: turning ? 92 : lerp(lerp(50, 40, prep), 110, pose), orbit: false,
      turn: turning ? dancerTurn(a) : 1,
      lift: 7 * sail + 5 * pose + ballon(p, 0.6), lunge: 4 * sail + 3 * pose, tilt: -0.18 * pose,
      rig: (r) => {
        r.air = sail > 0.45;
        r.squat = q(1.5 * prep * (1 - a));
        r.backArm = dancerHand(turning ? [-9, -6] : [q(-10 * pose), q(-10 * pose)]);
        r.hairLift = turning || pose > 0.5 ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.08, 0.66));
        danceLegs(r, [prep * (1 - a), [2.4, 0, 4], [-2.4, 0, -8]], [turning ? 1 : 0, [1.6, -8, 40], [-0.4, -1.6, -8]], [pose, dancerLeg(85, 14.6, 60), [-1, -1.6, -8]]);
        if (turning || pose > 0.4) strikeFace(r);
      },
    };
  },
  // Lunge push (gloves, a finish): she twists away, glove drawn back behind her and the free hand
  // forward, then drives into a deep lunge with both palms thrust out after the gust.
  wdlunge(p) {
    const twist = soft(seg(p, 0, 0.34));
    const drive = ease(seg(p, 0.34, 0.5));
    const back = soft(seg(p, 0.68, 0.92));
    const out = drive * (1 - back);
    // A coupé hop as she twists away, then the drive.
    const hop = bump(p, 0.12, 0.38);
    return {
      weapon: 60, arm: lerp(lerp(40, -40, twist), 94, drive) - 44 * back, lunge: -5 * twist * (1 - drive) + 15 * out, tilt: -0.18 * twist * (1 - drive) + 0.24 * out, lift: 5 * hop + ballon(p, 0.66),
      rig: (r) => {
        r.air = hop > 0.4;
        r.backArm = dancerHand([q(lerp(6 * twist, 8, drive) * (1 - back)), q(lerp(-5 * twist, -9, drive) * (1 - back))]);
        r.squat = q(2 * twist * (1 - drive) + 3 * out);
        r.hairLift = out > 0.4 ? 1 : 0;
        r.cape -= q(5 * out);
        danceLegs(r, [twist * (1 - drive), [2, 0, 4], [-3, 0, -8]], [hop * 0.8 * (1 - drive), ...SAUTE], [out, [9, 0, 6], [-10, -1, -24]]);
        if (out > 0.3) strikeFace(r);
      },
    };
  },
  // In the air: a tucked turn with the ring out at arm's length (she hangs a moment) opening into a
  // star, and a flat split with the ring raised that cuts down as she drops.
  wdairspin(p) {
    const a = ease(seg(p, 0.05, 0.78));
    const turning = p > 0.05 && p < 0.78;
    const open = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(95, 70, open), arm: lerp(96, 100, open), trail: turning, lift: 6 * bump(p, 0, 0.85),
      turn: turning ? dancerTurn(a) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-10, -10, open)), q(lerp(-10, -9, open))]);
        r.hairLift = -1;
        danceLegs(r, [1, [3, -11, 50], [-1, -9, 20]], [open, [9, -7, 40], [-9, -8, -40]]);
        strikeFace(r);
      },
    };
  },
  wdairsplit(p) {
    const raise = soft(seg(p, 0, 0.25));
    const split = raise * (1 - soft(seg(p, 0.58, 0.85)));
    const cut = ease(seg(p, 0.32, 0.48));
    return {
      weapon: lerp(lerp(120, 68, raise), 172, cut), arm: lerp(lerp(70, 104, raise), 38, cut), lift: 5 * split - 2 * cut * (1 - soft(seg(p, 0.7, 1))), lunge: 4 * cut, tilt: 0.24 * cut * (1 - soft(seg(p, 0.7, 1))), trail: p > 0.3 && p < 0.6,

      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(-10 * raise), q(lerp(-10, -4, cut) * raise)]);
        r.hairLift = -1;
        danceLegs(r, [1, [4, -8, 30], [-4, -7, -30]], [split, [14, -14.4, 60], [-14, -14.4, -60]]);
        if (cut > 0.2) strikeFace(r);
      },
    };
  },
  // Grand Finale (her finisher, 1.5 s): she rises onto her toes as the spotlight drops, spins three
  // times like a music-box dancer, rising higher with the ring lifting out in front and her free arm
  // opening wide; opens into her biggest pose as the rose of ribbons bursts (~0.74): up on one toe,
  // the front leg kicked up high, ring high out in front, free arm wide, chin up; then
  // sinks into a deep bow to the crowd.
  wdencore(p) {
    const rise = soft(seg(p, 0, 0.12));
    const a = ease(seg(p, 0.12, 0.64)) * 3;
    const turning = p > 0.12 && p < 0.64;
    const armsUp = soft(seg(p, 0.12, 0.6));
    const pose = soft(seg(p, 0.64, 0.73));
    const bow = soft(seg(p, 0.86, 0.95));
    const end = soft(seg(p, 0.97, 1));
    const armT = lerp(lerp(50, 88, rise), 104, armsUp);
    const wT = lerp(lerp(150, 100, rise), 72, armsUp);
    return {
      weapon: lerp(lerp(lerp(wT, 70, pose), 165, bow), 140, end), arm: lerp(lerp(lerp(armT, 106, pose), 25, bow), 50, end),
      turn: turning ? dancerTurn(a) : 1,
      lift: (3 * rise + 4 * armsUp + 3 * pose) * (1 - bow) + 7 * bump(p, 0.6, 0.8) + ballon(p, 0.78) * 0.7 * (1 - bow), tilt: -0.16 * pose * (1 - bow) + 0.42 * bow * (1 - end), trail: turning,
      rig: (r) => {
        r.air = bump(p, 0.6, 0.8) > 0.5;
        r.squat = q(2 * bow * (1 - end));
        const up = lerp(armsUp, 1, pose);
        r.backArm = dancerHand([q(lerp(lerp(-2, -10, up), -10, bow) * (1 - end)), q(lerp(lerp(-6, -10, up), -2, bow) * (1 - end))]);
        r.hairLift = turning || pose > 0.4 ? -1 : 0;
        r.cape -= q(5 * (turning ? 1 : pose * (1 - bow)));
        danceLegs(r, [rise, [0.6, -2, 6], [-0.6, -2, -6]], [turning ? 1 : 0, [1.6, -8, 40], [-0.4, -1.6, -8]], [pose, dancerLeg(80, 14, 50), [-1, -1.6, -8]], [bow, [5, 0, 14], [-5, -2, -20]], [end, [2.4, 0, 6], [-2.4, 0, -8]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning || pose > 0.3) strikeFace(r);
      },
    };
  },

  // ---------- The Blade Dancer's moves (her own; docs/design/blade-dancer.md) ----------
  // A ring-throwing showgirl: every figure is a throw or a catch. The ring leaves her hand on the
  // release frame (`thrown`, so the hand is empty while it flies) and comes home on a turn. Each
  // throw has its own line while the ring flies (a pointing hand, a crouch, crossed arms sprung
  // open, a lunge with the free arm thrown high), so an empty hand is never a plain stance. Throws
  // stay low, sidearm or underhand so neither the ring nor her arm crosses her face, and every
  // figure ends in a held, showy pose.

  // Backhand flick (opener, the ring leaves at ~0.34 and is caught back at ~0.86): the ring drawn
  // across to her far hip, then flicked out backhand with a snap and a step up onto her toe; while
  // it flies she points after it, back leg lifted and free arm flung back, then plucks it out
  // of the air coming home.
  bdflick(p) {
    const wind = soft(seg(p, 0, 0.28));
    // A showgirl's skip into the throw, front knee popped up.
    const skip = bump(p, 0.02, 0.3);
    const flick = ease(seg(p, 0.28, 0.4));
    const catchIt = soft(seg(p, 0.82, 0.96));
    const held = flick * (1 - catchIt);
    return {
      weapon: lerp(lerp(150, 240, wind), 95, flick) + 45 * catchIt, arm: lerp(lerp(50, 10, wind), 100, flick) - 46 * catchIt,
      thrown: rel(p, 0.34, 0.86), lunge: -2 * wind * (1 - flick) + 8 * held, tilt: -0.12 * wind * (1 - flick) + 0.18 * held, lift: 2 * held + 4 * skip + ballon(p, 0.46),
      rig: (r) => {
        r.air = skip > 0.4;
        r.backArm = dancerHand([q(lerp(5 * wind, -10, flick) * (1 - catchIt)), q(lerp(-5 * wind, -10, flick) * (1 - catchIt))]);
        r.squat = q(1.5 * wind * (1 - flick));
        r.cape -= q(3 * flick);
        danceLegs(r, [wind * (1 - flick), [0.4, 0, 4], [-1.6, 0, -6]], [skip, ...KICKLINE], [held, [2, -1, -8], dancerLeg(-68, 12.4, -50)], [catchIt, [2.6, 0, 6], [-2.4, 0, -10]]);
        if (flick > 0.3 && p < 0.8) strikeFace(r);
      },
    };
  },
  // Cross toss (second, two rings at ~0.3 and ~0.5): a sidearm ring from her weapon hand, then one
  // from the free hand as the weapon arm sweeps back in, so for a beat her arms are crossed over her
  // chest; then they spring open like a fan, up on her toe with the back leg out.
  bdcross(p) {
    const one = ease(seg(p, 0.16, 0.3));
    const two = ease(seg(p, 0.36, 0.5));
    const open = soft(seg(p, 0.6, 0.76));
    const fin = soft(seg(p, 0.84, 1));
    // A hop on the second toss, then the arms spring open and she bounces on it.
    const hop = bump(p, 0.3, 0.56);
    return {
      weapon: lerp(lerp(220, 100, one), 130, fin), arm: lerp(lerp(lerp(lerp(40, 20, soft(seg(p, 0, 0.16))), 85, one), 30, two), 102, open) - 50 * fin, thrown: rel(p, 0.3, 0.92),
      lunge: 6 * one * (1 - fin) + 3 * hop, tilt: 0.1 * one * (1 - open) - 0.1 * open * (1 - fin), lift: 3 * open * (1 - fin) + 5 * hop + ballon(p, 0.64),
      rig: (r) => {
        r.air = hop > 0.4;
        r.backArm = dancerHand([q(lerp(lerp(lerp(0, -6, one), 9, two), -10, open) * (1 - fin)), q(lerp(lerp(lerp(0, -4, one), -6, two), -10, open) * (1 - fin))]);
        r.cape -= q(3 * one);
        r.hairLift = open > 0.4 && fin < 0.5 ? -1 : 0;
        danceLegs(r, [one, [5, 0, 6], [-5, -1, -14]], [two, [1.6, -1, 4], [-1.4, 0, -4]], [hop * (1 - open), ...KICKLINE], [open, [1, -1.6, -8], dancerLeg(-58, 12.6, -40)], [fin, [2.6, 0, 6], [-2.4, 0, -10]]);
        if (one > 0.4 && fin < 0.5) strikeFace(r);
      },
    };
  },
  // Turning catch (third, cuts all round her at ~0.5): she turns on her toe to meet the ring coming
  // home, foot drawn to her knee and free arm wide, catches it out at arm's length and its spin
  // carries it right round her; she settles into a lunge with the ring out in front.
  bdcatch(p) {
    const a = ease(seg(p, 0.1, 0.62));
    const turning = a > 0 && a < 1;
    const settle = soft(seg(p, 0.64, 0.86)) * (1 - soft(seg(p, 0.94, 1)) * 0.6);
    return {
      weapon: 95 + 10 * Math.sin(a * Math.PI * 2), arm: 96 - 8 * settle, thrown: rel(p, 0, 0.42),
      turn: turning ? dancerTurn(a) : 1,
      lift: 8 * bump(p, 0.1, 0.64) + ballon(p, 0.72), lunge: 4 * bump(p, 0.1, 0.64) + 8 * settle, tilt: 0.18 * settle, trail: p > 0.42 && p < 0.66,
      rig: (r) => {
        r.air = bump(p, 0.1, 0.64) > 0.45;
        r.squat = q(2.5 * settle);
        r.backArm = dancerHand(turning ? [-10, -10] : [q(lerp(-6, -10, settle)), q(lerp(-10, -8, settle))]);
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.1, 0.66));
        danceLegs(r, [turning ? 1 : 0, [1.6, -8, 40], [-0.4, -1.6, -8]], [settle, [6, 0, 6], [-7, -1, -16]]);
        if (turning) strikeFace(r);
      },
    };
  },
  // Hoopla (the ring leaves at ~0.42): she swings the big ring back low behind her hip, rising up
  // on her toes, and lofts it underhand high in front, the throwing arm following through up over
  // her head, back leg kicked up behind; she holds it on one toe, free hand on her hip, watching it
  // drop, then claps her hands together as it lands.
  bdhoopla(p) {
    const back = soft(seg(p, 0, 0.3));
    const toss = ease(seg(p, 0.3, 0.44));
    const hold = soft(seg(p, 0.44, 0.6));
    const clap = soft(seg(p, 0.72, 0.84));
    const end = soft(seg(p, 0.9, 1));
    return {
      weapon: lerp(lerp(200, 230, back), 120, toss), arm: lerp(lerp(lerp(lerp(40, -40, back), 110, toss), 100, hold), 70, clap) - 20 * end, thrown: rel(p, 0.42, 1.01),
      lunge: -3 * back * (1 - toss) + 6 * toss, tilt: -0.12 * back * (1 - toss) - 0.1 * toss * (1 - clap), lift: 3 * toss * (1 - end) + ballon(p, 0.86) * 0.5,
      rig: (r) => {
        r.squat = q(2 * back * (1 - toss));
        r.backArm = dancerHand([q(lerp(lerp(-3, -6, toss), 6, clap) * (1 - end)), q(lerp(lerp(2, 1, toss), -4, clap) * (1 - end))]);
        r.hairLift = toss > 0.3 && clap < 0.5 ? -1 : 0;
        danceLegs(r, [back * (1 - toss), [3, 0, 6], [-4, 0, -10]], [toss * (1 - clap), [1, -1, 0], [-8, -8, -70]], [clap, [2, -2, 8], [-3, -3, -14]], [end, [2, 0, 6], [-2, 0, -8]]);
        if (clap > 0.5) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (toss > 0.2) strikeFace(r);
      },
    };
  },
  // Juggling Act (the rings fly at ~0.66): she bobs on her heels juggling, both hands taking turns
  // to toss up over her head as the rings cascade above her (the bdjuggle effect), smiling;
  // then she catches all three, coils with them drawn behind her and sweeps her arm round flat to
  // fling them out in a fan, landing in a lunge with the free arm flung back high.
  bdjuggle(p) {
    const jug = soft(seg(p, 0, 0.08)) * (1 - soft(seg(p, 0.5, 0.56)));
    const tossA = Math.max(0, Math.sin(p * Math.PI * 10));
    const tossB = Math.max(0, -Math.sin(p * Math.PI * 10));
    const coil = soft(seg(p, 0.52, 0.62)) * (1 - ease(seg(p, 0.62, 0.68)));
    const fling = ease(seg(p, 0.62, 0.68));
    const end = soft(seg(p, 0.86, 1));
    const bob = Math.abs(Math.sin(p * Math.PI * 10)) * jug;
    return {
      weapon: lerp(lerp(lerp(90, 60, jug), 220, coil), 95, fling), arm: lerp(lerp(lerp(lerp(50, 70 + 40 * tossA, jug), -40, coil), 92, fling), 50, end), thrown: rel(p, 0, 0.6) || rel(p, 0.66, 1.01),
      lunge: 10 * fling * (1 - end * 0.6), tilt: -0.08 * jug + 0.24 * fling * (1 - end), lift: 1.5 * bob,
      rig: (r) => {
        r.squat = q(1.5 * bob + 3 * fling * (1 - end));
        r.backArm = dancerHand([q(lerp(lerp(lerp(-2, -3 - 6 * tossB, jug), 6, coil), -10, fling) * (1 - end)), q(lerp(lerp(lerp(2, -2 - 8 * tossB, jug), -2, coil), -8, fling) * (1 - end))]);
        r.hairLift = fling > 0.4 && end < 0.5 ? 1 : 0;
        r.cape -= q(4 * fling * (1 - end));
        danceLegs(r, [jug, [2 + bob, -bob, 10 * bob], [-2, 0, -6]], [coil, [3, 0, 6], [-5, 0, -12]], [fling, [9, 0, 6], [-11, -3, -40]], [end, [2, 0, 6], [-2, 0, -10]]);
        if (jug > 0.5) r.eyes = 'happy';
        else if (fling > 0.2) strikeFace(r);
      },
    };
  },
  // Showstopper (~0.9, the confetti at ~0.5): she twirls the ring out at arm's length, rising on
  // her toes, catches it with a flourish and sweeps it out wide, then sinks into a deep showgirl bow,
  // the ring held out to the side, the free arm swept back, one foot tucked behind; and winks.
  bdbow(p) {
    const twirl = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.36, 0.48)));
    const sweep = soft(seg(p, 0.36, 0.5));
    const bow = soft(seg(p, 0.5, 0.66)) * (1 - soft(seg(p, 0.88, 1)));
    return {
      weapon: lerp(lerp(90, 90 + 25 * Math.sin(p * 40), twirl), 150, sweep), arm: lerp(lerp(lerp(50, 92, twirl), 40, sweep), 20, bow), lift: 3 * twirl,
      tilt: 0.38 * bow, lunge: 2 * bow,
      rig: (r) => {
        r.squat = q(3 * bow);
        r.backArm = dancerHand([q(lerp(lerp(-2, -4, twirl), -9, sweep) * (1 - bow * 0.2)), q(lerp(lerp(2, 0, twirl), -6, sweep))]);
        danceLegs(r, [twirl, [1, -1, 0], [-0.6, -1, -6]], [bow, [4, 0, 8], [-5, -2, -30]]);
        if (bow > 0.5) r.eyes = 'wink';
        else if (twirl > 0.4) r.eyes = 'happy';
      },
    };
  },
  // Sidearm hurl (the finish, the ring leaves at ~0.45): she coils deep, the ring drawn right round
  // behind her hip and her free hand aimed forward, then unwinds and hurls it sidearm down the line,
  // driving into a deep lunge with the back leg stretched long and the free arm thrown high behind
  // her: a showgirl's flourish, held while the ring ricochets.
  bdhurl(p) {
    const coil = soft(seg(p, 0, 0.34));
    const hurl = ease(seg(p, 0.34, 0.46));
    const pose = soft(seg(p, 0.46, 0.6)) * (1 - soft(seg(p, 0.84, 0.98)));
    const fade = soft(seg(p, 0.84, 0.98));
    // She leaps into the hurl off the coil and lands driving into the lunge.
    const leap = bump(p, 0.26, 0.5);
    return {
      weapon: lerp(lerp(160, 250, coil), 90, hurl), arm: lerp(lerp(lerp(45, -55, coil), 96, hurl), 80, pose) - 30 * fade, thrown: rel(p, 0.45, 1.01),
      lunge: -6 * coil * (1 - hurl) + 6 * leap + 15 * hurl * (1 - fade * 0.6), tilt: -0.22 * coil * (1 - hurl) + 0.34 * hurl * (1 - fade), lift: 8 * leap - 1.5 * coil * (1 - hurl) + ballon(p, 0.64),
      rig: (r) => {
        r.air = leap > 0.35;
        r.squat = q(3 * coil * (1 - hurl) + 4 * pose);
        r.backArm = dancerHand([q(lerp(lerp(0, 7, coil), -10, hurl) * (1 - fade)), q(lerp(lerp(0, -7, coil), -3, hurl) * (1 - fade))]);
        r.hairLift = hurl > 0.4 ? 1 : 0;
        r.cape -= q(5 * hurl);
        danceLegs(r, [coil * (1 - hurl), [3, 0, 6], [-5, 0, -12]], [leap * (1 - hurl), ...KICKLINE], [hurl, [9, 0, 6], [-12, -3, -40]], [fade, [2.6, 0, 6], [-2.4, 0, -10]]);
        if (hurl > 0.3) strikeFace(r);
      },
    };
  },
  // Skimming throw (opener): she drops into a low crouch, back knee almost to the floor, and skims
  // the ring out along the ground; she holds the crouch, hand out after it, while it flies.
  bdskip(p) {
    const low = soft(seg(p, 0, 0.26));
    const go = ease(seg(p, 0.3, 0.42));
    const up = soft(seg(p, 0.74, 0.94));
    const crouch = low * (1 - up);
    // A skip drops her into the crouch; she pops back up out of it with a bounce.
    const skip = bump(p, 0, 0.24);
    return {
      weapon: lerp(lerp(150, 215, low), 110, go) + 25 * up, arm: lerp(lerp(45, -20, low), 70, go) - 20 * up, thrown: rel(p, 0.4, 0.88),
      lunge: 4 * skip + 11 * go * (1 - up * 0.5), tilt: 0.32 * crouch, lift: 5 * skip + 3 * bump(p, 0.74, 0.92) + ballon(p, 0.86) * 0.6,
      rig: (r) => {
        r.air = skip > 0.45 || bump(p, 0.74, 0.92) > 0.6;
        r.squat = q(5 * crouch);
        r.backArm = dancerHand([q(lerp(-9, -10, go) * crouch), q(lerp(-4, -5, go) * crouch)]);
        r.hairLift = go > 0.3 && up < 0.5 ? 1 : 0;
        danceLegs(r, [crouch, [7, 0, 10], [-7, -1, -30]]);
        if (go > 0.3 && up < 0.5) strikeFace(r);
      },
    };
  },
  // Lasso (second): free hand on her hip, front foot pointed, she swings the ring in a pendulum
  // below her hand, faster and wider each pass, then sweeps it up and lets it fly forward, stepping
  // into a lunge pointing after it.
  bdlasso(p) {
    const wind = seg(p, 0, 0.5);
    const go = ease(seg(p, 0.48, 0.58));
    const back = soft(seg(p, 0.76, 0.96));
    const swing = 180 + 30 * (0.5 + 0.5 * wind) * Math.sin(wind * wind * Math.PI * 5);
    // She bobs on her heels with each pass of the lasso, then leaps after the throw.
    const bob = Math.abs(Math.sin(wind * wind * Math.PI * 5)) * (1 - go);
    const leap = bump(p, 0.44, 0.7);
    return {
      weapon: lerp(lerp(swing, 70, go), 130, back), arm: lerp(lerp(lerp(50, 76, soft(seg(p, 0, 0.12))), 102, go), 52, back), thrown: rel(p, 0.55, 0.92),
      lunge: 9 * go * (1 - back) + 3 * leap, tilt: -0.1 * wind * (1 - go) + 0.16 * go * (1 - back), lift: 1.5 * bob * wind + 6 * leap + ballon(p, 0.74),
      rig: (r) => {
        r.air = leap > 0.4;
        r.backArm = dancerHand([q(lerp(lerp(0, 3, soft(seg(p, 0, 0.12))), -10, go) * (1 - back)), q(lerp(-1, -10, go) * (1 - back))]);
        r.cape -= q(2 * wind);
        danceLegs(r, [soft(seg(p, 0, 0.12)) * (1 - go), [6, -1, 30], [-2, 0, -6]], [leap * (1 - go), ...KICKLINE], [go * (1 - back), [7, 0, 6], [-7, -1, -18]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // Lob (third, and her up command): a dip, then an underhand lob that sends the ring arcing up over
  // them; she rises onto her toe after it, hand still raised and the back leg lifted behind.
  bdlob(p) {
    const dip = soft(seg(p, 0, 0.24));
    const lob = ease(seg(p, 0.24, 0.38));
    const down = soft(seg(p, 0.66, 0.9));
    const held = lob * (1 - down);
    // She springs up after the ring as it goes, and lands into two little bounces.
    const spring = bump(p, 0.24, 0.58);
    return {
      weapon: lerp(lerp(lerp(160, 200, dip), 62, lob), 135, down), arm: lerp(lerp(lerp(40, -40, dip), 106, lob), 52, down), thrown: rel(p, 0.33, 0.9),
      lift: 4 * held + 8 * spring - 2 * dip * (1 - lob) + ballon(p, 0.68), lunge: 3 * spring, tilt: -0.18 * held,
      rig: (r) => {
        r.air = spring > 0.35;
        r.squat = q(2 * dip * (1 - lob));
        r.backArm = dancerHand([q(lerp(3 * dip, -8, held)), q(lerp(-3 * dip, -3, held))]);
        r.hairLift = held > 0.4 ? -1 : 0;
        danceLegs(r, [dip * (1 - lob), [2.4, 0, 4], [-2.4, 0, -8]], [held, [0.6, -2, -10], dancerLeg(-60, 12.4, -40)]);
        if (lob > 0.3) strikeFace(r);
      },
    };
  },
  // Spinning hurl (a finish): two quick turns on her toe, the ring swinging out at arm's length and
  // her free arm wide, and she lets it go out of the second, tipping straight into an
  // arabesque that points after it.
  bdspinhurl(p) {
    const a = ease(seg(p, 0.04, 0.46)) * 2;
    const turning = p > 0.04 && p < 0.46;
    const pose = soft(seg(p, 0.46, 0.58)) * (1 - soft(seg(p, 0.84, 0.98)));
    return {
      weapon: turning ? 95 : lerp(130, 90, pose), arm: turning ? 94 : lerp(55, 96, pose), thrown: rel(p, 0.46, 1.01),
      turn: turning ? dancerTurn(a) : 1,
      lift: 6 * bump(p, 0.04, 0.5) + 2 * pose + ballon(p, 0.64), tilt: 0.4 * pose, lunge: 4 * bump(p, 0.04, 0.5) + 7 * pose, trail: turning,
      rig: (r) => {
        r.backArm = dancerHand(turning ? [-10, -10] : [q(-10 * pose), q(-4 * pose)]);
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.04, 0.64));
        danceLegs(r, [turning ? 1 : 0, [1.6, -8, 40], [-0.4, -1.6, -8]], [pose, [1.4, -1, -6], dancerLeg(-100, 14.6, -70)]);
        if (turning || pose > 0.3) strikeFace(r);
      },
    };
  },
  // In the air: the ring raised out in front, then flicked down at whatever is below, legs kicking
  // out from a tuck.
  bdairflick(p) {
    const wind = soft(seg(p, 0, 0.22));
    const go = ease(seg(p, 0.22, 0.4));
    return {
      weapon: lerp(lerp(90, 68, wind), 150, go), arm: lerp(lerp(80, 104, wind), 45, go), thrown: rel(p, 0.4, 0.95), tilt: 0.22 * go, lift: 4 * wind * (1 - go) + 2 * bump(p, 0.4, 1),
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-9 * wind, -10, go)), q(lerp(-10 * wind, -6, go))]);
        danceLegs(r, [wind * (1 - go), [3, -10, 50], [-1, -9, 30]], [go, [9, -6, 40], [-10, -9, -50]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // In the air, the second: she tucks tight, both hands gathered low, then scissors both arms down
  // and out, flinging a ring from each hand at whatever is below, legs split wide behind the throw.
  bdairtwin(p) {
    const tuck = soft(seg(p, 0, 0.28));
    const go = ease(seg(p, 0.28, 0.42));
    const open = soft(seg(p, 0.55, 0.85));
    return {
      weapon: lerp(lerp(150, 200, tuck), 150, go), arm: lerp(lerp(70, 35, tuck), 60, go), thrown: rel(p, 0.38, 0.96), tilt: -0.12 * tuck * (1 - go) + 0.18 * go * (1 - open), lift: 4 * tuck * (1 - go) + 2.5 * bump(p, 0.42, 1),
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(4 * tuck, -10, go)), q(lerp(-5 * tuck, -3, go))]);
        r.hairLift = go > 0.3 ? -1 : 0;
        danceLegs(r, [tuck * (1 - go), [3, -10, 50], [-1, -9, 30]], [go, [13, -12, 60], [-13, -12, -60]], [open, [5, -7, 30], [-5, -7, -30]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // Out of a run: she drops into a slide on her back knee, leaning back, free arm out behind for
  // balance, and skims the ring out of the slide.
  bdslide(p) {
    const slide = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.8, 1)));
    const draw = soft(seg(p, 0, 0.3));
    const go = ease(seg(p, 0.3, 0.42));
    return {
      weapon: lerp(lerp(160, 210, draw), 105, go), arm: lerp(lerp(40, -10, draw), 75, go), thrown: rel(p, 0.42, 0.9), lunge: 13 * slide, tilt: -0.26 * slide, lift: 5 * bump(p, 0.78, 0.98),
      rig: (r) => {
        r.air = bump(p, 0.78, 0.98) > 0.5;

        r.squat = q(5 * slide);
        r.backArm = dancerHand([q(-9 * slide), q(-10 * slide)]);
        r.hairLift = slide > 0.4 ? 1 : 0;
        r.cape -= q(4 * slide);
        danceLegs(r, [slide, [8, 0, 10], [-9, -1, -40]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // Golden Carousel (her finisher, 1.6 s): she rises onto her toes with the ring raised out in front
  // and turns, slowly then faster and faster, climbing higher as the rings gather round her like a
  // carousel; at the top she coils, ring drawn back behind her, and flings it (~0.66): a big held
  // throw high in the air, tipped into an arabesque, free arm back; she catches her ring as it
  // comes home and curtsies.
  bdcarousel(p) {
    const rise = soft(seg(p, 0, 0.12));
    const a = easeIn(seg(p, 0.1, 0.58)) * 3;
    const turning = p > 0.1 && p < 0.58;
    const raise = soft(seg(p, 0.04, 0.2));
    const climb = soft(seg(p, 0.3, 0.6));
    const coil = soft(seg(p, 0.57, 0.63));
    const fling = ease(seg(p, 0.63, 0.67));
    const pose = fling * (1 - soft(seg(p, 0.88, 0.94)));
    const bow = soft(seg(p, 0.9, 0.97));
    const end = soft(seg(p, 0.98, 1));
    const armT = lerp(lerp(50, 100, raise), -40, coil);
    const wT = lerp(lerp(150, 72, raise), 230, coil);
    return {
      weapon: lerp(lerp(lerp(wT, 90, fling), 165, bow), 140, end), arm: lerp(lerp(lerp(armT, 98, fling), 30, bow), 50, end), thrown: rel(p, 0.66, 0.9),
      turn: turning ? dancerTurn(a) : 1,
      lift: (3 * rise + 9 * climb) * (1 - soft(seg(p, 0.7, 0.92))) + 2 * pose + 5 * bump(p, 0.6, 0.78) + ballon(p, 0.76) * 0.7 * (1 - bow), tilt: -0.18 * coil * (1 - fling) + 0.28 * pose + 0.35 * bow * (1 - end), lunge: 7 * pose, trail: turning,
      rig: (r) => {
        r.squat = q(2 * bow * (1 - end));
        const up = raise;
        r.backArm = dancerHand([q(lerp(lerp(lerp(-10 * up, 7, coil), -10, fling), -10, bow) * (1 - end)), q(lerp(lerp(lerp(-10 * up, -7, coil), -4, fling), -2, bow) * (1 - end))]);
        r.hairLift = turning || pose > 0.4 ? -1 : 0;
        r.cape -= q(5 * (turning ? 1 : pose));
        danceLegs(r, [rise, [0.6, -2, 6], [-0.6, -2, -6]], [turning ? 1 : 0, [1.6, -8, 40], [-0.4, -1.6, -8]], [coil, [3, -9, 40], [-2, -8, 30]], [pose, [2, -2, -10], dancerLeg(-96, 14.4, -60)], [bow, [5, 0, 14], [-5, -2, -20]], [end, [2.4, 0, 6], [-2.4, 0, -8]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning || pose > 0.3) strikeFace(r);
      },
    };
  },

  // The Wind Dancer's skills, her way (data/skills.js `paths`):
  // Ring promenade (her Pirouette, cuts at ~0.25 and ~0.55): up on her toes she promenades forward
  // in two slow showgirl turns, back leg lifted in attitude and the ring swung out at arm's length
  // (both rings whirl round her waist, the bdorbit effect); out of the second turn she stops dead
  // and pops her hip, free hand on it and the ring held up out to the side, with a wink.
  bdpromenade(p) {
    const rise = soft(seg(p, 0, 0.1));
    const a = ease(seg(p, 0.08, 0.62)) * 2;
    const turning = p > 0.08 && p < 0.62;
    const pop = soft(seg(p, 0.64, 0.8));
    const hit = bump(p, 0.6, 0.76);
    return {
      weapon: turning ? 100 + 10 * Math.sin(a * Math.PI * 2) : lerp(108, 128, pop), arm: turning ? 98 : lerp(92, 66, pop),
      turn: turning ? dancerTurn(a) : 1,
      lift: 3 * rise * (1 - pop) + (turning ? 3 * Math.abs(Math.sin(a * Math.PI)) : 0) + 3 * hit + ballon(p, 0.78) * 0.6,
      tilt: -0.08 * rise * (1 - pop) + 0.14 * hit - 0.08 * pop, lunge: 3 * bump(p, 0.5, 0.82), trail: turning,
      rig: (r) => {
        r.air = turning && Math.abs(Math.sin(a * Math.PI)) > 0.6;
        r.backArm = turning ? dancerHand([-10, -9]) : [q(lerp(-8, 0.6, pop)), q(lerp(-7, -4.2, pop))];
        // (Hand on her hip: the elbow juts out toward the viewer, a bend in depth, never backward.)
        if (pop > 0.5) r.armSide = 0;
        r.hairLift = turning ? -1 : hit > 0.4 ? 1 : 0;
        r.cape -= q(4 * bump(p, 0.08, 0.66));
        danceLegs(r, [rise, [0.6, -2, 6], [-0.6, -2, -6]], [turning ? 1 : 0, [1, -2, 8], dancerLeg(-80, 13, -50)], [pop, [3, 0, 6], [-1.4, -1.6, -24]]);
        if (pop > 0.5) [r.eyes, r.mouth] = ['wink', 'grin'];
        else if (turning) strikeFace(r);
      },
    };
  },
  // Ring revue (her Grand Finale, 1.35 s; cuts from ~0.28, the big one at ~0.74): she tosses her
  // ring straight up underhand and, empty-handed, turns under it faster and faster, arms raised in a
  // wide V, as rose-gold rings cascade round her (the bdrevue effect); she catches it coming down
  // and snaps into a showgirl's high kick, the ring thrust out and every ring flying out with it;
  // then a "ta-da": arms flung wide and low, feet crossed, a wink.
  bdrevue(p) {
    const dip = soft(seg(p, 0, 0.08));
    const toss = ease(seg(p, 0.08, 0.14));
    const a = easeIn(seg(p, 0.16, 0.62)) * 3;
    const turning = p > 0.16 && p < 0.62;
    const vee = soft(seg(p, 0.14, 0.24)) * (1 - soft(seg(p, 0.6, 0.66)));
    const grab = soft(seg(p, 0.62, 0.68));
    const kick = ease(seg(p, 0.68, 0.74)) * (1 - soft(seg(p, 0.86, 0.92)));
    const tada = soft(seg(p, 0.88, 0.96));
    return {
      weapon: lerp(lerp(lerp(lerp(150, 200, dip), 40, toss), 100, grab), 160, tada), arm: lerp(lerp(lerp(lerp(lerp(50, 0, dip), 104, toss), 100, vee), 96, kick), 34, tada),
      thrown: rel(p, 0.13, 0.64), turn: turning ? dancerTurn(a) : 1,
      lift: 2 * toss * (1 - vee) + 10 * soft(seg(p, 0.2, 0.6)) * (1 - grab) + 4 * bump(p, 0.62, 0.74) + ballon(p, 0.74) * (1 - tada),
      tilt: -0.1 * dip * (1 - toss) - 0.12 * kick + 0.06 * tada, lunge: 5 * kick, trail: turning,
      rig: (r) => {
        r.air = turning || bump(p, 0.62, 0.74) > 0.5;
        r.squat = q(2 * dip * (1 - toss) + 1.5 * bump(p, 0.86, 0.94));
        r.backArm = dancerHand([q(lerp(lerp(lerp(0, -10, vee), -10, kick), -10, tada)), q(lerp(lerp(lerp(-2, -10, vee), -10, kick), -1, tada))]);
        r.hairLift = turning || kick > 0.4 ? -1 : 0;
        r.cape -= q(5 * (turning ? 1 : kick));
        danceLegs(r, [dip * (1 - toss), [2, 0, 6], [-2, 0, -8]], [turning ? 1 : 0, [1.2, -6, 30], [-0.4, -1.6, -8]], [kick, dancerLeg(115, 14.6, 60), [-1.4, -1, -10]], [tada, [1.4, 0, -4], [0.8, -0.6, 6]]);
        if (tada > 0.5) [r.eyes, r.mouth] = ['wink', 'grin'];
        else if (turning) r.eyes = 'happy';
        else if (kick > 0.3 || toss > 0.3) strikeFace(r);
      },
    };
  },

  // ---------- The Arbalist Engineer's moves (her own; docs/design/arbalist.md) ----------
  // An excited inventor with a crossbow of her own making. It rests low at the waist, and to shoot
  // she pushes it out to arm's length in front of her (arm about `AE_AIM`, the crossbow level or
  // tipped a little up), so her body, knees and crank hand all read round it; never raised to her
  // face. Every shot kicks: the
  // crossbow jumps up and back and settles, and she reacts (a grin, a fist pump, a pat on the stock).
  // Her machine works: the free hand winds the crank at the butt in a full, visible circle behind her,
  // pumps a lever, pats it; she kneels on one knee to brace it, ducks, slides. Her moves are
  // `poised` (the body doesn't sway after the crossbow; each move sets its own kick).
  // (A crossbow's angle: 0 is level forward, negative tips it up.)

  // Snap shot (opener, the bolt leaves at ~0.3): the crossbow hangs nose-down at her hip; she whips
  // it up and out to arm's length, the weight pitching forward onto the front foot, and fires at
  // once; she holds it out a beat, cocky, the nose tipping up as she grins.
  aesnap(p) {
    const up = ease(seg(p, 0, 0.24));
    const kick = bump(p, 0.28, 0.5);
    const hold = soft(seg(p, 0.54, 0.8));
    const hopIn = bump(p, 0.0, 0.24);
    return {
      poised: true,
      weapon: lerp(40, -4, up) - 18 * kick - 10 * hold, arm: lerp(26, AE_AIM, up) + 6 * kick - 6 * hold, lunge: 4 * up * (1 - 0.5 * hold) - 4 * kick, tilt: 0.12 * up * (1 - hold) - 0.12 * kick + 0.06 * aeRock(p, 0.56),
      lift: 6 * hopIn + 3 * kick + 1.4 * Math.abs(aeRock(p, 0.56)),
      rig: (r) => {
        r.air = hopIn > 0.4 || kick > 0.6;
        r.backArm = kick > 0.1 ? [q(-4 * kick), q(-3 * kick)] : [q(lerp(-1, -3, up) + 2 * hold), q(lerp(-1, 1, up))];
        r.squat = q(0.8 * up * (1 - hold));
        danceLegs(r, [up, [4.4, 0, 8], [-3, -0.6, -16]], [hopIn, [2.6, -2.6, 24], [-2.4, -3.6, -46]], [kick, [3, -1.4, 20], [-2.4, -1, -16]], [hold, [3.6, 0, 6], [-2.6, 0, -10]]);
        if (kick > 0.3) strikeFace(r);
        else if (hold > 0.5) r.mouth = 'grin';
      },
    };
  },
  // Double shot (second, bolts at ~0.28 and ~0.6): square on, feet wide, a shot; then she flings her
  // free hand up behind her and slams it down on the lever with a clack (the whole body bobbing
  // into it), and a second shot; she ends with the crossbow tipped up proudly, free hand on her hip.
  aedouble(p) {
    const set = soft(seg(p, 0, 0.18));
    const k1 = bump(p, 0.26, 0.42);
    const lift = soft(seg(p, 0.36, 0.44)) * (1 - ease(seg(p, 0.46, 0.52)));
    const slam = bump(p, 0.46, 0.58);
    const k2 = bump(p, 0.58, 0.74);
    const hold = soft(seg(p, 0.74, 0.88));
    const jump = bump(p, 0.34, 0.52);
    return {
      poised: true,
      weapon: lerp(20, -2, set) - 14 * k1 - 18 * k2 + 8 * slam - 22 * hold, arm: lerp(32, AE_AIM - 2, set) + 6 * (k1 + k2) - 6 * slam - 8 * hold, lunge: 2 * set - 3.5 * (k1 + k2), tilt: -0.08 * (k1 + k2) + 0.12 * slam - 0.04 * hold + 0.05 * aeRock(p, 0.76),
      lift: 6 * jump + 2 * k2 + 1.2 * Math.abs(aeRock(p, 0.76)),
      rig: (r) => {
        r.air = jump > 0.4;
        r.backArm = hold > 0.05 ? [q(lerp(5, -3, hold)), q(lerp(0, 2, hold))]
          : lift > 0.05 || slam > 0.05 ? [q(lerp(-4, 5, slam) * (1 - lift) - 4 * lift), q(-8 * lift + lerp(0, 1, slam) * (1 - lift))] : [q(-2 - 2 * k1), q(-1 - 2 * k1)];
        r.squat = q(2.4 * slam + 0.6 * set);
        danceLegs(r, [set, [4, 0, 6], [-4, 0, -10]], [jump, [2.4, -3, 30], [-2.4, -3.4, -40]]);
        if (k1 > 0.3 || k2 > 0.3) strikeFace(r);
        else if (hold > 0.4) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (lift > 0.5) r.mouth = 'grin';
      },
    };
  },
  // Brace and crank (third, the heavy bolt at ~0.55): she drops onto one knee, front knee up and the
  // stock braced over it, the crossbow out in front; her free hand winds the crank at the butt round
  // twice in big circles behind her with a grin, then she fires; the kick rocks her back on her heel.
  aebrace(p) {
    const kneel = soft(seg(p, 0, 0.16)) * (1 - soft(seg(p, 0.76, 0.88)));
    const crank = seg(p, 0.16, 0.5);
    const cranking = crank > 0 && crank < 1;
    const kick = bump(p, 0.52, 0.72);
    const wind = cranking ? Math.sin(crank * Math.PI * 4) : 0;
    const pop = bump(p, 0.78, 0.96);
    return {
      poised: true,
      weapon: lerp(20, -16, kneel) - 26 * kick + 4 * wind, arm: lerp(30, AE_AIM + 10, kneel) + 8 * kick * (1 - kneel * 0.25), lunge: 3 * kneel - 7 * kick, tilt: 0.1 * kneel - 0.16 * kick + 0.03 * wind,
      lift: -3 * kneel + 3 * kick + 6 * pop,
      rig: (r) => {
        r.squat = q(5 * kneel);
        r.air = pop > 0.4;
        r.by = q(1 * wind);
        // The crank wound in big circles up over the stock, behind her, where it reads above the crossbow.
        r.backArm = cranking ? [q(-5 + 5.5 * Math.cos(crank * Math.PI * 4)), q(-6 + 5.5 * Math.sin(crank * Math.PI * 4))] : kick > 0.1 ? [q(-5 * kick), q(-3 * kick)] : [q(-2 * kneel), q(-1 - 3 * kneel)];
        r.hairLift = cranking && Math.sin(crank * Math.PI * 4) < 0 ? -1 : 0;
        danceLegs(r, [kneel, [5, 0, 14], [-6.6, 1.4, -86]], [pop, [2, -2.6, 20], [-2.2, -3.4, -40]]);
        if (cranking && crank > 0.15) r.mouth = 'grin';
        if (pop > 0.4) r.eyes = 'happy';
        if (kick > 0.3) strikeFace(r);
        else if (kneel > 0.5 && !cranking && p > 0.7) r.eyes = 'happy';
      },
    };
  },
  // Recoil blast (the finish, ~0.48): she plants wide and low, the crossbow out at arm's length,
  // fires the big bolt, and the kick throws her a hop back, the crossbow bucking right up; she lands
  // in a skid on her back foot, front leg out, and ends with it propped up at her shoulder and her
  // fist punched up.
  aerecoil(p) {
    const plant = soft(seg(p, 0, 0.3));
    const kick = ease(seg(p, 0.46, 0.54)) * (1 - soft(seg(p, 0.6, 0.86)));
    const hop = Math.sin(Math.PI * seg(p, 0.48, 0.72));
    const skid = soft(seg(p, 0.66, 0.78)) * (1 - soft(seg(p, 0.84, 0.94)));
    const pose = soft(seg(p, 0.82, 0.92));
    return {
      poised: true,
      weapon: lerp(14, -6, plant) - 46 * kick - 34 * pose, arm: lerp(28, AE_AIM + 4, plant) + 12 * kick - 18 * pose, lunge: 2 * plant * (1 - kick) - 14 * soft(seg(p, 0.48, 0.8)) * (1 - 0.4 * pose), lift: 10 * hop + 1.4 * Math.abs(aeRock(p, 0.86)), tilt: 0.06 * plant * (1 - kick) - 0.26 * kick - 0.12 * skid + 0.05 * aeRock(p, 0.86),
      rig: (r) => {
        r.squat = q(2 * plant * (1 - kick) * (1 - hop) + 2.4 * skid);
        r.backArm = pose > 0.1 ? dancerHand([q(2 * pose), q(-9 * pose)]) : kick > 0.1 ? [q(-6 * kick), q(-4 * kick)] : [q(-2), q(0)];
        r.hairLift = hop > 0.3 ? 1 : 0;
        r.cape -= q(4 * hop);
        danceLegs(r, [plant, [4.6, 0, 8], [-4.6, 0, -12]], [hop, [3, -3, 30], [-2, -2, -30]], [skid, [7, 0, 24], [-3, 0, -30]], [pose, [3.6, 0, 6], [-3.2, 0, -10]]);
        if (pose > 0.4) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (kick > 0.2) [r.eyes, r.mouth] = ['blink', 'open'];
      },
    };
  },
  // Twirl shot (opener in her pool, ~0.42): she holds it out at arm's length, gives a little hop and
  // spins it once round her trigger finger like a gunslinger (down past her knees, round behind her
  // and over), slaps it home at her hip and fires.
  aetwirl(p) {
    const out = soft(seg(p, 0, 0.08)) * (1 - soft(seg(p, 0.3, 0.38)));
    const spin = seg(p, 0.06, 0.32);
    const a = 360 * soft(spin);
    const spinning = spin > 0 && spin < 1;
    const hop = Math.sin(Math.PI * seg(p, 0.06, 0.3));
    const kick = bump(p, 0.4, 0.6);
    const hold = soft(seg(p, 0.66, 1));
    // From nose-down round to nose-up it is drawn behind her body (its stock swings up past her
    // face as the nose goes down), so it never crosses her face.
    const behind = spinning && a > 30 && a < 305;
    return {
      poised: true, back: behind,
      weapon: (spinning ? a : 0) - 4 - 14 * kick + 4 * hold, arm: lerp(30, 92, out) + 6 * kick - 4 * hold, lift: 13 * hop, lunge: -3 * kick,
      rig: (r) => {
        r.air = hop > 0.3;
        r.backArm = spinning ? [q(-5), q(-4)] : kick > 0.1 ? [q(-3 * kick), q(-2 * kick)] : [q(3 * hold), q(-1)];
        r.hairLift = hop > 0.4 ? -1 : 0;
        danceLegs(r, [hop, [1.6, -2.6, 20], [-1.6, -1.6, -20]], [1 - hop, [2, 0, 4], [-2, 0, -6]]);
        if (spinning) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Duck and fire (second in her pool, ~0.4): she ducks right down onto her heels, both knees bent
  // and her head tucked low behind the stock, and fires steeply up and out from the crouch.
  aeduck(p) {
    const duck = soft(seg(p, 0, 0.22)) * (1 - soft(seg(p, 0.64, 0.8)));
    const kick = bump(p, 0.36, 0.56);
    const pop = bump(p, 0.7, 0.92);
    return {
      poised: true,
      weapon: -4 - 26 * duck - 16 * kick, arm: lerp(40, 50, duck) + 8 * kick, tilt: 0.14 * duck - 0.1 * kick - 0.05 * pop, lunge: 3 * duck - 3 * kick, lift: 7 * pop,
      rig: (r) => {
        r.air = pop > 0.4;
        r.squat = q(4.4 * duck);
        r.hx = q(1 * duck);
        r.tilt = Math.round(2 * duck) * 2;
        r.backArm = [q(4 * duck), q(-1 + 3 * duck)];
        danceLegs(r, [duck, [4.4, 0, 14], [-4, 0, -18]], [pop, [1.8, -3, 24], [-2, -3.2, -44]]);
        if (kick > 0.3) strikeFace(r);
        else if (pop > 0.4) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (duck > 0.5) r.eyes = 'half';
      },
    };
  },
  // Triple crank (third in her pool, bolts at ~0.3, ~0.5, ~0.7): she leans back with the stock
  // braced on her hip, front foot planted out, and hammers the crank round in big fast circles; the
  // crossbow fires three times in a row and each kick shoves her a step further back.
  aetriple(p) {
    const k = Math.max(bump(p, 0.28, 0.4), bump(p, 0.48, 0.6), bump(p, 0.68, 0.8));
    const shots = soft(seg(p, 0.28, 0.36)) + soft(seg(p, 0.48, 0.56)) + soft(seg(p, 0.68, 0.76));
    const brace = soft(seg(p, 0, 0.16)) * (1 - soft(seg(p, 0.84, 1)));
    const crank = seg(p, 0.16, 0.8);
    const cranking = crank > 0 && crank < 1;
    const rattle = cranking ? Math.sin(p * 90) * 0.5 : 0;
    return {
      poised: true,
      weapon: lerp(16, -12, brace) - 12 * k + 2 * rattle, arm: lerp(30, 56, brace) + 5 * k, lunge: -3 * k - 2.2 * shots * (1 - soft(seg(p, 0.84, 1))), tilt: -0.16 * brace - 0.08 * k + 0.05 * aeRock(p, 0.82), lift: 2.6 * k + 1.2 * Math.abs(aeRock(p, 0.82)),
      rig: (r) => {
        r.backArm = cranking ? crankHand(crank * 3, 4.6) : [q(-2), q(-1)];
        r.by = q(rattle);
        r.squat = q(1.4 * brace);
        danceLegs(r, [brace, [5.4, 0, 14], [-2.6, 0, -6]]);
        if (k > 0.3) strikeFace(r);
        else if (cranking) r.mouth = 'grin';
      },
    };
  },
  // Sliding shot (a finish in her pool, ~0.45): she runs and drops into a baseball slide, the front
  // leg out long and the back knee skidding, leaning right back with her hair streaming and the
  // crossbow out at arm's length, fires a heavy bolt from the slide, then pops up and pats the stock.
  aeslide(p) {
    const slide = soft(seg(p, 0, 0.26)) * (1 - soft(seg(p, 0.66, 0.84)));
    const kick = bump(p, 0.42, 0.62);
    const pop = bump(p, 0.7, 0.86);
    const pat = bump(p, 0.86, 1);
    return {
      poised: true,
      weapon: -10 * slide - 22 * kick + 8 * pat, arm: lerp(32, AE_AIM, slide) + 8 * kick, lunge: 11 * slide - 3 * kick, lift: 8 * pop, tilt: -0.28 * slide - 0.08 * kick + 0.06 * pop,
      rig: (r) => {
        r.squat = q(4 * slide);
        r.air = pop > 0.4;
        r.backArm = pat > 0.2 ? [q(5), q(1 - 2 * pat)] : [q(-7 * slide), q(-1 - 2 * slide)];
        r.hairLift = slide > 0.4 ? 1 : 0;
        r.hx = q(-1.5 * slide);
        danceLegs(r, [slide, [8, -0.6, 34], [-4.6, 0, -80]]);
        if (pat > 0.3) r.eyes = 'happy';
        else if (kick > 0.3) strikeFace(r);
        else if (slide > 0.5) r.mouth = 'grin';
      },
    };
  },
  // Up + attack: she tips the crossbow up and out in front of her and fires at whatever flies.
  aeup(p) {
    const up = ease(seg(p, 0, 0.26));
    const kick = bump(p, 0.32, 0.52);
    return {
      poised: true,
      weapon: lerp(0, -45, up) + 10 * kick, arm: lerp(27, 28, up), lunge: -2 * kick, lift: 4 * kick + 1.2 * Math.abs(aeRock(p, 0.56)), tilt: -0.06 * up - 0.06 * kick + 0.05 * aeRock(p, 0.56),
      rig: (r) => { r.backArm = [q(3), q(-2)]; r.air = kick > 0.5; danceLegs(r, [up, [1.4, 0, 4], [-1.6, 0, -6]], [kick, [2, -2, 20], [-2, -2.6, -30]]); if (kick > 0.3) strikeFace(r); },
    };
  },
  // In the air: she tips it down past her knees and fires at whatever is below.
  aeair(p) {
    const down = ease(seg(p, 0, 0.24));
    const kick = bump(p, 0.28, 0.5);
    return {
      poised: true,
      weapon: lerp(0, 55, down) - 12 * kick, arm: 33 - 6 * kick, lift: 3 * kick, tilt: 0.1 * down - 0.08 * kick,
      rig: (r) => { r.air = true; r.backArm = [q(-4), q(-6)]; danceLegs(r, [1, [2.4, -3, 30], [-2.4, -2, -30]], [kick, [3, -4.4, 50], [-1.4, -4, -10]]); if (kick > 0.3) strikeFace(r); },
    };
  },
  // Out of a run: a forward roll with the crossbow hugged tight along her back, coming up on one
  // knee and firing.
  aeroll(p) {
    const roll = ease(seg(p, 0, 0.42));
    const rolling = roll > 0 && roll < 1;
    const bring = soft(seg(p, 0.4, 0.5));
    const kick = bump(p, 0.48, 0.66);
    const kneel = soft(seg(p, 0.38, 0.46)) * (1 - soft(seg(p, 0.82, 1)));
    return {
      poised: true, back: rolling,
      weapon: rolling ? -80 : lerp(-60, -6, bring) - 18 * kick, arm: rolling ? 20 : lerp(20, 27, bring) + 6 * kick,
      tilt: rolling ? roll * Math.PI * 2 : -0.06 * kick, lift: 6 * Math.sin(Math.PI * roll),
      rig: (r) => {
        if (rolling) tuck(r);
        else {
          r.squat = q(3.2 * kneel);
          danceLegs(r, [kneel, [3.6, 0, 8], [-5.8, 0, -76]]);
        }
        r.backArm = rolling ? [1, -2] : [3, -1];
        if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Deploy Turret (the turret appears at ~0.45): she lets the crossbow hang nose-down at her side
  // out of the way, drops to one knee, reaches forward with her free hand and sets the turret down,
  // gives it two pats, and jumps back up with a cheer.
  aedeploy(p) {
    const kneel = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.66, 0.8)));
    const sling = soft(seg(p, 0, 0.18)) * (1 - soft(seg(p, 0.72, 0.88)));
    const reach = soft(seg(p, 0.16, 0.36)) * (1 - soft(seg(p, 0.6, 0.7)));
    const place = bump(p, 0.36, 0.46);
    const pat = bump(p, 0.48, 0.54) + bump(p, 0.55, 0.61);
    const cheer = soft(seg(p, 0.8, 0.88)) * (1 - soft(seg(p, 0.97, 1)));
    return {
      poised: true,
      weapon: lerp(12, 30, sling), arm: lerp(28, 8, sling), lift: 4 * bump(p, 0.78, 0.92), tilt: 0.14 * reach,
      rig: (r) => {
        r.squat = q(3.6 * kneel);
        r.air = bump(p, 0.78, 0.92) > 0.4;
        r.backArm = cheer > 0.1 ? dancerHand([q(2 * cheer), q(-10 * cheer)]) : [q(lerp(0, 9, reach)), q(lerp(-1, 5, reach) + 2 * place - 2.5 * pat)];
        danceLegs(r, [kneel, [4.6, 0, 10], [-6.2, 0, -80]], [cheer, [1.2, -1.5, 6], [-1.2, -1.5, -6]]);
        if (cheer > 0.4) [r.eyes, r.mouth] = ['happy', 'open'];
        else if (pat > 0.3) r.eyes = 'happy';
        else if (reach > 0.5) r.mouth = 'grin';
      },
    };
  },
  // Wind-Up Bomb (the bomb goes at ~0.46): she drops into a crouch, the crossbow slung nose-down
  // out of the way, and cranks the key on the little bomb in front of her with her free hand, three
  // quick turns, then gives it a nudge forward and pops up, ducking away with her hand clapped over
  // her ear and her eyes squeezed shut, waiting for the bang; then peeks and grins.
  aewindup(p) {
    const down = soft(seg(p, 0, 0.14)) * (1 - soft(seg(p, 0.5, 0.6)));
    const wind = seg(p, 0.14, 0.4);
    const turn = wind * Math.PI * 6;
    const nudge = bump(p, 0.4, 0.5);
    const duck = soft(seg(p, 0.52, 0.62)) * (1 - soft(seg(p, 0.86, 0.96)));
    const peek = soft(seg(p, 0.8, 0.9));
    const winding = wind > 0 && wind < 1;
    return {
      poised: true,
      weapon: lerp(12, 30, down + duck * 0.5), arm: lerp(28, 8, down) + 20 * duck, lift: 3 * bump(p, 0.5, 0.6), tilt: 0.16 * down - 0.14 * duck, lunge: -4 * duck,
      rig: (r) => {
        r.squat = q(3.4 * down + 1.2 * duck);
        r.air = bump(p, 0.5, 0.6) > 0.5;
        r.backArm = duck > 0.2 ? dancerHand([q(-1 * duck), q(-12 * duck)]) : [q(8 + (winding ? 1.5 * Math.cos(turn) : 0) + 3 * nudge), q(4 + (winding ? 1.5 * Math.sin(turn) : 0))];
        danceLegs(r, [down, [4.6, 0, 10], [-6.2, 0, -80]], [duck, [2, -1, 8], [-2.6, -1, -14]]);
        if (duck > 0.4 && peek < 0.5) [r.eyes, r.mouth] = ['half', 'open'];
        else if (peek > 0.5) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (winding) r.mouth = 'grin';
      },
    };
  },
  // Big Bertha (her finisher, 1.6 s; the giant bolt at 0.65): the crossbow unfolds into a ballista
  // (drawn as an effect behind her) as she drops onto one knee behind it, out at arm's length; she
  // winds the crank round three times in big circles, her whole body bobbing into each turn; it
  // shudders harder and harder as it charges, her eyes screwed half shut; then the giant bolt goes,
  // the kick throws her up off her knee and skids her back with the crossbow bucking high; she
  // lands, sooty, and holds her signature pose: feet wide, the crossbow propped up at her shoulder,
  // her fist punched up and a big grin.
  aebertha(p) {
    const kneel = soft(seg(p, 0, 0.14)) * (1 - soft(seg(p, 0.64, 0.68)));
    const crank = seg(p, 0.14, 0.48);
    const cranking = crank > 0 && crank < 1;
    const bob = cranking ? Math.sin(crank * Math.PI * 6) : 0;
    const charge = seg(p, 0.46, 0.65) * (p < 0.65 ? 1 : 0);
    const shake = charge * Math.sin(p * 220);
    const kick = ease(seg(p, 0.65, 0.69)) * (1 - soft(seg(p, 0.72, 0.9)));
    const thrown = Math.sin(Math.PI * seg(p, 0.65, 0.8));
    const skid = soft(seg(p, 0.65, 0.82));
    const settle = soft(seg(p, 0.8, 0.86)) * (1 - soft(seg(p, 0.86, 0.92)));
    const pose = soft(seg(p, 0.86, 0.93));
    return {
      poised: true,
      weapon: lerp(16, -4, kneel) - 2 * bob + 3 * shake - 52 * kick + 6 * charge - 40 * pose, arm: lerp(30, AE_AIM - 4, kneel) + 14 * kick - 14 * pose, lunge: -14 * skid * (1 - 0.3 * pose) + 1.2 * shake, lift: 7 * thrown + breathe(p) * 0.4 * pose,
      tilt: 0.06 * kneel + 0.03 * bob - 0.32 * kick + 0.02 * shake - 0.06 * pose,
      rig: (r) => {
        r.squat = q(4 * kneel + 2 * settle);
        r.by = q(0.8 * bob);
        r.air = thrown > 0.4;
        r.backArm = pose > 0.1 ? dancerHand([q(3 * pose), q(-10 * pose)]) : cranking ? crankHand(crank * 3, 4.6) : charge > 0 ? [q(-2), q(-1)] : kick > 0.05 ? [q(-6 * kick), q(-5 * kick)] : [-2, -1];
        r.hairLift = kick > 0.3 ? 1 : charge > 0.6 ? -1 : 0;
        r.cape -= q(4 * kick);
        danceLegs(r, [kneel, [4.6, 0, 10], [-6.2, 0, -80]], [thrown, [2.6, -3, 24], [-2.6, -2.6, -30]], [settle * (1 - thrown), [5, 0, 14], [-3.6, 0, -16]], [pose, [4.6, 0, 6], [-4.6, 0, -10]]);
        if (pose > 0.4) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (kick > 0.2) [r.eyes, r.mouth] = ['blink', 'open'];
        else if (charge > 0.2) [r.eyes, r.mouth] = ['half', 'grit'];
        else if (cranking) r.mouth = 'grin';
      },
    };
  },

  // ---------- Her own versions of the Acrobat Archer's skills (data/path-skills.js) ----------

  // Steam Hop (her Handspring, 0.66 s; the bolt at 0.8): no flip, a gadget. She crouches and slaps
  // the valve on her belt; her boots blast steam and she rockets up and over in a tucked arc, the
  // crossbow hugged nose-down at her hip and her free arm windmilling; she lands in a skid, spins
  // round on her heel, whips the crossbow out and fires back the way she came.
  aejet(p) {
    const crouch = soft(seg(p, 0, 0.12)) * (1 - ease(seg(p, 0.12, 0.16)));
    const slap = bump(p, 0.06, 0.14);
    const hop = Math.sin(Math.PI * seg(p, 0.14, 0.62));
    const flying = p > 0.14 && p < 0.62;
    const skid = soft(seg(p, 0.6, 0.66)) * (1 - soft(seg(p, 0.68, 0.76)));
    const up = soft(seg(p, 0.68, 0.78));
    const kick = bump(p, 0.8, 0.94);
    const hold = soft(seg(p, 0.9, 1));
    const turn = p < 0.64 ? 1 : p < 0.8 ? -1 : 1;
    const mill = flying ? seg(p, 0.14, 0.62) * Math.PI * 4 : 0;
    return {
      poised: true, turn,
      weapon: lerp(40 + 22 * hop, -4, up) - 18 * kick - 8 * hold, arm: lerp(22 - 12 * hop, AE_AIM, up) + 6 * kick - 6 * hold,
      lift: 46 * hop - 2 * crouch + 1.2 * Math.abs(aeRock(p, 0.9)), lunge: -4 * skid - 4 * kick, tilt: 0.1 * crouch + (flying ? 0.18 * Math.cos(Math.PI * seg(p, 0.14, 0.62)) : 0) - 0.16 * skid - 0.12 * kick + 0.06 * aeRock(p, 0.9),
      rig: (r) => {
        if (flying && hop > 0.15) {
          tuck(r);
          r.backArm = [q(-3 + 4 * Math.cos(mill)), q(-3 + 3 * Math.sin(mill))];
          r.hairLift = -1;
          r.cape -= 3;
          r.mouth = 'open';
        } else if (p < 0.2) {
          r.squat = q(3 * crouch);
          wideLegs(r);
          r.backArm = [q(1 + 2 * slap), q(2 + 2 * slap)];
          if (slap > 0.4) r.eyes = 'happy';
        } else {
          r.squat = q(2 * skid);
          danceLegs(r, [skid, [5, 0, 14], [-3.6, 0.6, -40]], [up, [4, 0, 8], [-3, -0.6, -16]], [hold, [3.6, 0, 6], [-2.6, 0, -10]]);
          r.backArm = kick > 0.1 ? [q(-4 * kick), q(-3 * kick)] : [-3, -1];
          r.hairLift = skid > 0.3 ? 1 : 0;
          if (kick > 0.3) strikeFace(r);
          else if (hold > 0.5) r.mouth = 'grin';
        }
      },
    };
  },

  // Bolt Mortar (her Grand Somersault, 1.9 s; the shell at 0.44, the hail ~0.6 to ~0.85): down on
  // one knee, she stands the crossbow up on its stock out at arm's length, nose to the sky, and
  // winds the crank three times with her body bobbing into each turn; it shudders as it builds, then
  // the shell goes straight up (0.44) with a kick that rocks her back onto her heels; she tips her
  // head right back to watch it burst, bounces up as the bolts come down, pumping her fist three
  // times, and ends with the crossbow slung low and a thumbs up.
  aemortar(p, dur) {
    const kneel = soft(seg(p, 0, 0.12)) * (1 - soft(seg(p, 0.58, 0.66)));
    const stand = soft(seg(p, 0.08, 0.16)) * (1 - soft(seg(p, 0.46, 0.56)));
    const crank = seg(p, 0.14, 0.36);
    const cranking = crank > 0 && crank < 1;
    const bob = cranking ? Math.sin(crank * Math.PI * 6) : 0;
    const charge = seg(p, 0.36, 0.44) * (p < 0.44 ? 1 : 0);
    const shake = charge * Math.sin(p * dur * 120);
    const kick = ease(seg(p, 0.44, 0.47)) * (1 - soft(seg(p, 0.5, 0.62)));
    const look = soft(seg(p, 0.46, 0.54)) * (1 - soft(seg(p, 0.86, 0.92)));
    const cheer = seg(p, 0.62, 0.86);
    const pump = cheer > 0 && cheer < 1 ? Math.abs(Math.sin(cheer * Math.PI * 3)) : 0;
    const pose = soft(seg(p, 0.88, 0.95));
    return {
      poised: true,
      weapon: lerp(lerp(30, -76, stand), 40, pose) + 3 * shake - 14 * kick - 2 * bob, arm: lerp(lerp(26, 100, stand), 22, pose) + 4 * kick,
      lift: 6 * bump(p, 0.62, 0.74) + 3 * pump + breathe(p) * 0.4 * pose, lunge: 1.2 * shake - 6 * kick, tilt: 0.04 * bob - 0.06 * stand - 0.24 * kick - 0.1 * look + 0.06 * aeRock(p, 0.9),
      rig: (r) => {
        r.squat = q(4 * kneel);
        r.by = q(0.8 * bob);
        r.backArm = cranking ? crankHand(crank * 3, 4.6) : pump > 0.05 ? dancerHand([q(1 + pump), q(-8 * pump)]) : pose > 0.1 ? [q(6 * pose), q(-5 * pose)] : kick > 0.05 ? [q(-6 * kick), q(-4 * kick)] : [-2, -1];
        danceLegs(r, [kneel, [4.6, 0, 10], [-6.2, 0, -80]], [bump(p, 0.62, 0.74), [2.4, -2.6, 20], [-2.2, -2.6, -24]], [pose, [4.2, 0, 6], [-4, 0, -10]]);
        // Head tipped right back to watch the shell burst.
        r.tilt = (r.tilt ?? 0) - Math.round(12 * look / 2) * 2;
        if (pose > 0.4) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (pump > 0.3) [r.eyes, r.mouth] = ['happy', 'open'];
        else if (kick > 0.2) [r.eyes, r.mouth] = ['blink', 'open'];
        else if (look > 0.4) r.mouth = 'open';
        else if (charge > 0.2) [r.eyes, r.mouth] = ['half', 'grit'];
        else if (cranking) r.mouth = 'grin';
      },
    };
  },

  // Spring Mine (her Springboard; the mine is down at ~0.4): she squats with her knees wide, drops
  // the brass plate in front of her, winds its key round twice with her whole body swinging into
  // each turn, gives it a test poke (it twangs), and hops back two steps pointing at it with a grin.
  aewind(p) {
    const squat = soft(seg(p, 0, 0.16)) * (1 - soft(seg(p, 0.68, 0.78)));
    const drop = bump(p, 0.18, 0.32);
    const wind = seg(p, 0.34, 0.6);
    const winding = wind > 0 && wind < 1;
    const a = wind * Math.PI * 4;
    const poke = bump(p, 0.6, 0.68);
    const hop = bump(p, 0.72, 0.82) + bump(p, 0.82, 0.92) * 0.7;
    const point = soft(seg(p, 0.8, 0.9));
    return {
      poised: true,
      weapon: lerp(20, 34, squat), arm: lerp(26, 10, squat), lift: 4 * hop, lunge: -5 * soft(seg(p, 0.72, 0.92)) + 1.5 * poke, tilt: 0.16 * squat + (winding ? 0.04 * Math.sin(a) : 0),
      rig: (r) => {
        r.squat = q(3.4 * squat);
        r.air = hop > 0.4;
        r.backArm = winding ? [q(8 + 2.6 * Math.cos(a)), q(4 + 2.6 * Math.sin(a))] : point > 0.1 ? [q(lerp(4, 8, point)), q(-3 * point)] : [q(lerp(0, 8, squat) + 1.5 * poke), q(lerp(-1, 4, squat) + 2 * drop - 1 * poke)];
        danceLegs(r, [squat, [4.4, 0, 16], [-4.4, 0, -16]], [hop, [1.8, -2.4, 18], [-2.2, -2.8, -30]], [point, [3.4, 0, 6], [-2.4, 0, -8]]);
        if (point > 0.4) [r.eyes, r.mouth] = ['wink', 'grin'];
        else if (poke > 0.4) r.eyes = 'happy';
        else if (winding) r.mouth = 'grin';
      },
    };
  },

  // ---------- The Acrobat Archer's moves (her own; docs/design/acrobat-archer.md) ----------
  // A playful show-off who shoots mid-trick: skips, flips, splits, rolls and pirouettes, the bow
  // drawn and loosed from the top of each one, a wink after the good ones. Every trick is a whole
  // body turning (never stretched). Every draw is the same clean archer's line (`bowDraw`, at the end
  // of this file): the bow arm long and a little low, the bow tipped back a touch so the arrow runs
  // under her jaw, the string hand anchored under the chin and the head held back off the string,
  // so neither the bow nor the arrow ever crosses her face.

  // Skip shot (opener, the arrow leaves at ~0.5): the bow low at her hip, a skip forward with the
  // front knee up as she swings it up and draws in the air, loosed as she lands; the string hand
  // flicks open and she twirls it with a wink.
  acskip(p) {
    const skip = Math.sin(Math.PI * seg(p, 0.05, 0.5));
    const raise = soft(seg(p, 0.02, 0.24));
    const s = bowShot(p, 0.2, 0.5);
    const hold = soft(seg(p, 0.6, 0.84));
    const twirl = seg(p, 0.6, 0.9);
    return {
      weapon: lerp(lerp(BOW_REST, rollOn(BOW_AIM, s), raise), BOW_REST, hold) + 8 * s.kick, arm: lerp(lerp(46, BOW_ARM, raise), BOW_LOW, hold) + 3 * s.kick,
      lift: 11 * skip + acBounce(p, 0.6), lunge: 4 * skip - 3 * s.kick, tilt: -0.08 * skip * (1 - s.pull) - 0.04 * s.pull - 0.08 * s.kick,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.air = skip > 0.2 || acBounce(p, 0.6) > 2;
        bowDraw(r, s, raise);
        if (s.snap > 0) r.backArm = [q(-6 + 3 * hold + 1.5 * Math.cos(twirl * Math.PI * 4)), q(-2 - 3 * hold + 1.5 * Math.sin(twirl * Math.PI * 4))];
        else if (raise < 0.6) r.backArm = [q(lerp(-1, 2, raise)), q(lerp(2, -1, raise))];
        danceLegs(r, [skip, [2.6, -3.6, 34], [-2.4, -3.8, -60]], [hold, [2, 0, 4], [-0.8, -1.2, -24]], [bump(p, 0.62, 0.8), [1.6, -2.6, 20], [-2, -3.6, -50]]);
        if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.5) r.eyes = 'wink';
      },
    };
  },
  // Back handspring (second, arrows at ~0.38 and ~0.6): a backflip with the bow drawn all the way
  // round, an arrow off the top of it upside down and another as she lands.
  acflip(p) {
    const f = backflip(seg(p, 0.08, 0.66), 0.9);
    const s1 = bowShot(p, 0.12, 0.38);
    const s2 = bowShot(p, 0.42, 0.62);
    const hold = soft(seg(p, 0.7, 0.86));
    const sh = p < 0.4 ? s1 : s2;
    const rz = soft(seg(p, 0, 0.12));
    return {
      // (Once round, the turn is wound back to upright, so the bounces after it lean from the feet.)
      ...f, lift: f.lift + acBounce(p, 0.72), tilt: p >= 0.66 ? 0 : f.tilt, weapon: lerp(lerp(BOW_REST, BOW_AIM + 20 * (soft(s1.snap) * (1 - s2.pull) + soft(s2.snap)), rz), BOW_REST, hold) + 8 * sh.kick, arm: lerp(lerp(BOW_LOW, BOW_ARM, rz), BOW_LOW, hold), pull: sh.pull, nock: sh.nock, twang: Math.max(s1.twang, s2.twang),
      rig: (r) => {
        f.rig(r);
        bowDraw(r, sh);
        if (sh.kick > 0.3) strikeFace(r);
        else if (hold > 0.5) r.eyes = 'happy';
      },
    };
  },
  // Split leap (the finish, ~0.5): a running leap into a split in mid-air, legs flung out front and
  // back, the bow drawn full at the top and a big arrow loosed; she lands in a crouch and winks.
  acsplit(p) {
    const crouch = bump(p, 0, 0.14);
    const leap = Math.sin(Math.PI * seg(p, 0.1, 0.74));
    const split = soft(seg(p, 0.16, 0.36)) * (1 - soft(seg(p, 0.6, 0.72)));
    const s = bowShot(p, 0.16, 0.5);
    const land = bump(p, 0.7, 0.86);
    const hold = soft(seg(p, 0.78, 0.92));
    return {
      weapon: lerp(lerp(BOW_REST, rollOn(BOW_AIM, s), soft(seg(p, 0, 0.18))), BOW_REST, hold) + 10 * s.kick, arm: lerp(lerp(BOW_LOW, BOW_ARM, soft(seg(p, 0, 0.18))), BOW_LOW, hold) + 4 * s.kick, lift: 30 * leap - 3 * crouch + acBounce(p, 0.84), lunge: 5 * leap - 4 * s.kick, tilt: -0.1 * split - 0.1 * s.kick + 0.08 * land,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.air = leap > 0.15;
        r.squat = q(2 * (crouch + land));
        bowDraw(r, s);
        if (s.snap > 0) r.backArm = [q(-7 + 4 * hold), q(-3 + hold)];
        r.hairLift = leap > 0.3 ? -1 : 0;
        r.cape -= q(3 * leap);
        danceLegs(r, [split, [9, -7, 80], [-9, -6, -80]], [land, [2.6, 0, 6], [-2.4, 0, -8]]);
        if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.4) [r.eyes, r.mouth] = ['wink', 'grin'];
      },
    };
  },
  // Forward roll (an opener in her pool, ~0.6): a quick forward roll along the ground, popping up on
  // one knee with the bow already drawn.
  acroll(p) {
    const roll = ease(seg(p, 0.02, 0.42));
    const rolling = p > 0.02 && p < 0.42;
    const s = bowShot(p, 0.38, 0.6);
    const kneel = soft(seg(p, 0.38, 0.5)) * (1 - soft(seg(p, 0.72, 0.84)));
    const pop = bump(p, 0.74, 0.92);
    return {
      weapon: rolling ? 30 : lerp(rollOn(BOW_AIM, s), BOW_REST, soft(seg(p, 0.72, 0.86))) + 8 * s.kick, arm: rolling ? 50 : lerp(BOW_ARM, BOW_LOW, soft(seg(p, 0.72, 0.86))),
      tilt: rolling ? roll * Math.PI * 2 : -0.07 * s.kick - 0.06 * pop, lift: rolling ? 9 * Math.sin(roll * Math.PI) : 6 * pop, lunge: rolling ? 5 : -3 * s.kick + 2 * pop,
      pull: rolling ? 0 : s.pull, nock: !rolling && s.nock, twang: s.twang,
      rig: (r) => {
        if (rolling) tuck(r);
        r.squat = q(3 * kneel);
        r.air = pop > 0.35;
        if (rolling) r.backArm = [-2, -3];
        else bowDraw(r, s);
        danceLegs(r, [kneel, [3.4, 0, 10], [-5.5, 0, -70]], [pop, [2.2, -3, 24], [-2.4, -3.8, -56]]);
        if (s.kick > 0.3) strikeFace(r);
        else if (pop > 0.3) r.eyes = 'wink';
      },
    };
  },
  // Pirouette fan (second in her pool, ~0.6): she rises onto one toe with the other knee drawn up
  // to it (passé), her arms opened wide (the bow out ahead of her, tipped forward, the free hand out
  // behind) and spins twice; she comes out of it into the draw and looses three arrows in a fan.
  acspin(p) {
    const rise = soft(seg(p, 0, 0.08));
    const a = soft(seg(p, 0.06, 0.4));
    const turning = p > 0.06 && p < 0.4;
    const out = soft(seg(p, 0.36, 0.46));
    const up = rise * (1 - out);
    const s = bowShot(p, 0.42, 0.6);
    const hold = soft(seg(p, 0.68, 0.86));
    const hopOut = bump(p, 0.34, 0.5);
    return {
      weapon: lerp(lerp(lerp(BOW_REST, 64, up), rollOn(BOW_AIM, s), out), BOW_REST, hold) + 8 * s.kick, arm: lerp(lerp(lerp(BOW_LOW, 100, up), BOW_ARM, out), BOW_LOW, hold),
      lift: 5 * up + 6 * hopOut + acBounce(p, 0.68), lunge: 3 * hopOut - 3 * s.kick, tilt: -0.08 * hopOut - 0.06 * s.kick,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 4) || 1) : 1,
      pull: out < 0.9 ? 0 : s.pull, nock: out >= 0.9 && s.nock, twang: s.twang,
      rig: (r) => {
        if (out < 0.9) r.backArm = [q(lerp(0, -7, up)), q(lerp(0, -4, up))];
        else bowDraw(r, s);
        if (s.snap > 0) r.backArm = [q(-6 + 4 * hold), q(-3 - 3 * hold)];
        r.hairLift = turning ? -1 : 0;
        r.cape -= turning ? 3 : 0;
        r.air = hopOut > 0.4;
        danceLegs(r, [up, [1.2, -4.4, 34], [-0.4, -1.6, -6]], [hopOut * out, [1.6, -2.6, 20], [-2.4, -4, -56]], [s.pull * out, [2.4, 0, 4], [-2.2, 0, -8]]);
        if (turning) r.eyes = 'happy';
        else if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.5) r.eyes = 'wink';
      },
    };
  },
  // Front flip (a finish in her pool, ~0.48): a springing front flip, the bow drawn as she comes
  // over, a big arrow loosed straight out from the top of it, landing with a bow of her own.
  acfront(p) {
    const crouch = bump(p, 0, 0.14);
    const hop = Math.sin(Math.PI * seg(p, 0.1, 0.7));
    const flip = ease(seg(p, 0.12, 0.42));
    const s = bowShot(p, 0.34, 0.5);
    const land = bump(p, 0.68, 0.84);
    const hold = soft(seg(p, 0.8, 0.94));
    return {
      weapon: lerp(lerp(BOW_REST, rollOn(BOW_AIM, s), soft(seg(p, 0, 0.2))), BOW_REST, hold) + 8 * s.kick, arm: lerp(lerp(BOW_LOW, BOW_ARM, soft(seg(p, 0, 0.2))), BOW_LOW, hold), lift: 32 * hop - 2.5 * crouch + 0.6 * acBounce(p, 0.84), tilt: (flip < 1 ? flip * Math.PI * 2 : 0) - 0.06 * s.kick + 0.16 * hold,
      pull: s.pull, nock: s.nock, twang: s.twang, lunge: 2 * hop,
      rig: (r) => {
        if (flip < 1 && hop > 0.2) tuck(r);
        else danceLegs(r, [hop, [2.4, -3.6, 30], [-2.4, -2.4, -30]], [land, [2.4, 0, 6], [-2.2, 0, -8]], [hold, [1.8, 0, 6], [-2.8, -0.8, -30]]);
        r.air = hop > 0.2;
        r.squat = q(2 * (crouch + land) + hold);
        bowDraw(r, s);
        if (hold > 0.1) r.backArm = [q(-6 + 9 * hold), q(-3 + 4 * hold)];
        r.hairLift = hop > 0.3 ? -1 : 0;
        if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.4) r.eyes = 'happy';
      },
    };
  },
  // Up + attack: a deep backbend, the bow arm thrust up and out ahead of her and the bow tipped right
  // back (its top limb passes behind her head), an arrow loosed steeply into the sky.
  acup(p) {
    const bend = soft(seg(p, 0, 0.26)) * (1 - soft(seg(p, 0.78, 1)));
    const s = bowShot(p, 0.22, 0.5);
    return {
      // (Aimed up and out ahead, the bow hand thrust up in front, so the tipped bow stands ahead of her face.)
      weapon: lerp(BOW_REST, -34, bend) + 8 * s.kick, arm: lerp(BOW_LOW, 100, bend), tilt: -0.42 * bend, lunge: -2 * s.kick, lift: 5 * bump(p, 0.44, 0.7) + acBounce(p, 0.72) * 0.6, pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.air = bump(p, 0.44, 0.7) > 0.4;
        r.backArm = s.snap > 0 ? [q(-5 + 4 * (1 - bend)), q(-4)] : [q(lerp(1, -1, s.pull)), q(lerp(1, -1, s.pull))];
        r.hx = q(-3.5 * bend);
        r.tilt = Math.round(-4 * bend) * 2;
        r.squat = q(1.5 * bend);
        danceLegs(r, [bend, [3, 0, 10], [-2.6, 0, -6]]);
        r.hairLift = bend > 0.4 ? 1 : 0;
        if (s.kick > 0.3) strikeFace(r);
        else if (s.pull > 0.4) r.eyes = 'half';
      },
    };
  },
  // In the air: knees tucked, then legs kicked out straight as she aims down and looses.
  acair(p) {
    const s = bowShot(p, 0.1, 0.42);
    const kick = soft(seg(p, 0.3, 0.5));
    return {
      weapon: 50 + 10 * s.kick, arm: 38, tilt: 0.4 - 0.12 * s.kick, pull: s.pull * 0.45, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.air = true;
        r.backArm = s.snap > 0 ? [-4, 0] : [q(2 - 6 * s.pull), 6];
        danceLegs(r, [1 - kick, [2.6, -5, 40], [-0.6, -4, 20]], [kick, [3, -2, 30], [-5, -2.4, -50]]);
        r.hairLift = -1;
        if (s.kick > 0.3) strikeFace(r);
      },
    };
  },
  // Out of a run: a dive roll forward, coming up into a kneeling shot.
  acdive(p) {
    const dive = Math.sin(Math.PI * seg(p, 0, 0.3));
    const roll = ease(seg(p, 0.1, 0.42));
    const rolling = p > 0.08 && p < 0.42;
    const s = bowShot(p, 0.4, 0.58);
    const kneel = soft(seg(p, 0.42, 0.5)) * (1 - soft(seg(p, 0.85, 1)));
    return {
      weapon: rolling ? 30 : lerp(rollOn(BOW_AIM, s), BOW_REST, soft(seg(p, 0.8, 1))) + 8 * s.kick, arm: rolling ? 50 : lerp(BOW_ARM, BOW_LOW, soft(seg(p, 0.8, 1))),
      tilt: rolling ? roll * Math.PI * 2 : 0.5 * dive * (p < 0.1 ? 1 : 0), lift: 8 * dive, lunge: 4 * (1 - kneel) - 3 * s.kick,
      pull: rolling ? 0 : s.pull, nock: !rolling && s.nock, twang: s.twang,
      rig: (r) => {
        if (rolling || dive > 0.3) tuck(r);
        r.squat = q(3 * kneel);
        if (rolling) r.backArm = [-2, -3];
        else bowDraw(r, s);
        if (!rolling) danceLegs(r, [kneel, [3.4, 0, 10], [-5.5, 0, -70]]);
        if (s.kick > 0.3) strikeFace(r);
      },
    };
  },
  // Handspring (her Vault): a run-in, hands to the ground and a handspring over them (the whole body
  // turning), landing behind them and turning to shoot back the way she came (shot at 0.8).
  achandspring(p) {
    const crouch = bump(p, 0, 0.14);
    const hop = Math.sin(seg(p, 0.1, 0.66) * Math.PI);
    const flip = ease(seg(p, 0.12, 0.62));
    const land = bump(p, 0.62, 0.78);
    const raise = ease(seg(p, 0.66, 0.78));
    const s = bowShot(p, 0.66, 0.8);
    const hold = soft(seg(p, 0.9, 1));
    return {
      weapon: lerp(lerp(BOW_REST, rollOn(BOW_AIM, s), raise), BOW_REST, hold) + 10 * s.kick, arm: lerp(lerp(BOW_LOW, BOW_ARM, raise), BOW_LOW, hold), pull: s.pull, nock: s.nock && raise > 0.2, twang: s.twang,
      lift: 44 * hop, tilt: flip * Math.PI * 2 + 0.12 * crouch, lunge: -3 * s.kick,
      rig: (r) => {
        if (hop > 0.2) tuck(r);
        else r.squat = q(2 * Math.max(crouch, land));
        bowDraw(r, s, raise);
        if (s.snap > 0) r.backArm = [q(-6 + 4 * hold), -3];
        r.hairLift = hop > 0.3 ? -1 : 0;
        r.cape -= hop > 0.3 ? 3 : 0;
        if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.4) r.eyes = 'wink';
      },
    };
  },
  // Springboard (her trap): she crouches and sets a little springboard down in front of her, gives
  // it a pat that makes it boing, and pops back up with a peace sign.
  acspring(p) {
    const down = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.6, 0.8)));
    const pat = bump(p, 0.32, 0.46) + bump(p, 0.46, 0.58) * 0.6;
    const up = soft(seg(p, 0.7, 0.9));
    return {
      weapon: 40, arm: 30, lunge: 2 * down, lift: 2 * bump(p, 0.7, 0.95),
      rig: (r) => {
        r.squat = q(3 * down);
        r.backArm = [q(lerp(4 + 2 * down, 3, up)), q(lerp(4 * down - 2 * pat, -8, up))];
        danceLegs(r, [down, [2.6, 0, 10], [-2.4, 1.6, -60]]);
        if (up > 0.5) [r.eyes, r.mouth] = ['wink', 'grin'];
      },
    };
  },
  // Grand Somersault (her finisher, 1.9 s): a deep crouch, a huge leap, three somersaults on the way
  // up; at the top she opens out and pitches nose-down over them, the bow drawn along her body so
  // the arrows run out below her face, and looses a ring of golden arrows over everything below
  // (~0.6 to ~0.8); then she tucks into one more forward turn on the drop and lands with a wink.
  acsomersault(p) {
    const crouch = bump(p, 0, 0.16);
    const up = ease(seg(p, 0.12, 0.42));
    const flips = ease(seg(p, 0.14, 0.52));
    const fall = easeIn(seg(p, 0.8, 0.93));
    const land = bump(p, 0.9, 1);
    const high = up * (1 - fall);
    const aim = soft(seg(p, 0.5, 0.6)) * (1 - soft(seg(p, 0.8, 0.84)));
    const drop = soft(seg(p, 0.8, 0.91));
    const tucked = p > 0.81 && p < 0.9;
    const rain = rel(p, 0.6, 0.8) ? Math.abs(Math.sin(seg(p, 0.6, 0.8) * Math.PI * 5)) : 0;
    const hold = soft(seg(p, 0.94, 1));
    // Nose-down while she aims (about 60 degrees), then on round forward to upright as she drops.
    const pitch = p < 0.8 ? 1.05 * soft(seg(p, 0.5, 0.6)) : lerp(1.05, Math.PI * 2, drop);
    return {
      weapon: aim > 0.05 ? BOW_AIM - 8 * rain : 30, arm: aim > 0.05 ? lerp(50, BOW_ARM + 6, aim) : 50, lift: 62 * high - 3 * crouch, tilt: flips * Math.PI * 6 + pitch - 0.08 * rain,
      pull: aim > 0.5 ? 1 - rain : 0, nock: aim > 0.5 && rain < 0.5, twang: rain > 0.8 ? 1 : 0,
      rig: (r) => {
        r.air = high > 0.1;
        if ((flips > 0 && flips < 1) || tucked) tuck(r);
        else if (aim > 0.05) danceLegs(r, [aim, [4, -3, 40], [-4.5, -2.4, -50]]);
        else danceLegs(r, [land + hold, [2.8, 0, 6], [-2.6, 0, -10]]);
        r.squat = q(2 * (crouch + land));
        if (aim > 0.5) bowDraw(r, { pull: 1 - rain, snap: rain > 0.8 ? 0.5 : 0 });
        else r.backArm = tucked ? [1, 0] : [q(-2 + 6 * hold), q(-3 - 6 * hold)];
        r.hairLift = high > 0.2 ? -1 : 0;
        r.cape -= q(3 * high);
        if (aim > 0.5) strikeFace(r);
        if (hold > 0.4) [r.eyes, r.mouth] = ['wink', 'grin'];
      },
    };
  },

  // ---------- The Phantom Trickster's moves (her own; docs/design/phantom-trickster.md) ----------
  // A stage magician with a bow: mysterious and teasing, unhurried, every shot dressed up as a
  // trick. A flourish of the free hand before the draw, a swirl of the cape, a "ta-da" reveal, a
  // card flicked from her wrist, a smirk and a bow when it lands. The short recurve is drawn in the
  // same clean line as the Acrobat's (`bowDraw`: the arrow under her jaw), but her long recurve is
  // held lower and canted forward, a showman's tilt that keeps its curled tips off her face,
  // and rests low at her hip between tricks; the free hand works the crowd.

  // Flourish (opener, the arrow leaves at ~0.52): with the bow low at her hip, her free hand rolls
  // out in a wide magician's flourish (out in front, up over her head, and away behind her, fingers
  // spreading), then comes back to the string; a sly smile as she looses.
  ptflourish(p) {
    const sweep = seg(p, 0.02, 0.3);
    const sweeping = p > 0.02 && p < 0.3;
    const raise = soft(seg(p, 0.24, 0.36));
    const s = bowShot(p, 0.32, 0.52);
    const hold = soft(seg(p, 0.62, 0.8));
    const click = bump(p, 0.58, 0.78);
    // The hand's path round her shoulder: forward and low, up over her head, out wide behind her.
    const ang = lerp(-0.3, 3.5, soft(sweep));
    // The draw and the loose from an arabesque: up on her front toes, the back leg lifted high.
    const arab = soft(seg(p, 0.28, 0.4)) * (1 - soft(seg(p, 0.6, 0.74)));
    return {
      weapon: lerp(lerp(BOW_REST, rollOn(PT_AIM, s), raise), BOW_REST, hold) + 8 * s.kick, arm: lerp(lerp(36, PT_ARM, raise), 40, hold), lunge: 3 * bump(p, 0.02, 0.4) - 2 * s.kick, tilt: -0.12 * bump(p, 0.02, 0.3) - 0.04 * s.kick + 0.06 * click + 0.12 * arab,
      lift: 4 * bump(p, 0.04, 0.34) + 3 * arab + 7 * click + ptFloat(p, 0.78),
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        bowDraw(r, s, raise);
        if (sweeping) r.backArm = [q(1 + 9 * Math.cos(ang)), q(-3 - 8 * Math.sin(ang))];
        else if (raise < 0.6) r.backArm = [q(lerp(-6, 2, raise)), q(lerp(-1, -1, raise))];
        if (s.snap > 0) r.backArm = [q(-6 + 4 * hold), q(-2 + 2 * hold)];
        r.cape -= q(4 * bump(p, 0.1, 0.36));
        r.hairLift = bump(p, 0.1, 0.3) > 0.5 ? -1 : 0;
        r.air = click > 0.35;
        danceLegs(r, [bump(p, 0.02, 0.32), [1.8, -1.4, 4], [-1.2, -2, -24]], [arab, [1, -0.4, 2], [-6.4, -5, -72]], [click, [0.4, -3.6, 18], [-0.4, -3.8, -22]]);
        if (sweeping) r.eyes = 'half';
        if (click > 0.4) [r.eyes, r.mouth] = ['wink', 'grin'];
        else if (hold > 0.4) [r.eyes, r.mouth] = ['half', 'cat'];
      },
    };
  },
  // Cape swirl (second, arrows at ~0.38 and ~0.66): a half turn away with the bow tucked low and the
  // cape swirling round her, back round to loose one, and another.
  ptswirl(p) {
    const turned = p > 0.08 && p < 0.24;
    const tuckIn = 1 - soft(seg(p, 0.22, 0.3));
    const s1 = bowShot(p, 0.24, 0.38);
    const s2 = bowShot(p, 0.44, 0.66);
    const sh = p < 0.42 ? s1 : s2;
    const swirl = bump(p, 0.02, 0.4);
    const hop = bump(p, 0.04, 0.3);
    const hold = soft(seg(p, 0.72, 0.88));
    // Dropped to one knee for the second arrow, the cape pooling round her.
    const kneel = soft(seg(p, 0.4, 0.5)) * (1 - soft(seg(p, 0.74, 0.9)));
    return {
      weapon: lerp(PT_AIM + 20 * (soft(s1.snap) * (1 - s2.pull) + soft(s2.snap)), BOW_REST, Math.max(tuckIn, hold)) + 8 * sh.kick, arm: lerp(PT_ARM, 34, Math.max(tuckIn, hold * 0.5)) + 8 * kneel, turn: turned ? -1 : 1,
      pull: tuckIn > 0.1 ? 0 : sh.pull, nock: tuckIn <= 0.1 && sh.nock, twang: Math.max(s1.twang, s2.twang), lunge: 3 * swirl - 2 * sh.kick, lift: 8 * hop + ptFloat(p, 0.7), tilt: 0.1 * Math.sin(seg(p, 0.02, 0.4) * Math.PI * 2) - 0.04 * sh.kick,
      rig: (r) => {
        r.cape -= q(6 * swirl);
        r.hairLift = swirl > 0.4 ? -1 : 0;
        bowDraw(r, sh);
        if (tuckIn > 0.1) r.backArm = [q(-5 * tuckIn), q(-5 * tuckIn)];
        r.air = hop > 0.35;
        r.squat = q(4 * kneel);
        r.cape -= q(-2 * kneel);
        danceLegs(r, [swirl, [1, -0.8, 6], [-2, -1.6, -20]], [hop, [1.4, -3.4, 30], [-1.6, -3, -40]], [kneel, [4.6, 0, 12], [-5.8, 1.4, -84]]);
        if (sh.kick > 0.3) strikeFace(r);
        else if (turned) r.eyes = 'half';
      },
    };
  },
  // Ta-da (the finish, ~0.54): she sweeps her free arm open wide as if pulling away a cloth, holds
  // the reveal, then a full draw and a big arrow; she ends with a little bow and a smirk.
  ptreveal(p) {
    const reveal = soft(seg(p, 0.02, 0.2)) * (1 - soft(seg(p, 0.26, 0.34)));
    const s = bowShot(p, 0.3, 0.54);
    const leap = bump(p, 0.3, 0.56);
    const bow = soft(seg(p, 0.66, 0.8)) * (1 - soft(seg(p, 0.86, 0.96)));
    return {
      weapon: lerp(lerp(rollOn(PT_AIM, s), 40, p < 0.2 ? 1 : reveal), 50, bow) + 10 * s.kick, arm: lerp(lerp(PT_ARM, 44, p < 0.2 ? 1 : reveal), 40, bow), lunge: 5 * leap - 3 * s.kick, tilt: -0.08 * s.kick + 0.28 * bow - 0.1 * reveal - 0.1 * leap,
      lift: 4 * reveal + 18 * leap + ptFloat(p, 0.88),
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        bowDraw(r, s);
        if (reveal > 0.05) r.backArm = [q(-8 * reveal), q(-6 * reveal)];
        else if (bow > 0.1) r.backArm = [q(4 * bow), q(2 * bow)];
        r.cape -= q(4 * reveal + 3 * s.kick);
        r.air = leap > 0.35;
        danceLegs(r, [reveal, [2.4, -1.6, 4], [-2.4, -1.6, -6]], [leap, [3, -6, 56], [-0.6, -6.4, -10]], [bow, [1.6, 0, 4], [-2.4, -1, -30]]);
        if (s.kick > 0.3) strikeFace(r);
        else if (bow > 0.3) [r.eyes, r.mouth] = ['half', 'cat'];
        else if (reveal > 0.4) r.mouth = 'grin';
      },
    };
  },
  // Card flick (an opener in her pool, the arrow at ~0.5): the bow hangs at her hip while she cocks
  // her wrist back to her shoulder and flicks a playing card at them with a wink (it flies with the
  // arrow's effect), her weight snapping forward with it; then she brings the bow up for a quick shot.
  ptcard(p) {
    const cock = soft(seg(p, 0, 0.1)) * (1 - ease(seg(p, 0.1, 0.16)));
    const flick = ease(seg(p, 0.1, 0.16)) * (1 - soft(seg(p, 0.24, 0.34)));
    const raise = soft(seg(p, 0.24, 0.34));
    const s = bowShot(p, 0.3, 0.5);
    const hold = soft(seg(p, 0.62, 0.8));
    const skip = bump(p, 0.04, 0.28);
    const click = bump(p, 0.58, 0.78);
    return {
      weapon: lerp(lerp(BOW_REST, rollOn(PT_AIM, s), raise), BOW_REST, hold) + 8 * s.kick, arm: lerp(lerp(32, PT_ARM, raise), 40, hold),
      lunge: 4 * flick - 2 * s.kick, tilt: -0.1 * cock + 0.14 * flick + 0.06 * click, lift: 5 * skip + 7 * click + ptFloat(p, 0.78),
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        bowDraw(r, s, raise);
        if (raise < 0.6) r.backArm = [q(lerp(2, 3, cock) + 8 * flick), q(-1 - 4 * cock - 3 * flick)];
        if (s.snap > 0) r.backArm = [q(-6 + 4 * hold), -1];
        r.air = skip > 0.4 || click > 0.35;
        r.squat = q(2 * flick);
        danceLegs(r, [cock, [1.8, 0, 4], [-1.4, -0.8, -16]], [flick, [5.4, 0, 14], [-5.6, 0.4, -46]], [click, [0.4, -3.6, 18], [-0.4, -3.8, -22]]);
        if (flick > 0.3) r.eyes = 'wink';
        else if (click > 0.4) [r.eyes, r.mouth] = ['half', 'grin'];
        else if (hold > 0.5) r.mouth = 'cat';
      },
    };
  },
  // Lazy lean (second in her pool, arrows at ~0.36 and ~0.62): bored, she leans right back on her
  // back foot, the front heel resting out ahead of her, and looses two from low at the hip with the
  // bow canted over, without even looking.
  ptlean(p) {
    const lean = soft(seg(p, 0, 0.18)) * (1 - soft(seg(p, 0.84, 1)));
    const s1 = bowShot(p, 0.14, 0.36);
    const s2 = bowShot(p, 0.4, 0.62);
    const sh = p < 0.38 ? s1 : s2;
    return {
      weapon: lerp(40, 46, lean) + 8 * sh.kick, arm: lerp(34, 30, lean), tilt: -0.36 * lean - 0.05 * sh.kick, lunge: -1.5 * sh.kick, lift: 1.6 * Math.abs(Math.sin(seg(p, 0, 0.84) * Math.PI * 3)) * lean + ptFloat(p, 0.82),
      pull: sh.pull * 0.8, nock: sh.nock, twang: Math.max(s1.twang, s2.twang),
      rig: (r) => {
        r.backArm = sh.snap > 0 ? [q(-3 + 2 * sh.snap), 2] : [q(2 - 5 * sh.pull), q(2)];
        r.squat = q(0.8 * lean);
        r.hx = q(-1 * lean);
        r.tilt = Math.round(-3 * lean) * 2;
        r.cape -= q(2 * lean);
        // Moonwalking: the feet trade places as she glides, the front heel lifting in turn.
        const slide = Math.sin(seg(p, 0, 0.84) * Math.PI * 3) * lean;
        danceLegs(r, [lean, [5, -0.4, 24], [-1.4, 0, -4]], [Math.max(0, slide) * 0.6, [4, -1.4, 30], [-2.2, 0, -8]], [Math.max(0, -slide) * 0.6, [5.4, 0, 20], [-0.6, -1.6, -24]]);
        r.eyes = 'half';
        if (lean > 0.5) r.mouth = 'cat';
      },
    };
  },
  // Curtsy (a finish in her pool, ~0.6): a deep curtsy, the bow held out to the side, then she rises
  // straight into a full draw and a big arrow.
  ptcurtsy(p) {
    const dip = soft(seg(p, 0.02, 0.24)) * (1 - soft(seg(p, 0.3, 0.42)));
    const s = bowShot(p, 0.38, 0.6);
    const hold = soft(seg(p, 0.7, 0.86));
    const rise = bump(p, 0.32, 0.6);
    return {
      weapon: lerp(lerp(rollOn(PT_AIM, s), 70, dip), BOW_REST, hold) + 10 * s.kick, arm: lerp(lerp(PT_ARM, 40, dip), 40, hold), tilt: 0.22 * dip - 0.08 * s.kick - 0.06 * rise, lunge: 4 * rise - 3 * s.kick, lift: -2 * dip + 9 * rise + ptFloat(p, 0.76),
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.squat = q(2 * dip);
        bowDraw(r, s);
        if (dip > 0.05) r.backArm = [q(-6 * dip), q(2 * dip)];
        else if (s.snap > 0) r.backArm = [q(-6 + 4 * hold), -1];
        r.air = rise > 0.35;
        danceLegs(r, [dip, [2, 0, 4], [-4.5, 1.6, -60]], [rise, [2, -3.2, 26], [-2.2, -3.6, -50]]);
        if (dip > 0.4) r.eyes = 'happy';
        else if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.4) [r.eyes, r.mouth] = ['half', 'cat'];
      },
    };
  },
  // Up + attack: standing tall with a pop of the hip, she lifts the bow up and out ahead of her
  // (tipped right back, its top limb behind her head), draws to her chin and looses into the sky,
  // the free hand going to her hip after.
  ptup(p) {
    const up = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.8, 1)));
    const s = bowShot(p, 0.18, 0.46);
    return {
      weapon: lerp(BOW_REST, -32, up) + 8 * s.kick, arm: lerp(40, 98, up), tilt: -0.36 * up, lunge: -1.5 * s.kick, lift: 3 * up + 4 * bump(p, 0.42, 0.66) + ptFloat(p, 0.7), pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.backArm = s.snap > 0 ? [q(-3), q(lerp(-3, 3, soft(s.snap)))] : s.pull > 0.05 ? [q(lerp(1, -1, s.pull)), q(lerp(1, -1, s.pull))] : [-3, 3];
        r.hx = q(-3.5 * up);
        r.tilt = Math.round(-4 * up) * 2;
        danceLegs(r, [up, [2.2, 0, 4], [-1, -0.8, -16]]);
        if (s.kick > 0.3) strikeFace(r);
        else r.eyes = 'half';
      },
    };
  },
  // In the air: she floats, cape billowing up round her, and looses down at them.
  ptair(p) {
    const s = bowShot(p, 0.08, 0.4);
    return {
      weapon: 50 + 10 * s.kick, arm: 38, tilt: 0.36 - 0.1 * s.kick, lift: breathe(p) * 0.8, pull: s.pull * 0.45, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.air = true;
        r.backArm = s.snap > 0 ? [-4, 0] : [q(2 - 6 * s.pull), 6];
        r.cape -= 5;
        r.hairLift = -1;
        danceLegs(r, [1, [1.4, -3, 20], [-1, -2.4, -10]]);
        r.eyes = 'half';
      },
    };
  },
  // Out of a run: a low smoke-step glide (she vanishes in a puff and slides out of it further on):
  // she drops into a long, low lunge and skims along the floor, leaning into it with the bow tucked
  // back and the cape streaming, then rises out of it into a shot.
  ptdash(p) {
    const glide = soft(seg(p, 0, 0.16)) * (1 - soft(seg(p, 0.42, 0.6)));
    const raise = soft(seg(p, 0.3, 0.44));
    const s = bowShot(p, 0.38, 0.58);
    const hold = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(lerp(BOW_REST, 60, glide), rollOn(PT_AIM, s), raise), BOW_REST, hold) + 8 * s.kick, arm: lerp(lerp(lerp(40, 24, glide), PT_ARM, raise), 40, hold),
      tilt: 0.2 * glide, lunge: 5 * glide - 2 * s.kick,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.squat = q(3.4 * glide);
        r.cape -= q(6 * glide);
        r.hairLift = glide > 0.4 ? 1 : 0;
        bowDraw(r, s, raise);
        if (raise < 0.6) r.backArm = [q(-7 * glide), q(-2 * glide)];
        danceLegs(r, [glide, [5.5, 0, 14], [-6, 0, -50]]);
        if (s.kick > 0.3) strikeFace(r);
        else r.eyes = 'half';
      },
    };
  },
  // Smoke Bomb: she crouches and slaps a smoke bomb down at her feet (~0.4), the smoke billowing up
  // round her, and stands with a smirk as it clears.
  ptbomb(p) {
    const down = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.55, 0.8)));
    const slap = bump(p, 0.3, 0.46);
    return {
      weapon: 58, arm: 26, lunge: 1.5 * down,
      rig: (r) => {
        r.squat = q(3 * down);
        r.backArm = [q(4 + 2 * slap), q(5 * down + 3 * slap - 2)];
        r.cape -= q(4 * slap);
        danceLegs(r, [down, [2.6, 0, 10], [-3.6, 0, -50]]);
        if (slap > 0.4) r.eyes = 'happy';
        else if (p > 0.8) [r.eyes, r.mouth] = ['half', 'cat'];
      },
    };
  },
  // Showstopper (her buff): a slow, grand bow, free hand sweeping across her chest, then she rises
  // and snaps her fingers high (~0.6): her copies flare.
  ptshow(p) {
    const bow = soft(seg(p, 0.02, 0.3)) * (1 - soft(seg(p, 0.36, 0.5)));
    const snap = soft(seg(p, 0.5, 0.6)) * (1 - soft(seg(p, 0.85, 1)));
    return {
      weapon: lerp(10, 60, bow), arm: lerp(70, 40, bow), tilt: 0.3 * bow,
      rig: (r) => {
        r.backArm = bow > 0.05 ? [q(5 * bow), q(1 * bow)] : [q(2 * snap), q(-12 * snap)];
        r.hairLift = bow > 0.5 ? 1 : 0;
        danceLegs(r, [bow, [1.8, 0, 4], [-2.6, -1, -30]]);
        if (bow > 0.4) r.eyes = 'happy';
        else if (snap > 0.4) [r.eyes, r.mouth] = ['wink', 'grin'];
      },
    };
  },
  // Grand Illusion (her finisher, 2.4 s). She is hidden in smoke from about 0.2 to 0.72 while her
  // copies take the stage (world/phantom.js), so the act is in the two ends. The opening: she flings
  // both arms open to the crowd (~0.04), whirls round once with the cape sweeping up round her, and
  // snaps her fingers high (~0.17): gone. The return: she springs out of the smoke at ~0.73 with a
  // half turn and a lift, lands arms flung wide ("ta-da!"), sinks into a deep, slow stage bow with the
  // bow swept out to the side, and rises with a smirk.
  ptillusion(p) {
    const open = soft(seg(p, 0, 0.05)) * (1 - soft(seg(p, 0.06, 0.1)));
    const whirl = seg(p, 0.06, 0.14);
    const whirling = p > 0.06 && p < 0.14;
    const snap = soft(seg(p, 0.13, 0.17)) * (1 - soft(seg(p, 0.2, 0.26)));
    const gone = soft(seg(p, 0.2, 0.26)) * (1 - soft(seg(p, 0.66, 0.72)));
    const spring = Math.sin(Math.PI * seg(p, 0.72, 0.8));
    const back = p > 0.72 && p < 0.77;
    const tada = soft(seg(p, 0.76, 0.8)) * (1 - soft(seg(p, 0.83, 0.86)));
    const bow = soft(seg(p, 0.84, 0.92)) * (1 - soft(seg(p, 0.96, 1)));
    const wide = Math.max(open, tada);
    return {
      weapon: lerp(lerp(lerp(lerp(58, 80, wide), 30, snap), 60, bow), 60, gone), arm: lerp(lerp(lerp(lerp(30, 98, wide), 50, snap), 30, bow), 28, gone),
      turn: whirling ? Math.sign(Math.cos(whirl * Math.PI * 2) || 1) : back ? -1 : 1,
      lift: 3 * open + 4 * bump(p, 0.06, 0.15) + 3 * snap + 10 * spring + breathe(p) * gone, tilt: 0.34 * bow - 0.06 * wide, lunge: 2 * tada,
      rig: (r) => {
        const free = wide > 0.05 ? [q(-8 * wide), q(-5 * wide)] : snap > 0.05 ? [q(2 * snap), q(-12 * snap)] : bow > 0.05 ? [q(5 * bow), q(1 * bow)] : [q(-3 * gone), q(-4 * gone)];
        r.backArm = whirling ? [q(-2), q(-8)] : free;
        r.air = spring > 0.3 || bump(p, 0.06, 0.15) > 0.5;
        r.cape -= q(6 * Math.max(bump(p, 0.04, 0.2), spring, tada));
        r.hairLift = whirling || spring > 0.3 ? -1 : 0;
        danceLegs(r, [Math.max(open, tada), [3, 0, 6], [-3.4, 0, -10]], [whirling ? 1 : 0, [1.2, -4, 30], [-0.4, -1.4, -6]], [spring, [2.4, -4, 30], [-1.8, -3, -30]], [bow, [1.8, 0, 4], [-3.4, -1, -36]]);
        r.squat = q(1.5 * bow + bump(p, 0.78, 0.84));
        if (snap > 0.3) [r.eyes, r.mouth] = ['wink', 'grin'];
        else if (wide > 0.4) [r.eyes, r.mouth] = ['happy', 'open'];
        else if (bow > 0.3) r.eyes = 'happy';
        else if (p > 0.95) [r.eyes, r.mouth] = ['half', 'cat'];
        else if (gone > 0.5) r.eyes = 'half';
      },
    };
  },

  // ---------- Her own versions of the Acrobat Archer's skills (data/path-skills.js) ----------

  // Vanishing Act (her Handspring, 0.66 s; gone from 0.24 to 0.56, the arrow at 0.8): no flip. She
  // flicks her free hand out and sweeps the cape round across her with a half turn, a wink, and is
  // gone in a puff of smoke; she steps out of another behind it already turning (her back to where
  // she went), draws as she comes round and looses back at it, then lets the trick land.
  ptvanish(p) {
    const flick = soft(seg(p, 0, 0.1)) * (1 - soft(seg(p, 0.1, 0.2)));
    const sweep = seg(p, 0.08, 0.24);
    const gone = p > 0.24 && p < 0.56;
    const out = soft(seg(p, 0.56, 0.66));
    const s = bowShot(p, 0.66, 0.8);
    const raise = soft(seg(p, 0.6, 0.7));
    const hold = soft(seg(p, 0.86, 1));
    // Turned away from where she's going as she steps out, then round to face it (her facing flips
    // with the shot at 0.8, so the drawing turns with it).
    const turn = p < 0.08 ? 1 : p < 0.24 ? (sweep < 0.5 ? 1 : -1) : p < 0.8 ? -1 : 1;
    return {
      weapon: lerp(lerp(BOW_REST, rollOn(PT_AIM, s), raise), BOW_REST, hold) + 8 * s.kick, arm: lerp(lerp(36, PT_ARM, raise), 40, hold),
      turn, pull: s.pull, nock: s.nock && raise > 0.3, twang: s.twang,
      lift: 3 * bump(p, 0.06, 0.24) + 4 * bump(p, 0.54, 0.7) + ptFloat(p, 0.86), lunge: -2 * s.kick + 2 * out * (1 - raise), tilt: -0.08 * flick + 0.1 * bump(p, 0.1, 0.24) - 0.04 * s.kick,
      rig: (r) => {
        if (p < 0.24) {
          // The free hand flicked out, then the cape swept round across her.
          r.backArm = sweep > 0 ? [q(lerp(-6, 6, soft(sweep))), q(-2 - 3 * Math.sin(Math.PI * sweep))] : [q(-6 * flick), q(-4 * flick)];
          r.cape -= q(6 * Math.sin(Math.PI * sweep));
          danceLegs(r, [flick, [2.4, 0, 6], [-2.6, -0.6, -14]], [Math.sin(Math.PI * sweep), [1.2, -3, 24], [-0.6, -1, -8]]);
          r.air = bump(p, 0.06, 0.24) > 0.5;
          r.eyes = sweep > 0.4 ? 'wink' : undefined;
          r.mouth = 'cat';
        } else if (gone) {
          r.squat = 1;
          r.backArm = [3, -2];
        } else {
          bowDraw(r, s, raise);
          danceLegs(r, [out * (1 - raise), [2.4, -3, 26], [-1.6, -2, -24]], [raise, [3, 0, 6], [-2.8, 0, -12]]);
          r.cape -= q(4 * out * (1 - raise));
          if (s.kick > 0.3) r.mouth = 'grin';
          else if (hold > 0.4) [r.eyes, r.mouth] = ['half', 'cat'];
        }
      },
    };
  },

  // Levitation (her Grand Somersault, 1.9 s; the hat at ~0.48, the arrows ~0.6 to ~0.85): the
  // magician's levitation trick. She sweeps the cape round herself with a whirl, then floats slowly
  // up off the floor and tips back until she lies flat on the air, toes pointed, one hand trailing;
  // at the top she swings upright and snaps her fingers high (the giant hat appears over the stage),
  // draws up at it and looses arrow after arrow into it (it pours them down on everything below),
  // drifts back down with her cape billowing and sinks into a deep stage bow.
  ptlevitate(p, dur) {
    const whirl = seg(p, 0.03, 0.12);
    const whirling = p > 0.03 && p < 0.12;
    const float = soft(seg(p, 0.1, 0.42));
    const lie = soft(seg(p, 0.16, 0.34)) * (1 - soft(seg(p, 0.4, 0.48)));
    const snap = soft(seg(p, 0.44, 0.5)) * (1 - soft(seg(p, 0.52, 0.56)));
    const aim = soft(seg(p, 0.54, 0.6)) * (1 - soft(seg(p, 0.84, 0.88)));
    const loose = rel(p, 0.6, 0.84) ? Math.abs(Math.sin(seg(p, 0.6, 0.84) * Math.PI * 4)) : 0;
    const drop = soft(seg(p, 0.84, 0.94));
    const bow = soft(seg(p, 0.93, 0.98)) * (1 - soft(seg(p, 0.99, 1)) * 0.3);
    const high = float * (1 - drop);
    return {
      weapon: aim > 0.05 ? lerp(BOW_REST, PT_AIM - 50, aim) + 6 * loose : lerp(BOW_REST, 60, bow), arm: aim > 0.05 ? lerp(40, PT_ARM + 30, aim) : lerp(36, 40, bow),
      pull: aim > 0.5 ? 1 - loose : 0, nock: aim > 0.5 && loose < 0.5, twang: loose > 0.8 ? 1 : 0,
      turn: whirling ? Math.sign(Math.cos(whirl * Math.PI * 2) || 1) : 1,
      lift: 50 * high + breathe(p) * 1.5 * high + 3 * bump(p, 0.03, 0.12), tilt: -1.15 * lie - 0.1 * aim + 0.32 * bow,
      rig: (r) => {
        r.air = high > 0.08;
        if (whirling) { r.backArm = [-2, -6]; r.cape -= 5; }
        else if (aim > 0.3) bowDraw(r, { pull: 1 - loose, snap: loose > 0.8 ? 0.5 : 0 });
        else if (snap > 0.05) r.backArm = dancerHand([q(2 * snap), q(-12 * snap)]);
        else if (bow > 0.05) r.backArm = [q(5 * bow), q(1 * bow)];
        else r.backArm = [q(2 * float), q(3 * lie)];
        // Legs together and long, toes pointed, as she lies on the air.
        if (high > 0.08) danceLegs(r, [Math.max(lie, 0.6), [1.2, -0.6, 8], [-0.6, -0.6, -8]], [aim, [2, -2.6, 20], [-1.6, -1.6, -20]]);
        else danceLegs(r, [bow, [1.8, 0, 4], [-3.4, -1, -36]]);
        r.cape -= q(4 * Math.max(high * 0.8, drop * (1 - bow)));
        r.hairLift = lie > 0.3 ? 1 : drop > 0.2 && bow < 0.5 ? -1 : 0;
        r.squat = q(1.5 * bow + bump(p, 0.9, 0.96));
        if (snap > 0.3) [r.eyes, r.mouth] = ['wink', 'grin'];
        else if (lie > 0.4) [r.eyes, r.mouth] = ['blink', 'cat'];
        else if (aim > 0.5) strikeFace(r);
        else if (bow > 0.3) r.eyes = 'happy';
      },
    };
  },

  // Top Hat (her Springboard; the hat is down at ~0.4): she tips her hat to them, sweeps it off
  // in a bow and sets it down on the floor brim-up, taps it twice with the tip of her bow, and
  // straightens up with a finger snap and a smirk.
  pthattrap(p) {
    const tip = soft(seg(p, 0, 0.12)) * (1 - soft(seg(p, 0.14, 0.22)));
    const bowDown = soft(seg(p, 0.16, 0.36)) * (1 - soft(seg(p, 0.66, 0.8)));
    const set = soft(seg(p, 0.22, 0.4));
    const tap = bump(p, 0.44, 0.52) + bump(p, 0.54, 0.62);
    const snap = soft(seg(p, 0.8, 0.88)) * (1 - soft(seg(p, 0.95, 1)) * 0.5);
    return {
      weapon: lerp(BOW_REST, 112, bowDown) + 14 * tap, arm: lerp(36, 52, bowDown) - 6 * tap, tilt: 0.32 * bowDown, lunge: 2 * bowDown,
      lift: ptFloat(p, 0.8),
      rig: (r) => {
        r.backArm = tip > 0.05 ? dancerHand([q(1 * tip), q(-8 * tip)]) : snap > 0.05 ? dancerHand([q(2 * snap), q(-12 * snap)]) : [q(lerp(0, 7, set) * bowDown), q(lerp(0, 4, set) * bowDown)];
        danceLegs(r, [bowDown, [2.2, 0, 4], [-3.4, -1, -34]]);
        r.squat = q(1.2 * bowDown);
        if (tip > 0.4) r.eyes = 'wink';
        else if (tap > 0.4) r.mouth = 'cat';
        else if (snap > 0.4) [r.eyes, r.mouth] = ['half', 'grin'];
      },
    };
  },

  // ---------- The Sky Dancer's moves (her own; docs/design/sky-dancer.md) ----------
  // She dances on the air: every figure is drawn airborne (legs free, toes pointed, never standing),
  // her gloved palms and her feet throwing the wind. Her figures are a dancer's, big and clear at
  // game size: legs long and clear of the body (`dancerLeg`), knees tucked or split, the free arm
  // flung wide (the glove hand stays below about 100 degrees and the free hand below her jaw, or they
  // come up over her face). Each figure gathers in, strikes early, and ends floating in a held pose
  // that breathes.

  // Palm push (opener, the gust leaves at ~0.4): she gathers both palms at her chest with her knees
  // tucked up, then pushes both palms out and down at them, tipping forward with her legs
  // stretching long behind, like a swimmer on the wind.
  sdpalm(p) {
    const gather = soft(seg(p, 0, 0.28));
    const push = ease(seg(p, 0.28, 0.42));
    const hold = soft(seg(p, 0.5, 0.88));
    // She swoops up as she gathers, dives into the push, and floats back up on the wind.
    return {
      weapon: 90, arm: lerp(lerp(50, 35, gather), 66, push) - 6 * hold, lift: 6 * gather * (1 - push) - 3 * bump(p, 0.3, 0.6) + ballon(p, 0.56), lunge: 7 * push * (1 - hold * 0.4), tilt: -0.12 * gather * (1 - push) + 0.38 * push * (1 - hold * 0.4),
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(4 * gather, 6, push) * (1 - hold * 0.3)), q(lerp(-5 * gather, -1, push))]);
        r.hairLift = push > 0.3 ? 1 : -1;
        r.cape -= q(3 * push);
        danceLegs(r, [gather * (1 - push), [4, -11, 50], [1, -10, 30]], [push, [-2, -5, -20], [-11, -8, -60]], [hold, [2, -6, 20], [-9, -7, -45]]);
        if (push > 0.3) strikeFace(r);
      },
    };
  },
  // Scissor kick (second, ~0.45): the legs switch in the air, the front one kicking high above her
  // waist and the wind leaving off its toe, the body leaning back from it and both arms flung wide.
  sdscissor(p) {
    const load = soft(seg(p, 0, 0.28));
    const kick = ease(seg(p, 0.28, 0.44));
    const hold = soft(seg(p, 0.56, 0.9));
    // A cabriole: her legs beat together in the air as she rises into the kick.
    const beat = bump(p, 0.08, 0.3);
    return {
      weapon: 90, arm: lerp(lerp(45, 35, load), 100, kick) - 8 * hold, tilt: -0.3 * kick * (1 - hold * 0.5) + 0.08 * load * (1 - kick), lift: 7 * bump(p, 0.12, 0.58) + ballon(p, 0.62), lunge: 5 * kick * (1 - hold * 0.5),
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-4, -10, kick)), q(lerp(-6, -10, kick))]);
        r.hairLift = kick > 0.3 ? 1 : 0;
        danceLegs(r, [load * (1 - kick), [-6, -8, -40], [5, -9, 40]], [beat * (1 - kick), ...CABRIOLE], [kick, dancerLeg(110, 14.6, 60), [-9, -6, -40]], [hold, [10, -10, 40], [-8, -6, -36]]);
        if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Aerial spin (third, ~0.5 all round her): two quick half turns like a spinning top, knees drawn
  // up together with the feet tucked behind, both arms raised in a wide V; she opens out of it into
  // a star, arms and legs wide.
  sdspin(p) {
    const a = ease(seg(p, 0.06, 0.62)) * 2;
    const turning = p > 0.06 && p < 0.62;
    const up = soft(seg(p, 0, 0.16));
    const open = soft(seg(p, 0.62, 0.8));
    return {
      weapon: 90, arm: lerp(lerp(50, 100, up), 95, open), lift: 10 * bump(p, 0.04, 0.72) + ballon(p, 0.72), lunge: 4 * bump(p, 0.04, 0.72), trail: turning,
      turn: turning ? dancerTurn(a) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-10 * up, -10, open)), q(lerp(-10 * up, -8, open))]);
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.06, 0.7));
        danceLegs(r, [up, [-2.6, -6, -40], [-4.4, -5, -40]], [open, [9, -8, 40], [-9, -8, -40]]);
        if (turning) strikeFace(r);
      },
    };
  },
  // Crescent kick (the finish, the great gust leaves at ~0.48): she leans back with the leg drawn
  // far behind her, swings it forward and up high in a crescent, arms flung wide,
  // then chops it down and drives both palms after it, hanging there stretched long.
  sdcrescent(p) {
    const wind = soft(seg(p, 0, 0.3));
    const sweep = ease(seg(p, 0.3, 0.44));
    const chop = ease(seg(p, 0.44, 0.52));
    const hold = soft(seg(p, 0.56, 0.9)) * (1 - soft(seg(p, 0.92, 1)));
    const phi = lerp(lerp(lerp(10, -75, wind), 132, sweep), 62, chop);
    return {
      weapon: 90, arm: lerp(lerp(lerp(50, 25, wind), 95, sweep), 68, chop) - 6 * hold, tilt: -0.24 * wind * (1 - sweep) - 0.14 * sweep * (1 - chop) + 0.26 * chop * (1 - hold * 0.5), lunge: -3 * wind * (1 - sweep) + 9 * chop, lift: 8 * wind * (1 - chop) - 3 * chop * (1 - hold) + ballon(p, 0.62),
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(lerp(-6 * wind, -10, sweep), 6, chop)), q(lerp(lerp(-6 * wind, -10, sweep), -2, chop))]);
        r.hairLift = chop > 0.3 ? 1 : -1;
        r.cape -= q(5 * sweep);
        danceLegs(r, [1, dancerLeg(phi, 14.6, phi < 0 ? -50 : 50), [-6, -5, -30]], [hold, [8, -8, 40], [-9, -7, -50]]);
        if (sweep > 0.2) strikeFace(r);
      },
    };
  },
  // Twirl (opener in her pool, ~0.48): one turn wrapped up tight, arms in and a foot at her knee,
  // then she unfurls: a palm pushes out after the gust, the free arm flies back and the
  // back leg opens long into attitude.
  sdtwirl(p) {
    const a = ease(seg(p, 0.05, 0.42));
    const turning = p > 0.05 && p < 0.42;
    const push = ease(seg(p, 0.42, 0.54));
    const hold = soft(seg(p, 0.6, 0.9));
    return {
      weapon: 90, arm: lerp(lerp(50, 30, soft(seg(p, 0, 0.1))), 85, push) - 8 * hold, trail: turning, lift: 7 * bump(p, 0.03, 0.5) + ballon(p, 0.6), lunge: 6 * push * (1 - hold * 0.5), tilt: 0.16 * push * (1 - hold * 0.5),
      turn: turning ? dancerTurn(a) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(4 * soft(seg(p, 0, 0.1)), -9, push)), q(lerp(-6 * soft(seg(p, 0, 0.1)), -10, push) + 3 * hold)]);
        r.hairLift = turning ? -1 : 0;
        danceLegs(r, [soft(seg(p, 0, 0.1)), [2, -8, 40], [-0.4, -1, -8]], [push, [1, -3, -10], dancerLeg(-70, 13.4, -50)], [hold, [3, -5, 20], [-9, -9, -45]]);
        if (push > 0.3) strikeFace(r);
      },
    };
  },
  // Flutter (second in her pool, gusts at ~0.3 and ~0.6): both arms beat down twice like wings, from
  // high and wide to low at her sides, lifting her on each beat, her
  // legs fluttering below.
  sdflutter(p) {
    const k = lerp(lerp(lerp(lerp(lerp(0.3, 1, soft(seg(p, 0, 0.16))), 0, ease(seg(p, 0.18, 0.3))), 1, soft(seg(p, 0.32, 0.46))), 0, ease(seg(p, 0.48, 0.6))), 0.35, soft(seg(p, 0.7, 1)));
    const s = Math.sin(p * Math.PI * 6);
    const hold = soft(seg(p, 0.7, 1));
    return {
      weapon: 90, arm: lerp(35, 100, k), tilt: 0.2 * (1 - k) * (1 - hold) - 0.12 * k, lift: 6 * bump(p, 0.22, 0.5) + 6 * bump(p, 0.52, 0.82) + ballon(p, 0.82) * 0.6, lunge: 3 * bump(p, 0.22, 0.5) + 3 * bump(p, 0.52, 0.82),
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-6, -10, k)), q(lerp(2, -10, k))]);
        r.hairLift = k < 0.4 ? 1 : -1;
        danceLegs(r, [1, [5 + 4 * s, -8 - 4 * s, 40], [-7 + 4 * s, -7 + 3 * s, -40]], [hold, [4, -7, 30], [-7, -7, -36]]);
        if (k < 0.4 && p > 0.2) strikeFace(r);
      },
    };
  },
  // Axe heel (third in her pool, ~0.54): the front leg rises high and straight out in front of her
  // as she leans back and rises, arms open wide for balance, then chops down, the wind falling off her heel onto
  // whatever is below, arms pulled down with it.
  sdheel(p) {
    const raise = soft(seg(p, 0, 0.4));
    const chop = ease(seg(p, 0.42, 0.54));
    const hold = soft(seg(p, 0.6, 0.9));
    const phi = lerp(lerp(10, 118, raise), 45, chop);
    return {
      weapon: 90, arm: lerp(lerp(45, 95, raise), 40, chop) + 20 * hold, tilt: -0.28 * raise * (1 - chop) + 0.24 * chop * (1 - hold * 0.6), lift: 13 * raise * (1 - chop) - 3 * chop * (1 - hold) + ballon(p, 0.64), lunge: 6 * chop * (1 - hold * 0.5),
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(lerp(-5, -10, raise), -6, chop)), q(lerp(lerp(-4, -8, raise), 0, chop) - 6 * hold)]);
        r.hairLift = chop > 0.3 ? -1 : 1;
        danceLegs(r, [1, dancerLeg(phi, 14.6, 50), [lerp(-2, -7, chop), lerp(-2, -6, chop), lerp(-10, -30, chop)]], [hold, [8, -7, 40], [-7, -6, -30]]);
        if (chop > 0.2) strikeFace(r);
      },
    };
  },
  // Sweeping kick (a finish in her pool, ~0.4 round her, the gust at ~0.55): she tips over and turns
  // once with the back leg swung out long behind her, arms wide, and the wind sweeps off it round
  // her; she comes out of the turn in a floating attitude, arms wide.
  sdsweep(p) {
    const a = ease(seg(p, 0.1, 0.56));
    const into = soft(seg(p, 0, 0.12));
    const turning = p > 0.1 && p < 0.56;
    const hold = soft(seg(p, 0.56, 0.76)) * (1 - soft(seg(p, 0.86, 1)));
    return {
      weapon: 90, arm: lerp(lerp(50, 95, into), 100, hold), trail: turning, lift: 8 * bump(p, 0.08, 0.62) + ballon(p, 0.66), lunge: 5 * bump(p, 0.08, 0.62), tilt: 0.24 * into * (1 - hold) - 0.12 * hold,
      turn: turning ? dancerTurn(a) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([-10, q(lerp(-9 * into, -10, hold))]);
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.1, 0.62));
        danceLegs(r, [into, [1, -2, -10], dancerLeg(-95, 14.6, -70)], [hold, [9, -12, 50], [-8, -6, -40]]);
        if (turning || hold > 0.3) strikeFace(r);
      },
    };
  },
  // Rising spiral (Up + attack, ~0.4): she spirals straight up, one turn, both arms sweeping up into
  // a wide V and her legs drawn up together, throwing them up with her; at the top she opens into
  // a star.
  sdrise(p) {
    const a = ease(seg(p, 0.08, 0.55));
    const turning = p > 0.08 && p < 0.55;
    const up = soft(seg(p, 0, 0.3));
    const open = soft(seg(p, 0.58, 0.85));
    return {
      weapon: 90, arm: lerp(lerp(50, 100, up), 95, open), lift: 16 * bump(p, 0.04, 0.8) - 2 * soft(seg(p, 0, 0.08)) * (1 - up) + ballon(p, 0.8), trail: turning,
      turn: turning ? dancerTurn(a) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-10 * up, -10, open)), q(lerp(-10 * up, -9, open))]);
        r.hairLift = -1;
        danceLegs(r, [up, [0.4, -1, -30], [-1.6, -2, -30]], [open, [7, -8, 30], [-7, -7, -30]]);
        if (turning) strikeFace(r);
      },
    };
  },
  // Glide (out of a run, ~0.42): she lays out flat along the wind, both palms pushed out in front,
  // legs trailing together behind, then rights herself.
  sdglide(p) {
    const lay = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.72, 1)));
    const push = ease(seg(p, 0.3, 0.44));
    return {
      weapon: 90, arm: lerp(60, 96, push) - 30 * soft(seg(p, 0.72, 1)), tilt: 0.55 * lay, lunge: 9 * lay, lift: 4 * bump(p, 0, 0.36) + ballon(p, 0.74),

      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(8 * push * lay), q(-7 * push * lay)]);
        r.hairLift = 1;
        r.cape -= q(5 * lay);
        danceLegs(r, [lay, [-6, -5, -40], [-8, -6, -50]]);
        if (push > 0.3) strikeFace(r);
      },
    };
  },
  // Downburst (~0.6, then the dive runs on to the ground): she rises on the wind, gathering tight
  // with the glove drawn back by her hip (to ~0.3); rolls over forward at the top, and dives
  // head-first, glove driven straight down ahead of her, free arm swept back, legs together and
  // pointed behind like an arrow. (The landing pose is the shared landslam.)
  sddive(p) {
    const gather = soft(seg(p, 0, 0.3));
    const roll = ease(seg(p, 0.3, 0.42));
    const dive = soft(seg(p, 0.38, 0.55));
    return {
      weapon: 90, arm: lerp(lerp(50, 30, gather), 4, dive), lift: 4 * gather * (1 - dive) + ballon(p, 0.3) * (1 - roll),
      tilt: -0.12 * gather * (1 - roll) + 0.7 * roll, lunge: 3 * dive, trail: dive > 0.2,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-6 * gather, -10, dive)), q(lerp(-4 * gather, 2, dive))]);
        r.hairLift = dive > 0.3 ? 1 : -1;
        r.cape -= q(5 * dive);
        danceLegs(r, [gather, [3, -10, 50], [1, -9, 30]], [dive, [-2, -1, -20], [-3, -1, -30]]);
        if (gather > 0.2 || dive > 0.2) strikeFace(r);
      },
    };
  },
  // Gale Step (~0.42, cuts at ~0.3 and ~0.55): she lies out flat on a gust and shoots forward,
  // glove pushed out ahead, free arm swept back along her side, legs long and together like a
  // swallow's tail; then she sweeps upright and floats on her toes with a little smile.
  sdgale(p) {
    const lay = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.68, 0.95)));
    const push = ease(seg(p, 0.1, 0.26));
    const up = soft(seg(p, 0.7, 0.95));
    return {
      weapon: 90, arm: lerp(lerp(55, 92, push), 70, up), tilt: 0.62 * lay - 0.06 * up, lunge: 8 * lay, lift: 3 * lay + ballon(p, 0.8), trail: lay > 0.3,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-9 * lay, -7, up)), q(lerp(3 * lay, -5, up))]);
        r.hairLift = lay > 0.3 ? 1 : 0;
        r.cape -= q(6 * lay);
        danceLegs(r, [lay, [-7, -4, -50], [-9, -5, -60]], [up, [2.4, -5, 20], [-3, -6, -30]]);
        if (up > 0.5) [r.eyes, r.mouth] = ['happy', 'cat'];
        else if (lay > 0.2) strikeFace(r);
      },
    };
  },
  // Cloud Nine (~0.8, the clouds come up at ~0.5): she rises onto her toes and sweeps both arms
  // up from low at her sides in a slow wide circle (to ~0.45), then opens them wide and high like
  // wings as the ring of clouds rolls up round her, one knee lifted in a little passé; she holds
  // it, eyes closed in the breeze, and settles back down.
  sdcloud(p) {
    const sweep = soft(seg(p, 0.05, 0.45));
    const open = soft(seg(p, 0.42, 0.58));
    const settle = soft(seg(p, 0.82, 1));
    return {
      weapon: 90, arm: lerp(lerp(lerp(20, 80, sweep), 108, open), 55, settle), lift: (3 * sweep + 4 * open) * (1 - settle), tilt: -0.08 * open * (1 - settle),
      rig: (r) => {
        r.air = open > 0.2 && settle < 0.6;
        r.backArm = dancerHand([q(lerp(lerp(-1, -7, sweep), -10, open) * (1 - settle)), q(lerp(lerp(4, -4, sweep), -11, open) * (1 - settle))]);
        r.hairLift = open > 0.3 && settle < 0.5 ? -1 : 0;
        danceLegs(r, [open * (1 - settle), [3, -9, 40], [-0.6, -1, -6]]);
        if (open > 0.4 && settle < 0.7) r.eyes = 'happy';
      },
    };
  },
  // Sky Waltz (her finisher, 1.6 s): she rises with her arms lifting and turns, slowly then faster
  // and faster as the tornado gathers, climbing higher; at the top she pulls in tight, then drives
  // both palms straight down (~0.7) and the tornado slams them into the ground; she opens into her
  // signature pose, floating high (glove high out in front, free arm flung wide, one leg
  // pointed long in front and the other in attitude behind), and curtsies to the sky.
  sdwaltz(p) {
    const rise = soft(seg(p, 0, 0.14));
    const a = easeIn(seg(p, 0.12, 0.6)) * 3;
    const turning = p > 0.12 && p < 0.6;
    const open = soft(seg(p, 0.12, 0.55));
    const climb = soft(seg(p, 0.3, 0.6));
    const gather = soft(seg(p, 0.58, 0.64));
    const slam = ease(seg(p, 0.64, 0.7));
    const pose = soft(seg(p, 0.72, 0.8));
    const bow = soft(seg(p, 0.9, 0.97));
    const end = soft(seg(p, 0.98, 1));
    const armT = lerp(50, 100, open);
    return {
      weapon: 90, arm: lerp(lerp(lerp(lerp(lerp(armT, 30, gather), 10, slam), 100, pose), 30, bow), 50, end),
      turn: turning ? dancerTurn(a) : 1,
      lift: (4 * rise + 10 * climb) * (1 - bow * 0.5) - 6 * slam * (1 - pose) + ballon(p, 0.74), tilt: 0.24 * slam * (1 - pose) - 0.14 * pose * (1 - bow) + 0.3 * bow * (1 - end), trail: turning,

      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([
          q(lerp(lerp(lerp(lerp(lerp(-2 - 9 * open, 4, gather), 3, slam), -10, pose), -10, bow), 0, end)),
          q(lerp(lerp(lerp(lerp(lerp(-6 - 8 * open, -6, gather), 4, slam), -10, pose), -2, bow), 0, end)),
        ]);
        r.hairLift = slam > 0.3 && pose < 0.5 ? 1 : -1;
        r.cape -= q(5 * (turning ? 1 : pose * (1 - bow)));
        danceLegs(r, [rise, [0.6, -2, 8], [-0.6, -2, -8]], [turning ? 1 : 0, [2, -8, 40], [-0.4, -1, -10]], [gather, [3, -11, 50], [-1, -10, 30]], [pose, dancerLeg(70, 14, 40), dancerLeg(-70, 12.6, -50)], [bow, [4, -2, 14], [-4, -3, -20]], [end, [2, -3, 10], [-2, -3, -10]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning || pose > 0.3 || slam > 0.3) strikeFace(r);
      },
    };
  },

  // The Wind Dancer's skills, her way (data/skills.js `paths`):
  // Zephyr turn (her Pirouette, cuts at ~0.25 and ~0.55): a sky-blue whirl lifts her (the
  // skyupdraft effect) and she drifts forward turning like a leaf on the wind, tipped forward in a
  // stag leap (front knee bent, back leg long), both arms spread low like wings; she rights herself
  // and floats down, arms open, toes pointed, with a cheeky smile.
  sdzephyr(p) {
    const up = soft(seg(p, 0, 0.14));
    const a = ease(seg(p, 0.1, 0.64)) * 2;
    const turning = p > 0.1 && p < 0.64;
    const open = soft(seg(p, 0.64, 0.82));
    return {
      weapon: 90, arm: lerp(lerp(50, 62, up), 84, open), turn: turning ? dancerTurn(a) : 1, trail: turning,
      lift: 12 * up * (1 - 0.5 * open) + 2 * Math.sin(a * Math.PI) * (turning ? 1 : 0) + ballon(p, 0.7), lunge: 4 * bump(p, 0.1, 0.7), tilt: 0.3 * up * (1 - open) - 0.06 * open,
      rig: (r) => {
        r.air = true;
        r.backArm = dancerHand([q(lerp(-7 * up, -9, open)), q(lerp(1 * up, -6, open))]);
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.08, 0.7));
        danceLegs(r, [up, [4, -9, 60], dancerLeg(-100, 14.6, -60)], [open, [2.4, -5, 20], [-3, -6, -30]]);
        if (open > 0.5) [r.eyes, r.mouth] = ['happy', 'cat'];
        else if (turning) strikeFace(r);
      },
    };
  },
  // Cloudburst (her Grand Finale, 1.35 s; cuts from ~0.28, the big one at ~0.74): she spirals up
  // into a gathering storm of clouds (the skycloudburst effect), arms sweeping up into a wide V and
  // faster with every turn; at the top she curls into a ball, hangs a beat, then unrolls into a
  // diving axe heel, the leg chopping down from high over her head as the clouds burst open; she
  // floats back up on the blast into a star, arms and legs flung wide, and dips her head to it.
  sdcloudburst(p) {
    const a = easeIn(seg(p, 0.04, 0.46)) * 2.5;
    const turning = p > 0.04 && p < 0.46;
    const climb = soft(seg(p, 0.02, 0.46));
    const curl = soft(seg(p, 0.46, 0.54)) * (1 - ease(seg(p, 0.62, 0.68)));
    const raise = ease(seg(p, 0.6, 0.68));
    const chop = ease(seg(p, 0.68, 0.75));
    const star = soft(seg(p, 0.78, 0.88)) * (1 - soft(seg(p, 0.94, 1)) * 0.5);
    const phi = lerp(lerp(20, 125, raise), 40, chop);
    return {
      weapon: 90, arm: lerp(lerp(lerp(lerp(45, 100, soft(seg(p, 0, 0.2))), 28, curl), 64, chop), 98, star), turn: turning ? dancerTurn(a) : 1, trail: turning,
      lift: 14 * climb * (1 - chop) + 2 * curl - 4 * chop * (1 - star) + 6 * star + ballon(p, 0.88) * 0.6, lunge: 6 * chop * (1 - star), tilt: 0.14 * curl - 0.18 * raise * (1 - chop) + 0.3 * chop * (1 - star) + 0.12 * soft(seg(p, 0.92, 1)),
      rig: (r) => {
        r.air = true;
        const v = soft(seg(p, 0, 0.2));
        r.backArm = dancerHand([q(lerp(lerp(lerp(-10 * v, 3, curl), -6, chop), -10, star)), q(lerp(lerp(lerp(-10 * v, -3, curl), 2, chop), -10, star))]);
        r.hairLift = chop > 0.3 && star < 0.5 ? 1 : -1;
        r.cape -= q(5 * Math.max(turning ? 1 : 0, chop));
        danceLegs(r, [turning ? 1 : 0, [0.4, -1, -30], [-1.6, -2, -30]], [curl, [3, -11, 60], [1, -10, 40]], [raise, dancerLeg(phi, 14.6, 50), [-6, -6, -30]], [star, [9, -8, 40], [-9, -8, -40]]);
        if (curl > 0.5) r.eyes = 'half';
        else if (star > 0.5) [r.eyes, r.mouth] = ['happy', 'grin'];
        else if (turning || chop > 0.2) strikeFace(r);
      },
    };
  },

  // The flash jump: a second kick off the air that throws her forward, body laid out flat and
  // streamlined with the arms swept back, then a tuck as she rides it out.
  flashjump(p) {
    const kick = bump(p, 0, 0.3);
    const lay = ease(seg(p, 0.05, 0.25)) * (1 - ease(seg(p, 0.65, 1)));
    return {
      weapon: lerp(25, 150, lay), arm: lerp(60, 15, lay), tilt: 0.55 * lay - 0.1 * kick, lift: 3 * kick,
      rig: (r) => { if (lay > 0.4) { r.backArm = [-6, 0]; r.frontLeg = [-1, -2, -40]; r.backLeg = [-4, -1, -60]; } else tuck(r); r.hairLift = -1; r.cape -= 4; r.mouth = 'open'; },
    };
  },

  // The shadow dash: dropped low into a sprint, leaning hard into it, dagger reversed along the
  // arm and the free hand trailing, then she plants and rises.
  shadowrun(p) {
    const go = ease(seg(p, 0, 0.15)) * (1 - ease(seg(p, 0.75, 1)));
    const stride = Math.sin(p * Math.PI * 6);
    return {
      weapon: lerp(25, 160, go), arm: lerp(60, 20, go), tilt: 0.42 * go, lunge: -2 * go,
      rig: (r) => { if (go > 0.3) { r.squat = 2; r.frontLeg = [q(2 + 3 * stride), 0, q(30 * stride)]; r.backLeg = [q(-2 - 3 * stride), 0, q(-30 * stride)]; r.backArm = [-6, 1]; r.hairLift = -1; r.cape -= 4; strikeFace(r); } },
    };
  },

  // A spinning roundhouse: turn on the front foot with the dagger tucked, the leg whipping round
  // high into them, and come back down on guard. Lands at about 0.5.
  spinkick(p) {
    if (p < 0.28) {
      const t = ease(p / 0.28);
      return { weapon: lerp(25, 140, t), arm: lerp(60, 35, t), tilt: -0.1 * t, rig: (r) => { r.squat = 1; wideLegs(r); r.tx = -1; r.backArm = [2, -2]; } };
    }
    const a = ease(seg(p, 0.28, 0.5));
    const back = ease(seg(p, 0.66, 1));
    const kick = bump(p, 0.32, 0.72);
    return {
      weapon: 140 - 40 * back, arm: 35 + 20 * back, orbit: true, turn: a < 0.5 ? -1 : 1, lift: 5 * kick, tilt: -0.22 * kick, lunge: 6 * kick,
      rig: (r) => {
        r.frontLeg = kick > 0.3 ? [q(3 + 4 * kick), q(-6 * kick), q(60 + 30 * kick)] : [2, 0, 4];
        r.backLeg = [-2, 0, -6];
        r.backArm = [-4, -4];
        r.hairLift = -1;
        r.cape = -4;
        if (kick > 0.3) strikeFace(r);
      },
    };
  },

  // A whirl: two quick turns with the dagger out, cutting everything round her, then a backflip
  // out of it. Cuts at about 0.22 and 0.46.
  whirlflip(p) {
    // (The free arm swings out with the spin, then tucks in for the flip and opens to land.)
    const out = bump(p, 0.04, 0.6);
    const tuckIn = bump(p, 0.6, 0.85);
    const open = bump(p, 0.82, 1);
    const m = p < 0.6 ? MOVES.spin(p / 0.6, 1) : backflip(seg(p, 0.62, 0.95), 0.5);
    return { ...m, rig: (r) => { m.rig?.(r); r.backArm = [q(r.backArm[0] - 3.5 * out + 2 * tuckIn - 2 * open), q(r.backArm[1] - 3 * out - 2 * tuckIn - 1.5 * open)]; } };
  },

  // A defensive stance: crouch behind the weapon held up across the body.
  guard(p) {
    const k = ease(seg(p, 0, 0.3)) * (1 - ease(seg(p, 0.85, 1)));
    return {
      weapon: lerp(25, 65, k), arm: lerp(60, 70, k), tilt: -0.08 * k, lunge: -2 * k,
      rig: (r) => { r.squat = k > 0.5 ? 2 : 1; wideLegs(r); r.backArm = [3, -2]; r.tx = -1; },
    };
  },


  // A prayer: weapon held close, the other hand raised to it, eyes closed, floating a little.
  pray(p) {
    const k = ease(seg(p, 0, 0.3)) * (1 - ease(seg(p, 0.85, 1)));
    return {
      weapon: -5, arm: lerp(70, 115, k), lift: 3 * k + Math.sin(p * 12) * 0.5 * k,
      rig: (r) => { r.backArm = [2, -4]; r.eyes = 'blink'; r.hairLift = -1; r.cape -= 1; },
    };
  },

  // (The life-skill moves, gathering to crafting, are in render/life-moves.js.)
  ...LIFE_MOVES,

  // (The other players' own moments, AFK to showing off, are in render/social-moves.js.)
  ...SOCIAL_MOVES,

  // (The emotes, cheer to sad, are in render/emote-moves.js.)
  ...EMOTE_MOVES,

  // (Malvina Grimsworth's own, the would-be villainess: render/villain-moves.js.)
  ...VILLAIN_MOVES,

  // A happy fist pump with a little hop.
  cheer(p) {
    const hop = bump(p, 0.15, 0.6);
    return {
      weapon: lerp(25, -20, bump(p, 0, 1)), arm: lerp(60, 170, bump(p, 0, 1)), lift: 8 * hop,
      rig: (r) => { if (hop > 0.2) tuck(r); r.backArm = [-2, -5]; strikeFace(r); },
    };
  },
};


// Long-feeling moves need a little more time than a quick swing to read properly.
export const MOVE_MIN = {
  pthattrap: 0.7, aewind: 0.7,
  overhead: 0.45, plunge: 0.55, rising: 0.45, spin: 0.42, flip: 0.45, slam: 0.45, castup: 0.5, roar: 0.5,
  guard: 0.45, pray: 0.5, cheer: 0.45, ...LIFE_MIN, ...SOCIAL_MIN, ...EMOTE_MIN, ...VILLAIN_MIN, draw: 0.38, aimshot: 0.5, skyshot: 0.5, castspin: 0.45, barrage: 0.4,
  flurry: 0.4, dash: 0.35, vanish: 0.3, cleave: 0.55, cross: 0.45, sweep: 0.4, spinback: 0.45, shove: 0.35, risecut: 0.45, leapchop: 0.6, jabs: 0.4, flashcut: 0.34, drivestab: 0.4, hammer: 0.7, skysplit: 0.9, quickshot: 0.3, bash: 0.4, rampage: 1.3, meteor: 0.4, landslam: 0.3, dashstab: 0.4, verdict: 1.5, eclipse: 1.5, pslash: 0.35, pthrust: 0.35, ascend: 0.45, smite: 0.6, consecrate: 0.8, salute: 0.5, cleave1: 0.45, cleave2: 0.45, gyre: 0.45, reaver: 0.7, warroar: 0.6, axehurl: 0.55, bodyslam: 0.8, dragrise: 0.8, shieldslam: 0.6, shieldrush: 0.8, recklesscharge: 0.85,
  spinshot: 0.4, hopshot: 0.45, pointblank: 0.45, hipfire: 0.3, vault: 0.5, downshot: 0.35, comet: 1.3, leapshot: 0.5, galeshot: 0.55, tailwind: 0.5, stormvolley: 1.5, slideshot: 0.4, kneelshot: 0.45, crankshot: 0.5, ballista: 0.65, rollshot: 0.5, steadyaim: 0.5, heartseeker: 1.5, titanbreak: 1.4, backstab: 0.5, assassinate: 1.5, crossflip: 0.6, spinkick: 0.4, whirlflip: 0.6, flashjump: 0.3, shadowrun: 0.3,
};

// Basic attacks chain into a combo per weapon type.
const COMBOS = {
  sword: ['slash', 'slash2', 'slash'],
  axe: ['slash', 'slash2', 'overhead'],
  spear: ['thrust', 'slash2', 'thrust'],
  dagger: ['thrust', 'slash', 'thrust'],
  gauntlet: ['throw', 'throw'],
  bow: ['draw'],
  crossbow: ['draw'],
  wand: ['castforward'],
  staff: ['castforward', 'castup'],
  none: ['thrust', 'slash2'],
};

export function basicMove(weaponType, step) {
  const combo = COMBOS[weaponType] ?? COMBOS.none;
  return combo[step % combo.length];
}

// The move for a skill when it doesn't name one: by type, weapon, and shape.
export function defaultMove(type, weaponType, params) {
  if (type === 'buff') return 'roar';
  if (type === 'heal') return 'pray';
  if (type === 'magic') return params?.projectile ? 'castforward' : params?.range?.around ? 'castup' : 'castforward';
  if (weaponType === 'bow' || weaponType === 'crossbow') return 'draw';
  if (weaponType === 'gauntlet') return 'throw';
  if (weaponType === 'spear') return 'thrust';
  return 'slash';
}

// Melee swings get hand-animated timing (MapleStory's swing is 300 / 150 / 350 ms; Slynyrd's sword
// 100 / 50 / 50 / 50 / 100): a quick wind-up that eases into a short held beat (a player's
// anticipation stays short, or it feels like lag), the cut itself in a few linear frames that carry
// a touch past the hit pose, a sticky hold on that follow-through, then an eased settle. The moves
// are written with a wind-up to about 0.3 and the cut to about 0.65; this reshapes time around
// that, and keeps the blade through the target by the time the blow lands (strikes at 0.42-0.47).
const SNAPPY = new Set(['slash', 'slash2', 'thrust', 'overhead', 'airslash', 'airslash2', 'pslash', 'pthrust']);
function snap(p) {
  if (p < 0.33) return 0.3 * ease(p / 0.33); // wind up
  if (p < 0.39) return 0.3; // the held beat before the cut
  if (p < 0.46) return 0.3 + 0.39 * ((p - 0.39) / 0.07); // the cut, in a flash, a little past the hit
  if (p < 0.56) return 0.69 + 0.02 * ((p - 0.46) / 0.1); // hold the follow-through
  return 0.71 + 0.29 * ease((p - 0.56) / 0.44); // and settle
}

function rawMoveAt(kind, progress, dur) {
  const p = SNAPPY.has(kind) ? snap(clamp01(progress)) : clamp01(progress);
  return { lift: 0, lunge: 0, tilt: 0, turn: 1, stretch: 1, trail: false, ...MOVES[kind](p, dur) };
}

// The body throws its weight behind the weapon (the player asked for combat to feel smooth, snappy
// and fun, not stiff): from how far the weapon has swung over the last part of the move, the body
// leans and steps into the blow and crouches under the hardest ones, rocking back on a backswing,
// and settles as the swing dies (power chains from the hips; research/anim.md 16, 19). A spin's
// sweep (`orbit`) and a still weapon (bows, casting) add nothing; a move's own lean and lunge stay.
const SWAY = { window: 0.18, lean: 0.3, step: 7, at: 100, lead: 0.07, overshoot: 0.4 };

// Each weapon's own feel (the player asked for every weapon to be smooth, snappy and fun, each its
// own way). `pre`/`post` bend the move's time before and after the blow lands (the blow itself never
// moves, so it still lands with the hit): above 1 holds back then rushes in, below 1 rushes then
// lingers. `lean`, `step` and `over` scale the body's lean, its step in and the blade's
// follow-through; `squat` sinks deeper under a heavy blow; `recoil` kicks the body back as a shot
// leaves; `twirl` spins the weapon round in the hand after a cast.
//   axe: a long heavy wind-up, then everything thrown into the chop and carried a long way through.
//   spear: coiled, then a long step into the thrust, the body kept upright behind the reach.
//   dagger: quick flicks, the blade whipping past and back, straight back on guard.
//   gauntlet: the whole arm whipping each star out.
//   bow: a kick back as the arrow leaves; crossbow a harder one.
//   wand and staff: only tipped with the wrist (no club twirls).
export const FEEL = {
  sword: {},
  none: {},
  axe: { pre: 1.8, post: 0.55, lean: 1.4, step: 1.15, over: 1.5, squat: 1 },
  spear: { pre: 1.35, post: 0.8, lean: 0.55, step: 2.3, over: 0.5 },
  dagger: { pre: 1.45, post: 0.5, lean: 0.75, step: 1.35, over: 1.9 },
  gauntlet: { pre: 1.5, post: 0.6, lean: 1.1, over: 1.6, armOver: 2 },
  bow: { recoil: 1.4 },
  crossbow: { recoil: 2.2 },
  wand: { lean: 0.8 },
  staff: { lean: 0.9 },
};
const bend = (p, hit, pre = 1, post = 1) => {
  if (hit == null || hit <= 0.04 || hit >= 0.96) return p;
  return p < hit ? hit * Math.pow(p / hit, pre) : hit + (1 - hit) * Math.pow((p - hit) / (1 - hit), post);
};

// The dancers' figures (Wind, Blade and Sky Dancer) are drawn to exact lines, with their own
// follow-through: the body still leans and steps into each blow, but the arm and ring don't run on
// past the line (a raised hand that overshot would come up over her face).
const DANCER_LINES = /^(wd|bd|sd)[a-z]+$/;

function sway(kind, progress, dur, mv, f = {}) {
  if (mv.weapon == null || mv.orbit || mv.poised || mv.pull != null || mv.nock) return mv;
  const back = rawMoveAt(kind, Math.max(0, progress - SWAY.window), dur);
  if (back.weapon == null || back.orbit) return mv;
  // How hard it's going forward: the blade swinging round, or the arm driving out (a thrust, a
  // throw, a cast), whichever is the bigger.
  const dw = mv.weapon - back.weapon;
  // (How far forward the hand reaches: an arm raised overhead for a wind-up isn't going forward.)
  const reach = (deg) => Math.sin((deg * Math.PI) / 180);
  const da = mv.arm != null && back.arm != null ? (reach(mv.arm) - reach(back.arm)) * 130 : 0;
  const k = Math.tanh((Math.abs(da) > Math.abs(dw) ? da : dw) / SWAY.at);
  // Follow-through: the blade and arm run on a little past where the swing stops and spring back
  // (it reads as a snap on the hit; research/anim.md 19, Saint11's overshot). It's how far they
  // moved over the last moment, carried on.
  const near = rawMoveAt(kind, Math.max(0, progress - SWAY.lead), dur);
  const lim = DANCER_LINES.test(kind) ? 0 : 40 * (f.over ?? 1);
  const over = (a, b, x = 1) => (a == null || b == null ? 0 : Math.max(-lim, Math.min(lim, (a - b) * SWAY.overshoot * (f.over ?? 1) * x)));
  const weapon = mv.weapon + over(mv.weapon, near.weapon);
  const arm = mv.arm == null ? mv.arm : mv.arm + over(mv.arm, near.arm, 0.6 * (f.armOver ?? 1));
  if (Math.abs(k) < 0.02) return { ...mv, weapon, arm };
  const rig = mv.rig;
  return {
    ...mv,
    weapon,
    arm,
    tilt: mv.tilt + SWAY.lean * (f.lean ?? 1) * k,
    lunge: mv.lunge + SWAY.step * (f.step ?? 1) * k,
    rig: (r) => {
      rig?.(r);
      // The upper body leads over the hips (the legs stay where they are).
      r.tx = q((r.tx ?? 0) + 1.5 * k);
      if (k > 0.55 && !r.air) r.squat = Math.max(r.squat ?? 0, (k > 0.85 ? 2 : 1) + (f.squat ?? 0));
      // The free arm flies back against the swing, to balance it.
      if (r.backArm && !r.air) r.backArm = [q(r.backArm[0] - 2 * k), q(r.backArm[1] - 1.5 * Math.abs(k))];
    },
  };
}

// What happens after the blow, by weapon and move: a shot's recoil, a caster's twirl, and a
// finisher's rebound (a hop up off the blow, then a smaller one, then rest: research/combat.md 25).
function after(mv, p, hit, f, fin) {
  if (hit == null) return mv;
  const since = p - hit;
  let out = mv;
  if (f.recoil && since >= 0 && since < 0.22) {
    const k = f.recoil * (1 - since / 0.22) * Math.min(1, since / 0.03);
    out = { ...out, tilt: out.tilt - 0.06 * k, lunge: out.lunge - 2.2 * k };
  }
  if (f.twirl && out.weapon != null && !out.orbit && since > 0.06) {
    const t = clamp01((since - 0.06) / Math.max(0.2, 0.9 - hit));
    out = { ...out, weapon: out.weapon + 360 * f.twirl * (t * t * (3 - 2 * t)) };
  }
  if (fin && since > 0) out = { ...out, lift: out.lift + 5 * bump(p, hit, hit + 0.24) + 1.6 * bump(p, hit + 0.26, hit + 0.42) };
  return out;
}

// Endless Fox-Fire's body, on top of whichever move is playing: one clock for the whole barrage
// (`flow.t0`, seconds into it when this move began), so she keeps moving straight through the
// moves instead of starting each from the same stance. `flow.heat` is how far it has built (0 to
// 1.6, world/melee.js). She sways at the hips and rolls her shoulders to the rhythm, chin up, her
// hair and cape streaming further the hotter it gets; from Ascension (heat 1.25) she rises off the
// ground and floats there, bobbing slowly (streamHover, which the fox-fire wheel follows too).
export const streamHover = (heat, t) => clamp01((heat - 1.25) / 0.25) * (12 + 1.6 * Math.sin(t * 2.4));
export function streamFlow(mv, flow, p, dur) {
  if (!mv || !flow) return mv;
  const t = flow.t0 + p * dur;
  const h = flow.heat;
  const hips = Math.sin(t * 4.4);
  const roll = Math.sin(t * 2.2 + 0.8);
  // (Only Endless Fox-Fire floats; the others keep their feet.)
  const hover = flow.float === false ? 0 : streamHover(h, t);
  const floating = hover > 1;
  return {
    ...mv,
    lift: mv.lift + (floating ? hover : (0.4 + 0.8 * Math.min(1, h)) * Math.abs(Math.sin(t * Math.PI * 2.5))),
    lunge: mv.lunge + (floating ? 1.5 * roll : 0.8 * hips),
    tilt: mv.tilt + 0.05 * roll - 0.03 * Math.min(1, h),
    rig: (r) => {
      mv.rig?.(r);
      r.hairLift = Math.min(r.hairLift ?? 0, -Math.round(1 + 1.4 * h));
      r.hairWave = Math.floor((((t * (1.2 + h)) % 1) + 1) % 1 * 8);
      r.cape = q((r.cape ?? 0) - 1.5 * h + 2 * Math.sin(t * 6));
      r.tx = q((r.tx ?? 0) + 0.8 * hips);
      if (floating) r.air = true;
    },
  };
}

// A move's pose at `progress` (0-1) of `dur` seconds. `feel` is how it's swung: { weapon (its type),
// hit (when its first blow lands, 0-1), fin (a finisher) }.
// A sword, axe or spear is held at the end of its haft and swung round a fist kept down at the
// chest (the greatsword, over the shoulder: the player's pick), so the fist never comes up over
// the face: an arm raised past the chest is eased down to just under the chin, and a wind-up
// that hung the blade down behind a raised hand points it back over the shoulder instead.
export const FIST_CAP = 60;
// Moves that end with the blade standing up in front of the face (from before the greatsword):
// from this point on, the blade tips back onto the shoulder instead.
const SHOULDER_END = { spinback: 0.7, pommel: 0.6, risecut: 0.48, rising: 0.44, airslash2: 0.5, guardspin: 0.7, ascend: 0.5, shieldslam: 0.74, dragrise: 0.7, cleave2: 0.7, bodyslam: 0.72 };
// Moves whose wind-up raised the blade straight up before the face (until the given moment): the
// blade is drawn back over the shoulder for it instead, and comes over the top from there.
const SHOULDER_WIND = { smite: 0.34, verdict: 0.42, gyre: 0.4 };
export function hefted(mv, kind = null, p = 0) {
  if (!mv || mv.arm == null) return mv;
  let out = mv;
  const arm = mv.arm;
  if (arm > 50 && arm < 200) {
    out = { ...mv, arm: 50 + (FIST_CAP - 50) * (1 - Math.exp(-(arm - 50) / 30)) };
    if (arm > 100 && !mv.orbit && mv.weapon != null) {
      const w = ((((mv.weapon % 360) + 540) % 360) - 180);
      if (w < -95) out.weapon = -95 + (w + 95) * 0.25;
    }
  }
  const wind = SHOULDER_WIND[kind];
  if (wind != null && p < wind + 0.06 && out.weapon != null) {
    const k = ease(seg(p, 0, 0.12)) * (1 - ease(seg(p, wind - 0.02, wind + 0.06)));
    const w = ((((out.weapon % 360) + 540) % 360) - 180);
    out = { ...out, weapon: lerp(w, -84, k) };
  }
  const end = SHOULDER_END[kind];
  if (end != null && p > end && out.weapon != null) {
    const k = ease(seg(p, end, Math.min(1, end + 0.2)));
    const w = ((((out.weapon % 360) + 540) % 360) - 180);
    out = { ...out, weapon: lerp(w, -58, k), arm: lerp(out.arm, 48, k), trail: false };
  }
  return out;
}
// The Warrior line's moves each end on a pose of their own (they all used to settle into the same
// blade-down-forward stance), and the finishers on a held signature pose: from `at` the move eases
// (over `span`) into its end pose and holds it, breathing, until the settle back to the shoulder.
// end: [at, span, { weapon, arm, lunge, tilt, lift }, rig(r, k)]; the blade takes the short way.
const legsTo = (r, k, front, back) => {
  const mixL = (a, b) => a.map((v, i) => (i === 2 ? Math.round(lerp(v, b[i], k) / 2) * 2 : q(lerp(v, b[i], k))));
  r.frontLeg = mixL(r.frontLeg ?? [0.8, 0, 0], front);
  r.backLeg = mixL(r.backLeg ?? [-0.8, 0, 0], back);
};
const handTo = (r, k, hand) => { r.backArm = [q(lerp(r.backArm?.[0] ?? 0, hand[0], k)), q(lerp(r.backArm?.[1] ?? 0, hand[1], k))]; };
const END_POSES = {
  // Shoulder Drop: she heaves the blade up and lays it flat across the back of her shoulders,
  // free hand on her hip, pleased with it.
  gsdrop: [0.66, 0.26, { weapon: -102, arm: 54, lunge: 1, tilt: -0.04 }, (r, k) => { r.squat = 0; legsTo(r, k, [2.4, 0, 4], [-1.6, 0, -4]); handTo(r, k, [-1, 2]); if (k > 0.6) r.mouth = 'grin'; }],
  // Whirlwind: the spin carried on into a flourish, the blade swept out level in front, her free
  // arm flung wide behind.
  gsspin: [0.78, 0.18, { weapon: 104, arm: 58, lunge: 6, tilt: 0.1 }, (r, k) => { legsTo(r, k, [4.6, 0, 8], [-4, 0, -14]); handTo(r, k, [-7, -4]); r.hairLift = k > 0.5 ? 1 : 0; }],
  // Greatsword Cleave: the blade left buried, she holds the crouch over it, a hand on her knee.
  gscleave: [0.7, 0.24, { weapon: 154, arm: 42, lunge: 8, tilt: 0.16 }, (r, k) => { r.squat = 2; legsTo(r, k, [4, 0, 10], [-4, 0, -12]); handTo(r, k, [3, 2]); }],
  // Leaping Chop: landed on one knee, the blade point-down beside her.
  leapchop: [0.66, 0.24, { weapon: 176, arm: 32, lunge: 9, tilt: 0.04 }, (r, k) => { r.squat = q(3 * k); legsTo(r, k, [3.6, 0, 8], [-5.8, 0, -76]); handTo(r, k, [-4, -1]); }],
  // Sky Splitter: she rips the blade out of the crater and sweeps it low behind her, crouched wide
  // and leaning in, free hand forward, ready to go again.
  skysplit: [0.72, 0.22, { weapon: 226, arm: 20, lunge: 10, tilt: 0.14 }, (r, k) => { r.squat = 2; legsTo(r, k, [5, 0, 10], [-5, 0, -10]); handTo(r, k, [4, 0]); }],
  // Titan Breaker (a finisher): she stands up out of the landing and hoists the greatsword high
  // behind her head, blade upright, her free fist thrust forward with a shout, and holds it.
  gstitan: [0.8, 0.12, { weapon: -30, arm: 60, lunge: 4, tilt: -0.06 }, (r, k) => { r.squat = q(1 - k); legsTo(r, k, [4, 0, 6], [-4.4, 0, -10]); handTo(r, k, [5, -3]); r.cape = -3; if (k > 0.5) r.mouth = 'open'; }],
  // Grand Verdict (a finisher): the blade held out level at them, judgement passed, her free hand on
  // her heart, eyes half shut.
  plverdict: [0.8, 0.12, { weapon: 86, arm: 60, lunge: 5, tilt: 0.04 }, (r, k) => { legsTo(r, k, [4, 0, 6], [-3, 0, -10]); handTo(r, k, [4, -4]); r.cape = -3; if (k > 0.5) [r.eyes, r.mouth] = ['half', null]; }],
  // Crimson Eclipse (a finisher): the axe left planted head-down in the crater, he leans on the haft
  // and throws his free fist up with a roar.
  bkeclipse: [0.8, 0.12, { weapon: 172, arm: 30, lunge: 4, tilt: -0.04 }, (r, k) => { r.squat = 1; legsTo(r, k, [3.6, 0, 6], [-4, 0, -10]); handTo(r, k, [-3, -8]); r.hairLift = -1; if (k > 0.5) [r.eyes, r.mouth] = ['blink', 'open']; }],
  // Oath Cut: the blade lowered point-down before her, both hands on the pommel: a knight at rest.
  ploath: [0.72, 0.22, { weapon: 178, arm: 26, lunge: 2, tilt: 0 }, (r, k) => { r.squat = 0; legsTo(r, k, [1.4, 0, 0], [-1.6, 0, -2]); handTo(r, k, [5, 0]); if (k > 0.6) r.eyes = 'half'; }],
  // Dawn Step: the blade lifted out up and forward like the sun she swept up, held there.
  pldawn: [0.74, 0.2, { weapon: 52, arm: 58, lunge: 5, tilt: -0.04 }, (r, k) => { legsTo(r, k, [4, 0, 6], [-3.6, 0, -12]); handTo(r, k, [-5, -3]); }],
  // Halo: the blade swept out low to the side, free palm open behind her.
  plhalo: [0.74, 0.2, { weapon: 128, arm: 50, lunge: 3, tilt: 0.04 }, (r, k) => { legsTo(r, k, [3, 0, 4], [-3.4, 0, -8]); handTo(r, k, [-7, -5]); }],
  // Lance: the thrust held out level, long and steady over the front foot.
  pllance: [0.74, 0.2, { weapon: 92, arm: 60, lunge: 8, tilt: 0.1 }, (r, k) => { legsTo(r, k, [5.6, 0, 8], [-4.4, 0, -16]); handTo(r, k, [-6, -1]); }],
};
function heldEnd(mv, p, [at, span, pose, rig]) {
  const k = soft(seg(p, at, at + span));
  if (!mv || k <= 0 || mv.weapon == null) return mv;
  const d = ((((pose.weapon - mv.weapon) % 360) + 540) % 360) - 180;
  const hold = k >= 1 ? Math.sin(p * Math.PI * 6) * 0.3 : 0;
  const base = mv.rig;
  return {
    ...mv, orbit: k > 0.5 ? false : mv.orbit, turn: k > 0.5 ? 1 : mv.turn,
    weapon: mv.weapon + d * k + hold * 2, arm: lerp(mv.arm, pose.arm, k), lunge: lerp(mv.lunge ?? 0, pose.lunge ?? 0, k), tilt: lerp(mv.tilt ?? 0, pose.tilt ?? 0, k), lift: lerp(mv.lift ?? 0, pose.lift ?? 0, k),
    trail: k < 0.3 && mv.trail,
    rig: (r) => { base?.(r); rig(r, k); },
  };
}
// The Warrior line's footwork (2026-11-04, each path in its own idiom):
// every swing travels and lands with the feet, then settles with a beat of its own instead of
// freezing. Each path moves its own way:
//   skip  (the Warrior): a cocky skip into the swing, front knee up and back heel kicked, landing
//         with the blade in a wide stamped plant; a bounce on the toes after.
//   march (the Paladin): a knight's measured advance: the front knee raised high and stamped down
//         as the blow lands, the shield side driven in behind it; one firm settle, never a hop for
//         its own sake.
//   bound (the Berserker): wild bounding leaps, both legs flung back, crashing down into a deep
//         crouch that rocks him forward; a heavy shoulder heave after.
// A move's `beats` are [at, height] (several for a move with several blows; `at` defaults to the
// move's first blow); `pre` how long before the beat the step starts; `drive` px of forward drive
// into the blow; `lean` an extra pitch into the landing; `b` the size of the settle bounces and
// `settleAt` when they start (by default soon after the last beat).
const STEP_STYLES = {
  skip: { air: [[2.6, -4.6, 18], [-2.4, -4.6, -60]], plant: [[4.4, 0, 6], [-4.2, 0, -12]], squat: 2, lean: 0.1, b: 1, hk: 1.5 },
  march: { air: [[2.8, -5.6, 28], [-2.4, 0, -8]], plant: [[4.8, 0, 6], [-3.6, 0, -10]], squat: 1, lean: 0.07, b: 0.6, hk: 1.2 },
  bound: { air: [[3, -6, 30], [-3, -6.4, -80]], plant: [[5, 0, 10], [-5, 0, -14]], squat: 3, lean: 0.16, b: 1.4, hk: 1.6 },
};
const FOOTWORK = {
  // The Warrior.
  gsdrop: { s: 'skip', beats: [[null, 6]], drive: 4 },
  gsrise: { s: 'skip', beats: [[0.55, 5]], pre: 0.3, b: 1.2 },
  gsspin: { s: 'skip', beats: [[0.6, 5]], pre: 0.3, drive: 3 },
  gscleave: { s: 'skip', beats: [[0.5, 8]], pre: 0.4, drive: 6, b: 1.3 },
  sweep: { s: 'skip', beats: [[null, 4]], drive: 6 },
  jabs: { s: 'skip', beats: [[0.2, 3], [0.45, 2], [0.7, 3]], pre: 0.14, drive: 4, b: 0.8 },
  flashcut: { s: 'skip', beats: [[null, 5]], drive: 8 },
  spinback: { s: 'skip', beats: [[0.58, 3]], pre: 0.3 },
  shove: { s: 'skip', beats: [[null, 3]], drive: 7, lean: 0.12 },
  drivestab: { s: 'skip', beats: [[null, 4]], drive: 10 },
  pommel: { s: 'skip', beats: [[null, 3]], drive: 4 },
  risecut: { s: 'skip', beats: [[null, 0]], b: 1.4 },
  hammer: { s: 'skip', beats: [[0.56, 4]], pre: 0.3, drive: 5, b: 1.3 },
  leapchop: { s: 'skip', beats: [[0.55, 6]], pre: 0.45, b: 1.3 },
  skysplit: { s: 'skip', beats: [[0.6, 0]], b: 1.5 },
  plunge: { s: 'skip', beats: [[0.56, 0]], b: 1.4 },
  gstitan: { s: 'skip', beats: [[0.62, 0]], b: 1.2, settleAt: 0.86 },
  // The Paladin.
  pslash: { s: 'march', beats: [[null, 1.5]], drive: 4 },
  bash: { s: 'march', beats: [[null, 1.5]], drive: 7, lean: 0.12 },
  pthrust: { s: 'march', beats: [[null, 1]], drive: 8 },
  smite: { s: 'march', beats: [[0.43, 3]], pre: 0.32, drive: 5, b: 0.9 },
  ploath: { s: 'march', beats: [[null, 0]], drive: 3 },
  pldawn: { s: 'march', beats: [[null, 2]], drive: 6 },
  // (Shield Rush: one shove in a basic string; as the skill, a march of stamps behind the wall.)
  shieldrush: { s: 'march', beats: (dur) => (dur > 0.7 ? [[0.22, 1.5], [0.4, 1.5], [0.58, 1.5], [0.8, 2.5]] : [[null, 1.5]]), pre: 0.14, drive: 4 },
  plhalo: { s: 'march', beats: [[null, 2]], b: 0.7 },
  guardspin: { s: 'march', beats: [[null, 1.5]] },
  ascend: { s: 'march', beats: [[null, 3]], b: 1 },
  pllance: { s: 'march', beats: [[null, 1]], drive: 10 },
  kneelstab: { s: 'march', beats: [[null, 0]], drive: 6 },
  shieldslam: { s: 'march', beats: [[0.5, 4]], pre: 0.32, b: 1 },
  plfall: { s: 'march', beats: [[0.55, 5]], pre: 0.45, b: 1.2 },
  plsunrise: { s: 'march', beats: [[0.6, 4]], pre: 0.35, b: 1 },
  consecrate: { s: 'march', beats: [[null, 3]], pre: 0.3, b: 0.8 },
  plverdict: { s: 'march', beats: [[0.66, 0]], b: 1, settleAt: 0.86 },
  // (Her own Titan Breaker and Whirlwind: data/path-skills.js.)
  plseal: { s: 'march', beats: [[0.6, 2], [0.8, 0]], pre: 0.08, b: 1, settleAt: 0.88 },
  plrotor: { s: 'march', beats: [[0.75, 2]], pre: 0.1, b: 0.8 },
  // The Berserker.
  cleave1: { s: 'bound', beats: [[null, 6]], drive: 6 },
  cleave2: { s: 'bound', beats: [[null, 5]], drive: 4 },
  reaver: { s: 'bound', beats: [[0.47, 6]], pre: 0.4, b: 1.5 },
  flurry: { s: 'bound', beats: [[0.15, 3], [0.55, 2], [0.75, 3]], pre: 0.12, drive: 5, b: 1 },
  axehurl: { s: 'bound', beats: [[0.42, 3], [0.68, 3]], pre: 0.2 },
  gyre: { s: 'bound', beats: [[0.5, 6]], pre: 0.3 },
  bodyslam: { s: 'bound', beats: [[0.55, 6]], pre: 0.4, b: 1.6 },
  dragrise: { s: 'bound', beats: [[null, 0]], b: 1.4 },
  bkgore: { s: 'bound', beats: [[null, 4]], drive: 10 },
  recklesscharge: { s: 'bound', beats: [[0.8, 0]], b: 1.4 },
  rampage: { s: 'bound', beats: [[0.064, 2], [0.227, 4], [0.384, 4], [0.724, 0]], pre: 0.12, b: 1.4 },
  bkeclipse: { s: 'bound', beats: [[0.68, 0]], b: 1.2, settleAt: 0.86 },
  // (His own Titan Breaker and Whirlwind: data/path-skills.js.)
  bkpounce: { s: 'bound', beats: [[0.62, 0], [0.8, 0]], b: 1.4, settleAt: 0.9 },
  bkmaelstrom: { s: 'bound', beats: [[0.75, 3]], pre: 0.1, b: 1.3 },
};
function footwork(mv, p, dur, fw, hit) {
  if (!mv) return mv;
  const S = STEP_STYLES[fw.s];
  const beats = (typeof fw.beats === 'function' ? fw.beats(dur) : fw.beats).map(([at, h]) => [at ?? hit ?? 0.45, h]);
  const pre = fw.pre ?? 0.26;
  let up = 0;
  let air = 0;
  let plant = 0;
  let from = 0.02;
  for (const [at, h] of beats) {
    const a = Math.max(from, at - pre);
    if (h > 0 && at > a) {
      const k = bump(p, a, at);
      up += h * S.hk * k;
      air = Math.max(air, clamp01(k * 1.6));
    }
    plant = Math.max(plant, bump(p, at - 0.02, Math.min(1, at + 0.16)));
    from = at + 0.04;
  }
  const first = beats[0][0];
  const last = beats[beats.length - 1][0];
  const drive = (fw.drive ?? 0) * ease(seg(p, Math.max(0, first - pre), first)) * (1 - soft(seg(p, last + 0.12, 1)));
  const s = fw.settleAt ?? Math.min(0.88, last + 0.22);
  const bounce = (fw.b ?? S.b) * (1.8 * bump(p, s, s + (1 - s) * 0.45) + 0.7 * bump(p, s + (1 - s) * 0.45, s + (1 - s) * 0.85)) / 1.8;
  const base = mv.rig;
  return {
    ...mv,
    lift: (mv.lift ?? 0) + up + bounce * 2.6,
    lunge: (mv.lunge ?? 0) + drive,
    tilt: (mv.tilt ?? 0) + (fw.lean ?? S.lean) * plant,
    rig: (r) => {
      base?.(r);
      // (A march lifts the knee without leaving the ground; the others leave it.)
      if (air > 0.05) {
        if (fw.s !== 'march' || up > 1.2) r.air = true;
        legsTo(r, air, S.air[0], S.air[1]);
      } else if (plant > 0.05 && !r.air) {
        legsTo(r, plant * 0.8, S.plant[0], S.plant[1]);
        r.squat = Math.max(r.squat ?? 0, q(S.squat * plant));
      }
      if (fw.s === 'bound' && plant > 0.4) r.hairLift = 1;
    },
  };
}
const HEFT = new Set(['sword', 'axe', 'spear', 'staff']);
// A staff is longer than she is tall: pointed steeply down it would run through the floor, so its
// downward angles are eased toward level (front and back alike).
function staffed(mv) {
  if (!mv || mv.weapon == null || mv.orbit) return mv;
  const w = ((((mv.weapon % 360) + 360) % 360));
  let v = w;
  if (w > 100 && w <= 180) v = 100 + (w - 100) * 0.3;
  else if (w > 180 && w < 260) v = 260 - (260 - w) * 0.3;
  return v === w ? mv : { ...mv, weapon: mv.weapon + (v - w) };
}

// Feet step rather than slide (the art standard: a foot on the ground moves only by stepping): the
// pose a moment earlier is solved too, and a foot that's down in both but has shifted along the
// floor is lifted a little while it travels (half-pixel steps, up to 2.5 px), so the slide reads
// as a step. Moves stay pure functions of their progress.
const STEP_BACK = [1 / 48, 1 / 24, 1 / 12];
function footAt(mv) {
  const r = restRig();
  mv?.rig?.(r);
  return r;
}
function stepped(mv, prevs) {
  if (!mv || !mv.rig) return mv;
  const a = footAt(mv);
  if (a.air) return mv;
  // (Against each earlier moment looked at, so a stance that changes in a single frame still
  // reads as a quick step for a beat after it.)
  const bs = prevs.filter(Boolean).map(footAt).filter((b) => !b.air);
  if (!bs.length) return mv;
  // (Where a foot is on the floor: its hip, which draws in toward the middle as the hips turn
  // (`hipIn`, render/hero.js), plus the foot's own reach.)
  const HIP = { frontLeg: [16.6, 14], backLeg: [11.4, 14] };
  const floorX = (r, leg) => HIP[leg][0] + (HIP[leg][1] - HIP[leg][0]) * (r.hipIn ?? 0) + r[leg][0];
  const lifts = ['frontLeg', 'backLeg'].map((leg) => {
    if (a[leg][1] < -0.01) return 0;
    const moved = Math.max(0, ...bs.filter((b) => b[leg][1] >= -0.01).map((b) => Math.abs(floorX(a, leg) - floorX(b, leg))));
    return Math.min(2.5, Math.round(Math.max(0, moved - 0.5) * 1.4 * 2) / 2);
  });
  if (!lifts[0] && !lifts[1]) return mv;
  const base = mv.rig;
  return { ...mv, rig: (r) => {
    base(r);
    if (r.air) return;
    for (const [i, leg] of ['frontLeg', 'backLeg'].entries()) if (lifts[i] && r[leg][1] >= -0.01) r[leg] = [r[leg][0], -lifts[i], r[leg][2]];
  } };
}

// Moves are written in phases (a wind-up, the blow, the follow-through), each holding the free
// hand, the legs, the hips and the crouch in its own spot, so at each change of phase they would
// jump there in one frame. Every pose is the weighted mix of the poses a moment either side of it
// (GLIDE seconds each way): within a phase nothing changes, and across a change the body glides
// over a few frames instead of popping. Centred, so blows land on time. The weapon and the aimed
// arm glide too, each angle unwound from its neighbour's so a spin still turns the way it spins.
const GLIDE = 0.05;
const GLIDE_AT = [[-1, 1], [-2 / 3, 2], [-1 / 3, 3], [0, 4], [1 / 3, 3], [2 / 3, 2], [1, 1]];
const GLIDE_ARRAYS = ['frontLeg', 'backLeg', 'backArm', 'frontArm'];
const GLIDE_NUMBERS = ['squat', 'tx', 'by', 'hx', 'hy', 'cape', 'armSide', 'tilt'];
const GLIDED = new Map();
const copyRig = (r) => { const c = { ...r }; for (const k of GLIDE_ARRAYS) if (Array.isArray(r[k])) c[k] = [...r[k]]; return c; };
function glidedAt(kind, p, dur, feel) {
  const key = `${kind}|${p}|${dur}|${feel?.weapon ?? ''}|${feel?.hit ?? ''}|${feel?.fin ? 1 : 0}`;
  const kept = GLIDED.get(key);
  if (kept !== undefined) return kept;
  const mid = posedAt(kind, p, dur, feel);
  let out = mid;
  if (mid) {
    const h = GLIDE / Math.max(0.05, dur);
    const samples = GLIDE_AT.map(([o, w]) => [o === 0 ? mid : posedAt(kind, clamp01(p + o * h), dur, feel), w]).filter(([m]) => m);
    const total = samples.reduce((n, [, w]) => n + w, 0);
    const avg = (k) => (typeof mid[k] === 'number' ? samples.reduce((n, [m, w]) => n + (m[k] ?? 0) * w, 0) / total : mid[k]);
    out = { ...mid, lift: avg('lift'), lunge: avg('lunge'), tilt: avg('tilt') };
    // (Angles: each sample unwound from the one before it, out from the middle both ways.)
    // (Not a hefted weapon's fist: it goes round behind the head on purpose, kept under its cap.)
    for (const k of HEFT.has(feel?.weapon) ? ['weapon'] : ['weapon', 'arm']) {
      if (typeof mid[k] !== 'number' || samples.some(([m]) => typeof m[k] !== 'number')) continue;
      const c = samples.findIndex(([m]) => m === mid);
      const un = samples.map(([m]) => m[k]);
      const near = (v, ref) => ref + ((((v - ref) % 360) + 540) % 360) - 180;
      for (let i = c + 1; i < un.length; i++) un[i] = near(un[i], un[i - 1]);
      for (let i = c - 1; i >= 0; i--) un[i] = near(un[i], un[i + 1]);
      // (Only across a real jump, one step far bigger than the rest: a swing or a spin keeps its
      // own exact path, its reach and its speed.)
      const steps = un.slice(1).map((v, i) => Math.abs(v - un[i]));
      const big = Math.max(...steps);
      const rest = steps.filter((x) => x !== big).sort((x, y) => x - y);
      const usual = rest[Math.floor(rest.length / 2)] ?? 0;
      if (big < 20 || big < usual * 3 + 8 || samples.some(([m]) => m.orbit || Math.sign(m.turn ?? 1) !== Math.sign(mid.turn ?? 1))) continue;
      out[k] = samples.reduce((n, [, w], i) => n + un[i] * w, 0) / total;
    }
    if (samples.some(([m]) => m.rig)) {
      out.rig = (r) => {
        const base = copyRig(r);
        const posed = samples.map(([m, w]) => {
          const c = copyRig(base);
          m.rig?.(c);
          return [c, w];
        });
        mid.rig?.(r);
        const own = copyRig(r);
        const mix = (get) => posed.reduce((n, [c, w]) => n + (get(c) ?? 0) * w, 0) / total;
        for (const k of GLIDE_ARRAYS) if (Array.isArray(r[k])) r[k] = r[k].map((_, i) => mix((c) => c[k]?.[i] ?? r[k][i]));
        // (A free hand gliding between two spots on either side of its shoulder would pass through
        // it, folding the arm shut: that hand keeps its own spot. Offsets from the shoulder as
        // render/hero.js rests the hand: 1.4 out, 9.4 down.)
        for (const [k, out] of [['backArm', -1.4], ['frontArm', 1.4]]) {
          if (Array.isArray(r[k]) && Math.hypot(out + r[k][0], 9.4 + r[k][1]) < 3.2) r[k] = own[k];
        }
        // (And a foot gliding up past its hip would fold the knee shut: 15.4 is hip to ankle.)
        for (const k of ['frontLeg', 'backLeg']) if (Array.isArray(r[k]) && Math.hypot(r[k][0], 15.4 + r[k][1]) < 4.2) r[k] = own[k];
        for (const k of GLIDE_NUMBERS) if (posed.some(([c]) => typeof c[k] === 'number')) r[k] = mix((c) => c[k]);
        // (Back on the rig's half-pixel grid, leg angles to 2 degrees, so poses still come round.)
        const half = (v) => Math.round(v * 2) / 2;
        for (const k of ['frontLeg', 'backLeg']) if (r[k]) r[k] = [half(r[k][0]), half(r[k][1]), Math.round((r[k][2] ?? 0) / 2) * 2];
        for (const k of ['backArm', 'frontArm']) if (r[k]) r[k] = r[k].map(half);
        for (const k of ['squat', 'tx', 'by', 'hx', 'hy']) r[k] = half(r[k] ?? 0);
        r.cape = Math.round(r.cape ?? 0);
        r.tilt = Math.round(r.tilt ?? 0);
        r.armSide = Math.round((r.armSide ?? 1) * 4) / 4;
        // (Taking off or landing: how far off the ground, so the hips ease up and down too.)
        const air = posed.reduce((n, [c, w]) => n + (c.air ? w : 0), 0) / total;
        if (air > 0 && air < 1) r.airK = Math.round(air * 4) / 4;
      };
    }
  }
  if (GLIDED.size >= POSED_MAX) GLIDED.delete(GLIDED.keys().next().value);
  GLIDED.set(key, out);
  return out;
}

// (Solved poses are kept: moves step through fixed moments, so the same few come round again and
// again, and the step check above solves each one four times over.)
const POSED = new Map();
const POSED_MAX = 6000;
export function moveAt(kind, progress, dur = 0.35, feel = null) {
  const p = clamp01(progress);
  const key = `${kind}|${p}|${dur}|${feel?.weapon ?? ''}|${feel?.hit ?? ''}|${feel?.fin ? 1 : 0}`;
  const kept = POSED.get(key);
  if (kept !== undefined) return kept;
  const mv = glidedAt(kind, p, dur, feel);
  const out = stepped(mv, STEP_BACK.filter((d) => p > d).map((d) => glidedAt(kind, p - d, dur, feel)));
  if (POSED.size >= POSED_MAX) POSED.delete(POSED.keys().next().value);
  POSED.set(key, out);
  return out;
}

function posedAt(kind, progress, dur = 0.35, feel = null) {
  // Life-skill moves hold their own tool, so the weapon's feel doesn't bend them.
  // (An arm raised past the shoulder goes behind the big head, so it never covers the face.)
  if (LIFE_MOVES[kind]) {
    const mv = rawMoveAt(kind, clamp01(progress), dur);
    return mv.arm > 135 ? { ...mv, armBack: true } : mv;
  }
  if (!MOVES[kind]) return null;
  const f = FEEL[feel?.weapon] ?? {};
  const p = bend(clamp01(progress), feel?.hit, f.pre, f.post);
  let mv = after(sway(kind, p, dur, rawMoveAt(kind, p, dur), f), p, feel?.hit, f, feel?.fin);
  if (END_POSES[kind]) mv = heldEnd(mv, p, END_POSES[kind]);
  if (HEFT.has(feel?.weapon)) mv = hefted(mv, kind, p);
  if (feel?.weapon === 'staff') mv = staffed(mv);
  if (FOOTWORK[kind]) mv = footwork(mv, p, dur, FOOTWORK[kind], feel?.hit);
  // A fighting move that ends on a long dead-still hold settles with two soft bounces instead of
  // freezing (CLAUDE.md: nothing sits frozen), back to rest by its last moment.
  const tail = frozenTail(kind, dur);
  if (tail > 0.25) mv = { ...mv, lift: (mv.lift ?? 0) + settle(p, 1 - tail) };
  return mv;
}

// How much of a fighting move's end (0-1 of its progress) the figure holds dead still: measured once
// per move from its own poses. Life, social and emote moves keep their holds (a sit is a sit).
const FROZEN = new Map();
const restRig = () => ({ tx: 0, by: 0, hx: 0, hy: 0, frontLeg: [0.8, 0, 0], backLeg: [-0.8, 0, 0], backArm: [0, 0], armSide: 1, air: false, squat: 0, hairLift: 0, cape: 0, eyes: 'open', mouth: null, tilt: 0 });
function poseSig(mv) {
  const r = restRig();
  mv.rig?.(r);
  return [mv.weapon, mv.arm, mv.lift ?? 0, mv.lunge ?? 0, (mv.tilt ?? 0) * 20, r.squat, ...r.frontLeg, ...r.backLeg, ...r.backArm, r.tilt / 4, r.hx ?? 0].map((v) => Number(v) || 0);
}
function frozenTail(kind, dur) {
  if (FROZEN.has(kind)) return FROZEN.get(kind);
  let tail = 0;
  if (!SOCIAL_MOVES[kind] && !EMOTE_MOVES[kind] && !LIFE_MOVES[kind]) {
    const N = 60;
    const end = poseSig(rawMoveAt(kind, 1, dur));
    let k = N;
    while (k > 0 && poseSig(rawMoveAt(kind, (k - 1) / N, dur)).reduce((a, v, j) => a + Math.abs(v - end[j]), 0) < 1.5) k--;
    tail = (N - k) / N;
  }
  FROZEN.set(kind, tail);
  return tail;
}
// Two soft bounces after `a` (the second smaller), at rest again before the end.
const settle = (p, a) => 1.8 * bump(p, a, a + (1 - a) * 0.45) + 0.7 * bump(p, a + (1 - a) * 0.45, a + (1 - a) * 0.85);

// A bob that starts and ends at rest, so figures join without a jump.
const bob = (p, dur, per = 1.1) => Math.sin(p * Math.PI * 2 * Math.max(1, Math.round(dur / per)));

// Singing: the mouth shaping the words of the line, a syllable at a time.
// Her follow-through after a blow lands: two little bounces on the beat, the second smaller, so a
// held end pose keeps grooving and settles instead of freezing (back to 0 by the end).
// The Acrobat Archer's follow-through: two springy skips on the spot after the blow, the second
// smaller, the way a gymnast bounces out of a landing (back to 0 by the end).
const acBounce = (p, a) => 3.4 * bump(p, a, a + (1 - a) * 0.5) + 1.3 * bump(p, a + (1 - a) * 0.5, a + (1 - a) * 0.92);
// The Phantom Trickster's: an unhurried rise onto her toes and a slow sink back, a showman letting
// the trick land (back to 0 by the end).
const ptFloat = (p, a) => { const u = seg(p, a, 1); return 2.6 * Math.sin(Math.PI * u) * (1 - 0.5 * u); };
// The Arbalist Engineer's: the machine's kick rocking her heel to toe and back, dying away (a tilt
// that ends level).
const aeRock = (p, a) => { const u = seg(p, a, 1); return Math.sin(u * Math.PI * 3) * (1 - u); };

// ---------- The archers' shared draw (the Acrobat Archer and the Phantom Trickster) ----------
// The bow arm long and a little low, and the bow tipped back a touch, so the arrow's line runs
// under her jaw, never through her lips or eyes; the bow's top limb stays off her face.
const BOW_ARM = 74;
const BOW_AIM = 2;
const PT_ARM = 70;
// Between shots (wind-ups and held ends) the bow is slung low behind her, tipped well back, the
// way she carries it standing (render/hero.js), off her face and her outfit; it comes up behind
// her head into the aim.
const BOW_REST = -92;
const BOW_LOW = 46;
const PT_AIM = 5;
// After the loose the bow rolls forward in her hand (a real archer's follow-through: the top limb
// tips away from her, never back into her face) and the kick throws it on a little further.
const rollOn = (aim, s) => aim + 20 * soft(s.snap ?? 0);

// The free (string) hand and the head through a bowShot `s`: the hand comes off the bow and back to
// an anchor under her chin as the string comes back, her head easing back off the string; on the
// loose the hand flies open behind her and the head settles. `k` (0-1) fades the head in while the
// bow is still coming up.
function bowDraw(r, s, k = 1) {
  if (s.snap > 0) {
    const open = ease(clamp01(s.snap * 1.5));
    r.backArm = [q(lerp(-4, -7, open)), q(lerp(0.5, -2, open))];
  } else r.backArm = [q(2 - 6 * s.pull), q(-1 + 1.5 * s.pull)];
  // (After the loose the head stays back while the string rings, so it never swings into the bow.)
  const head = k * (s.snap > 0 ? Math.max(0.5 * (s.twang ?? 0), 1 - clamp01(s.snap)) : s.pull);
  r.hx = q((r.hx ?? 0) - 2.5 * head);
  r.tilt = (r.tilt ?? 0) + Math.round(-2 * head) * 2;
}

// The Arbalist Engineer's free hand on the crank: a full circle (radius `rad`) over the stock for
// every whole number of `turns`, on the crank at the butt of the stock out behind her hip (in front
// of her the big crossbow would hide it), so the winding reads in her silhouette.
function crankHand(turns, rad) {
  const a = turns * Math.PI * 2;
  return [q(-6 + rad * Math.cos(a)), q(-1.5 + rad * Math.sin(a))];
}
