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
// The three beats of an Endless Fox-Fire throw: the short wind, the whip, the arm coming back.
const sWind = (p) => ease(seg(p, 0, 0.18));
const sFling = (p) => ease(seg(p, 0.18, 0.42));
const sBack = (p) => seg(p, 0.6, 1);
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

// The Spirit Mage's dance figures (render/scene.js gives them a longer, softer blend in and out).
export const DANCE_MOVES = new Set(['kagura', 'kaguraturn', 'kagurafin', 'bellshake', 'sleevefan', 'bowrise', 'twirlstep', 'kaguraup', 'floatcast', 'floatcast2', 'glidecast', 'spiritstep', 'kaguraslam', 'kagurabless', 'kaguraward', 'kaguralantern', 'shrinegrand', 'shrinepurify', 'shrinerevive', 'shrinetorii', 'onmyoofuda', 'onmyoseal', 'onmyorally', 'onmyocombo']);

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

  // ---------- Endless Fox-Fire (world/melee.js barrageThrow) ----------
  // A fox spirit playing with fox fire, not a soldier hurling: tall, cocky, chin up, and the whole
  // body in every throw (the hips turn first, the arm whips last). Her head is most of her, so her
  // throwing hand stays low and wide (chest and hip height, or whipped round from behind her back)
  // and never crosses her face; her free hand trails out behind her like a dancer's. Stars leave at
  // about 0.4 of each move: a short wind (to 0.18), the whip (to 0.42), the hand already coming back
  // for the next (from 0.6). `poised` keeps the weapon sway from tipping her into a lunge.
  // `streamFlow` below carries her body through the moves on the barrage's own clock, and her
  // tails wake one by one as it builds (render/kitsune.js). The stages (world/melee.js STREAMS):
  //   Kitsunebi  one tail lit: stars dealt like cards, a sidearm whip and an underhand flick
  //   Trickster  three tails: a spin throw, a throw behind her back, a hop back, a lazy lob
  //   Wheel      six tails: spinning inside a ring of fox fire, arms out wide
  //   Ascension  nine tails: floating, lounging back in the air, flicking stars off the ring
  // Kitsunebi: a sidearm whip. The arm swings back behind her (low, the short way round), her
  // weight sits back; then she steps into it and whips it round at hip height, the free hand
  // flung out behind her.
  foxdeal(p) {
    const w = sWind(p);
    const f = sFling(p);
    const b = sBack(p);
    return {
      weapon: lerp(lerp(90, -40, w), 115, f) - 30 * b, arm: lerp(lerp(70, -70, w), 100, f) - 30 * b, tilt: -0.06 * w + 0.12 * f * (1 - b), lunge: -2 * w + 4 * f * (1 - 0.6 * b), poised: true,
      rig: (r) => {
        r.frontLeg = f > 0.3 ? [4, 0, 8] : [2, 0, 0];
        r.backLeg = f > 0.3 && b < 0.7 ? [-3.5, -1.5, -26] : [-2.5, 0, -8];
        r.backArm = [q(lerp(2, -9, f) + 6 * b), q(lerp(-3, -5, f))];
        r.tx = q(-1 * w + 1.5 * f);
        r.cape = q(2 - 3 * f + 2 * b);
      },
    };
  },
  // ...and an underhand flick: the hand dips low by her hip, then pops up and out, the wrist turning
  // the star loose, with a little hop and a heel kicked up behind her.
  foxdeal2(p) {
    const w = sWind(p);
    const f = sFling(p);
    const b = sBack(p);
    return {
      weapon: lerp(lerp(60, 200, w), 95, f) - 25 * b, arm: lerp(lerp(60, 5, w), 108, f) - 40 * b, tilt: -0.04 + 0.08 * f * (1 - b), lift: 3 * bump(p, 0.2, 0.7), lunge: 2 * f * (1 - b), poised: true,
      rig: (r) => {
        r.frontLeg = [3, 0, 4];
        r.backLeg = f > 0.2 && b < 0.6 ? [-2, -5, -62] : [-2.5, 0, -8];
        r.backArm = [q(lerp(-4, -8, f)), q(lerp(-2, -7, f))];
        r.cape = q(2 - 3 * f);
      },
    };
  },
  // Trickster: a spin throw. She twirls all the way round on one foot, arms tucked and a knee drawn
  // up, and flings the star out of the turn as she comes back round to face them.
  foxspin(p) {
    const s = seg(p, 0, 0.36);
    const f = sFling(p);
    const b = sBack(p);
    return {
      turn: s > 0.25 && s < 0.75 ? -1 : 1, weapon: p < 0.36 ? 40 : lerp(40, 120, f) - 30 * b, arm: p < 0.36 ? 30 : lerp(30, 102, f) - 35 * b, lift: 4 * bump(p, 0, 0.5), tilt: 0.08 * f * (1 - b), poised: true,
      rig: (r) => {
        r.frontLeg = p < 0.4 ? [3, -5, 64] : [3.5, 0, 6];
        r.backLeg = [-1.5, 0, -4];
        r.backArm = p < 0.36 ? [2, -2] : [q(-9 * f + 4 * b), q(-4 * f)];
        r.hairLift = -3;
        r.cape = p < 0.4 ? -5 : q(1 - 2 * f);
      },
    };
  },
  // A throw behind her back: she turns away from them, kicks a heel up toward them, and whips the
  // star back round behind her at chest height without looking, then turns back with a grin.
  foxbehind(p) {
    const w = sWind(p);
    const f = sFling(p);
    const b = sBack(p);
    return {
      turn: p > 0.08 && p < 0.7 ? -1 : 1, weapon: lerp(lerp(90, 120, w), -80, f) + 40 * b, arm: lerp(lerp(70, 95, w), -95, f) + 60 * b, tilt: 0.1 * f * (1 - b), lift: 2 * bump(p, 0.1, 0.8), poised: true,
      rig: (r) => {
        r.frontLeg = [2.5, 0, 4];
        r.backLeg = f > 0.2 && b < 0.7 ? [-3, -6, -72] : [-2.5, 0, -8];
        r.backArm = [q(lerp(3, 6, f)), -3];
        r.hairLift = -2;
        r.cape = 3;
      },
    };
  },
  // A hop back out of reach, a star whipped sidearm in the air at the top of it, and a light landing.
  foxhopback(p) {
    const w = sWind(p);
    const f = sFling(p);
    const b = sBack(p);
    const up = bump(p, 0.05, 0.75);
    return {
      weapon: lerp(lerp(80, -50, w), 110, f) - 30 * b, arm: lerp(lerp(60, -40, w), 66, f) - 20 * b, lift: 9 * up, lunge: -5 * ease(seg(p, 0, 0.6)) * (1 - 0.6 * b), tilt: -0.1 * up + 0.08 * f * (1 - b), poised: true,
      rig: (r) => {
        if (up > 0.3) tuck(r); else wideLegs(r);
        r.backArm = [q(lerp(-3, -10, f)), q(lerp(-4, -7, f))];
        r.hairLift = up > 0.3 ? -4 : -2;
        r.cape = q(1 - 5 * up);
      },
    };
  },
  // Leaning way back with a hand on her hip and her tongue out, a lazy underhand lob tossed up and
  // over at them.
  foxlob(p) {
    const w = sWind(p);
    const f = sFling(p);
    const b = sBack(p);
    return {
      weapon: lerp(lerp(70, 170, w), 80, f) - 20 * b, arm: lerp(lerp(55, -10, w), 112, f) - 40 * b, tilt: -0.24 - 0.06 * f, lift: 1, poised: true,
      rig: (r) => {
        r.frontLeg = [3.5, 0, 10];
        r.backLeg = [-2, 0, -14];
        r.tx = -1;
        r.backArm = [2, -1];
        r.mouth = 'tongue';
        r.hairLift = -1;
        r.cape = 2;
      },
    };
  },
  // Wheel: a full turn on her toes inside the ring of fox fire, arms flung out wide.
  foxwheel(p) {
    return {
      turn: p < 0.25 || p >= 0.75 ? 1 : -1, weapon: 100 + 25 * Math.sin(p * Math.PI * 2), arm: 76 + 8 * Math.sin(p * Math.PI * 2), lift: 2, tilt: -0.05, poised: true,
      rig: (r) => { r.frontLeg = [2, -1, 8]; r.backLeg = [-2, -1, -8]; r.backArm = [-9, -2]; r.hairLift = -3; r.cape = -7; },
    };
  },
  // ...and another the other way round, up on one toe with the other leg swept out long behind her
  // (an arabesque), arms held out wide.
  foxwheel2(p) {
    return {
      turn: p < 0.25 || p >= 0.75 ? -1 : 1, weapon: 105 + 20 * Math.sin(p * Math.PI * 2), arm: 74 + 6 * Math.sin(p * Math.PI * 2), lift: 4, tilt: 0.1, poised: true,
      rig: (r) => { r.frontLeg = [1.5, -1, 2]; r.backLeg = [-4, -7, -84]; r.backArm = [-10, -4]; r.hairLift = -3; r.cape = -6; },
    };
  },
  // Ascension: floating, lounging back on nothing, legs folded, one hand behind her head; the other
  // lazily points and flicks a star off the ring.
  foxfloat(p) {
    const f = sFling(p);
    const b = sBack(p);
    return {
      weapon: lerp(70, 135, f) - 50 * b, arm: lerp(66, 98, f) - 28 * b, tilt: -0.46, poised: true,
      rig: (r) => { r.air = true; r.frontLeg = [4, -6, 76]; r.backLeg = [1, -4, 46]; r.backArm = [-4, -11]; r.hairLift = -2; r.cape = 4; },
    };
  },
  // ...and the other hand's turn: the sign hand swept out, the star hand resting on her knee.
  foxfloat2(p) {
    const f = sFling(p);
    const b = sBack(p);
    return {
      weapon: 120, arm: 70, tilt: -0.4 + 0.06 * f, poised: true,
      rig: (r) => { r.air = true; r.frontLeg = [3, -4, 50]; r.backLeg = [2, -7, 82]; r.backArm = [q(lerp(2, 11, f) - 5 * b), q(lerp(-6, -5, f))]; r.hairLift = -2; r.cape = 4; },
    };
  },
  // The finisher: she rises up onto her toes, chest up and arms swept out wide behind her as the
  // nine tails' fire gathers, then whips the fox moon out from the hip and steps after it, the
  // giant fox spirit pouncing past her (world/melee.js barrageRelease).
  foxmoonrise(p) {
    const g = ease(seg(p, 0, 0.38));
    const f = ease(seg(p, 0.42, 0.56));
    const b = seg(p, 0.7, 1);
    return {
      weapon: lerp(lerp(90, -60, g), 120, f) - 30 * b, arm: lerp(lerp(60, -70, g), 92, f) - 30 * b,
      lift: 5 * g * (1 - f) + 7 * f * (1 - b), tilt: -0.14 * g * (1 - f) + 0.14 * f * (1 - b), lunge: -2 * g + 6 * f * (1 - 0.5 * b), poised: true,
      rig: (r) => {
        r.frontLeg = f > 0.3 ? [4, 0, 10] : [2, -1, 4];
        r.backLeg = f > 0.3 && b < 0.6 ? [-4, -4, -46] : [-2, -1, -6];
        r.backArm = [q(-10 + 4 * f), q(-6 + 3 * f)];
        r.hairLift = -3;
        r.cape = q(-5 * g - 3 * f);
        if (f > 0.2) strikeFace(r);
      },
    };
  },
  // In the air (jumped, not floating): tucked, a star whipped round sidearm and down at them.
  foxairthrow(p) {
    const f = sFling(p);
    const b = sBack(p);
    return {
      weapon: lerp(-50, 125, f) - 30 * b, arm: lerp(-65, 100, f) - 30 * b, tilt: -0.1 + 0.15 * f * (1 - b), poised: true,
      rig: (r) => { tuck(r); r.backArm = [q(lerp(-3, -9, f)), -6]; r.hairLift = -2; r.cape = -5; },
    };
  },
  // In the air: a tucked somersault-turn, a star flung out of it.
  foxairspin(p) {
    const s = seg(p, 0.02, 0.3);
    const f = sFling(p);
    const b = sBack(p);
    return {
      turn: s > 0.2 && s < 0.85 ? -1 : 1, weapon: p < 0.3 ? 40 : lerp(40, 120, f) - 30 * b, arm: p < 0.3 ? 30 : lerp(30, 100, f) - 30 * b, tilt: -0.12, poised: true,
      rig: (r) => { tuck(r); r.backArm = [-4, -6]; r.hairLift = -3; r.cape = -7; },
    };
  },

  // ---------- Endless Blade Dance (the Shinobi's barrage, world/melee.js STREAMS.shinobi) ----------
  // A dancer with a reverse-grip blade, low and loose, never still: every cut flows out of the
  // last on the barrage's own clock (streamFlow). Cuts land at about 0.45: a coil (to 0.2), the
  // cut (to 0.48), the blade carried round for the next (from 0.62). Stages:
  //   Quick cuts    stabs from the hip and a low jab, a flat slice
  //   Spinning cuts a full turn cutting all round, a rising cut off the toes, a hook-kick cut
  //   Ink Blink     she melts into ink and steps out on the far side of them, cutting as she turns
  //   Clone Storm   two-handed X-cuts and a great overhead brush cut, her ink clones beside her
  inkjab(p) {
    const c = ease(seg(p, 0, 0.2));
    const f = ease(seg(p, 0.2, 0.45));
    const b = seg(p, 0.62, 1);
    return {
      weapon: 92, arm: lerp(lerp(80, 50, c), 104, f) - 30 * b, lunge: -2 * c + 9 * f * (1 - 0.7 * b), tilt: 0.14 * f * (1 - b),
      rig: (r) => { r.tx = f > 0.4 ? 2 : -1; lungeLegs(r, 1 + 0.3 * f); r.backArm = [q(-4 * f), -2]; r.cape = -3; if (f > 0.3) strikeFace(r); },
    };
  },
  inkjab2(p) {
    const c = ease(seg(p, 0, 0.2));
    const f = ease(seg(p, 0.2, 0.45));
    const b = seg(p, 0.62, 1);
    return {
      weapon: 80, arm: lerp(lerp(60, 30, c), 75, f) - 15 * b, lunge: -3 * c + 10 * f * (1 - 0.6 * b), tilt: 0.24 * f * (1 - b) + 0.06,
      rig: (r) => { r.squat = 2; r.tx = 2; lungeLegs(r, 1.5); r.backArm = [-6, 0]; r.hairLift = -1; r.cape = -5; strikeFace(r); },
    };
  },
  inkslice(p) {
    const c = ease(seg(p, 0, 0.2));
    const f = ease(seg(p, 0.2, 0.48));
    const b = seg(p, 0.62, 1);
    return {
      weapon: lerp(lerp(60, -60, c), 165, f) - 70 * b, arm: lerp(lerp(90, 130, c), 55, f) + 35 * b, lunge: 6 * f * (1 - 0.6 * b), tilt: -0.06 * c + 0.12 * f * (1 - b), trail: p > 0.18 && p < 0.6,
      rig: (r) => { r.tx = f > 0.5 ? 2 : -1; lungeLegs(r, 1.2); r.backArm = [q(3 - 8 * f), -3]; r.hairLift = -1; r.cape = -4; if (f > 0.2) strikeFace(r); },
    };
  },
  inkspin(p) {
    const a = ease(seg(p, 0.1, 0.62));
    const b = seg(p, 0.7, 1);
    return {
      weapon: 95 + a * 360, arm: 98 - 20 * b, orbit: true, turn: a > 0.25 && a < 0.75 ? -1 : 1, lift: 5 * bump(p, 0.12, 0.66), lunge: 2 * a * (1 - b), trail: p > 0.1 && p < 0.66,
      rig: (r) => { r.squat = p < 0.1 || p > 0.7 ? 2 : 0; if (p >= 0.1 && p <= 0.7) { r.frontLeg = [2, -2, 20]; r.backLeg = [-2, 0, -10]; } else wideLegs(r); r.backArm = [-8, -3]; r.hairLift = -3; r.cape = -7; strikeFace(r); },
    };
  },
  inkrise(p) {
    const c = ease(seg(p, 0, 0.22));
    const f = ease(seg(p, 0.22, 0.48));
    const b = seg(p, 0.64, 1);
    return {
      weapon: lerp(lerp(120, 165, c), -70, f) + 120 * b, arm: lerp(lerp(45, 30, c), 172, f) - 110 * b, lift: 9 * bump(p, 0.22, 0.85), lunge: 3 * f * (1 - b), tilt: -0.12 * f * (1 - b), trail: p > 0.2 && p < 0.6,
      rig: (r) => { if (p > 0.3 && p < 0.75) tuck(r); else { r.squat = 2; wideLegs(r); } r.backArm = [-3, 3]; r.hairLift = -3; r.cape = -6; if (f > 0.2) strikeFace(r); },
    };
  },
  inkhook(p) {
    const c = ease(seg(p, 0, 0.22));
    const k = bump(p, 0.2, 0.62);
    const f = ease(seg(p, 0.25, 0.48));
    const b = seg(p, 0.66, 1);
    return {
      turn: p > 0.12 && p < 0.38 ? -1 : 1, weapon: lerp(lerp(40, 150, c), -100, f) + 140 * b, arm: lerp(lerp(70, 35, c), 160, f) - 100 * b, lift: 4 * k, tilt: -0.2 * k, lunge: 4 * k,
      rig: (r) => { r.frontLeg = k > 0.3 ? [q(3 + 4 * k), q(-6 * k), q(60 + 30 * k)] : [2, 0, 4]; r.backLeg = [-2, 0, -6]; r.backArm = [-5, -4]; r.hairLift = -2; r.cape = -6; if (k > 0.3) strikeFace(r); },
    };
  },
  // Ink Blink: gone into ink at the start (the world moves her through the line), out of it on the
  // far side already turned, cutting down through them.
  inkblink(p) {
    const f = ease(seg(p, 0.24, 0.48));
    const b = seg(p, 0.64, 1);
    return {
      weapon: lerp(-90, 160, f) - 60 * b, arm: lerp(170, 45, f) + 40 * b, lunge: 4 * f * (1 - b), tilt: 0.16 * f * (1 - b), lift: 4 * (1 - seg(p, 0.1, 0.3)), trail: p > 0.22 && p < 0.6,
      fade: 1 - seg(p, 0.08, 0.24),
      rig: (r) => { if (p < 0.24) tuck(r); else { r.squat = 2; lungeLegs(r, 1.4); } r.backArm = [-7, -2]; r.hairLift = -3; r.cape = -6; strikeFace(r); },
    };
  },
  inkblink2(p) {
    const f = ease(seg(p, 0.24, 0.48));
    const b = seg(p, 0.64, 1);
    return {
      turn: p < 0.3 ? -1 : 1, weapon: lerp(40, 175, f) - 80 * b, arm: lerp(100, 40, f) + 50 * b, lunge: 5 * f * (1 - b), tilt: 0.1 * f * (1 - b), trail: p > 0.22 && p < 0.6,
      fade: 1 - seg(p, 0.08, 0.24),
      rig: (r) => { r.squat = 2; wideLegs(r); r.backArm = [5, -6]; r.hairLift = -3; r.cape = -7; strikeFace(r); },
    };
  },
  // Clone Storm: a quick X, two cuts crossing (the second lands the blow), arms flung wide after.
  inkstorm(p) {
    const f1 = ease(seg(p, 0.05, 0.25));
    const f2 = ease(seg(p, 0.28, 0.48));
    const b = seg(p, 0.64, 1);
    return {
      weapon: p < 0.27 ? lerp(-80, 150, f1) : lerp(150, -40, f2) + 90 * b, arm: p < 0.27 ? lerp(165, 40, f1) : lerp(40, 150, f2) - 70 * b, lunge: 5 * f2 * (1 - b) + 2 * f1, tilt: 0.12 * f1 - 0.1 * f2 * (1 - b), trail: p > 0.05 && p < 0.55,
      rig: (r) => { r.squat = 1; lungeLegs(r, 1.3); r.backArm = [q(-8 + 12 * f2), q(-6 + 4 * f2)]; r.hairLift = -3; r.cape = -7; strikeFace(r); },
    };
  },
  // ...and the great overhead brush cut: up on her toes, the blade raised high behind, then brought
  // down through everything in front, landing low.
  inkstorm2(p) {
    const c = ease(seg(p, 0, 0.26));
    const f = ease(seg(p, 0.26, 0.5));
    const b = seg(p, 0.7, 1);
    return {
      weapon: lerp(lerp(60, -130, c), 175, f) - 60 * b, arm: lerp(lerp(90, 185, c), 30, f) + 50 * b, lift: 6 * c * (1 - f), lunge: -2 * c + 8 * f * (1 - 0.6 * b), tilt: -0.1 * c + 0.26 * f * (1 - b), trail: p > 0.24 && p < 0.6,
      rig: (r) => { if (f > 0.5) { r.squat = 3; wideLegs(r); } else if (c > 0.5) { r.frontLeg = [2, -1, 4]; r.backLeg = [-2, -1, -4]; } r.backArm = [q(-4 - 4 * f), -6]; r.hairLift = -3; r.cape = q(-8 * f - 2); strikeFace(r); },
    };
  },
  inkaircut(p) {
    const f = ease(seg(p, 0.15, 0.48));
    const b = seg(p, 0.64, 1);
    return {
      weapon: lerp(-60, 150, f) - 40 * b, arm: lerp(170, 50, f) + 30 * b, tilt: 0.2 * f * (1 - b), trail: p > 0.12 && p < 0.6,
      rig: (r) => { tuck(r); r.backArm = [-6, -4]; r.hairLift = -3; r.cape = -6; strikeFace(r); },
    };
  },
  inkairspin(p) {
    const a = ease(seg(p, 0.06, 0.6));
    return {
      weapon: 95 + a * 360, arm: 100, orbit: true, turn: a > 0.25 && a < 0.75 ? -1 : 1, tilt: 0.1, trail: p > 0.06 && p < 0.62,
      rig: (r) => { tuck(r); r.backArm = [-8, -3]; r.hairLift = -3; r.cape = -7; strikeFace(r); },
    };
  },
  // The drawn cut that ends the dance: she drops low with the blade sheathed along her forearm,
  // holds it a breath, then she's through the line in one cut and stands frozen past them, blade out,
  // as the ink lands behind her.
  inkdraw(p) {
    const c = ease(seg(p, 0, 0.3));
    const hold = p >= 0.3 && p < 0.5;
    const f = ease(seg(p, 0.5, 0.6));
    const b = ease(seg(p, 0.82, 1));
    const shiver = hold ? Math.sin(p * 220) * 0.6 : 0;
    return {
      weapon: p < 0.5 ? lerp(25, 172, c) + shiver : lerp(172, 88, f) - 60 * b, arm: p < 0.5 ? lerp(60, 15, c) : lerp(15, 92, f) - 30 * b, lunge: -3 * c * (1 - f) + 10 * f * (1 - b), tilt: 0.12 * c + 0.2 * f * (1 - b), trail: p > 0.5 && p < 0.66,
      rig: (r) => { r.squat = p < 0.82 ? 3 : 1; if (f > 0) lungeLegs(r, 1.8); else wideLegs(r); r.backArm = [q(3 - 9 * f), q(-1 - 3 * f)]; r.hairLift = f > 0 ? -3 : 0; r.cape = q(-8 * f); r.eyes = hold ? 'half' : null; if (f > 0) strikeFace(r); },
    };
  },

  // ---------- Wild Hunt (the Beastmaster's barrage, world/melee.js STREAMS.beastmaster) ----------
  // Light, quick and wild, the bow never still: shots loose at about 0.4 (the draw from 0.1, the
  // loose at 0.4, the bow coming back for the next from 0.6). Stages:
  //   Quick draw   snap shots, standing and from a crouch
  //   Run and gun  a skipping shot, a turn and shot out of it, a slide on one knee
  //   Duet         Snow wolf cuts beside her: shots canted flat, leaning back to back with nothing
  //   Gale         the wind under her: shots loosed off the gale of leaves wheeling round her
  bmsnap(p) {
    const r0 = ease(seg(p, 0, 0.1));
    const pull = ease(seg(p, 0.08, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: lerp(-20, 0, r0) - 6 * snap * (1 - back), arm: lerp(80, 95, r0) + 4 * snap * (1 - back), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lunge: -2 * snap * (1 - back), tilt: -0.05 * snap * (1 - back),
      rig: (r) => { r.backArm = snap > 0 ? [q(-7 + 5 * back), -3] : [q(2 - 6 * pull), -3]; r.frontLeg = [2.6, 0, 2]; r.backLeg = [-3, 0, -6]; r.cape = -2; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  bmsnap2(p) {
    const pull = ease(seg(p, 0.08, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 8 - 6 * snap * (1 - back), arm: 88 + 4 * snap * (1 - back), pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lunge: -3 * snap * (1 - back), tilt: 0.08,
      rig: (r) => { r.squat = 2; r.frontLeg = [3.4, 0, 8]; r.backLeg = [-3, 1, -30]; r.backArm = snap > 0 ? [q(-7 + 5 * back), -2] : [q(2 - 6 * pull), -2]; r.hairLift = -1; r.cape = -3; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  bmskip(p) {
    const hop = bump(p, 0.05, 0.85);
    const pull = ease(seg(p, 0.1, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 6 * hop - 6 * snap * (1 - back), arm: 92, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lift: 10 * hop, lunge: 2 * hop, tilt: -0.06 * hop,
      rig: (r) => { if (hop > 0.3) { r.air = true; r.frontLeg = [3, -3, 24]; r.backLeg = [-3, -5, -40]; } r.backArm = snap > 0 ? [q(-7 + 5 * back), -3] : [q(2 - 6 * pull), -3]; r.hairLift = -2; r.cape = -5; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  bmspin(p) {
    const s = seg(p, 0.02, 0.3);
    const pull = ease(seg(p, 0.22, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      turn: s > 0.25 && s < 0.75 ? -1 : 1, weapon: p < 0.3 ? -30 : -6 * snap * (1 - back), arm: p < 0.3 ? 140 : 95, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lift: 4 * bump(p, 0, 0.4),
      rig: (r) => { r.frontLeg = p < 0.3 ? [2, -3, 30] : [2.6, 0, 2]; r.backLeg = [-2, 0, -6]; r.backArm = snap > 0 ? [q(-7 + 5 * back), -3] : [q(2 - 6 * pull), -4]; r.hairLift = -3; r.cape = -6; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  bmslide(p) {
    const slide = ease(seg(p, 0, 0.3)) * (1 - ease(seg(p, 0.75, 1)));
    const pull = ease(seg(p, 0.1, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 25 * slide - 6 * snap * (1 - back), arm: 88, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lunge: 6 * slide, tilt: -0.12 * slide,
      rig: (r) => { if (slide > 0.3) { r.squat = 3; r.frontLeg = [5, 0, 30]; r.backLeg = [-4, 2, -70]; } r.backArm = snap > 0 ? [q(-7 + 5 * back), -2] : [q(2 - 6 * pull), -2]; r.hairLift = -2; r.cape = -6; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  // Duet: the bow canted flat for a quick shot, leaning out as Snow wolf cuts at her side.
  bmhunt(p) {
    const pull = ease(seg(p, 0.08, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 55 - 8 * snap * (1 - back), arm: 92, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lunge: 3 - 3 * snap * (1 - back), tilt: 0.1,
      rig: (r) => { r.squat = 1; lungeLegs(r, 1.3); r.backArm = snap > 0 ? [q(-7 + 5 * back), 0] : [q(2 - 6 * pull), 0]; r.hairLift = -2; r.cape = -4; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  bmhunt2(p) {
    const pull = ease(seg(p, 0.08, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: -18 - 6 * snap * (1 - back), arm: 112, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lunge: -2, tilt: -0.2 - 0.05 * snap * (1 - back),
      rig: (r) => { r.frontLeg = [3.4, 0, 12]; r.backLeg = [-2, 0, -16]; r.backArm = snap > 0 ? [q(-7 + 5 * back), -5] : [q(2 - 6 * pull), -5]; r.hairLift = -1; r.cape = 2; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  // Gale: the wind lifts her onto her toes and bears her up a little; the bow swept out flat and
  // an arrow loosed off the wheel of leaves, then a full turn with the wind and another.
  bmgale(p) {
    const pull = ease(seg(p, 0.08, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      weapon: 70 - 10 * snap * (1 - back), arm: 100, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lift: 5 + 2 * Math.sin(p * Math.PI * 2), tilt: -0.1,
      rig: (r) => { r.air = true; r.frontLeg = [3, -3, 30]; r.backLeg = [-2, -1, -20]; r.backArm = snap > 0 ? [q(-7 + 5 * back), -4] : [q(2 - 6 * pull), -4]; r.hairLift = -3; r.cape = -8; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  bmgale2(p) {
    const s = seg(p, 0.02, 0.32);
    const pull = ease(seg(p, 0.24, 0.38));
    const snap = seg(p, 0.4, 0.5);
    const back = ease(seg(p, 0.6, 1));
    return {
      turn: s > 0.25 && s < 0.75 ? -1 : 1, weapon: p < 0.32 ? -60 : 10 - 6 * snap * (1 - back), arm: p < 0.32 ? 160 : 98, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4), lift: 6 + 3 * bump(p, 0, 0.5),
      rig: (r) => { r.air = true; r.frontLeg = [2, -4, 40]; r.backLeg = [-2, -2, -30]; r.backArm = snap > 0 ? [q(-7 + 5 * back), -4] : [q(2 - 6 * pull), -6]; r.hairLift = -3; r.cape = -8; if (snap > 0 && back < 0.4) strikeFace(r); },
    };
  },
  bmairshot(p) {
    const pull = ease(seg(p, 0.06, 0.38));
    const snap = seg(p, 0.4, 0.5);
    return {
      weapon: 32 - 6 * snap, arm: 58, tilt: 0.35 - 0.1 * snap, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4),
      rig: (r) => { tuck(r); r.backArm = snap > 0 ? [-4, 0] : [q(2 - 6 * pull), -1]; r.hairLift = -2; r.cape = -5; if (snap > 0) strikeFace(r); },
    };
  },
  bmairspin(p) {
    const s = seg(p, 0.02, 0.3);
    const pull = ease(seg(p, 0.22, 0.38));
    const snap = seg(p, 0.4, 0.5);
    return {
      turn: s > 0.25 && s < 0.75 ? -1 : 1, weapon: p < 0.3 ? -40 : 34 - 6 * snap, arm: p < 0.3 ? 150 : 60, tilt: 0.3, pull: snap > 0 ? 0 : pull, nock: snap === 0, twang: twang(p, 0.4),
      rig: (r) => { tuck(r); r.backArm = snap > 0 ? [-4, 0] : [q(2 - 6 * pull), -3]; r.hairLift = -3; r.cape = -7; if (snap > 0) strikeFace(r); },
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

  // ---------- The Thief's own swings and throws (her pool, PATH_VARIANTS in world/melee.js) ----------
  // Light, quick and acrobatic: she flips, spins and kicks where a warrior plants and heaves, and
  // springs back out of every finisher in a backflip (the hit kicks her back, `kickback`).

  // The cross-cut, quicker, then a backflip out of it. Cuts at about 0.11 and 0.36.
  crossflip(p) {
    if (p < 0.5) return MOVES.cross(p / 0.5);
    return backflip(seg(p, 0.52, 0.92), 0.6);
  },

  // The X-cut finisher, planted: the two cuts, then she sinks into a low wide stance with the
  // dagger held out at them, ready to go again (no flip away: the combo keeps flowing). Cuts at
  // about 0.12 and 0.4.
  crossfin(p) {
    const m = MOVES.cross(Math.min(1, p / 0.55));
    const sink = ease(seg(p, 0.5, 0.7)) * (1 - ease(seg(p, 0.86, 1)));
    return {
      ...m, lunge: (m.lunge ?? 0) + 5 * sink, tilt: (m.tilt ?? 0) + 0.12 * sink,
      rig: (r) => { m.rig?.(r); if (sink > 0.2) { r.squat = 2; wideLegs(r); r.backArm = [-5, -3]; r.hairLift = -1; r.cape -= 2; strikeFace(r); } },
    };
  },

  // A whirl that cuts all round her twice and stops dead, low, blade out at them. Cuts at about
  // 0.21 and 0.42.
  whirlfin(p) {
    const m = MOVES.spin(Math.min(1, p / 0.6), 1);
    const sink = ease(seg(p, 0.58, 0.72)) * (1 - ease(seg(p, 0.88, 1)));
    return {
      ...m, lunge: (m.lunge ?? 0) + 4 * sink,
      rig: (r) => { m.rig?.(r); if (sink > 0.2) { r.squat = 2; wideLegs(r); r.backArm = [-5, -3]; r.cape -= 2; strikeFace(r); } },
    };
  },

  // Mid-string: a slash, and she rides its swing straight up into a backflip, landing low and
  // coiled to dart back in with the next blow. Cut at about 0.2.
  cutflip(p) {
    if (p < 0.44) return MOVES.slash(p / 0.44);
    return backflip(seg(p, 0.44, 0.94), 0.75);
  },

  // A heaving throw: wind the arm right back with a deep twist, step through hard and whip the
  // star out, the whole body following it forward. The star leaves at about 0.52.
  heavethrow(p) {
    const m = MOVES.throw(p);
    const coil = bump(p, 0, 0.45);
    const drive = ease(seg(p, 0.4, 0.6)) * (1 - ease(seg(p, 0.85, 1)));
    return {
      ...m, lunge: (m.lunge ?? 0) - 3 * coil + 7 * drive, tilt: (m.tilt ?? 0) - 0.1 * coil + 0.1 * drive, arm: m.arm + 15 * coil,
      rig: (r) => { m.rig?.(r); if (coil > 0.3) { r.squat = 1; r.hairLift = 1; } if (drive > 0.3) { r.squat = 2; wideLegs(r); r.hairLift = -1; r.cape -= 3; } },
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

  // A vaulting cut: spring up into a forward flip over the blade, and come down out of it cutting
  // straight down through them, landing low. Lands at about 0.58.
  vaultcut(p) {
    const crouch = bump(p, 0, 0.18);
    const hop = Math.sin(seg(p, 0.12, 0.6) * Math.PI);
    const flip = ease(seg(p, 0.16, 0.48));
    const cut = ease(seg(p, 0.48, 0.6));
    const settle = ease(seg(p, 0.72, 1));
    return {
      weapon: lerp(lerp(25, -150, flip), 170, cut) - 40 * settle, arm: lerp(lerp(60, 175, flip), 35, cut) + 20 * settle, lift: 30 * hop, tilt: flip * Math.PI * 2 + 0.25 * cut * (1 - settle), lunge: 4 * cut * (1 - settle),
      trail: cut > 0 && p < 0.7,
      rig: (r) => { if (hop > 0.2) tuck(r); else { r.squat = crouch > 0.3 || settle < 0.6 ? 2 : 1; wideLegs(r); } r.backArm = [-3, -4]; r.hairLift = hop > 0.3 ? -1 : 0; if (cut > 0) strikeFace(r); },
    };
  },

  // A whirl: two quick turns with the dagger out, cutting everything round her, then a backflip
  // out of it. Cuts at about 0.22 and 0.46.
  whirlflip(p) {
    if (p < 0.6) return MOVES.spin(p / 0.6, 1);
    return backflip(seg(p, 0.62, 0.95), 0.5);
  },

  // A twirling throw: spin once with the arm high, and fling the star out of the turn. The star
  // leaves at about 0.62.
  twirlthrow(p) {
    if (p < 0.34) {
      const a = ease(p / 0.34);
      return { weapon: lerp(60, -30, a), arm: lerp(90, 185, a), turn: a < 0.5 ? -1 : 1, lift: 4 * bump(a, 0, 1), tilt: -0.1 * a, rig: (r) => { wideLegs(r); r.backArm = [-3, -4]; r.hairLift = -1; } };
    }
    return MOVES.throw(0.35 + 0.65 * seg(p, 0.34, 1));
  },

  // The finishing throw, then a backflip out of it. The star leaves at about 0.25.
  throwflip(p) {
    if (p < 0.48) return MOVES.throw(p / 0.48);
    return backflip(seg(p, 0.5, 0.92), 0.5);
  },

  // A flipping throw: spring back into a backflip and, upside down at the top of it, whip a star
  // out at them, landing low. The star leaves at about 0.46.
  flipthrow(p) {
    const fl = backflip(seg(p, 0.08, 0.84), 1.15);
    const whip = ease(seg(p, 0.36, 0.48));
    const crouch = bump(p, 0, 0.14);
    return {
      ...fl, weapon: lerp(-30, 130, whip), arm: lerp(185, 60, whip), tilt: fl.tilt - 0.1 * crouch,
      rig: (r) => { fl.rig(r); if (crouch > 0.3) r.squat = 2; if (whip > 0 && whip < 1) strikeFace(r); },
    };
  },

  // ---------- The Thief's paths ----------
  // The Shinobi's palm strike: drop low with the dagger drawn back, then drive the open free hand
  // into them, slapping a seal on (it lands at about 0.42), and hold it there a beat.
  palmseal(p) {
    if (p < 0.3) {
      const t = ease(p / 0.3);
      return { weapon: lerp(25, 150, t), arm: lerp(60, 30, t), lunge: -3 * t, tilt: -0.08 * t, rig: (r) => { r.squat = 2; wideLegs(r); r.tx = -1; r.backArm = [q(-2 - 2 * t), -2]; } };
    }
    const t = ease(seg(p, 0.3, 0.42));
    const back = ease(seg(p, 0.62, 1));
    return {
      weapon: 150 - 20 * back, arm: 30 + 25 * back, lunge: lerp(-3, 10, t) * (1 - back * 0.8), tilt: 0.2 * t * (1 - back),
      rig: (r) => { r.tx = 2; r.squat = back < 0.5 ? 2 : 1; lungeLegs(r, 1.4); r.backArm = [q(lerp(-4, 8, t) - 6 * back), q(-4 + 2 * back)]; r.cape = -4; r.hairLift = -1; strikeFace(r); },
    };
  },

  // The Shinobi's spinning throw: whip round once with the kunai fanned in the hand, and fling them
  // out of the turn in a wide sidearm (they leave at about 0.55).
  kunaifan(p) {
    if (p < 0.38) {
      const a = ease(p / 0.38);
      return { weapon: lerp(60, 150, a), arm: lerp(90, 40, a), orbit: true, turn: a < 0.5 ? -1 : 1, lift: 4 * bump(a, 0, 1), tilt: -0.12 * a, rig: (r) => { r.squat = 1; wideLegs(r); r.backArm = [-3, -4]; r.hairLift = -1; } };
    }
    const t = ease(seg(p, 0.38, 0.58));
    const back = ease(seg(p, 0.7, 1));
    return {
      weapon: lerp(150, 70, t), arm: lerp(40, 105, t) - 30 * back, lunge: 4 * t * (1 - back), tilt: 0.16 * t * (1 - back),
      rig: (r) => { r.tx = 2; lungeLegs(r, 1.2); r.backArm = [-5, -2]; r.hairLift = -1; if (t > 0 && back < 0.5) strikeFace(r); },
    };
  },

  // The Kitsune's pounce: crouch like a fox, spring forward in a high arc with the arm drawn back,
  // whip the stars down at them from the top of it (about 0.56), and land low.
  foxpounce(p) {
    const crouch = bump(p, 0, 0.18);
    const hop = Math.sin(seg(p, 0.14, 0.82) * Math.PI);
    const whip = ease(seg(p, 0.46, 0.58));
    const land = bump(p, 0.8, 1);
    return {
      weapon: lerp(-30, 130, whip), arm: lerp(185, 40, whip), lift: 26 * hop, tilt: lerp(0.25, -0.1, seg(p, 0.14, 0.5)) * (hop > 0 ? 1 : 0) + 0.12 * crouch,
      rig: (r) => { if (hop > 0.2) tuck(r); else { r.squat = crouch > 0.3 || land > 0.3 ? 2 : 1; wideLegs(r); } r.backArm = [-3, -4]; r.hairLift = hop > 0.3 ? -1 : 0; r.cape -= hop > 0.3 ? 3 : 0; if (whip > 0 && whip < 1) strikeFace(r); },
    };
  },

  // The Kitsune's hop: spring back and away, leaning back with the arm out for balance, and land
  // low, already turning to throw (the step carries her back).
  foxhop(p) {
    const crouch = bump(p, 0, 0.16);
    const hop = Math.sin(seg(p, 0.1, 0.78) * Math.PI);
    const land = bump(p, 0.74, 1);
    return {
      weapon: 60, arm: 90 + 40 * hop, lift: 22 * hop, tilt: -0.3 * hop + 0.1 * crouch,
      rig: (r) => { if (hop > 0.25) tuck(r); else { r.squat = crouch > 0.3 || land > 0.3 ? 2 : 1; wideLegs(r); } r.backArm = [-5, -5]; r.hairLift = hop > 0.3 ? -1 : 0; },
    };
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

  // ---------- The Shrine Maiden's figures (her gohei is drawn where the fan would be) ----------
  // Grand Blessing (the light falls at ~0.55): she lifts the bell staff high and rings it while the
  // gohei sweeps over her head left, right and left again, the way a priestess purifies, her hips
  // swaying with it; then both arms open wide and her face lifts as the great light falls.
  shrinegrand(p) {
    const up = soft(seg(p, 0, 0.18));
    const open = soft(seg(p, 0.48, 0.62));
    const settle = soft(seg(p, 0.84, 1));
    const hold = 1 - settle;
    const sw = Math.sin(seg(p, 0.14, 0.5) * Math.PI * 3) * up * (1 - open);
    const ring = Math.sin(seg(p, 0.1, 0.5) * Math.PI * 8) * 10 * up * (1 - open);
    return {
      weapon: -5 + ring + 30 * open * hold + 25 * settle, arm: lerp(70, 160, up) - 40 * open - 40 * settle,
      tilt: 0.06 * sw - 0.12 * open * hold, lift: 2 * up * (1 - open) + 5 * open * hold + breathe(p) * open * hold,
      fan: 0.4 + 0.6 * Math.abs(sw) + 0.6 * open * hold, fanA: (-10 + 70 * sw) * (1 - open) - 110 * open * hold,
      rig: (r) => {
        r.backArm = [q((2 + 6 * sw) * up * (1 - open) - 11 * open * hold), q(-11 * up * (1 - open) - 9 * open * hold)];
        r.tx = q(0.8 * sw);
        r.hairLift = open * hold > 0.4 ? -1 : 0;
        r.cape -= q(3 * Math.abs(sw) + 4 * open * hold);
        danceLegs(r, [up * (1 - open), [2.4, 0, 6], [-2.4, 0, -6]], [open * hold, [1.4, -1.6, 12], [-1.4, -1.4, -10]]);
        if (open * hold > 0.4) r.eyes = 'happy';
        else if (up > 0.3) r.eyes = 'blink';
      },
    };
  },
  // Purification (the circle forms at ~0.5): she draws the gohei up behind her shoulder, then
  // sweeps it down and round in one long low arc across the ground before her, sinking with it,
  // and drives the bell staff's foot down as the circle of light opens; holds, kneeling a little.
  shrinepurify(p) {
    const draw = soft(seg(p, 0, 0.24));
    const arc = soft(seg(p, 0.22, 0.5));
    const plant = soft(seg(p, 0.44, 0.54));
    const settle = soft(seg(p, 0.82, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, -5, draw) + 165 * plant * hold + 20 * settle, arm: lerp(70, 120, draw) - 60 * plant - 10 * settle,
      tilt: -0.08 * draw * (1 - arc) + 0.26 * arc * hold, lunge: 5 * arc * hold, lift: 2 * draw * (1 - arc),
      fan: 0.5 + 0.5 * arc * hold, fanA: lerp(-40, 60, draw) * (1 - arc) + lerp(60, -150, arc) * arc * hold,
      rig: (r) => {
        r.backArm = [q(lerp(0, -4, draw) * (1 - arc) + lerp(-4, 8, arc) * hold), q(lerp(0, -10, draw) * (1 - arc) + 2 * arc * hold)];
        r.squat = q(2.4 * arc * hold);
        r.cape -= q(2 * draw + 4 * arc * hold);
        r.hairLift = arc * hold > 0.4 ? -1 : 0;
        danceLegs(r, [draw * (1 - arc), [1.4, -1.2, 8], [-1.4, 0, -6]], [arc * hold, [5, 0, 8], [-4.4, 0, -16]]);
        if (plant * hold > 0.3) r.eyes = 'half';
      },
    };
  },
  // Resurrection Dance (the dead rise at ~0.7): a long, slow figure. She kneels with the bell
  // staff and the gohei held together at her heart, eyes closed; rises slowly, turning the gohei
  // three times in a circle over her head as the bells ring; then lifts both arms to the sky and
  // holds there on her toes, looking up.
  shrinerevive(p) {
    const kneel = soft(seg(p, 0, 0.16)) * (1 - soft(seg(p, 0.22, 0.36)));
    const rise = soft(seg(p, 0.22, 0.4));
    const circle = seg(p, 0.3, 0.64);
    const sky = soft(seg(p, 0.62, 0.74));
    const settle = soft(seg(p, 0.88, 1));
    const hold = 1 - settle;
    const turn = circle * Math.PI * 6;
    const twirl = rise * (1 - sky);
    const ring = Math.sin(p * 40) * 8 * twirl;
    return {
      weapon: lerp(10, 40, kneel) + ring - 40 * sky * hold + 30 * settle, arm: lerp(70, 40, kneel) + 100 * twirl + 150 * sky * hold - 20 * settle,
      tilt: 0.3 * kneel - 0.14 * sky * hold, lift: 6 * sky * hold + breathe(p) * sky * hold,
      fan: 0.3 + 0.7 * twirl + 0.6 * sky * hold, fanA: lerp(60, 120, kneel) * (1 - rise) + (Math.cos(turn) * 60 - 20) * twirl - 120 * sky * hold,
      rig: (r) => {
        r.backArm = [q(lerp(0, 4, kneel) * (1 - rise) + 3 * Math.sin(turn) * twirl - 3 * sky * hold), q(lerp(0, 1, kneel) * (1 - rise) - 10 * twirl - 14 * sky * hold)];
        r.squat = q(3 * kneel);
        r.hairLift = twirl > 0.3 || sky > 0.3 ? -1 : 0;
        r.cape -= q(3 * twirl + 4 * sky * hold);
        danceLegs(r, [kneel, [3.4, 0, 2], [-3.4, -0.4, -2]], [sky * hold, [1.4, -2.4, 14], [-1.4, -1.6, -10]]);
        if (kneel > 0.3) r.eyes = 'blink';
        else if (sky * hold > 0.4) [r.eyes, r.mouth] = ['happy', 'open'];
      },
    };
  },
  // Thousand Torii (the gates rise at ~0.45): she plants the bell staff before her and holds the
  // gohei out level and straight ahead, pointing the way down the corridor, chin up; as the gates
  // rise she sweeps it up overhead and holds it high while her guardian goes gate to gate.
  shrinetorii(p) {
    const point = soft(seg(p, 0, 0.24));
    const raise = soft(seg(p, 0.42, 0.56));
    const settle = soft(seg(p, 0.9, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, 150, point) * (1 - settle) + 20 * settle, arm: lerp(70, 30, point) * (1 - settle) + 70 * settle,
      tilt: -0.1 * point * hold, lunge: 3 * point * (1 - raise), lift: 3 * raise * hold + breathe(p) * raise * hold,
      fan: 0.5 + 0.5 * raise * hold, fanA: lerp(0, 90, point) * (1 - raise) - 30 * raise * hold,
      rig: (r) => {
        r.backArm = [q(lerp(0, 8, point) * (1 - raise) + 2 * raise * hold), q(lerp(0, -6, point) * (1 - raise) - 14 * raise * hold)];
        r.hairLift = raise * hold > 0.3 ? -1 : 0;
        r.cape -= q(2 * point + 4 * raise * hold);
        danceLegs(r, [point * (1 - raise), [4, 0, 6], [-3.6, 0, -10]], [raise * hold, [1.4, -2, 12], [-1.4, -1.4, -8]]);
        if (point * (1 - raise) > 0.5) r.eyes = 'half';
        else if (raise * hold > 0.4) r.eyes = 'happy';
      },
    };
  },

  // ---------- The Onmyoji's figures (sharp and commanding: the fan snaps, the talismans fly) ----------
  // Ofuda Barrage (the talismans fly at ~0.42): she snaps the fan shut and draws a fan of talismans
  // up by her cheek between her fingers, then whips her arm out flat and wide, flinging them, her
  // weight going into it; holds, chin up.
  onmyoofuda(p) {
    const draw = soft(seg(p, 0, 0.3));
    const fling = soft(seg(p, 0.34, 0.46));
    const settle = soft(seg(p, 0.8, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, 30, draw) - 20 * fling * hold + 10 * settle, arm: lerp(70, 50, draw) * (1 - fling) + 70 * fling,
      tilt: -0.06 * draw * (1 - fling) + 0.16 * fling * hold, lunge: 4 * fling * hold,
      fan: 0.1 * draw * (1 - fling) + 0.9 * fling * hold, fanA: lerp(0, -60, draw) * (1 - fling) + 100 * fling * hold,
      rig: (r) => {
        r.backArm = [q(lerp(0, 2.6, draw) * (1 - fling) + 10 * fling * hold), q(lerp(0, -12, draw) * (1 - fling) - 5 * fling * hold)];
        r.cape -= q(2 * draw + 3 * fling * hold);
        danceLegs(r, [draw * (1 - fling), [1.4, -1, 6], [-1.4, 0, -4]], [fling * hold, [4.6, 0, 8], [-4, 0, -14]]);
        if (draw * (1 - fling) > 0.5) r.eyes = 'half';
      },
    };
  },
  // Seiman Seal (the seal opens at ~0.66): she raises the fan and traces the five-pointed star in
  // the air before her, five sharp strokes, her other hand held in a sword-sign at her lips; then
  // strikes its heart with the fan's tip, sinking into it.
  onmyoseal(p) {
    const up = soft(seg(p, 0, 0.12));
    const draw = seg(p, 0.12, 0.6);
    const strike = soft(seg(p, 0.6, 0.68));
    const settle = soft(seg(p, 0.86, 1));
    const hold = 1 - settle;
    // The fan's tip goes round the star's five points in turn.
    const k = Math.min(4.999, draw * 5);
    const a0 = (-90 + Math.floor(k) * 144) * (Math.PI / 180);
    const a1 = (-90 + (Math.floor(k) + 1) * 144) * (Math.PI / 180);
    const f = soft(k - Math.floor(k));
    const sx = Math.cos(a0) + (Math.cos(a1) - Math.cos(a0)) * f;
    const sy = Math.sin(a0) + (Math.sin(a1) - Math.sin(a0)) * f;
    const tracing = up * (1 - strike);
    return {
      weapon: 10 + 20 * up * (1 - strike) + 30 * strike * hold, arm: lerp(70, 110, up) + 30 * sy * tracing - 30 * strike * hold - 20 * settle,
      tilt: 0.04 * sx * tracing + 0.18 * strike * hold, lunge: 2 * sx * tracing + 4 * strike * hold, lift: 2 * tracing,
      fan: 0.15 + 0.2 * tracing + 0.6 * strike * hold, fanA: 40 * sx * tracing + 90 * strike * hold,
      rig: (r) => {
        r.backArm = [q(1.4 * up), q(-12 * up * (1 - strike) - 4 * strike * hold)];
        r.squat = q(1.6 * strike * hold);
        r.cape -= q(2 * tracing + 3 * strike * hold);
        danceLegs(r, [tracing, [2, 0, 6], [-2.4, 0, -6]], [strike * hold, [4.6, 0, 10], [-4.4, 0, -14]]);
        if (tracing > 0.4) r.eyes = 'half';
      },
    };
  },
  // Yokai Rally (the troupe answers at ~0.6): two sharp claps before her chest, then a talisman
  // raised high overhead in the fan hand, the other hand on her hip, chin up, commanding.
  onmyorally(p) {
    const clap = Math.max(bump(p, 0.08, 0.22), bump(p, 0.24, 0.38));
    const near = soft(seg(p, 0.04, 0.12)) * (1 - soft(seg(p, 0.42, 0.5)));
    const raise = soft(seg(p, 0.46, 0.6));
    const settle = soft(seg(p, 0.86, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, 60, near) - 50 * raise * hold + 10 * settle, arm: lerp(70, 60, near) + 110 * raise * hold - 20 * settle,
      tilt: -0.1 * raise * hold, lift: 3 * raise * hold + 1.5 * clap,
      fan: 0.2 * near + 0.9 * raise * hold, fanA: -20 * raise * hold,
      rig: (r) => {
        r.backArm = [q(lerp(0, 4.6 - 1.6 * clap, near) * (1 - raise) - 1.6 * raise * hold), q(lerp(0, -7, near) * (1 - raise) + 1 * raise * hold)];
        r.hairLift = raise * hold > 0.4 ? -1 : 0;
        r.cape -= q(3 * raise * hold);
        danceLegs(r, [near, [2.4, 0, 6], [-2.4, 0, -6]], [raise * hold, [1.4, -2, 12], [-1.4, -1.4, -8]]);
        if (clap > 0.5) r.eyes = 'blink';
        else if (raise * hold > 0.4) r.eyes = 'half';
      },
    };
  },
  // Troupe Combo (over ~4.4 s): she thrusts the fan out at them, commanding, and holds there,
  // chin up, while her troupe goes to work, swaying as each of them strikes (freeze ~0.24, lift
  // ~0.44, slam ~0.77); at ~0.91 she whips the fan shut with a flourish and they shatter.
  onmyocombo(p) {
    const point = soft(seg(p, 0, 0.07));
    const sway = 0.5 * (bump(p, 0.22, 0.3) + bump(p, 0.42, 0.5) + 1.6 * bump(p, 0.76, 0.84));
    const snap = soft(seg(p, 0.87, 0.915));
    const settle = soft(seg(p, 0.96, 1));
    const hold = 1 - settle;
    return {
      weapon: lerp(10, 120, point) * (1 - snap) + 60 * snap * hold + 10 * settle, arm: lerp(70, 40, point) * (1 - snap) + 150 * snap * hold - 20 * settle,
      tilt: -0.08 * point * hold - 0.04 * sway, lunge: 3 * point * (1 - snap) + 2 * sway, lift: 2 * snap * hold,
      fan: (1 - 0.9 * snap) * point + 0.1, fanA: lerp(0, 90, point) * (1 - snap) - 60 * snap * hold,
      rig: (r) => {
        r.backArm = [q(-1.6 * point * hold), q(-0.4 * point * hold)];
        r.cape -= q(2 * point + 2 * sway + 3 * snap * hold);
        r.hairLift = snap * hold > 0.3 ? -1 : 0;
        danceLegs(r, [point * (1 - snap), [4.2, 0, 8], [-4, 0, -12]], [snap * hold, [1.4, -1.6, 10], [-1.4, -1, -6]]);
        if (snap * hold > 0.4) r.eyes = 'half';
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
  flurry: 0.4, dash: 0.35, vanish: 0.3, cleave: 0.55, cross: 0.45, sweep: 0.4, spinback: 0.45, shove: 0.35, risecut: 0.45, leapchop: 0.6, jabs: 0.4, flashcut: 0.34, drivestab: 0.4, hammer: 0.7, skysplit: 0.9, quickshot: 0.3, bash: 0.4, rampage: 1.3, meteor: 0.4, landslam: 0.3, dashstab: 0.4, verdict: 1.5, eclipse: 1.5, pslash: 0.35, pthrust: 0.35, ascend: 0.45, smite: 0.6, consecrate: 0.8, salute: 0.5, cleave1: 0.45, cleave2: 0.45, gyre: 0.45, reaver: 0.7, warroar: 0.6, axehurl: 0.55, bodyslam: 0.8, dragrise: 0.8, shieldslam: 0.6, shieldrush: 0.8, recklesscharge: 0.85,
  spinshot: 0.4, hopshot: 0.45, pointblank: 0.45, hipfire: 0.3, vault: 0.5, downshot: 0.35, comet: 1.3, leapshot: 0.5, galeshot: 0.55, tailwind: 0.5, stormvolley: 1.5, slideshot: 0.4, kneelshot: 0.45, crankshot: 0.5, ballista: 0.65, rollshot: 0.5, steadyaim: 0.5, heartseeker: 1.5, titanbreak: 1.4, backstab: 0.5, assassinate: 1.5, crossflip: 0.6, palmseal: 0.45, kunaifan: 0.45, foxpounce: 0.55, foxhop: 0.45, spinkick: 0.4, vaultcut: 0.55, whirlflip: 0.6, twirlthrow: 0.45, throwflip: 0.55, flipthrow: 0.55, crossfin: 0.55, whirlfin: 0.6, inkdraw: 0.6, cutflip: 0.5, heavethrow: 0.5, flashjump: 0.3, shadowrun: 0.3, moonthrow: 1.5, upthrow: 0.4, airthrow: 0.3,
  kagura: 0.92, kaguraturn: 1.1, kagurafin: 1.32, bellshake: 1.1, sleevefan: 0.99, bowrise: 1.21, twirlstep: 1.1, kaguraup: 0.99, floatcast: 0.77, floatcast2: 0.88, glidecast: 0.99, spiritstep: 0.55, kaguraslam: 1.1, kagurabless: 1.2, kaguraward: 1.1, kaguralantern: 1.6,
  shrinegrand: 1.4, shrinepurify: 1.2, shrinerevive: 2.2, shrinetorii: 1.8,
  onmyoofuda: 0.95, onmyoseal: 1.35, onmyorally: 1.1, onmyocombo: 4.2,
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
export function moveAt(kind, progress, dur = 0.35, feel = null) {
  if (!MOVES[kind]) return null;
  const f = FEEL[feel?.weapon] ?? {};
  const p = bend(clamp01(progress), feel?.hit, f.pre, f.post);
  const mv = after(sway(kind, p, dur, rawMoveAt(kind, p, dur), f), p, feel?.hit, f, feel?.fin);
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
const GROUNDED_RISE = new Set(['kagurafin', 'bowrise', 'kaguraup', 'kaguraslam', 'kagurabless', 'kaguralantern', 'shrinegrand', 'shrinerevive', 'shrinetorii', 'onmyorally', 'onmyocombo']);
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
