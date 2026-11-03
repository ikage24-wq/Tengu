// The other players' own little moments (render/moves.js MOVES), the things real players do between
// fights: sitting down AFK in town and dozing off, getting back up with a stretch, a twirl to show
// off a new piece of gear, and a pause mid-stroll to look around. Same channels as the life moves
// (render/life-moves.js header). Every one keeps the figure its own size (a turn is a clean mirror
// flip), eases between key poses, and keeps the face clear.

const RES = 2;
const q = (v) => Math.round(v * RES) / RES;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));

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

// Sat on the ground, legs out, the weapon laid down: (p, dur) with p * dur the seconds since they
// sat, so it runs on as long as they're away. They settle down over the first second, then breathe
// slow, the head drooping lower and lower until it dips and bobs back up (a doze), with the z's
// drifting up; every so often a little stretch of the arms.
function sitPose(t) {
  const sit = soft(seg(t, 0, 1));
  const breathe = Math.sin(t * 1.6);
  const L = 7;
  const lt = t % L;
  const droop = soft(seg(lt, 0.5, 5)) * (1 - soft(seg(lt, 5.4, 6)));
  const bob = bump(lt, 5.3, 6.2);
  const stretch = Math.floor(t / L) % 3 === 2 ? bump(lt, 0.2, 1.6) : 0;
  return { sit, breathe, droop, bob, stretch };
}

export const SOCIAL_MOVES = {
  afk(p, dur = 1) {
    const t = p * dur;
    const { sit, breathe, droop, bob, stretch } = sitPose(t);
    const z = Math.min(3, Math.floor((t % 2.4) / 0.6));
    return {
      tool: 'none',
      weapon: 60, arm: lerp(60, 26, sit) + 2 * breathe - 18 * stretch, lift: -6.5 * sit,
      tilt: 0.06 * droop - 0.05 * bob - 0.04 * stretch, lunge: 0.6 * droop,
      face: sit < 0.6 ? { mouth: 'tiny', look: 'down' }
        : stretch > 0.2 ? { closed: [true, true], mouth: 'yawn', brows: [[0.4, -0.4], [0.4, -0.4]], extra: ['tear0'] }
        : { closed: [true, true], mouth: droop > 0.5 ? 'o' : 'cat', brows: [[0.3, -0.2], [0.3, -0.2]], extra: [`zzz${z}`] },
      rig: (r) => {
        r.squat = q(4 * sit);
        r.frontLeg = [q(lerp(0.8, 9, sit)), q(lerp(0, -3, sit)), Math.round(lerp(0, 64, sit) / 2) * 2];
        r.backLeg = [q(lerp(-0.8, 6.6, sit)), q(lerp(0, -2.6, sit)), Math.round(lerp(0, 48, sit) / 2) * 2];
        r.backArm = [q(lerp(0, -3, sit) + 1.5 * stretch), q(lerp(0, 1.5, sit) - 4 * stretch)];
        r.hy = q(0.4 * breathe * sit + 0.8 * droop - 0.6 * bob);
        r.cape -= q(1.5 * sit);
      },
    };
  },

  // Back from AFK: a big stretch where they sit, then up onto their feet with a little shake.
  afkwake(p) {
    const sit = 1 - soft(seg(p, 0.35, 0.75));
    const stretch = bump(p, 0, 0.45);
    const shake = Math.sin(p * 60) * bump(p, 0.75, 1) * 0.6;
    return {
      weapon: lerp(60, 25, soft(seg(p, 0.5, 1))), arm: lerp(26, 60, soft(seg(p, 0.4, 0.9))) - 14 * stretch, lift: -6.5 * sit + 1.5 * bump(p, 0.68, 0.9), lunge: shake,
      tool: p < 0.5 ? 'none' : undefined,
      face: p < 0.45 ? { closed: [true, true], mouth: 'yawn', extra: ['tear0'] } : { mouth: 'cat', blush: 1.1, brows: [[0.5, -0.2], [0.5, -0.2]] },
      rig: (r) => {
        r.squat = q(4 * sit);
        r.frontLeg = [q(lerp(0.8, 9, sit)), q(lerp(0, -3, sit)), Math.round(lerp(0, 64, sit) / 2) * 2];
        r.backLeg = [q(lerp(-0.8, 6.6, sit)), q(lerp(0, -2.6, sit)), Math.round(lerp(0, 48, sit) / 2) * 2];
        r.backArm = [q(-3 * sit + 1.5 * stretch), q(1.5 * sit - 4 * stretch)];
        r.hairLift = shake > 0.3 ? -1 : 0;
      },
    };
  },

  // Showing off something new: a dip, up onto the toes for a twirl (a clean flip at each half turn),
  // and a proud pose at the end with the chin up and a hand on the hip.
  showoff(p) {
    const dip = bump(p, 0, 0.18);
    const spin = seg(p, 0.16, 0.62);
    const rise = bump(p, 0.12, 0.66);
    const proud = soft(seg(p, 0.62, 0.74)) * (1 - soft(seg(p, 0.94, 1)));
    // Two half turns: away and back.
    const turn = spin > 0.25 && spin < 0.75 ? -1 : 1;
    return {
      weapon: lerp(25, -10, proud), arm: lerp(60, 120, rise) - 20 * proud, lift: 6 * rise - 1.2 * dip, turn,
      tilt: -0.06 * proud,
      face: p < 0.62 ? { closed: [true, true], mouth: 'D', blush: 1.3 } : { mouth: 'cat', blush: 1.4, brows: [[0.7, -0.3], [0.7, -0.3]], extra: [p > 0.8 ? 'spark1' : 'spark0'] },
      rig: (r) => {
        r.squat = q(2 * dip);
        if (rise > 0.3) {
          r.frontLeg = [1.4, -1.5 * rise, 10];
          r.backLeg = [-2.2, -3 * rise, -24];
        }
        r.backArm = proud > 0.3 ? [3, -2] : [q(-2 - 2 * rise), q(-3 * rise)];
        r.hairLift = rise > 0.4 ? -1 : 0;
      },
    };
  },

  // A pause mid-stroll: a glance up the street with a hand shading the eyes, then back the other
  // way (the turn itself is the body's facing: a flip in the world, see world/botsoul.js).
  lookaround(p) {
    const up = soft(seg(p, 0, 0.25)) * (1 - soft(seg(p, 0.8, 1)));
    const lean = keys(p, [[0, 0], [0.3, 1], [0.55, 0.6], [0.75, 1], [1, 0]]);
    return {
      weapon: 25, arm: 60, lunge: 1.2 * lean * up, tilt: -0.03 * up,
      face: p < 0.5 ? { look: 'up', glance: 1, mouth: up > 0.5 ? 'o' : 'tiny', brows: [[0.4, 0.1], [0.4, 0.1]] } : { glance: 1, mouth: 'tiny', brows: [[0.3, 0], [0.3, 0]] },
      rig: (r) => {
        // The free hand up to the brow, held clear of the eyes.
        r.backArm = [q(lerp(0, 2.5, up)), q(lerp(0, -4.5, up))];
      },
    };
  },
};

export const SOCIAL_MIN = { afkwake: 1.2, showoff: 1.3, lookaround: 1.4 };
