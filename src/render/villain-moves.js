// Malvina Grimsworth's own moves (the would-be villainess whose schemes keep turning helpful).
// Drawn for who she is: a cartoon villain's whole repertoire, performed by someone far too nice
// to pull it off. Each is its own performance with a wind-up, the big moment and a settle, eased
// between key poses; the figure keeps its own size (her spin is a clean mirror flip at each half
// turn). `expression` keeps the face her scene gives her (scheme, ohoho, fluster, tantrum). Same
// channels as the emotes (render/emote-moves.js): arm (the front arm's angle), lift, tilt (+ leans
// forward), lunge, turn, and the rig (legs, the back hand, squat, head bob, hair and cape).

const RES = 2;
const q = (v) => Math.round(v * RES) / RES;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const deg2 = (a) => Math.round(a / 2) * 2;
function keys(p, ks) {
  if (p <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1] = ks[i];
    if (p <= t1) {
      const [t0, v0] = ks[i - 1];
      return lerp(v0, v1, soft((p - t0) / (t1 - t0)));
    }
  }
  return ks[ks.length - 1][1];
}
function legs(r, k, front, back) {
  r.frontLeg = [q(lerp(0.8, front[0], k)), q(lerp(0, front[1], k)), deg2(lerp(0, front[2], k))];
  r.backLeg = [q(lerp(-0.8, back[0], k)), q(lerp(0, back[1], k)), deg2(lerp(0, back[2], k))];
}
const hand = (x, y) => [q(x), q(Math.max(-8, y))];

