// The emotes (ui/emotes.js): each one its own little performance, readable at a glance and built
// to escalate (a wind-up, the big moment, a settle). Same channels as the life moves
// (render/life-moves.js header); `expression` keeps the emote's own face (world.emote) on
// throughout instead of the battle face a move would otherwise wear. The hand is emptied for the
// ones that talk with the hands. Every one keeps the figure its own size (a turn is a clean mirror
// flip) and eases between key poses. An empty hand raised past about 145 degrees hides behind the
// big chibi head, so the hands-only emotes reach up and out to the side instead.

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
// Legs eased from standing toward [dx, dy, angle] for each foot.
function legs(r, k, front, back) {
  r.frontLeg = [q(lerp(0.8, front[0], k)), q(lerp(0, front[1], k)), deg2(lerp(0, front[2], k))];
  r.backLeg = [q(lerp(-0.8, back[0], k)), q(lerp(0, back[1], k)), deg2(lerp(0, back[2], k))];
}
const tucked = (r, k) => legs(r, k, [2.6, -5, 10], [-1.6, -2.6, -10]);
// The free hand, kept below the jaw (the big chibi head sits right above the shoulder).
const hand = (x, y) => [q(x), q(Math.max(-8, y))];

export const EMOTE_MOVES = {
  // Cheer: dip down, then spring up with the fist punched at the sky, land, and bounce again with
  // a second pump, higher and happier than the first.
  emcheer(p) {
    const dip = bump(p, 0, 0.2) + 0.6 * bump(p, 0.52, 0.64);
    const hop1 = bump(p, 0.16, 0.5);
    const hop2 = bump(p, 0.6, 0.92);
    const air = Math.max(hop1, hop2);
    const fist = keys(p, [[0, 60], [0.14, 40], [0.3, 172], [0.5, 120], [0.58, 100], [0.74, 176], [0.94, 150], [1, 70]]);
    return {
      expression: true,
      weapon: lerp(25, -30, seg(fist, 60, 176)), arm: fist, lift: 9 * hop1 + 13 * hop2 - 2 * dip,
      tilt: -0.05 * air,
      rig: (r) => {
        r.squat = q(3 * dip);
        if (air > 0.25) tucked(r, seg(air, 0.25, 0.7));
        r.backArm = hand(-2.5, lerp(0, -8, air));
        r.hairLift = air > 0.3 ? -1 : 0;
      },
    };
  },

  // Dance: a happy two-step, side to side with the hips swaying and the arms swinging in time, a
  // spin (two clean flips) on the third beat, and a pointed finish, one hand to the sky.
  emdance(p) {
    const beat = p * 4;
    const sway = Math.sin(beat * Math.PI);
    const step = Math.abs(Math.sin(beat * Math.PI));
    const spin = seg(p, 0.55, 0.75);
    const turn = spin > 0.25 && spin < 0.75 ? -1 : 1;
    const point = soft(seg(p, 0.78, 0.88)) * (1 - soft(seg(p, 0.96, 1)));
    const groove = 1 - point;
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(lerp(40, 132, 0.5 + 0.5 * sway), 140, point), lift: 4 * step * groove + 5 * bump(p, 0.55, 0.75) + 1.5 * point,
      lunge: 2.6 * sway * groove, tilt: 0.12 * sway * groove - 0.08 * point, turn,
      rig: (r) => {
        r.squat = q(2 * (1 - step) * groove);
        legs(r, 1, [lerp(2.6, 3.4, point), q(-3 * Math.max(0, sway) * groove), lerp(10, 4, point)], [lerp(-2.6, -3.4, point), q(-3 * Math.max(0, -sway) * groove), -10]);
        r.backArm = point > 0.3 ? hand(3.5, 2.5) : hand(lerp(2, -4.5, 0.5 + 0.5 * sway), lerp(1, -6, 0.5 + 0.5 * sway));
        r.hairLift = step > 0.6 ? -1 : 0;
      },
    };
  },

  // Flip: crouch, a full backflip tucked tight, stick the landing low, and pop up with the arms
  // flung wide: ta-da!
  emflip(p) {
    const crouch = bump(p, 0, 0.18) + bump(p, 0.6, 0.76);
    const t = soft(seg(p, 0.12, 0.62));
    const air = t > 0 && t < 1;
    const tada = soft(seg(p, 0.72, 0.84)) * (1 - soft(seg(p, 0.95, 1)));
    return {
      expression: true,
      weapon: lerp(25, -35, tada), arm: lerp(60, 140, tada), lift: 24 * Math.sin(t * Math.PI) + 2 * tada - 2 * crouch,
      tilt: -t * Math.PI * 2 - 0.06 * tada,
      rig: (r) => {
        r.squat = q(3 * crouch);
        if (air) tucked(r, 1);
        else if (tada > 0.2) legs(r, tada, [3, 0, 4], [-3, 0, -4]);
        r.backArm = air ? hand(-2, -3) : tada > 0.2 ? hand(-4.5, -6 * tada) : hand(-1, 0);
        r.hairLift = air || tada > 0.4 ? -1 : 0;
      },
    };
  },

  // Love: hands clasped in front, swaying side to side on tiptoe, then a hop with the arms flung
  // wide open: a big hug for everyone.
  emlove(p) {
    const clasp = soft(seg(p, 0, 0.15)) * (1 - soft(seg(p, 0.62, 0.7)));
    const sway = Math.sin(p * Math.PI * 4) * clasp;
    const hop = bump(p, 0.64, 0.86);
    const open = soft(seg(p, 0.66, 0.76)) * (1 - soft(seg(p, 0.94, 1)));
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(lerp(60, 78, clasp), 138, open), lift: 2 * clasp + 8 * hop, tilt: 0.12 * sway - 0.08 * open, lunge: 1.6 * sway,
      rig: (r) => {
        if (hop > 0.3) tucked(r, seg(hop, 0.3, 0.8));
        else legs(r, clasp, [1.4, -2, 8], [-1.4, -2, -8]);
        r.backArm = open > 0.2 ? hand(-4.5, -7 * open) : hand(lerp(0, 3, clasp), lerp(0, 1, clasp));
        r.hy = q(0.8 * Math.abs(sway));
        r.hairLift = hop > 0.4 ? -1 : 0;
      },
    };
  },

  // Thanks: hands together, a deep, polite bow held for a beat, and back up with a small nod.
  embow(p) {
    const hands = soft(seg(p, 0, 0.18)) * (1 - soft(seg(p, 0.9, 1)));
    const bow = keys(p, [[0, 0], [0.18, 0], [0.4, 1], [0.62, 1], [0.8, 0], [0.86, 0.25], [0.94, 0]]);
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(60, 100, hands) - 30 * bow, tilt: 0.42 * bow, lunge: 1.2 * bow, lift: -0.8 * bow,
      rig: (r) => {
        r.squat = q(0.8 * bow);
        r.backArm = hand(lerp(0, 3, hands), lerp(0, -3.5, hands) + 2 * bow);
        r.hy = q(0.8 * bow);
        r.cape -= q(1 * bow);
      },
    };
  },

  // Flex: stomp into a wide, low stance with a hand on the hip, then pump the arm up twice, the
  // second higher and held, leaning back proud with a bounce.
  emflex(p) {
    const stance = soft(seg(p, 0, 0.14));
    const stomp = bump(p, 0.08, 0.2);
    const arm = keys(p, [[0, 60], [0.14, 20], [0.3, 128], [0.42, 40], [0.6, 142], [0.88, 138], [1, 60]]);
    const proud = soft(seg(p, 0.55, 0.65)) * (1 - soft(seg(p, 0.9, 1)));
    const bounce = Math.abs(Math.sin(p * Math.PI * 6)) * proud;
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm, lift: 1.2 * bounce - 2 * stomp, tilt: -0.16 * proud, lunge: -1.2 * proud,
      rig: (r) => {
        r.squat = q(3 * stomp + 2.5 * stance * (1 - proud) + 1.2 * proud);
        legs(r, stance, [4, 0, 6], [-4, 0, -6]);
        r.backArm = hand(lerp(0, 2.5, stance), lerp(0, 1, stance));
        r.hairLift = stomp > 0.5 ? -1 : 0;
      },
    };
  },

  // Sleepy: a huge stretch with both arms up and a lean back, then the arms flop down, the
  // shoulders slump and the head nods off, jerks up, and nods again.
  emsleepy(p) {
    const stretch = soft(seg(p, 0, 0.22)) * (1 - soft(seg(p, 0.34, 0.46)));
    const slump = soft(seg(p, 0.4, 0.55));
    const nod = keys(p, [[0, 0], [0.5, 0], [0.66, 1], [0.7, 0.2], [0.86, 1], [1, 1]]) * slump;
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(lerp(60, 142, stretch), 20, slump), lift: 2 * stretch - 0.8 * slump, tilt: -0.16 * stretch + 0.1 * nod,
      rig: (r) => {
        r.squat = q(1.2 * slump);
        legs(r, stretch, [1.4, -1.4, 6], [-1.4, -1.4, -6]);
        r.backArm = hand(lerp(0, -4.5, stretch), lerp(lerp(0, -8, stretch), 2, slump));
        r.hy = q(1.4 * nod);
        r.cape -= q(1 * slump);
      },
    };
  },

  // Sad: the shoulders drop and the head hangs, a toe scuffs the ground twice, and a hand comes up
  // to rub an eye.
  emsad(p) {
    const droop = soft(seg(p, 0, 0.2));
    const scuff = bump(p, 0.25, 0.4) + bump(p, 0.45, 0.6);
    const rub = soft(seg(p, 0.62, 0.72)) * (1 - soft(seg(p, 0.92, 1)));
    const wipe = Math.sin(p * Math.PI * 16) * rub;
    const sigh = bump(p, 0.15, 0.35);
    return {
      expression: true,
      tool: 'none', weapon: 0,
      arm: lerp(60, 8, droop), lift: 0.6 * sigh - 1 * droop, tilt: 0.16 * droop,
      rig: (r) => {
        r.squat = q(1.5 * droop);
        legs(r, 1, [lerp(0.8, 2.4, scuff), q(-1.4 * scuff), deg2(14 * scuff)], [-0.8, 0, 0]);
        r.backArm = rub > 0.2 ? hand(lerp(0, 2.5, rub) + 0.5 * wipe, lerp(0, -8, rub)) : hand(0.5, 1.5 * droop);
        r.hy = q(2 * droop);
        r.cape -= q(1 * droop);
      },
    };
  },
};

// How long each needs to read (seconds).
export const EMOTE_MIN = { emcheer: 1.2, emdance: 2, emflip: 1.1, emlove: 1.6, embow: 1.4, emflex: 1.4, emsleepy: 2.2, emsad: 2 };
