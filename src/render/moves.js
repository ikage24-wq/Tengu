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
      weapon: lerp(205, -10, t) + 35 * settle, arm: lerp(15, 172, t) - 100 * settle, lift: 3 * t * (1 - settle), stretch: 1 + 0.05 * t * (1 - settle), tilt: -0.1 * t * (1 - settle), trail: p < 0.6,
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
    const flip = ease(seg(p, 0.14, 0.5));
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
    if (p < 0.45) {
      const t = seg(p, 0, 0.45);
      const dart = MOVES.dashstab(t * 0.6);
      return { ...dart, turn: 1 - 0.7 * bump(t, 0.25, 1), stretch: 1 + 0.25 * bump(t, 0.25, 1) };
    }
    return MOVES.thrust(seg(p, 0.45, 1));
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

  // Full Moon Volley: a spin flinging a storm of stars up into the sky, arm held high while the moon
  // gathers, then a hard throw forward as it bursts.
  moonthrow(p) {
    if (p < 0.24) {
      const t = ease(seg(p, 0, 0.24));
      return { weapon: lerp(60, -60, t), arm: lerp(90, 190, t), turn: Math.cos(t * Math.PI * 2), tilt: -0.15 * t, lift: 6 * bump(t, 0, 1), rig: (r) => { r.backArm = [-2, -5]; wideLegs(r); r.hairLift = -1; strikeFace(r); } };
    }
    if (p < 0.66) return { weapon: -60, arm: 175, tilt: -0.12, rig: (r) => { r.backArm = [-2, -5]; wideLegs(r); r.hairLift = -1; r.eyes = 'half'; } };
    return MOVES.throw(seg(p, 0.6, 1));
  },

  // A star flung up at whatever flies: a throw aimed high.
  upthrow(p) {
    const m = MOVES.throw(p);
    return { ...m, arm: m.arm + 40, tilt: (m.tilt ?? 0) - 0.12 };
  },

  // A star thrown down from the air: a quick throw aimed low.
  airthrow(p) {
    const m = MOVES.throw(p);
    return { ...m, arm: m.arm - 25, rig: (r) => { m.rig?.(r); tuck(r); } };
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
  guard: 0.45, pray: 0.5, cheer: 0.45, draw: 0.38, aimshot: 0.5, skyshot: 0.5, castspin: 0.45, barrage: 0.4,
  flurry: 0.4, dash: 0.35, vanish: 0.3, cleave: 0.55, cross: 0.45, sweep: 0.4, spinback: 0.45, shove: 0.35, risecut: 0.45, leapchop: 0.6, jabs: 0.4, flashcut: 0.34, drivestab: 0.4, hammer: 0.7, skysplit: 0.9, quickshot: 0.3, bash: 0.4, rampage: 1.3, meteor: 0.4, landslam: 0.3, dashstab: 0.4, verdict: 1.5, eclipse: 1.5, pslash: 0.35, pthrust: 0.35, ascend: 0.45, smite: 0.6, consecrate: 0.8, salute: 0.5, cleave1: 0.45, cleave2: 0.45, gyre: 0.45, reaver: 0.7, warroar: 0.6, axehurl: 0.55, bodyslam: 0.8, dragrise: 0.8, shieldslam: 0.6,
  spinshot: 0.4, hopshot: 0.45, pointblank: 0.45, hipfire: 0.3, vault: 0.5, downshot: 0.35, comet: 1.3, leapshot: 0.5, galeshot: 0.55, tailwind: 0.5, stormvolley: 1.5, slideshot: 0.4, kneelshot: 0.45, crankshot: 0.5, ballista: 0.65, rollshot: 0.5, steadyaim: 0.5, heartseeker: 1.5, titanbreak: 1.4, backstab: 0.5, assassinate: 1.5, moonthrow: 1.5, upthrow: 0.4, airthrow: 0.3,
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
  staff: ['castforward', 'castspin'],
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

export function moveAt(kind, progress, dur = 0.35) {
  const fn = MOVES[kind];
  if (!fn) return null;
  const p = SNAPPY.has(kind) ? snap(clamp01(progress)) : clamp01(progress);
  return { lift: 0, lunge: 0, tilt: 0, turn: 1, stretch: 1, trail: false, ...fn(p, dur) };
}