export const VILLAIN_MOVES = {
  // "Ohohoho!": a little gathering dip, then she leans back with the back of her hand at her
  // mouth and the other on her hip, her shoulders bouncing on every "ho" (three of them, the last
  // biggest), and settles with a satisfied sniff.
  vohoho(p) {
    const into = soft(seg(p, 0.06, 0.22)) * (1 - soft(seg(p, 0.88, 1)));
    const dip = bump(p, 0, 0.14);
    const hos = (bump(p, 0.24, 0.38) * 0.7 + bump(p, 0.4, 0.54) * 0.85 + bump(p, 0.56, 0.74)) * into;
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(60, 122, into), lift: 1.4 * hos - 1 * dip, tilt: -0.2 * into - 0.05 * hos, lunge: -1 * into,
      rig: (r) => {
        r.squat = q(1.5 * dip + 0.4 * into);
        legs(r, into, [2.2, 0, 4], [-1.8, 0, -6]);
        r.backArm = hand(lerp(0, -2.8, into), lerp(0, 2, into));
        r.hy = q(-0.8 * hos);
        r.hairLift = hos > 0.6 ? -1 : 0;
      },
    };
  },

  // The dramatic point ("YOU!"): she winds back, arm cocked and weight on the back foot, then
  // snaps forward into a wide stance with her arm thrust straight out at you, the cape flaring
  // behind; holds it, quivering with villainy; and draws herself back up.
  vpoint(p) {
    const wind = soft(seg(p, 0, 0.22)) * (1 - soft(seg(p, 0.22, 0.32)));
    const strike = soft(seg(p, 0.24, 0.34)) * (1 - soft(seg(p, 0.84, 1)));
    const quiver = Math.sin(p * Math.PI * 40) * 0.5 * seg(p, 0.36, 0.5) * (1 - seg(p, 0.7, 0.84));
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(lerp(60, 18, wind), 92 + quiver * 2, strike), lift: -1.2 * wind, tilt: -0.14 * wind + 0.12 * strike, lunge: -1.6 * wind + 3.4 * strike,
      rig: (r) => {
        r.squat = q(1.6 * wind + 1.4 * strike);
        legs(r, Math.max(wind, strike), wind > strike ? [1.4, 0, 2] : [4.2, 0, 8], wind > strike ? [-2.6, 0, -4] : [-3.6, 0, -8]);
        r.backArm = hand(lerp(lerp(0, 2, wind), -4.6, strike), lerp(0, -2.4, strike));
        r.cape = (r.cape ?? 0) + q(2.4 * strike);
        r.hy = q(quiver * 0.5);
      },
    };
  },

  // The cape swirl: a sweep of the arms, a full spin on the spot (a clean mirror flip at each half
  // turn) with the cape flaring out and the hair flying, and she lands with a hand on her hip and
  // her chin up.
  vswirl(p) {
    const gather = bump(p, 0, 0.18);
    const spin = seg(p, 0.14, 0.7);
    const open = Math.sin(spin * Math.PI);
    const land = soft(seg(p, 0.68, 0.82)) * (1 - soft(seg(p, 0.94, 1)));
    // Facing: away and back at each half turn.
    const turn = spin > 0 && spin < 1 ? (Math.floor(spin * 4) % 2 ? -1 : 1) : 1;
    return {
      expression: true,
      tool: 'none', weapon: 0,
      turn,
      arm: lerp(lerp(60, 100, open), 40, land), lift: 3 * open - 1.4 * gather, tilt: -0.1 * land,
      rig: (r) => {
        r.squat = q(2 * gather);
        legs(r, Math.max(open, land), [1.6, -0.8 * open, 6], [-1.6, 0, -6]);
        r.backArm = land > 0.2 ? hand(-2.8, 2) : hand(lerp(0, -4.5, open), lerp(0, -4, open));
        r.cape = (r.cape ?? 0) + q(3 * open);
        r.hairLift = open > 0.4 ? -1 : 0;
      },
    };
  },

  // The tantrum: fists balled at her sides, she stamps left, right, left, harder each time, with a
  // little hop of fury between, her head shaking; then a huff with her arms crossed.
  vstomp(p) {
    const fists = soft(seg(p, 0, 0.1)) * (1 - soft(seg(p, 0.76, 0.84)));
    const stamps = [[0.1, 0.26], [0.28, 0.44], [0.46, 0.66]];
    const s = stamps.map(([a, b]) => bump(p, a, b));
    const shake = Math.sin(p * Math.PI * 26) * fists;
    const huff = soft(seg(p, 0.78, 0.88)) * (1 - soft(seg(p, 0.96, 1)));
    const up = Math.max(...s);
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(lerp(60, 14 + shake * 4, fists), 76, huff), lift: 1.6 * up - 0.6 * huff, tilt: 0.08 * fists - 0.06 * huff, lunge: 0.4 * shake,
      rig: (r) => {
        r.squat = q(1.2 * (1 - up) * fists + 0.6 * huff);
        // Each stamp raises one knee and slams it down; the feet alternate.
        const front = s[0] + s[2];
        legs(r, 1, [0.8 + 0.6 * front, -4.2 * front, deg2(10 * front)], [-0.8 - 0.6 * s[1], -4.2 * s[1], deg2(-10 * s[1])]);
        r.backArm = huff > 0.2 ? hand(2.6, -0.4) : hand(lerp(0, -0.6, fists), lerp(0, 2.4, fists) + shake * 0.4);
        r.hy = q(shake * 0.6);
        r.hairLift = up > 0.5 ? -1 : 0;
      },
    };
  },

  // Flustered (thanked, again): hands pressed together at her chest, fingers twiddling, swaying
  // from side to side, a toe scuffing the floor twice, a little bounce of embarrassment.
  vfluster(p) {
    const hold = soft(seg(p, 0, 0.12)) * (1 - soft(seg(p, 0.9, 1)));
    const sway = Math.sin(p * Math.PI * 4) * hold;
    const twiddle = Math.sin(p * Math.PI * 22) * hold;
    const scuff = bump(p, 0.3, 0.45) + bump(p, 0.55, 0.7);
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(60, 80 + twiddle * 3, hold), lift: 0.6 * Math.abs(sway), tilt: 0.06 * sway + 0.06 * hold, lunge: 1.2 * sway,
      rig: (r) => {
        r.squat = q(0.6 * hold);
        legs(r, 1, [lerp(0.8, 2.2, scuff), q(-1.2 * scuff), deg2(12 * scuff)], [-0.6, 0, -2]);
        r.backArm = hand(lerp(0, 2.8 + twiddle * 0.3, hold), lerp(0, -0.6, hold));
        r.hy = q(0.6 * Math.abs(sway));
      },
    };
  },

  // Scheming: hunched forward over her plan, rubbing her hands together, a slow, gleeful bob,
  // and a sly peek over her shoulder.
  vscheme(p) {
    const into = soft(seg(p, 0, 0.12)) * (1 - soft(seg(p, 0.9, 1)));
    const rub = Math.sin(p * Math.PI * 16) * into;
    const bob = Math.sin(p * Math.PI * 4) * into;
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(60, 82 + rub * 4, into), lift: 0.6 * bob - 0.6 * into, tilt: 0.14 * into, lunge: 0.6 * into,
      rig: (r) => {
        r.squat = q(1.4 * into);
        legs(r, into, [1.6, 0, 4], [-1.6, 0, -4]);
        r.backArm = hand(lerp(0, 3.2 - rub * 0.5, into), lerp(0, -0.8, into));
        r.hy = q(0.6 * into + 0.3 * bob);
      },
    };
  },
};

// How long each takes at least.
export const VILLAIN_MIN = { vohoho: 1.8, vpoint: 1.6, vswirl: 1.4, vstomp: 1.8, vfluster: 2.2, vscheme: 2 };
