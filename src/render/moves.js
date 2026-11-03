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

// The Spirit Mage's dance is slow and flowing, so it eases in and out of every phase (a sine
// in-out, never the snap of a strike), and her legs glide between stances: `danceLegs` starts
// from standing and blends toward each [weight, frontLeg, backLeg] in turn. Held poses breathe
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

// The Spirit Mage's dance figures (render/scene.js gives them a longer, softer blend in and out).
export const DANCE_MOVES = new Set(['kagura', 'kaguraturn', 'kagurafin', 'bellshake', 'sleevefan', 'bowrise', 'twirlstep', 'kaguraup', 'floatcast', 'floatcast2', 'glidecast', 'spiritstep', 'kaguraslam', 'kagurabless', 'kaguraward', 'kaguralantern']);

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

  // An uppercut: crouch low, then launch upward with the blade rising.
  rising(p) {
    if (p < 0.25) {
      const t = ease(p / 0.25);
      return { weapon: lerp(30, 160, t), arm: lerp(60, 20, t), rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [1, 1]; } };
    }
    const up = ease(seg(p, 0.25, 0.55));
    const down = seg(p, 0.6, 1);
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
      return { weapon: lerp(-58, -182, t), arm: lerp(48, 14, t), tilt: 0.06 * t, rig: (r) => { r.squat = 2 * t; wideLegs(r); r.backArm = [2, 0]; } };
    }
    if (p < 0.4) {
      const breath = Math.sin(p * dur * 6) * 0.3;
      return { weapon: -182, arm: 14, tilt: 0.08, lunge: breath, rig: (r) => { r.squat = 3; r.frontLeg = [2.5, 0, 6]; r.backLeg = [-2, 1, -16]; r.backArm = [2, 1]; r.eyes = 'blink'; } };
    }
    if (p < 0.55) {
      const t = ease(seg(p, 0.4, 0.55));
      return { weapon: lerp(-182, -96, t), arm: lerp(14, 40, t), lift: 10 * t, tilt: lerp(0.08, -0.08, t), rig: (r) => { r.frontLeg = [1.5, -1, 4]; r.backLeg = [-2, -1, -6]; r.air = t > 0.3; r.backArm = [-2, -4]; r.hairLift = -1; r.cape = -3; } };
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
    return { ...m, lunge: 0, rig: (r) => { m.rig?.(r); tuck(r); r.squat = 0; r.hairLift = -1; } };
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

  // Piqué cut (opener, hits at ~0.4): she dips, ring drawn low behind, then steps up onto her front
  // toe and sweeps the ring up and out in one long curve, the back leg lifting into attitude and the
  // free arm opening behind her; she holds the line a beat, then comes down.
  wdpique(p) {
    const prep = soft(seg(p, 0, 0.3));
    const cut = ease(seg(p, 0.28, 0.5));
    const down = soft(seg(p, 0.72, 1));
    const up = cut * (1 - down);
    return {
      weapon: lerp(lerp(165, 205, prep), 92, cut) + 20 * down, arm: lerp(lerp(55, 35, prep), 90, cut) - 25 * down,
      lift: 3 * up, lunge: -2 * prep * (1 - cut) + 7 * up, tilt: -0.08 * prep * (1 - cut) + 0.06 * up, trail: p > 0.28 && p < 0.6,
      rig: (r) => {
        r.squat = q(prep * (1 - cut));
        r.backArm = [q(lerp(2, -7, up)), q(lerp(-2, -7, up))];
        r.hairLift = up > 0.3 ? -1 : 0;
        r.cape -= q(4 * up);
        danceLegs(r, [prep * (1 - cut), [1.6, 0, 4], [-1.6, 0, -6]], [up, [3, -2.4, 12], [-4.6, -4.4, -48]]);
        if (up > 0.3) strikeFace(r);
      },
    };
  },
  // Pirouette cut (second, hits at ~0.5): a quick plié, then one clean turn on her toe, the ring held
  // out at arm's length sweeping right round her, the free arm raised over her head and the working
  // foot drawn up to her knee; she opens out of it with both arms wide.
  wdspin(p) {
    const prep = soft(seg(p, 0, 0.18));
    const a = ease(seg(p, 0.16, 0.74));
    const open = soft(seg(p, 0.72, 1));
    const turning = a > 0 && a < 1;
    return {
      weapon: lerp(160, 100, prep) + 8 * Math.sin(a * Math.PI * 2), arm: lerp(60, 84, prep) + 6 * open,
      turn: Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))),
      lift: 4 * bump(p, 0.16, 0.76), trail: turning,
      rig: (r) => {
        r.squat = q(prep * (1 - a) * 1.5);
        r.backArm = turning ? [0, -10] : [q(lerp(2, -7, open)), q(lerp(-2, -5, open))];
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(5 * bump(p, 0.16, 0.76));
        danceLegs(r, [prep * (1 - a), [1.6, 0, 4], [-1.6, 0, -6]], [turning ? 1 : 0, [1.2, -5, 40], [-0.4, -1.4, -4]], [open, [3, 0, 6], [-3.4, 0, -12]]);
        if (turning) strikeFace(r);
      },
    };
  },
  // Arabesque (third, hits at ~0.25 and ~0.5): she tips forward into an arabesque, the back leg
  // stretched high behind her and the ring thrust out in front, then flicks the ring round in a
  // figure of eight for a second cut before rising out of it.
  wdarabesque(p) {
    const into = ease(seg(p, 0, 0.24));
    const fig = seg(p, 0.26, 0.5);
    const rise = soft(seg(p, 0.66, 1));
    const hold = into * (1 - rise);
    return {
      weapon: lerp(160, 92, into) + 45 * Math.sin(fig * Math.PI) * (1 - rise) + 40 * rise, arm: lerp(50, 90, into) - 22 * Math.sin(fig * Math.PI) * (1 - rise) - 20 * rise,
      tilt: 0.28 * hold, lunge: 6 * hold, lift: 2 * hold, trail: p > 0.1 && p < 0.55,
      rig: (r) => {
        r.backArm = [q(lerp(0, -6, hold)), q(lerp(-2, -9, hold))];
        r.cape -= q(4 * hold);
        r.hairLift = hold > 0.4 ? 1 : 0;
        danceLegs(r, [hold, [2, -1.4, 8], [-6.4, -6.6, -74]]);
        if (hold > 0.4) strikeFace(r);
      },
    };
  },
  // Fouetté (the finish, the gust leaves at ~0.4): a deep plié with the ring drawn right back, then
  // she whips round on one toe, the working leg kicking out and in, and flings the ring forward out
  // of the turn; she ends in a big pose, ring arm high and forward, free arm raised, chin up: ta-da.
  wdfouette(p) {
    const wind = soft(seg(p, 0, 0.24));
    const a = ease(seg(p, 0.22, 0.42));
    const pose = soft(seg(p, 0.44, 0.62));
    const end = soft(seg(p, 0.9, 1));
    const turning = a > 0 && a < 1;
    const held = pose * (1 - end);
    return {
      weapon: turning ? 100 : lerp(lerp(160, 220, wind), 104, pose) + 50 * end, arm: turning ? 80 : lerp(lerp(55, 30, wind), 80, pose) - 30 * end,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 5 * bump(p, 0.2, 0.46) + 2 * held + breathe(p) * 0.6 * held, tilt: -0.1 * wind * (1 - a) - 0.06 * held, lunge: -3 * wind * (1 - a) + 4 * held, trail: p > 0.2 && p < 0.5,
      rig: (r) => {
        r.squat = q(2 * wind * (1 - a));
        r.backArm = turning ? [3, -6] : [q(lerp(2, -2, held)), q(lerp(-1, -11, held))];
        r.hairLift = turning || held > 0.5 ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.2, 0.6));
        danceLegs(r, [wind * (1 - a), [2.4, 0, 6], [-2.4, 0, -8]], [turning ? 1 : 0, [6, -4.6, 66], [-0.4, -1.4, -4]], [held, [2.6, -1.4, 10], [-4.4, -1.2, -30]]);
        if (turning || held > 0.4) strikeFace(r);
      },
    };
  },
  // Chassé cut (opener): a gliding chase step forward, feet meeting in the air, the ring sweeping low
  // and level out in front.
  wdchasse(p) {
    const glide = soft(seg(p, 0, 0.6));
    const cut = ease(seg(p, 0.25, 0.5));
    const settle = soft(seg(p, 0.7, 1));
    const meet = bump(p, 0.15, 0.55);
    return {
      weapon: lerp(195, 110, cut) - 15 * settle, arm: lerp(30, 85, cut) - 15 * settle, lunge: 9 * glide * (1 - settle * 0.5), lift: 4 * meet, trail: p > 0.22 && p < 0.55,
      rig: (r) => {
        r.backArm = [q(-6 * cut), q(-4 - 2 * cut)];
        r.cape -= q(4 * glide);
        danceLegs(r, [meet, [1.2, -2.6, 20], [-0.6, -2.4, -16]], [settle, [2.8, 0, 6], [-2.4, 0, -10]]);
        if (cut > 0.3 && settle < 0.5) strikeFace(r);
      },
    };
  },
  // Fan kick (second): her working leg sweeps up and over in a big arc, the ring following the leg
  // round, her body leaning back away from it.
  wdfankick(p) {
    const k = ease(seg(p, 0.12, 0.6));
    const back = soft(seg(p, 0.66, 1));
    const arc = Math.sin(k * Math.PI);
    return {
      weapon: lerp(170, 90, k) + 70 * back, arm: lerp(55, 92, k) - 40 * back, tilt: -0.14 * arc, lift: 2 * arc, trail: p > 0.12 && p < 0.62,
      rig: (r) => {
        r.backArm = [q(-7 * arc), q(-3 - 4 * arc)];
        r.hairLift = arc > 0.4 ? 1 : 0;
        r.cape -= q(3 * arc);
        danceLegs(r, [arc, [5.4, -6.4, 84], [-0.6, -1, -4]], [back, [2.6, 0, 6], [-2.4, 0, -10]]);
        if (arc > 0.4) strikeFace(r);
      },
    };
  },
  // Grand jeté (third): a leap forward into the splits, arms and ring raised high, and the ring cuts
  // down as she lands.
  wdjete(p) {
    const up = bump(p, 0.08, 0.6);
    const split = soft(seg(p, 0.12, 0.32)) * (1 - soft(seg(p, 0.48, 0.6)));
    const cut = ease(seg(p, 0.44, 0.6));
    const land = bump(p, 0.58, 0.9);
    return {
      weapon: lerp(lerp(150, 78, soft(seg(p, 0, 0.3))), 170, cut), arm: lerp(lerp(60, 86, soft(seg(p, 0, 0.3))), 60, cut), lift: 18 * up, lunge: 10 * soft(seg(p, 0.08, 0.6)), tilt: 0.06 * split, trail: p > 0.42 && p < 0.64,
      rig: (r) => {
        if (up > 0.2) r.air = true;
        r.squat = q(1.5 * land);
        r.backArm = [q(-7 * split), q(-7 * split - 2)];
        r.hairLift = up > 0.3 ? -1 : 0;
        r.cape -= q(5 * up);
        danceLegs(r, [split, [7, -2.4, 72], [-7, -2.4, -72]], [land, [3, 0, 6], [-3, 0, -12]]);
        if (cut > 0.2) strikeFace(r);
      },
    };
  },
  // Chaînés (a finish, and her Pirouette and dash): quick chained turns travelling forward, the ring
  // trailing round her at arm's length, and she comes out of them into a révérence, a little bow.
  wdchaine(p, dur) {
    const turns = dur > 0.55 ? 2 : 1;
    const a = ease(seg(p, 0.06, 0.7)) * turns;
    const bow = soft(seg(p, 0.72, 0.9)) * (1 - soft(seg(p, 0.95, 1)));
    const turning = p > 0.06 && p < 0.7;
    return {
      weapon: turning ? 100 : lerp(120, 165, bow), arm: turning ? 84 : lerp(80, 40, bow),
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 2 * bump(p, 0.06, 0.7), tilt: 0.22 * bow, trail: turning,
      rig: (r) => {
        r.backArm = turning ? [-4, -6] : [q(-6 * bow), q(-3 * bow)];
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(3 * bump(p, 0.06, 0.7));
        danceLegs(r, [turning ? 1 : 0, [0.6, -1.6, 8], [-0.6, -1.6, -8]], [bow, [3.4, 0, 14], [-1.6, 0, -4]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning) strikeFace(r);
      },
    };
  },
  // Port de bras push (gloves, opener): both arms gather in to her chest, then open and push forward
  // with a step, palms out, sending the gust.
  wdpalm(p) {
    const gather = soft(seg(p, 0, 0.3));
    const push = ease(seg(p, 0.3, 0.46));
    const back = soft(seg(p, 0.7, 1));
    const out = push * (1 - back);
    return {
      weapon: 60, arm: lerp(lerp(30, 45, gather), 96, push) - 40 * back, lunge: -2 * gather * (1 - push) + 6 * out, tilt: 0.1 * out,
      rig: (r) => {
        r.backArm = [q(lerp(lerp(0, 3, gather), 6, push) * (1 - back)), q(lerp(-2, -6, gather) * (1 - push) - 5 * out)];
        r.squat = q(gather * (1 - push));
        r.cape -= q(3 * out);
        danceLegs(r, [out, [3.6, 0, 6], [-3.4, -1, -16]]);
        if (out > 0.3) strikeFace(r);
      },
    };
  },
  // Rond de bras (gloves, second): her lead arm circles up over her head and comes down forward like
  // a wing, the body swaying with it, the back leg extending behind.
  wdrond(p) {
    const c = ease(seg(p, 0.1, 0.55));
    const back = soft(seg(p, 0.7, 1));
    const ang = c < 0.5 ? lerp(40, 138, c * 2) : lerp(138, 92, (c - 0.5) * 2);
    return {
      weapon: 60, arm: lerp(ang, 50, back), tilt: -0.1 * Math.sin(c * Math.PI) + 0.08 * c * (1 - back), lunge: 4 * c * (1 - back), lift: 2 * Math.sin(c * Math.PI),
      rig: (r) => {
        r.backArm = [q(-4 * Math.sin(c * Math.PI)), q(-3 - 8 * Math.sin(c * Math.PI))];
        r.hairLift = c > 0.3 && c < 0.8 ? -1 : 0;
        danceLegs(r, [c * (1 - back), [2.4, -1, 8], [-5, -3.4, -44]]);
        if (c > 0.4 && back < 0.5) strikeFace(r);
      },
    };
  },
  // Relevé (gloves, third, and her up command): she rises right onto her toes, sweeping both arms up
  // over her head to lift the wind and whatever is in it.
  wdrise(p) {
    const up = ease(seg(p, 0.12, 0.45));
    const down = soft(seg(p, 0.68, 1));
    const held = up * (1 - down);
    return {
      weapon: lerp(60, 30, up), arm: lerp(lerp(40, 25, soft(seg(p, 0, 0.12))), 116, up) - 76 * down, lift: 6 * held, tilt: -0.1 * held, trail: p > 0.12 && p < 0.5,
      rig: (r) => {
        r.squat = q(soft(seg(p, 0, 0.12)) * (1 - up));
        r.backArm = [q(-1 * held), q(-11 * held)];
        r.hairLift = held > 0.4 ? -1 : 0;
        r.cape -= q(4 * held);
        danceLegs(r, [held, [0.6, -2, 6], [-0.6, -2, -6]]);
        if (held > 0.4) strikeFace(r);
      },
    };
  },
  // Grand port de bras (gloves, finish): a pirouette with both arms flung wide, then she opens into
  // a big pose, arms up and out, and the swirl of ribbons bursts round her.
  wdflourish(p) {
    const a = ease(seg(p, 0.1, 0.5));
    const pose = soft(seg(p, 0.5, 0.66)) * (1 - soft(seg(p, 0.9, 1)));
    const turning = a > 0 && a < 1;
    return {
      weapon: 60, arm: turning ? 96 : lerp(60, 118, pose), orbit: false,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 4 * bump(p, 0.1, 0.52) + 2 * pose, tilt: -0.06 * pose,
      rig: (r) => {
        r.backArm = turning ? [-8, -5] : [q(-6 * pose), q(-2 - 9 * pose)];
        r.hairLift = turning || pose > 0.5 ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.1, 0.66));
        danceLegs(r, [turning ? 1 : 0, [1.2, -5, 40], [-0.4, -1.4, -4]], [pose, [2.8, -1.4, 10], [-4, -1, -26]]);
        if (turning || pose > 0.4) strikeFace(r);
      },
    };
  },
  // Lunge push (gloves, a finish): a twist away, then a deep lunge forward with both palms driven out
  // after the gust.
  wdlunge(p) {
    const twist = soft(seg(p, 0, 0.36));
    const drive = ease(seg(p, 0.36, 0.52));
    const back = soft(seg(p, 0.76, 1));
    const out = drive * (1 - back);
    return {
      weapon: 60, arm: lerp(lerp(40, 20, twist), 92, drive) - 40 * back, lunge: -4 * twist * (1 - drive) + 9 * out, tilt: -0.12 * twist * (1 - drive) + 0.14 * out,
      rig: (r) => {
        r.backArm = [q(lerp(3, 7, out)), q(-3 - 3 * out)];
        r.squat = q(1.5 * out + twist * (1 - drive));
        r.hairLift = out > 0.4 ? 1 : 0;
        r.cape -= q(5 * out);
        danceLegs(r, [out, [4.6, 0, 6], [-4.6, 0, -14]]);
        if (out > 0.3) strikeFace(r);
      },
    };
  },
  // In the air: a turning cut (she hangs a moment), and a split that cuts down as she drops.
  wdairspin(p) {
    const a = ease(seg(p, 0.05, 0.8));
    return {
      weapon: 100, arm: 86, trail: p > 0.05 && p < 0.82,
      turn: Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))),
      rig: (r) => { r.air = true; r.backArm = [-5, -7]; r.hairLift = -1; danceLegs(r, [1, [2.4, -4, 30], [-2.4, -2, -30]]); strikeFace(r); },
    };
  },
  wdairsplit(p) {
    const split = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.6, 0.8)));
    const cut = ease(seg(p, 0.3, 0.55));
    return {
      weapon: lerp(78, 170, cut), arm: lerp(86, 60, cut), trail: p > 0.28 && p < 0.6,
      rig: (r) => { r.air = true; r.backArm = [q(-7 * split), q(-7 * split - 2)]; r.hairLift = -1; danceLegs(r, [split, [7, -2.4, 72], [-7, -2.4, -72]]); if (cut > 0.2) strikeFace(r); },
    };
  },
  // Grand Finale (her finisher, 1.5 s): she rises onto her toes as the spotlight drops, spins three
  // times with her arms rising like a music-box dancer, opens into her biggest pose, both arms up, as
  // the rose of ribbons bursts, then sinks into a deep bow to the crowd.
  wdencore(p) {
    const rise = soft(seg(p, 0, 0.14));
    const a = ease(seg(p, 0.12, 0.66)) * 3;
    const pose = soft(seg(p, 0.66, 0.74)) * (1 - soft(seg(p, 0.84, 0.9)));
    const bow = soft(seg(p, 0.86, 0.95)) * (1 - soft(seg(p, 0.98, 1)));
    const turning = p > 0.12 && p < 0.66;
    const armsUp = soft(seg(p, 0.12, 0.6));
    return {
      weapon: turning ? lerp(100, 60, armsUp) : lerp(lerp(60, 30, pose), 165, bow), arm: turning ? lerp(80, 128, armsUp) : lerp(lerp(60, 135, pose), 40, bow),
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 3 * rise * (1 - bow) + 4 * pose + breathe(p) * 0.5 * pose, tilt: 0.3 * bow - 0.08 * pose, trail: turning,
      rig: (r) => {
        r.backArm = turning ? [q(-3 * armsUp), q(-4 - 7 * armsUp)] : [q(-3 * pose - 6 * bow), q(-11 * pose - 2 * bow)];
        r.hairLift = turning || pose > 0.4 ? -1 : 0;
        r.cape -= q(5 * (turning ? 1 : pose));
        danceLegs(r, [rise * (1 - bow), [0.6, -2, 6], [-0.6, -2, -6]], [turning ? 1 : 0, [1.2, -5, 40], [-0.4, -1.6, -4]], [pose, [2.6, -1.4, 10], [-3.6, -1.2, -24]], [bow, [3.4, 0, 14], [-1.6, 0, -4]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning || pose > 0.3) strikeFace(r);
      },
    };
  },

  // ---------- The Blade Dancer's moves (her own; docs/design/blade-dancer.md) ----------
  // A ring-throwing showgirl: every figure is a throw or a catch. The ring leaves her hand on the
  // release frame (`thrown`, so the hand is empty while it flies) and comes home on a turn. Throws
  // stay low or sidearm so neither the ring nor her arm crosses her face; the free arm always
  // finishes the line, and every figure ends in a held, showy pose.

  // Backhand flick (opener, the ring leaves at ~0.34 and is caught back at ~0.86): the ring drawn
  // back to her hip, then flicked out with a snap of the wrist and a step; her open hand holds the
  // line out front while it flies, and she plucks it out of the air coming home.
  bdflick(p) {
    const wind = soft(seg(p, 0, 0.3));
    const flick = ease(seg(p, 0.3, 0.42));
    const catchIt = soft(seg(p, 0.82, 0.95));
    return {
      weapon: lerp(lerp(160, 215, wind), 100, flick), arm: lerp(lerp(50, 22, wind), 76, flick) - 6 * catchIt,
      thrown: rel(p, 0.34, 0.86), lunge: -2 * wind * (1 - flick) + 5 * flick * (1 - catchIt * 0.5), tilt: -0.07 * wind * (1 - flick) + 0.06 * flick,
      rig: (r) => {
        r.backArm = [q(lerp(3, -6, flick)), q(lerp(-2, -6, flick))];
        r.squat = q(wind * (1 - flick));
        r.cape -= q(3 * flick);
        danceLegs(r, [wind * (1 - flick), [1.4, 0, 4], [-1.6, 0, -6]], [flick, [3.4, -0.6, 8], [-3.6, -2, -24]]);
        if (flick > 0.3 && p < 0.8) strikeFace(r);
      },
    };
  },
  // Cross toss (second, two rings at ~0.3 and ~0.5): a ring flung low from each hand so they cross
  // in front of her, her arms ending crossed and then sprung open like a fan.
  bdcross(p) {
    const one = ease(seg(p, 0.18, 0.32));
    const two = ease(seg(p, 0.38, 0.52));
    const open = soft(seg(p, 0.6, 0.85));
    return {
      weapon: lerp(200, 110, one), arm: lerp(35, 74, one) - 16 * open, thrown: rel(p, 0.3, 0.92),
      lunge: 3 * one, tilt: 0.05 * one - 0.04 * open,
      rig: (r) => {
        r.backArm = [q(lerp(-4, 7, two) - 12 * open), q(lerp(-2, -5, two) - 2 * open)];
        r.cape -= q(3 * one);
        danceLegs(r, [one, [2.6, 0, 6], [-2.2, -1, -14]], [open, [1.6, -1.4, 10], [-3, 0, -10]]);
        if (one > 0.4) strikeFace(r);
      },
    };
  },
  // Turning catch (third, cuts all round her at ~0.5): she turns on her toe to meet the ring coming
  // home and catches it out at arm's length, its spin carrying it round her once before it stops.
  bdcatch(p) {
    const a = ease(seg(p, 0.1, 0.62));
    const turning = a > 0 && a < 1;
    const settle = soft(seg(p, 0.66, 1));
    return {
      weapon: 100 + 10 * Math.sin(a * Math.PI * 2), arm: 82 + 6 * settle, thrown: rel(p, 0, 0.42),
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 3 * bump(p, 0.1, 0.64), trail: p > 0.42 && p < 0.66,
      rig: (r) => {
        r.backArm = turning ? [0, -9] : [q(-6 * settle), q(-3 - 3 * settle)];
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.1, 0.66));
        danceLegs(r, [turning ? 1 : 0, [1.2, -4.4, 34], [-0.4, -1.4, -4]], [settle, [3, 0, 6], [-3, -1, -16]]);
        if (turning) strikeFace(r);
      },
    };
  },
  // Sidearm hurl (the finish, the ring leaves at ~0.45): a deep lunge back with the ring drawn
  // right round behind her hip, then the whole body unwinds and hurls it sidearm down the line; she
  // ends stretched long after it, free arm raised behind: a showgirl's flourish.
  bdhurl(p) {
    const coil = soft(seg(p, 0, 0.36));
    const hurl = ease(seg(p, 0.36, 0.48));
    const pose = soft(seg(p, 0.5, 0.66)) * (1 - soft(seg(p, 0.9, 1)));
    return {
      weapon: lerp(lerp(170, 245, coil), 96, hurl), arm: lerp(lerp(45, 15, coil), 96, hurl) - 6 * pose, thrown: rel(p, 0.45, 1.01),
      lunge: -4 * coil * (1 - hurl) + 9 * hurl * (1 - soft(seg(p, 0.9, 1)) * 0.6), tilt: -0.12 * coil * (1 - hurl) + 0.16 * hurl - 0.08 * pose,
      rig: (r) => {
        r.squat = q(1.5 * coil * (1 - hurl) + 1.5 * hurl * (1 - pose));
        r.backArm = [q(lerp(4, -5, hurl) - 2 * pose), q(lerp(-2, -4, hurl) - 7 * pose)];
        r.hairLift = hurl > 0.4 ? 1 : 0;
        r.cape -= q(5 * hurl);
        danceLegs(r, [coil * (1 - hurl), [2, 0, 6], [-3, 0, -10]], [hurl, [4.6, 0, 6], [-5, -2, -30]], [pose, [3.6, -1, 10], [-5.4, -4, -50]]);
        if (hurl > 0.3) strikeFace(r);
      },
    };
  },
  // Skimming throw (opener): she drops low and skims the ring along just over the ground.
  bdskip(p) {
    const low = soft(seg(p, 0, 0.3));
    const go = ease(seg(p, 0.3, 0.44));
    const up = soft(seg(p, 0.75, 1));
    return {
      weapon: lerp(lerp(150, 200, low), 115, go), arm: lerp(lerp(45, 25, low), 70, go), thrown: rel(p, 0.4, 0.88),
      lunge: 6 * go * (1 - up * 0.5), tilt: 0.12 * low * (1 - up),
      rig: (r) => {
        r.squat = q(2 * low * (1 - up));
        r.backArm = [q(-6 * go), q(-3 - 2 * go)];
        danceLegs(r, [low * (1 - up), [3.4, 0, 4], [-3.6, 0, -6]]);
        if (go > 0.3 && up < 0.5) strikeFace(r);
      },
    };
  },
  // Lasso (second): the ring swung low at her side like a pendulum, faster and wider each pass, then
  // let fly forward off the top of a swing.
  bdlasso(p) {
    const wind = seg(p, 0, 0.5);
    const go = ease(seg(p, 0.5, 0.6));
    const back = soft(seg(p, 0.8, 1));
    const swing = 180 + (30 + 35 * wind) * Math.sin(wind * wind * Math.PI * 5);
    return {
      weapon: lerp(swing, 100, go), arm: lerp(20 + 6 * wind, 78, go) - 20 * back, thrown: rel(p, 0.55, 0.92),
      lunge: 4 * go, tilt: -0.05 * wind * (1 - go) + 0.06 * go,
      rig: (r) => {
        r.backArm = [q(lerp(2, -6, go)), q(lerp(-6, -4, go))];
        r.cape -= q(2 * wind);
        danceLegs(r, [wind * (1 - go), [1, 0, 4], [-1.4, -1, -10]], [go, [3, 0, 6], [-3, -1, -16]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // Lob (third, and her up command): an underhand lob that sends the ring arcing up over them.
  bdlob(p) {
    const dip = soft(seg(p, 0, 0.26));
    const lob = ease(seg(p, 0.26, 0.42));
    const down = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(165, 200, dip), 80, lob), arm: lerp(lerp(40, 15, dip), 96, lob) - 50 * down, thrown: rel(p, 0.33, 0.9),
      lift: 3 * lob * (1 - down), tilt: -0.08 * lob * (1 - down),
      rig: (r) => {
        r.squat = q(1.5 * dip * (1 - lob));
        r.backArm = [q(-5 * lob), q(-2 - 6 * lob * (1 - down))];
        r.hairLift = lob > 0.4 && down < 0.5 ? -1 : 0;
        danceLegs(r, [dip * (1 - lob), [1.6, 0, 4], [-1.6, 0, -6]], [lob * (1 - down), [0.6, -2, 6], [-0.6, -2, -6]]);
        if (lob > 0.3) strikeFace(r);
      },
    };
  },
  // Spinning hurl (a finish): two quick turns with the ring swinging out at her waist, and she lets
  // it go out of the second, ending on one foot, arms wide.
  bdspinhurl(p) {
    const a = ease(seg(p, 0.06, 0.5)) * 2;
    const turning = p > 0.06 && p < 0.5;
    const pose = soft(seg(p, 0.5, 0.64)) * (1 - soft(seg(p, 0.9, 1)));
    return {
      weapon: turning ? 100 : 96, arm: turning ? 84 : 92 - 4 * pose, thrown: rel(p, 0.46, 1.01),
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 3 * bump(p, 0.06, 0.5) + 2 * pose, trail: p > 0.06 && p < 0.48,
      rig: (r) => {
        r.backArm = turning ? [-6, -4] : [q(-8 * pose), q(-3 - 5 * pose)];
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.06, 0.64));
        danceLegs(r, [turning ? 1 : 0, [0.8, -1.6, 8], [-0.8, -1.6, -8]], [pose, [2.4, -1.6, 12], [-4.6, -3.6, -46]]);
        if (turning || pose > 0.3) strikeFace(r);
      },
    };
  },
  // In the air: a downward flick of the ring at whatever is below.
  bdairflick(p) {
    const go = ease(seg(p, 0.2, 0.42));
    return {
      weapon: lerp(60, 150, go), arm: lerp(80, 130 - 70, go), thrown: rel(p, 0.4, 0.95),
      rig: (r) => { r.air = true; r.backArm = [q(-5 * go), q(-6)]; danceLegs(r, [1, [2.4, -3, 30], [-2.4, -2, -30]]); if (go > 0.3) strikeFace(r); },
    };
  },
  // In the air, the second: she tucks, then scissors both arms down and out, flinging a ring from
  // each hand at whatever is below, legs split wide behind the throw.
  bdairtwin(p) {
    const tuck = soft(seg(p, 0, 0.3));
    const go = ease(seg(p, 0.3, 0.46));
    const open = soft(seg(p, 0.5, 0.8));
    return {
      weapon: lerp(lerp(70, 40, tuck), 160, go), arm: lerp(lerp(80, 120, tuck), 55, go), thrown: rel(p, 0.38, 0.96), tilt: -0.08 * tuck * (1 - go) + 0.1 * go * (1 - open),
      rig: (r) => {
        r.air = true;
        r.backArm = [q(lerp(-2, -7, go)), q(lerp(-9, 2, go))];
        r.hairLift = go > 0.3 ? -1 : 0;
        danceLegs(r, [tuck * (1 - go), [2.6, -4, 50], [-1, -3.6, 30]], [go, [5, -2, 60], [-5, -2, -60]], [open, [2.4, -3, 30], [-2.4, -2, -30]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // Out of a run: she slides in on one knee and skims the ring out of the slide.
  bdslide(p) {
    const slide = soft(seg(p, 0, 0.4)) * (1 - soft(seg(p, 0.8, 1)));
    const go = ease(seg(p, 0.3, 0.44));
    return {
      weapon: lerp(190, 110, go), arm: lerp(30, 70, go), thrown: rel(p, 0.42, 0.9), lunge: 8 * slide, tilt: -0.12 * slide,
      rig: (r) => {
        r.squat = q(2 * slide);
        r.backArm = [q(-7 * slide), q(-4)];
        r.hairLift = slide > 0.4 ? 1 : 0;
        r.cape -= q(4 * slide);
        danceLegs(r, [slide, [4.6, -0.4, 40], [-4, 0, -10]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // Golden Carousel (her finisher, 1.6 s): she raises the ring and turns slowly on her toes as rings
  // gather round her like a carousel, faster and faster; at the peak she flings her arm out and
  // they all fly; she holds the pose, catches her own ring as it comes home, and curtsies.
  bdcarousel(p) {
    const rise = soft(seg(p, 0, 0.12));
    const a = easeIn(seg(p, 0.1, 0.62)) * 3;
    const turning = p > 0.1 && p < 0.62;
    const fling = ease(seg(p, 0.62, 0.7));
    const pose = fling * (1 - soft(seg(p, 0.86, 0.92)));
    const bow = soft(seg(p, 0.9, 0.97)) * (1 - soft(seg(p, 0.99, 1)));
    return {
      weapon: turning ? 100 : lerp(96, 165, bow), arm: turning ? lerp(84, 92, rise) : lerp(96, 40, bow), thrown: rel(p, 0.66, 0.9),
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 3 * rise * (1 - bow) + 2 * pose, tilt: 0.1 * fling * (1 - bow) + 0.28 * bow, lunge: 4 * fling * (1 - bow), trail: turning,
      rig: (r) => {
        r.backArm = turning ? [q(-2), q(-10)] : [q(-7 * pose - 6 * bow), q(-8 * pose - 2 * bow)];
        r.hairLift = turning || pose > 0.4 ? -1 : 0;
        r.cape -= q(5 * (turning ? 1 : pose));
        danceLegs(r, [rise * (1 - bow), [0.6, -2, 6], [-0.6, -2, -6]], [turning ? 1 : 0, [1.2, -4.4, 34], [-0.4, -1.6, -4]], [pose, [3.6, -1, 10], [-5, -3.4, -44]], [bow, [3.4, 0, 14], [-1.6, 0, -4]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning || pose > 0.3) strikeFace(r);
      },
    };
  },

  // ---------- The Arbalist Engineer's moves (her own; docs/design/arbalist.md) ----------
  // An excited inventor with a crossbow of her own making, held low at the waist (arm about 25-35 degrees,
  // the crossbow level or tipped a little up), never raised to her face. Every shot kicks: the
  // crossbow jumps up and back and settles, and she reacts (a grin, a fist pump, a pat on the stock).
  // (A crossbow's angle: 0 is level forward, negative tips it up.)

  // Snap shot (opener, the bolt leaves at ~0.3): she swings it up to her hip and fires at once.
  aesnap(p) {
    const up = ease(seg(p, 0, 0.24));
    const kick = bump(p, 0.28, 0.5);
    const hold = soft(seg(p, 0.55, 1));
    return {
      weapon: lerp(30, -4, up) - 14 * kick, arm: lerp(30, 30, up) + 6 * kick - 4 * hold, lunge: -3 * kick, tilt: -0.06 * kick,
      rig: (r) => {
        r.backArm = [q(lerp(-1, 4, up)), q(-1)];
        danceLegs(r, [up, [2.2, 0, 4], [-2.2, 0, -6]]);
        if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Double shot (second, bolts at ~0.28 and ~0.6): a shot, the free hand pumps the lever with a
  // clack, a second shot.
  aedouble(p) {
    const k1 = bump(p, 0.26, 0.42);
    const pump = bump(p, 0.4, 0.56);
    const k2 = bump(p, 0.58, 0.74);
    const hold = soft(seg(p, 0.76, 1));
    return {
      weapon: -4 - 12 * k1 - 14 * k2 + 6 * pump, arm: 30 + 6 * (k1 + k2) - 4 * hold, lunge: -2.5 * (k1 + k2), tilt: -0.05 * (k1 + k2),
      rig: (r) => {
        r.backArm = [q(4 - 3 * pump), q(-1 + 3 * pump)];
        danceLegs(r, [1, [2.2, 0, 4], [-2.4, 0, -8]]);
        if (k1 > 0.3 || k2 > 0.3) strikeFace(r);
      },
    };
  },
  // Brace and crank (third, the heavy bolt at ~0.55): she drops to one knee, braces the crossbow on
  // it, winds the crank twice with a grin, then fires.
  aebrace(p) {
    const kneel = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.85, 1)));
    const crank = seg(p, 0.18, 0.5);
    const kick = bump(p, 0.52, 0.72);
    return {
      weapon: -2 - 18 * kick, arm: 22 + 8 * kick, lunge: -4 * kick, tilt: 0.04 * kneel - 0.08 * kick,
      rig: (r) => {
        r.squat = q(2.5 * kneel);
        r.backArm = crank > 0 && crank < 1 ? [q(3 + 2 * Math.cos(crank * Math.PI * 4)), q(1 + 2 * Math.sin(crank * Math.PI * 4))] : [3, 0];
        danceLegs(r, [kneel, [3.4, 0, 6], [-3.4, -1, -40]]);
        if (crank > 0.2 && crank < 1) r.mouth = 'grin';
        if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Recoil blast (the finish, ~0.48): she plants wide, fires the big bolt, and the kick throws her a
  // hop back with the crossbow bucking up; she lands and pumps her fist.
  aerecoil(p) {
    const plant = soft(seg(p, 0, 0.3));
    const kick = ease(seg(p, 0.46, 0.56)) * (1 - soft(seg(p, 0.62, 0.9)));
    const hop = Math.sin(Math.PI * seg(p, 0.48, 0.78));
    const pump = soft(seg(p, 0.82, 0.92)) * (1 - soft(seg(p, 0.97, 1)));
    return {
      weapon: lerp(10, -2, plant) - 34 * kick, arm: lerp(28, 30, plant) + 10 * kick, lunge: -8 * hop, lift: 6 * hop, tilt: -0.16 * kick,
      rig: (r) => {
        r.squat = q(1.5 * plant * (1 - kick));
        r.backArm = pump > 0.2 ? [q(3 * pump), q(-9 * pump)] : [3, -1];
        r.hairLift = hop > 0.3 ? -1 : 0;
        danceLegs(r, [plant * (1 - hop), [3.2, 0, 6], [-3.4, 0, -10]], [hop, [2, -3, 30], [-2, -2, -30]]);
        if (pump > 0.4) r.eyes = 'happy';
        else if (kick > 0.2) strikeFace(r);
      },
    };
  },
  // Twirl shot (opener in her pool, ~0.42): she spins the crossbow round her finger by its grip like a
  // gunslinger, catches it at the hip and fires.
  aetwirl(p) {
    const spin = seg(p, 0.04, 0.36);
    const kick = bump(p, 0.4, 0.6);
    const hold = soft(seg(p, 0.62, 1));
    return {
      weapon: spin < 1 ? 360 * spin : -4 - 14 * kick, arm: spin < 1 ? 28 : 30 + 6 * kick - 4 * hold, lunge: -3 * kick,
      rig: (r) => { r.backArm = [q(3 * hold), q(-1)]; danceLegs(r, [1, [2, 0, 4], [-2, 0, -6]]); if (kick > 0.3) strikeFace(r); },
    };
  },
  // Duck and fire (second in her pool, ~0.4): she ducks low, firing up and out from the crouch.
  aeduck(p) {
    const duck = soft(seg(p, 0, 0.25)) * (1 - soft(seg(p, 0.75, 1)));
    const kick = bump(p, 0.36, 0.56);
    return {
      weapon: -10 - 14 * kick, arm: 24 + 6 * kick, tilt: 0.1 * duck, lunge: -2 * kick,
      rig: (r) => { r.squat = q(2.5 * duck); r.backArm = [q(2), q(-1)]; danceLegs(r, [duck, [3, 0, 8], [-3, 0, -12]]); if (kick > 0.3) strikeFace(r); },
    };
  },
  // Triple crank (third in her pool, bolts at ~0.3, ~0.5, ~0.7): she hammers the crank round and the
  // crossbow fires three times in a row, rattling.
  aetriple(p) {
    const k = Math.max(bump(p, 0.28, 0.4), bump(p, 0.48, 0.6), bump(p, 0.68, 0.8));
    const crank = seg(p, 0.2, 0.8);
    return {
      weapon: -4 - 12 * k, arm: 30 + 5 * k, lunge: -2 * k, tilt: -0.04 * k,
      rig: (r) => {
        r.backArm = crank > 0 && crank < 1 ? [q(3 + 2 * Math.cos(crank * Math.PI * 6)), q(1 + 2 * Math.sin(crank * Math.PI * 6))] : [3, 0];
        danceLegs(r, [1, [2.4, 0, 4], [-2.4, 0, -8]]);
        if (k > 0.3) strikeFace(r);
      },
    };
  },
  // Sliding shot (a finish in her pool, ~0.45): she slides in on one knee and fires a heavy bolt from
  // the slide, then pops up and pats the stock.
  aeslide(p) {
    const slide = soft(seg(p, 0, 0.35)) * (1 - soft(seg(p, 0.7, 0.9)));
    const kick = bump(p, 0.42, 0.62);
    const pat = bump(p, 0.86, 1);
    return {
      weapon: -6 - 20 * kick, arm: 22 + 8 * kick, lunge: 6 * slide - 3 * kick, tilt: -0.12 * slide,
      rig: (r) => {
        r.squat = q(2 * slide);
        r.backArm = pat > 0.2 ? [q(5), q(1 - 2 * pat)] : [q(-6 * slide), q(-3)];
        r.hairLift = slide > 0.4 ? 1 : 0;
        danceLegs(r, [slide, [5, 0, 30], [-3.4, 0, -10]]);
        if (pat > 0.3) r.eyes = 'happy';
        else if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Up + attack: she tips the crossbow up and out in front of her and fires at whatever flies.
  aeup(p) {
    const up = ease(seg(p, 0, 0.26));
    const kick = bump(p, 0.32, 0.52);
    return {
      weapon: lerp(0, -45, up) + 10 * kick, arm: lerp(27, 28, up), lunge: 0,
      rig: (r) => { r.backArm = [q(3), q(-2)]; danceLegs(r, [up, [1.4, 0, 4], [-1.6, 0, -6]]); if (kick > 0.3) strikeFace(r); },
    };
  },
  // In the air: she tips it down past her knees and fires at whatever is below.
  aeair(p) {
    const down = ease(seg(p, 0, 0.24));
    const kick = bump(p, 0.28, 0.5);
    return {
      weapon: lerp(0, 55, down) - 12 * kick, arm: 33 - 6 * kick,
      rig: (r) => { r.air = true; r.backArm = [q(-4), q(-6)]; danceLegs(r, [1, [2.4, -3, 30], [-2.4, -2, -30]]); if (kick > 0.3) strikeFace(r); },
    };
  },
  // Out of a run: a forward roll, coming up on one knee firing.
  aeroll(p) {
    const roll = ease(seg(p, 0, 0.42));
    const kick = bump(p, 0.48, 0.66);
    return {
      weapon: roll < 1 ? 20 : -6 - 18 * kick, arm: roll < 1 ? 30 : 27 + 6 * kick, tilt: roll < 1 ? roll * Math.PI * 2 : -0.06 * kick, lift: 3 * Math.sin(Math.PI * roll),
      rig: (r) => {
        if (roll > 0 && roll < 1) tuck(r);
        else { r.squat = 2; danceLegs(r, [1, [3.4, 0, 6], [-3.4, -1, -40]]); }
        if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Deploy Turret: she kneels, sets the turret down in front of her, gives it a pat and jumps back
  // up with a cheer.
  aedeploy(p) {
    const kneel = soft(seg(p, 0, 0.25)) * (1 - soft(seg(p, 0.6, 0.8)));
    const place = bump(p, 0.2, 0.55);
    const cheer = soft(seg(p, 0.8, 0.9)) * (1 - soft(seg(p, 0.97, 1)));
    return {
      weapon: 8, arm: 25, lift: 2 * cheer,
      rig: (r) => {
        r.squat = q(2.5 * kneel);
        r.backArm = cheer > 0.2 ? [q(2 * cheer), q(-10 * cheer)] : [q(6 * place + 2), q(4 * place)];
        danceLegs(r, [kneel, [3.4, 0, 6], [-3.4, -1, -40]], [cheer, [1.2, -1.5, 6], [-1.2, -1.5, -6]]);
        if (cheer > 0.4) r.eyes = 'happy';
      },
    };
  },
  // Big Bertha (her finisher, 1.6 s): she flips her goggles down, braces wide as the crossbow unfolds
  // into a giant ballista (drawn as an effect over her), cranks it with both hands, then the huge bolt
  // goes and the kick skids her back; she pushes the goggles up, sooty, and grins.
  aebertha(p) {
    const brace = soft(seg(p, 0, 0.18));
    const crank = seg(p, 0.2, 0.6);
    const kick = ease(seg(p, 0.62, 0.68)) * (1 - soft(seg(p, 0.7, 0.92)));
    const skid = soft(seg(p, 0.62, 0.8));
    const grin = soft(seg(p, 0.88, 0.95)) * (1 - soft(seg(p, 0.99, 1)));
    return {
      weapon: -4 - 30 * kick, arm: 24 + 10 * kick, lunge: -10 * skid * (1 - grin * 0.3), tilt: -0.2 * kick + 0.04 * brace * (1 - kick),
      rig: (r) => {
        r.squat = q(2 * brace * (1 - grin));
        r.backArm = grin > 0.3 ? [q(2), q(-12 * grin)] : crank > 0 && crank < 1 ? [q(3 + 2.4 * Math.cos(crank * Math.PI * 6)), q(1 + 2.4 * Math.sin(crank * Math.PI * 6))] : [3, 0];
        r.hairLift = kick > 0.3 ? 1 : 0;
        danceLegs(r, [brace * (1 - grin), [3.8, 0, 8], [-3.8, 0, -14]], [grin, [1.6, 0, 4], [-1.6, 0, -6]]);
        if (grin > 0.4) r.mouth = 'grin';
        else if (kick > 0.2 || (crank > 0 && crank < 1)) strikeFace(r);
      },
    };
  },

  // ---------- The Star Witch's moves (her own; docs/design/star-witch.md) ----------
  // A bright prodigy who casts like she's showing off: quick flicks and twirls of the wand, the free
  // hand making finger-guns and peace signs, a wink after a big spell. Every cast is out in about a
  // fifth of a second, then she holds a pose. The wand points out in front or low, never across her
  // face; the staff is swung low and wide.

  // Wand flick (opener, the star leaves at ~0.3): a little wind-up at the hip, then a snap of the
  // wrist pointing the wand at them, the free hand flicked back.
  swflick(p) {
    const wind = soft(seg(p, 0, 0.2));
    const snap = ease(seg(p, 0.2, 0.32));
    const hold = soft(seg(p, 0.4, 1));
    return {
      weapon: lerp(lerp(40, 150, wind), 92, snap), arm: lerp(lerp(50, 30, wind), 88, snap) - 10 * hold, lunge: 3 * snap * (1 - hold * 0.6), tilt: -0.04 * wind * (1 - snap) + 0.05 * snap,
      rig: (r) => {
        r.backArm = [q(lerp(2, -5, snap)), q(-3)];
        danceLegs(r, [snap, [2.2, 0, 4], [-1.8, 0, -6]]);
        if (snap > 0.3) strikeFace(r);
      },
    };
  },
  // Twirl cast (second, stars at ~0.3 and ~0.5): she twirls the wand round her fingers at her hip,
  // then points it twice, a star off each point.
  swtwirl(p) {
    const twirl = seg(p, 0, 0.26);
    const p1 = ease(seg(p, 0.24, 0.32)) * (1 - soft(seg(p, 0.36, 0.44)));
    const p2 = ease(seg(p, 0.44, 0.52));
    const hold = soft(seg(p, 0.6, 1));
    return {
      weapon: twirl < 1 ? 60 + twirl * 720 : lerp(95, 80, p2), arm: twirl < 1 ? 40 : 80 + 8 * p1 + 10 * p2 - 8 * hold, lunge: 2 * (p1 + p2),
      rig: (r) => {
        r.backArm = [q(-3 - 2 * p2), q(-3 - 2 * p2)];
        danceLegs(r, [Math.max(p1, p2), [2, 0, 4], [-1.6, 0, -6]]);
        if (p1 > 0.3 || p2 > 0.3) strikeFace(r);
      },
    };
  },
  // Spin fling (third, ~0.55): a quick turn on the spot, the wand trailing, and she flings a star
  // out of the turn, ending with a finger-gun from the free hand.
  swspin(p) {
    const a = ease(seg(p, 0.08, 0.46));
    const turning = p > 0.08 && p < 0.46;
    const fling = ease(seg(p, 0.46, 0.58));
    const hold = soft(seg(p, 0.62, 1));
    return {
      weapon: turning ? 120 : lerp(120, 88, fling), arm: turning ? 60 : lerp(60, 90, fling) - 8 * hold, trail: turning,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lunge: 3 * fling * (1 - hold * 0.5),
      rig: (r) => {
        r.backArm = turning ? [-5, -3] : [q(6 * hold), q(-6 * hold - 2)];
        r.hairLift = turning ? -1 : 0;
        danceLegs(r, [turning ? 1 : 0, [1, -1, 6], [-1, -1, -6]], [fling, [2.6, 0, 6], [-2.2, 0, -8]]);
        if (fling > 0.3) strikeFace(r);
      },
    };
  },
  // Constellation snap (the finish, ~0.5): she draws a quick shape in the air with the wand out in
  // front (three little jabs), then thrusts it at them as the constellation snaps shut, and winks.
  swsnap(p) {
    const draw = seg(p, 0.06, 0.4);
    const jab = Math.abs(Math.sin(draw * Math.PI * 3)) * (draw > 0 && draw < 1 ? 1 : 0);
    const thrust = ease(seg(p, 0.42, 0.52));
    const hold = soft(seg(p, 0.58, 0.9)) * (1 - soft(seg(p, 0.92, 1)));
    return {
      weapon: 70 + 20 * jab + 20 * thrust, arm: 72 + 10 * jab + 18 * thrust - 6 * hold, lunge: 2 * jab + 6 * thrust * (1 - hold * 0.4), tilt: 0.08 * thrust * (1 - hold),
      rig: (r) => {
        r.backArm = [q(-4 * thrust + 5 * hold), q(-3 - 5 * hold)];
        r.cape -= q(4 * thrust);
        danceLegs(r, [thrust, [3.4, 0, 6], [-3, -0.4, -12]], [hold, [2.6, 0, 6], [-2.4, -0.4, -10]]);
        if (hold > 0.4) r.eyes = 'wink';
        else if (thrust > 0.3) strikeFace(r);
      },
    };
  },
  // Wink cast (an opener in her pool): no wind-up at all, a tiny flick from the hip and a wink.
  swwink(p) {
    const flick = ease(seg(p, 0.1, 0.24));
    const hold = soft(seg(p, 0.3, 1));
    return {
      weapon: lerp(60, 95, flick), arm: lerp(35, 70, flick) - 6 * hold, lunge: 1.5 * flick,
      rig: (r) => {
        r.backArm = [q(4 * hold), q(-2 - 2 * hold)];
        if (hold > 0.3 && hold < 0.9) r.eyes = 'wink';
        else if (flick > 0.3) strikeFace(r);
      },
    };
  },
  // Sidearm sweep (second in her pool, three small stars at ~0.4): a wide flat sweep of the wand from
  // behind her to in front, scattering stars in a fan.
  swsweep(p) {
    const wind = soft(seg(p, 0, 0.26));
    const sweep = ease(seg(p, 0.26, 0.46));
    const hold = soft(seg(p, 0.5, 1));
    return {
      weapon: lerp(lerp(90, 120, wind), 80, sweep), arm: lerp(lerp(50, 20, wind), 95, sweep) - 10 * hold, tilt: -0.06 * wind * (1 - sweep) + 0.06 * sweep * (1 - hold),
      lunge: -2 * wind * (1 - sweep) + 4 * sweep * (1 - hold * 0.5),
      rig: (r) => {
        r.backArm = [q(lerp(3, -6, sweep)), q(-3)];
        danceLegs(r, [wind * (1 - sweep), [1, 0, 4], [-2.4, 0, -10]], [sweep, [3, 0, 6], [-2.6, -0.6, -12]]);
        if (sweep > 0.3) strikeFace(r);
      },
    };
  },
  // Hop cast (third in her pool, ~0.45): a little hop, casting down at them from the top of it.
  swhop(p) {
    const hop = Math.sin(Math.PI * seg(p, 0.05, 0.75));
    const cast = ease(seg(p, 0.32, 0.46));
    return {
      weapon: lerp(40, 130, cast), arm: lerp(80, 70, cast), lift: 10 * hop,
      rig: (r) => {
        r.air = hop > 0.2;
        r.backArm = [q(-5), q(-6 * hop)];
        r.hairLift = hop > 0.3 ? -1 : 0;
        danceLegs(r, [hop, [2, -3, 30], [-2, -2.4, -30]]);
        if (cast > 0.3) strikeFace(r);
      },
    };
  },
  // Show-off (a finish in her pool, ~0.48): she spins the wand overhand once out in front (never over
  // her face), points it, and flashes a peace sign with the free hand as the big star flies.
  swshowoff(p) {
    const spin = seg(p, 0.05, 0.38);
    const point = ease(seg(p, 0.38, 0.5));
    const hold = soft(seg(p, 0.55, 0.9)) * (1 - soft(seg(p, 0.92, 1)));
    return {
      weapon: spin < 1 ? 90 + spin * 360 : 92, arm: spin < 1 ? 75 : lerp(75, 92, point) - 4 * hold, lunge: 4 * point * (1 - hold * 0.4),
      rig: (r) => {
        r.backArm = [q(-2 + 7 * hold), q(-3 - 7 * hold)];
        danceLegs(r, [point, [2.8, 0, 6], [-2.6, -0.4, -10]]);
        if (hold > 0.4) r.eyes = 'wink';
        else if (point > 0.3) strikeFace(r);
      },
    };
  },
  // Up + attack: she points the wand up and out at whatever flies and fires straight up.
  swup(p) {
    const go = ease(seg(p, 0.2, 0.36));
    const hold = soft(seg(p, 0.45, 1));
    return {
      weapon: lerp(90, 30, go), arm: lerp(50, 100, go) - 15 * hold, tilt: -0.08 * go * (1 - hold), lift: 1.5 * go * (1 - hold),
      rig: (r) => {
        r.backArm = [q(-3), q(-3 - 3 * go)];
        danceLegs(r, [go, [1.2, -0.8, 4], [-1.4, 0, -6]]);
        if (go > 0.3) strikeFace(r);
      },
    };
  },
  // In the air: a flick straight down at them.
  swair(p) {
    const go = ease(seg(p, 0.18, 0.34));
    return {
      weapon: lerp(80, 160, go), arm: lerp(80, 60, go),
      rig: (r) => { r.air = true; r.backArm = [q(-5), q(-6)]; danceLegs(r, [1, [2, -3, 30], [-2.4, -2, -30]]); if (go > 0.3) strikeFace(r); },
    };
  },
  // Out of a run: she slides on her heels, leaning back, and casts from the slide.
  swdash(p) {
    const slide = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.75, 1)));
    const cast = ease(seg(p, 0.3, 0.42));
    return {
      weapon: lerp(120, 90, cast), arm: lerp(40, 90, cast), tilt: -0.14 * slide, lunge: 5 * slide,
      rig: (r) => { r.backArm = [q(-6 * slide), q(-4)]; r.hairLift = slide > 0.4 ? 1 : 0; danceLegs(r, [slide, [5, 0, 20], [-3, 0, -8]]); if (cast > 0.3) strikeFace(r); },
    };
  },
  // Staff thrust (staff opener, the comet leaves at ~0.4): the staff drawn back low in both hands, then
  // driven straight out at them.
  ssthrust(p) {
    const draw = soft(seg(p, 0, 0.28));
    const drive = ease(seg(p, 0.28, 0.42));
    const hold = soft(seg(p, 0.5, 1));
    return {
      weapon: lerp(lerp(70, 100, draw), 92, drive), arm: lerp(lerp(55, 30, draw), 85, drive) - 8 * hold, lunge: -2 * draw * (1 - drive) + 7 * drive * (1 - hold * 0.5), tilt: 0.06 * drive * (1 - hold),
      rig: (r) => {
        r.backArm = [q(lerp(2, 7, drive)), q(-1)];
        r.squat = q(draw * (1 - drive));
        danceLegs(r, [draw * (1 - drive), [1.4, 0, 4], [-2.2, 0, -8]], [drive, [3.6, 0, 6], [-3.4, -0.6, -16]]);
        if (drive > 0.3) strikeFace(r);
      },
    };
  },
  // Staff swing (second, ~0.45): a big flat swing round in front that lobs a comet in an arc.
  ssswing(p) {
    const wind = soft(seg(p, 0, 0.3));
    const swing = ease(seg(p, 0.3, 0.48));
    const hold = soft(seg(p, 0.52, 1));
    return {
      weapon: lerp(lerp(60, 200, wind), 70, swing), arm: lerp(lerp(55, 25, wind), 95, swing) - 15 * hold, tilt: -0.08 * wind * (1 - swing) + 0.08 * swing * (1 - hold),
      rig: (r) => {
        r.backArm = [q(lerp(4, -4, swing)), q(-3)];
        r.cape -= q(4 * swing);
        danceLegs(r, [wind * (1 - swing), [1, 0, 4], [-2.6, 0, -10]], [swing, [3.2, 0, 6], [-3, -0.6, -14]]);
        if (swing > 0.3) strikeFace(r);
      },
    };
  },
  // Staff plant (third, the meteor lands at ~0.55): she lifts the staff and plants its foot on the
  // ground in front of her; a meteor falls on them.
  ssplant(p) {
    const lift = soft(seg(p, 0, 0.3));
    const plant = ease(seg(p, 0.3, 0.42));
    const hold = soft(seg(p, 0.5, 1));
    return {
      weapon: lerp(lerp(70, 55, lift), 62, plant), arm: lerp(lerp(60, 95, lift), 88, plant), lift: 2 * lift * (1 - plant), lunge: 3 * plant,
      rig: (r) => {
        r.backArm = [q(3 + 4 * hold), q(-3 - 6 * hold)];
        r.squat = q(plant * (1 - hold) * 1.5);
        danceLegs(r, [plant, [2.6, 0, 6], [-2.4, 0, -10]]);
        if (plant > 0.3) strikeFace(r);
      },
    };
  },
  // Staff slam (the finish, ~0.55): she lifts the staff high out in front of her, arm stretched up
  // and forward so it rises away from her face, then brings it down hard; a big comet slams through
  // the line.
  ssslam(p) {
    const rise = soft(seg(p, 0.05, 0.4));
    const slam = ease(seg(p, 0.42, 0.54));
    const hold = soft(seg(p, 0.6, 0.92)) * (1 - soft(seg(p, 0.94, 1)));
    return {
      weapon: lerp(lerp(90, 40, rise), 140, slam), arm: lerp(lerp(60, 118, rise), 72, slam), lift: 2 * rise * (1 - slam), lunge: 5 * slam * (1 - hold * 0.4), tilt: 0.12 * slam * (1 - hold),
      rig: (r) => {
        r.backArm = [q(-4 + 8 * hold), q(-4 - 5 * hold)];
        r.squat = q(1.5 * slam * (1 - hold));
        r.hairLift = slam > 0.3 && hold < 0.5 ? 1 : 0;
        danceLegs(r, [slam, [3.8, 0, 6], [-3.6, -0.6, -16]]);
        if (hold > 0.4) r.eyes = 'wink';
        else if (slam > 0.3) strikeFace(r);
      },
    };
  },
  // Star Step: she spins on the spot and pops into sparkles (the step carries her), reappearing with
  // a little bounce and a peace sign.
  swblink(p) {
    const a = ease(seg(p, 0, 0.4));
    const turning = p < 0.4;
    const land = bump(p, 0.6, 0.85);
    return {
      weapon: 60, arm: 50, trail: turning, lift: 4 * bump(p, 0, 0.5) + 2 * land,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      rig: (r) => { r.backArm = turning ? [-4, -4] : [q(6 * land), q(-8 * land - 2)]; r.hairLift = turning ? -1 : 0; if (land > 0.4) r.eyes = 'wink'; },
    };
  },
  // Wishing Star (her heal, the star falls at ~0.55): she holds the wand to her chest with both hands,
  // looks up and makes a wish, then opens her arms as the star falls on the party.
  swwish(p) {
    const wish = soft(seg(p, 0, 0.35));
    const open = soft(seg(p, 0.5, 0.65));
    const settle = soft(seg(p, 0.85, 1));
    return {
      weapon: lerp(lerp(60, 120, wish), 80, open), arm: lerp(lerp(50, 30, wish), 80, open) - 30 * settle, lift: 1.5 * wish * (1 - open) + breathe(p) * open * (1 - settle),
      rig: (r) => {
        r.backArm = [q(lerp(0, 5, wish) * (1 - open) - 6 * open), q(-3 * wish - 4 * open)];
        if (wish > 0.4 && open < 0.5) r.eyes = 'half';
        danceLegs(r, [wish * (1 - open), [0.6, -1.2, 4], [-0.6, -1.2, -4]], [open, [1.8, 0, 4], [-1.8, 0, -6]]);
      },
    };
  },
  // Star Veil (her ward, ~0.5): she draws a big circle in front of her with the wand, and pushes it
  // out over the party with her open hand.
  swveil(p) {
    const draw = seg(p, 0.05, 0.42);
    const push = ease(seg(p, 0.45, 0.58));
    const hold = soft(seg(p, 0.62, 1));
    return {
      weapon: 90 + Math.sin(draw * Math.PI * 2) * 40, arm: 65 + Math.cos(draw * Math.PI * 2) * 20 * (draw > 0 && draw < 1 ? 1 : 0) - 10 * hold, lunge: 2 * push,
      rig: (r) => {
        r.backArm = [q(lerp(0, 8, push)), q(lerp(-3, -5, push))];
        danceLegs(r, [push, [2, 0, 4], [-2, 0, -8]]);
        if (push > 0.3) strikeFace(r);
      },
    };
  },
  // Starfall (her finisher, 1.6 s): she points the wand up and out and draws the constellation across
  // the sky (seven little jabs as each star lights), holds it there as it glows, then swings the wand
  // down and it all comes crashing down; she blows on the wand tip like a smoking gun, and winks.
  swstarfall(p) {
    const raise = soft(seg(p, 0, 0.12));
    const draw = seg(p, 0.12, 0.5);
    const jab = Math.abs(Math.sin(draw * Math.PI * 7)) * (draw > 0 && draw < 1 ? 1 : 0);
    const swing = ease(seg(p, 0.6, 0.68));
    const blow = soft(seg(p, 0.8, 0.88)) * (1 - soft(seg(p, 0.97, 1)));
    return {
      weapon: lerp(lerp(lerp(90, 40, raise) - 10 * jab, 150, swing), 20, blow), arm: lerp(lerp(lerp(50, 100, raise) + 6 * jab, 70, swing), 60, blow),
      lift: 2 * raise * (1 - swing) + breathe(p) * (1 - swing) * raise, tilt: -0.08 * raise * (1 - swing) + 0.1 * swing * (1 - blow), lunge: 4 * swing * (1 - blow),
      rig: (r) => {
        r.backArm = [q(-4 * raise * (1 - swing) + 4 * swing), q(-6 * raise * (1 - swing) - 2)];
        r.cape -= q(4 * swing);
        r.hairLift = swing > 0.3 && blow < 0.5 ? 1 : -1;
        danceLegs(r, [raise * (1 - swing), [0.8, -1, 4], [-1.4, 0, -6]], [swing, [3.6, 0, 6], [-3.4, -0.6, -16]], [blow, [2, 0, 4], [-1.8, 0, -6]]);
        if (blow > 0.4) r.eyes = 'wink';
        else if (jab > 0.5 || swing > 0.3) strikeFace(r);
      },
    };
  },

  // ---------- The Starlight Idol's moves (her own; docs/design/starlight-idol.md) ----------
  // A pop idol on stage: her wand is her microphone. She sings into it held out beside her face
  // (MIC: never across it), bounces on the beat, sways her hips, points the mic at the monsters
  // as the notes fly, and finishes on a pose with a wink. Her free hand works the crowd: waves,
  // points, a peace sign, a hand on her heart.

  // On the beat (opener, the note leaves at ~0.32): she sings a line into the mic with a little dip
  // on the beat, then swings the mic out at them, the free hand flicking back.
  sibeat(p) {
    const dip = bump(p, 0, 0.26);
    const out = ease(seg(p, 0.22, 0.34));
    const hold = soft(seg(p, 0.42, 1));
    return {
      weapon: lerp(48, 82, out) - 6 * hold, arm: lerp(98, 90, out) - 8 * hold, lunge: 3 * out * (1 - hold * 0.5), tilt: 0.05 * out * (1 - hold), lift: -1 * dip,
      rig: (r) => {
        r.backArm = [q(lerp(1, -5, out)), q(lerp(-2, -4, out))];
        r.squat = q(1.2 * dip);
        danceLegs(r, [dip, [1.4, 0, 4], [-1.4, 0, -4]], [out, [2.4, 0, 4], [-2, 0, -8]]);
        strikeFace(r);
        if (hold > 0.6) r.mouth = 'grin';
      },
    };
  },
  // Step and touch (second, notes at ~0.3 and ~0.6): a step to one side and a touch, then back,
  // her hips swaying with each, the mic swung out at them on each beat.
  sistep(p) {
    const b1 = ease(seg(p, 0.16, 0.3)) * (1 - soft(seg(p, 0.36, 0.48)));
    const b2 = ease(seg(p, 0.48, 0.6));
    const hold = soft(seg(p, 0.66, 1));
    const sway = Math.sin(seg(p, 0, 0.66) * Math.PI * 2);
    return {
      weapon: lerp(48, 80, Math.max(b1, b2)), arm: lerp(98, 88, Math.max(b1, b2)) - 6 * hold, tilt: 0.06 * sway * (1 - hold), lunge: 2 * b1 + 3 * b2 * (1 - hold * 0.5),
      rig: (r) => {
        r.backArm = [q(-2 - 3 * b2 + 3 * b1), q(-3 - 3 * b1)];
        r.hairLift = Math.abs(sway) > 0.6 ? Math.sign(sway) : 0;
        danceLegs(r, [Math.max(0, sway), [3.4, 0, 6], [-0.4, -0.8, -6]], [Math.max(0, -sway), [0.6, -0.8, 6], [-3.4, 0, -6]], [b2, [2.4, 0, 4], [-2.2, 0, -8]]);
        strikeFace(r);
        if (hold > 0.6) r.eyes = 'happy';
      },
    };
  },
  // The high note (the finish, ~0.5): she leans back, eyes shut, belting into the mic, the free arm
  // flung wide behind her; then throws herself forward with the mic thrust out as a big note
  // blasts through the line. A wink to end it.
  sihigh(p) {
    const belt = soft(seg(p, 0.04, 0.38));
    const blast = ease(seg(p, 0.4, 0.52));
    const hold = soft(seg(p, 0.6, 0.92)) * (1 - soft(seg(p, 0.94, 1)));
    return {
      weapon: lerp(lerp(48, 44, belt), 85, blast), arm: lerp(lerp(98, 104, belt), 92, blast) - 6 * hold, tilt: -0.1 * belt * (1 - blast) + 0.1 * blast * (1 - hold), lunge: -2 * belt * (1 - blast) + 6 * blast * (1 - hold * 0.5),
      lift: 1.5 * breathe(p) * belt * (1 - blast),
      rig: (r) => {
        r.backArm = [q(lerp(lerp(0, -7, belt), -4, blast) + 6 * hold), q(lerp(-3, -7, belt) - 2 * hold)];
        r.hairLift = blast > 0.3 && hold < 0.5 ? 1 : belt > 0.5 ? -1 : 0;
        r.cape -= q(4 * blast);
        danceLegs(r, [belt * (1 - blast), [2, 0, 4], [-2.6, -0.4, -10]], [blast, [3.6, 0, 6], [-3.4, -0.6, -14]]);
        strikeFace(r);
        if (belt > 0.4 && blast < 0.3) r.eyes = 'happy';
        if (hold > 0.4) {
          r.eyes = 'wink';
          r.mouth = 'grin';
        }
      },
    };
  },
  // Blown kiss (an opener in her pool, ~0.3): the free hand brought up under her chin and flung
  // out at them with a wink; the note flies off her fingertips.
  sikiss(p) {
    const up = soft(seg(p, 0, 0.22));
    const fling = ease(seg(p, 0.22, 0.34));
    const hold = soft(seg(p, 0.4, 1));
    return {
      weapon: 75, arm: 40 - 8 * hold, lunge: 2.5 * fling * (1 - hold * 0.5), tilt: 0.05 * fling * (1 - hold),
      rig: (r) => {
        r.backArm = [q(lerp(lerp(0, 5, up), 9, fling)), q(lerp(lerp(-2, -9, up), -7, fling))];
        danceLegs(r, [fling, [2, 0, 4], [-0.6, -1.6, -20]]);
        if (fling > 0.2) r.eyes = 'wink';
        else if (up > 0.5) r.mouth = 'cat';
      },
    };
  },
  // Over the shoulder (second in her pool, ~0.32 and ~0.6): she turns her back to them, looks over
  // her shoulder singing, then turns back round and points the mic at them on the next beat.
  sishoulder(p) {
    const away = soft(seg(p, 0.02, 0.18)) * (1 - soft(seg(p, 0.42, 0.52)));
    const turned = away > 0.5;
    const pt1 = ease(seg(p, 0.24, 0.34)) * (1 - soft(seg(p, 0.38, 0.46)));
    const pt2 = ease(seg(p, 0.52, 0.62));
    const hold = soft(seg(p, 0.68, 1));
    return {
      weapon: turned ? 120 - 20 * pt1 : lerp(48, 82, pt2), arm: turned ? 70 + 20 * pt1 : lerp(98, 90, pt2) - 6 * hold, turn: turned ? -1 : 1, lunge: 3 * pt2 * (1 - hold * 0.5), tilt: turned ? -0.05 : 0.05 * pt2 * (1 - hold),
      rig: (r) => {
        r.backArm = turned ? [q(3), q(-6)] : [q(-3 - 2 * pt2), q(-3)];
        r.hairLift = p > 0.42 && p < 0.55 ? 1 : 0;
        danceLegs(r, [turned ? 1 : 0, [1.2, 0, 4], [-1.8, -1.2, -16]], [pt2, [2.6, 0, 4], [-2.2, 0, -8]]);
        strikeFace(r);
        if (hold > 0.5) r.eyes = 'happy';
      },
    };
  },
  // Idol jump (third in her pool, ~0.45): a jump with both heels kicked up behind, the mic held up
  // and out, singing down at them from the top of it.
  sijump(p) {
    const crouch = bump(p, 0, 0.16);
    const hop = Math.sin(Math.PI * seg(p, 0.12, 0.72));
    const sing = ease(seg(p, 0.34, 0.46));
    const land = bump(p, 0.7, 0.86);
    return {
      weapon: lerp(30, 120, sing), arm: lerp(130, 85, sing), lift: 12 * hop - 1.5 * crouch,
      rig: (r) => {
        r.air = hop > 0.15;
        r.squat = q(1.5 * (crouch + land));
        r.backArm = [q(4 * hop), q(-9 * hop - 2)];
        r.hairLift = hop > 0.3 ? -1 : 0;
        danceLegs(r, [hop, [-1.4, -4.6, -40], [-3.6, -5.4, -60]]);
        strikeFace(r);
        if (hop > 0.5 && sing < 0.3) r.eyes = 'happy';
      },
    };
  },
  // Idol pose (a finish in her pool, ~0.48): a little spin of the mic in her fingers, then a hip pop
  // with the mic thrust out, the free hand flashing a peace sign at her hip; the wink.
  sipose(p) {
    const spin = seg(p, 0.06, 0.36);
    const pop = ease(seg(p, 0.38, 0.5));
    const hold = soft(seg(p, 0.56, 0.92)) * (1 - soft(seg(p, 0.94, 1)));
    return {
      weapon: spin < 1 ? 40 + spin * 360 : lerp(40, 88, pop), arm: spin < 1 ? 80 : lerp(80, 95, pop) - 4 * hold, lunge: 4 * pop * (1 - hold * 0.4), tilt: -0.06 * pop,
      rig: (r) => {
        r.backArm = [q(-2 + 4 * hold), q(-3 + 2 * hold)];
        r.cape -= q(3 * pop);
        danceLegs(r, [pop, [3, 0, 6], [-1, -1.4, -24]]);
        strikeFace(r);
        if (hold > 0.4) {
          r.eyes = 'wink';
          r.mouth = 'grin';
        }
      },
    };
  },
  // Up + attack: up on her toes, the mic pointed up at whatever flies, the free arm thrown up too.
  siup(p) {
    const go = ease(seg(p, 0.2, 0.36));
    const hold = soft(seg(p, 0.45, 1));
    return {
      weapon: lerp(48, 50, go), arm: lerp(98, 122, go) - 15 * hold, tilt: -0.08 * go * (1 - hold), lift: 2 * go * (1 - hold),
      rig: (r) => {
        r.backArm = [q(-2 + 3 * go), q(-3 - 8 * go)];
        danceLegs(r, [go, [0.8, -1.4, 10], [-2, -2.6, -40]]);
        strikeFace(r);
      },
    };
  },
  // In the air: knees tucked, she sings down at them, the mic pointed at the ground.
  siair(p) {
    const go = ease(seg(p, 0.18, 0.34));
    return {
      weapon: lerp(60, 150, go), arm: lerp(100, 70, go),
      rig: (r) => { r.air = true; r.backArm = [q(-4), q(-7)]; danceLegs(r, [1, [2.4, -4.6, 40], [-1.2, -3.6, 20]]); strikeFace(r); },
    };
  },
  // Out of a run: a rock-star knee slide, leaning back, belting into the mic, then pointing it at
  // them from the end of the slide.
  sidash(p) {
    const slide = soft(seg(p, 0, 0.24)) * (1 - soft(seg(p, 0.78, 1)));
    const point = ease(seg(p, 0.42, 0.54));
    return {
      weapon: lerp(46, 85, point), arm: lerp(100, 90, point), tilt: -0.16 * slide * (1 - point * 0.6), lunge: 4 * slide,
      rig: (r) => {
        r.squat = q(4 * slide);
        r.backArm = [q(-7 * slide), q(-6 * slide)];
        r.hairLift = slide > 0.4 ? 1 : 0;
        danceLegs(r, [slide, [5.4, -0.6, 10], [-4.4, -1, -70]]);
        strikeFace(r);
        if (slide > 0.5 && point < 0.3) r.eyes = 'happy';
      },
    };
  },
  // Healing Song (1.2 s, the song starts at ~0.45): she lays her free hand on her heart, closes her
  // eyes and sings into the mic, swaying slowly side to side; the song rises round her.
  sisong(p) {
    const into = soft(seg(p, 0, 0.3));
    const sway = Math.sin(seg(p, 0.15, 1) * Math.PI * 2) * into;
    const out = soft(seg(p, 0.86, 1));
    return {
      weapon: 48, arm: lerp(80, 99, into) - 10 * out, tilt: 0.05 * sway, lift: breathe(p) * into * 0.8,
      rig: (r) => {
        r.backArm = [q(lerp(0, 5, into) * (1 - out)), q(lerp(-2, -6, into) * (1 - out) - 2 * out)];
        r.hairLift = Math.abs(sway) > 0.6 ? Math.sign(sway) : 0;
        danceLegs(r, [Math.max(0, sway), [2.4, 0, 6], [-0.2, -0.6, -4]], [Math.max(0, -sway), [0.2, -0.6, 4], [-2.4, 0, -6]]);
        if (into > 0.5 && out < 0.5) {
          r.eyes = 'happy';
          strikeFace(r);
        }
      },
    };
  },
  // Cheer (0.9 s, the cheer bursts at ~0.6): three pumps of the mic up over her head on the beat,
  // a hop on the last, free arm pumping too: "hey, hey, HEY!"
  sicheer(p) {
    const pump = (a, b) => bump(p, a, b);
    const k = Math.max(pump(0.05, 0.25), pump(0.25, 0.45), pump(0.45, 0.7) * 1.2);
    const hop = Math.sin(Math.PI * seg(p, 0.48, 0.78));
    const settle = soft(seg(p, 0.82, 1));
    return {
      weapon: lerp(48, 64, Math.min(1, k)), arm: lerp(98, 124, Math.min(1, k)) - 30 * settle, lift: 7 * hop,
      rig: (r) => {
        r.air = hop > 0.2;
        r.backArm = [q(3 * k), q(-3 - 8 * k)];
        r.squat = q(1.2 * (1 - k) * (1 - settle) * (p < 0.48 ? 1 : 0));
        danceLegs(r, [hop, [1.6, -3.4, 30], [-2.4, -4, -40]]);
        strikeFace(r);
        if (hop > 0.4) r.eyes = 'happy';
      },
    };
  },
  // Lullaby (1.2 s, the lullaby drifts out at ~0.5): she holds the mic low and close, eyes half
  // shut, rocking slowly as if with a baby in her arms, the free hand drifting out in a soft wave.
  silullaby(p) {
    const into = soft(seg(p, 0, 0.25));
    const rock = Math.sin(seg(p, 0.1, 1) * Math.PI * 1.5) * into;
    const wave = soft(seg(p, 0.35, 0.6)) * (1 - soft(seg(p, 0.85, 1)));
    return {
      weapon: lerp(40, 55, into), arm: lerp(80, 70, into), tilt: 0.06 * rock, lift: breathe(p) * 0.6 * into,
      rig: (r) => {
        r.backArm = [q(lerp(0, 8, wave)), q(lerp(-2, -5, wave) + Math.sin(p * Math.PI * 4) * wave)];
        r.hairLift = 0;
        danceLegs(r, [Math.max(0, rock), [2, 0, 4], [-0.6, -0.4, -4]], [Math.max(0, -rock), [0.6, -0.4, 4], [-2, 0, -4]]);
        if (into > 0.5) r.eyes = 'half';
        if (wave > 0.4) r.mouth = 'cat';
      },
    };
  },
  // Curtain Call (1.4 s, they rise at ~0.7): a deep bow, mic swept out to the side, then she rises
  // with both arms flung up and wide to the crowd, and the fallen get up with her.
  sibow(p) {
    const bow = soft(seg(p, 0.05, 0.35)) * (1 - soft(seg(p, 0.5, 0.66)));
    const rise = ease(seg(p, 0.6, 0.74));
    const hold = soft(seg(p, 0.86, 1));
    return {
      weapon: lerp(lerp(48, 150, bow), 62, rise), arm: lerp(lerp(98, 50, bow), 122, rise) - 40 * hold, tilt: 0.3 * bow - 0.06 * rise * (1 - hold), lift: 3 * rise * (1 - hold),
      rig: (r) => {
        r.backArm = [q(lerp(-6 * bow, 5, rise) * (1 - hold)), q(lerp(-2, -11, rise) * (1 - hold) - 2)];
        r.hairLift = bow > 0.5 ? 1 : rise > 0.3 && hold < 0.5 ? -1 : 0;
        danceLegs(r, [bow, [2.6, 0, 4], [-2.2, -0.6, -12]], [rise, [1, -1.4, 10], [-1.6, -1.6, -20]]);
        if (bow > 0.5) r.eyes = 'happy';
        else if (rise > 0.3) strikeFace(r);
      },
    };
  },
  // Grand Concert (her finisher, 2.4 s): the stage rises under her (the lift), she spreads her arms
  // to the crowd, then sings it out: three big beats, leaning back to belt and throwing the mic out
  // at them on each (the music blasts at ~0.42, ~0.58, ~0.74), and ends on her pose: hip popped,
  // mic out, the free arm up, and a wink.
  siconcert(p) {
    const up = soft(seg(p, 0, 0.22));
    const spread = soft(seg(p, 0.16, 0.32));
    const beat = (a) => ease(seg(p, a - 0.06, a)) * (1 - soft(seg(p, a + 0.02, a + 0.1)));
    const b = Math.max(beat(0.42), beat(0.58), beat(0.76));
    const belt = p > 0.32 && p < 0.8 ? 1 - b : 0;
    const fin = soft(seg(p, 0.84, 0.94)) * (1 - soft(seg(p, 0.97, 1)));
    return {
      weapon: lerp(lerp(lerp(48, 44, spread), 85, b), 62, fin), arm: lerp(lerp(lerp(98, 104, spread), 92, b), 120, fin), lift: 6 * up * (1 - soft(seg(p, 0.95, 1))) + breathe(p) * up,
      tilt: -0.08 * belt * spread + 0.1 * b - 0.06 * fin, lunge: 4 * b,
      rig: (r) => {
        r.backArm = [q(lerp(lerp(0, -8, spread), -4, b) * (1 - fin) + 3 * fin), q(lerp(-2, -9, spread) * (1 - fin) - 10 * fin)];
        r.hairLift = b > 0.3 ? 1 : belt > 0.5 ? -1 : 0;
        r.cape -= q(4 * b);
        danceLegs(r, [spread, [2.2, 0, 4], [-2.2, 0, -6]], [b, [3.4, 0, 6], [-3, -0.6, -12]], [fin, [3, 0, 6], [-1, -1.4, -24]]);
        strikeFace(r);
        if (belt > 0.6 && spread > 0.5) r.eyes = 'happy';
        if (fin > 0.4) {
          r.eyes = 'wink';
          r.mouth = 'grin';
        }
      },
    };
  },

  // ---------- The Astronomer's moves (her own; docs/design/astronomer.md) ----------
  // A calm, dreamy stargazer who conducts the planets like a slow dance: every figure flows (soft
  // in and out, never a snap), her gaze drifts up to the sky between casts, and the staff moves in
  // wide unhurried arcs held out from her, low or to the side, never across her face. Her free hand
  // floats out to guide the planets.

  // Orbit fling (opener, the planet leaves at ~0.42): the staff drawn back low behind her, then swept
  // up and out in one long arc, the free hand floating forward; a planet slung off its tip.
  asfling(p) {
    const draw = soft(seg(p, 0, 0.3));
    const sweep = soft(seg(p, 0.28, 0.48));
    const hold = soft(seg(p, 0.55, 1));
    return {
      weapon: lerp(lerp(70, 150, draw), 75, sweep), arm: lerp(lerp(55, 35, draw), 95, sweep) - 10 * hold, lunge: 3 * sweep * (1 - hold * 0.5), tilt: -0.04 * draw * (1 - sweep) + 0.05 * sweep * (1 - hold),
      lift: breathe(p) * 0.6 * hold,
      rig: (r) => {
        r.backArm = [q(lerp(-2, 7, sweep) * (1 - hold * 0.4)), q(lerp(-2, -6, sweep))];
        r.hairLift = sweep > 0.3 && hold < 0.5 ? 1 : 0;
        danceLegs(r, [draw * (1 - sweep), [1.2, 0, 4], [-2.2, 0, -8]], [sweep, [2.8, 0, 6], [-2.2, -1, -18]]);
        if (hold > 0.5) r.eyes = 'half';
      },
    };
  },
  // Conducting (second, planets at ~0.35 and ~0.65): she turns the staff in a slow circle out in
  // front of her like a conductor's baton, a planet sent off at each of two beats.
  asconduct(p) {
    const turn = seg(p, 0.08, 0.72);
    const a = turn * Math.PI * 2;
    const into = soft(seg(p, 0, 0.12));
    const hold = soft(seg(p, 0.75, 1));
    return {
      weapon: lerp(70, 75 + Math.sin(a) * 28, into) * (1 - hold) + 80 * hold, arm: lerp(50, 80 + Math.cos(a) * 14, into) * (1 - hold) + 78 * hold, lunge: 1.5 * Math.max(0, Math.sin(a)), tilt: 0.04 * Math.sin(a) * (1 - hold),
      rig: (r) => {
        r.backArm = [q(4 + 3 * Math.cos(a)), q(-4 + 2 * Math.sin(a))];
        danceLegs(r, [Math.max(0, Math.sin(a)), [2.4, 0, 4], [-1, -0.6, -6]], [Math.max(0, -Math.sin(a)), [0.6, -0.6, 4], [-2.4, 0, -6]]);
        r.eyes = 'half';
      },
    };
  },
  // Ringed world (the finish, ~0.5): she lifts her gaze and the staff out to the side, holds a breath
  // there, then brings it round level and low in a wide sweep as a great ringed planet rolls out.
  asring(p) {
    const lift = soft(seg(p, 0.02, 0.36));
    const sweep = soft(seg(p, 0.38, 0.54));
    const hold = soft(seg(p, 0.62, 0.94)) * (1 - soft(seg(p, 0.95, 1)));
    return {
      weapon: lerp(lerp(70, 160, lift), 90, sweep), arm: lerp(lerp(55, 25, lift), 100, sweep) - 8 * hold, lunge: 4 * sweep * (1 - hold * 0.4), tilt: -0.06 * lift * (1 - sweep) + 0.08 * sweep * (1 - hold),
      lift: 1.5 * lift * (1 - sweep),
      rig: (r) => {
        r.backArm = [q(lerp(lerp(0, 6, lift), -3, sweep) + 4 * hold), q(lerp(-2, -9, lift) * (1 - sweep) - 4)];
        r.hairLift = lift > 0.5 && sweep < 0.3 ? -1 : sweep > 0.3 && hold < 0.5 ? 1 : 0;
        r.cape -= q(4 * sweep);
        danceLegs(r, [lift * (1 - sweep), [0.8, -1, 6], [-1.6, 0, -6]], [sweep, [3.4, 0, 6], [-3, -0.6, -14]]);
        if (lift > 0.5 && sweep < 0.3) r.eyes = 'half';
        if (hold > 0.4) r.mouth = 'cat';
      },
    };
  },
  // Stargaze (an opener in her pool, the planet falls at ~0.5): she looks up, lifts the staff's head
  // to the sky out beside her, then tips it down at them; a planet drops out of the sky.
  asgaze(p) {
    const up = soft(seg(p, 0, 0.32));
    const tip = soft(seg(p, 0.36, 0.5));
    const hold = soft(seg(p, 0.6, 1));
    return {
      weapon: lerp(lerp(70, 30, up), 110, tip), arm: lerp(lerp(55, 120, up), 85, tip) - 8 * hold, lift: 1.2 * up * (1 - tip), tilt: -0.07 * up * (1 - tip) + 0.03 * tip * (1 - hold),
      rig: (r) => {
        r.backArm = [q(3 * up), q(-3 - 5 * up * (1 - tip))];
        r.hairLift = up > 0.5 && tip < 0.5 ? -1 : 0;
        danceLegs(r, [up * (1 - tip), [0.6, -1.2, 10], [-1.4, 0, -6]], [tip, [2.2, 0, 4], [-1.8, 0, -8]]);
        if (up > 0.4 && tip < 0.6) r.eyes = 'happy';
      },
    };
  },
  // Slow pirouette (second in her pool, ~0.55): a slow half turn on her toes, the staff trailing
  // low, coming back round to send a planet off the turn.
  aspirouette(p) {
    const a = soft(seg(p, 0.05, 0.5));
    const turning = p > 0.05 && p < 0.5;
    const send = soft(seg(p, 0.48, 0.6));
    const hold = soft(seg(p, 0.65, 1));
    return {
      weapon: turning ? 115 : lerp(115, 80, send), arm: turning ? 45 : lerp(45, 90, send) - 8 * hold, trail: turning,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lunge: 3 * send * (1 - hold * 0.5), lift: 1.5 * bump(p, 0.05, 0.5),
      rig: (r) => {
        r.backArm = turning ? [6, -6] : [q(5 - 2 * hold), q(-5)];
        r.hairLift = turning ? -1 : 0;
        danceLegs(r, [turning ? 1 : 0, [0.6, -1.6, 10], [-0.8, -0.4, -4]], [send, [2.6, 0, 6], [-2.2, -0.6, -12]]);
        r.eyes = 'half';
      },
    };
  },
  // Tracing an orbit (third in her pool, ~0.6): she draws a slow ellipse in the air with the staff's
  // head out in front, and at the close of it a moon slips off along the curve.
  astrace(p) {
    const tr = seg(p, 0.06, 0.58);
    const a = tr * Math.PI * 2;
    const hold = soft(seg(p, 0.62, 1));
    return {
      weapon: 85 + Math.sin(a) * 25 * (tr > 0 && tr < 1 ? 1 : 0), arm: 75 + Math.cos(a) * 18 * (tr > 0 && tr < 1 ? 1 : 0) - 6 * hold, lunge: 2 * Math.sin(a / 2), tilt: 0.03 * Math.sin(a),
      rig: (r) => {
        r.backArm = [q(6 - 2 * hold), q(-6 + Math.sin(a) * 2)];
        danceLegs(r, [Math.sin(a / 2), [2.4, 0, 4], [-1.6, -0.6, -8]]);
        r.eyes = 'half';
        if (hold > 0.5) r.mouth = 'cat';
      },
    };
  },
  // Gathering the sky (a finish in her pool, ~0.55): both arms float up and wide as if lifting the
  // night sky, the staff out to the side, then she lowers them in a slow push and the planet goes.
  asgather(p) {
    const rise = soft(seg(p, 0.04, 0.4));
    const push = soft(seg(p, 0.42, 0.58));
    const hold = soft(seg(p, 0.64, 0.94)) * (1 - soft(seg(p, 0.95, 1)));
    return {
      weapon: lerp(lerp(70, 150, rise), 95, push), arm: lerp(lerp(55, 30, rise), 95, push) - 6 * hold, lift: 2.5 * rise * (1 - push) + breathe(p) * rise * (1 - push), tilt: -0.08 * rise * (1 - push) + 0.06 * push * (1 - hold), lunge: 3 * push,
      rig: (r) => {
        r.backArm = [q(lerp(lerp(0, -4, rise), 8, push)), q(lerp(-2, -12, rise) * (1 - push) - 5 * push)];
        r.hairLift = rise > 0.5 && push < 0.3 ? -1 : push > 0.3 && hold < 0.5 ? 1 : 0;
        danceLegs(r, [rise * (1 - push), [0.6, -1.6, 10], [-0.6, -1.6, -10]], [push, [3, 0, 6], [-2.6, -0.6, -12]]);
        if (rise > 0.5 && push < 0.4) r.eyes = 'happy';
        else if (hold > 0.3) r.eyes = 'half';
      },
    };
  },
  // Up + attack: the staff lifted out and up to the sky beside her, a moon sent up at whatever flies.
  asup(p) {
    const go = soft(seg(p, 0.1, 0.36));
    const hold = soft(seg(p, 0.5, 1));
    return {
      weapon: lerp(70, 35, go), arm: lerp(55, 125, go) - 15 * hold, tilt: -0.07 * go * (1 - hold), lift: 2 * go * (1 - hold),
      rig: (r) => {
        r.backArm = [q(3 * go), q(-3 - 6 * go)];
        r.hairLift = go > 0.5 ? -1 : 0;
        danceLegs(r, [go, [0.6, -1.4, 10], [-1.6, 0, -6]]);
        r.eyes = 'happy';
      },
    };
  },
  // In the air: she floats, knees drawn up softly, and lowers the staff at them below.
  asair(p) {
    const go = soft(seg(p, 0.12, 0.36));
    return {
      weapon: lerp(90, 160, go), arm: lerp(80, 55, go), lift: breathe(p) * 0.8,
      rig: (r) => { r.air = true; r.backArm = [q(5), q(-7)]; r.hairLift = -1; danceLegs(r, [1, [2, -4.6, 30], [-1.6, -3.2, -20]]); r.eyes = 'half'; },
    };
  },
  // Out of a run: she glides on, leaning back, the staff trailing low, and sends a planet off the
  // end of the glide.
  asglide(p) {
    const glide = soft(seg(p, 0, 0.26)) * (1 - soft(seg(p, 0.8, 1)));
    const send = soft(seg(p, 0.36, 0.5));
    return {
      weapon: lerp(150, 85, send), arm: lerp(30, 90, send), tilt: -0.1 * glide * (1 - send * 0.5), lunge: 4 * glide, lift: 2 * glide,
      rig: (r) => { r.backArm = [q(-5 * glide + 5 * send), q(-5)]; r.hairLift = glide > 0.4 ? 1 : 0; danceLegs(r, [glide, [3, -1.6, 20], [-3.4, -1.2, -30]]); r.eyes = 'half'; },
    };
  },
  // Ringed Planet (her skill, ~0.55): she plants the staff's foot and leans on it, the free hand
  // turning slowly as if spinning a globe, then pushes it out: a great ringed planet rolls away.
  asglobe(p) {
    const plant = soft(seg(p, 0, 0.2));
    const spin = seg(p, 0.15, 0.5);
    const push = soft(seg(p, 0.5, 0.62));
    const hold = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(70, 35, plant), arm: lerp(55, 40, plant), lunge: 3 * push * (1 - hold * 0.5), tilt: 0.04 * push,
      rig: (r) => {
        r.backArm = [q(lerp(4, 9, push) + Math.sin(spin * Math.PI * 4) * (1 - push)), q(-5 + Math.cos(spin * Math.PI * 4) * 1.5 * (1 - push))];
        danceLegs(r, [plant, [1.6, 0, 4], [-1.4, 0, -6]], [push, [2.6, 0, 6], [-2, -0.6, -10]]);
        r.eyes = spin > 0 && push < 0.5 ? 'half' : r.eyes;
      },
    };
  },
  // Gravity Well (her skill, ~0.55): she holds the staff out level and draws it slowly in toward
  // herself, as if pulling on something heavy, then turns it down: the well opens where she points.
  aswell(p) {
    const reach = soft(seg(p, 0, 0.25));
    const pull = soft(seg(p, 0.25, 0.5));
    const down = soft(seg(p, 0.52, 0.64));
    const hold = soft(seg(p, 0.7, 1));
    return {
      weapon: lerp(lerp(70, 95, reach), 135, down), arm: lerp(lerp(55, 100, reach), 75, pull) - 10 * hold, lunge: 3 * reach * (1 - pull) - 2 * pull * (1 - down), tilt: -0.06 * pull * (1 - down) + 0.04 * down * (1 - hold),
      rig: (r) => {
        r.backArm = [q(lerp(4, 8, reach) - 6 * pull), q(-5)];
        danceLegs(r, [reach * (1 - pull), [2.8, 0, 6], [-1.6, 0, -8]], [pull, [1, 0, 4], [-3, 0, -10]], [down, [2.4, 0, 4], [-2, 0, -8]]);
        r.eyes = 'half';
        if (pull > 0.4 && down < 0.5) r.mouth = 'open';
      },
    };
  },
  // Lunar Tide (her buff, ~0.5): she lifts the staff upright beside her and closes her eyes; her moons
  // swirl faster round her, and she opens them with a little smile.
  astide(p) {
    const up = soft(seg(p, 0, 0.3));
    const hold = soft(seg(p, 0.75, 1));
    return {
      weapon: lerp(70, 10, up) + 60 * hold, arm: lerp(55, 110, up) - 50 * hold, lift: 2 * up * (1 - hold) + breathe(p) * up * (1 - hold),
      rig: (r) => {
        r.backArm = [q(5 * up * (1 - hold)), q(-3 - 8 * up * (1 - hold))];
        r.hairLift = up > 0.5 && hold < 0.5 ? -1 : 0;
        danceLegs(r, [up * (1 - hold), [0.6, -0.8, 6], [-0.6, -0.8, -6]]);
        if (up > 0.4 && hold < 0.4) r.eyes = 'happy';
        else if (hold > 0.4) r.mouth = 'cat';
      },
    };
  },
  // Planetary Alignment (her finisher, 2.2 s): she rises off the ground, staff out to the side,
  // and draws a long straight line across the sky with it, the planets falling into a row as she
  // goes; she holds it, then sweeps the staff forward and the row fires as one beam; she floats
  // down with a quiet smile.
  asalign(p) {
    const rise = soft(seg(p, 0, 0.18));
    const draw = soft(seg(p, 0.18, 0.55));
    const fire = soft(seg(p, 0.62, 0.7));
    const down = soft(seg(p, 0.85, 1));
    return {
      weapon: lerp(lerp(lerp(70, 130, rise), 60, draw), 90, fire), arm: lerp(lerp(lerp(55, 30, rise), 120, draw), 95, fire), lift: 8 * rise * (1 - down) + breathe(p) * rise * (1 - down),
      tilt: -0.08 * draw * (1 - fire) + 0.1 * fire * (1 - down), lunge: 4 * fire * (1 - down),
      rig: (r) => {
        r.air = rise > 0.3 && down < 0.7;
        r.backArm = [q(lerp(lerp(0, -6, rise), 6, fire)), q(lerp(-2, -10, rise) * (1 - fire) - 5 * fire)];
        r.hairLift = fire > 0.3 && down < 0.5 ? 1 : rise > 0.3 ? -1 : 0;
        r.cape -= q(4 * fire);
        danceLegs(r, [rise * (1 - down), [1.6, -4, 20], [-1.6, -3, -20]], [fire * (1 - down), [3, -2.6, 20], [-3.4, -2, -40]]);
        if (draw > 0.2 && fire < 0.3) r.eyes = 'half';
        else if (fire > 0.3 && down < 0.5) r.mouth = 'open';
        if (down > 0.4) [r.eyes, r.mouth] = ['happy', 'cat'];
      },
    };
  },

  // ---------- The Acrobat Archer's moves (her own; docs/design/acrobat-archer.md) ----------
  // A playful show-off who shoots mid-trick: skips, flips, splits, rolls and pirouettes, the bow
  // drawn and loosed from the top of each one, a wink after the good ones. Every trick is a whole
  // body turning (never stretched); the bow is held out in front, upright or aimed, clear of her
  // face, and the draw hand comes back to the cheek's side, never across it.

  // Skip shot (opener, the arrow leaves at ~0.5): a little skip forward, the bow swung up as she
  // goes, drawn in the air and loosed as she lands, then a twirl of the free hand.
  acskip(p) {
    const skip = Math.sin(Math.PI * seg(p, 0.05, 0.5));
    const raise = ease(seg(p, 0, 0.25));
    const s = bowShot(p, 0.2, 0.5);
    const hold = soft(seg(p, 0.62, 1));
    return {
      weapon: lerp(-40, 10, raise) - 6 * s.kick, arm: lerp(70, 82, raise) + 3 * s.kick, lift: 6 * skip, lunge: 2 * skip - 3 * s.kick, tilt: -0.04 * s.pull - 0.06 * s.kick,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.air = skip > 0.2;
        r.backArm = s.snap > 0 ? [q(-6 + 9 * hold), q(-3 - 5 * hold)] : [q(2 - 6 * s.pull), -1];
        danceLegs(r, [skip, [2.4, -3, 30], [-1.6, -1.6, -20]], [hold, [2, 0, 4], [-0.6, -1.4, -20]]);
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
    const hold = soft(seg(p, 0.7, 1));
    const sh = p < 0.4 ? s1 : s2;
    return {
      ...f, weapon: -6 * sh.kick, arm: 82 - 10 * hold, pull: sh.pull, nock: sh.nock, twang: Math.max(s1.twang, s2.twang),
      rig: (r) => {
        f.rig(r);
        r.backArm = sh.snap > 0 ? [-6, -3] : [q(2 - 6 * sh.pull), -1];
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
    const land = bump(p, 0.7, 0.88);
    const hold = soft(seg(p, 0.8, 1));
    return {
      weapon: 10 - 8 * s.kick, arm: 82 + 4 * s.kick - 6 * hold, lift: 22 * leap - 2 * crouch, lunge: 3 * leap - 4 * s.kick, tilt: -0.06 * split - 0.08 * s.kick,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.air = leap > 0.15;
        r.squat = q(2 * (crouch + land));
        r.backArm = s.snap > 0 ? [q(-7 + 4 * hold), -3] : [q(2 - 6 * s.pull), -1];
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
    const s = bowShot(p, 0.36, 0.6);
    const kneel = soft(seg(p, 0.38, 0.5)) * (1 - soft(seg(p, 0.82, 1)));
    return {
      weapon: rolling ? 30 : 10 - 6 * s.kick, arm: rolling ? 60 : 82, tilt: rolling ? roll * Math.PI * 2 : -0.05 * s.kick, lift: rolling ? 6 * Math.sin(roll * Math.PI) : 0, lunge: rolling ? 4 : -3 * s.kick,
      pull: rolling ? 0 : s.pull, nock: !rolling && s.nock, twang: s.twang,
      rig: (r) => {
        if (rolling) tuck(r);
        r.squat = q(3 * kneel);
        r.backArm = rolling ? [-2, -3] : s.snap > 0 ? [-6, -3] : [q(2 - 6 * s.pull), -1];
        danceLegs(r, [kneel, [3, 0, 10], [-3, 2.4, -80]]);
        if (s.kick > 0.3) strikeFace(r);
      },
    };
  },
  // Pirouette fan (second in her pool, ~0.6): a spin on one toe with the bow held out, coming round
  // to loose three arrows in a fan.
  acspin(p) {
    const a = ease(seg(p, 0.04, 0.44));
    const turning = p > 0.04 && p < 0.44;
    const s = bowShot(p, 0.42, 0.6);
    const hold = soft(seg(p, 0.7, 1));
    return {
      weapon: turning ? -20 : 10 - 6 * s.kick, arm: turning ? 80 : 95 - 6 * hold, trail: turning, lift: 2 * bump(p, 0.04, 0.44),
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      pull: turning ? 0 : s.pull, nock: !turning && s.nock, twang: s.twang, lunge: -3 * s.kick,
      rig: (r) => {
        r.backArm = turning ? [5, -6] : s.snap > 0 ? [q(-6 + 6 * hold), q(-3 - 4 * hold)] : [q(2 - 6 * s.pull), -1];
        r.hairLift = turning ? -1 : 0;
        danceLegs(r, [turning ? 1 : 0, [0.6, -1.2, 10], [-0.6, -3.6, -40]], [s.pull * (turning ? 0 : 1), [2.4, 0, 4], [-2.2, 0, -8]]);
        if (s.kick > 0.3) strikeFace(r);
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
    const land = bump(p, 0.68, 0.86);
    const hold = soft(seg(p, 0.82, 1));
    return {
      weapon: 10 - 6 * s.kick, arm: 82 - 8 * hold, lift: 26 * hop, tilt: flip * Math.PI * 2 - 0.06 * s.kick + 0.12 * hold,
      pull: s.pull, nock: s.nock, twang: s.twang, lunge: 2 * hop,
      rig: (r) => {
        if (flip < 1 && hop > 0.2) tuck(r);
        else danceLegs(r, [hop, [2.4, -3.6, 30], [-2.4, -2.4, -30]], [land, [2.4, 0, 6], [-2.2, 0, -8]]);
        r.air = hop > 0.2;
        r.squat = q(2 * (crouch + land));
        r.backArm = s.snap > 0 ? [-6, -3] : [q(2 - 6 * s.pull), -1];
        r.hairLift = hop > 0.3 ? -1 : 0;
        if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.4) r.eyes = 'happy';
      },
    };
  },
  // Up + attack: a deep backbend, the bow aimed high up and out in front of her (never over her
  // face), an arrow loosed into the sky.
  acup(p) {
    const bend = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.75, 1)));
    const s = bowShot(p, 0.2, 0.5);
    return {
      weapon: -24 - 6 * s.kick, arm: 104, tilt: -0.3 * bend, lunge: -2 * s.kick, pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.backArm = s.snap > 0 ? [-4, -6] : [q(2 - 5 * s.pull), -5];
        r.squat = q(1.5 * bend);
        danceLegs(r, [bend, [3, 0, 10], [-2.6, 0, -6]]);
        r.hairLift = 1;
        if (s.kick > 0.3) strikeFace(r);
      },
    };
  },
  // In the air: knees tucked, then legs kicked out straight as she aims down and looses.
  acair(p) {
    const s = bowShot(p, 0.1, 0.42);
    const kick = soft(seg(p, 0.3, 0.5));
    return {
      weapon: 50 - 8 * s.kick, arm: 38, tilt: 0.4 - 0.12 * s.kick, pull: s.pull * 0.45, nock: s.nock, twang: s.twang,
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
      weapon: rolling ? 30 : 10 - 6 * s.kick, arm: rolling ? 60 : 82, tilt: rolling ? roll * Math.PI * 2 : 0.5 * dive * (p < 0.1 ? 1 : 0), lift: 8 * dive, lunge: 4 * (1 - kneel) - 3 * s.kick,
      pull: rolling ? 0 : s.pull, nock: !rolling && s.nock, twang: s.twang,
      rig: (r) => {
        if (rolling || dive > 0.3) tuck(r);
        r.squat = q(3 * kneel);
        r.backArm = rolling ? [-2, -3] : s.snap > 0 ? [-6, -3] : [q(2 - 6 * s.pull), -1];
        if (!rolling) danceLegs(r, [kneel, [3, 0, 10], [-3, 2.4, -80]]);
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
      weapon: lerp(30, 10, raise) - 8 * s.kick, arm: lerp(60, 82, raise), pull: s.pull, nock: s.nock && raise > 0.2, twang: s.twang,
      lift: 44 * hop, tilt: flip * Math.PI * 2 + 0.12 * crouch, lunge: -3 * s.kick,
      rig: (r) => {
        if (hop > 0.2) tuck(r);
        else r.squat = q(2 * Math.max(crouch, land));
        r.backArm = s.snap > 0 ? [q(-6 + 4 * hold), -3] : [q(2 - 6 * s.pull), -1];
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
  // up, then at the top she opens out wide, aims down and looses a ring of golden arrows over
  // everything below (~0.6 to ~0.8), and drops into a landing pose with a wink.
  acsomersault(p) {
    const crouch = bump(p, 0, 0.16);
    const up = ease(seg(p, 0.12, 0.42));
    const flips = ease(seg(p, 0.14, 0.52));
    const fall = easeIn(seg(p, 0.8, 0.92));
    const land = bump(p, 0.9, 1);
    const high = up * (1 - fall);
    const aim = soft(seg(p, 0.52, 0.6)) * (1 - soft(seg(p, 0.8, 0.86)));
    const rain = rel(p, 0.6, 0.8) ? Math.abs(Math.sin(seg(p, 0.6, 0.8) * Math.PI * 5)) : 0;
    const hold = soft(seg(p, 0.94, 1));
    return {
      weapon: aim > 0 ? 38 - 8 * rain : 0, arm: aim > 0 ? 55 : 95, lift: 62 * high - 3 * crouch, tilt: flips * Math.PI * 6 + 0.4 * aim - 0.1 * rain,
      pull: aim > 0 ? 1 - rain : 0, nock: aim > 0 && rain < 0.5, twang: rain > 0.8 ? 1 : 0,
      rig: (r) => {
        r.air = high > 0.1;
        if (flips > 0 && flips < 1) tuck(r);
        else if (aim > 0) danceLegs(r, [aim, [5, -3, 40], [-5, -3, -40]]);
        else danceLegs(r, [land + hold, [2.8, 0, 6], [-2.6, 0, -10]]);
        r.squat = q(2 * (crouch + land));
        r.backArm = aim > 0 ? [q(2 - 6 * (1 - rain)), -1] : [q(-2 + 6 * hold), q(-3 - 6 * hold)];
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
  // card flicked from her fingers, a smirk and a bow when it lands. The short recurve is held canted
  // at chest height like the Acrobat Archer's, clear of her face; the free hand works the crowd.

  // Flourish (opener, the arrow leaves at ~0.52): her free hand rolls out in a magician's flourish,
  // fingers spreading, then comes back to draw; a sly smile as she looses.
  ptflourish(p) {
    const roll = soft(seg(p, 0, 0.26)) * (1 - soft(seg(p, 0.26, 0.36)));
    const s = bowShot(p, 0.3, 0.52);
    const hold = soft(seg(p, 0.64, 1));
    return {
      weapon: 10 - 6 * s.kick, arm: lerp(70, 82, soft(seg(p, 0.1, 0.3))), lunge: -2 * s.kick, tilt: -0.04 * s.kick,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.backArm = roll > 0.05 ? [q(6 * roll + Math.sin(p * 30) * roll), q(-4 - 4 * roll)] : s.snap > 0 ? [q(-6 + 5 * hold), q(-1 - 2 * hold)] : [q(2 - 6 * s.pull), -1];
        danceLegs(r, [s.pull, [2.2, 0, 4], [-1.8, -0.4, -10]]);
        if (roll > 0.4) r.eyes = 'half';
        if (hold > 0.4) [r.eyes, r.mouth] = ['half', 'cat'];
      },
    };
  },
  // Cape swirl (second, arrows at ~0.38 and ~0.66): a half turn away with the cape swirling round
  // her, back round to loose one, and another.
  ptswirl(p) {
    const turned = p > 0.08 && p < 0.24;
    const s1 = bowShot(p, 0.2, 0.38);
    const s2 = bowShot(p, 0.44, 0.66);
    const sh = p < 0.42 ? s1 : s2;
    const swirl = bump(p, 0.02, 0.4);
    return {
      weapon: turned ? -30 : 10 - 6 * sh.kick, arm: turned ? 60 : 82, turn: turned ? -1 : 1, trail: turned,
      pull: turned ? 0 : sh.pull, nock: !turned && sh.nock, twang: Math.max(s1.twang, s2.twang), lunge: -2 * sh.kick,
      rig: (r) => {
        r.cape -= q(6 * swirl);
        r.hairLift = swirl > 0.4 ? -1 : 0;
        r.backArm = turned ? [4, -5] : sh.snap > 0 ? [-6, -1] : [q(2 - 6 * sh.pull), -1];
        danceLegs(r, [swirl, [1, -0.8, 6], [-2, -1.2, -16]]);
        if (sh.kick > 0.3) strikeFace(r);
      },
    };
  },
  // Ta-da (the finish, ~0.54): she sweeps her free arm open wide as if pulling away a cloth, holds
  // the reveal, then a full draw and a big arrow; she ends with a little bow and a smirk.
  ptreveal(p) {
    const reveal = soft(seg(p, 0.02, 0.2)) * (1 - soft(seg(p, 0.26, 0.34)));
    const s = bowShot(p, 0.3, 0.54);
    const bow = soft(seg(p, 0.7, 0.86)) * (1 - soft(seg(p, 0.94, 1)));
    return {
      weapon: 10 - 8 * s.kick + 40 * bow, arm: 82 - 30 * bow, lunge: -3 * s.kick, tilt: -0.06 * s.kick + 0.22 * bow - 0.05 * reveal,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.backArm = reveal > 0.05 ? [q(-8 * reveal), q(-6 * reveal)] : s.snap > 0 && bow < 0.2 ? [-6, -1] : bow > 0.1 ? [q(4 * bow), q(2 * bow)] : [q(2 - 6 * s.pull), -1];
        r.cape -= q(4 * reveal + 3 * s.kick);
        danceLegs(r, [reveal, [2.4, 0, 4], [-2.4, 0, -6]], [bow, [1.6, 0, 4], [-2.4, -1, -30]]);
        if (s.kick > 0.3) strikeFace(r);
        else if (bow > 0.3) [r.eyes, r.mouth] = ['half', 'cat'];
        else if (reveal > 0.4) r.mouth = 'grin';
      },
    };
  },
  // Card flick (an opener in her pool, the arrow at ~0.5): a playing card flicked from her fingers
  // at them first (it flies with the arrow's effect), then a quick shot.
  ptcard(p) {
    const flick = bump(p, 0.04, 0.24);
    const s = bowShot(p, 0.26, 0.5);
    const hold = soft(seg(p, 0.62, 1));
    return {
      weapon: 10 - 6 * s.kick, arm: 82, lunge: -2 * s.kick, pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.backArm = flick > 0.05 ? [q(9 * flick), q(-5 * flick)] : s.snap > 0 ? [q(-6 + 4 * hold), -1] : [q(2 - 6 * s.pull), -1];
        if (flick > 0.5) r.eyes = 'wink';
        else if (hold > 0.5) r.mouth = 'cat';
      },
    };
  },
  // Lazy lean (second in her pool, arrows at ~0.36 and ~0.62): she leans back on one hip, bored,
  // and looses two from low at the hip without looking.
  ptlean(p) {
    const lean = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.82, 1)));
    const s1 = bowShot(p, 0.14, 0.36);
    const s2 = bowShot(p, 0.4, 0.62);
    const sh = p < 0.38 ? s1 : s2;
    return {
      weapon: 24 - 6 * sh.kick, arm: 62, tilt: -0.1 * lean, pull: sh.pull, nock: sh.nock, twang: Math.max(s1.twang, s2.twang),
      rig: (r) => {
        r.backArm = sh.snap > 0 ? [-4, 2] : [q(1 - 5 * sh.pull), 1];
        danceLegs(r, [lean, [2.6, 0, 6], [-1, -1, -20]]);
        r.eyes = 'half';
      },
    };
  },
  // Curtsy (a finish in her pool, ~0.6): a deep curtsy, the bow held out to the side, then she rises
  // straight into a full draw and a big arrow.
  ptcurtsy(p) {
    const dip = soft(seg(p, 0.02, 0.24)) * (1 - soft(seg(p, 0.3, 0.42)));
    const s = bowShot(p, 0.38, 0.6);
    const hold = soft(seg(p, 0.72, 1));
    return {
      weapon: dip > 0.05 ? lerp(10, 70, dip) : 10 - 8 * s.kick, arm: dip > 0.05 ? lerp(82, 40, dip) : 82, tilt: 0.16 * dip - 0.06 * s.kick, lunge: -3 * s.kick,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.squat = q(2 * dip);
        r.backArm = dip > 0.05 ? [q(-6 * dip), q(2 * dip)] : s.snap > 0 ? [q(-6 + 4 * hold), -1] : [q(2 - 6 * s.pull), -1];
        danceLegs(r, [dip, [2, 0, 4], [-4, 1.6, -60]]);
        if (dip > 0.4) r.eyes = 'happy';
        else if (s.kick > 0.3) strikeFace(r);
        else if (hold > 0.4) [r.eyes, r.mouth] = ['half', 'cat'];
      },
    };
  },
  // Up + attack: hand on her hip, she tips the bow up out in front of her and looses into the sky.
  ptup(p) {
    const s = bowShot(p, 0.16, 0.46);
    const up = soft(seg(p, 0, 0.2));
    return {
      weapon: lerp(10, -14, up) - 6 * s.kick, arm: lerp(82, 94, up), tilt: -0.16 * up, pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.backArm = s.snap > 0 ? [-3, 2] : s.pull > 0.05 ? [q(2 - 5 * s.pull), -3] : [-3, 3];
        danceLegs(r, [up, [1.6, 0, 4], [-1.4, -0.6, -10]]);
        if (s.kick > 0.3) strikeFace(r);
        else r.eyes = 'half';
      },
    };
  },
  // In the air: she floats, cape billowing up round her, and looses down at them.
  ptair(p) {
    const s = bowShot(p, 0.08, 0.4);
    return {
      weapon: 50 - 8 * s.kick, arm: 38, tilt: 0.36 - 0.1 * s.kick, lift: breathe(p) * 0.8, pull: s.pull * 0.45, nock: s.nock, twang: s.twang,
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
  // Out of a run: a low smoke-step glide (she vanishes in a puff and slides out of it further on),
  // turning into a shot.
  ptdash(p) {
    const glide = soft(seg(p, 0, 0.2)) * (1 - soft(seg(p, 0.5, 0.7)));
    const s = bowShot(p, 0.36, 0.58);
    return {
      weapon: 10 - 6 * s.kick, arm: lerp(40, 82, soft(seg(p, 0.2, 0.4))), tilt: 0.14 * glide, lunge: 3 * glide - 2 * s.kick,
      pull: s.pull, nock: s.nock, twang: s.twang,
      rig: (r) => {
        r.squat = q(2 * glide);
        r.cape -= q(5 * glide);
        r.backArm = glide > 0.3 ? [-6, -2] : s.snap > 0 ? [-6, -1] : [q(2 - 6 * s.pull), -1];
        danceLegs(r, [glide, [3, 0, 10], [-4, -1, -40]]);
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
      weapon: 40, arm: 30, lunge: 1.5 * down,
      rig: (r) => {
        r.squat = q(3 * down);
        r.backArm = [q(4 + 2 * slap), q(5 * down + 3 * slap - 2)];
        r.cape -= q(4 * slap);
        danceLegs(r, [down, [2.6, 0, 10], [-2.2, 1, -40]]);
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
  // Grand Illusion (her finisher, 2.4 s): she sweeps the cape up in front of her (~0.12), snaps her
  // fingers and is gone in smoke (the copies take the stage; she holds the cape pose while hidden),
  // reappears at ~0.8 and takes a deep, slow bow as they all loose, then rises with a smirk.
  ptillusion(p) {
    const sweep = soft(seg(p, 0, 0.12));
    const snap = bump(p, 0.12, 0.22);
    const back = soft(seg(p, 0.78, 0.86));
    const bow = soft(seg(p, 0.84, 0.94)) * (1 - soft(seg(p, 0.97, 1)));
    return {
      weapon: lerp(lerp(10, 40, sweep), 60, bow), arm: lerp(lerp(70, 40, sweep), 40, bow), tilt: 0.28 * bow, lift: breathe(p) * sweep * (1 - back),
      rig: (r) => {
        r.backArm = bow > 0.05 ? [q(5 * bow), q(1 * bow)] : [q(2 * snap + 4 * sweep), q(-10 * snap - 4 * sweep)];
        r.cape -= q(6 * sweep * (1 - back));
        r.hairLift = sweep > 0.5 && back < 0.5 ? -1 : 0;
        danceLegs(r, [sweep, [1.6, -0.6, 6], [-1.6, -0.6, -6]], [bow, [1.8, 0, 4], [-2.6, -1, -30]]);
        if (snap > 0.3) r.eyes = 'wink';
        else if (bow > 0.3) r.eyes = 'happy';
        else if (back > 0.5) [r.eyes, r.mouth] = ['half', 'cat'];
      },
    };
  },

  // ---------- The Sky Dancer's moves (her own; docs/design/sky-dancer.md) ----------
  // She dances on the air: every figure is drawn airborne (legs free, toes pointed), her gloved
  // palms and her feet throwing the wind. Arms stay below her face (out front, wide or low); each
  // figure gathers in, strikes early, and ends floating in a held pose that breathes.

  // Palm push (opener, the gust leaves at ~0.4): she gathers both palms at her chest, knees drawn
  // up, then pushes them out and down at them, legs stretching long behind.
  sdpalm(p) {
    const gather = soft(seg(p, 0, 0.3));
    const push = ease(seg(p, 0.3, 0.44));
    const hold = soft(seg(p, 0.5, 1));
    return {
      weapon: 90, arm: lerp(lerp(50, 30, gather), 72, push) - 6 * hold, lift: 1.5 * breathe(p) * hold, tilt: -0.06 * gather * (1 - push) + 0.1 * push * (1 - hold * 0.5),
      rig: (r) => {
        r.air = true;
        r.backArm = [q(lerp(-2, 6, gather) * (1 - push) + 5 * push), q(lerp(-3, -6, gather) * (1 - push) - 5 * push)];
        r.hairLift = push > 0.3 ? 1 : -1;
        r.cape -= q(3 * push);
        danceLegs(r, [gather * (1 - push), [3.6, -7, 50], [0.6, -6, 30]], [push, [2.4, -2, 10], [-8.6, -5, -50]], [hold, [3, -3.4, 20], [-6.4, -3.6, -36]]);
        if (push > 0.3) strikeFace(r);
      },
    };
  },
  // Scissor kick (second, ~0.45): the legs switch in the air, the front one kicking high and the
  // wind leaving off its toe; the arms open wide for balance.
  sdscissor(p) {
    const load = soft(seg(p, 0, 0.3));
    const kick = ease(seg(p, 0.3, 0.46));
    const hold = soft(seg(p, 0.55, 1));
    return {
      weapon: 90, arm: lerp(45, 30, load) + 30 * kick - 10 * hold, tilt: -0.14 * kick * (1 - hold * 0.6) + 0.04 * load * (1 - kick), lift: 1.5 * breathe(p) * hold,
      rig: (r) => {
        r.air = true;
        r.backArm = [q(-4 - 4 * kick), q(-6 - 2 * kick)];
        r.hairLift = kick > 0.3 ? 1 : 0;
        danceLegs(r, [load * (1 - kick), [-4.6, -4, -30], [4.4, -5, 40]], [kick, [10, -10, 70], [-6.4, -2.4, -30]], [hold, [5.6, -5, 40], [-5.4, -2.6, -24]]);
        if (kick > 0.3) strikeFace(r);
      },
    };
  },
  // Aerial spin (third, ~0.5 all round her): two quick half turns with arms wide and legs pressed
  // together, toes pointed down like a spinning top, ending open.
  sdspin(p) {
    const a = ease(seg(p, 0.08, 0.62)) * 2;
    const turning = p > 0.08 && p < 0.62;
    const open = soft(seg(p, 0.62, 0.85));
    return {
      weapon: 90, arm: turning ? 86 : 80 - 20 * open, lift: 2 * bump(p, 0.08, 0.7) + breathe(p) * open, trail: turning,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = turning ? [-7, -5] : [q(-6 * (1 - open) - 2), q(-5 - 2 * open)];
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.08, 0.7));
        danceLegs(r, [turning ? 1 : 0, [0.6, -1, 6], [-0.6, -1, -6]], [open, [4.4, -4.4, 30], [-5.4, -3, -30]]);
        if (turning) strikeFace(r);
      },
    };
  },
  // Crescent kick (the finish, the great gust leaves at ~0.5): she leans back and swings the front
  // leg right round from behind, over and down in a crescent, both palms pushing after it, and
  // hangs there stretched long.
  sdcrescent(p) {
    const wind = soft(seg(p, 0, 0.32));
    const sweep = ease(seg(p, 0.32, 0.52));
    const hold = soft(seg(p, 0.56, 0.9)) * (1 - soft(seg(p, 0.92, 1)));
    return {
      weapon: 90, arm: lerp(lerp(50, 20, wind), 80, sweep) - 8 * hold, tilt: -0.16 * wind * (1 - sweep) + 0.18 * sweep * (1 - hold * 0.5), lunge: 4 * sweep, lift: 3 * wind * (1 - sweep) + breathe(p) * hold,
      rig: (r) => {
        r.air = true;
        r.backArm = [q(-6 * wind * (1 - sweep) + 5 * sweep), q(-6 * wind * (1 - sweep) - 4 * sweep)];
        r.hairLift = sweep > 0.3 ? 1 : -1;
        r.cape -= q(5 * sweep);
        danceLegs(r, [wind * (1 - sweep), [-8, -7, -60], [2.4, -5, 40]], [sweep, [10.4, -5, 50], [-8, -4.4, -56]], [hold, [7, -3, 30], [-8.6, -5, -60]]);
        if (sweep > 0.2) strikeFace(r);
      },
    };
  },
  // Twirl (opener in her pool, ~0.5): one turn with an arm drawn in, then it unfurls in a palm push.
  sdtwirl(p) {
    const a = ease(seg(p, 0.05, 0.42));
    const turning = p > 0.05 && p < 0.42;
    const push = ease(seg(p, 0.42, 0.54));
    const hold = soft(seg(p, 0.6, 1));
    return {
      weapon: 90, arm: turning ? 30 : lerp(30, 80, push) - 10 * hold, trail: turning, lift: breathe(p) * hold,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = turning ? [3, -4] : [q(-6 * push), q(-4 - 2 * push)];
        r.hairLift = turning ? -1 : 0;
        danceLegs(r, [turning ? 1 : 0, [3, -7, 40], [-0.6, -1.4, -6]], [push, [3.6, -2.6, 20], [-7.4, -4, -40]], [hold, [3.4, -4, 24], [-5.6, -3, -30]]);
        if (push > 0.3) strikeFace(r);
      },
    };
  },
  // Flutter (second in her pool, gusts at ~0.3 and ~0.6): both arms beat down twice like wings,
  // lifting her a little each time, legs fluttering below.
  sdflutter(p) {
    const beat = (u) => Math.sin(Math.PI * clamp01(u));
    const b1 = beat(seg(p, 0.1, 0.4));
    const b2 = beat(seg(p, 0.4, 0.7));
    const flap = Math.max(b1, b2);
    const hold = soft(seg(p, 0.72, 1));
    return {
      weapon: 90, arm: 100 - 70 * flap - 20 * hold, lift: 3 * flap + breathe(p) * hold,
      rig: (r) => {
        r.air = true;
        r.backArm = [q(-6 + 4 * flap), q(-8 + 6 * flap)];
        r.hairLift = flap > 0.5 ? 1 : -1;
        danceLegs(r, [1, [2.6 + 2 * flap, -4.4 - 2 * flap, 24 + 16 * flap], [-3.4 - 2 * flap, -3, -24 - 10 * flap]], [hold, [3.4, -4, 20], [-5, -3, -26]]);
        if (flap > 0.5) strikeFace(r);
      },
    };
  },
  // Axe heel (third in her pool, ~0.55): the front leg rises straight up past her shoulder, then
  // chops down, the wind falling off the heel onto whatever is below.
  sdheel(p) {
    const raise = soft(seg(p, 0, 0.4));
    const chop = ease(seg(p, 0.42, 0.56));
    const hold = soft(seg(p, 0.6, 1));
    return {
      weapon: 90, arm: lerp(40, 70, raise) - 30 * chop, tilt: -0.1 * raise * (1 - chop) + 0.12 * chop * (1 - hold * 0.6), lift: 3 * raise * (1 - chop) + breathe(p) * hold,
      rig: (r) => {
        r.air = true;
        r.backArm = [q(-5 - 2 * raise), q(-6 + 4 * chop)];
        r.hairLift = chop > 0.3 ? -1 : 1;
        danceLegs(r, [raise * (1 - chop), [6, -15, 80], [-1, -1.4, -10]], [chop, [4.4, -1, -10], [-4, -3, -20]], [hold, [3.4, -4, 16], [-5, -3, -28]]);
        if (chop > 0.2) strikeFace(r);
      },
    };
  },
  // Sweeping kick (a finish in her pool, ~0.5): she turns once in the air with the back leg swung
  // out long, and the wind sweeps off it round her; she ends on the turn, arms wide.
  sdsweep(p) {
    const a = ease(seg(p, 0.1, 0.6));
    const turning = p > 0.1 && p < 0.6;
    const hold = soft(seg(p, 0.62, 0.9)) * (1 - soft(seg(p, 0.92, 1)));
    return {
      weapon: 90, arm: turning ? 80 : 84 - 12 * hold, trail: turning, lift: 2 * bump(p, 0.1, 0.6) + breathe(p) * hold,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = turning ? [-7, -4] : [q(-7 * hold), q(-5)];
        r.hairLift = turning ? -1 : 0;
        r.cape -= q(4 * bump(p, 0.1, 0.62));
        danceLegs(r, [turning ? 1 : 0, [0.6, -3, 10], [-11, -6, -70]], [hold, [4.6, -3.6, 24], [-8, -4.6, -50]]);
        if (turning || hold > 0.3) strikeFace(r);
      },
    };
  },
  // Rising spiral (Up + attack, ~0.4): she spirals straight up, one turn, arms sweeping up to her
  // shoulders and legs pressed together, throwing them up with her.
  sdrise(p) {
    const a = ease(seg(p, 0.1, 0.55));
    const turning = p > 0.1 && p < 0.55;
    const open = soft(seg(p, 0.55, 0.85));
    return {
      weapon: 90, arm: turning ? lerp(40, 115, a) : lerp(115, 70, open), lift: 6 * bump(p, 0.05, 0.75), trail: turning,
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      rig: (r) => {
        r.air = true;
        r.backArm = [q(-4), q(-6 - 4 * a * (1 - open))];
        r.hairLift = -1;
        danceLegs(r, [turning ? 1 : 0, [0.4, 0, 4], [-0.4, 0, -4]], [open, [4, -4.4, 24], [-5, -3, -28]]);
        if (turning) strikeFace(r);
      },
    };
  },
  // Glide (out of a run, ~0.45): she lays out flat along the wind, both palms out in front, legs
  // trailing together behind, then rights herself.
  sdglide(p) {
    const lay = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.7, 1)));
    const push = ease(seg(p, 0.32, 0.46));
    return {
      weapon: 90, arm: lerp(60, 84, push), tilt: 0.3 * lay, lunge: 4 * lay,
      rig: (r) => {
        r.air = true;
        r.backArm = [q(4 * push), q(-4 - 2 * push)];
        r.hairLift = 1;
        r.cape -= q(5 * lay);
        danceLegs(r, [lay, [-6, -4.4, -40], [-9, -5, -60]]);
        if (push > 0.3) strikeFace(r);
      },
    };
  },
  // Sky Waltz (her finisher, 1.6 s): she rises with her arms lifting, turns slowly and then faster
  // and faster as the tornado gathers round her, arms opening wide at the shoulders; at the peak she
  // drives both palms straight down and the tornado slams them into the ground; she floats there in
  // her pose, and curtsies to the sky.
  sdwaltz(p) {
    const rise = soft(seg(p, 0, 0.14));
    const a = easeIn(seg(p, 0.12, 0.64)) * 3;
    const turning = p > 0.12 && p < 0.64;
    const slam = ease(seg(p, 0.64, 0.72));
    const pose = slam * (1 - soft(seg(p, 0.86, 0.92)));
    const bow = soft(seg(p, 0.9, 0.97)) * (1 - soft(seg(p, 0.99, 1)));
    const open = soft(seg(p, 0.12, 0.6));
    return {
      weapon: 90, arm: turning ? lerp(40, 112, open) : lerp(lerp(112, 25, slam), 40, bow),
      turn: turning ? Math.sign(Math.cos(a * Math.PI * 2) || 1) * Math.max(0.35, Math.abs(Math.cos(a * Math.PI * 2))) : 1,
      lift: 5 * rise * (1 - bow * 0.5) + 2 * open * (turning ? 1 : 0) - 2 * slam * (1 - bow) + breathe(p) * pose, tilt: 0.06 * slam * (1 - bow) + 0.26 * bow, trail: turning,
      rig: (r) => {
        r.air = true;
        r.backArm = turning ? [q(-3 - 3 * open), q(-4 - 6 * open)] : [q(4 * slam - 6 * bow), q(-2 * slam - 2 * bow)];
        r.hairLift = slam > 0.3 && bow < 0.4 ? 1 : -1;
        r.cape -= q(5 * (turning ? 1 : pose));
        danceLegs(r, [rise, [0.6, -1.4, 8], [-0.6, -1.4, -8]], [turning ? 1 : 0, [1.2, -3, 30], [-0.6, -1, -6]], [pose, [5, -4.4, 30], [-7, -4, -44]], [bow, [3.6, -1.6, 12], [-2.6, -1, -6]]);
        if (bow > 0.4) r.eyes = 'half';
        else if (turning || pose > 0.3) strikeFace(r);
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
    if (p < 0.6) return MOVES.spin(p / 0.6, 1);
    return backflip(seg(p, 0.62, 0.95), 0.5);
  },

  // A defensive stance: crouch behind the weapon held up across the body.
  guard(p) {
    const k = ease(seg(p, 0, 0.3)) * (1 - ease(seg(p, 0.85, 1)));
    return {
      weapon: lerp(25, 65, k), arm: lerp(60, 70, k), tilt: -0.08 * k, lunge: -2 * k,
      rig: (r) => { r.squat = k > 0.5 ? 2 : 1; wideLegs(r); r.backArm = [3, -2]; r.tx = -1; },
    };
  },

  // ---------- The Spirit Mage's shrine dance (her pool, PATH_VARIANTS in world/melee.js) ----------
  // She casts the way a shrine maiden dances kagura (research/anim.md 6): mai is turning and
  // circling, slow and elegant, swaying side to side, with a bell staff in one hand and a folding
  // fan in the other. So every spell is a sway, a turn, a sliding step or a bow that settles into a
  // clear held pose; the wand is held upright like a kagura suzu and only tipped and rung with the
  // wrist (never swung like a club), and the fan opens and sweeps in her free hand (`fan`, `fanA`,
  // drawn by hero.js). Poses are big (wide spreads, rising onto her toes, deep bows, long glides)
  // so they read at game size, and they flow: each phase eases into the next and holds a beat.
  // Each figure lasts about a second (the player asked for slow, elegant and smooth).

  // The opening sweep (bolt at ~0.55): she gathers in, knees soft, wand upright at her breast and
  // the fan folded to it, sways back; then glides a long step forward, rising, the wand tipping out
  // to send the bolt while the fan opens and sweeps wide behind her; and holds the pose.
  kagura(p) {
    const gather = soft(seg(p, 0, 0.32));
    const open = soft(seg(p, 0.3, 0.6));
    const settle = soft(seg(p, 0.78, 1));
    const hold = 1 - settle;
    const air = breathe(p) * open * hold;
    return {
      weapon: lerp(10, -15, gather) + 70 * open * hold + 20 * settle, arm: lerp(70, 105, gather) + 25 * open - 30 * settle,
      tilt: -0.14 * gather * (1 - open) + 0.16 * open * hold, lunge: -3 * gather * (1 - open) + 10 * open * hold, lift: 3 * open * hold + air,
      fan: lerp(0.1, 0, gather) + open * hold, fanA: lerp(20, 0, gather) - 70 * open * hold + 8 * air,
      rig: (r) => {
        r.backArm = [q(lerp(0, 3, gather) - 11 * open * hold), q(lerp(0, -3, gather) - 6 * open * hold)];
        r.cape -= q(2 * gather * (1 - open) + 5 * open * hold);
        r.hairLift = open * hold > 0.4 ? -1 : 0;
        r.squat = q(gather * (1 - open));
        danceLegs(r, [gather * (1 - open), [0.8, 0, 2], [-1.6, 0, -4]], [open * hold, [4.6, -1, 8], [-4, 0, -14]]);
        if (open * hold > 0.3) strikeFace(r);
        else if (gather > 0.3 && open < 0.2) r.eyes = 'half';
      },
    };
  },
  // The swaying step (bolt at ~0.6): on her toes with both arms spread wide at shoulder height,
  // she sways back and then forward from the hips, sleeves swinging out, while the open fan circles
  // once all the way round her; it comes up over her head as the wand tips forward to send the
  // bolt; holds. (She never spins: a turn is a mirror flip, which jars in a slow dance.)
  kaguraturn(p) {
    const t = soft(seg(p, 0, 0.56));
    const face = soft(seg(p, 0.48, 0.66));
    const settle = soft(seg(p, 0.8, 1));
    const hold = 1 - settle;
    const toe = soft(seg(p, 0, 0.12)) * (1 - face);
    const sway = -Math.sin(t * Math.PI * 2);
    return {
      weapon: -10 + 65 * face * hold + 30 * settle, arm: lerp(95, 120, face) - 30 * settle, lift: 6 * bump(p, 0.04, 0.6) + breathe(p) * face * hold,
      tilt: 0.12 * sway + 0.14 * face * hold, lunge: 3 * sway + 6 * face * hold,
      fan: 1 * hold + 0.1, fanA: -80 + 360 * t + 110 * face,
      rig: (r) => {
        r.tx = q(1.5 * sway);
        r.backArm = [q(lerp(-11, -1, face)), q(lerp(-4, -13, face))];
        r.cape -= q(5 * Math.sin(t * Math.PI) + 2);
        r.hairLift = -1;
        danceLegs(r, [toe, [1.4, -2.4, 16], [-0.6, 0, -4]], [face * hold, [3.2, 0, 4], [-2.7, 0, -10]]);
        if (face * hold > 0.3) strikeFace(r);
      },
    };
  },
  // The dance's last figure (great bolt at ~0.6): rising high onto her toes, swaying side to side
  // twice, the wand held straight up and ringing while the open fan circles twice over her head;
  // then she sinks into a deep sweeping bow-lunge, the wand tipping down at them as the great bolt
  // goes, the fan swept wide behind; holds low.
  kagurafin(p) {
    const spin = soft(seg(p, 0, 0.5));
    const down = soft(seg(p, 0.46, 0.64));
    const settle = soft(seg(p, 0.8, 1));
    const hold = 1 - settle;
    const ring = Math.sin(p * 40) * 10 * (1 - down) * bump(p, 0.05, 0.5);
    const toe = soft(seg(p, 0, 0.1)) * (1 - down);
    const sway = Math.sin(spin * Math.PI * 4) * (1 - down);
    return {
      weapon: -8 + ring + 85 * down * hold + 30 * settle, arm: lerp(175, 85, down) - 25 * settle, lift: 10 * bump(p, 0, 0.56),
      tilt: 0.1 * sway + 0.36 * down * hold, lunge: 2 * sway + 12 * down * hold, fan: 1, fanA: lerp(720 * spin, 610, down),
      rig: (r) => {
        r.backArm = [q(lerp(-1, -12, down)), q(lerp(-13, -2, down))];
        r.cape -= q(5 + 2 * down);
        r.hairLift = -1;
        r.squat = q(2 * down * hold);
        danceLegs(r, [toe, [1.2, -3, 18], [-0.8, -1, -6]], [down * hold, [5, -1, 10], [-5, 0, -20]]);
        if (down * hold > 0.3) strikeFace(r);
      },
    };
  },
  // Ringing the bells (~0.3, 0.5, 0.7): the wand raised high and rung like a suzu, three counted
  // shakes of the wrist, a little rise onto her toes and a sway from hip to hip on each, the fan
  // open at her hip swaying the other way.
  bellshake(p) {
    const up = soft(seg(p, 0, 0.2));
    const down = soft(seg(p, 0.82, 1));
    const beat = seg(p, 0.2, 0.82) * 3;
    const ring = Math.sin(beat * Math.PI * 2);
    const side = Math.sin(beat * Math.PI);
    const k = up * (1 - down);
    return {
      weapon: -5 + 18 * ring * k + 40 * down, arm: lerp(80, 170, up) - 80 * down, lift: 4 * Math.abs(side) * k, tilt: 0.14 * side * k,
      fan: 0.9 * k + 0.1, fanA: -40 - 30 * side * k,
      rig: (r) => {
        r.tx = q(1.6 * side * k);
        r.backArm = [q(-6 * k), q(1 - 3 * k)];
        r.cape -= q(Math.abs(side) * 4 * k);
        r.hairLift = Math.abs(side) * k > 0.5 ? -1 : 0;
        danceLegs(r, [k, [1.4, 0, 4], [-1.4, 0, -4]], [k * Math.max(0, side), [2.4, -1.6, 14], [-1.4, 0, -4]], [k * Math.max(0, -side), [1.4, 0, 4], [-2.4, -1.6, -14]]);
        if (k > 0.5) r.mouth = 'open';
      },
    };
  },
  // The fan sweep (bolts at ~0.52): a long gliding side step, low, the fan sweeping in a wide arc
  // from behind her right round in front (over her body), opening as it goes, the wand held upright
  // at her shoulder and tipping out as the fan passes.
  sleevefan(p) {
    const gather = soft(seg(p, 0, 0.3));
    const sweep = soft(seg(p, 0.28, 0.58));
    const settle = soft(seg(p, 0.78, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(5, -10, gather) + 60 * sweep * hold + 15 * settle, arm: lerp(70, 130, gather) - 20 * sweep - 30 * settle,
      tilt: -0.16 * gather * (1 - sweep) + 0.2 * sweep * hold, lunge: -5 * gather * (1 - sweep) + 12 * sweep * hold, lift: breathe(p) * sweep * hold,
      fan: lerp(0.2, 0.6, gather) + 0.4 * sweep, fanA: lerp(-100, -120, gather) + 200 * sweep * hold - 40 * settle, fanFront: sweep > 0.45 && hold > 0.3,
      rig: (r) => {
        r.backArm = [q(lerp(-10, -11, gather) + 18 * sweep * hold), q(-3 - 4 * sweep * hold)];
        r.cape -= q(6 * sweep * hold);
        r.hairLift = sweep > 0.3 ? -1 : 0;
        r.squat = q(gather * (1 - settle));
        danceLegs(r, [1, [1 + 4 * sweep * hold, 0, 6], [-2 - 3 * gather, 0, -14]]);
        if (sweep > 0.3) strikeFace(r);
      },
    };
  },
  // The bow and rise (great bolt at ~0.6): a deep, slow bow, both hands brought together low
  // before her, eyes closed; then she rises right up onto her toes, both arms sweeping up overhead
  // (wand and open fan high), and throws the spell up and out; holds high.
  bowrise(p) {
    const bow = soft(seg(p, 0, 0.38)) * (1 - soft(seg(p, 0.42, 0.62)));
    const rise = soft(seg(p, 0.42, 0.62));
    const settle = soft(seg(p, 0.8, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, 40, bow) - 30 * rise * hold + 25 * settle, arm: lerp(70, 40, bow) + 140 * rise * hold - 20 * settle,
      tilt: 0.45 * bow - 0.14 * rise * hold, lift: 8 * rise * hold + breathe(p) * rise * hold,
      fan: 0.15 + 0.85 * rise * hold, fanA: lerp(60, 120, bow) - 130 * rise,
      rig: (r) => {
        r.backArm = [q(lerp(0, 4, bow) - 2 * rise), q(lerp(0, 1, bow) - 13 * rise * hold)];
        r.squat = q(2 * bow);
        if (bow > 0.4) r.eyes = 'blink';
        r.hairLift = rise > 0.3 ? -1 : 0;
        r.cape -= q(4 * rise * hold);
        danceLegs(r, [bow, [3, 0, 2], [-3, 0, -2]], [rise * hold, [1.4, -2.2, 14], [-1.4, -1.4, -10]]);
        if (rise * hold > 0.3) strikeFace(r);
      },
    };
  },
  // Rising on one foot (bolt at ~0.58): a soft hop up with the other leg lifted high behind her,
  // leaning forward into it, arms spread wide, the open fan circling once round her, sleeves
  // flying; she lands soft with the wand tipping out to them.
  twirlstep(p) {
    const t = soft(seg(p, 0.05, 0.5));
    const point = soft(seg(p, 0.46, 0.64));
    const settle = soft(seg(p, 0.8, 1));
    const hold = 1 - settle;
    const up = soft(seg(p, 0.04, 0.16)) * (1 - soft(seg(p, 0.42, 0.54)));
    return {
      weapon: -10 + 70 * point * hold + 25 * settle, arm: lerp(100, 115, t) - 15 * point - 20 * settle, lift: 10 * bump(p, 0.05, 0.55),
      tilt: 0.16 * up + 0.1 * point * hold, lunge: 6 * point * hold, fan: 1, fanA: -90 + 360 * t + 40 * point,
      rig: (r) => {
        r.backArm = [-11, q(-5 + 2 * point)];
        r.hairLift = -1;
        r.cape -= 5;
        r.air = up > 0.5;
        danceLegs(r, [up, [1.4, -1, 8], [-4, -7, -60]], [point * hold, [2.9, 0, 4], [-2.4, 0, -10]]);
        if (point * hold > 0.3) strikeFace(r);
      },
    };
  },
  // Up + attack (bolt at ~0.5): both arms sweep up from low together, rising onto her toes, the
  // wand tipping up at whatever flies and the fan opening overhead.
  kaguraup(p) {
    const low = soft(seg(p, 0, 0.3));
    const up = soft(seg(p, 0.28, 0.52));
    const settle = soft(seg(p, 0.78, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, 50, low) - 60 * up * hold + 30 * settle, arm: lerp(70, 30, low) + 150 * up * hold - 30 * settle, tilt: 0.16 * low * (1 - up) - 0.18 * up * hold, lift: 7 * up * hold + breathe(p) * up * hold,
      fan: 0.2 + 0.8 * up * hold, fanA: lerp(90, 140, low) - 160 * up,
      rig: (r) => {
        r.backArm = [q(3 * low - 3 * up), q(-13 * up * hold)];
        r.squat = q(low * (1 - up));
        r.hairLift = -1;
        r.cape -= q(4 * up);
        danceLegs(r, [up * hold, [1.4, -2, 14], [-1, -1.4, -10]]);
        if (up * hold > 0.3) strikeFace(r);
      },
    };
  },
  // In the air: she floats, arms and sleeves spread like wings, fan open, and sweeps the wand
  // down at them.
  floatcast(p) {
    const sweep = soft(seg(p, 0.15, 0.52));
    return {
      weapon: lerp(-20, 70, sweep), arm: lerp(150, 80, sweep), tilt: 0.14 * sweep, fan: 1, fanA: lerp(-60, -110, sweep) + 8 * breathe(p),
      rig: (r) => { tuck(r); r.backArm = [-11, q(-6 + 3 * sweep)]; r.hairLift = -1; r.cape -= 5; if (sweep > 0.3) strikeFace(r); },
    };
  },
  // Floating with everything spread while the open fan circles once round her, then the wand and
  // fan sweep down together.
  floatcast2(p) {
    const t = soft(seg(p, 0, 0.45));
    const down = soft(seg(p, 0.4, 0.58));
    return {
      weapon: -10 + 85 * down, arm: lerp(160, 70, down), tilt: 0.2 * down, fan: 1, fanA: lerp(-90 + 360 * t, 380, down), fanFront: down > 0.5,
      rig: (r) => { tuck(r); r.backArm = [q(-11 + 14 * down), q(-6 + 2 * down)]; r.hairLift = -1; r.cape -= 6; if (down > 0.3) strikeFace(r); },
    };
  },
  // Out of a run (bolt at ~0.5): a long low glide on sliding feet, leaning in, the fan trailing
  // open behind her and the wand held back; then the wand tips forward to send the bolt as she
  // rises.
  glidecast(p) {
    const tip = soft(seg(p, 0.36, 0.56));
    const glide = 1 - tip;
    const settle = soft(seg(p, 0.8, 1));
    return {
      weapon: lerp(-20, 60, tip) * (1 - settle) + 20 * settle, arm: lerp(60, 115, tip) - 25 * settle, tilt: 0.24 * glide, lunge: 6 * tip * (1 - settle), fan: 1, fanA: -100 - 20 * glide,
      rig: (r) => { r.backArm = [-11, q(-3 - 2 * glide)]; r.hairLift = -1; r.cape -= q(6 * glide); r.squat = q(glide); danceLegs(r, [1 - settle, [4.6, 0, 6], [-5, -1, -24]]); if (tip > 0.3) strikeFace(r); },
    };
  },
  // Spirit Step: the fan opens and lifts to hide her face as she rises on her toes, sleeves
  // sweeping round, and she's gone into streamers and light (faded out while she crosses),
  // gathering again ahead with a curtsy, the fan closing.
  spiritstep(p) {
    const t = soft(seg(p, 0, 0.3));
    const gone = clamp01(seg(p, 0.18, 0.32) * (1 - seg(p, 0.7, 0.86)));
    const land = bump(p, 0.76, 1);
    return {
      weapon: lerp(10, -10, t), arm: lerp(70, 120, t) - 50 * land, lift: 5 * bump(p, 0, 0.35), fade: gone,
      fan: 1 - 0.8 * soft(seg(p, 0.85, 1)), fanA: lerp(-20, 40, t), fanFront: true,
      rig: (r) => { r.backArm = [q(lerp(0, 5, t)), q(lerp(0, -9, t))]; r.hairLift = -1; r.cape -= 4; r.squat = q(land); danceLegs(r, [land, [3, 0, 2], [-3, 0, -2]]); if (land > 0.3) r.eyes = 'happy'; },
    };
  },

  // ---------- Her skills' figures ----------
  // Spirit Wave (the ring goes at ~0.5): she lifts the bell staff high in both hands, rising, the
  // fan folded to it; then brings it straight down and plants its foot on the floor before her,
  // sinking low, the fan swept wide behind as the ring of light races out; holds, bells ringing.
  kaguraslam(p) {
    const lift = soft(seg(p, 0, 0.38));
    const down = soft(seg(p, 0.4, 0.52));
    const settle = soft(seg(p, 0.8, 1));
    const hold = 1 - settle;
    const ring = Math.sin(p * 50) * 6 * bump(p, 0.5, 0.8);
    return {
      weapon: lerp(10, -5, lift) + 175 * down * hold + 20 * settle + ring, arm: lerp(70, 172, lift) - 120 * down - 20 * settle,
      tilt: -0.08 * lift * (1 - down) + 0.3 * down * hold, lunge: 8 * down * hold, lift: 5 * lift * (1 - down),
      fan: lerp(0.2, 0.3, lift) + 0.7 * down * hold, fanA: lerp(20, 10, lift) - 130 * down * hold,
      rig: (r) => {
        r.backArm = [q(lerp(0, 2, lift) - 11 * down * hold), q(lerp(0, -11, lift) + 7 * down)];
        r.squat = q(2 * down * hold);
        r.cape -= q(3 * lift + 4 * down * hold);
        r.hairLift = lift * (1 - down) > 0.5 || down * hold > 0.5 ? -1 : 0;
        danceLegs(r, [lift * (1 - down), [1.4, -2.2, 14], [-1.4, -1.4, -10]], [down * hold, [5, 0, 8], [-4.4, 0, -16]]);
        if (down * hold > 0.3) strikeFace(r);
      },
    };
  },
  // Blessing (the light falls at ~0.55): eyes closed, she raises the bell staff over her head and
  // rings it, slow, three times, the fan held to her heart; then opens both arms wide and lifts her
  // face as the light comes down, and holds, smiling.
  kagurabless(p) {
    const up = soft(seg(p, 0, 0.22));
    const open = soft(seg(p, 0.48, 0.62));
    const settle = soft(seg(p, 0.82, 1));
    const hold = 1 - settle;
    const ring = Math.sin(seg(p, 0.18, 0.5) * Math.PI * 6) * 14 * up * (1 - open);
    return {
      weapon: -5 + ring + 25 * open * hold + 25 * settle, arm: lerp(70, 168, up) - 50 * open - 40 * settle,
      tilt: -0.1 * open * hold, lift: 2 * up * (1 - open) + 4 * open * hold + breathe(p) * open * hold,
      fan: lerp(0.3, 0.2, up) + 0.8 * open * hold, fanA: lerp(30, 70, up) * (1 - open) - 100 * open * hold,
      rig: (r) => {
        r.backArm = [q(lerp(0, 4, up) * (1 - open) - 11 * open * hold), q(lerp(0, -5, up) * (1 - open) - 9 * open * hold)];
        r.hairLift = open * hold > 0.4 ? -1 : 0;
        r.cape -= q(4 * open * hold);
        danceLegs(r, [open * hold, [1.4, -1.4, 10], [-1.4, -1.4, -10]]);
        if (open * hold > 0.4) r.eyes = 'happy';
        else if (up > 0.3) r.eyes = 'blink';
      },
    };
  },
  // Spirit Ward (the ward forms at ~0.62): the open fan sweeps once all the way round her at
  // waist height, passing in front of her and behind, her hips turning with it, the bell staff
  // held upright at the centre; it comes round and closes against her chest as the ward forms.
  kaguraward(p) {
    const t = soft(seg(p, 0.08, 0.6));
    const close = soft(seg(p, 0.56, 0.7));
    const settle = soft(seg(p, 0.82, 1));
    const hold = 1 - settle;
    const ang = t * Math.PI * 2;
    return {
      weapon: -8 + 15 * settle, arm: 95 - 25 * close - 20 * settle, tilt: 0.08 * Math.sin(ang), lunge: 2 * Math.sin(ang),
      lift: 3 * bump(p, 0.08, 0.62) + breathe(p) * close * hold,
      fan: lerp(1, 0.25, close), fanA: -100 + 360 * t + 30 * close, fanFront: Math.cos(ang) < 0 || close > 0.5,
      rig: (r) => {
        r.tx = q(1.5 * Math.sin(ang) * (1 - close));
        r.backArm = [q(-10 * Math.cos(ang) * (1 - close) + 4 * close), q(-4 + 2 * close)];
        r.cape -= q(3 * Math.abs(Math.sin(ang)) + 2);
        r.hairLift = -1;
        danceLegs(r, [1 - close * 0.6, [2.4, 0, 6], [-2.4, 0, -8]], [close * hold, [1.4, -1, 8], [-1, 0, -4]]);
        if (close * hold > 0.4) r.eyes = 'half';
      },
    };
  },
  // Heaven's Lantern (the lantern goes up at ~0.48): a deep, slow bow with both hands together
  // low before her, eyes closed; then she straightens and lifts both arms high, slowly, as if
  // raising the lantern into the sky herself, up on her toes, and holds there, looking up at it.
  kaguralantern(p) {
    const bow = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.32, 0.5)));
    const lift = soft(seg(p, 0.32, 0.58));
    const settle = soft(seg(p, 0.86, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, 40, bow) - 35 * lift * hold + 25 * settle, arm: lerp(70, 40, bow) + 140 * lift * hold - 20 * settle,
      tilt: 0.5 * bow - 0.16 * lift * hold, lift: 7 * lift * hold + breathe(p) * lift * hold,
      fan: 0.2 + 0.8 * lift * hold, fanA: lerp(60, 120, bow) - 120 * lift,
      rig: (r) => {
        r.backArm = [q(lerp(0, 4, bow) - 3 * lift), q(lerp(0, 1, bow) - 14 * lift * hold)];
        r.squat = q(2 * bow);
        r.hairLift = lift > 0.3 ? -1 : 0;
        r.cape -= q(4 * lift * hold);
        danceLegs(r, [bow, [3, 0, 2], [-3, 0, -2]], [lift * hold, [1.4, -2.4, 14], [-1.4, -1.6, -10]]);
        if (bow > 0.3) r.eyes = 'blink';
        else if (lift * hold > 0.4) [r.eyes, r.mouth] = ['happy', 'open'];
      },
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

  // Gathering (world/gathering.js): crouch and lean in, rummage with the free hand, pluck the find
  // out with a little hop and hold it up to look at, pleased. The weapon rests at her side.
  gather(p) {
    const down = soft(seg(p, 0, 0.22)) * (1 - soft(seg(p, 0.6, 0.74)));
    const rummage = bump(p, 0.24, 0.6) * Math.sin(p * 46);
    const pluck = soft(seg(p, 0.6, 0.74));
    const admire = pluck * (1 - soft(seg(p, 0.9, 1)));
    return {
      weapon: 20, arm: lerp(60, 50, down), tilt: 0.14 * down - 0.04 * admire, lunge: 2 * down, lift: 3 * bump(p, 0.6, 0.82),
      rig: (r) => {
        r.squat = down > 0.5 ? 2 : down > 0.15 ? 1 : 0;
        r.backArm = [q(lerp(0, 4.5, down) + 0.8 * rummage - 1 * admire), q(lerp(0, 5, down) - 7 * admire)];
        r.hairLift = pluck > 0.2 && pluck < 0.9 ? -1 : 0;
        if (admire > 0.5) r.eyes = 'half';
      },
    };
  },

  // Picking fruit overhead (world/gathering.js): up on tiptoe, the free hand stretching up to the
  // bunch, a tug that bounces her down off her toes, then the find held up to look at.
  pluck(p) {
    const reach = soft(seg(p, 0, 0.3)) * (1 - soft(seg(p, 0.55, 0.7)));
    const tug = bump(p, 0.5, 0.72);
    const admire = soft(seg(p, 0.7, 0.82)) * (1 - soft(seg(p, 0.92, 1)));
    return {
      weapon: 20, arm: 60, tilt: -0.08 * reach + 0.05 * tug, lift: 3 * reach - 1.5 * tug,
      rig: (r) => {
        r.backArm = [q(1 + 1.5 * reach - 1 * admire), q(-9 * reach + 3 * tug - 5 * admire)];
        r.hairLift = reach > 0.5 ? -1 : 0;
        if (tug > 0.5) r.squat = 1;
        if (admire > 0.5) r.eyes = 'half';
      },
    };
  },

  // Mining (world/gathering.js): three overhead chops at the rock with whatever she carries, a
  // bounce off it on each strike, and a last shake of the arm when it's done.
  mine(p) {
    const n = 3;
    const k = Math.min(n - 1, Math.floor(p * n));
    const u = p * n - k;
    const wind = soft(seg(u, 0, 0.45));
    const hit = easeIn(seg(u, 0.45, 0.6));
    const back = soft(seg(u, 0.65, 1)) * (k < n - 1 ? 1 : 0.6);
    const strike = hit * (1 - back);
    return {
      weapon: lerp(lerp(30, -110, wind), 150, strike), arm: lerp(lerp(60, 175, wind), 40, strike),
      tilt: lerp(-0.1 * wind, 0.16, strike), lift: 2 * wind * (1 - hit), trail: u > 0.4 && u < 0.65,
      rig: (r) => {
        r.tx = strike > 0.5 ? 2 : -1;
        if (strike > 0.5) { r.squat = 1; wideLegs(r); }
        r.backArm = [q(-1 - 1.5 * strike), q(-2 + 2 * strike)];
        if (strike > 0.5) strikeFace(r);
      },
    };
  },

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
  guard: 0.45, pray: 0.5, cheer: 0.45, gather: 1, pluck: 1, mine: 1.3, draw: 0.38, aimshot: 0.5, skyshot: 0.5, castspin: 0.45, barrage: 0.4,
  flurry: 0.4, dash: 0.35, vanish: 0.3, cleave: 0.55, cross: 0.45, sweep: 0.4, spinback: 0.45, shove: 0.35, risecut: 0.45, leapchop: 0.6, jabs: 0.4, flashcut: 0.34, drivestab: 0.4, hammer: 0.7, skysplit: 0.9, quickshot: 0.3, bash: 0.4, rampage: 1.3, meteor: 0.4, landslam: 0.3, dashstab: 0.4, verdict: 1.5, eclipse: 1.5, pslash: 0.35, pthrust: 0.35, ascend: 0.45, smite: 0.6, consecrate: 0.8, salute: 0.5, cleave1: 0.45, cleave2: 0.45, gyre: 0.45, reaver: 0.7, warroar: 0.6, axehurl: 0.55, bodyslam: 0.8, dragrise: 0.8, shieldslam: 0.6, shieldrush: 0.8, recklesscharge: 0.85,
  spinshot: 0.4, hopshot: 0.45, pointblank: 0.45, hipfire: 0.3, vault: 0.5, downshot: 0.35, comet: 1.3, leapshot: 0.5, galeshot: 0.55, tailwind: 0.5, stormvolley: 1.5, slideshot: 0.4, kneelshot: 0.45, crankshot: 0.5, ballista: 0.65, rollshot: 0.5, steadyaim: 0.5, heartseeker: 1.5, titanbreak: 1.4, backstab: 0.5, assassinate: 1.5, crossflip: 0.6, spinkick: 0.4, whirlflip: 0.6, flashjump: 0.3, shadowrun: 0.3,
  kagura: 0.92, kaguraturn: 1.1, kagurafin: 1.32, bellshake: 1.1, sleevefan: 0.99, bowrise: 1.21, twirlstep: 1.1, kaguraup: 0.99, floatcast: 0.77, floatcast2: 0.88, glidecast: 0.99, spiritstep: 0.55, kaguraslam: 1.1, kagurabless: 1.2, kaguraward: 1.1, kaguralantern: 1.6,
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
  wand: ['kagura'],
  staff: ['kagura', 'kaguraturn'],
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
//   wand and staff: held like a kagura bell staff, only tipped with the wrist (no club twirls).
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
  const lim = 40 * (f.over ?? 1);
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
const HEFT = new Set(['sword', 'axe', 'spear', 'staff', 'dagger', 'gauntlet', 'wand', 'none']);
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

export function moveAt(kind, progress, dur = 0.35, feel = null) {
  if (!MOVES[kind]) return null;
  const f = FEEL[feel?.weapon] ?? {};
  const p = bend(clamp01(progress), feel?.hit, f.pre, f.post);
  let mv = after(sway(kind, p, dur, rawMoveAt(kind, p, dur), f), p, feel?.hit, f, feel?.fin);
  if (HEFT.has(feel?.weapon)) mv = hefted(mv, kind, p);
  if (feel?.weapon === 'staff') mv = staffed(mv);
  return DANCE_MOVES.has(kind) && DANCE_STYLES[danceStyle] ? DANCE_STYLES[danceStyle](mv, (q2) => rawMoveAt(kind, clamp01(q2), dur), p, dur, kind) : mv;
}

// Styles for the Spirit Mage's dance. Each reworks the base figures above: `mv` is the figure's
// pose, `at(p)` its raw pose at another moment (for parts that trail behind), `p` and `dur` where it
// is, `kind` which figure. The player picked grounded kagura; the float and ribbon samples are kept
// for the dev page (tools/spiritmage.html ?style=), and 'flow' is the base figures as drawn.
let danceStyle = 'grounded';
export const setDanceStyle = (name) => { danceStyle = name; };
const wrapRig = (mv, fn) => ({ ...mv, rig: (r) => { mv.rig?.(r); fn(r); } });
// A bob that starts and ends at rest, so figures join without a jump.
const bob = (p, dur, per = 1.1) => Math.sin(p * Math.PI * 2 * Math.max(1, Math.round(dur / per)));
// The figures where a grounded dancer rises up off the floor: the finishers, the cast upward, and
// her big skills.
const GROUNDED_RISE = new Set(['kagurafin', 'bowrise', 'kaguraup', 'kaguraslam', 'kagurabless', 'kaguralantern']);
const DANCE_STYLES = {
  // Grounded kagura (suriashi): her feet slide along the floor in long, slow gliding steps, knees
  // only softly bent, eyes lowered in the holds; serene. Her poses are big and bold (the bell staff
  // and fan sweep wide, the body leans into each figure) so they read at game size, and on the big
  // casts (the finishers and the cast upward) she rises onto her toes and floats up for a moment.
  // The bells shiver and ring all through the dance, hardest as the spell goes; the fan flutters,
  // folds shut just before each cast and snaps open with it.
  grounded(mv, at, p, dur, kind) {
    const big = GROUNDED_RISE.has(kind);
    const t = p * dur;
    const ring = Math.sin(t * Math.PI * 2 * 6) * (2 + 6 * bump(p, 0.45, 0.8));
    const snap = 1 - 0.65 * bump(p, 0.36, 0.52);
    const flutter = 0.9 + 0.1 * Math.sin(t * 14);
    return wrapRig({
      ...mv, lift: (mv.lift ?? 0) * (big ? 0.8 : 0.12), tilt: (mv.tilt ?? 0) * 0.9, lunge: (mv.lunge ?? 0) * 2,
      arm: mv.arm != null ? 90 + (mv.arm - 90) * 1.4 : mv.arm, weapon: mv.weapon != null ? mv.weapon * 1.2 + ring : mv.weapon,
      fan: mv.fan != null ? Math.min(1, mv.fan * 1.2 + 0.15) * snap * flutter : mv.fan, fanA: mv.fanA != null ? mv.fanA * 1.3 + 6 * Math.sin(t * 9) : mv.fanA,
    }, (r) => {
      // Floating up, her toes point (the base figure's lifted feet); otherwise both feet slide flat,
      // in a wide stride.
      const up = big && (mv.lift ?? 0) > 2;
      r.air = up && r.air;
      if (!up) {
        r.frontLeg = [q(r.frontLeg[0] * 1.4), 0, Math.round(r.frontLeg[2] * 0.3 / 2) * 2];
        r.backLeg = [q(r.backLeg[0] * 1.4), 0, Math.round(r.backLeg[2] * 0.3 / 2) * 2];
      }
      r.backArm = [q(r.backArm[0] * 1.3), q(r.backArm[1] * 1.3)];
      r.squat = q(Math.max(0.5, r.squat * 0.5));
      r.hairLift = up ? -1 : 0;
      if (r.mouth !== 'open' && r.eyes === 'open') r.eyes = 'half';
      if (!up) r.mouth = null;
    });
  },
  // Spirit float: she hovers off the ground the whole dance, drifting up and down, legs together
  // and toes pointed beneath her skirts, hair and sleeves lifting as if underwater. Ethereal.
  float(mv, at, p, dur) {
    const drift = bob(p, dur);
    return wrapRig({ ...mv, lift: 7 + (mv.lift ?? 0) * 0.6 + 2 * drift, tilt: (mv.tilt ?? 0) * 0.9 + 0.04 * drift, lunge: (mv.lunge ?? 0) * 0.8 }, (r) => {
      r.air = true;
      r.frontLeg = [q(0.6 + r.frontLeg[0] * 0.25), q(-1.5 + 0.5 * drift), 12 + Math.round(r.frontLeg[2] * 0.2 / 2) * 2];
      r.backLeg = [q(-0.4 + r.backLeg[0] * 0.2), -0.5, -4 + Math.round(r.backLeg[2] * 0.2 / 2) * 2];
      r.squat = 0;
      r.hairLift = -1;
      r.hairWave = Math.floor(p * dur * 6) % 8;
      r.cape -= q(3 + drift);
    });
  },
  // Ribbon dancer: everything bigger and looser, with overlap: the body leans far into each
  // figure and overshoots, the arm reaches wider, and the fan trails behind the arm like a ribbon
  // on a stick, catching up a beat late. Expressive.
  ribbon(mv, at, p, dur) {
    const late = at(p - 0.09);
    const lead = at(Math.min(1, p + 0.04));
    return wrapRig({
      ...mv,
      arm: mv.arm != null ? 90 + (mv.arm - 90) * 1.3 : mv.arm, weapon: mv.weapon != null ? mv.weapon * 1.15 : mv.weapon,
      tilt: (mv.tilt ?? 0) * 1.6 + ((lead.tilt ?? 0) - (mv.tilt ?? 0)) * 1.2, lunge: (mv.lunge ?? 0) * 1.5, lift: (mv.lift ?? 0) * 1.3,
      fanA: late.fanA ?? mv.fanA, fan: Math.max(0.6, mv.fan ?? 0),
    }, (r) => {
      r.hairLift = -1;
      r.hairWave = Math.floor(p * dur * 9) % 8;
      r.cape -= 3;
      r.frontLeg = [q(r.frontLeg[0] * 1.2), r.frontLeg[1], r.frontLeg[2]];
      r.backLeg = [q(r.backLeg[0] * 1.25), r.backLeg[1], Math.round(r.backLeg[2] * 1.3 / 2) * 2];
    });
  },
};
