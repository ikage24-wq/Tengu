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





  // ---------- The Thunderguard (the Warrior remade; docs/design/thunderguard.md) ----------
  // A storm held in the body: every swing is a fast build-up, the charge trembling in the blade
  // (`thrum`), and a sudden explosive release, then a quick light-footed recovery. Wide grounded
  // stances, the weight thrown into each blow; the fist stays down at the chest (hefted), and an
  // upright blade passes behind the head. Legs glide between stances (danceLegs), never snap.
  // Blade angles: -58 on the shoulder, 0 upright, 90 level ahead, 150 low in front, 180 point-down.

  // Snapping cut (opener, at ~0.45): the blade cocks back off the shoulder as he coils down onto his
  // back foot, the charge trembling in it, then snaps over the top in one crack and he rides it in.
  tgcut(p) {
    const coil = ease(seg(p, 0, 0.3));
    const cut = ease(seg(p, 0.32, 0.48));
    const back = soft(seg(p, 0.7, 1));
    const thrum = Math.sin(p * 90) * 2.4 * bump(p, 0.14, 0.32);
    return {
      weapon: lerp(lerp(-58, -98, coil) + thrum, 148, cut) - 26 * back, arm: lerp(lerp(54, 48, coil), 58, cut) - 10 * back,
      lunge: -2.4 * coil * (1 - cut) + 7 * cut * (1 - 0.6 * back), tilt: -0.1 * coil * (1 - cut) + 0.16 * cut * (1 - back), trail: cut > 0 && p < 0.64,
      rig: (r) => {
        r.squat = q(1.6 * coil * (1 - cut) + 1.2 * cut * (1 - back));
        danceLegs(r, [coil * (1 - cut), [2.6, 0, 4], [-3.6, 0, -6]], [cut * (1 - back), [4.4, 0, 6], [-4, 0, -12]]);
        r.backArm = [q(lerp(2, -3, cut) + 3 * back), q(lerp(-2, -1, cut))];
        r.hairLift = cut > 0.3 && back < 0.4 ? -1 : 0;
        r.cape = Math.round(-3 * bump(p, 0.32, 0.7));
        if (coil > 0.4 && cut < 0.2) r.mouth = 'grit';
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Return cut (second, at ~0.45): the blade drags low behind his front foot, sparks off the
  // floor, then he rips it up and over the top with a hop, back onto the shoulder.
  tgreturn(p) {
    const drag = ease(seg(p, 0, 0.26));
    const rip = ease(seg(p, 0.3, 0.52));
    const back = soft(seg(p, 0.66, 1));
    return {
      weapon: lerp(lerp(-58, 192, drag), -40, rip) - 18 * back, arm: lerp(lerp(54, 28, drag), 60, rip) - 6 * back,
      lift: 6 * bump(p, 0.3, 0.8), lunge: 1.5 * drag * (1 - rip) + 3 * rip * (1 - back), tilt: 0.1 * drag * (1 - rip) - 0.12 * rip * (1 - back), trail: rip > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(2.2 * drag * (1 - rip));
        danceLegs(r, [drag * (1 - rip), [3.4, 0, 6], [-3.4, 0, -10]], [rip * (1 - back), [2.4, -2.4, 10], [-2, -2, -16]]);
        r.backArm = [q(lerp(1, -4, rip) + 4 * back), q(lerp(1, -3, rip) + 2 * back)];
        r.hairLift = rip > 0.3 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-3 * bump(p, 0.3, 0.8));
        if (rip > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Static spin (third, at ~0.56): a short cock back, then he spins once on the ball of his foot,
  // the blade out flat at arm's length, and comes round into a flourish, blade swept out level.
  tgspin(p) {
    const cock = ease(seg(p, 0, 0.2));
    const u = ease(seg(p, 0.24, 0.66));
    const out = soft(seg(p, 0.66, 0.84));
    const back = soft(seg(p, 0.84, 1));
    const turn = Math.cos(u * Math.PI * 2);
    return {
      weapon: lerp(lerp(-58, -84, cock), 96, ease(seg(p, 0.2, 0.28))) + 360 * u + 14 * out + 60 * back, arm: 54 + 4 * u * (1 - u) * 4 - 8 * back,
      lift: 5 * bump(p, 0.24, 0.7), lunge: 2 + 5 * u * (1 - 0.6 * back), orbit: u > 0 && u < 1, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)),
      tilt: 0.08 * (1 - back) * (u > 0 ? 1 : cock), trail: u > 0 && u < 1,
      rig: (r) => {
        danceLegs(r, [cock * (1 - u), [2.8, 0, 4], [-3, 0, -6]], [Math.sin(Math.PI * u), [1.6, -2.2, 8], [-1.4, -1.6, -10]], [out * (1 - back), [4.6, 0, 8], [-4.2, 0, -14]]);
        r.backArm = [q(-4 - 3 * out * (1 - back)), q(-2 - 2 * out * (1 - back))];
        r.hairLift = u > 0.1 && u < 0.9 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.24, 0.84));
        if (u > 0.2 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Thunderstrike (finisher, lands at ~0.56): he drops into a crouch, leaps high hauling the blade
  // up behind his head as the charge gathers in it (trembling), then drives down in one falling
  // overhead slam and the bolt follows it into the floor; he lands on one knee over the blade.
  tgstrike(p) {
    const crouch = soft(seg(p, 0, 0.12));
    const up = ease(seg(p, 0.12, 0.36));
    const slam = easeIn(seg(p, 0.42, 0.56));
    const land = soft(seg(p, 0.56, 0.72));
    const rise = soft(seg(p, 0.86, 1));
    const thrum = Math.sin(p * 80) * 3 * bump(p, 0.26, 0.42);
    return {
      weapon: lerp(lerp(-58, -112, up) + thrum, 168, slam) - 30 * rise, arm: lerp(lerp(54, 46, up), 52, slam) - 14 * land * (1 - rise),
      lift: 16 * up * (1 - slam), lunge: 2 * up + 8 * slam * (1 - 0.5 * rise), tilt: -0.14 * up * (1 - slam) + 0.26 * slam * (1 - land * 0.6) * (1 - rise),
      trail: slam > 0 && p < 0.66,
      rig: (r) => {
        if (up > 0.2 && slam < 0.95) {
          r.air = true;
          r.frontLeg = [q(lerp(2.6, 3.4, slam)), q(lerp(-5, -2, slam)), 10];
          r.backLeg = [q(-1.6), q(-2.6), -12];
        } else {
          r.squat = q(2 * crouch * (1 - up) + 3 * land * (1 - rise));
          danceLegs(r, [crouch * (1 - up), [3, 0, 4], [-3, 0, -6]], [land * (1 - rise), [3.6, 0, 8], [-5.6, 0, -70]]);
        }
        r.backArm = [q(lerp(lerp(0, -2, up), 3, land) * (1 - rise)), q(lerp(lerp(-1, -6, up), 2, land) * (1 - rise))];
        r.hairLift = up > 0.2 && slam < 1 ? -1 : land > 0.3 && rise < 0.3 ? 1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.12, 0.8));
        if (up > 0.4 && slam < 0.3) r.mouth = 'grit';
        if (slam > 0.5 && rise < 0.5) strikeFace(r);
      },
    };
  },
  // Double flick (opener, at ~0.3 and ~0.62): two quick wrist-snaps of the blade, down and back up,
  // light on his toes.
  tgflick(p) {
    const a = ease(seg(p, 0.12, 0.32));
    const b = ease(seg(p, 0.42, 0.62));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(-58, 128, a), -36, b) - 22 * back, arm: lerp(lerp(54, 56, a), 58, b) - 6 * back,
      lunge: 3 * a * (1 - b) + 4 * b * (1 - back), tilt: 0.1 * a * (1 - b) - 0.06 * b * (1 - back), trail: (a > 0 && a < 1) || (b > 0 && b < 1),
      rig: (r) => {
        danceLegs(r, [a, [3.4, -0.6, 4], [-3.2, 0, -8]], [b * (1 - back), [4, 0, 6], [-3.6, -0.6, -12]]);
        r.backArm = [q(-2 - 2 * a + 3 * back), q(-1 - b)];
        if ((a > 0.3 && b < 0.2) || (b > 0.3 && back < 0.5)) strikeFace(r);
      },
    };
  },
  // Darting lunge (opener, at ~0.45): he sinks back with the blade drawn level at his hip, then
  // darts forward the length of a stride, the point driven straight out.
  tglunge(p) {
    const draw = ease(seg(p, 0, 0.34));
    const dart = ease(seg(p, 0.36, 0.48));
    const back = soft(seg(p, 0.68, 1));
    const thrum = Math.sin(p * 90) * 2 * bump(p, 0.18, 0.36);
    return {
      weapon: lerp(lerp(-58, 104, draw) + thrum, 90, dart) + 42 * back, arm: lerp(lerp(54, 38, draw), 60, dart) - 10 * back,
      lunge: -3 * draw * (1 - dart) + 11 * dart * (1 - 0.7 * back), tilt: -0.06 * draw * (1 - dart) + 0.14 * dart * (1 - back),
      rig: (r) => {
        r.squat = q(1.8 * draw * (1 - dart) + 1 * dart * (1 - back));
        danceLegs(r, [draw * (1 - dart), [2.4, 0, 2], [-3.6, 0, -10]], [dart * (1 - back), [5.4, 0, 8], [-4.6, 0, -16]]);
        r.backArm = [q(lerp(2, -6, dart) + 6 * back), q(lerp(0, -2, dart) + 2 * back)];
        r.hairLift = dart > 0.3 && back < 0.4 ? 1 : 0;
        if (draw > 0.5 && dart < 0.3) r.eyes = 'half';
        if (dart > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Static shoulder check (second, at ~0.42): the blade hugged back on the shoulder, he drops his
  // free shoulder and drives it in hard; the static bursts where it lands.
  tgbash(p) {
    const load = ease(seg(p, 0, 0.3));
    const drive = ease(seg(p, 0.32, 0.44));
    const back = soft(seg(p, 0.64, 1));
    return {
      weapon: lerp(-58, -78, load) + 18 * back, arm: lerp(54, 46, load) + 6 * back,
      lunge: -2 * load * (1 - drive) + 10 * drive * (1 - 0.7 * back), tilt: -0.06 * load * (1 - drive) + 0.22 * drive * (1 - back),
      rig: (r) => {
        r.squat = q(1.6 * load * (1 - drive) + 0.8 * drive * (1 - back));
        danceLegs(r, [load * (1 - drive), [2.4, 0, 2], [-3.2, 0, -8]], [drive * (1 - back), [5, 0, 8], [-4.6, 0, -18]]);
        r.backArm = [q(lerp(0, 6, drive) - 6 * back), q(lerp(-1, -3, drive) + 3 * back)];
        r.tx = q(1.4 * drive * (1 - back));
        if (drive > 0.3 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Crackling sweep (second, at ~0.46): he drops low into a wide stance and sweeps the blade flat
  // along the floor in front of him, the lightning crawling after it.
  tgsweep(p) {
    const drop = ease(seg(p, 0, 0.3));
    const sweep = ease(seg(p, 0.32, 0.54));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(-58, 214, drop), 112, sweep) - 170 * back, arm: lerp(lerp(54, 26, drop), 40, sweep) + 14 * back,
      lunge: -1 * drop + 5 * sweep * (1 - 0.6 * back), tilt: 0.14 * drop * (1 - back), trail: sweep > 0 && p < 0.68,
      rig: (r) => {
        r.squat = q(3 * drop * (1 - back));
        danceLegs(r, [drop * (1 - back), [4.8, 0, 8], [-4.6, 0, -12]]);
        r.backArm = [q(lerp(0, -5, drop) * (1 - back)), q(lerp(-1, 1, drop) * (1 - back))];
        r.cape = Math.round(-3 * bump(p, 0.3, 0.7));
        if (sweep > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Charged thrust (third, at ~0.46): he draws the blade back level along his forearm and holds it,
  // the charge thrumming, then explodes forward driving it straight through them.
  tgdrive(p) {
    const draw = ease(seg(p, 0, 0.3));
    const fire = ease(seg(p, 0.38, 0.48));
    const back = soft(seg(p, 0.7, 1));
    const thrum = Math.sin(p * 110) * 2.6 * bump(p, 0.2, 0.38);
    return {
      weapon: lerp(lerp(-58, 98, draw) + thrum, 90, fire) + 44 * back, arm: lerp(lerp(54, 36, draw), 60, fire) - 10 * back,
      lunge: -4 * draw * (1 - fire) + 12 * fire * (1 - 0.7 * back), tilt: -0.08 * draw * (1 - fire) + 0.16 * fire * (1 - back),
      rig: (r) => {
        r.squat = q(2 * draw * (1 - fire) + 1.2 * fire * (1 - back));
        danceLegs(r, [draw * (1 - fire), [2.2, 0, 2], [-4, 0, -12]], [fire * (1 - back), [5.6, 0, 8], [-5, 0, -18]]);
        r.backArm = [q(lerp(3, -7, fire) + 7 * back), q(lerp(-2, -3, fire) + 3 * back)];
        r.hairLift = fire > 0.3 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.38, 0.8));
        if (draw > 0.4 && fire < 0.2) r.mouth = 'grit';
        else if (fire > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Lightning rise (third, at ~0.42): low with the blade's point by his front foot, he springs up
  // ripping it up and over his head, the column of lightning lifting them with it.
  tgrise(p) {
    const low = ease(seg(p, 0, 0.28));
    const up = ease(seg(p, 0.3, 0.48));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(-58, 158, low), -36, up) - 22 * back, arm: lerp(lerp(54, 30, low), 60, up) - 6 * back,
      lift: 8 * bump(p, 0.3, 0.82), lunge: 1.5 * low * (1 - up) + 2 * up * (1 - back), tilt: 0.12 * low * (1 - up) - 0.14 * up * (1 - back), trail: up > 0 && p < 0.62,
      rig: (r) => {
        r.squat = q(2.6 * low * (1 - up));
        danceLegs(r, [low * (1 - up), [3.6, 0, 6], [-3.6, 0, -12]], [up * (1 - back), [2.2, -3, 12], [-1.8, -2.4, -16]]);
        r.backArm = [q(lerp(0, -5, up) + 5 * back), q(lerp(1, -4, up) + 3 * back)];
        r.hairLift = up > 0.3 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.3, 0.8));
        if (up > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Thunderclap (finisher, at ~0.56): he hauls the blade up and right back over his head in both
  // hands, rising onto his toes as the charge thrums, then brings it down into the floor in front of
  // him with everything he has and the thunderclap bursts out.
  tgclap(p) {
    const raise = ease(seg(p, 0, 0.4));
    const down = easeIn(seg(p, 0.46, 0.56));
    const hold = soft(seg(p, 0.56, 0.68));
    const back = soft(seg(p, 0.86, 1));
    const thrum = Math.sin(p * 80) * 3 * bump(p, 0.24, 0.44);
    return {
      weapon: lerp(lerp(-58, -124, raise) + thrum, 172, down) - 70 * back, arm: lerp(lerp(54, 60, raise), 48, down) - 10 * hold * (1 - back),
      lift: 3 * raise * (1 - down), lunge: -1 * raise * (1 - down) + 7 * down * (1 - 0.5 * back), tilt: -0.12 * raise * (1 - down) + 0.28 * down * (1 - hold * 0.4) * (1 - back),
      trail: down > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(3.2 * hold * (1 - back) + 1.6 * down * (1 - hold));
        danceLegs(r, [raise * (1 - down), [1.8, -1.2, 2], [-2, -1, -4]], [down * (1 - back), [5, 0, 10], [-5, 0, -14]]);
        r.backArm = [q(lerp(lerp(0, -3, raise), 4, down) - 4 * back), q(lerp(lerp(-1, -8, raise), 1, down) + 0 * back)];
        r.hairLift = raise > 0.3 && down < 0.5 ? -1 : hold > 0.3 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.2, 0.86));
        if (raise > 0.4 && down < 0.3) r.mouth = 'grit';
        if (down > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Storm uppercut (finisher, at ~0.36 and ~0.64): a rising cut that throws them up, then he spins
  // up after them, the blade wheeling round him in a spiral, and comes down light.
  tgstorm(p) {
    const low = ease(seg(p, 0, 0.22));
    const cut = ease(seg(p, 0.24, 0.38));
    const u = ease(seg(p, 0.42, 0.66));
    const land = soft(seg(p, 0.7, 0.86));
    const back = soft(seg(p, 0.86, 1));
    const turn = Math.cos(u * Math.PI * 2);
    return {
      weapon: lerp(lerp(-58, 156, low), -30, cut) + 360 * u + 40 * land - 110 * back, arm: lerp(lerp(54, 30, low), 60, cut) - 8 * back,
      lift: 6 * bump(p, 0.24, 0.42) + 14 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (1 - land), lunge: 2 * cut + 3 * u * (1 - back),
      orbit: u > 0 && u < 1, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)), tilt: 0.1 * low * (1 - cut) - 0.12 * cut * (1 - u) + 0.06 * land * (1 - back),
      trail: (cut > 0 && cut < 1) || (u > 0 && u < 1),
      rig: (r) => {
        if (u > 0.08 && land < 0.5) {
          r.air = true;
          r.frontLeg = [q(2), q(-4), 10];
          r.backLeg = [q(-1.6), q(-2.4), -12];
        } else {
          r.squat = q(2.4 * low * (1 - cut) + 2 * land * (1 - back));
          danceLegs(r, [low * (1 - cut), [3.6, 0, 6], [-3.6, 0, -12]], [land * (1 - back), [4.4, 0, 8], [-4.4, 0, -12]]);
        }
        r.backArm = [q(-4 * cut * (1 - back)), q(-3 * cut * (1 - back) - 2 * u * (1 - land))];
        r.hairLift = u > 0.1 && land < 0.5 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.24, 0.86));
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Up + attack: he crouches and springs straight up, ripping the blade up through them, riding the
  // bolt up after them.
  tgskyward(p) {
    const crouch = ease(seg(p, 0, 0.22));
    const up = ease(seg(p, 0.26, 0.44));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(-58, 150, crouch), -30, up) - 24 * back, arm: lerp(lerp(54, 30, crouch), 60, up) - 6 * back,
      lift: 12 * bump(p, 0.26, 0.9), tilt: 0.1 * crouch * (1 - up) - 0.16 * up * (1 - back), trail: up > 0 && p < 0.6,
      rig: (r) => {
        if (up > 0.3 && back < 0.6) tuck(r);
        else {
          r.squat = q(2.8 * crouch * (1 - up));
          danceLegs(r, [crouch, [3.2, 0, 6], [-3.2, 0, -10]]);
        }
        r.backArm = [q(lerp(0, -5, up)), q(lerp(1, -5, up))];
        r.hairLift = up > 0.2 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.26, 0.9));
        if (up > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // In the air: a crackling cut down, then one back up (each keeps him hanging).
  tgaircut(p) {
    const cut = ease(seg(p, 0.2, 0.5));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(-58, -96, ease(seg(p, 0, 0.2))), 136, cut) - 30 * back, arm: lerp(52, 58, cut) - 8 * back, tilt: 0.14 * cut * (1 - back), trail: cut > 0 && cut < 1,
      rig: (r) => {
        tuck(r);
        r.backArm = [q(-3 * cut), q(-2 * cut)];
        r.hairLift = -1;
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  tgaircut2(p) {
    const cut = ease(seg(p, 0.2, 0.5));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(120, 170, ease(seg(p, 0, 0.2))), -34, cut) - 24 * back, arm: lerp(36, 60, cut) - 8 * back, tilt: -0.12 * cut * (1 - back), trail: cut > 0 && cut < 1,
      rig: (r) => {
        tuck(r);
        r.backArm = [q(-4 * cut), q(-4 * cut)];
        r.hairLift = -1;
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Plunge (in the air, the third): the blade hauled up overhead, then turned point-down as he
  // drops like a bolt and drives it into the floor where he lands.
  tgplunge(p) {
    const raise = ease(seg(p, 0, 0.3));
    const point = ease(seg(p, 0.3, 0.5));
    return {
      weapon: lerp(lerp(-58, -110, raise), 176, point), arm: lerp(lerp(52, 56, raise), 44, point), tilt: -0.1 * raise * (1 - point) + 0.18 * point, lift: 2 * raise * (1 - point),
      rig: (r) => {
        r.air = true;
        r.frontLeg = [q(lerp(2.6, 1.4, point)), q(lerp(-5, -1, point)), 10];
        r.backLeg = [q(lerp(-1.6, -1, point)), q(lerp(-2.6, -0.6, point)), -10];
        r.backArm = [q(-2 + 4 * point), q(-5 + 4 * point)];
        r.hairLift = -1;
        r.cape = -4;
        if (point > 0.4) strikeFace(r);
      },
    };
  },
  // Flash cut (out of a run): he leans into the sprint low with the blade trailing behind him, and
  // flashes through them in one level cut, holding it out as he skids.
  tgflash(p) {
    const lean = ease(seg(p, 0, 0.3));
    const cut = ease(seg(p, 0.34, 0.46));
    const skid = soft(seg(p, 0.46, 0.7));
    const back = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(-58, 212, lean), 96, cut) - 40 * back, arm: lerp(lerp(54, 28, lean), 58, cut) - 8 * back,
      lunge: 4 * lean * (1 - cut) + 9 * cut * (1 - back), tilt: 0.24 * lean * (1 - cut) + 0.16 * cut * (1 - skid * 0.5) * (1 - back), trail: cut > 0 && p < 0.6,
      rig: (r) => {
        r.squat = q(1.8 * lean * (1 - back) + 1 * skid * (1 - back));
        danceLegs(r, [lean * (1 - cut), [4, -0.8, 8], [-4.6, -1.2, -24]], [cut * (1 - back), [5.6, 0, 8], [-5.2, 0, -16]]);
        r.backArm = [q(lerp(-4, -7, cut) + 7 * back), q(lerp(-2, -3, cut) + 3 * back)];
        r.hairLift = lean > 0.3 && back < 0.5 ? 1 : 0;
        r.cape = Math.round(-5 * lean * (1 - back));
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Down + attack: a hop up with the blade hauled overhead, and down into the floor in a slam.
  tgslam(p) {
    const hop = ease(seg(p, 0.06, 0.32));
    const down = easeIn(seg(p, 0.44, 0.56));
    const hold = soft(seg(p, 0.56, 0.7));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(lerp(-58, -116, hop), 170, down) - 40 * back, arm: lerp(lerp(54, 58, hop), 46, down) - 8 * hold * (1 - back),
      lift: 10 * hop * (1 - down), lunge: 2 * hop + 4 * down * (1 - back), tilt: -0.1 * hop * (1 - down) + 0.24 * down * (1 - hold * 0.4) * (1 - back),
      rig: (r) => {
        if (hop > 0.3 && down < 0.9) tuck(r);
        else {
          r.squat = q(3 * hold * (1 - back));
          danceLegs(r, [down * (1 - back), [4.6, 0, 8], [-4.6, 0, -12]]);
        }
        r.backArm = [q(lerp(-1, 3, down) * (1 - back)), q(lerp(-6, 1, down) * (1 - back))];
        r.hairLift = hop > 0.3 && down < 0.9 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.06, 0.84));
        if (down > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },

  // His skills.
  // Thunder Rush: he drops low into a sprint with the blade trailing behind him and flashes forward,
  // then comes out of it in a level cut, skidding.
  tgrush(p) {
    const drop = ease(seg(p, 0, 0.16));
    const cut = ease(seg(p, 0.54, 0.66));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(-58, -146, drop), 100, cut) - 42 * back, arm: lerp(lerp(54, 28, drop), 58, cut) - 8 * back,
      lunge: 6 * drop * (1 - cut) + 9 * cut * (1 - back), lift: 1.5 * drop * (1 - cut), tilt: 0.3 * drop * (1 - cut) + 0.14 * cut * (1 - back), trail: cut > 0 && p < 0.76,
      rig: (r) => {
        r.squat = q(1.6 * drop * (1 - back));
        danceLegs(r, [drop * (1 - cut), [4.4, -1.6, 14], [-5.2, -2.4, -40]], [cut * (1 - back), [5.6, 0, 8], [-5.2, 0, -16]]);
        r.backArm = [q(-6 * drop * (1 - cut) - 4 * cut * (1 - back)), q(-3 * drop * (1 - cut) - 2 * cut * (1 - back))];
        r.hairLift = drop > 0.3 && back < 0.5 ? 1 : 0;
        r.cape = Math.round(-6 * drop * (1 - back));
        if (drop > 0.5 && cut < 0.3) r.mouth = 'grit';
        else if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Storm Cleave: he hauls the blade right back over his shoulder in both hands and holds it there,
  // sinking into his stance as the storm pours into it (it thrums harder and harder), then brings
  // it round in one huge cleave and holds the follow-through low in front.
  tgcleave(p) {
    const haul = ease(seg(p, 0, 0.3));
    const sink = soft(seg(p, 0.2, 0.52));
    const cleave = ease(seg(p, 0.54, 0.64));
    const back = soft(seg(p, 0.84, 1));
    const thrum = Math.sin(p * 100) * (1.5 + 3 * seg(p, 0.3, 0.54)) * bump(p, 0.26, 0.56);
    return {
      weapon: lerp(lerp(-58, -138, haul) + thrum, 156, cleave) - 30 * back, arm: lerp(lerp(54, 58, haul), 50, cleave) - 10 * back,
      lunge: -3 * sink * (1 - cleave) + 9 * cleave * (1 - 0.6 * back), tilt: -0.12 * sink * (1 - cleave) + 0.24 * cleave * (1 - back), trail: cleave > 0 && p < 0.78,
      rig: (r) => {
        r.squat = q(2.4 * sink * (1 - cleave) + 2 * cleave * (1 - back));
        danceLegs(r, [haul * (1 - cleave), [3, 0, 4], [-4, 0, -10]], [cleave * (1 - back), [5.4, 0, 10], [-5, 0, -16]]);
        r.backArm = [q(lerp(lerp(0, -2, haul), 4, cleave) - 4 * back), q(lerp(lerp(-1, -6, haul), 1, cleave) - 1 * back)];
        r.hairLift = sink > 0.5 && cleave < 0.2 ? -1 : cleave > 0.3 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.2, 0.86));
        if (sink > 0.4 && cleave < 0.2) r.mouth = 'grit';
        else if (cleave > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Cyclone Edge: he spins three times on the spot with the blade out at arm's length, rising a
  // little off the floor in the storm, then stops dead and brings it down in a thunderclap.
  tgcyclone(p) {
    const cock = ease(seg(p, 0, 0.12));
    const u = seg(p, 0.12, 0.78);
    const spun = soft(u) * 3;
    const down = easeIn(seg(p, 0.8, 0.86));
    const back = soft(seg(p, 0.9, 1));
    const turn = Math.cos(spun * Math.PI * 2);
    const spinning = u > 0 && u < 1;
    return {
      weapon: (u <= 0 ? lerp(-58, 96, cock) : 96 + 360 * spun) + (u >= 1 ? lerp(0, 74, down) - 40 * back : 0), arm: spinning ? 56 : lerp(56, 46, down) + 4 * back,
      lift: 6 * Math.sin(Math.PI * u), lunge: 2 + 3 * down * (1 - back), orbit: spinning, turn: spinning ? Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)) : 1,
      tilt: 0.06 * (spinning ? 1 : cock) * (1 - down) + 0.2 * down * (1 - back), trail: spinning || (down > 0 && down < 1),
      rig: (r) => {
        r.squat = q(2.6 * down * (1 - back));
        danceLegs(r, [cock * (1 - Math.sin(Math.PI * u)), [3, 0, 4], [-3, 0, -6]], [Math.sin(Math.PI * u), [1.6, -2, 8], [-1.4, -1.6, -10]], [down * (1 - back), [5, 0, 10], [-5, 0, -14]]);
        r.backArm = [q(-4 - 2 * Math.sin(Math.PI * u) + 4 * down * (1 - back)), q(-2 - 2 * Math.sin(Math.PI * u))];
        r.hairLift = spinning ? -1 : down > 0.4 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.12, 0.9));
        if (spinning) r.mouth = 'grit';
        if (down > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Lightning Rod: he lifts the blade and drives it point-first into the floor before him, drops to
  // one knee holding the hilt, and throws his free hand up to the sky as the bolts come down.
  tgrod(p) {
    const lift = ease(seg(p, 0, 0.22));
    const plant = easeIn(seg(p, 0.24, 0.34));
    const call = soft(seg(p, 0.36, 0.5));
    const rise = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(lerp(-58, -96, lift), 178, plant) - 20 * rise, arm: lerp(lerp(54, 58, lift), 30, plant) + 16 * rise,
      lift: 3 * lift * (1 - plant), lunge: 3 * plant * (1 - rise), tilt: -0.08 * lift * (1 - plant) + 0.06 * plant * (1 - call * 0.5) * (1 - rise),
      rig: (r) => {
        r.squat = q(2.8 * plant * (1 - rise));
        danceLegs(r, [lift * (1 - plant), [2, -0.8, 2], [-2.4, 0, -6]], [plant * (1 - rise), [3.4, 0, 8], [-5.4, 0, -70]]);
        r.backArm = [q(lerp(0, -5, call) * (1 - rise)), q(lerp(-1, -11, call) * (1 - rise))];
        r.hairLift = call > 0.5 && rise < 0.5 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.3, 0.9));
        if (call > 0.4 && rise < 0.4) r.mouth = 'open';
      },
    };
  },
  // Thunderclap: he swings the blade up flat over his head in both hands, rising onto his toes, then
  // slams it down flat on the floor with a shout, and holds the shout.
  tgthunderclap(p) {
    const up = ease(seg(p, 0, 0.36));
    const slam = easeIn(seg(p, 0.42, 0.52));
    const hold = soft(seg(p, 0.52, 0.64));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(lerp(-58, -100, up), 160, slam) - 30 * back, arm: lerp(lerp(54, 60, up), 40, slam) + 10 * back,
      lift: 3 * up * (1 - slam), lunge: 4 * slam * (1 - back), tilt: -0.1 * up * (1 - slam) + 0.18 * slam * (1 - hold * 0.3) * (1 - back),
      rig: (r) => {
        r.squat = q(3 * hold * (1 - back) + 1.4 * slam * (1 - hold));
        danceLegs(r, [up * (1 - slam), [1.8, -1.4, 2], [-2, -1.2, -4]], [slam * (1 - back), [5, 0, 10], [-5, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -3, up), -5, slam) + 5 * back), q(lerp(lerp(-1, -9, up), 1, slam) - 1 * back)];
        r.hairLift = up > 0.4 && slam < 0.5 ? -1 : hold > 0.3 && back < 0.5 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.2, 0.86));
        if (slam > 0.5 && back < 0.6) r.mouth = 'open';
      },
    };
  },
  // Static Guard: he plants his feet wide, sets the blade point-down before him like a pillar and
  // braces behind it, head down, then looks up as the shell of static snaps round him.
  tgguard(p) {
    const set = ease(seg(p, 0, 0.3));
    const brace = soft(seg(p, 0.3, 0.5));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(-58, 178, set) - 44 * back, arm: lerp(54, 40, set) + 8 * back,
      lunge: 2 * set * (1 - back), tilt: 0.1 * brace * (1 - back),
      rig: (r) => {
        r.squat = q(2.2 * brace * (1 - back));
        danceLegs(r, [set * (1 - back), [4.6, 0, 8], [-4.6, 0, -12]]);
        r.backArm = [q(lerp(0, 4, brace) * (1 - back)), q(lerp(-1, -2, brace) * (1 - back))];
        if (brace > 0.3 && p < 0.55) r.eyes = 'half';
        else if (brace > 0.5 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Thunderfall (finisher): a crouch, a leap high into the storm with the blade hauled up behind his
  // head; he hangs there, turning a little as the lightning pours into it (it thrums), then falls
  // riding the bolt, slams down on one knee with the blade buried, and stands.
  tgfall(p) {
    const crouch = soft(seg(p, 0, 0.08));
    const up = ease(seg(p, 0.08, 0.3));
    const hang = seg(p, 0.3, 0.56);
    const fall = easeIn(seg(p, 0.56, 0.62));
    const land = soft(seg(p, 0.62, 0.74));
    const rise = soft(seg(p, 0.88, 1));
    const thrum = Math.sin(p * 90) * (2 + 3 * hang) * bump(p, 0.28, 0.58);
    return {
      weapon: lerp(lerp(-58, -124, up) + thrum, 172, fall) - 34 * rise, arm: lerp(lerp(54, 58, up), 48, fall) - 12 * land * (1 - rise),
      lift: 64 * up * (1 - fall) + 3 * Math.sin(hang * Math.PI * 2) * (1 - fall), lunge: 2 * up + 6 * fall * (1 - 0.5 * rise),
      tilt: -0.14 * up * (1 - fall) + 0.04 * Math.sin(hang * Math.PI * 2) * (1 - fall) + 0.24 * fall * (1 - land * 0.6) * (1 - rise),
      trail: fall > 0 && p < 0.7,
      rig: (r) => {
        if (up > 0.2 && fall < 0.95) {
          r.air = true;
          r.frontLeg = [q(lerp(2.6, 3.4, fall)), q(lerp(-4.4, -2, fall)), 10];
          r.backLeg = [q(-1.6), q(-2.8), -14];
        } else {
          r.squat = q(2 * crouch * (1 - up) + 3 * land * (1 - rise));
          danceLegs(r, [crouch * (1 - up), [3, 0, 4], [-3, 0, -6]], [land * (1 - rise), [3.6, 0, 8], [-5.6, 0, -70]]);
        }
        r.backArm = [q(lerp(lerp(0, -4, up), 3, land) * (1 - rise)), q(lerp(lerp(-1, -9, up), 2, land) * (1 - rise))];
        r.hairLift = up > 0.2 && fall < 1 ? -1 : land > 0.3 && rise < 0.3 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.08, 0.86));
        if (hang > 0.2 && fall < 0.3) r.mouth = 'grit';
        if (fall > 0.5 && rise < 0.5) r.mouth = 'open';
      },
    };
  },

  // ---------- The Tempest (the Thunderguard's damage path; docs/design/tempest.md) ----------
  // Speed itself: always leaning into the next blow, wind-ups barely there, follow-throughs that
  // roll straight on, footwork that skims (`skim`). Blade angles as the Thunderguard's: -58 on the
  // shoulder, 0 upright (behind the head), 90 level, 150 low ahead, 180 point-down.

  // Streak (opener, at ~0.42): no wind-up to speak of, the blade flicks off the shoulder and through
  // in a long flat streak as he leans into it.
  tpstreak(p) {
    const cut = ease(seg(p, 0.12, 0.46));
    const back = soft(seg(p, 0.66, 1));
    return {
      weapon: lerp(lerp(-58, -76, soft(seg(p, 0, 0.14))), 132, cut) - 30 * back, arm: lerp(54, 58, cut) - 8 * back,
      lunge: 6 * cut * (1 - 0.6 * back), tilt: 0.12 + 0.08 * cut * (1 - back), trail: cut > 0 && p < 0.6,
      rig: (r) => {
        danceLegs(r, [cut * (1 - back), [4.4, -0.4, 6], [-4.2, -0.6, -14]]);
        r.backArm = [q(-4 - 2 * cut + 2 * back), q(-2 - cut)];
        r.hairLift = cut > 0.2 ? 1 : 0;
        r.cape = Math.round(-4 * cut * (1 - back));
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Double (opener, at ~0.28 and ~0.6): backhand and forehand, the blade whipping one way and
  // straight back, his hips turning under it.
  tpdouble(p) {
    const a = ease(seg(p, 0.08, 0.3));
    const b = ease(seg(p, 0.4, 0.62));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(-58, 130, a), -40, b) - 18 * back, arm: lerp(54, 58, a) - 4 * back,
      lunge: 4 * a * (1 - b) + 5 * b * (1 - back), tilt: 0.1 + 0.06 * a * (1 - b) - 0.04 * b * (1 - back), trail: (a > 0 && a < 1) || (b > 0 && b < 1),
      rig: (r) => {
        danceLegs(r, [a, [4, -0.4, 6], [-3.8, 0, -12]], [b * (1 - back), [4.6, 0, 8], [-4.2, -0.6, -14]]);
        r.backArm = [q(-3 - 3 * a + 3 * back), q(-2 - 2 * b + 2 * back)];
        r.hairLift = a > 0.2 && back < 0.5 ? 1 : 0;
        if ((a > 0.3 && b < 0.2) || (b > 0.3 && back < 0.5)) strikeFace(r);
      },
    };
  },
  // Flash (opener, at ~0.45): he crouches a hair and is gone, the length of a stride ahead in a
  // flicker, the blade held out level behind his cut.
  tpflash(p) {
    const set = soft(seg(p, 0, 0.18));
    const go = ease(seg(p, 0.2, 0.42));
    const back = soft(seg(p, 0.66, 1));
    return {
      weapon: lerp(lerp(-58, -96, set), 104, go) - 36 * back, arm: lerp(lerp(54, 46, set), 58, go) - 8 * back,
      lunge: -1 * set * (1 - go) + 8 * go * (1 - 0.6 * back), tilt: 0.12 * set * (1 - go) + 0.22 * go * (1 - back), trail: go > 0 && p < 0.6,
      rig: (r) => {
        r.squat = q(1.4 * set * (1 - go));
        danceLegs(r, [set * (1 - go), [2.6, 0, 4], [-3.2, 0, -8]], [go * (1 - back), [5.4, 0, 8], [-5.4, -1, -22]]);
        r.backArm = [q(-6 * go * (1 - back)), q(-3 * go * (1 - back))];
        r.hairLift = go > 0.2 && back < 0.6 ? 1 : 0;
        r.cape = Math.round(-5 * go * (1 - back));
        if (go > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Heel turn (second, at ~0.5): he spins once on his heel with the blade out flat, coming round
  // already leaning into the next.
  tpturn(p) {
    const u = ease(seg(p, 0.1, 0.62));
    const back = soft(seg(p, 0.7, 1));
    const turn = Math.cos(u * Math.PI * 2);
    return {
      weapon: lerp(-58, 96, soft(seg(p, 0, 0.14))) + 360 * u + 30 * back, arm: 56 - 6 * back,
      lift: 2 * Math.sin(Math.PI * u), lunge: 2 + 4 * u * (1 - 0.6 * back), orbit: u > 0 && u < 1, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)),
      tilt: 0.1 * (1 - back), trail: u > 0 && u < 1,
      rig: (r) => {
        danceLegs(r, [Math.sin(Math.PI * u), [1.4, -1.6, 8], [-1.6, -1, -10]], [back, [3.6, 0, 4], [-3.6, 0, -10]]);
        r.backArm = [q(-5 * (1 - back)), q(-2 * (1 - back))];
        r.hairLift = u > 0.1 && u < 0.9 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.1, 0.7));
        if (u > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Lift (second, at ~0.44): a rising slash that throws them up, and he hops up after them.
  tplift(p) {
    const low = soft(seg(p, 0, 0.2));
    const up = ease(seg(p, 0.22, 0.46));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(-58, 152, low), -34, up) - 20 * back, arm: lerp(lerp(54, 32, low), 60, up) - 6 * back,
      lift: 7 * bump(p, 0.24, 0.9), lunge: 2 * up, tilt: 0.1 * low * (1 - up) - 0.1 * up * (1 - back), trail: up > 0 && p < 0.6,
      rig: (r) => {
        r.squat = q(1.6 * low * (1 - up));
        danceLegs(r, [low * (1 - up), [3.4, 0, 6], [-3.4, 0, -12]], [up * (1 - back), [2.2, -2.6, 12], [-1.8, -2, -16]]);
        r.backArm = [q(-4 * up + 4 * back), q(-3 * up + 2 * back)];
        r.hairLift = up > 0.2 && back < 0.5 ? -1 : 0;
        if (up > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Blur of jabs (second, at ~0.2, 0.42, 0.64): three thrusts so quick they blur, the arm snapping
  // out and back, his weight rocking forward on the last.
  tpjabs(p) {
    const set = soft(seg(p, 0, 0.12));
    const jab = bump(p, 0.12, 0.28) + bump(p, 0.34, 0.5) + 1.3 * bump(p, 0.56, 0.74);
    const back = soft(seg(p, 0.78, 1));
    return {
      weapon: lerp(-58, 92, set) + 4 * jab - 40 * back, arm: lerp(54, 44, set) + 14 * Math.min(1, jab) - 6 * back,
      lunge: 2 * set + 4 * jab * (1 - back), tilt: 0.12 * set * (1 - back) + 0.04 * jab,
      rig: (r) => {
        danceLegs(r, [set * (1 - back), [4.2, 0, 6], [-4, -0.6, -14]]);
        r.backArm = [q(-4 * set * (1 - back)), q(-2 * set * (1 - back))];
        r.hairLift = jab > 0.6 ? 1 : 0;
        if (jab > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Cross (third, at ~0.3 and ~0.6): two streaks crossing, high to low and low to high, so fast the
  // blade seems to be in two places.
  tpcross(p) {
    const a = ease(seg(p, 0.1, 0.32));
    const b = ease(seg(p, 0.42, 0.62));
    const back = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(lerp(-58, -100, soft(seg(p, 0, 0.1))), 150, a), -40, b) - 20 * back, arm: lerp(54, 58, a) - 4 * back,
      lunge: 4 * a + 2 * b * (1 - back), tilt: 0.12 + 0.06 * a * (1 - b) - 0.06 * b * (1 - back), trail: (a > 0 && a < 1) || (b > 0 && b < 1),
      rig: (r) => {
        danceLegs(r, [a, [4.4, -0.4, 6], [-4, 0, -14]], [b * (1 - back), [3.8, -1, 6], [-4.4, -0.6, -16]]);
        r.backArm = [q(-4 - 2 * a * (1 - b) + 4 * back), q(-2 - 2 * b + 2 * back)];
        r.hairLift = b > 0.2 && back < 0.5 ? -1 : a > 0.2 ? 1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.1, 0.76));
        if ((a > 0.3 && b < 0.2) || (b > 0.3 && back < 0.5)) strikeFace(r);
      },
    };
  },
  // Leg sweep (third, at ~0.46): he drops onto one knee in a skid and sweeps the blade flat along
  // the floor, sparks flying off it.
  tpsweep(p) {
    const drop = ease(seg(p, 0, 0.28));
    const sweep = ease(seg(p, 0.3, 0.5));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(-58, -150, drop), 110, sweep) - 50 * back, arm: lerp(lerp(54, 30, drop), 40, sweep) + 14 * back,
      lunge: 3 * drop + 5 * sweep * (1 - 0.6 * back), tilt: 0.16 * drop * (1 - back), trail: sweep > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(3 * drop * (1 - back));
        danceLegs(r, [drop * (1 - back), [4.4, 0, 8], [-5.2, 0, -66]]);
        r.backArm = [q(-5 * drop * (1 - back)), q(lerp(-1, 1, drop) * (1 - back))];
        r.cape = Math.round(-5 * drop * (1 - back));
        if (sweep > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Lunge (third, at ~0.46): a long low lunge, the point driven straight out through the line, his
  // back leg flung out behind him.
  tplunge(p) {
    const set = soft(seg(p, 0, 0.26));
    const go = ease(seg(p, 0.3, 0.48));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(-58, 100, set), 90, go) + 44 * back, arm: lerp(lerp(54, 38, set), 60, go) - 10 * back,
      lunge: -2 * set * (1 - go) + 12 * go * (1 - 0.7 * back), tilt: 0.06 * set * (1 - go) + 0.18 * go * (1 - back),
      rig: (r) => {
        r.squat = q(1.6 * set * (1 - go) + 1.4 * go * (1 - back));
        danceLegs(r, [set * (1 - go), [2.4, 0, 2], [-3.6, 0, -10]], [go * (1 - back), [6, 0, 10], [-6, -0.8, -24]]);
        r.backArm = [q(lerp(2, -7, go) + 7 * back), q(lerp(0, -3, go) + 3 * back)];
        r.hairLift = go > 0.3 && back < 0.5 ? 1 : 0;
        r.cape = Math.round(-5 * go * (1 - back));
        if (go > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Blink (finisher, at ~0.55): he draws the blade back along his hip, crouches, and is gone in a
  // red bolt (world/melee.js moves him through to the far side), cutting back through all of them;
  // he lands crouched, blade swept out behind, and rises.
  tpblink(p) {
    const draw = ease(seg(p, 0, 0.4));
    const go = ease(seg(p, 0.48, 0.58));
    const land = soft(seg(p, 0.58, 0.72));
    const back = soft(seg(p, 0.84, 1));
    const thrum = Math.sin(p * 90) * 2 * bump(p, 0.24, 0.46);
    return {
      weapon: lerp(lerp(-58, 104, draw) + thrum, 212, go) - 40 * back, arm: lerp(lerp(54, 36, draw), 56, go) - 10 * back,
      lunge: -2 * draw * (1 - go) + 6 * go * (1 - land * 0.5) * (1 - back), tilt: 0.1 * draw * (1 - go) + 0.24 * go * (1 - land * 0.5) * (1 - back), trail: go > 0 && p < 0.7,
      rig: (r) => {
        r.squat = q(2.2 * draw * (1 - go) + 2.6 * land * (1 - back));
        danceLegs(r, [draw * (1 - go), [2.6, 0, 4], [-3.8, 0, -10]], [land * (1 - back), [5, 0, 10], [-5.4, 0, -18]]);
        r.backArm = [q(lerp(2, -6, go) * (1 - back)), q(lerp(0, -4, go) * (1 - back))];
        r.hairLift = go > 0.2 && back < 0.5 ? 1 : 0;
        r.cape = Math.round(-6 * go * (1 - back));
        if (draw > 0.5 && go < 0.2) r.eyes = 'half';
        else if (go > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Whirlwind of streaks (finisher, at ~0.3 and ~0.66): two full spins on the spot, fast, the blade
  // out flat drawing rings of red round him, and a last cut flung out of the second.
  tpwhirl(p) {
    const u = ease(seg(p, 0.08, 0.7));
    const back = soft(seg(p, 0.78, 1));
    const turn = Math.cos(u * Math.PI * 4);
    return {
      weapon: lerp(-58, 96, soft(seg(p, 0, 0.1))) + 720 * u + 40 * back, arm: 58 - 8 * back,
      lift: 3 * Math.sin(Math.PI * u), lunge: 2 + 3 * u * (1 - back), orbit: u > 0 && u < 1, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)),
      tilt: 0.06 * (1 - back), trail: u > 0 && u < 1,
      rig: (r) => {
        danceLegs(r, [Math.sin(Math.PI * u), [1.4, -1.8, 8], [-1.4, -1.2, -10]], [back, [4, 0, 6], [-4, 0, -12]]);
        r.backArm = [q(-5 * (1 - back)), q(-3 * (1 - back))];
        r.hairLift = u > 0.05 && u < 0.95 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.08, 0.78));
        if (u > 0.2 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Diving cut (finisher, lands at ~0.58): a quick crouch, a leap up and forward with the blade
  // hauled back, and a diving cut down through them that lands as a red bolt.
  tpdive(p) {
    const crouch = soft(seg(p, 0, 0.12));
    const up = ease(seg(p, 0.12, 0.36));
    const down = easeIn(seg(p, 0.44, 0.58));
    const land = soft(seg(p, 0.58, 0.72));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(lerp(-58, -110, up), 160, down) - 30 * back, arm: lerp(lerp(54, 50, up), 52, down) - 10 * land * (1 - back),
      lift: 18 * up * (1 - down), lunge: 3 * up + 8 * down * (1 - 0.5 * back), tilt: -0.1 * up * (1 - down) + 0.28 * down * (1 - land * 0.5) * (1 - back), trail: down > 0 && p < 0.7,
      rig: (r) => {
        if (up > 0.2 && down < 0.95) tuck(r);
        else {
          r.squat = q(1.8 * crouch * (1 - up) + 2.6 * land * (1 - back));
          danceLegs(r, [crouch * (1 - up), [3, 0, 4], [-3, 0, -6]], [land * (1 - back), [4.6, 0, 8], [-5, 0, -18]]);
        }
        r.backArm = [q(lerp(-2, 2, down) * (1 - back)), q(lerp(-6, 1, down) * (1 - back))];
        r.hairLift = up > 0.2 && down < 1 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.12, 0.84));
        if (down > 0.4 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Up + attack: a rising cut and a second one higher, up after them.
  tpskyward(p) {
    const a = ease(seg(p, 0.08, 0.3));
    const b = ease(seg(p, 0.42, 0.62));
    const back = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(lerp(lerp(-58, 150, soft(seg(p, 0, 0.08))), -20, a), 130, soft(seg(p, 0.32, 0.42))), -40, b) - 18 * back, arm: lerp(lerp(36, 60, a), 40, soft(seg(p, 0.32, 0.42))) + 20 * b - 6 * back,
      lift: 6 * bump(p, 0.08, 0.5) + 12 * bump(p, 0.4, 0.95), tilt: -0.1 * a * (1 - back), trail: (a > 0 && a < 1) || (b > 0 && b < 1),
      rig: (r) => {
        if (p > 0.36 && back < 0.6) tuck(r);
        else danceLegs(r, [1 - a, [3, 0, 4], [-3, 0, -10]]);
        r.backArm = [q(-4 * a), q(-4 * a)];
        r.hairLift = a > 0.2 ? -1 : 0;
        if (a > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // In the air: quick cuts down and back up (each keeps him hanging), then a red dive.
  tpaircut(p) {
    const cut = ease(seg(p, 0.14, 0.5));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(-80, 130, cut) - 24 * back, arm: lerp(52, 58, cut) - 6 * back, tilt: 0.14 * cut * (1 - back), trail: cut > 0 && cut < 1,
      rig: (r) => {
        tuck(r);
        r.backArm = [q(-3 * cut), q(-2 * cut)];
        r.hairLift = 1;
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  tpaircut2(p) {
    const cut = ease(seg(p, 0.14, 0.5));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(150, -30, cut) - 20 * back, arm: lerp(38, 60, cut) - 6 * back, tilt: -0.12 * cut * (1 - back), trail: cut > 0 && cut < 1,
      rig: (r) => {
        tuck(r);
        r.backArm = [q(-4 * cut), q(-4 * cut)];
        r.hairLift = -1;
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  tpairfall(p) {
    const point = ease(seg(p, 0, 0.4));
    return {
      weapon: lerp(-58, 160, point), arm: lerp(52, 46, point), tilt: 0.3 * point,
      rig: (r) => {
        r.air = true;
        r.frontLeg = [q(lerp(2.6, 1.8, point)), q(lerp(-5, -1.6, point)), 10];
        r.backLeg = [q(-2.2), q(-1.4), -24];
        r.backArm = [q(-6 * point), q(-3 * point)];
        r.hairLift = -1;
        r.cape = -5;
        if (point > 0.4) strikeFace(r);
      },
    };
  },
  // Out of a run: he flashes clean through the line, low and leaning, the cut held out level.
  tpdash(p) {
    const lean = ease(seg(p, 0, 0.2));
    const cut = ease(seg(p, 0.3, 0.44));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(-58, -140, lean), 96, cut) - 40 * back, arm: lerp(lerp(54, 30, lean), 58, cut) - 8 * back,
      lunge: 5 * lean + 6 * cut * (1 - back), tilt: 0.3 * lean * (1 - cut * 0.4) * (1 - back), trail: cut > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(1.4 * lean * (1 - back));
        danceLegs(r, [lean * (1 - cut), [4.6, -1.6, 14], [-5.4, -2.2, -40]], [cut * (1 - back), [5.6, 0, 8], [-5.4, 0, -18]]);
        r.backArm = [q(-7 * lean * (1 - back)), q(-3 * lean * (1 - back))];
        r.hairLift = lean > 0.2 && back < 0.6 ? 1 : 0;
        r.cape = Math.round(-6 * lean * (1 - back));
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Down + attack: a hop and a skidding slam, sparks thrown off the floor.
  tpslam(p) {
    const hop = ease(seg(p, 0.04, 0.26));
    const down = easeIn(seg(p, 0.38, 0.5));
    const skid = soft(seg(p, 0.5, 0.7));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(lerp(-58, -112, hop), 166, down) - 40 * back, arm: lerp(lerp(54, 56, hop), 46, down) + 6 * back,
      lift: 9 * hop * (1 - down), lunge: 2 * hop + 6 * down * (1 - 0.6 * back), tilt: -0.08 * hop * (1 - down) + 0.24 * down * (1 - skid * 0.3) * (1 - back),
      rig: (r) => {
        if (hop > 0.3 && down < 0.9) tuck(r);
        else {
          r.squat = q(2.6 * skid * (1 - back));
          danceLegs(r, [down * (1 - back), [4.8, 0, 8], [-5, 0, -14]]);
        }
        r.backArm = [q(lerp(-2, 2, down) * (1 - back)), q(lerp(-6, 1, down) * (1 - back))];
        r.hairLift = hop > 0.3 && down < 0.9 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.04, 0.82));
        if (down > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },

  // His skills.
  // Flash Step: a hair's crouch, then gone: low and leaning, the blade trailing, and out of it in a cut.
  tpstep(p) {
    const set = soft(seg(p, 0, 0.16));
    const go = ease(seg(p, 0.16, 0.4));
    const out = soft(seg(p, 0.56, 0.74));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(lerp(-58, -90, set), -150, go), 100, out) - 40 * back, arm: lerp(lerp(54, 30, go), 58, out) - 8 * back,
      lunge: -1 * set + 7 * go * (1 - out * 0.3) * (1 - back), tilt: 0.1 * set + 0.24 * go * (1 - out * 0.5) * (1 - back), trail: out > 0 && p < 0.8,
      rig: (r) => {
        r.squat = q(1.4 * set * (1 - go) + 1.2 * go * (1 - back));
        danceLegs(r, [set * (1 - go), [2.6, 0, 4], [-3.2, 0, -8]], [go * (1 - out), [4.6, -1.4, 14], [-5.4, -2, -40]], [out * (1 - back), [5.4, 0, 8], [-5, 0, -16]]);
        r.backArm = [q(-7 * go * (1 - back)), q(-3 * go * (1 - back))];
        r.hairLift = go > 0.2 && back < 0.6 ? 1 : 0;
        r.cape = Math.round(-6 * go * (1 - back));
        if (go > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Thousand Cuts: he leans in, braced, and the blade becomes a blur (it flickers back and forth
  // across the front of him faster and faster), then one last huge cut.
  tpthousand(p) {
    const set = soft(seg(p, 0, 0.1));
    const blur = seg(p, 0.1, 0.76);
    const a = blur * Math.PI * 2 * (3 + 4 * blur);
    const last = ease(seg(p, 0.8, 0.88));
    const back = soft(seg(p, 0.88, 1));
    const on = blur > 0 && blur < 1 ? 1 : 0;
    return {
      weapon: (on ? 110 + 70 * Math.sin(a) : lerp(lerp(-58, 110, set), -60, soft(seg(p, 0.76, 0.8)))) + (p >= 0.8 ? lerp(0, 210, last) : 0) - 30 * back, arm: 52 + 6 * Math.cos(a) * on - 8 * back,
      lunge: 3 * set + 1.5 * Math.sin(a * 0.5) * on + 5 * last * (1 - back), tilt: 0.14 * set * (1 - back) + 0.1 * last * (1 - back), trail: on > 0 || (last > 0 && last < 1),
      rig: (r) => {
        r.squat = q(1.4 * set * (1 - back));
        danceLegs(r, [set * (1 - back), [4.6, 0, 8], [-4.6, 0, -14]]);
        r.backArm = [q(-5 * set * (1 - back)), q(-2 * set * (1 - back))];
        r.hairLift = on ? (Math.sin(a) > 0 ? 1 : -1) : 0;
        r.cape = Math.round(-4 * set * (1 - back));
        if (on || (last > 0.3 && back < 0.5)) r.mouth = on ? 'grit' : 'open';
      },
    };
  },
  // Crimson Arc: a wide flat whip of the blade round and out, and straight back the other way.
  tparc(p) {
    const a = ease(seg(p, 0.1, 0.34));
    const b = ease(seg(p, 0.44, 0.66));
    const back = soft(seg(p, 0.78, 1));
    return {
      weapon: lerp(lerp(lerp(-58, -130, soft(seg(p, 0, 0.1))), 110, a), -60, b) + 20 * back, arm: lerp(54, 58, a) - 4 * back,
      lunge: 4 * a * (1 - b) + 5 * b * (1 - back), tilt: 0.12 * a * (1 - b) - 0.04 * b * (1 - back),
      turn: a > 0.5 && b < 0.4 ? 1 : 1, trail: (a > 0 && a < 1) || (b > 0 && b < 1),
      rig: (r) => {
        danceLegs(r, [a * (1 - b), [4.4, 0, 6], [-4, 0, -14]], [b * (1 - back), [4.8, -0.6, 8], [-4.4, -0.4, -14]]);
        r.backArm = [q(-4 - 3 * a * (1 - b) + 4 * back), q(-2 - 2 * b + 2 * back)];
        r.hairLift = a > 0.2 && back < 0.5 ? 1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.1, 0.78));
        if ((a > 0.3 && b < 0.2) || (b > 0.3 && back < 0.5)) strikeFace(r);
      },
    };
  },
  // Afterimage: a flick of the blade out and a blur of a sidestep, a grin.
  tpafter(p) {
    const flick = ease(seg(p, 0.1, 0.36));
    const side = bump(p, 0.36, 0.72);
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(-58, 104, flick) - 50 * back, arm: lerp(54, 58, flick) - 8 * back, lunge: -4 * side, tilt: 0.08 * flick * (1 - back) - 0.08 * side,
      rig: (r) => {
        danceLegs(r, [flick * (1 - back), [3.6, -0.4, 4], [-3.6, 0, -10]], [side, [2, -1.6, 8], [-3, -1.2, -16]]);
        r.backArm = [q(-4 * flick * (1 - back)), q(-2 * flick * (1 - back))];
        r.hairLift = side > 0.3 ? -1 : 0;
        if (side > 0.3) r.mouth = 'grin';
      },
    };
  },
  // Red Thunder (finisher): he draws the blade back along his hip, crouched, and vanishes into the
  // blinks (world/melee.js moves him from monster to monster; he's a blur of cuts the whole time),
  // then stands in the middle of them, the blade raised, as the red bolt falls.
  tpredthunder(p) {
    const draw = ease(seg(p, 0, 0.2));
    const u = seg(p, 0.22, 0.7);
    const a = u * Math.PI * 2 * 5;
    const raise = ease(seg(p, 0.72, 0.84));
    const back = soft(seg(p, 0.9, 1));
    const on = u > 0 && u < 1 ? 1 : 0;
    return {
      weapon: (on ? 100 + 90 * Math.sin(a) : lerp(-58, 104, draw)) * (p < 0.72 ? 1 : 0) + (p >= 0.72 ? lerp(104, 160, raise) - 30 * back : 0), arm: on ? 54 + 6 * Math.cos(a) : lerp(lerp(54, 36, draw), 50, raise) - 6 * back,
      lunge: on ? 6 : -2 * draw * (1 - raise) + 2 * raise * (1 - back), tilt: on ? 0.22 : 0.12 * draw * (1 - raise) + 0.2 * raise * (1 - back), trail: on > 0,
      rig: (r) => {
        r.squat = q(on ? 1.2 : 2 * draw * (1 - raise) + 2.4 * raise * (1 - back));
        if (on) danceLegs(r, [1, [5, -0.6, 10], [-5.4, -1, -24]]);
        else danceLegs(r, [draw * (1 - raise), [2.6, 0, 4], [-3.8, 0, -10]], [raise * (1 - back), [4.6, 0, 8], [-5, 0, -18]]);
        r.backArm = [q(on ? -6 : -2 * raise * (1 - back)), q(on ? -3 : -1)];
        r.hairLift = on ? 1 : 0;
        r.cape = Math.round(on ? -6 : -4 * raise * (1 - back));
        if (draw > 0.5 && !on && raise < 0.1) r.eyes = 'half';
        else if (on || (raise > 0.3 && back < 0.5)) strikeFace(r);
      },
    };
  },
  // His versions of the Thunderguard's skills.
  // Red Rush: a streak, low and leaning (not a charge), out of it in a cut.
  tprush(p) {
    const lean = ease(seg(p, 0, 0.14));
    const cut = ease(seg(p, 0.54, 0.66));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(-58, -150, lean), 100, cut) - 42 * back, arm: lerp(lerp(54, 26, lean), 58, cut) - 8 * back,
      lunge: 7 * lean * (1 - cut) + 9 * cut * (1 - back), tilt: 0.34 * lean * (1 - cut) + 0.14 * cut * (1 - back), trail: cut > 0 && p < 0.76,
      rig: (r) => {
        r.squat = q(1.2 * lean * (1 - back));
        danceLegs(r, [lean * (1 - cut), [4.8, -1.8, 16], [-5.6, -2.6, -46]], [cut * (1 - back), [5.6, 0, 8], [-5.2, 0, -16]]);
        r.backArm = [q(-7 * lean * (1 - cut) - 4 * cut * (1 - back)), q(-3 * lean * (1 - cut) - 2 * cut * (1 - back))];
        r.hairLift = lean > 0.3 && back < 0.5 ? 1 : 0;
        r.cape = Math.round(-6 * lean * (1 - back));
        if (cut > 0.3 && back < 0.5) strikeFace(r);
        else if (lean > 0.5) r.mouth = 'grit';
      },
    };
  },
  // Crimson Cleave: no long haul, a cleave whipped up from the hip and over, flinging the crescent.
  tpcleave(p) {
    const load = ease(seg(p, 0, 0.3));
    const whip = ease(seg(p, 0.34, 0.5));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(-58, -140, load), 150, whip) - 30 * back, arm: lerp(lerp(54, 56, load), 52, whip) - 8 * back,
      lunge: -2 * load * (1 - whip) + 8 * whip * (1 - 0.6 * back), tilt: -0.08 * load * (1 - whip) + 0.22 * whip * (1 - back), trail: whip > 0 && p < 0.7,
      rig: (r) => {
        r.squat = q(1.6 * load * (1 - whip) + 1.6 * whip * (1 - back));
        danceLegs(r, [load * (1 - whip), [3, 0, 4], [-3.8, 0, -10]], [whip * (1 - back), [5.4, 0, 10], [-5, 0, -16]]);
        r.backArm = [q(lerp(lerp(0, -2, load), 4, whip) - 4 * back), q(lerp(lerp(-1, -5, load), 1, whip) - 1 * back)];
        r.hairLift = whip > 0.3 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.3, 0.78));
        if (whip > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Red Cyclone: four tight fast spins, then a cut flung out of the last.
  tpcyclone(p) {
    const cock = ease(seg(p, 0, 0.1));
    const u = seg(p, 0.1, 0.8);
    const spun = soft(u) * 4;
    const fling = ease(seg(p, 0.8, 0.88));
    const back = soft(seg(p, 0.9, 1));
    const turn = Math.cos(spun * Math.PI * 2);
    const spinning = u > 0 && u < 1;
    return {
      weapon: (u <= 0 ? lerp(-58, 96, cock) : 96 + 360 * spun) + (u >= 1 ? lerp(0, 40, fling) - 30 * back : 0), arm: spinning ? 58 : 56 - 6 * back,
      lift: 4 * Math.sin(Math.PI * u), lunge: 2 + 4 * fling * (1 - back), orbit: spinning, turn: spinning ? Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)) : 1,
      tilt: 0.08 * (1 - back), trail: spinning || (fling > 0 && fling < 1),
      rig: (r) => {
        danceLegs(r, [cock * (1 - Math.sin(Math.PI * u)), [3, 0, 4], [-3, 0, -6]], [Math.sin(Math.PI * u), [1.4, -2.2, 8], [-1.4, -1.6, -10]], [fling * (1 - back), [5, 0, 8], [-4.6, 0, -14]]);
        r.backArm = [q(-5 + 2 * fling * (1 - back)), q(-2 - 2 * Math.sin(Math.PI * u))];
        r.hairLift = spinning ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.1, 0.9));
        if (spinning || (fling > 0.3 && back < 0.5)) r.mouth = spinning ? 'grit' : 'open';
      },
    };
  },
  // Red Spears: he points the blade out at them, free hand thrown up behind, and the bolts slant in.
  tprod(p) {
    const point = ease(seg(p, 0.06, 0.28));
    const hold = soft(seg(p, 0.28, 0.4));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(-58, 86, point) - 4 * Math.sin(p * 20) * hold * (1 - back) + 44 * back, arm: lerp(54, 60, point) - 10 * back,
      lunge: 4 * point * (1 - back), tilt: 0.08 * point * (1 - back),
      rig: (r) => {
        danceLegs(r, [point * (1 - back), [4.4, 0, 6], [-4.2, 0, -14]]);
        r.backArm = [q(lerp(0, -5, hold) * (1 - back)), q(lerp(-1, -10, hold) * (1 - back))];
        r.hairLift = hold > 0.5 && back < 0.5 ? -1 : 0;
        if (hold > 0.4 && back < 0.5) r.mouth = 'open';
      },
    };
  },
  // Warcry: the blade swung up and slapped flat on the floor in front of him, with a shout.
  tpclap(p) {
    const up = ease(seg(p, 0, 0.3));
    const slap = easeIn(seg(p, 0.36, 0.46));
    const hold = soft(seg(p, 0.46, 0.6));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(lerp(-58, -96, up), 164, slap) - 30 * back, arm: lerp(lerp(54, 60, up), 40, slap) + 10 * back,
      lift: 2 * up * (1 - slap), lunge: 4 * slap * (1 - back), tilt: -0.08 * up * (1 - slap) + 0.18 * slap * (1 - back),
      rig: (r) => {
        r.squat = q(2.4 * hold * (1 - back) + 1.2 * slap * (1 - hold));
        danceLegs(r, [up * (1 - slap), [2, -1, 2], [-2.2, -0.8, -4]], [slap * (1 - back), [5, 0, 10], [-5, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -3, up), -5, slap) + 5 * back), q(lerp(lerp(-1, -8, up), 1, slap) - 1 * back)];
        r.hairLift = hold > 0.3 && back < 0.5 ? 1 : 0;
        if (slap > 0.5 && back < 0.6) r.mouth = 'open';
      },
    };
  },
  // Afterburn: a quick shake out of the arms and a bounce on the toes as the red blur wraps him.
  tpguard(p) {
    const shake = bump(p, 0.08, 0.5);
    const bounce = bump(p, 0.4, 0.62) + bump(p, 0.62, 0.84) * 0.6;
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: -58 + 20 * Math.sin(p * 30) * shake + 40 * bounce * (1 - back), arm: 54 - 6 * shake, lift: 2.4 * bounce,
      tilt: 0.04 * Math.sin(p * 30) * shake,
      rig: (r) => {
        danceLegs(r, [Math.max(shake, bounce), [2.6, -0.8, 4], [-2.8, -0.6, -8]]);
        r.backArm = [q(-2 + 2 * Math.sin(p * 30) * shake), q(-1 + 2 * shake)];
        if (bounce > 0.3) r.mouth = 'grin';
      },
    };
  },
  // Skyfall: a crouch, a leap high into the red storm, a hang with the blade up behind his head, and
  // a dive down as the red bolt; he lands crouched, blade low.
  tpfall(p) {
    const crouch = soft(seg(p, 0, 0.08));
    const up = ease(seg(p, 0.08, 0.3));
    const hang = seg(p, 0.3, 0.54);
    const fall = easeIn(seg(p, 0.54, 0.6));
    const land = soft(seg(p, 0.6, 0.72));
    const rise = soft(seg(p, 0.88, 1));
    return {
      weapon: lerp(lerp(-58, -120, up) + 3 * Math.sin(p * 80) * hang, 168, fall) - 30 * rise, arm: lerp(lerp(54, 58, up), 48, fall) - 12 * land * (1 - rise),
      lift: 60 * up * (1 - fall) + 3 * Math.sin(hang * Math.PI * 2) * (1 - fall), lunge: 2 * up + 7 * fall * (1 - 0.5 * rise),
      tilt: -0.12 * up * (1 - fall) + 0.3 * fall * (1 - land * 0.6) * (1 - rise), trail: fall > 0 && p < 0.7,
      rig: (r) => {
        if (up > 0.2 && fall < 0.95) {
          r.air = true;
          r.frontLeg = [q(lerp(2.6, 3.4, fall)), q(lerp(-4.4, -2, fall)), 10];
          r.backLeg = [q(-1.8), q(-2.8), -16];
        } else {
          r.squat = q(2 * crouch * (1 - up) + 2.8 * land * (1 - rise));
          danceLegs(r, [crouch * (1 - up), [3, 0, 4], [-3, 0, -6]], [land * (1 - rise), [4.6, 0, 8], [-5.4, 0, -20]]);
        }
        r.backArm = [q(lerp(lerp(0, -4, up), 3, land) * (1 - rise)), q(lerp(lerp(-1, -9, up), 2, land) * (1 - rise))];
        r.hairLift = up > 0.2 && fall < 1 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.08, 0.86));
        if (hang > 0.2 && fall < 0.3) r.mouth = 'grit';
        if (fall > 0.5 && rise < 0.5) r.mouth = 'open';
      },
    };
  },

  // ---------- The Stormwall (the Thunderguard's tank path; docs/design/stormwall.md) ----------
  // Weight: deep braced stances, long slow wind-ups, a planted strike that lands like a falling wall,
  // and a heavy settle (`plant` footwork: no hops, one stamp). Blade angles as the Thunderguard's.

  // Braced overhead (opener, at ~0.52): he sinks into his stance with the blade hauled back over his
  // shoulder, then brings it down in one heavy planted chop.
  bwbrace(p) {
    const sink = soft(seg(p, 0, 0.36));
    const chop = ease(seg(p, 0.4, 0.56));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(-58, -104, sink), 146, chop) - 30 * back, arm: lerp(lerp(54, 50, sink), 54, chop) - 10 * back,
      lunge: -1 * sink * (1 - chop) + 4 * chop * (1 - 0.6 * back), tilt: -0.08 * sink * (1 - chop) + 0.14 * chop * (1 - back), trail: chop > 0 && p < 0.7,
      rig: (r) => {
        r.squat = q(2.2 * sink * (1 - chop) + 2.2 * chop * (1 - back));
        danceLegs(r, [Math.max(sink, chop) * (1 - back), [3.8, 0, 6], [-4.2, 0, -10]]);
        r.backArm = [q(lerp(0, 3, chop) * (1 - back)), q(lerp(-1, 1, chop) * (1 - back))];
        r.cape = Math.round(-3 * bump(p, 0.4, 0.8));
        if (sink > 0.5 && chop < 0.2) r.mouth = 'grit';
        else if (chop > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Heavy return (second, at ~0.5): from low in front he drags the blade back up and over in a slow,
  // grinding arc, leaning his whole weight into it.
  bwreturn(p) {
    const low = soft(seg(p, 0, 0.3));
    const up = ease(seg(p, 0.34, 0.56));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(-58, 172, low), -44, up) - 14 * back, arm: lerp(lerp(54, 32, low), 58, up) - 4 * back,
      lunge: 1.5 * low * (1 - up) + 3 * up * (1 - back), tilt: 0.1 * low * (1 - up) - 0.1 * up * (1 - back), trail: up > 0 && p < 0.7,
      rig: (r) => {
        r.squat = q(2.6 * low * (1 - up) + 1 * up * (1 - back));
        danceLegs(r, [low * (1 - back), [3.8, 0, 6], [-4.2, 0, -12]]);
        r.backArm = [q(lerp(2, -4, up) + 4 * back), q(lerp(1, -3, up) + 2 * back)];
        if (up > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Rain cleave (third, at ~0.56): a wide two-handed cleave round from his back hip, the rain
  // curtain falling with it.
  bwcleave(p) {
    const wind = soft(seg(p, 0, 0.4));
    const cut = ease(seg(p, 0.44, 0.6));
    const back = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(-58, -150, wind), 140, cut) - 26 * back, arm: lerp(lerp(54, 46, wind), 56, cut) - 10 * back,
      lunge: -2 * wind * (1 - cut) + 6 * cut * (1 - 0.6 * back), tilt: -0.1 * wind * (1 - cut) + 0.18 * cut * (1 - back), trail: cut > 0 && p < 0.72,
      rig: (r) => {
        r.squat = q(2.4 * wind * (1 - cut) + 2 * cut * (1 - back));
        danceLegs(r, [wind * (1 - cut), [3.4, 0, 4], [-4.6, 0, -12]], [cut * (1 - back), [5, 0, 10], [-5, 0, -14]]);
        r.backArm = [q(lerp(lerp(0, -3, wind), 4, cut) - 4 * back), q(lerp(lerp(-1, -4, wind), 1, cut) - 1 * back)];
        r.cape = Math.round(-4 * bump(p, 0.3, 0.84));
        if (wind > 0.5 && cut < 0.2) r.mouth = 'grit';
        else if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // The thunderhead's bolt (finisher, at ~0.6): he raises the blade high and holds it, braced, as the
  // cloud's charge pours into it (it thrums), then drives it down and the bolt follows.
  bwbolt(p) {
    const raise = soft(seg(p, 0, 0.36));
    const hold = bump(p, 0.3, 0.56);
    const down = easeIn(seg(p, 0.5, 0.62));
    const settle = soft(seg(p, 0.62, 0.78));
    const back = soft(seg(p, 0.86, 1));
    const thrum = Math.sin(p * 80) * 3 * hold;
    return {
      weapon: lerp(lerp(-58, -128, raise) + thrum, 168, down) - 36 * back, arm: lerp(lerp(54, 60, raise), 48, down) - 10 * settle * (1 - back),
      lift: 1.5 * raise * (1 - down), lunge: 6 * down * (1 - 0.5 * back), tilt: -0.1 * raise * (1 - down) + 0.24 * down * (1 - settle * 0.4) * (1 - back), trail: down > 0 && p < 0.72,
      rig: (r) => {
        r.squat = q(1.2 * raise * (1 - down) + 3.2 * settle * (1 - back) + 2 * down * (1 - settle));
        danceLegs(r, [raise * (1 - down), [3, 0, 4], [-3.6, 0, -8]], [down * (1 - back), [5, 0, 10], [-5.2, 0, -16]]);
        r.backArm = [q(lerp(lerp(0, -5, raise), -4, down) + 4 * back), q(lerp(lerp(-1, -9, raise), 1, down) - 1 * back)];
        r.hairLift = raise > 0.4 && down < 0.5 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.2, 0.86));
        if (hold > 0.3 && down < 0.3) r.mouth = 'grit';
        if (down > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Static shove (opener, at ~0.46): the blade held back on his shoulder, he drops his free shoulder
  // behind a plate of static and drives it into them.
  bwshove(p) {
    const load = soft(seg(p, 0, 0.32));
    const drive = ease(seg(p, 0.34, 0.48));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(-58, -80, load) + 22 * back, arm: lerp(54, 46, load) + 8 * back,
      lunge: -2 * load * (1 - drive) + 9 * drive * (1 - 0.7 * back), tilt: -0.08 * load * (1 - drive) + 0.24 * drive * (1 - back),
      rig: (r) => {
        r.squat = q(2 * load * (1 - drive) + 1.2 * drive * (1 - back));
        danceLegs(r, [load * (1 - drive), [2.4, 0, 2], [-3.6, 0, -10]], [drive * (1 - back), [5, 0, 8], [-5, 0, -20]]);
        r.backArm = [q(lerp(0, 6, drive) - 6 * back), q(lerp(-1, -3, drive) + 3 * back)];
        r.tx = q(1.6 * drive * (1 - back));
        if (drive > 0.3 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Field pull (opener, at ~0.5): he points the blade out at them, plants, and hauls it back across
  // his body like a rope, dragging them in on the field lines.
  bwpull(p) {
    const point = ease(seg(p, 0, 0.3));
    const haul = ease(seg(p, 0.42, 0.62));
    const back = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(-58, 92, point), 150, haul) - 50 * back, arm: lerp(lerp(54, 60, point), 40, haul) + 6 * back,
      lunge: 4 * point * (1 - haul) - 3 * haul * (1 - back), tilt: 0.1 * point * (1 - haul) - 0.08 * haul * (1 - back),
      rig: (r) => {
        r.squat = q(2 * haul * (1 - back));
        danceLegs(r, [point * (1 - haul), [4.6, 0, 6], [-4, 0, -12]], [haul * (1 - back), [3.2, 0, 2], [-5, 0, -10]]);
        r.backArm = [q(lerp(lerp(0, 4, point), -4, haul) * (1 - back)), q(lerp(-1, -2, point) * (1 - back))];
        if (haul > 0.3 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Thunder stamp (second, at ~0.5): he lifts his front foot high and stamps; thunder rolls out along
  // the floor from it, the blade braced point-down at his side.
  bwstamp(p) {
    const lift = soft(seg(p, 0.06, 0.4));
    const stamp = easeIn(seg(p, 0.42, 0.5));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(-58, 160, soft(seg(p, 0, 0.3))) - 6 * stamp - 40 * back, arm: lerp(54, 36, soft(seg(p, 0, 0.3))) + 10 * back,
      lift: 1.5 * lift * (1 - stamp), tilt: -0.06 * lift * (1 - stamp) + 0.08 * stamp * (1 - back),
      rig: (r) => {
        r.squat = q(2.6 * stamp * (1 - back));
        if (lift > 0.1 && stamp < 1) {
          r.frontLeg = [q(lerp(0.8, 2.6, lift)), q(-5 * lift * (1 - stamp)), Math.round((lerp(0, 30, lift) * (1 - stamp)) / 2) * 2];
          r.backLeg = [q(-2.6), 0, -6];
        } else danceLegs(r, [stamp * (1 - back), [4.4, 0, 6], [-4.2, 0, -10]]);
        r.backArm = [q(lerp(0, -4, lift) * (1 - back)), q(lerp(-1, -4, lift) * (1 - back))];
        if (stamp > 0.5 && back < 0.5) r.mouth = 'open';
      },
    };
  },
  // Guard-cut (second, at ~0.48): the blade swept up from low in front into a high guard, lifting
  // them, and held there a beat like a raised wall.
  bwguardcut(p) {
    const low = soft(seg(p, 0, 0.3));
    const up = ease(seg(p, 0.34, 0.52));
    const back = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(-58, 160, low), -30, up) - 24 * back, arm: lerp(lerp(54, 30, low), 60, up) - 6 * back,
      lunge: 1.5 * low * (1 - up) + 2 * up * (1 - back), tilt: 0.1 * low * (1 - up) - 0.08 * up * (1 - back), trail: up > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(2.4 * low * (1 - up) + 1 * up * (1 - back));
        danceLegs(r, [Math.max(low, up) * (1 - back), [3.6, 0, 6], [-4, 0, -12]]);
        r.backArm = [q(lerp(0, -4, up) + 4 * back), q(lerp(1, -4, up) + 3 * back)];
        if (up > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Lightning cage (third, at ~0.54): he swings the blade round flat at waist height once, slowly,
  // and drives it point-down into the floor; the cage snaps up round them.
  bwcage(p) {
    const swing = ease(seg(p, 0.06, 0.42));
    const plant = easeIn(seg(p, 0.46, 0.56));
    const back = soft(seg(p, 0.8, 1));
    const turn = Math.cos(swing * Math.PI * 2);
    const spinning = swing > 0 && swing < 1;
    return {
      weapon: (swing <= 0 ? lerp(-58, 96, soft(seg(p, 0, 0.06))) : 96 + 360 * swing) + (swing >= 1 ? lerp(0, 82, plant) - 40 * back : 0), arm: lerp(56, 34, plant) + 10 * back,
      lunge: 2 * plant * (1 - back), orbit: spinning, turn: spinning ? Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)) : 1, tilt: 0.12 * plant * (1 - back), trail: spinning,
      rig: (r) => {
        r.squat = q(1.2 * Math.sin(Math.PI * swing) + 2.8 * plant * (1 - back));
        danceLegs(r, [Math.max(Math.sin(Math.PI * swing), plant) * (1 - back), [4.4, 0, 6], [-4.4, 0, -12]]);
        r.backArm = [q(-4 * Math.sin(Math.PI * swing) + 3 * plant * (1 - back)), q(-2 * Math.sin(Math.PI * swing))];
        r.cape = Math.round(-4 * bump(p, 0.06, 0.8));
        if (plant > 0.4 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Hammering double (third, at ~0.36 and ~0.7): two overhead chops, the second heavier, each with a
  // full re-wind.
  bwdouble(p) {
    const a = ease(seg(p, 0.16, 0.38));
    const rewind = soft(seg(p, 0.42, 0.58));
    const b = easeIn(seg(p, 0.6, 0.72));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(lerp(lerp(lerp(-58, -110, soft(seg(p, 0, 0.16))), 140, a), -110, rewind), 150, b) - 30 * back, arm: lerp(54, 52, a) - 8 * back,
      lunge: 4 * a * (1 - rewind) + 5 * b * (1 - 0.6 * back), tilt: 0.12 * a * (1 - rewind) - 0.06 * rewind * (1 - b) + 0.18 * b * (1 - back), trail: (a > 0 && a < 1) || (b > 0 && b < 1),
      rig: (r) => {
        r.squat = q(1.6 * a * (1 - rewind) + 2.6 * b * (1 - back));
        danceLegs(r, [Math.max(a * (1 - rewind), b) * (1 - back), [4.4, 0, 8], [-4.6, 0, -12]]);
        r.backArm = [q(2 * (a + b) * (1 - back)), q(-2 * rewind * (1 - b))];
        if ((a > 0.3 && rewind < 0.2) || (b > 0.3 && back < 0.5)) strikeFace(r);
        else if (rewind > 0.4) r.mouth = 'grit';
      },
    };
  },
  // Wall of storm (finisher, at ~0.58): he hauls the blade right up behind him in both hands, rising
  // tall, and slams it into the floor; a wall of rain and lightning bursts up in front of him.
  bwslam(p) {
    const raise = soft(seg(p, 0, 0.42));
    const slam = easeIn(seg(p, 0.48, 0.58));
    const hold = soft(seg(p, 0.58, 0.74));
    const back = soft(seg(p, 0.86, 1));
    const thrum = Math.sin(p * 70) * 2.6 * bump(p, 0.26, 0.48);
    return {
      weapon: lerp(lerp(-58, -128, raise) + thrum, 174, slam) - 70 * back, arm: lerp(lerp(54, 60, raise), 46, slam) - 10 * hold * (1 - back),
      lift: 2.5 * raise * (1 - slam), lunge: -1 * raise * (1 - slam) + 6 * slam * (1 - 0.5 * back), tilt: -0.12 * raise * (1 - slam) + 0.28 * slam * (1 - hold * 0.4) * (1 - back), trail: slam > 0 && p < 0.7,
      rig: (r) => {
        r.squat = q(3.4 * hold * (1 - back) + 2 * slam * (1 - hold));
        danceLegs(r, [raise * (1 - slam), [1.8, -1, 2], [-2, -0.8, -4]], [slam * (1 - back), [5.4, 0, 10], [-5.4, 0, -16]]);
        r.backArm = [q(lerp(lerp(0, -3, raise), -5, slam) + 5 * back), q(lerp(lerp(-1, -8, raise), 1, slam) - 1 * back)];
        r.hairLift = raise > 0.4 && slam < 0.5 ? -1 : hold > 0.3 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.2, 0.86));
        if (raise > 0.5 && slam < 0.3) r.mouth = 'grit';
        if (slam > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Drag sweep (finisher, at ~0.34 and ~0.72): a slow full turn with the blade out flat dragging
  // everything in on the field lines, then a heavy flat sweep that throws them.
  bwsweep(p) {
    const u = ease(seg(p, 0.06, 0.6));
    const throwIt = ease(seg(p, 0.62, 0.74));
    const back = soft(seg(p, 0.84, 1));
    const turn = Math.cos(u * Math.PI * 2);
    const spinning = u > 0 && u < 1;
    return {
      weapon: (u <= 0 ? lerp(-58, 96, soft(seg(p, 0, 0.06))) : 96 + 360 * u) + 40 * throwIt - 60 * back, arm: 56 - 6 * back,
      lunge: 1 + 4 * throwIt * (1 - back), orbit: spinning, turn: spinning ? Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)) : 1, tilt: 0.06 + 0.1 * throwIt * (1 - back), trail: spinning || (throwIt > 0 && throwIt < 1),
      rig: (r) => {
        r.squat = q(1.8 * Math.sin(Math.PI * u) + 2 * throwIt * (1 - back));
        danceLegs(r, [(Math.sin(Math.PI * u) + throwIt) * (1 - back), [4.4, 0, 6], [-4.6, 0, -12]]);
        r.backArm = [q(-5 * (1 - back)), q(-2 * (1 - back))];
        r.cape = Math.round(-4 * bump(p, 0.06, 0.84));
        if (spinning) r.mouth = 'grit';
        else if (throwIt > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Up + attack: a low crouch and a heavy uppercut, the spout bursting up under them.
  bwupper(p) {
    const crouch = soft(seg(p, 0, 0.3));
    const up = ease(seg(p, 0.34, 0.52));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(-58, 156, crouch), -30, up) - 24 * back, arm: lerp(lerp(54, 30, crouch), 60, up) - 6 * back,
      lift: 5 * bump(p, 0.34, 0.86), tilt: 0.1 * crouch * (1 - up) - 0.14 * up * (1 - back), trail: up > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(3 * crouch * (1 - up));
        danceLegs(r, [crouch * (1 - up), [3.6, 0, 6], [-3.6, 0, -12]], [up * (1 - back), [2.4, -2, 10], [-2, -1.6, -14]]);
        r.backArm = [q(lerp(0, -5, up)), q(lerp(1, -5, up))];
        r.hairLift = up > 0.3 && back < 0.5 ? -1 : 0;
        if (up > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // In the air: a heavy cut, then a crash down like thunder.
  bwaircut(p) {
    const cut = ease(seg(p, 0.2, 0.56));
    const back = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(-58, -104, ease(seg(p, 0, 0.2))), 140, cut) - 30 * back, arm: lerp(50, 56, cut) - 8 * back, tilt: 0.14 * cut * (1 - back), trail: cut > 0 && cut < 1,
      rig: (r) => {
        tuck(r);
        r.backArm = [q(-3 * cut), q(-2 * cut)];
        r.hairLift = -1;
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  bwairslam(p) {
    const raise = ease(seg(p, 0, 0.3));
    const down = ease(seg(p, 0.3, 0.5));
    return {
      weapon: lerp(lerp(-58, -120, raise), 170, down), arm: lerp(lerp(52, 58, raise), 46, down), tilt: -0.1 * raise * (1 - down) + 0.24 * down, lift: 2 * raise * (1 - down),
      rig: (r) => {
        r.air = true;
        r.frontLeg = [q(lerp(2.6, 1.6, down)), q(lerp(-5, -1.4, down)), 10];
        r.backLeg = [q(-1.6), q(lerp(-2.6, -1, down)), -10];
        r.backArm = [q(-2 + 5 * down), q(-6 + 6 * down)];
        r.hairLift = -1;
        r.cape = -4;
        if (down > 0.4) r.mouth = 'grit';
      },
    };
  },
  // Rolling Thunder (out of a run): he lowers his free shoulder behind locked plates of static and
  // charges, heavy, then plants and heaves them off.
  bwcharge(p) {
    const lower = soft(seg(p, 0, 0.2));
    const heave = ease(seg(p, 0.44, 0.56));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(-58, -84, lower) + 30 * heave * (1 - back), arm: lerp(54, 44, lower) + 6 * heave,
      lunge: 6 * lower * (1 - heave) + 8 * heave * (1 - back), tilt: 0.26 * lower * (1 - heave * 0.4) * (1 - back),
      rig: (r) => {
        r.squat = q(1.8 * lower * (1 - back));
        danceLegs(r, [lower * (1 - heave), [4.6, -1, 10], [-5, -1.6, -30]], [heave * (1 - back), [5.4, 0, 8], [-5.4, 0, -20]]);
        r.backArm = [q(lerp(0, 7, lower) * (1 - back)), q(lerp(-1, -3, lower) * (1 - back))];
        r.tx = q(1.6 * lower * (1 - back));
        if (lower > 0.4 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Down + attack: the blade raised point-down in both hands and driven into the floor; the quake
  // rolls out.
  bwquake(p) {
    const raise = soft(seg(p, 0, 0.42));
    const drive = easeIn(seg(p, 0.5, 0.6));
    const hold = soft(seg(p, 0.6, 0.76));
    const back = soft(seg(p, 0.86, 1));
    return {
      weapon: lerp(lerp(-58, 176, soft(seg(p, 0, 0.2))), 178, drive) - 40 * back, arm: lerp(lerp(54, 60, raise), 30, drive) + 14 * back,
      lift: 2 * raise * (1 - drive), tilt: 0.06 * drive * (1 - back),
      rig: (r) => {
        r.squat = q(3.2 * hold * (1 - back) + 2 * drive * (1 - hold));
        danceLegs(r, [Math.max(raise, drive) * (1 - back), [4, 0, 6], [-4.4, 0, -10]]);
        r.backArm = [q(lerp(0, 4, raise) * (1 - back)), q(lerp(-1, -6, raise) * (1 - drive) * (1 - back))];
        if (drive > 0.5 && back < 0.5) r.mouth = 'open';
      },
    };
  },

  // His skills.
  // Lightning Cage: he drives the blade point-down into the floor and throws his free arm up; the
  // cage snaps up and he holds the pose, braced, as they're dragged in.
  bwcagecast(p) {
    const drive = easeIn(seg(p, 0.1, 0.4));
    const arm = soft(seg(p, 0.36, 0.5));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(lerp(-58, -90, soft(seg(p, 0, 0.1))), 178, drive) - 40 * back, arm: lerp(54, 32, drive) + 14 * back,
      lunge: 3 * drive * (1 - back), tilt: 0.08 * drive * (1 - back),
      rig: (r) => {
        r.squat = q(2.6 * drive * (1 - back));
        danceLegs(r, [drive * (1 - back), [4.4, 0, 8], [-4.6, 0, -12]]);
        r.backArm = [q(lerp(0, -5, arm) * (1 - back)), q(lerp(-1, -11, arm) * (1 - back))];
        r.hairLift = arm > 0.5 && back < 0.5 ? -1 : 0;
        if (arm > 0.4 && back < 0.5) r.mouth = 'open';
      },
    };
  },
  // Storm Wall: he plants wide and sweeps the blade across in front of him, low to high, and holds it
  // up like a gate as the wall bursts up.
  bwbarrier(p) {
    const set = soft(seg(p, 0, 0.26));
    const sweep = ease(seg(p, 0.3, 0.52));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(lerp(-58, 150, set), 70, sweep) - 10 * back, arm: lerp(lerp(54, 34, set), 60, sweep) - 12 * back,
      lunge: 3 * sweep * (1 - back), tilt: 0.08 * set * (1 - sweep) - 0.04 * sweep * (1 - back),
      rig: (r) => {
        r.squat = q(2.4 * Math.max(set, sweep) * (1 - back));
        danceLegs(r, [Math.max(set, sweep) * (1 - back), [5, 0, 8], [-5, 0, -12]]);
        r.backArm = [q(lerp(0, -5, sweep) * (1 - back)), q(lerp(-1, -3, sweep) * (1 - back))];
        r.cape = Math.round(-4 * bump(p, 0.3, 0.82));
        if (sweep > 0.4 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Magnetize: he points the blade out, plants, and hauls it back two-handed like a rope, leaning back
  // against the weight of them.
  bwmagnet(p) {
    const point = ease(seg(p, 0, 0.3));
    const haul = ease(seg(p, 0.42, 0.66));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(lerp(-58, 90, point), 158, haul) - 50 * back, arm: lerp(lerp(54, 60, point), 36, haul) + 10 * back,
      lunge: 5 * point * (1 - haul) - 4 * haul * (1 - back), tilt: 0.12 * point * (1 - haul) - 0.14 * haul * (1 - back),
      rig: (r) => {
        r.squat = q(2.4 * haul * (1 - back));
        danceLegs(r, [point * (1 - haul), [5, 0, 8], [-4.4, 0, -14]], [haul * (1 - back), [3, 0, 2], [-5.4, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, 5, point), -5, haul) * (1 - back)), q(lerp(-1, -2, point) * (1 - back))];
        if (haul > 0.3 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Overcast: he raises the blade straight up to the sky in both hands (behind his head), and holds
  // it there as the cloud spreads.
  bwovercast(p) {
    const up = ease(seg(p, 0, 0.42));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(-58, 4, up) - 62 * back, arm: lerp(54, 60, up) - 6 * back, lift: 1.5 * up * (1 - back), tilt: -0.06 * up * (1 - back),
      rig: (r) => {
        danceLegs(r, [up * (1 - back), [3.2, 0, 4], [-3.4, 0, -8]]);
        r.backArm = [q(lerp(0, -5, up) * (1 - back)), q(lerp(-1, -10, up) * (1 - back))];
        r.hairLift = up > 0.5 && back < 0.5 ? -1 : 0;
        if (up > 0.6 && back < 0.5) r.eyes = 'half';
      },
    };
  },
  // Fortress (finisher): he raises the blade to the sky as the storm gathers, drives it point-down
  // into the floor as the cage locks, and stands braced on it, both hands on the hilt, as the bolts
  // fall; then wrenches it out in a last heavy sweep.
  bwfortress(p) {
    const up = ease(seg(p, 0, 0.3));
    const drive = easeIn(seg(p, 0.34, 0.42));
    const brace = soft(seg(p, 0.42, 0.52));
    const sweep = ease(seg(p, 0.82, 0.9));
    const back = soft(seg(p, 0.92, 1));
    return {
      weapon: lerp(lerp(lerp(-58, 4, up), 178, drive), 110 + 360, sweep) - 40 * back, arm: lerp(lerp(lerp(54, 60, up), 30, drive), 56, sweep) + 6 * back,
      lift: 2 * up * (1 - drive), lunge: 3 * drive * (1 - sweep) + 5 * sweep * (1 - back), tilt: -0.08 * up * (1 - drive) + 0.06 * brace * (1 - sweep) + 0.14 * sweep * (1 - back),
      trail: sweep > 0 && sweep < 1,
      rig: (r) => {
        r.squat = q(3 * brace * (1 - sweep) + 2 * sweep * (1 - back));
        danceLegs(r, [Math.max(up * (1 - drive), brace) * (1 - back), [4.6, 0, 8], [-4.8, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -5, up), 4, brace) * (1 - sweep)), q(lerp(lerp(-1, -10, up), 0, brace) * (1 - sweep))];
        r.hairLift = up > 0.5 && drive < 0.5 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.1, 0.92));
        if (brace > 0.5 && sweep < 0.2) r.mouth = 'grit';
        else if (sweep > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Rain Cleave (Storm Cleave): the long slow haul back of a storm, the rain coming down, and one
  // enormous cleave.
  bwraincleave(p) {
    const haul = soft(seg(p, 0, 0.46));
    const cleave = ease(seg(p, 0.5, 0.62));
    const back = soft(seg(p, 0.84, 1));
    const thrum = Math.sin(p * 70) * 2.4 * bump(p, 0.3, 0.52);
    return {
      weapon: lerp(lerp(-58, -142, haul) + thrum, 150, cleave) - 30 * back, arm: lerp(lerp(54, 58, haul), 50, cleave) - 10 * back,
      lunge: -2 * haul * (1 - cleave) + 7 * cleave * (1 - 0.6 * back), tilt: -0.12 * haul * (1 - cleave) + 0.22 * cleave * (1 - back), trail: cleave > 0 && p < 0.78,
      rig: (r) => {
        r.squat = q(2.8 * haul * (1 - cleave) + 2.4 * cleave * (1 - back));
        danceLegs(r, [haul * (1 - cleave), [3.4, 0, 4], [-4.6, 0, -12]], [cleave * (1 - back), [5.4, 0, 10], [-5.2, 0, -16]]);
        r.backArm = [q(lerp(lerp(0, -3, haul), 4, cleave) - 4 * back), q(lerp(lerp(-1, -6, haul), 1, cleave) - 1 * back)];
        r.cape = Math.round(-5 * bump(p, 0.2, 0.86));
        if (haul > 0.5 && cleave < 0.2) r.mouth = 'grit';
        else if (cleave > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Squall (Cyclone Edge): two slow heavy turns, planted, the blade out flat, the squall round him.
  bwsquall(p) {
    const cock = soft(seg(p, 0, 0.12));
    const u = seg(p, 0.12, 0.82);
    const spun = soft(u) * 2;
    const down = easeIn(seg(p, 0.84, 0.9));
    const back = soft(seg(p, 0.92, 1));
    const turn = Math.cos(spun * Math.PI * 2);
    const spinning = u > 0 && u < 1;
    return {
      weapon: (u <= 0 ? lerp(-58, 96, cock) : 96 + 360 * spun) + (u >= 1 ? lerp(0, 70, down) - 40 * back : 0), arm: spinning ? 56 : 52 + 4 * back,
      lunge: 1 + 3 * down * (1 - back), orbit: spinning, turn: spinning ? Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)) : 1,
      tilt: 0.06 + 0.12 * down * (1 - back), trail: spinning || (down > 0 && down < 1),
      rig: (r) => {
        r.squat = q(1.8 * Math.sin(Math.PI * u) + 2.6 * down * (1 - back));
        danceLegs(r, [Math.max(Math.sin(Math.PI * u), down) * (1 - back), [4.6, 0, 6], [-4.6, 0, -12]]);
        r.backArm = [q(-5 * (1 - back)), q(-2 * (1 - back))];
        r.cape = Math.round(-5 * bump(p, 0.12, 0.92));
        if (spinning) r.mouth = 'grit';
        else if (down > 0.5 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Thunderhead (Thunderclap): he sets the blade on his shoulder, lifts his free fist and brings it
  // down onto his own chest with a shout, then stamps; the thunder booms out.
  bwclapmv(p) {
    const fist = soft(seg(p, 0.06, 0.34));
    const beat = easeIn(seg(p, 0.36, 0.46));
    const stamp = easeIn(seg(p, 0.5, 0.58));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: -58 - 8 * beat, arm: 54, lift: 1.5 * fist * (1 - stamp), tilt: -0.06 * fist * (1 - beat) + 0.08 * stamp * (1 - back),
      rig: (r) => {
        r.squat = q(2.8 * stamp * (1 - back));
        if (fist > 0.2 && stamp < 1) {
          r.frontLeg = [q(lerp(0.8, 2.4, fist)), q(-4 * fist * (1 - stamp)), Math.round((24 * fist * (1 - stamp)) / 2) * 2];
          r.backLeg = [q(-2.6), 0, -6];
        } else danceLegs(r, [stamp * (1 - back), [4.4, 0, 6], [-4.2, 0, -10]]);
        r.backArm = [q(lerp(lerp(0, -6, fist), 4, beat) * (1 - back)), q(lerp(lerp(-1, -8, fist), -4, beat) * (1 - back))];
        r.hairLift = stamp > 0.5 && back < 0.5 ? 1 : 0;
        if (beat > 0.3 && back < 0.6) r.mouth = 'open';
      },
    };
  },
  // Iron Cloud (Static Guard): the blade set point-down before him like a pillar, both hands on it,
  // head bowed, then he lifts his eyes as the shell locks round him.
  bwguard(p) {
    const set = ease(seg(p, 0, 0.34));
    const lift = soft(seg(p, 0.5, 0.66));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(-58, 178, set) - 44 * back, arm: lerp(54, 36, set) + 8 * back,
      lunge: 2 * set * (1 - back), tilt: 0.1 * set * (1 - lift * 0.6) * (1 - back),
      rig: (r) => {
        r.squat = q(2.6 * set * (1 - back));
        danceLegs(r, [set * (1 - back), [4.8, 0, 8], [-4.8, 0, -12]]);
        r.backArm = [q(lerp(0, 5, set) * (1 - back)), q(lerp(-1, -1, set) * (1 - back))];
        if (set > 0.5 && lift < 0.3) r.eyes = 'half';
        else if (lift > 0.5 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Downpour (Thunderfall): a heavy leap up into the storm (not high; he's a mountain), a hang with
  // the blade up behind his head as the rain begins, and a crash down that shakes everything.
  bwfall(p) {
    const crouch = soft(seg(p, 0, 0.12));
    const up = ease(seg(p, 0.12, 0.34));
    const hang = seg(p, 0.34, 0.56);
    const fall = easeIn(seg(p, 0.56, 0.62));
    const land = soft(seg(p, 0.62, 0.76));
    const rise = soft(seg(p, 0.88, 1));
    return {
      weapon: lerp(lerp(-58, -126, up) + 3 * Math.sin(p * 70) * hang, 174, fall) - 34 * rise, arm: lerp(lerp(54, 58, up), 46, fall) - 12 * land * (1 - rise),
      lift: 42 * up * (1 - fall) + 2 * Math.sin(hang * Math.PI * 2) * (1 - fall), lunge: 2 * up + 6 * fall * (1 - 0.5 * rise),
      tilt: -0.12 * up * (1 - fall) + 0.28 * fall * (1 - land * 0.6) * (1 - rise), trail: fall > 0 && p < 0.72,
      rig: (r) => {
        if (up > 0.2 && fall < 0.95) {
          r.air = true;
          r.frontLeg = [q(lerp(2.6, 3.4, fall)), q(lerp(-4.4, -2, fall)), 10];
          r.backLeg = [q(-1.8), q(-2.6), -14];
        } else {
          r.squat = q(2.6 * crouch * (1 - up) + 3.4 * land * (1 - rise));
          danceLegs(r, [crouch * (1 - up), [3.4, 0, 6], [-3.4, 0, -10]], [land * (1 - rise), [5, 0, 10], [-5.2, 0, -14]]);
        }
        r.backArm = [q(lerp(lerp(0, -4, up), 3, land) * (1 - rise)), q(lerp(lerp(-1, -9, up), 2, land) * (1 - rise))];
        r.hairLift = up > 0.2 && fall < 1 ? -1 : land > 0.3 && rise < 0.3 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.12, 0.88));
        if (hang > 0.2 && fall < 0.3) r.mouth = 'grit';
        if (fall > 0.5 && rise < 0.5) r.mouth = 'open';
      },
    };
  },

  // ---------- Skills that used to borrow a generic pose or a combo move, given moves of their own ----------

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

  // ---------- The Moon Moth (docs/design/moon-moth.md) ----------
  // A night thief with a dagger in each hand: light, quick and low, on the balls of her feet, the
  // daggers held as equipped (the off hand's follows that forearm, render/hero.js). Her cuts are
  // flicks and spins that stay under her face; her big moves open her arms wide like wings. Blade
  // angles: 110 her guard (point forward and a little down), 90 level ahead, 0 straight up, 180
  // point-down. Arm: 40 her guard, 90 level ahead; past 135 it passes behind her head.

  // Flick (opener, cuts at ~0.45): the dagger drawn back low by her hip as she turns her shoulder
  // away, then whipped forward and up across her body at chest height, her free hand flung back;
  // a skip forward on the balls of her feet, and back to guard.
  mmflick(p) {
    const cock = soft(seg(p, 0, 0.3));
    const flick = ease(seg(p, 0.32, 0.48));
    const over = bump(p, 0.44, 0.66);
    const back = soft(seg(p, 0.62, 1));
    return {
      weapon: lerp(lerp(110, 208, cock), 72, flick) - 12 * over + 38 * back, arm: lerp(lerp(40, 6, cock), 92, flick) + 6 * over - 52 * back,
      lunge: -2 * cock * (1 - flick) + 5 * flick * (1 - back), tilt: -0.09 * cock * (1 - flick) + 0.12 * flick * (1 - back) + 0.03 * over, trail: flick > 0 && p < 0.62,
      rig: (r) => {
        r.squat = q(1.2 * cock * (1 - flick));
        danceLegs(r, [cock * (1 - flick), [2.2, -0.6, 6], [-3, 0, -10]], [flick * (1 - back), [4, 0, 6], [-3.6, -1, -16]]);
        r.backArm = [q(lerp(lerp(0, 2.5, cock), -4.5, flick) * (1 - back)), q(lerp(lerp(0, -1, cock), -3, flick) * (1 - back))];
        r.tx = q(lerp(-0.8 * cock, 1.6, flick) * (1 - back));
        r.hairLift = flick > 0.2 && back < 0.4 ? -1 : 0;
        r.cape = Math.round(-3 * bump(p, 0.3, 0.75));
        if (flick > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },

  // Twin stabs (opener, at ~0.3 and ~0.64): the front dagger driven straight out, pulled back as
  // the off hand's drives out past it, her shoulders turning with each, a quick two-step in.
  mmtwin(p) {
    const s1 = ease(seg(p, 0.12, 0.3));
    const r1 = soft(seg(p, 0.34, 0.5));
    const s2 = ease(seg(p, 0.46, 0.64));
    const back = soft(seg(p, 0.72, 1));
    const out1 = s1 * (1 - r1);
    const out2 = s2 * (1 - back);
    return {
      weapon: 110 - 20 * s1 * (1 - back), arm: lerp(40, 88, out1) - 8 * out2,
      lunge: 4 * out1 + 5 * out2 - 1 * bump(p, 0, 0.12), tilt: 0.1 * out1 + 0.12 * out2,
      rig: (r) => {
        danceLegs(r, [out1, [3.6, 0, 4], [-3, 0, -10]], [out2, [4.4, 0, 6], [-3.6, -1, -16]]);
        r.backArm = [q(lerp(1.5 * out1 * -1, 7.5, out2)), q(-1 - 0.5 * out2)];
        r.tx = q(1.2 * out1 + 1.8 * out2);
        r.cape = Math.round(-2 * bump(p, 0.12, 0.4) - 3 * bump(p, 0.46, 0.8));
        if (out1 > 0.4 || out2 > 0.4) strikeFace(r);
      },
    };
  },

  // Pirouette (second, cuts at ~0.34 and ~0.66): up onto her toes, both arms flung out level with
  // the daggers point-out, and one full turn cutting all round her, hair and cape flying; she comes
  // out of it low, back on guard.
  mmspin(p) {
    const rise = soft(seg(p, 0, 0.18));
    const u = soft(seg(p, 0.18, 0.78));
    const down = soft(seg(p, 0.78, 1));
    const turn = Math.cos(u * Math.PI * 2);
    const open = rise * (1 - down);
    return {
      weapon: lerp(110, 96, open) + 360 * u, arm: lerp(40, 84, open), lift: 3 * Math.sin(Math.PI * u) + 1.2 * rise * (1 - u),
      lunge: 4 * u * (1 - 0.5 * down), orbit: u > 0 && u < 1, turn: Math.sign(turn || 1) * Math.max(0.4, Math.abs(turn)),
      tilt: 0.04 * open, trail: u > 0.05 && u < 0.95,
      rig: (r) => {
        danceLegs(r, [open, [1.2, -1.6, 10], [-0.8, -2, -12]], [down * (1 - seg(p, 0.92, 1)), [3.2, 0, 6], [-3.4, 0, -12]]);
        r.backArm = [q(-5.5 * open), q(-3.5 * open)];
        r.squat = q(1.2 * down * (1 - seg(p, 0.9, 1)));
        r.hairLift = u > 0.1 && u < 0.9 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.18, 0.85));
        if (u > 0.15 && down < 0.5) strikeFace(r);
      },
    };
  },

  // Rising hook (second, at ~0.46): she dips low with the dagger hanging back past her knee, then
  // rips it up through them in a rising cut that pops her off her toes, the free hand sweeping up
  // after it, and drops back onto guard.
  mmhook(p) {
    const dip = soft(seg(p, 0, 0.3));
    const rip = ease(seg(p, 0.32, 0.5));
    const back = soft(seg(p, 0.66, 1));
    return {
      weapon: lerp(lerp(110, 200, dip), 12, rip) + 98 * back, arm: lerp(lerp(40, 14, dip), 112, rip) - 72 * back,
      lift: 4 * bump(p, 0.36, 0.78), lunge: 1.5 * dip * (1 - rip) + 4 * rip * (1 - back), tilt: 0.1 * dip * (1 - rip) - 0.08 * rip * (1 - back), trail: rip > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(2.4 * dip * (1 - rip));
        danceLegs(r, [dip * (1 - rip), [3.6, 0, 6], [-3.6, 0, -12]], [rip * (1 - back), [2.2, -2, 10], [-2, -2.4, -18]]);
        r.backArm = [q(lerp(lerp(0, 2, dip), -3, rip) * (1 - back)), q(lerp(lerp(0, 1, dip), -6, rip) * (1 - back))];
        r.tx = q(lerp(0.6 * dip, 1.4, rip) * (1 - back));
        r.hairLift = rip > 0.3 && back < 0.4 ? -1 : 0;
        r.cape = Math.round(-3 * bump(p, 0.3, 0.8));
        if (rip > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },

  // Wings (finisher, cuts at ~0.56): both daggers crossed in front of her chest, shoulders hunched,
  // eyes down while the moths gather; then she throws both arms wide like wings opening, the front
  // dagger sweeping out and down in one great cut, rising up on her toes; she lands in a wide stance
  // with her arms still open, breathes, and folds back to guard.
  mmwings(p) {
    const fold = soft(seg(p, 0, 0.3));
    const hold = seg(p, 0.3, 0.46);
    const open = ease(seg(p, 0.46, 0.6));
    const keep = 1 - soft(seg(p, 0.74, 1));
    const shiver = Math.sin(hold * Math.PI * 6) * bump(p, 0.3, 0.46);
    return {
      weapon: lerp(lerp(110, 62, fold) + 2 * shiver, 176, open) + (110 - 176) * (1 - keep), arm: lerp(lerp(40, 48, fold), 104, open) + (40 - 104) * (1 - keep),
      lift: 1.5 * fold * (1 - open) + 3 * bump(p, 0.48, 0.74), lunge: -1.5 * fold * (1 - open) + 5 * open * keep,
      tilt: 0.06 * fold * (1 - open) - 0.06 * open * keep, trail: open > 0 && p < 0.7,
      rig: (r) => {
        r.squat = q(1.4 * fold * (1 - open) + 1.6 * bump(p, 0.62, 0.9));
        danceLegs(r, [fold * (1 - open), [1.6, 0, 4], [-1.6, 0, -4]], [open * keep, [4.2, 0, 8], [-4.4, 0, -10]]);
        r.backArm = [q(lerp(lerp(0, 5, fold), -7, open) * (open > 0 ? keep : 1)), q(lerp(lerp(0, -3, fold), -6, open) * (open > 0 ? keep : 1))];
        r.tx = q(lerp(0.4 * fold, 1, open) * keep);
        if (hold > 0 && open < 0.2) r.eyes = 'half';
        r.hairLift = open > 0.2 && keep > 0.6 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.44, 0.9));
        if (open > 0.2 && keep > 0.5) strikeFace(r);
      },
    };
  },

  // Swoop (finisher, cuts at ~0.62): a little flutter up off both feet with the daggers raised out
  // to her sides like wings, a beat hanging there, then she drops forward into a diving cross-cut,
  // both blades coming down together, and lands low on one knee before rising.
  mmswoop(p) {
    const up = soft(seg(p, 0, 0.32));
    const hang = seg(p, 0.32, 0.48);
    const dive = easeIn(seg(p, 0.48, 0.62));
    const land = soft(seg(p, 0.62, 0.76));
    const rise = soft(seg(p, 0.8, 1));
    const bob = Math.sin(hang * Math.PI * 2) * bump(p, 0.32, 0.48);
    return {
      weapon: lerp(lerp(110, 8, up) + 3 * bob, 172, dive) - 62 * rise, arm: lerp(lerp(40, 112, up), 50, dive) - 10 * rise,
      lift: 10 * up * (1 - dive) + 1.2 * bob, lunge: -1 * up * (1 - dive) + 6 * dive * (1 - 0.5 * rise),
      tilt: -0.08 * up * (1 - dive) + 0.22 * dive * (1 - land * 0.5) * (1 - rise), trail: dive > 0 && p < 0.72,
      rig: (r) => {
        danceLegs(r, [up * (1 - land), [2.6, -5, 10], [-1.6, -2.6, -10]], [land * (1 - rise), [4.6, 0, 8], [-4.6, 1, -20]]);
        r.air = up > 0.5 && land < 0.5;
        r.squat = q(2.6 * land * (1 - rise));
        r.backArm = [q(lerp(lerp(0, -5, up), 4, dive) * (1 - rise)), q(lerp(lerp(0, -7, up), 0, dive) * (1 - rise))];
        r.tx = q(1.4 * dive * (1 - rise));
        r.hairLift = up > 0.3 && dive < 0.5 ? 1 : dive > 0.2 && rise < 0.5 ? -1 : 0;
        r.cape = Math.round(3 * up * (1 - dive) - 4 * bump(p, 0.5, 0.86));
        if (dive > 0.2 && rise < 0.5) strikeFace(r);
      },
    };
  },

  // Rising double cut (up + attack, at ~0.3 and ~0.6): the front dagger rips up through them, then
  // the off hand's follows it a beat later, higher, as she springs up after them.
  mmrise(p) {
    const dip = soft(seg(p, 0, 0.16));
    const c1 = ease(seg(p, 0.16, 0.3));
    const c2 = ease(seg(p, 0.44, 0.6));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(110, 190, dip), 10, c1) + 30 * c2 * (1 - back) + 100 * back, arm: lerp(lerp(40, 16, dip), 108, c1) - 20 * c2 * (1 - back) - 68 * back,
      lift: 3 * c1 * (1 - back) + 3 * c2 * (1 - back), lunge: 2 * c1 * (1 - back), tilt: 0.08 * dip * (1 - c1) - 0.1 * Math.max(c1, c2) * (1 - back), trail: c1 > 0 && p < 0.66,
      rig: (r) => {
        r.squat = q(2 * dip * (1 - c1));
        danceLegs(r, [dip * (1 - c1), [3.4, 0, 6], [-3.4, 0, -10]], [c1 * (1 - back), [2.6, -5, 10], [-1.6, -2.6, -10]]);
        r.air = c1 > 0.5 && back < 0.5;
        r.backArm = [q(lerp(lerp(0, 2, dip), 3, c2) * (1 - back)), q(lerp(-1 * dip, -9, c2) * (1 - back))];
        r.hairLift = c1 > 0.3 && back < 0.6 ? -1 : 0;
        r.cape = Math.round(3 * bump(p, 0.2, 0.8));
        if ((c1 > 0.3 || c2 > 0.3) && back < 0.5) strikeFace(r);
      },
    };
  },

  // Air cut (in the air, at ~0.45): knees tucked, a flutter of her free arm like a wing beat, and the
  // dagger flicked round across the front of her, hanging her there a moment.
  mmaircut(p) {
    const cock = soft(seg(p, 0, 0.3));
    const cut = ease(seg(p, 0.32, 0.5));
    const back = soft(seg(p, 0.66, 1));
    const flap = Math.sin(p * Math.PI * 4) * (1 - back);
    return {
      weapon: lerp(lerp(110, -10, cock), 168, cut) - 58 * back, arm: lerp(lerp(40, 100, cock), 48, cut) - 8 * back,
      lift: 1.5 * flap, tilt: -0.08 * cock * (1 - cut) + 0.14 * cut * (1 - back), trail: cut > 0 && p < 0.66,
      rig: (r) => {
        tuck(r);
        r.backArm = [q(-3 - 1.5 * flap), q(-4 - 2 * flap)];
        r.hairLift = -1;
        r.cape = Math.round(2 * flap);
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },

  // Moth Step (and her dash out of a run; cuts at ~0.62): she drops low and leans in, and between
  // ~0.12 and ~0.5 she is a cloud of moths (the step's `moths`, hidden while the cloud flies); she
  // re-forms already mid-cut, both daggers sweeping out from her chest, and skids to a stop.
  mmstep(p) {
    const lean = soft(seg(p, 0, 0.12));
    const cut = ease(seg(p, 0.5, 0.64));
    const skid = soft(seg(p, 0.64, 0.82));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(lerp(110, 150, lean), 40, seg(p, 0.12, 0.5)) * (1 - cut) + 168 * cut - 58 * back * cut, arm: lerp(lerp(40, 24, lean), 70, seg(p, 0.12, 0.5)) * (1 - cut) + 80 * cut - 40 * back * cut,
      lunge: 3 * lean * (1 - cut) + 4 * cut * (1 - back), tilt: 0.18 * lean * (1 - cut) + 0.12 * cut * (1 - skid) - 0.06 * skid * (1 - back), trail: cut > 0 && p < 0.74,
      rig: (r) => {
        r.squat = q(2 * lean * (1 - cut) + 1.6 * skid * (1 - back));
        danceLegs(r, [lean * (1 - cut), [4, 0, 8], [-4.4, 0, -18]], [skid * (1 - back), [4.6, 0, 6], [-3.8, 0, -8]]);
        r.backArm = [q(lerp(lerp(0, -2, lean), -6, cut) * (1 - back)), q(lerp(0, -3, cut) * (1 - back))];
        r.tx = q(1.6 * lean * (1 - back));
        r.hairLift = cut > 0.2 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.5, 0.9));
        if (cut > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },

  // Wing Flurry (cuts at ~0.14, 0.25, 0.36, 0.47, 0.58, then a big one at ~0.76): the two daggers
  // take turns in a blur, the front one cutting down as the off hand's cuts up, her shoulders
  // rocking with each and her feet shuffling in; then she gathers both to one side and throws the
  // last cut wide.
  mmflurry(p) {
    const into = soft(seg(p, 0, 0.08));
    const blur = seg(p, 0.08, 0.6);
    const beat = Math.sin(blur * Math.PI * 5 - Math.PI / 2);
    const fl = Math.min(1, blur * 8, (1 - blur) * 8);
    const wind = soft(seg(p, 0.6, 0.7));
    const fin = ease(seg(p, 0.7, 0.78));
    const back = soft(seg(p, 0.84, 1));
    const flurW = 78 + 82 * beat;
    const flurA = 70 - 22 * beat;
    return {
      weapon: (lerp(110, flurW, into) * (1 - wind) + 20 * wind) * (1 - fin) + 176 * fin - 66 * back * fin,
      arm: (lerp(40, flurA, into) * (1 - wind) + 112 * wind) * (1 - fin) + 56 * fin - 16 * back * fin,
      lunge: 2.5 * into * (1 - fin) + 0.8 * beat * fl + 5 * fin * (1 - back), tilt: 0.05 * beat * fl - 0.08 * wind * (1 - fin) + 0.16 * fin * (1 - back), trail: p > 0.1 && p < 0.86,
      rig: (r) => {
        danceLegs(r, [into * (1 - wind), [3.4, 0, 6], [-3.2, 0, -12]], [fin * (1 - back), [4.6, 0, 8], [-4, -1, -16]]);
        r.backArm = [q((2 - 5 * beat) * fl * (1 - wind) + -5 * fin * (1 - back)), q((-2 + 2 * beat) * fl * (1 - wind) - 4 * fin * (1 - back))];
        r.tx = q(1.2 * into * (1 - back) + 0.5 * beat * fl);
        r.hairLift = fin > 0.2 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-2 * fl * Math.abs(beat) - 4 * bump(p, 0.7, 0.95));
        if (fl > 0.5 || (fin > 0.2 && back < 0.5)) strikeFace(r);
      },
    };
  },

  // Moth Swarm (released at ~0.48): she draws both daggers in to her chest and leans back, eyes
  // half shut, gathering them; then flings both hands out ahead, wrists together, and the swarm
  // pours out of them; she holds it a beat, then settles back.
  mmswarm(p) {
    const draw = soft(seg(p, 0, 0.34));
    const fling = ease(seg(p, 0.38, 0.5));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(110, 20, draw), 92, fling) + 18 * back, arm: lerp(lerp(40, 30, draw), 94, fling) - 54 * back,
      lunge: -2 * draw * (1 - fling) + 5 * fling * (1 - back), tilt: -0.1 * draw * (1 - fling) + 0.12 * fling * (1 - back),
      rig: (r) => {
        danceLegs(r, [draw * (1 - fling), [1.6, 0, 2], [-2.6, 0, -6]], [fling * (1 - back), [4.4, 0, 6], [-3.6, 0, -14]]);
        r.backArm = [q(lerp(lerp(0, 4, draw), 8, fling) * (1 - back)), q(lerp(lerp(0, -4, draw), -2, fling) * (1 - back))];
        r.tx = q(lerp(-0.6 * draw, 1.6, fling) * (1 - back));
        if (draw > 0.5 && fling < 0.3) r.eyes = 'half';
        r.hairLift = fling > 0.2 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-3 * bump(p, 0.38, 0.85));
        if (fling > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },

  // Midnight Swarm (her finisher; the moon rises at ~0.2, the swarm pours down at ~0.62): she springs
  // up off the floor with the daggers crossing in front of her chest, hangs there floating, eyes
  // closed, while the moon rises behind her and the moths gather; then she throws her arms wide and
  // high, head back, and holds it while the swarm pours down; she floats down and lands soft.
  mmmidnight(p) {
    const up = ease(seg(p, 0.04, 0.24));
    const float = Math.sin(seg(p, 0.24, 0.56) * Math.PI * 2) * bump(p, 0.24, 0.56);
    const open = ease(seg(p, 0.54, 0.64));
    const down = soft(seg(p, 0.82, 0.94));
    const rise = soft(seg(p, 0.94, 1));
    const hold = open * (1 - down);
    return {
      weapon: lerp(lerp(110, 62, up), 70, open) + (110 - 70) * down, arm: lerp(lerp(40, 48, up), 128, open) + (40 - 128) * down,
      lift: 18 * up * (1 - down) + 1.5 * float + 2 * hold, lunge: 0, tilt: -0.16 * hold + 0.02 * float * (1 - open),
      rig: (r) => {
        danceLegs(r, [up * (1 - down), [1, -2.6, 14], [-1.2, -1.4, -6]]);
        r.air = up > 0.5 && down < 0.5;
        r.squat = q(1.6 * bump(p, 0.9, 1));
        r.backArm = [q(lerp(lerp(0, 5, up), -7, open) * (1 - down)), q(lerp(lerp(0, -3, up), -12, open) * (1 - down))];
        if (up > 0.5 && open < 0.2) r.eyes = 'half';
        // (Rising she floats, hair lifting; opened, the swarm's wind blows it back.)
        r.hairLift = open > 0.3 && down < 0.6 ? -1 : up > 0.2 && down < 0.8 ? 1 : 0;
        r.cape = Math.round(3 * up * (1 - down) - 5 * hold);
        if (open > 0.3 && down < 0.5) strikeFace(r);
      },
    };
  },

  // ---------- The Tide Mage (docs/design/tide-mage.md) ----------
  // Water out of the head of her staff, worked with her whole body: she coils and cracks a whip,
  // bowls a wave along the floor, raises a great wave over her head and brings it down, blows
  // bubbles, slams a splash up, spins a whirlpool, rides a wave in. The staff is held as equipped
  // (0 points it straight up, 90 level ahead); her free hand pulls the water along with it.

  // Whip (opener, cracks at ~0.46): the staff drawn back over her shoulder as she coils away, then
  // snapped out level as she leans in on a forward step, the tip overshooting and settling; her
  // free hand flung back for balance and her hair whipping after.
  tmwhip(p) {
    const coil = soft(seg(p, 0, 0.3));
    const crack = ease(seg(p, 0.3, 0.48));
    const settle = soft(seg(p, 0.62, 1));
    return {
      weapon: lerp(lerp(30, 4, coil), 104, crack) - 14 * settle, arm: lerp(lerp(40, 28, coil), 58, crack) - 10 * settle,
      lunge: -2.5 * coil * (1 - crack) + 6 * crack * (1 - 0.5 * settle), tilt: -0.12 * coil * (1 - crack) + 0.14 * crack * (1 - 0.7 * settle),
      rig: (r) => {
        danceLegs(r, [coil * (1 - crack), [1.4, 0, 2], [-2.6, 0, -6]], [crack * (1 - 0.6 * settle), [4.2, 0, 6], [-3.4, 0, -12]]);
        r.backArm = [q(lerp(lerp(1, 3, coil), -4, crack) + 2 * settle), q(lerp(-2, -4, crack) + 2 * settle)];
        r.tx = q(lerp(-1 * coil, 1.5, crack) * (1 - 0.5 * settle));
        r.hairLift = crack > 0.2 && settle < 0.4 ? -1 : 0;
        r.cape = Math.round(-3 * bump(p, 0.3, 0.75));
        if (crack > 0.3 && settle < 0.5) strikeFace(r);
      },
    };
  },

  // Rolling wave (second, sent at ~0.44): she crouches like a bowler, sweeps the staff low along
  // the floor from behind her to out in front, and the wave rolls off its head; she rises
  // watching it go, the back leg stretched long.
  tmroll(p) {
    const dip = soft(seg(p, 0, 0.26));
    const sweep = ease(seg(p, 0.22, 0.46));
    const rise = soft(seg(p, 0.6, 1));
    return {
      weapon: lerp(lerp(30, 6, dip), 122, sweep) - 30 * rise, arm: lerp(lerp(40, 22, dip), 50, sweep) - 8 * rise,
      lunge: -1.5 * dip + 5 * sweep * (1 - 0.6 * rise), tilt: 0.06 * dip + 0.12 * sweep * (1 - 0.8 * rise),
      rig: (r) => {
        const low = Math.max(dip, sweep) * (1 - rise);
        r.squat = q(2 * low);
        danceLegs(r, [low, [3.6, 0, 6], [-4.6, 0, -18]]);
        r.backArm = [q(lerp(lerp(0, 3, dip), -5, sweep) + 3 * rise), q(lerp(-1, -3, sweep) + 2 * rise)];
        r.tx = q(1.2 * sweep * (1 - rise));
        r.cape = Math.round(-3 * bump(p, 0.25, 0.7));
        if (sweep > 0.3 && rise < 0.5) strikeFace(r);
      },
    };
  },

  // Great curling wave (finisher, crashes at ~0.56): she rises onto her toes with the staff lifted
  // high and her free hand raised to draw the water up behind her, holds it there trembling for a
  // beat while it builds, then brings everything down with a long lean, the wave crashing out
  // ahead; she lands in a deep, wide crouch and holds it, breathing, before standing.
  tmcrash(p) {
    const raise = soft(seg(p, 0, 0.3));
    const hold = seg(p, 0.3, 0.46);
    const shiver = Math.sin(hold * Math.PI * 7) * bump(p, 0.3, 0.46);
    const down = ease(seg(p, 0.44, 0.58));
    const land = bump(p, 0.54, 0.86);
    const up = soft(seg(p, 0.78, 1));
    return {
      weapon: lerp(lerp(30, 2, raise) + 3 * shiver, 128, down) - 36 * up, arm: lerp(lerp(40, 58, raise), 56, down) - 12 * up,
      lift: 4 * raise * (1 - down) + 1.2 * hold * (1 - down), lunge: -2 * raise * (1 - down) + 8 * down * (1 - 0.5 * up),
      tilt: -0.16 * raise * (1 - down) + 0.03 * shiver + 0.26 * down * (1 - 0.8 * up),
      rig: (r) => {
        r.squat = q(2.5 * land * (1 - up));
        danceLegs(r, [raise * (1 - down), [1.2, -1.2, 10], [-1.6, -1, -10]], [down * (1 - up), [4.4, 0, 6], [-4.4, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -4, raise), -5, down) + 4 * up), q(lerp(lerp(-1, -12, raise), -3, down) + 2 * up)];
        r.tx = q(lerp(-0.8 * raise, 2, down) * (1 - 0.6 * up));
        r.hairLift = raise > 0.5 && down < 0.3 ? -1 : land > 0.4 ? 1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.1, 0.5) + 3 * bump(p, 0.5, 0.9));
        if (hold > 0 && down < 0.2) r.eyes = 'half';
        if (down > 0.2 && up < 0.5) strikeFace(r);
      },
    };
  },

  // Bubbles (opener, three at ~0.3, 0.48, 0.66): the staff held up and out, its head drawing little
  // loops, a bob up onto her toes and a flick of the staff with each bubble, a happy face.
  tmbubbles(p) {
    const up = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.78, 1)));
    const puffs = [0.3, 0.48, 0.66].reduce((n, at) => n + bump(p, at - 0.09, at + 0.07), 0);
    const loop = Math.sin(p * Math.PI * 6);
    return {
      weapon: lerp(30, 40, up) + 8 * loop * up + 10 * puffs, arm: lerp(40, 54, up),
      lift: 1.8 * puffs, lunge: 1.5 * up, tilt: 0.04 * up + 0.03 * loop * up,
      rig: (r) => {
        danceLegs(r, [up, [2, 0, 2], [-2.2, 0, -4]], [puffs, [2, -0.8, 8], [-2.2, -0.6, -8]]);
        r.backArm = [q(2 + 2.5 * up + Math.cos(p * Math.PI * 6) * up), q(-2 - 3 * up - 1.5 * puffs)];
        r.hairLift = puffs > 0.6 ? -1 : 0;
        if (up > 0.4) [r.eyes, r.mouth] = puffs > 0.5 ? ['happy', 'o'] : ['open', 'o'];
      },
    };
  },

  // Splash (opener, the staff strikes the floor at ~0.45): she lifts the staff high in both a
  // wind-up and a little hop, then drives its head down into the floor ahead in a wide crouch, a
  // splash thrown up where it lands; the recoil rocks her back up.
  tmsplash(p) {
    const lift = soft(seg(p, 0, 0.3));
    const drive = ease(seg(p, 0.3, 0.46));
    const recoil = bump(p, 0.46, 0.7);
    const back = soft(seg(p, 0.66, 1));
    return {
      weapon: lerp(lerp(30, 3, lift), 150, drive) - 12 * recoil - 50 * back, arm: lerp(lerp(40, 58, lift), 46, drive) - 6 * back,
      lift: 3 * bump(p, 0.08, 0.36), lunge: 5 * drive * (1 - 0.6 * back), tilt: -0.1 * lift * (1 - drive) + 0.2 * drive * (1 - back) - 0.05 * recoil,
      rig: (r) => {
        r.squat = q(2 * drive * (1 - back));
        if (lift > 0.3 && drive < 0.3) tuck(r);
        else danceLegs(r, [drive * (1 - back), [3.6, 0, 4], [-3.6, 0, -8]]);
        r.backArm = [q(lerp(-2, -5, drive) + 3 * back), q(lerp(-6 * lift, -1, drive) + 1 * back)];
        r.hairLift = drive > 0.5 && back < 0.3 ? 1 : lift > 0.5 ? -1 : 0;
        if (drive > 0.3 && back < 0.4) strikeFace(r);
      },
    };
  },

  // Double whip (second, cracks at ~0.3 and ~0.64): the forehand crack out level, then the staff
  // swung low and round under and up into a backhand crack, the body turning with each.
  tmtwin(p) {
    const a = ease(seg(p, 0.1, 0.3));
    const under = soft(seg(p, 0.36, 0.52));
    const b = ease(seg(p, 0.5, 0.66));
    const settle = soft(seg(p, 0.76, 1));
    return {
      weapon: lerp(lerp(lerp(14, 100, a), 150, under), 84, b) - 20 * settle, arm: lerp(lerp(lerp(34, 56, a), 40, under), 58, b) - 12 * settle,
      lunge: 4 * a * (1 - under) + 5 * b * (1 - 0.6 * settle), tilt: 0.1 * a * (1 - under) - 0.08 * under * (1 - b) + 0.14 * b * (1 - 0.8 * settle),
      rig: (r) => {
        danceLegs(r, [a, [3.4, 0, 4], [-3, 0, -10]], [under, [2, 0, 2], [-3.6, 0, -6]], [b * (1 - 0.6 * settle), [4.2, 0, 6], [-3.6, 0, -12]]);
        r.squat = q(1.2 * under * (1 - b));
        r.backArm = [q(lerp(lerp(-3, 2, under), -5, b) + 3 * settle), q(lerp(-3, -1, under) - 2 * b + 2 * settle)];
        r.hairLift = (a > 0.4 && under < 0.3) || (b > 0.4 && settle < 0.4) ? -1 : 0;
        if ((a > 0.4 && under < 0.4) || (b > 0.4 && settle < 0.5)) strikeFace(r);
      },
    };
  },

  // Geyser (second, bursts up at ~0.5): she plants the staff upright beside her and brings her free
  // hand up from low to high, palm up, as the water bursts up out of the floor ahead; she rises
  // onto her toes with it and leans back to watch it go up.
  tmgeyser(p) {
    const plant = soft(seg(p, 0, 0.24));
    const call = ease(seg(p, 0.3, 0.5));
    const watch = bump(p, 0.48, 0.86);
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(30, 6, plant) - 2 * watch + 26 * back, arm: lerp(40, 30, plant) + 6 * call - 4 * back,
      lift: 3 * call * (1 - back), lunge: 1.5 * plant * (1 - back), tilt: 0.04 * plant - 0.1 * watch,
      rig: (r) => {
        danceLegs(r, [plant * (1 - back), [2.6, 0, 2], [-2.2, 0, -4]], [call * (1 - back), [2.6, -1.2, 12], [-2.2, -1, -10]]);
        r.backArm = [q(lerp(lerp(-1, 3, plant), -3, call) + 3 * back), q(lerp(lerp(-1, 1, plant), -10, call) + 9 * back)];
        r.hairLift = call > 0.5 && back < 0.5 ? -1 : 0;
        if (call > 0.4 && back < 0.5) r.mouth = 'open';
      },
    };
  },

  // Whirlpool (finisher, drags them in at ~0.28, flings them out at ~0.64): she spins on the spot
  // with the staff swept round her level (a clean turn, never squeezed), the water spinning up
  // round her, then stops dead facing out and thrusts the staff ahead to fling it all outward.
  tmwhirl(p) {
    const spin = soft(seg(p, 0.06, 0.58));
    const turns = 2 * spin;
    const thrust = ease(seg(p, 0.56, 0.68));
    const settle = soft(seg(p, 0.76, 1));
    const a = turns * Math.PI * 2;
    return {
      weapon: 92 + 360 * turns - 6 * thrust - 20 * settle, arm: lerp(46, 58, thrust) - 10 * settle, orbit: spin > 0 && spin < 1,
      turn: Math.cos(a) >= 0 ? 1 : -1, lift: 2.5 * bump(p, 0.1, 0.58), lunge: 6 * thrust * (1 - 0.6 * settle), tilt: 0.04 * Math.sin(a) * (1 - thrust) + 0.16 * thrust * (1 - settle),
      rig: (r) => {
        danceLegs(r, [bump(p, 0.04, 0.6), [1, -0.6, 6], [-1.2, 0, -2]], [thrust * (1 - 0.6 * settle), [4.2, 0, 6], [-4, 0, -12]]);
        r.squat = q(1.5 * thrust * (1 - settle));
        r.backArm = [q(-5 * bump(p, 0.06, 0.58) - 4 * thrust + 4 * settle), q(-6 * bump(p, 0.06, 0.58) - 2 * thrust + 2 * settle)];
        r.hairLift = spin > 0.1 && spin < 0.95 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.06, 0.6));
        if (thrust > 0.3 && settle < 0.5) strikeFace(r);
      },
    };
  },

  // Wave ride (finisher, crashes in at ~0.56): she rides in on a wave in a surfer's crouch, arms out
  // for balance and the staff held level like a balance pole, bobbing on the swell, then springs
  // off the top of it and lands with a splash in a wide crouch.
  tmsurf(p) {
    const ride = soft(seg(p, 0, 0.16)) * (1 - ease(seg(p, 0.46, 0.56)));
    const bob = Math.sin(p * Math.PI * 5) * ride;
    const spring = bump(p, 0.44, 0.62);
    const land = bump(p, 0.56, 0.86);
    const up = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(30, 84, ride) + 6 * bob + 40 * land * (1 - up) - 10 * up, arm: lerp(40, 48, ride) + 6 * land - 6 * up,
      lift: 3 + 1.5 * bob, lunge: 2 * ride, tilt: 0.06 * ride + 0.04 * bob + 0.16 * land * (1 - up),
      rig: (r) => {
        if (spring > 0.4 && land < 0.3) tuck(r);
        else {
          r.squat = q(2 * ride + 2 * land * (1 - up));
          danceLegs(r, [ride, [3.4, -0.4, 10], [-3.6, 0, -6]], [land * (1 - up), [4, 0, 4], [-4.2, 0, -10]]);
        }
        r.backArm = [q(-6 * ride + 2 * up), q(-5 * ride - 2 * spring + 2 * up)];
        r.hairLift = ride > 0.3 || spring > 0.3 ? -1 : land > 0.5 ? 1 : 0;
        r.cape = Math.round(-4 * ride + 2 * land);
        if (ride > 0.4) r.mouth = 'grin';
        if (land > 0.3 && up < 0.5) strikeFace(r);
      },
    };
  },

  // Spout (up + attack, at ~0.42): she thrusts the staff straight up, rising onto her toes, and the
  // water spouts up under whatever is above her; she hops a little up on it.
  tmspout(p) {
    const up = ease(seg(p, 0.12, 0.42));
    const hop = bump(p, 0.36, 0.7);
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(30, 3, up) + 30 * back, arm: lerp(40, 58, up) - 14 * back,
      lift: 6 * hop, lunge: 0, tilt: -0.08 * up * (1 - back),
      rig: (r) => {
        if (hop > 0.3) tuck(r);
        else {
          r.squat = q(1.5 * soft(seg(p, 0, 0.14)) * (1 - up));
          danceLegs(r, [up, [1.6, -1.4, 12], [-1.6, -1.2, -10]]);
        }
        r.backArm = [q(-4 * up + 4 * back), q(-8 * up + 7 * back)];
        r.hairLift = hop > 0.2 ? -1 : 0;
        if (up > 0.5 && back < 0.5) r.mouth = 'open';
      },
    };
  },

  // Waterfall (in the air, poured at ~0.42): hanging in the air she tucks and swings the staff
  // down to point under her, and the water pours down from it onto whatever is below.
  tmfall(p) {
    const tuckIn = soft(seg(p, 0, 0.3));
    const pour = ease(seg(p, 0.3, 0.46));
    const open = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(30, 6, tuckIn), 170, pour) - 60 * open, arm: lerp(lerp(40, 54, tuckIn), 44, pour), lift: 2 * tuckIn,
      tilt: -0.1 * tuckIn * (1 - pour) + 0.18 * pour * (1 - open),
      rig: (r) => {
        tuck(r);
        r.backArm = [q(lerp(2, -5, pour) + 3 * open), q(lerp(-8 * tuckIn, -2, pour))];
        r.hairLift = -1;
        if (pour > 0.3 && open < 0.5) strikeFace(r);
      },
    };
  },

  // The Tide Mage's skills.
  // Bubble Shield (the bubble closes round her at ~0.5): she hugs the staff to her, crouching a
  // little as she draws a breath, then rises and spreads her free hand wide, palm out, as the
  // bubble blows up round her and the party; a little bob as it settles.
  tmshield(p) {
    const hug = soft(seg(p, 0, 0.3));
    const open = ease(seg(p, 0.34, 0.54));
    const bob = bump(p, 0.54, 0.8);
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(30, 8, hug), 20, open) + 10 * back, arm: lerp(lerp(40, 30, hug), 46, open), lift: 2.5 * open * (1 - back) + 1.5 * bob,
      tilt: 0.05 * hug * (1 - open) - 0.06 * open * (1 - back),
      rig: (r) => {
        r.squat = q(1.5 * hug * (1 - open));
        danceLegs(r, [open * (1 - back), [2, -0.8, 8], [-2.2, -0.6, -8]]);
        r.backArm = [q(lerp(lerp(0, 3, hug), -6, open) + 6 * back), q(lerp(-1, -4, open) + 3 * back)];
        r.hairLift = open > 0.4 && back < 0.5 ? -1 : 0;
        if (hug > 0.4 && open < 0.3) r.eyes = 'happy';
        else if (open > 0.3 && back < 0.6) r.mouth = 'o';
      },
    };
  },
  // Tide Pool (the pool spreads at ~0.45): she lifts the staff in both a little hop and plants its
  // foot in the floor beside her; the water wells up round it and she steps back to let it spread.
  tmpool(p) {
    const lift = soft(seg(p, 0, 0.26));
    const plant = ease(seg(p, 0.26, 0.42));
    const step = soft(seg(p, 0.5, 0.8));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(30, 4, lift), 12, plant) + 20 * back, arm: lerp(lerp(40, 56, lift), 30, plant) + 6 * back,
      lift: 2.5 * bump(p, 0.04, 0.32), lunge: -2.5 * step * (1 - back), tilt: -0.06 * lift * (1 - plant) + 0.06 * plant * (1 - step),
      rig: (r) => {
        r.squat = q(1.5 * plant * (1 - step));
        danceLegs(r, [plant * (1 - step), [2.6, 0, 4], [-2.6, 0, -6]], [step * (1 - back), [1.4, 0, 2], [-3.4, 0, -8]]);
        r.backArm = [q(lerp(-1, 4, plant) - 2 * step), q(lerp(-4 * lift, -1, plant) - 3 * step + 3 * back)];
        if (plant > 0.4 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Riptide (drags them in at ~0.3, crashes at ~0.66): she sweeps the staff low and wide across in
  // front of her, leaning back against the pull as if hauling a net in, then heaves it up and over
  // and brings it down where they've been dragged together.
  tmriptide(p) {
    const reach = soft(seg(p, 0, 0.2));
    const haul = ease(seg(p, 0.2, 0.42));
    const heave = soft(seg(p, 0.44, 0.58));
    const slam = ease(seg(p, 0.58, 0.68));
    const settle = soft(seg(p, 0.78, 1));
    return {
      weapon: lerp(lerp(lerp(30, 120, reach), 60, haul), 6, heave) + 118 * slam - 30 * settle, arm: lerp(lerp(40, 54, reach), 34, haul) + 20 * heave * (1 - slam) - 6 * settle,
      lunge: 3 * reach * (1 - haul) - 3 * haul * (1 - slam) + 6 * slam * (1 - 0.6 * settle), tilt: 0.08 * reach * (1 - haul) - 0.14 * haul * (1 - heave) + 0.22 * slam * (1 - settle),
      rig: (r) => {
        r.squat = q(1.2 * haul * (1 - heave) + 2 * slam * (1 - settle));
        danceLegs(r, [reach, [3.4, 0, 4], [-2.6, 0, -6]], [haul * (1 - heave), [3.8, 0, 2], [-4, 0, -14]], [slam * (1 - settle), [4.2, 0, 6], [-4, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, 4, reach), -4, haul) - 2 * slam + 4 * settle), q(lerp(-1, -3, haul) - 4 * heave * (1 - slam) + 2 * settle)];
        r.hairLift = heave > 0.4 && slam < 0.5 ? -1 : slam > 0.5 && settle < 0.4 ? 1 : 0;
        if (haul > 0.3 && heave < 0.5) r.mouth = 'grit';
        if (slam > 0.3 && settle < 0.5) strikeFace(r);
      },
    };
  },
  // Tidal Wave (sent at ~0.56): she turns side-on and crouches with the staff swept down and back
  // past her heel, gathering, then rises in one long heave, the staff sweeping up and out level as
  // the wave rears up off the floor and rolls away; she's left up on her toes, leaning into it.
  tmtidal(p) {
    const gather = soft(seg(p, 0, 0.34));
    const heave = ease(seg(p, 0.34, 0.56));
    const hold = seg(p, 0.56, 0.8);
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(30, 120, gather), 96, heave) - 6 * Math.sin(hold * Math.PI) - 40 * back, arm: lerp(lerp(40, 24, gather), 58, heave) - 12 * back,
      lift: 3 * heave * (1 - back), lunge: -2 * gather * (1 - heave) + 7 * heave * (1 - 0.6 * back), tilt: 0.1 * gather * (1 - heave) + 0.16 * heave * (1 - back),
      rig: (r) => {
        r.squat = q(2.4 * gather * (1 - heave));
        danceLegs(r, [gather * (1 - heave), [3.4, 0, 4], [-4.4, 0, -16]], [heave * (1 - back), [3.6, -1.2, 14], [-4, -0.6, -16]]);
        r.backArm = [q(lerp(lerp(0, 3, gather), -6, heave) + 5 * back), q(lerp(-1, -6, heave) + 5 * back)];
        r.hairLift = heave > 0.3 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.34, 0.8));
        if (heave > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Flow (the buff, at ~0.5): a quick twirl of the staff round her fingers in front of her, the
  // water ribboning off its head, and a playful little spin on her toes to finish.
  tmflow(p) {
    const twirl = soft(seg(p, 0.04, 0.6));
    const spin = soft(seg(p, 0.4, 0.8));
    const back = soft(seg(p, 0.8, 1));
    const a = spin * Math.PI * 2;
    return {
      weapon: 30 + 360 * twirl, arm: 46 - 6 * back, orbit: twirl > 0 && twirl < 1, turn: Math.cos(a) >= 0 ? 1 : -1,
      lift: 2 * bump(p, 0.4, 0.82), tilt: 0.04 * Math.sin(a),
      rig: (r) => {
        danceLegs(r, [bump(p, 0.36, 0.84), [1, -1, 10], [-1, -0.6, -6]]);
        r.backArm = [q(-4 * bump(p, 0.36, 0.84) + 2 * twirl * (1 - spin)), q(-5 * bump(p, 0.36, 0.84) - 2 * twirl * (1 - spin))];
        r.hairLift = spin > 0.1 && spin < 0.9 ? -1 : 0;
        if (spin > 0.2) [r.eyes, r.mouth] = ['happy', 'grin'];
      },
    };
  },
  // Great Wave (her finisher; the wave breaks at ~0.62): she rises off the floor on the swell with
  // the staff held high and both arms raised as the sea climbs up behind her, holds there while it
  // towers, then brings the staff sweeping down and forward with her whole body as it breaks, and
  // lands in a deep crouch, holding it, breathing, before she stands.
  tmgreat(p) {
    const rise = soft(seg(p, 0, 0.34));
    const hold = seg(p, 0.34, 0.54);
    const shiver = Math.sin(hold * Math.PI * 8) * bump(p, 0.34, 0.54);
    const down = ease(seg(p, 0.54, 0.66));
    const land = bump(p, 0.64, 0.92);
    const up = soft(seg(p, 0.86, 1));
    return {
      weapon: lerp(lerp(30, 2, rise) + 3 * shiver, 126, down) - 40 * up, arm: lerp(lerp(40, 58, rise), 56, down) - 12 * up,
      lift: 10 * rise * (1 - down) + 2 * hold * (1 - down), lunge: -2 * rise * (1 - down) + 9 * down * (1 - 0.5 * up),
      tilt: -0.18 * rise * (1 - down) + 0.03 * shiver + 0.28 * down * (1 - 0.8 * up),
      rig: (r) => {
        if (rise > 0.3 && down < 0.6) {
          r.air = true;
          r.frontLeg = [q(1.6 + 0.8 * hold), q(-2.4), 10];
          r.backLeg = [q(-1.6), q(-1.6), -12];
        } else {
          r.squat = q(2.6 * land * (1 - up));
          danceLegs(r, [down * (1 - up), [4.6, 0, 6], [-4.6, 0, -12]]);
        }
        r.backArm = [q(lerp(lerp(0, -5, rise), -6, down) + 6 * up), q(lerp(lerp(-1, -11, rise), -3, down) + 3 * up)];
        r.hairLift = rise > 0.3 && down < 0.4 ? -1 : land > 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.1, 0.6) + 3 * bump(p, 0.6, 0.95));
        if (hold > 0 && down < 0.2) r.eyes = 'half';
        if (down > 0.2 && up < 0.5) strikeFace(r);
      },
    };
  },

  // ---------- The Maelstrom (docs/design/maelstrom.md) ----------
  // The deep sea out of her staff: heavier and more forceful than the Tide Mage, grounded, the
  // power held and then let go. The staff stays as equipped and forward of her (0 straight up, 90
  // level ahead), so its head never crosses her face; her free hand drives the water.

  // Spear (opener, thrown at ~0.5): she settles low and draws her free hand back past her hip as the
  // pressure builds at the staff's head, then drives the palm forward beside the staff and the spear
  // of water shoots out; she holds the push a beat, leaning in.
  msspear(p) {
    const load = soft(seg(p, 0, 0.36));
    const push = ease(seg(p, 0.38, 0.52));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(40, 82, load), 92, push) - 30 * back, arm: lerp(lerp(40, 50, load), 58, push) - 12 * back,
      lunge: -2 * load * (1 - push) + 6 * push * (1 - 0.6 * back), tilt: -0.06 * load * (1 - push) + 0.12 * push * (1 - back),
      rig: (r) => {
        r.squat = q(1.5 * load * (1 - back));
        danceLegs(r, [load * (1 - push), [2.8, 0, 4], [-3.4, 0, -10]], [push * (1 - back), [4.2, 0, 6], [-3.6, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -4, load), 5, push) - 5 * back), q(lerp(-1, -4, push) + 3 * back)];
        r.hairLift = push > 0.3 && back < 0.4 ? -1 : 0;
        if (load > 0.4 && push < 0.3) r.eyes = 'half';
        if (push > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Vortex bolt (second, sent at ~0.48): the staff's head stirs a tight circle out in front of her,
  // faster and faster, winding the water into a spinning knot, then she flicks it on.
  msbolt(p) {
    const stir = seg(p, 0.06, 0.44);
    const a = soft(stir) * Math.PI * 6;
    const flick = ease(seg(p, 0.44, 0.54));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: 60 + 14 * Math.sin(a) * (1 - flick) + 30 * flick - 30 * back, arm: 50 + 6 * Math.cos(a) * (1 - flick) + 6 * flick - 10 * back,
      lunge: 1.5 * soft(stir) + 3 * flick * (1 - back), tilt: 0.04 * Math.sin(a) * (1 - flick) + 0.1 * flick * (1 - back),
      rig: (r) => {
        danceLegs(r, [soft(seg(p, 0, 0.2)) * (1 - back), [2.6, 0, 2], [-2.8, 0, -6]], [flick * (1 - back), [3.6, 0, 4], [-3.2, 0, -10]]);
        r.backArm = [q(2 + 2 * Math.cos(a + 1) * (1 - flick) + 2 * flick - 2 * back), q(-3 + 2 * Math.sin(a + 1) * (1 - flick) - 2 * flick + 3 * back)];
        if (stir > 0.3 && flick < 0.3) r.eyes = 'half';
        if (flick > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Open the vortex (finisher; drags them in at ~0.36, bursts at ~0.72): she plants the staff upright
  // and sweeps her free hand round in a wide circle, the vortex opening ahead of her, then closes
  // the hand into a fist and pulls it down, and the vortex bursts.
  msopen(p) {
    const plant = soft(seg(p, 0, 0.2));
    const circle = seg(p, 0.16, 0.6);
    const a = soft(circle) * Math.PI * 2;
    const close = ease(seg(p, 0.62, 0.74));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(40, 8, plant) + 22 * close * (1 - back) + 30 * back, arm: lerp(40, 34, plant) + 10 * back,
      lift: 2 * bump(p, 0.2, 0.62), lunge: 2 * close * (1 - back), tilt: -0.04 * Math.sin(a) * (1 - close) + 0.12 * close * (1 - back),
      rig: (r) => {
        r.squat = q(2 * close * (1 - back));
        danceLegs(r, [plant * (1 - back), [3, 0, 4], [-3, 0, -6]], [close * (1 - back), [4, 0, 6], [-3.8, 0, -12]]);
        const hx = 3 + 6 * Math.cos(a - 1.2);
        const hy = -2 - 4 * Math.sin(a - 1.2);
        r.backArm = [q(lerp(lerp(0, hx, Math.min(1, circle * 4)), 2, close) - 2 * back), q(lerp(lerp(-1, hy, Math.min(1, circle * 4)), -1, close) + back)];
        r.hairLift = circle > 0.1 && circle < 0.9 ? -1 : close > 0.4 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.16, 0.7));
        if (circle > 0.2 && close < 0.2) r.eyes = 'half';
        if (close > 0.3 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Pressure jet (opener, at ~0.45): a short, hard push of the staff straight ahead, braced on her
  // back foot, the recoil rocking her back a step.
  msjet(p) {
    const brace = soft(seg(p, 0, 0.36));
    const fire = ease(seg(p, 0.4, 0.48));
    const kick = bump(p, 0.46, 0.7);
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(40, 86, brace), 94, fire) - 30 * back, arm: lerp(lerp(40, 52, brace), 58, fire) - 12 * back,
      lunge: 2 * fire * (1 - kick) - 3 * kick, tilt: -0.05 * brace * (1 - fire) + 0.06 * fire * (1 - kick) - 0.06 * kick,
      rig: (r) => {
        r.squat = q(1.2 * brace * (1 - back));
        danceLegs(r, [brace * (1 - back), [3.4, 0, 4], [-3.6, 0, -12]]);
        r.backArm = [q(lerp(0, 4, brace) - 4 * back), q(lerp(-1, -3, brace) + 2 * back)];
        if (fire > 0.3 && back < 0.4) r.mouth = 'grit';
      },
    };
  },
  // Glowing bubbles (opener, two at ~0.36 and ~0.6): she holds the staff up and out and cups her
  // free hand under its head; two glowing bubbles swell there and drift off, one after the other.
  msglow(p) {
    const up = soft(seg(p, 0, 0.22)) * (1 - soft(seg(p, 0.78, 1)));
    const puffs = bump(p, 0.28, 0.42) + bump(p, 0.52, 0.66);
    return {
      weapon: lerp(40, 46, up) + 6 * puffs, arm: lerp(40, 56, up),
      lift: 1.4 * puffs, lunge: 1 * up, tilt: 0.03 * up,
      rig: (r) => {
        danceLegs(r, [up, [2, 0, 2], [-2.2, 0, -4]]);
        r.backArm = [q(4 * up + 1.5 * puffs), q(-3 * up - 1.5 * puffs)];
        if (up > 0.4) r.eyes = 'half';
      },
    };
  },
  // Crossing spears (second, at ~0.32 and ~0.58): a palm thrust with the free hand, then the staff
  // swept level ahead as she turns her hips, each sending a spear.
  mscross(p) {
    const a = ease(seg(p, 0.16, 0.34));
    const turn = soft(seg(p, 0.36, 0.5));
    const b = ease(seg(p, 0.5, 0.6));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(40, 56, a), 96, b) - 34 * back, arm: lerp(lerp(40, 44, a), 58, b) - 12 * back,
      lunge: 3 * a * (1 - turn) + 4 * b * (1 - 0.6 * back), tilt: 0.08 * a * (1 - turn) - 0.04 * turn * (1 - b) + 0.1 * b * (1 - back),
      rig: (r) => {
        danceLegs(r, [a, [3.4, 0, 4], [-3.2, 0, -10]], [b * (1 - back), [4, 0, 6], [-3.6, 0, -12]]);
        r.backArm = [q(lerp(-2, 6, a) * (1 - turn) - 3 * turn + 3 * back), q(lerp(-1, -4, a) * (1 - turn) - 1 * turn + 2 * back)];
        if ((a > 0.4 && turn < 0.5) || (b > 0.4 && back < 0.5)) strikeFace(r);
      },
    };
  },
  // Slashing current (second, at ~0.46): she sweeps the staff low and up through a wide arc in front
  // of her, the current tearing along behind its head.
  msslash(p) {
    const low = soft(seg(p, 0, 0.3));
    const sweep = ease(seg(p, 0.32, 0.5));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(40, 130, low), 30, sweep) + 20 * back, arm: lerp(lerp(40, 30, low), 58, sweep) - 14 * back,
      lunge: -1 * low + 5 * sweep * (1 - 0.6 * back), tilt: 0.08 * low * (1 - sweep) - 0.06 * sweep * (1 - back),
      rig: (r) => {
        r.squat = q(1.8 * low * (1 - sweep));
        danceLegs(r, [low * (1 - sweep), [3, 0, 4], [-3.4, 0, -12]], [sweep * (1 - back), [3.6, -0.8, 10], [-3, 0, -10]]);
        r.backArm = [q(lerp(2, -5, sweep) + 4 * back), q(lerp(-1, -4, sweep) + 3 * back)];
        r.hairLift = sweep > 0.3 && back < 0.4 ? -1 : 0;
        if (sweep > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // High-pressure beam (finisher, at ~0.5): she sets her feet wide, levels the staff with both arms
  // braced, gathers for a beat, and the beam tears out; she holds it, trembling against the force,
  // and is pushed back along the floor.
  msbeamfin(p) {
    const set = soft(seg(p, 0, 0.3));
    const fire = ease(seg(p, 0.46, 0.52));
    const hold = seg(p, 0.5, 0.8);
    const shake = Math.sin(hold * Math.PI * 12) * bump(p, 0.5, 0.8);
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(40, 90, set) + 2 * shake - 30 * back, arm: lerp(40, 58, set) - 12 * back,
      lunge: -1.5 * set * (1 - fire) - 3 * hold * (1 - back), tilt: -0.05 * set * (1 - fire) + 0.03 * shake,
      rig: (r) => {
        r.squat = q(2 * set * (1 - back));
        danceLegs(r, [set * (1 - back), [4.2, 0, 4], [-4.4, 0, -12]]);
        r.backArm = [q(lerp(0, 6, set) - 6 * back), q(lerp(-1, -5, set) + 4 * back)];
        r.hairLift = fire > 0.5 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.48, 0.86));
        if (set > 0.4 && fire < 0.3) r.eyes = 'half';
        if (fire > 0.4 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Black water slam (finisher, at ~0.56): she rises onto her toes with the staff held upright and
  // her free hand raised, the black water climbing behind her, then drives the staff down into the
  // floor ahead with her whole weight and the column slams down.
  msslam(p) {
    const rise = soft(seg(p, 0, 0.36));
    const down = ease(seg(p, 0.44, 0.58));
    const land = bump(p, 0.56, 0.86);
    const up = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(lerp(40, 4, rise), 150, down) - 60 * up, arm: lerp(lerp(40, 58, rise), 46, down) - 6 * up,
      lift: 3 * rise * (1 - down), lunge: -1.5 * rise * (1 - down) + 6 * down * (1 - 0.6 * up), tilt: -0.12 * rise * (1 - down) + 0.24 * down * (1 - 0.8 * up),
      rig: (r) => {
        r.squat = q(2.4 * land * (1 - up));
        danceLegs(r, [rise * (1 - down), [1.4, -1.2, 10], [-1.6, -1, -10]], [down * (1 - up), [4.2, 0, 4], [-4.2, 0, -10]]);
        r.backArm = [q(lerp(lerp(0, -4, rise), -5, down) + 5 * up), q(lerp(lerp(-1, -10, rise), -1, down) + up)];
        r.hairLift = rise > 0.5 && down < 0.3 ? -1 : land > 0.4 ? 1 : 0;
        if (down > 0.3 && up < 0.5) strikeFace(r);
      },
    };
  },
  // Spiral (up + attack, at ~0.42): she thrusts the staff straight up and turns once on the spot,
  // the black water spiralling up round her.
  msspiral(p) {
    const up = ease(seg(p, 0.1, 0.42));
    const turn = soft(seg(p, 0.1, 0.62));
    const back = soft(seg(p, 0.7, 1));
    const a = turn * Math.PI * 2;
    return {
      weapon: lerp(40, 4, up) + 30 * back, arm: lerp(40, 58, up) - 14 * back, turn: Math.cos(a) >= 0 ? 1 : -1,
      lift: 4 * bump(p, 0.3, 0.7), tilt: -0.06 * up * (1 - back),
      rig: (r) => {
        danceLegs(r, [up * (1 - back), [1.6, -1.4, 12], [-1.6, -1.2, -10]]);
        r.backArm = [q(-4 * up + 4 * back), q(-8 * up + 7 * back)];
        r.hairLift = turn > 0.1 && turn < 0.9 ? -1 : 0;
        if (up > 0.5 && back < 0.5) r.mouth = 'open';
      },
    };
  },
  // Spears from the air (in the air, at ~0.42): hanging, she points the staff down at them and
  // drives her free hand down beside it, the spears hurled down.
  msairspear(p) {
    const aim = soft(seg(p, 0, 0.3));
    const hurl = ease(seg(p, 0.34, 0.46));
    const open = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(40, 120, aim) + 20 * hurl - 50 * open, arm: lerp(40, 54, aim) - 10 * open, lift: 2 * aim,
      tilt: 0.1 * aim * (1 - open) + 0.1 * hurl * (1 - open),
      rig: (r) => {
        tuck(r);
        r.backArm = [q(lerp(0, -4, aim) + 7 * hurl * (1 - open)), q(lerp(-1, -6, aim) + 5 * hurl * (1 - open))];
        r.hairLift = -1;
        if (hurl > 0.3 && open < 0.5) strikeFace(r);
      },
    };
  },
  // Wave dive (out of a run): she dives forward through a wall of black water, arms and staff
  // stretched ahead, and comes up out of it into a crouch.
  msdash(p) {
    const dive = soft(seg(p, 0, 0.3)) * (1 - ease(seg(p, 0.5, 0.62)));
    const land = bump(p, 0.52, 0.86);
    const up = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(40, 92, dive) + 20 * land * (1 - up), arm: lerp(40, 58, dive) - 10 * up,
      lift: 6 * dive, lunge: 3 * dive, tilt: 0.3 * dive + 0.1 * land * (1 - up),
      rig: (r) => {
        if (dive > 0.3) {
          r.air = true;
          r.frontLeg = [q(-1 - 2 * dive), q(-2 * dive), -10];
          r.backLeg = [q(-3 - 2 * dive), q(-1.5 * dive), -20];
        } else {
          r.squat = q(2 * land * (1 - up));
          danceLegs(r, [land * (1 - up), [3.6, 0, 4], [-3.8, 0, -10]]);
        }
        r.backArm = [q(6 * dive - 3 * land + 3 * up), q(-6 * dive - 2 * land + 2 * up)];
        r.hairLift = dive > 0.3 ? -1 : land > 0.4 ? 1 : 0;
        if (land > 0.3 && up < 0.5) strikeFace(r);
      },
    };
  },

  // The Maelstrom's skills.
  // Tidal Lance (thrown at ~0.56): a long, heavy wind-up, the free hand drawn far back and the body
  // coiled low as the pressure builds, then the whole body uncoils into a lunging two-handed thrust
  // and the great lance tears out; she holds the lunge.
  mslance(p) {
    const coil = soft(seg(p, 0, 0.44));
    const drive = ease(seg(p, 0.46, 0.58));
    const back = soft(seg(p, 0.8, 1));
    const shiver = Math.sin(p * 60) * bump(p, 0.3, 0.46);
    return {
      weapon: lerp(lerp(40, 80, coil), 94, drive) + 2 * shiver - 34 * back, arm: lerp(lerp(40, 46, coil), 58, drive) - 12 * back,
      lunge: -3 * coil * (1 - drive) + 10 * drive * (1 - 0.6 * back), tilt: -0.1 * coil * (1 - drive) + 0.02 * shiver + 0.2 * drive * (1 - back),
      rig: (r) => {
        r.squat = q(2.2 * coil * (1 - drive) + 1 * drive * (1 - back));
        danceLegs(r, [coil * (1 - drive), [2.6, 0, 4], [-4.4, 0, -14]], [drive * (1 - back), [4.8, 0, 6], [-4.6, 0, -16]]);
        r.backArm = [q(lerp(lerp(0, -5, coil), 6, drive) - 6 * back), q(lerp(-1, -4, drive) + 3 * back)];
        r.hairLift = drive > 0.3 && back < 0.4 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.44, 0.9));
        if (coil > 0.4 && drive < 0.3) r.eyes = 'half';
        if (drive > 0.3 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Undertow (the vortex opens at ~0.3 and churns to ~0.9): she points the staff out at the spot,
  // then turns her free hand round and round in slow circles, holding it open while it drags and
  // shreds, and closes it to end.
  msundertow(p) {
    const point = soft(seg(p, 0, 0.24));
    const turn = seg(p, 0.24, 0.9);
    const a = turn * Math.PI * 4;
    const close = soft(seg(p, 0.88, 1));
    return {
      weapon: lerp(40, 84, point) - 30 * close, arm: lerp(40, 56, point) - 10 * close,
      lunge: 2 * point * (1 - close), tilt: 0.06 * point * (1 - close) + 0.02 * Math.sin(a),
      rig: (r) => {
        danceLegs(r, [point * (1 - close), [3, 0, 4], [-3.2, 0, -10]]);
        r.backArm = [q(lerp(0, 3 + 3 * Math.cos(a), point) * (1 - close)), q(lerp(-1, -4 + 2.5 * Math.sin(a), point) * (1 - close) - close)];
        r.hairLift = turn > 0 && close < 0.5 ? (Math.sin(a) > 0 ? -1 : 0) : 0;
        if (turn > 0.05 && close < 0.5) r.eyes = 'half';
      },
    };
  },
  // Hydro Cannon (the beam from ~0.4 to ~0.8): she drops into a wide braced stance, both arms on the
  // staff levelled like a cannon, fires, and is driven back along the floor by it, trembling.
  mscannon(p) {
    const set = soft(seg(p, 0, 0.32));
    const fire = ease(seg(p, 0.36, 0.42));
    const hold = seg(p, 0.42, 0.82);
    const shake = Math.sin(hold * Math.PI * 16) * bump(p, 0.42, 0.82);
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(40, 92, set) + 2 * shake - 32 * back, arm: lerp(40, 58, set) - 12 * back,
      lunge: -2 * set * (1 - fire) - 6 * hold * (1 - back), tilt: -0.08 * set * (1 - fire) + 0.04 * shake,
      rig: (r) => {
        r.squat = q(2.4 * set * (1 - back));
        danceLegs(r, [set * (1 - back), [4.6, 0, 4], [-4.8, 0, -14]]);
        r.backArm = [q(lerp(0, 7, set) - 7 * back), q(lerp(-1, -5, set) + 4 * back)];
        r.hairLift = fire > 0.5 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.4, 0.88));
        if (set > 0.4 && fire < 0.3) r.eyes = 'half';
        if (fire > 0.4 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Depth Charge (three bubbles at ~0.3, 0.42, 0.54): the staff held out, she flicks it three
  // times, each flick sending off a glowing charge, then snaps her fingers to set them off.
  mscharge(p) {
    const out = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.84, 1)));
    const flicks = [0.3, 0.42, 0.54].reduce((n, at) => n + bump(p, at - 0.06, at + 0.04), 0);
    const snap = bump(p, 0.7, 0.84);
    return {
      weapon: lerp(40, 60, out) + 16 * flicks, arm: lerp(40, 54, out), lift: 1.2 * flicks, lunge: 1.5 * out,
      tilt: 0.04 * flicks + 0.06 * snap,
      rig: (r) => {
        danceLegs(r, [out, [2.4, 0, 2], [-2.6, 0, -6]]);
        r.backArm = [q(2 * out + 4 * snap), q(-2 * out - 6 * snap)];
        if (snap > 0.3) [r.eyes, r.mouth] = ['wink', 'grin'];
        else if (out > 0.4) r.eyes = 'half';
      },
    };
  },
  // Maelstrom (her finisher; the whirlpool opens at ~0.3 and tears until ~0.85): she rises off the
  // floor with the staff held up and her free hand raised, the sea turning under her into a giant
  // whirlpool; she hangs there turning slowly with it, then drives the staff down and it bursts.
  msfinale(p) {
    const rise = soft(seg(p, 0, 0.26));
    const turn = seg(p, 0.26, 0.82);
    const a = turn * Math.PI * 2;
    const down = ease(seg(p, 0.82, 0.9));
    const land = bump(p, 0.88, 1);
    return {
      weapon: lerp(lerp(40, 4, rise), 130, down) + 3 * Math.sin(a * 3) * (1 - down), arm: lerp(lerp(40, 58, rise), 48, down),
      lift: 12 * rise * (1 - down) + 1.5 * Math.sin(a * 2) * (1 - down), lunge: 4 * down, tilt: -0.14 * rise * (1 - down) + 0.04 * Math.sin(a) + 0.2 * down,
      turn: Math.cos(a) >= 0 ? 1 : -1,
      rig: (r) => {
        if (rise > 0.3 && down < 0.6) {
          r.air = true;
          r.frontLeg = [q(1.4), q(-2.4), 10];
          r.backLeg = [q(-1.4), q(-1.6), -12];
        } else {
          r.squat = q(2.4 * land);
          danceLegs(r, [down, [4.4, 0, 6], [-4.4, 0, -12]]);
        }
        r.backArm = [q(lerp(lerp(0, -4, rise), -5, down)), q(lerp(lerp(-1, -11, rise), -2, down))];
        r.hairLift = rise > 0.3 && down < 0.5 ? -1 : land > 0.3 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.1, 0.9));
        if (turn > 0 && down < 0.2) r.eyes = 'half';
        if (down > 0.3) r.mouth = 'grit';
      },
    };
  },
  // Her versions of the Tide Mage's skills.
  // Abyss Shell (Bubble Shield): she draws the staff in and crosses her free arm over it, head bowed,
  // then throws both open and the dark shell closes round them.
  msshell(p) {
    const fold = soft(seg(p, 0, 0.32));
    const open = ease(seg(p, 0.36, 0.52));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(40, 12, fold), 30, open) + 10 * back, arm: lerp(lerp(40, 28, fold), 50, open), lift: 2 * open * (1 - back),
      tilt: 0.1 * fold * (1 - open) - 0.05 * open * (1 - back),
      rig: (r) => {
        r.squat = q(1.8 * fold * (1 - open));
        danceLegs(r, [open * (1 - back), [2.4, 0, 4], [-2.6, 0, -6]]);
        r.backArm = [q(lerp(lerp(0, 5, fold), -6, open) + 6 * back), q(lerp(-1, -3, open) + 2 * back)];
        if (fold > 0.4 && open < 0.3) r.eyes = 'half';
        else if (open > 0.3 && back < 0.6) r.mouth = 'o';
      },
    };
  },
  // Glowing Pool (Tide Pool): she drives the staff's foot into the floor and kneels on one knee beside
  // it, her free hand flat on the floor, and the glowing water spreads out from under her palm.
  mspool(p) {
    const drive = ease(seg(p, 0.12, 0.34));
    const kneel = soft(seg(p, 0.3, 0.5));
    const up = soft(seg(p, 0.78, 1));
    return {
      weapon: lerp(40, 10, drive) + 20 * up, arm: lerp(40, 30, drive) + 6 * up, lunge: 1 * kneel * (1 - up),
      tilt: 0.08 * kneel * (1 - up),
      rig: (r) => {
        r.squat = q(2.6 * kneel * (1 - up));
        danceLegs(r, [kneel * (1 - up), [2.8, 0, 6], [-2.6, 0, -20]]);
        r.backArm = [q(lerp(0, 4, kneel) * (1 - up)), q(lerp(-1, 4, kneel) * (1 - up))];
        if (kneel > 0.4 && up < 0.5) r.eyes = 'half';
      },
    };
  },
  // Black Current (Riptide): the staff swept round in a wide low circle at her feet, the current
  // dragging them in, then she stamps and the black water bursts up where they've gathered.
  msriptide(p) {
    const sweep = seg(p, 0.04, 0.5);
    const a = soft(sweep) * Math.PI * 2;
    const stamp = ease(seg(p, 0.56, 0.68));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: 110 + 30 * Math.sin(a) * (1 - stamp) - 60 * stamp * (1 - back) - 40 * back, arm: 40 + 10 * Math.cos(a) * (1 - stamp) + 10 * stamp - 10 * back,
      lunge: 2 * Math.sin(a) * (1 - stamp) + 3 * stamp * (1 - back), tilt: 0.06 * Math.sin(a) * (1 - stamp) + 0.12 * stamp * (1 - back),
      rig: (r) => {
        r.squat = q(1.4 * (1 - stamp) * soft(seg(p, 0, 0.2)) + 2.2 * stamp * (1 - back));
        danceLegs(r, [soft(seg(p, 0, 0.2)) * (1 - back), [3.6, 0, 4], [-3.8, 0, -12]]);
        r.backArm = [q(-3 + 3 * Math.cos(a + 1) * (1 - stamp) + 6 * stamp - 3 * back), q(-2 + 2 * Math.sin(a + 1) * (1 - stamp) - 2 * stamp + 3 * back)];
        if (stamp > 0.3 && back < 0.5) r.mouth = 'grit';
      },
    };
  },
  // Black Wave (Tidal Wave): she sinks low with both arms drawn down and back, then heaves them up and
  // out, and a wave of black water rises out of the floor and rolls on.
  msblack(p) {
    const sink = soft(seg(p, 0, 0.36));
    const heave = ease(seg(p, 0.38, 0.58));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(40, 120, sink), 70, heave) - 30 * back, arm: lerp(lerp(40, 22, sink), 58, heave) - 14 * back,
      lift: 2 * heave * (1 - back), lunge: -2 * sink * (1 - heave) + 6 * heave * (1 - 0.6 * back), tilt: 0.1 * sink * (1 - heave) - 0.08 * heave * (1 - back),
      rig: (r) => {
        r.squat = q(2.6 * sink * (1 - heave));
        danceLegs(r, [sink * (1 - heave), [3.2, 0, 4], [-4, 0, -14]], [heave * (1 - back), [3.4, -1.2, 12], [-3.6, -0.6, -14]]);
        r.backArm = [q(lerp(lerp(0, 2, sink), -5, heave) + 5 * back), q(lerp(lerp(-1, 3, sink), -9, heave) + 8 * back)];
        r.hairLift = heave > 0.3 && back < 0.5 ? -1 : 0;
        if (heave > 0.3 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Deep Flow (Flow): she breathes in slowly, eyes closed, glowing motes rising round her, and opens
  // her eyes with a sharp turn of the staff.
  msflow(p) {
    const breathe = soft(seg(p, 0, 0.6));
    const snap = ease(seg(p, 0.6, 0.7));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(40, 20, breathe) + 60 * snap * (1 - back), arm: lerp(40, 34, breathe) + 16 * snap * (1 - back), lift: 2 * breathe * (1 - snap),
      tilt: -0.04 * breathe * (1 - snap) + 0.08 * snap * (1 - back),
      rig: (r) => {
        danceLegs(r, [breathe * (1 - back), [1.6, 0, 2], [-1.8, 0, -4]]);
        r.backArm = [q(2 * breathe * (1 - snap) - 3 * snap * (1 - back)), q(-3 * breathe * (1 - snap) - 3 * snap * (1 - back))];
        if (breathe > 0.2 && snap < 0.3) r.eyes = 'blink';
        else if (snap > 0.3 && back < 0.6) r.mouth = 'grin';
      },
    };
  },
  // Black Tide (Great Wave): she rises on a black swell with the staff held up and both arms raised as
  // the dark sea towers behind her, holds it, then brings everything down and it breaks.
  msblacktide(p) {
    const rise = soft(seg(p, 0, 0.36));
    const hold = seg(p, 0.36, 0.54);
    const glow = Math.sin(hold * Math.PI * 6) * bump(p, 0.36, 0.54);
    const down = ease(seg(p, 0.54, 0.66));
    const land = bump(p, 0.64, 0.92);
    const up = soft(seg(p, 0.86, 1));
    return {
      weapon: lerp(lerp(40, 4, rise) + 2 * glow, 128, down) - 40 * up, arm: lerp(lerp(40, 58, rise), 56, down) - 12 * up,
      lift: 9 * rise * (1 - down) + 1.5 * hold * (1 - down), lunge: -2 * rise * (1 - down) + 9 * down * (1 - 0.5 * up),
      tilt: -0.16 * rise * (1 - down) + 0.02 * glow + 0.26 * down * (1 - 0.8 * up),
      rig: (r) => {
        if (rise > 0.3 && down < 0.6) {
          r.air = true;
          r.frontLeg = [q(1.6), q(-2.4), 10];
          r.backLeg = [q(-1.6), q(-1.6), -12];
        } else {
          r.squat = q(2.6 * land * (1 - up));
          danceLegs(r, [down * (1 - up), [4.6, 0, 6], [-4.6, 0, -12]]);
        }
        r.backArm = [q(lerp(lerp(0, -5, rise), -6, down) + 6 * up), q(lerp(lerp(-1, -11, rise), -3, down) + 3 * up)];
        r.hairLift = rise > 0.3 && down < 0.4 ? -1 : land > 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.1, 0.6) + 3 * bump(p, 0.6, 0.95));
        if (hold > 0 && down < 0.2) r.eyes = 'half';
        if (down > 0.2 && up < 0.5) r.mouth = 'grit';
      },
    };
  },

  // ---------- The Tidecaller (docs/design/tidecaller.md) ----------
  // The mage the moon answers: graceful and flowing, sung rather than hurled. She sways, turns and
  // conducts the water with long sweeping gestures, up on her toes, the free hand as much a part of
  // every spell as the staff; the staff stays ahead of her, its head never across her face.
  // Pearl (opener, at ~0.48): a little turn of the wrist draws the staff's head back in a soft loop,
  // then a flick sends a pearl of water spinning off it, her free hand opening after it.
  tcpearl(p) {
    const loop = soft(seg(p, 0, 0.42));
    const a = loop * Math.PI * 1.4;
    const flick = ease(seg(p, 0.42, 0.52));
    const back = soft(seg(p, 0.7, 1));
    return {
      weapon: 50 + 16 * Math.sin(a) * (1 - flick) + 36 * flick - 36 * back, arm: 44 + 6 * Math.sin(a + 0.6) * (1 - flick) + 10 * flick - 10 * back,
      lift: 1.2 * bump(p, 0.3, 0.6), lunge: 2.5 * flick * (1 - back), tilt: -0.04 * loop * (1 - flick) + 0.08 * flick * (1 - back),
      rig: (r) => {
        danceLegs(r, [loop * (1 - flick), [2.4, -0.4, 2], [-2.6, 0, -6]], [flick * (1 - back), [3.4, -0.6, 4], [-3.2, 0, -10]]);
        r.backArm = [q(lerp(-1, -3, loop) * (1 - flick) + 5 * flick * (1 - back)), q(lerp(-1, -3, loop) * (1 - flick) - 2 * flick * (1 - back))];
        r.hairLift = flick > 0.3 && back < 0.4 ? -1 : 0;
        if (loop > 0.3 && flick < 0.2) r.eyes = 'half';
        if (flick > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Ribbon (second, at ~0.5): a dancer's turn on the spot, the staff swept round low to high so a
  // ribbon of water follows its head in a long S through them.
  tcribbon(p) {
    const wind = soft(seg(p, 0, 0.3));
    const sweep = ease(seg(p, 0.32, 0.56));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(40, 124, wind), 40, sweep) + 10 * back, arm: lerp(lerp(40, 30, wind), 58, sweep) - 14 * back,
      lift: 1.6 * bump(p, 0.3, 0.62), lunge: -1 * wind + 4 * sweep * (1 - 0.6 * back), tilt: 0.06 * wind * (1 - sweep) - 0.08 * sweep * (1 - back),
      turn: wind > 0.5 && sweep < 0.35 ? -1 : 1,
      rig: (r) => {
        danceLegs(r, [wind * (1 - sweep), [2, -0.8, 2], [-3, 0, -8]], [sweep * (1 - back), [3.8, -0.4, 6], [-3.6, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, 4, wind), -5, sweep) + 5 * back), q(lerp(lerp(-1, 1, wind), -4, sweep) + 3 * back)];
        r.hairLift = sweep > 0.2 && back < 0.4 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.3, 0.7));
        if (sweep > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Pillar of moonlight (finisher, at ~0.56): she raises the staff high and lifts onto her toes, her
  // free hand rising open to the sky as if calling the moon, then draws both down and the light
  // falls on them.
  tcpillar(p) {
    const call = soft(seg(p, 0, 0.4));
    const hold = bump(p, 0.36, 0.56);
    const fall = ease(seg(p, 0.5, 0.62));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(40, 10, call), 70, fall) - 30 * back, arm: lerp(lerp(40, 60, call), 52, fall) - 12 * back,
      lift: 4 * call * (1 - fall) + 1.4 * hold, lunge: 3 * fall * (1 - back), tilt: -0.1 * call * (1 - fall) + 0.1 * fall * (1 - back),
      rig: (r) => {
        r.squat = q(1.4 * fall * (1 - back));
        danceLegs(r, [call * (1 - fall), [1.6, -1.6, 2], [-1.8, -1.4, -4]], [fall * (1 - back), [3.8, 0, 6], [-3.6, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -4, call), -4, fall) + 4 * back * fall), q(lerp(lerp(-1, -12, call), -2, fall) + 1 * back)];
        r.hairLift = call > 0.4 && fall < 0.3 ? -1 : fall > 0.4 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.2, 0.7));
        if (call > 0.4 && fall < 0.3) r.eyes = 'blink';
        else if (fall > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Skipping shells (opener, two at ~0.46 and ~0.62): a low sidearm skim, like skipping stones on
  // the sea, the staff swept flat along the floor twice.
  tcshell(p) {
    const low = soft(seg(p, 0, 0.3));
    const a = ease(seg(p, 0.36, 0.48));
    const b = ease(seg(p, 0.54, 0.64));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(40, 112, low), 96, a) + 10 * bump(p, 0.48, 0.56) - 4 * b - 50 * back, arm: lerp(lerp(40, 34, low), 54, a) - 14 * back,
      lunge: 2 * a + 1.5 * b * (1 - back) - 1.5 * back * a, tilt: 0.12 * low * (1 - back),
      rig: (r) => {
        r.squat = q(2 * low * (1 - back));
        danceLegs(r, [low * (1 - back), [3.6, 0, 6], [-3.4, 0, -12]]);
        r.backArm = [q(lerp(0, -4, low) * (1 - back)), q(lerp(-1, 2, low) * (1 - back))];
        if ((a > 0.3 && a < 1) || (b > 0.3 && back < 0.5)) r.mouth = 'o';
      },
    };
  },
  // Shower of drops (opener, at ~0.36-0.64): she spins the staff's head in a little circle over them
  // like stirring a cloud, the drops falling, her free hand raised palm down.
  tcdrops(p) {
    const up = soft(seg(p, 0, 0.26)) * (1 - soft(seg(p, 0.78, 1)));
    const a = seg(p, 0.2, 0.7) * Math.PI * 4;
    return {
      weapon: lerp(40, 54, up) + 10 * Math.sin(a) * up, arm: lerp(40, 62, up) + 4 * Math.cos(a) * up,
      lift: 1.6 * up, lunge: 1.5 * up, tilt: -0.04 * up,
      rig: (r) => {
        danceLegs(r, [up, [2.2, -0.8, 2], [-2.4, -0.4, -4]]);
        r.backArm = [q(lerp(0, -3, up)), q(lerp(-1, -8, up))];
        if (up > 0.5) r.eyes = 'half';
      },
    };
  },
  // Crescent wave (second, at ~0.46): the staff drawn across her in a wide arc from high behind to
  // low ahead, the crescent of water left by its head rolling off.
  tccrescent(p) {
    const rise = soft(seg(p, 0, 0.32));
    const cut = ease(seg(p, 0.34, 0.5));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(40, 8, rise), 120, cut) - 70 * back, arm: lerp(lerp(40, 58, rise), 46, cut) - 6 * back,
      lift: 2 * rise * (1 - cut), lunge: -1 * rise + 5 * cut * (1 - 0.6 * back), tilt: -0.08 * rise * (1 - cut) + 0.12 * cut * (1 - back),
      rig: (r) => {
        r.squat = q(1.4 * cut * (1 - back));
        danceLegs(r, [rise * (1 - cut), [1.8, -1.2, 2], [-2.4, -0.6, -6]], [cut * (1 - back), [4, 0, 6], [-3.6, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -5, rise), -4, cut) + 4 * back), q(lerp(lerp(-1, -6, rise), 1, cut) - 2 * back)];
        r.hairLift = cut > 0.3 && back < 0.4 ? 1 : rise > 0.4 ? -1 : 0;
        if (cut > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Chain of bubbles (second, three at ~0.3, 0.44, 0.58): she blows across her open palm and taps
  // the staff's head three times as the bubbles string out from it.
  tcchain(p) {
    const up = soft(seg(p, 0, 0.22)) * (1 - soft(seg(p, 0.76, 1)));
    const taps = bump(p, 0.24, 0.34) + bump(p, 0.38, 0.48) + bump(p, 0.52, 0.62);
    return {
      weapon: lerp(40, 70, up) + 5 * taps, arm: lerp(40, 52, up) + 2 * taps,
      lunge: 1.2 * up + 0.6 * taps, tilt: 0.03 * up + 0.02 * taps,
      rig: (r) => {
        danceLegs(r, [up, [2.4, -0.6, 2], [-2.4, 0, -6]]);
        r.backArm = [q(lerp(0, 5, up)), q(lerp(-1, -6, up))];
        if (up > 0.4) r.mouth = 'o';
      },
    };
  },
  // Rising spring (finisher, at ~0.52): she sinks low with the staff's foot to the floor, then sweeps
  // it up in one long lift, rising onto her toes, and the spring wells up under them.
  tcspring(p) {
    const sink = soft(seg(p, 0, 0.34));
    const lift = ease(seg(p, 0.38, 0.56));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(40, 120, sink), 20, lift) + 20 * back, arm: lerp(lerp(40, 28, sink), 62, lift) - 20 * back,
      lift: 3 * lift * (1 - back), lunge: 1 * sink + 2 * lift * (1 - back), tilt: 0.1 * sink * (1 - lift) - 0.1 * lift * (1 - back),
      rig: (r) => {
        r.squat = q(2.8 * sink * (1 - lift));
        danceLegs(r, [sink * (1 - lift), [3.4, 0, 6], [-3.4, 0, -16]], [lift * (1 - back), [1.8, -1.4, 2], [-2, -1.2, -4]]);
        r.backArm = [q(lerp(lerp(0, 3, sink), -6, lift) + 6 * back), q(lerp(lerp(-1, 3, sink), -11, lift) + 10 * back)];
        r.hairLift = lift > 0.3 && back < 0.4 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.4, 0.8));
        if (sink > 0.4 && lift < 0.2) r.eyes = 'half';
        if (lift > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Great crescent wave (finisher, at ~0.56): a full turn, the staff carried round her at arm's
  // length, and she comes out of it sweeping the great crescent off along the floor.
  tcwave(p) {
    const turn = seg(p, 0.08, 0.5);
    const a = soft(turn) * Math.PI * 2;
    const send = ease(seg(p, 0.5, 0.6));
    const back = soft(seg(p, 0.78, 1));
    return {
      weapon: 60 + 30 * Math.sin(a) * (1 - send) + 40 * send - 40 * back, arm: 46 + 8 * Math.cos(a) * (1 - send) + 10 * send - 14 * back,
      lift: 2 * Math.sin(Math.PI * turn), lunge: 5 * send * (1 - 0.6 * back), tilt: 0.05 * Math.sin(a) * (1 - send) + 0.12 * send * (1 - back),
      turn: Math.cos(a) >= 0 || send > 0 ? 1 : -1,
      rig: (r) => {
        r.squat = q(1.6 * send * (1 - back));
        danceLegs(r, [Math.sin(Math.PI * turn), [1.8, -1, 2], [-2.2, -0.6, -6]], [send * (1 - back), [4.2, 0, 6], [-3.8, 0, -12]]);
        r.backArm = [q(-4 * Math.sin(Math.PI * turn) - 4 * send * (1 - back)), q(-4 * Math.sin(Math.PI * turn) - 1 * send)];
        r.hairLift = turn > 0.1 && send < 0.5 ? -1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.08, 0.7));
        if (turn > 0.3 && send < 0.2) r.eyes = 'half';
        if (send > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Command moves. Up + attack: she reaches up under whatever flies and the spring follows her hand.
  tcrise(p) {
    const sink = soft(seg(p, 0, 0.3));
    const up = ease(seg(p, 0.34, 0.48));
    const back = soft(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(40, 70, sink), 10, up) + 34 * back, arm: lerp(lerp(40, 34, sink), 64, up) - 24 * back,
      lift: 4 * up * (1 - back), lunge: 1.5 * up, tilt: 0.06 * sink * (1 - up) - 0.12 * up * (1 - back),
      rig: (r) => {
        r.squat = q(2.2 * sink * (1 - up));
        danceLegs(r, [sink * (1 - up), [3, 0, 4], [-3, 0, -12]], [up * (1 - back), [1.6, -1.6, 2], [-1.8, -1.4, -4]]);
        r.backArm = [q(lerp(0, -6, up) + 6 * back), q(lerp(lerp(-1, 2, sink), -12, up) + 10 * back)];
        r.hairLift = up > 0.3 && back < 0.5 ? -1 : 0;
        if (up > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // In the air: she hangs with the staff held out and down, stirring, and the drops rain from it.
  tcairdrops(p) {
    const out = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.8, 1)));
    const a = seg(p, 0.2, 0.74) * Math.PI * 4;
    return {
      weapon: lerp(40, 128, out) + 8 * Math.sin(a) * out, arm: lerp(40, 40, out) + 4 * Math.cos(a) * out,
      lunge: 1 * out, tilt: 0.12 * out,
      rig: (r) => {
        r.air = true;
        r.frontLeg = [q(1.6), q(-2.6), 10];
        r.backLeg = [q(-1.4), q(-1.8), -14];
        r.backArm = [q(lerp(0, -4, out)), q(lerp(-1, -5, out))];
        r.hairLift = -1;
        if (out > 0.4) r.eyes = 'half';
      },
    };
  },
  // Out of a run: she glides in on a ribbon of foam, one foot trailed, the staff swept back, then
  // swings it through as she lands.
  tcglide(p) {
    const glide = soft(seg(p, 0, 0.22)) * (1 - ease(seg(p, 0.46, 0.56)));
    const swing = ease(seg(p, 0.44, 0.56));
    const back = soft(seg(p, 0.74, 1));
    return {
      weapon: lerp(lerp(40, 130, glide), 60, swing) - 20 * back, arm: lerp(lerp(40, 32, glide), 56, swing) - 14 * back,
      lift: 2.4 * glide, lunge: 3 * glide + 4 * swing * (1 - back), tilt: 0.16 * glide + 0.08 * swing * (1 - back),
      rig: (r) => {
        if (glide > 0.3) {
          r.frontLeg = [q(2.4), q(-0.4), 6];
          r.backLeg = [q(-5), q(-2.2), -24];
        } else danceLegs(r, [swing * (1 - back), [3.8, 0, 6], [-3.6, 0, -12]]);
        r.backArm = [q(lerp(0, -6, glide) * (1 - swing) + 4 * swing * (1 - back)), q(lerp(-1, -6, glide) * (1 - swing) - 2 * swing * (1 - back))];
        r.hairLift = glide > 0.3 ? -1 : 0;
        r.cape = Math.round(-5 * glide);
        if (glide > 0.4) r.mouth = 'cat';
        else if (swing > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // ---------- Her skills ----------
  // Healing Rain: she lifts the staff high and turns its head in a slow circle overhead, her free
  // hand held up palm to the sky, and the rain cloud gathers over the party.
  tcrain(p) {
    const up = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.8, 1)));
    const a = seg(p, 0.24, 0.8) * Math.PI * 2;
    return {
      weapon: lerp(40, 16, up) + 10 * Math.sin(a) * up, arm: lerp(40, 62, up) + 3 * Math.cos(a) * up,
      lift: 2 * up + 1 * Math.sin(a) * up, tilt: -0.08 * up,
      rig: (r) => {
        danceLegs(r, [up, [1.8, -1.2, 2], [-2, -1, -4]]);
        r.backArm = [q(lerp(0, -5, up)), q(lerp(-1, -11, up))];
        r.hairLift = up > 0.5 ? -1 : 0;
        if (up > 0.4) r.eyes = 'blink';
        if (up > 0.6) r.mouth = 'cat';
      },
    };
  },
  // Spring Surge: she draws both hands in to her heart, head bowed, then throws her arms wide as she
  // rises onto her toes, and the spring bursts up round her.
  tcsurge(p) {
    const gather = soft(seg(p, 0, 0.36));
    const open = ease(seg(p, 0.4, 0.54));
    const back = soft(seg(p, 0.78, 1));
    return {
      weapon: lerp(lerp(40, 14, gather), 70, open) - 30 * back, arm: lerp(lerp(40, 26, gather), 60, open) - 20 * back,
      lift: 4 * open * (1 - back), tilt: 0.1 * gather * (1 - open) - 0.08 * open * (1 - back),
      rig: (r) => {
        r.squat = q(1.8 * gather * (1 - open));
        danceLegs(r, [open * (1 - back), [1.6, -1.6, 2], [-1.8, -1.4, -4]]);
        r.backArm = [q(lerp(lerp(0, 5, gather), -6, open) + 6 * back), q(lerp(lerp(-1, -3, gather), -8, open) + 7 * back)];
        r.hairLift = open > 0.3 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.4, 0.8));
        if (gather > 0.4 && open < 0.3) r.eyes = 'blink';
        else if (open > 0.3 && back < 0.6) r.mouth = 'cat';
      },
    };
  },
  // Moon Blessing: she stands the staff upright before her, bows her head over her free hand on her
  // heart, then lifts her face and the hand opens to the party.
  tcbless(p) {
    const bow = soft(seg(p, 0, 0.4));
    const lift = ease(seg(p, 0.44, 0.62));
    const back = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(40, 14, bow) + 26 * back, arm: lerp(40, 34, bow) + 6 * lift * (1 - back),
      lift: 1.5 * lift * (1 - back), tilt: 0.1 * bow * (1 - lift) - 0.04 * lift * (1 - back),
      rig: (r) => {
        danceLegs(r, [bow * (1 - back), [1.8, 0, 2], [-2, 0, -4]]);
        r.backArm = [q(lerp(lerp(0, 5, bow), -2, lift) + 2 * back), q(lerp(lerp(-1, -4, bow), -7, lift) + 6 * back)];
        if (bow > 0.4 && lift < 0.4) r.eyes = 'blink';
        else if (lift > 0.4 && back < 0.6) r.mouth = 'cat';
      },
    };
  },
  // Tide's Return: she kneels and reaches her free hand out low over the fallen, then rises slowly,
  // lifting the hand, and they come up with it.
  tcreturn(p) {
    const kneel = soft(seg(p, 0, 0.3));
    const rise = soft(seg(p, 0.46, 0.82));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(40, 20, kneel) + 10 * rise, arm: lerp(40, 30, kneel) + 10 * rise * (1 - back),
      lift: 2 * rise * (1 - back), lunge: 2 * kneel * (1 - rise), tilt: 0.14 * kneel * (1 - rise) - 0.06 * rise * (1 - back),
      rig: (r) => {
        r.squat = q(3 * kneel * (1 - rise));
        danceLegs(r, [kneel * (1 - rise), [3, 0, 6], [-2.6, 0, -22]], [rise * (1 - back), [1.8, -1, 2], [-2, -0.8, -4]]);
        r.backArm = [q(lerp(lerp(0, 6, kneel), -4, rise) + 4 * back), q(lerp(lerp(-1, 2, kneel), -10, rise) + 9 * back)];
        r.hairLift = rise > 0.4 && back < 0.5 ? -1 : 0;
        if (kneel > 0.4 && rise < 0.3) r.eyes = 'blink';
        else if (rise > 0.5 && back < 0.6) r.mouth = 'cat';
      },
    };
  },
  // Moonfall: her free hand draws a crescent in the air over them, then she pulls it down hard and
  // drives the staff's head after it.
  tcmoonfall(p) {
    const draw = seg(p, 0.06, 0.46);
    const a = soft(draw) * Math.PI;
    const pull = ease(seg(p, 0.48, 0.6));
    const back = soft(seg(p, 0.78, 1));
    return {
      weapon: lerp(40, 30, soft(draw)) + 80 * pull - 70 * back, arm: lerp(40, 54, soft(draw)) - 6 * pull - 6 * back,
      lift: 2.4 * Math.sin(a) * (1 - pull), lunge: 4 * pull * (1 - 0.6 * back), tilt: -0.06 * Math.sin(a) * (1 - pull) + 0.14 * pull * (1 - back),
      rig: (r) => {
        r.squat = q(1.8 * pull * (1 - back));
        danceLegs(r, [soft(draw) * (1 - pull), [2, -1, 2], [-2.4, -0.6, -6]], [pull * (1 - back), [4.2, 0, 6], [-3.8, 0, -12]]);
        r.backArm = [q(lerp(0, -5 - 2 * Math.cos(a), Math.min(1, draw * 3)) * (1 - pull) + 3 * pull * (1 - back)), q(lerp(-1, -9 - 3 * Math.sin(a), Math.min(1, draw * 3)) * (1 - pull) + 2 * pull * (1 - back))];
        r.hairLift = pull > 0.3 && back < 0.4 ? 1 : draw > 0.2 ? -1 : 0;
        if (draw > 0.2 && pull < 0.2) r.eyes = 'half';
        if (pull > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
  // Moon Tide (finisher): she rises off the floor with the staff held high as the moon climbs behind
  // her, turns slowly with both arms open as the tide rises, then sweeps the staff round and down
  // and it floods the screen.
  tcmoontide(p) {
    const rise = soft(seg(p, 0, 0.3));
    const turn = seg(p, 0.3, 0.8);
    const a = turn * Math.PI * 2;
    const sweep = ease(seg(p, 0.8, 0.9));
    const land = bump(p, 0.88, 1);
    return {
      weapon: lerp(lerp(40, 12, rise), 110, sweep) + 4 * Math.sin(a * 2) * (1 - sweep), arm: lerp(lerp(40, 62, rise), 50, sweep),
      lift: 14 * rise * (1 - sweep) + 2 * Math.sin(a) * (1 - sweep), lunge: 4 * sweep, tilt: -0.12 * rise * (1 - sweep) + 0.16 * sweep,
      turn: Math.cos(a) >= 0 ? 1 : -1,
      rig: (r) => {
        if (rise > 0.3 && sweep < 0.6) {
          r.air = true;
          r.frontLeg = [q(1.2), q(-2.2), 8];
          r.backLeg = [q(-1.6), q(-1.2), -10];
        } else {
          r.squat = q(2 * land);
          danceLegs(r, [sweep, [4, 0, 6], [-4, 0, -12]]);
        }
        r.backArm = [q(lerp(lerp(0, -6, rise), -4, sweep)), q(lerp(lerp(-1, -9, rise), -2, sweep))];
        r.hairLift = rise > 0.3 && sweep < 0.5 ? -1 : land > 0.3 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.1, 0.9));
        if (turn > 0 && sweep < 0.2) r.eyes = 'blink';
        if (sweep > 0.3) r.mouth = 'o';
      },
    };
  },
  // Her versions of the Tide Mage's skills.
  // Pearl Shell (Bubble Shield): she cups both hands round the staff's head as if holding a pearl,
  // then lets it go upward and the shell opens round them.
  tcpearlshell(p) {
    const cup = soft(seg(p, 0, 0.34));
    const release = ease(seg(p, 0.38, 0.54));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(40, 30, cup), 14, release) + 26 * back, arm: lerp(lerp(40, 36, cup), 58, release) - 18 * back,
      lift: 2 * release * (1 - back), tilt: 0.06 * cup * (1 - release) - 0.06 * release * (1 - back),
      rig: (r) => {
        danceLegs(r, [release * (1 - back), [1.8, -1.2, 2], [-2, -1, -4]]);
        r.backArm = [q(lerp(lerp(0, 5, cup), -5, release) + 5 * back), q(lerp(lerp(-1, -1, cup), -10, release) + 9 * back)];
        if (cup > 0.4 && release < 0.3) r.eyes = 'half';
        else if (release > 0.3 && back < 0.6) r.mouth = 'cat';
      },
    };
  },
  // Moon Pool (Tide Pool): she sets the staff's foot down and draws a slow circle on the floor
  // round her with it, turning on the spot, and the moonlit pool spreads where it's drawn.
  tcmoonpool(p) {
    const set = soft(seg(p, 0, 0.2));
    const a = soft(seg(p, 0.2, 0.76)) * Math.PI * 2;
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(40, 118, set) - 6 * Math.sin(a) * (1 - back) - 78 * back, arm: lerp(40, 34, set) + 2 * Math.cos(a) + 6 * back,
      lunge: 1 * set * (1 - back), tilt: 0.08 * set * (1 - back),
      turn: Math.cos(a) >= 0 || back > 0 ? 1 : -1,
      rig: (r) => {
        r.squat = q(1.4 * set * (1 - back));
        danceLegs(r, [set * (1 - back), [2.8, 0, 4], [-2.8, 0, -8]]);
        r.backArm = [q(lerp(0, -4, set) * (1 - back)), q(lerp(-1, -5, set) * (1 - back))];
        if (set > 0.5 && back < 0.5) r.eyes = 'half';
      },
    };
  },
  // Moon Pull (Riptide): she sweeps her free hand round low and draws it in like reeling a net, the
  // current pulling them close, then lifts the staff and brings the spring up under them.
  tcpull(p) {
    const reach = soft(seg(p, 0, 0.22));
    const reel = soft(seg(p, 0.22, 0.48));
    const up = ease(seg(p, 0.54, 0.68));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(40, 70, reach) - 40 * up + 30 * back, arm: lerp(40, 46, reach) + 16 * up * (1 - back),
      lift: 3 * up * (1 - back), lunge: 2 * reach * (1 - reel) - 1 * reel + 2 * up * (1 - back), tilt: 0.1 * reach * (1 - reel) - 0.06 * reel - 0.06 * up * (1 - back),
      rig: (r) => {
        r.squat = q(1.8 * reach * (1 - up));
        danceLegs(r, [reach * (1 - up), [3.4, 0, 6], [-3, 0, -10]], [up * (1 - back), [1.8, -1.4, 2], [-2, -1.2, -4]]);
        r.backArm = [q(lerp(lerp(0, 7, reach), 1, reel) * (1 - up) - 4 * up * (1 - back)), q(lerp(lerp(-1, 1, reach), -3, reel) * (1 - up) - 9 * up * (1 - back))];
        r.hairLift = up > 0.3 && back < 0.5 ? -1 : 0;
        if (reel > 0.3 && up < 0.3) r.mouth = 'grit';
        else if (up > 0.3 && back < 0.6) r.mouth = 'o';
      },
    };
  },
  // Silver Wave (Tidal Wave): she sways back with the staff low behind her, then rises in one long
  // lift and sweeps it forward, and the silver wave rears up off the floor.
  tcsilverwave(p) {
    const sway = soft(seg(p, 0, 0.4));
    const lift = ease(seg(p, 0.44, 0.62));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(lerp(40, 130, sway), 64, lift) - 24 * back, arm: lerp(lerp(40, 28, sway), 60, lift) - 20 * back,
      lift: 3 * lift * (1 - back), lunge: -2 * sway * (1 - lift) + 4 * lift * (1 - back), tilt: 0.1 * sway * (1 - lift) - 0.1 * lift * (1 - back),
      rig: (r) => {
        r.squat = q(2.4 * sway * (1 - lift));
        danceLegs(r, [sway * (1 - lift), [3, 0, 6], [-3.4, 0, -14]], [lift * (1 - back), [1.8, -1.4, 2], [-2, -1.2, -4]]);
        r.backArm = [q(lerp(lerp(0, 3, sway), -5, lift) + 5 * back), q(lerp(lerp(-1, 2, sway), -10, lift) + 9 * back)];
        r.hairLift = lift > 0.3 && back < 0.5 ? -1 : 0;
        r.cape = Math.round(-4 * bump(p, 0.44, 0.84));
        if (sway > 0.4 && lift < 0.2) r.eyes = 'half';
        if (lift > 0.3 && back < 0.6) r.mouth = 'o';
      },
    };
  },
  // Lunar Flow (Flow): she turns the staff slowly before her face-up palm, eyes closed, a glint
  // running along it, then opens her eyes and gives it a bright twirl.
  tcflow(p) {
    const hold = soft(seg(p, 0, 0.3)) * (1 - ease(seg(p, 0.56, 0.66)));
    const twirl = ease(seg(p, 0.56, 0.7));
    const back = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(40, 30, hold) + 60 * twirl * (1 - back) + 0 * back, arm: lerp(40, 50, hold) + 6 * twirl * (1 - back),
      lift: 1.2 * hold + 2 * twirl * (1 - back), tilt: 0.04 * hold - 0.04 * twirl * (1 - back),
      rig: (r) => {
        danceLegs(r, [Math.max(hold, twirl * (1 - back)), [1.8, -0.8, 2], [-2, -0.6, -4]]);
        r.backArm = [q(lerp(0, 4, hold) - 4 * twirl * (1 - back)), q(lerp(-1, -5, hold) - 3 * twirl * (1 - back))];
        if (hold > 0.4) r.eyes = 'blink';
        else if (twirl > 0.3 && back < 0.6) r.mouth = 'cat';
      },
    };
  },
  // Silver Tide (Great Wave): she rises on the silver swell with the staff high and the moon behind
  // her, holds it as it towers, and sweeps it down.
  tcsilver(p) {
    const rise = soft(seg(p, 0, 0.36));
    const hold = bump(p, 0.32, 0.62);
    const down = ease(seg(p, 0.58, 0.7));
    const back = soft(seg(p, 0.84, 1));
    return {
      weapon: lerp(lerp(40, 10, rise), 116, down) - 50 * back, arm: lerp(lerp(40, 62, rise), 50, down) - 8 * back,
      lift: 10 * rise * (1 - down) + 1.5 * hold, lunge: 4 * down * (1 - 0.6 * back), tilt: -0.1 * rise * (1 - down) + 0.16 * down * (1 - back),
      rig: (r) => {
        if (rise > 0.3 && down < 0.6) {
          r.air = true;
          r.frontLeg = [q(1.4), q(-2.2), 8];
          r.backLeg = [q(-1.6), q(-1.4), -10];
        } else danceLegs(r, [down * (1 - back), [4, 0, 6], [-4, 0, -12]]);
        r.backArm = [q(lerp(lerp(0, -6, rise), -3, down) + 3 * back), q(lerp(lerp(-1, -10, rise), -2, down) + 1 * back)];
        r.hairLift = rise > 0.3 && down < 0.5 ? -1 : down > 0.4 && back < 0.4 ? 1 : 0;
        r.cape = Math.round(-5 * bump(p, 0.1, 0.84));
        if (hold > 0.4) r.eyes = 'blink';
        if (down > 0.3 && back < 0.5) r.mouth = 'o';
      },
    };
  },
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
  overhead: 0.45, plunge: 0.55, rising: 0.45, spin: 0.42, flip: 0.45, slam: 0.45, castup: 0.5, roar: 0.5,
  guard: 0.45, pray: 0.5, cheer: 0.45, ...LIFE_MIN, ...SOCIAL_MIN, ...EMOTE_MIN, ...VILLAIN_MIN, draw: 0.38, aimshot: 0.5, castspin: 0.45, barrage: 0.4,
  flurry: 0.4, dash: 0.35, vanish: 0.3, cleave: 0.55, cross: 0.45, sweep: 0.4, spinback: 0.45, shove: 0.35, leapchop: 0.6, flashcut: 0.34, drivestab: 0.4, skysplit: 0.9, quickshot: 0.3, bash: 0.4, rampage: 1.3, meteor: 0.4, landslam: 0.3, dashstab: 0.4, verdict: 1.5, eclipse: 1.5, pslash: 0.35, pthrust: 0.35, ascend: 0.45, smite: 0.6, consecrate: 0.8, salute: 0.5, cleave1: 0.45, cleave2: 0.45, gyre: 0.45, reaver: 0.7, warroar: 0.6, axehurl: 0.55, bodyslam: 0.8, dragrise: 0.8, shieldslam: 0.6, shieldrush: 0.8, recklesscharge: 0.85,
  whirlflip: 0.6, 
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
const SHOULDER_END = { spinback: 0.7, rising: 0.44, airslash2: 0.5, guardspin: 0.7, ascend: 0.5, shieldslam: 0.74, dragrise: 0.7, cleave2: 0.7, bodyslam: 0.72 };
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
  // Leaping Chop: landed on one knee, the blade point-down beside her.
  leapchop: [0.66, 0.24, { weapon: 176, arm: 32, lunge: 9, tilt: 0.04 }, (r, k) => { r.squat = q(3 * k); legsTo(r, k, [3.6, 0, 8], [-5.8, 0, -76]); handTo(r, k, [-4, -1]); }],
  // Sky Splitter: she rips the blade out of the crater and sweeps it low behind her, crouched wide
  // and leaning in, free hand forward, ready to go again.
  skysplit: [0.72, 0.22, { weapon: 226, arm: 20, lunge: 10, tilt: 0.14 }, (r, k) => { r.squat = 2; legsTo(r, k, [5, 0, 10], [-5, 0, -10]); handTo(r, k, [4, 0]); }],
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
  // dart (the Thunderguard): quick low darting steps, the weight thrown into the blow and a light
  // spring back onto the toes; no big hops, it's the strike that's explosive.
  dart: { air: [[2.4, -3.4, 14], [-2.4, -3, -40]], plant: [[4.6, 0, 6], [-4.4, 0, -12]], squat: 1.6, lean: 0.12, b: 0.8, hk: 1.3 },
  // skim (the Tempest): fast low glides into each blow, barely leaving the floor, the weight
  // always forward; the next step starts before the last has settled.
  skim: { air: [[3, -2, 10], [-3, -1.6, -30]], plant: [[5, 0, 8], [-5, 0, -16]], squat: 1.2, lean: 0.16, b: 0.6, hk: 1.1 },
  // plant (the Stormwall): no hops; one heavy stamp into the blow and a deep settle after.
  plant: { air: [[2.8, -3, 16], [-3, 0, -8]], plant: [[5, 0, 8], [-5, 0, -14]], squat: 2.4, lean: 0.08, b: 0.5, hk: 1.4 },
};
const FOOTWORK = {
  // The Stormwall.
  bwbrace: { s: 'plant', beats: [[null, 1.5]], drive: 3 },
  bwreturn: { s: 'plant', beats: [[0.5, 1]], pre: 0.3 },
  bwcleave: { s: 'plant', beats: [[null, 2]], drive: 4, b: 0.6 },
  bwbolt: { s: 'plant', beats: [[0.62, 2]], pre: 0.3, b: 0.7 },
  bwshove: { s: 'plant', beats: [[null, 1.5]], drive: 7, lean: 0.14 },
  bwpull: { s: 'plant', beats: [[null, 0]] },
  bwguardcut: { s: 'plant', beats: [[null, 0]], b: 0.6 },
  bwcage: { s: 'plant', beats: [[0.56, 0]], b: 0.6 },
  bwdouble: { s: 'plant', beats: [[0.36, 1], [0.7, 2]], pre: 0.16, drive: 3, b: 0.6 },
  bwslam: { s: 'plant', beats: [[0.58, 2]], pre: 0.3, b: 0.7 },
  bwsweep: { s: 'plant', beats: [[0.72, 1]], pre: 0.2, b: 0.6 },
  bwcharge: { s: 'plant', beats: [[null, 0]], drive: 6 },
  bwraincleave: { s: 'plant', beats: [[0.58, 2]], pre: 0.2, drive: 5, b: 0.7 },
  bwclapmv: { s: 'plant', beats: [[0.56, 0]], b: 0.7 },
  bwfall: { s: 'plant', beats: [[0.62, 0]], b: 0.8, settleAt: 0.9 },
  bwfortress: { s: 'plant', beats: [[0.42, 0]], b: 0.6, settleAt: 0.92 },
  // The Tempest.
  tpstreak: { s: 'skim', beats: [[null, 2]], drive: 7 },
  tpdouble: { s: 'skim', beats: [[0.28, 1.5], [0.6, 1.5]], pre: 0.1, drive: 4, b: 0.6 },
  tpflash: { s: 'skim', beats: [[null, 0]], drive: 8 },
  tpturn: { s: 'skim', beats: [[0.5, 2]], pre: 0.2 },
  tplift: { s: 'skim', beats: [[null, 0]], b: 0.9 },
  tpjabs: { s: 'skim', beats: [[0.2, 1], [0.42, 1], [0.64, 1.5]], pre: 0.08, drive: 5, b: 0.6 },
  tpcross: { s: 'skim', beats: [[0.3, 1.5], [0.6, 1.5]], pre: 0.1, drive: 5 },
  tpsweep: { s: 'skim', beats: [[null, 0]], drive: 6 },
  tplunge: { s: 'skim', beats: [[null, 1]], drive: 10 },
  tpblink: { s: 'skim', beats: [[0.6, 0]], b: 1.1, settleAt: 0.88 },
  tpwhirl: { s: 'skim', beats: [[0.66, 2]], pre: 0.2, b: 1 },
  tpdive: { s: 'skim', beats: [[0.58, 0]], b: 1.2 },
  tpdash: { s: 'skim', beats: [[null, 0]], drive: 8 },
  tpslam: { s: 'skim', beats: [[0.5, 0]], b: 1.1 },
  tpstep: { s: 'skim', beats: [[0.6, 0]], b: 0.9 },
  tparc: { s: 'skim', beats: [[0.3, 1.5], [0.62, 1.5]], pre: 0.12, drive: 4 },
  tprush: { s: 'skim', beats: [[0.62, 0]], b: 1 },
  tpcleave: { s: 'skim', beats: [[0.48, 2]], pre: 0.2, drive: 6, b: 1.1 },
  tpclap: { s: 'skim', beats: [[0.44, 1.5]], pre: 0.2, b: 1 },
  tpfall: { s: 'skim', beats: [[0.6, 0]], b: 1.2, settleAt: 0.9 },
  // The Thunderguard.
  tgcut: { s: 'dart', beats: [[null, 3]], drive: 5 },
  tgreturn: { s: 'dart', beats: [[0.52, 3]], pre: 0.3 },
  tgflick: { s: 'dart', beats: [[0.3, 2], [0.62, 2]], pre: 0.12, drive: 3, b: 0.7 },
  tglunge: { s: 'dart', beats: [[null, 2]], drive: 8 },
  tgbash: { s: 'dart', beats: [[null, 2]], drive: 8, lean: 0.14 },
  tgsweep: { s: 'dart', beats: [[null, 0]], drive: 4 },
  tgdrive: { s: 'dart', beats: [[null, 2]], drive: 10 },
  tgrise: { s: 'dart', beats: [[null, 0]], b: 1.2 },
  tgspin: { s: 'dart', beats: [[0.6, 3]], pre: 0.3 },
  tgstrike: { s: 'dart', beats: [[0.56, 0]], b: 1.3, settleAt: 0.88 },
  tgclap: { s: 'dart', beats: [[0.56, 3]], pre: 0.3, drive: 4, b: 1.3 },
  tgstorm: { s: 'dart', beats: [[0.7, 0]], b: 1.2 },
  tgflash: { s: 'dart', beats: [[null, 0]], drive: 6 },
  tgslam: { s: 'dart', beats: [[0.56, 0]], b: 1.3 },
  tgrush: { s: 'dart', beats: [[0.62, 0]], b: 1 },
  tgcleave: { s: 'dart', beats: [[0.58, 3]], pre: 0.2, drive: 6, b: 1.3 },
  tgthunderclap: { s: 'dart', beats: [[0.5, 2]], pre: 0.25, b: 1.2 },
  tgguard: { s: 'dart', beats: [[0.3, 1]], pre: 0.2, b: 0.8 },
  tgfall: { s: 'dart', beats: [[0.62, 0]], b: 1.3, settleAt: 0.9 },
  // The Warrior.
  sweep: { s: 'skip', beats: [[null, 4]], drive: 6 },
  flashcut: { s: 'skip', beats: [[null, 5]], drive: 8 },
  spinback: { s: 'skip', beats: [[0.58, 3]], pre: 0.3 },
  shove: { s: 'skip', beats: [[null, 3]], drive: 7, lean: 0.12 },
  drivestab: { s: 'skip', beats: [[null, 4]], drive: 10 },
  leapchop: { s: 'skip', beats: [[0.55, 6]], pre: 0.45, b: 1.3 },
  skysplit: { s: 'skip', beats: [[0.6, 0]], b: 1.5 },
  plunge: { s: 'skip', beats: [[0.56, 0]], b: 1.4 },
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
  rampage: { s: 'bound', beats: [[0.064, 2], [0.227, 4], [0.384, 4], [0.724, 0]], pre: 0.12, b: 1.4 },
  bkeclipse: { s: 'bound', beats: [[0.68, 0]], b: 1.2, settleAt: 0.86 },
  // (His own Titan Breaker and Whirlwind: data/path-skills.js.)
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

