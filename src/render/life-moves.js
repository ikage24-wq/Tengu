// Life-skill moves (render/moves.js MOVES): gathering, picking fruit, cutting fibre, mining, chopping
// wood, the whole fishing set, cooking at a stove and crafting at a bench. Each is drawn as what it
// is (the Wind Dancer standard, CLAUDE.md): anticipation, a clean beat that lands early, a held
// moment, follow-through and a settle, with the face acting the whole way. They play out on their
// own: there are no minigames.
//
// Same channels as the combat moves (render/moves.js header), plus:
//   tool      what the weapon hand holds instead of the weapon (render/tools.js), or 'none'
//   backTool  a tool hanging from the free hand (the basket), drawn behind the body
//   armBack   the weapon arm (and its tool) is drawn behind the body: raised for a wind-up it
//             passes behind the big head, never across the face
//   face      the expression, overriding the fight faces (eyes, mouth, brows, marks: hero.js)
//   find      0-1: the find (an item icon) shows in the weapon hand, popping in at its size
//   hitAt     the moments of the move's impacts (0-1), for the dust, chips and sparks (render/life.js)
// The hand and arm angles are the combat ones: weapon 0 = up, + tips forward; arm 0 = down, 90 =
// straight forward. The weapon arm stays at or below the shoulder whenever it is in front, and the
// free hand (behind the body) never rises past her jaw, so nothing covers the face.

const RES = 2;
const q = (v) => Math.round(v * RES) / RES;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const easeIn = (t) => t * t;
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));

// Key poses eased one into the next: keys = [[at, value], ...] in order; held before the first and
// after the last, each span eased in and out (a settle on every key).
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
// The same, but a span may say how it eases: [at, value, 'in'] accelerates into the key (a blow).
function keysW(p, ks) {
  if (p <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, how] = ks[i];
    if (p <= t1) {
      const [t0, v0] = ks[i - 1];
      const u = clamp01((p - t0) / (t1 - t0));
      return lerp(v0, v1, how === 'in' ? easeIn(u) : how === 'lin' ? u : soft(u));
    }
  }
  return ks[ks.length - 1][1];
}
const pair = (p, ks) => [q(keys(p, ks.map(([t, v]) => [t, v[0]]))), q(keys(p, ks.map(([t, v]) => [t, v[1]])))];
const legs = (p, ks) => {
  const ch = (side, i) => keys(p, ks.map(([t, f, b]) => [t, (side ? b : f)[i]]));
  return [[q(ch(0, 0)), q(ch(0, 1)), Math.round(ch(0, 2) / 2) * 2], [q(ch(1, 0)), q(ch(1, 1)), Math.round(ch(1, 2) / 2) * 2]];
};
// A shiver after a blow (hit-stop): a fast small wobble that dies over `len`.
const jolt = (p, at, len, amp) => (p < at || p > at + len ? 0 : Math.sin((p - at) * 220) * amp * (1 - (p - at) / len));

const STAND = [[0.8, 0, 0], [-0.8, 0, 0]];
const KNEEL = [[3.4, 0, 6], [-3.6, -1, -30]];
const BRACE = [[3.4, 0, 4], [-3.4, 0, -6]];

// ---- Faces ----
const FOCUS = { lid: 0.25, mouth: 'pursed', brows: [[-0.1, 0.5], [-0.1, 0.5]] };
const EFFORT = { lid: 0.2, cross: 0.4, mouth: 'grit', brows: [[-0.2, 0.7], [-0.2, 0.7]] };
const HEAVE = { closed: [true, true], mouth: 'yell', brows: [[-0.2, 0.8], [-0.2, 0.8]] };
const PLEASED = { mouth: 'cat', blush: 1.3, brows: [[0.6, -0.2], [0.6, -0.2]] };
const BEAM = { closed: [true, true], mouth: 'D', blush: 1.5, brows: [[0.8, -0.3], [0.8, -0.3]] };

export const LIFE_MOVES = {
  // Gathering (herbs, flowers): she drops to one knee, parts the leaves with her free hand, pinches
  // the find low at the stem, gives it a little tug and it pops free; rising onto her knee she
  // brings it up under her nose for a sniff, eyes shut and pleased, then lowers it, beaming.
  gather(p) {
    const down = keys(p, [[0, 0], [0.16, 1], [0.6, 1], [0.78, 0.55], [1, 0.2]]);
    const pick = bump(p, 0.2, 0.46) * Math.sin(p * 70);
    const tug = bump(p, 0.44, 0.56);
    const arm = keysW(p, [[0, 60], [0.16, 34], [0.44, 30], [0.52, 42, 'in'], [0.58, 54], [0.74, 112], [0.88, 112], [1, 88]]);
    const [front, back] = legs(p, [[0, ...STAND], [0.16, ...KNEEL], [0.62, ...KNEEL], [0.8, [3.4, 0, 6], [-3.2, -1, -20]], [1, [2, 0, 2], [-2, 0, -6]]]);
    return {
      tool: 'none', find: soft(seg(p, 0.5, 0.58)) * (1 - soft(seg(p, 0.97, 1)) * 0.2),
      weapon: 40, arm: arm + 2 * pick, tilt: 0.2 * down * (1 - seg(p, 0.6, 0.76)) - 0.04 * bump(p, 0.7, 0.92), lunge: 2.4 * down * (1 - seg(p, 0.6, 0.76)), lift: 1.2 * tug,
      hitAt: [0.5],
      face: p < 0.44 ? { look: 'down', mouth: 'o', brows: [[0.3, 0], [0.3, 0]] }
        : p < 0.6 ? { look: 'down', wide: true, mouth: 'o', brows: [[0.9, -0.3], [0.9, -0.3]] }
        : p < 0.88 ? { closed: [true, true], mouth: 'kiss', blush: 1.4, brows: [[0.7, -0.3], [0.7, -0.3]], extra: [p > 0.72 ? 'spark1' : 'spark0'] }
        : { ...PLEASED, extra: ['spark0'] },
      rig: (r) => {
        r.squat = q(3 * down);
        r.frontLeg = front;
        r.backLeg = back;
        r.backArm = pair(p, [[0, [0, 0]], [0.16, [5, 3]], [0.44, [5.5, 3]], [0.56, [3, 1]], [0.78, [1, -2]], [1, [0, -1]]]);
        r.backArm[0] = q(r.backArm[0] + 0.8 * pick);
        r.hx = q(0.8 * bump(p, 0.66, 0.9));
        r.hairLift = tug > 0.4 ? -1 : 0;
      },
    };
  },

  // Picking fruit (and taking honeycomb): a basket hanging from her free hand, a dip for the
  // spring, then up on tiptoe with the body leaning back to look up, the hand reaching up and out
  // to the bunch; a tug, a second harder tug that bounces her down off her toes as it comes free,
  // and she holds it up to admire before lowering it into the basket.
  pluck(p) {
    const toe = keys(p, [[0, 0], [0.1, -0.3], [0.3, 1], [0.6, 1], [0.66, 0.2], [0.72, 0], [1, 0]]);
    const tug1 = bump(p, 0.4, 0.5);
    const tug2 = bump(p, 0.54, 0.66);
    const arm = keysW(p, [[0, 60], [0.1, 55], [0.3, 126], [0.4, 128], [0.45, 118], [0.5, 128], [0.58, 128], [0.63, 104, 'in'], [0.74, 112], [0.86, 108], [1, 70]]);
    return {
      tool: 'none', backTool: 'basket', find: soft(seg(p, 0.6, 0.66)) * (1 - soft(seg(p, 0.9, 1))),
      weapon: 20, arm, lift: 2.6 * Math.max(0, toe) - 1.2 * tug2, tilt: -0.12 * Math.max(0, toe) + 0.06 * tug2 - 0.04 * bump(p, 0.7, 0.9), lunge: 1.5 * Math.max(0, toe),
      hitAt: [0.62],
      face: p < 0.3 ? { look: 'up', mouth: 'o', brows: [[0.6, 0], [0.6, 0]] }
        : p < 0.6 ? { look: 'up', lid: 0.15, mouth: tug1 > 0.3 || tug2 > 0.3 ? 'grit' : 'pursed', brows: [[0.2, 0.4], [0.2, 0.4]] }
        : p < 0.68 ? { wide: true, mouth: 'o', brows: [[1, -0.3], [1, -0.3]], extra: ['bang1'] }
        : p < 0.9 ? { ...BEAM, extra: ['spark1'] } : PLEASED,
      rig: (r) => {
        const t = Math.max(0, toe);
        // On tiptoe: the heels come up and the toes point down to stay on the ground.
        r.frontLeg = [q(0.8 + 0.4 * t), 0, Math.round(-36 * t / 2) * 2];
        r.backLeg = [q(-0.8 - 0.6 * t), 0, Math.round(-40 * t / 2) * 2];
        if (toe < 0) r.squat = 1;
        if (tug2 > 0.5) r.squat = 1;
        r.backArm = pair(p, [[0, [0, 0]], [0.3, [-1.5, 1]], [0.62, [-1.5, 1]], [0.66, [-2.5, 2]], [0.8, [-1, 0]], [1, [0, 0]]]);
        r.hairLift = t > 0.5 || tug2 > 0.4 ? -1 : 0;
        r.cape -= q(2 * t);
      },
    };
  },

  // Cutting fibre (cotton, silkmoss, lotus, cloud cotton): she sinks into a crouch, the free hand
  // gathers the tuft, two quick crescent sweeps of the sickle low through the stems (fluff flies),
  // and she sits back on her heels to watch the loose fluff drift, delighted.
  reap(p) {
    const low = keys(p, [[0, 0], [0.14, 1], [0.74, 1], [1, 0.3]]);
    const sweep = (a) => keysW(p, [[a - 0.14, 0], [a - 0.02, -1], [a + 0.04, 1, 'in'], [a + 0.14, 0.7]]);
    const s1 = p < 0.46 ? sweep(0.3) : 0;
    const s2 = p >= 0.46 ? sweep(0.6) : 0;
    const s = s1 + s2;
    const up = soft(seg(p, 0.76, 0.92)) * (1 - soft(seg(p, 0.94, 1)));
    return {
      tool: 'sickle',
      weapon: lerp(lerp(110, 60, Math.max(0, -s)), 175, Math.max(0, s)) - 40 * up, arm: lerp(lerp(45, 72, Math.max(0, -s)), 22, Math.max(0, s)) + 20 * up,
      tilt: 0.16 * low * (1 - up) + 0.05 * Math.max(0, s) - 0.08 * up, lunge: 2 * low + 2 * Math.max(0, s), lift: 1.5 * bump(p, 0.8, 0.96), trail: Math.abs(s) > 0.2 && s > -0.5,
      hitAt: [0.33, 0.63],
      face: p < 0.14 ? { look: 'down', mouth: 'tiny' }
        : p < 0.74 ? (s > 0.4 ? { look: 'down', lid: 0.2, mouth: 'open', brows: [[-0.1, 0.5], [-0.1, 0.5]] } : { look: 'down', ...FOCUS })
        : { look: 'up', mouth: 'D', blush: 1.3, brows: [[0.9, -0.3], [0.9, -0.3]], extra: ['spark1'] },
      rig: (r) => {
        r.squat = q(2.5 * low);
        [r.frontLeg, r.backLeg] = legs(p, [[0, ...STAND], [0.14, [3.6, 0, 6], [-3.4, -1, -20]], [0.74, [3.6, 0, 6], [-3.4, -1, -20]], [1, [1.6, 0, 2], [-1.6, 0, -4]]]);
        r.backArm = pair(p, [[0, [0, 0]], [0.14, [5, 2]], [0.74, [5, 2.5]], [0.86, [1, -2]], [1, [0, 0]]]);
        r.backArm[1] = q(r.backArm[1] - 1.5 * Math.max(0, s));
        r.hairLift = up > 0.5 ? -1 : 0;
      },
    };
  },

  // Mining: the pickaxe swung with its weight, twice. Each swing gathers up and back (the pick
  // over her shoulder, the arm behind the head, the body leaning back onto the back foot), hangs
  // a beat at the top, then drops through fast; it bites with a jolt (a shiver through the arm, the
  // knees give, a held beat), and she levers it free. The second is the bigger one, and she ends
  // with a pleased puff, blowing a strand of hair off her face.
  mine(p) {
    const swing = (u, big) => {
      const wind = soft(seg(u, 0, 0.42));
      const hang = seg(u, 0.42, 0.56);
      const strike = easeIn(seg(u, 0.56, 0.66));
      const free = soft(seg(u, 0.8, 1));
      return { wind, hang, strike, free, big };
    };
    const first = p < 0.48;
    const s = first ? swing(p / 0.48, 0) : swing((p - 0.48) / 0.52, 1);
    const k = s.big ? 1.2 : 1;
    const top = s.wind * (1 - s.strike);
    const bit = s.strike * (1 - s.free);
    const hitAt = [0.48 * 0.66, 0.48 + 0.52 * 0.66];
    const shiver = jolt(p, hitAt[0], 0.08, 4) + jolt(p, hitAt[1], 0.1, 5);
    const end = soft(seg(p, 0.9, 1));
    // From the low ready (head down by the rock) up over the shoulder, then down into the rock.
    // (The second swing starts where the first one ended.)
    const raised = lerp(110, -88 * k + 8 * s.hang, s.wind);
    const weapon = lerp(raised, 138, s.strike) - 28 * s.free * (first ? 1 : 0.5) + shiver - 20 * end;
    const arm = lerp(lerp(first ? 48 : 74, 222, s.wind), 64, s.strike) + 10 * s.free * (first ? 1 : 0.5) + shiver * 0.5 - 14 * end;
    return {
      tool: 'pickaxe', armBack: s.wind > 0.12 && s.strike < 0.45,
      weapon, arm, trail: s.strike > 0.1 && s.strike < 1,
      tilt: -0.16 * k * top + 0.2 * bit, lunge: -2 * top + 3 * bit, lift: 1.2 * top * k,
      hitAt,
      face: s.wind < 0.15 && !s.big && p < 0.05 ? FOCUS
        : top > 0.4 ? EFFORT
        : bit > 0.5 && s.free < 0.3 ? HEAVE
        : !first && p > 0.86 ? { mouth: 'kiss', lid: 0.2, brows: [[0.5, -0.2], [0.5, -0.2]], blush: 1.2, extra: [p > 0.94 ? 'spark0' : 'drop'] }
          : FOCUS,
      rig: (r) => {
        r.tx = q(-1.5 * top + 2 * bit);
        // Weight back onto the back foot for the wind-up, both knees giving at the blow.
        r.frontLeg = [q(lerp(lerp(2.4, 3.4, top), 3.8, bit)), q(-0.5 * top * s.big), Math.round(lerp(4, 8, bit) / 2) * 2];
        r.backLeg = [q(lerp(lerp(-2.4, -3.6, top), -3.4, bit)), 0, Math.round(lerp(-4, -8, top) / 2) * 2];
        r.squat = q(0.5 + 1.5 * bit * (s.big ? 1.3 : 1));
        r.backArm = [q(lerp(lerp(1, -2.5, top), 2.5, bit)), q(lerp(lerp(0, -2, top), 1, bit))];
        r.hairLift = bit > 0.4 && s.free < 0.5 ? -1 : 0;
        r.cape -= q(3 * top);
      },
    };
  },

  // Chopping wood: the axe drawn back low behind her, the body coiling away, then swung flat into
  // the trunk at chest height; it bites and sticks (a held beat, chips flying), she wrenches it
  // out leaning back, and swings again harder. She ends looking up the shaking tree, pleased.
  chop(p) {
    const swing = (u) => ({ wind: soft(seg(u, 0, 0.4)), hang: seg(u, 0.4, 0.5), strike: easeIn(seg(u, 0.5, 0.6)), pull: soft(seg(u, 0.74, 0.92)) });
    const first = p < 0.46;
    const s = first ? swing(p / 0.46) : swing((p - 0.46) / 0.54);
    const top = s.wind * (1 - s.strike);
    const bit = s.strike * (1 - s.pull);
    const hitAt = [0.46 * 0.6, 0.46 + 0.54 * 0.6];
    const shiver = jolt(p, hitAt[0], 0.07, 3) + jolt(p, hitAt[1], 0.09, 4);
    const end = soft(seg(p, 0.92, 1));
    const big = first ? 1 : 1.15;
    return {
      tool: 'axe', armBack: top > 0.3,
      weapon: lerp(lerp(first ? 60 : 50, -70 * big, s.wind), 94, s.strike) - 30 * s.pull * (first ? 1 : 0.4) + shiver - 20 * end, arm: lerp(lerp(55, -25 * big, s.wind), 96, s.strike) - 30 * s.pull * (first ? 1 : 0.6) + shiver * 0.4 - 15 * end,
      tilt: -0.14 * big * top + 0.14 * bit - 0.06 * s.pull * (1 - end) - 0.05 * end, lunge: -3 * top + 4 * bit - 2 * s.pull * (1 - end), lift: 0,
      trail: s.strike > 0.1 && s.strike < 1,
      hitAt,
      face: top > 0.4 ? EFFORT : bit > 0.4 ? HEAVE : !first && p > 0.86 ? { look: 'up', ...PLEASED, extra: ['spark0'] } : s.pull > 0.1 && s.pull < 0.9 ? { lid: 0.2, mouth: 'grit', brows: [[0.2, 0.5], [0.2, 0.5]] } : FOCUS,
      rig: (r) => {
        r.tx = q(-2 * top + 1.5 * bit);
        r.frontLeg = [q(lerp(2.6, 4, bit)), 0, Math.round(lerp(4, 8, bit) / 2) * 2];
        r.backLeg = [q(lerp(-2.6, -4, top)), 0, Math.round(lerp(-4, -14, top) / 2) * 2];
        r.squat = q(0.5 + bit + 0.5 * top);
        r.backArm = [q(lerp(lerp(0, 4, top), -2, bit)), q(lerp(lerp(0, -1, top), 1, bit))];
        r.hairLift = bit > 0.4 ? -1 : 0;
        r.cape -= q(3 * bit - 2 * top);
      },
    };
  },

  // ---- Fishing (world/fishing.js phases; render/life.js picks the move) ----

  // The cast (0.5 s): the rod swept back over her shoulder (behind the head), a beat, then whipped
  // forward and up as she steps into it; the line flies out (render/fishing.js).
  fishcast(p) {
    const back = soft(seg(p, 0, 0.34));
    const whip = easeIn(seg(p, 0.42, 0.56));
    const follow = soft(seg(p, 0.56, 1));
    return {
      tool: 'rod0', armBack: back > 0.2 && whip < 0.5,
      weapon: lerp(lerp(40, -70, back), 70, whip) - 22 * follow, arm: lerp(lerp(60, 200, back), 92, whip) - 32 * follow,
      tilt: -0.1 * back * (1 - whip) + 0.12 * whip * (1 - follow * 0.7), lunge: -2 * back * (1 - whip) + 3 * whip * (1 - follow * 0.5),
      trail: whip > 0 && whip < 1,
      face: whip < 0.5 ? FOCUS : { mouth: 'open', brows: [[0.5, 0], [0.5, 0]], look: 'down' },
      rig: (r) => {
        r.frontLeg = [q(lerp(lerp(1.6, 1, back), 3.6, whip)), 0, 4];
        r.backLeg = [q(lerp(-1.6, -3, back)), 0, Math.round(lerp(-4, -10, back * (1 - whip)) / 2) * 2];
        r.squat = q(0.5 * whip);
        r.backArm = [q(lerp(lerp(0, 2, back), -2.5, whip)), q(lerp(lerp(0, -1, back), -1, whip))];
        r.hairLift = whip > 0.4 && follow < 0.4 ? -1 : 0;
      },
    };
  },

  // Waiting for a bite (as long as the wait lasts, `dur`): she settles down on the bank, legs out
  // over the edge, rod in her lap pointing out at the float, and fills the time: swinging her feet,
  // humming with her eyes shut and swaying, a glance at the float, a big yawn and a stretch. The
  // rod tip nods with her breathing.
  fishwait(p, dur) {
    const t = p * dur;
    const sit = soft(seg(t, 0, 0.7));
    // The loop, after she sits: every 5.4 s a hum, a look at the float, then (from the second
    // time round) a yawn instead of the hum.
    const L = 5.4;
    const lt = Math.max(0, t - 0.7) % L;
    const round = Math.floor(Math.max(0, t - 0.7) / L);
    const hum = round % 2 === 0 ? bump(lt, 0.3, 2.6) : 0;
    const yawn = round % 2 === 1 ? bump(lt, 0.3, 2.2) : 0;
    const look = bump(lt, 3, 4.6);
    const kick = Math.sin(t * 4.2) * sit * (1 - yawn * 0.8);
    const breathe = Math.sin(t * 1.9);
    const sway = Math.sin(t * 3) * hum;
    return {
      tool: 'rod0',
      weapon: 48 + 2 * breathe + 6 * sway - 10 * yawn, arm: lerp(60, 36, sit) + 2 * breathe + 4 * sway - 8 * yawn,
      lift: -6.5 * sit, tilt: 0.05 * sway - 0.08 * yawn + 0.05 * look, lunge: 1 * look,
      face: sit < 0.5 ? { mouth: 'tiny', look: 'down' }
        : yawn > 0.25 ? { closed: [true, true], mouth: 'yawn', brows: [[0.4, -0.4], [0.4, -0.4]], extra: ['tear0'] }
        : hum > 0.15 ? { closed: [true, true], mouth: Math.floor(t * 3) % 2 ? 'kiss' : 'cat', blush: 1.2, extra: ['note'] }
        : look > 0.2 ? { look: 'down', glance: 1, mouth: 'o', brows: [[0.5, 0], [0.5, 0]] }
        : { lid: 0.2, mouth: 'cat', look: 'down' },
      rig: (r) => {
        // Sat on the bank: the hips right down, legs out in front over the edge, swinging.
        r.squat = q(4 * sit);
        r.frontLeg = [q(lerp(0.8, 9, sit)), q(lerp(0, -3 - 1.4 * kick, sit)), Math.round(lerp(0, 60 + 10 * kick, sit) / 2) * 2];
        r.backLeg = [q(lerp(-0.8, 7.6, sit)), q(lerp(0, -3 + 1.4 * kick, sit)), Math.round(lerp(0, 56 - 10 * kick, sit) / 2) * 2];
        // The free hand propped on the ground behind her, raised in the stretch.
        r.backArm = [q(lerp(0, -3, sit) + 1.5 * yawn), q(lerp(0, 1.5, sit) - 5 * yawn)];
        r.hx = q(0.6 * sway);
        r.hy = q(0.4 * breathe * sit);
        r.cape -= q(1.5 * sit);
      },
    };
  },

  // A nibble while she waits: she perks up, leaning in over the rod, eyes on the float.
  fishperk(p) {
    const on = soft(seg(p, 0, 0.25)) * (1 - soft(seg(p, 0.7, 1)));
    return {
      tool: 'rod0', weapon: 48 + 10 * on, arm: 36 + 8 * on, lift: -6.5, tilt: 0.1 * on, lunge: 1.5 * on,
      face: on > 0.3 ? { look: 'down', glance: 1, wide: true, mouth: 'o', brows: [[0.9, -0.2], [0.9, -0.2]], extra: ['q'] } : { lid: 0.2, mouth: 'cat', look: 'down' },
      rig: (r) => {
        r.squat = 4;
        r.frontLeg = [9, -3, 60];
        r.backLeg = [7.6, -3, 56];
        r.backArm = [-3, 1.5];
      },
    };
  },

  // The bite (as long as the fish holds on): a start, a "!" over her head, and she bounces up off
  // the bank onto her feet with both hands on the rod as it bends, digging her heels in.
  fishbite(p, dur) {
    const t = p * dur;
    const startle = bump(t, 0, 0.22);
    const up = soft(seg(t, 0.06, 0.34));
    const tug = Math.sin(t * 26) * up;
    return {
      tool: up > 0.3 ? 'rod2' : 'rod1',
      weapon: lerp(48, 26, up) + 4 * tug, arm: lerp(36, 58, up) + 3 * tug, lift: -6.5 * (1 - up) + 3 * startle, tilt: -0.1 * up + 0.03 * tug, lunge: -1.5 * up,
      face: { wide: true, mouth: t < 0.3 ? 'gasp' : 'grit', brows: [[1, -0.2], [1, -0.2]], extra: [`bang${Math.min(3, Math.floor(t * 14))}`, 'shock'] },
      rig: (r) => {
        r.squat = q(4 * (1 - up) + 1 * up);
        r.frontLeg = [q(lerp(9, 3.6, up)), q(lerp(-3, 0, up)), Math.round(lerp(60, 6, up) / 2) * 2];
        r.backLeg = [q(lerp(7.6, -3.6, up)), q(lerp(-3, 0, up)), Math.round(lerp(56, -10, up) / 2) * 2];
        // Both hands on the rod: the free hand comes forward to the grip.
        r.backArm = [q(lerp(-3, 5.5, up)), q(lerp(1.5, -1.5, up))];
        r.hairLift = startle > 0.3 ? -1 : 0;
      },
    };
  },

  // The catch (1.4 s): a tug of war, heels dug in and leaning right back as the rod bows and the
  // line saws (0-0.42); one big heave back that lifts the fish clear (0.42-0.55); then the rod
  // raised high with the fish swinging on the line in front of her (render/fishing.js), and a
  // proud little hop with a beaming face.
  fishcatch(p) {
    const war = 1 - soft(seg(p, 0.42, 0.5));
    const saw = Math.sin(p * 60) * war;
    const heave = soft(seg(p, 0.4, 0.55));
    const show = soft(seg(p, 0.55, 0.7));
    const hop = bump(p, 0.62, 0.84);
    const bend = war > 0.5 ? 'rod3' : heave > 0.9 ? 'rod0' : 'rod2';
    return {
      tool: bend,
      weapon: lerp(lerp(26, 8, heave), 34, show) + 4 * saw, arm: lerp(lerp(58, 92, heave), 86, show) + 3 * saw,
      tilt: lerp(-0.22 - 0.03 * saw, -0.12, heave) * (1 - show) - 0.04 * show, lunge: lerp(-2.5, -1, heave) * (1 - show), lift: 4 * hop,
      face: war > 0.5 ? { ...EFFORT, extra: [`sweat${Math.floor(p * 10) % 4}`] } : show < 0.5 ? HEAVE : { ...BEAM, extra: [hop > 0.3 ? 'spark1' : 'spark0'] },
      rig: (r) => {
        if (hop > 0.3) {
          r.air = true;
          r.frontLeg = [2.4, -4, 10];
          r.backLeg = [-1.6, -2.6, -10];
        } else {
          r.frontLeg = [q(4 - 0.4 * saw), 0, Math.round(lerp(10, 2, show) / 2) * 2];
          r.backLeg = [q(-3.6 + 0.4 * saw), 0, Math.round(lerp(-8, -2, show) / 2) * 2];
          r.squat = q(lerp(1.5, 0.5, show));
        }
        r.backArm = show > 0.5 ? [q(-2 - 1.5 * hop), q(-2 - 2 * hop)] : [q(5.5 + 0.4 * saw), q(-1.5)];
        r.hairLift = heave > 0.3 && show < 0.6 ? -1 : hop > 0.3 ? -1 : 0;
        r.cape -= q(3 * heave * (1 - show));
      },
    };
  },

  // It got away (0.9 s): the line goes slack, the rod droops, and so does she: shoulders down, a
  // big sweat drop and a pout, then a sigh.
  fishmiss(p) {
    const slump = soft(seg(p, 0.08, 0.4));
    return {
      tool: 'rod0', weapon: lerp(34, 95, slump), arm: lerp(80, 40, slump) - 20 * (1 - slump), tilt: 0.12 * slump, lift: -0.5 * slump,
      face: p < 0.15 ? { wide: true, mouth: 'o', brows: [[1, -0.2], [1, -0.2]] } : { lid: 0.35, mouth: 'frown', brows: [[0.6, -0.7], [0.6, -0.7]], extra: ['gloom', 'drop'] },
      rig: (r) => {
        r.squat = q(slump);
        r.frontLeg = [1.2, 0, 2];
        r.backLeg = [-1.2, 0, -2];
        r.backArm = [q(0.5 * slump), q(1.5 * slump)];
        r.hy = q(0.8 * slump);
      },
    };
  },

  // ---- At the stove and the bench ----

  // Cooking (render/life.js plays it when a dish is cooked): she leans over the pot humming and
  // stirs two slow rounds with the ladle, scoops and tosses the stew up in a flick (watching it go
  // up and plop back), blows on a ladleful and tastes it, then shuts her eyes, beaming.
  cook(p) {
    const lean = keys(p, [[0, 0], [0.08, 1], [0.5, 1], [0.6, 0.4], [0.7, 0.2], [0.86, 0], [1, 0]]);
    const stir = seg(p, 0.08, 0.5);
    const a = stir * Math.PI * 4;
    const st = (stir > 0 && stir < 1 ? 1 : 0) * soft(seg(p, 0.08, 0.14)) * (1 - soft(seg(p, 0.46, 0.5)));
    const toss = bump(p, 0.5, 0.64);
    const flick = keysW(p, [[0.5, 0], [0.55, -1], [0.58, 1, 'in'], [0.66, 0]]);
    const taste = soft(seg(p, 0.66, 0.74)) * (1 - soft(seg(p, 0.92, 1)));
    const yum = seg(p, 0.82, 1) > 0 ? 1 : 0;
    return {
      tool: 'ladle',
      weapon: lerp(lerp(168 + 14 * Math.cos(a) * st, 120 - 70 * flick, toss > 0 ? 1 : 0), 40, taste), arm: lerp(lerp(68 + 8 * Math.sin(a) * st, 74 + 22 * flick, toss > 0 ? 1 : 0), 104, taste),
      tilt: 0.14 * lean + 0.02 * Math.sin(a) * st - 0.06 * taste * (1 - yum) - 0.03 * yum, lunge: 2 * lean + 0.8 * Math.cos(a) * st, lift: 1.5 * bump(p, 0.84, 0.97) + 0.8 * toss,
      hitAt: [0.58],
      face: p < 0.08 ? { mouth: 'cat', look: 'down' }
        : p < 0.5 ? { closed: [true, true], mouth: Math.floor(p * 18) % 2 ? 'kiss' : 'cat', blush: 1.2, extra: ['note'] }
        : p < 0.66 ? { look: 'up', wide: flick > 0.5, mouth: 'o', brows: [[0.8, -0.2], [0.8, -0.2]] }
        : p < 0.76 ? { look: 'down', mouth: 'kiss', brows: [[0.4, 0], [0.4, 0]], extra: ['steam0'] }
        : p < 0.84 ? { closed: [true, true], mouth: 'tiny', blush: 1.3 }
        : { closed: [true, true], mouth: 'D', blush: 1.7, brows: [[0.8, -0.3], [0.8, -0.3]], extra: [`hearts${Math.floor(p * 40) % 4}`] },
      rig: (r) => {
        r.squat = q(0.5 * lean);
        r.frontLeg = [q(1.6 + 0.6 * lean), 0, 2];
        r.backLeg = [q(-1.6 - 0.4 * lean), 0, -4];
        // The free hand steadies the pot's handle, then comes up under the ladle as she tastes.
        r.backArm = pair(p, [[0, [0, 0]], [0.08, [4.5, 0]], [0.5, [4.5, 0]], [0.62, [2, -1]], [0.74, [4, -4]], [0.9, [3, -4]], [1, [0, -1]]]);
        r.hx = q(0.8 * Math.sin(a) * st);
        r.hairLift = toss > 0.5 ? -1 : 0;
      },
    };
  },

  // Crafting at the bench: three ringing taps of the hammer (sparks off the piece on each), the
  // hammer set down for the file and three long strokes, then the piece held up to the light at
  // arm's length, turned to catch it, eyes shining.
  craft(p) {
    const tap = (a) => keysW(p, [[a - 0.08, 0], [a - 0.02, 1], [a, -0.2, 'in'], [a + 0.04, 0]]);
    const taps = [0.13, 0.25, 0.37];
    const ham = p < 0.42 ? taps.reduce((n, a) => n + Math.max(0, tap(a)), 0) : 0;
    const hit = p < 0.42 ? taps.reduce((n, a) => n + bump(p, a - 0.005, a + 0.04), 0) : 0;
    const fileT = seg(p, 0.46, 0.72);
    const fl = fileT > 0 && fileT < 1 ? Math.sin(fileT * Math.PI * 6) : 0;
    const hold = soft(seg(p, 0.74, 0.84));
    const turn = Math.sin(seg(p, 0.84, 1) * Math.PI * 2) * hold;
    const lean = p < 0.72 ? keys(p, [[0, 0], [0.06, 1], [0.72, 1]]) : 1 - hold;
    const tool = p < 0.44 ? 'hammer' : p < 0.73 ? 'file' : 'none';
    return {
      tool, find: hold,
      weapon: p < 0.44 ? lerp(80, 0, ham) + 40 * hit : p < 0.73 ? 92 + 4 * fl : 30 + 10 * turn,
      arm: p < 0.44 ? lerp(62, 92, ham) - 6 * hit : p < 0.73 ? 72 + 10 * fl : lerp(72, 118, hold) + 4 * turn,
      tilt: 0.14 * lean - 0.08 * hold + 0.03 * hit, lunge: 1.5 * lean + 1.2 * fl * (p > 0.46 && p < 0.72 ? 1 : 0), lift: 0.6 * bump(p, 0.86, 1),
      trail: false, hitAt: taps,
      face: p < 0.06 ? { mouth: 'tiny', look: 'down' }
        : p < 0.44 ? (hit > 0.3 ? { closed: [true, true], mouth: 'e', brows: [[0.2, 0.4], [0.2, 0.4]] } : { look: 'down', ...FOCUS })
        : p < 0.74 ? { look: 'down', lid: 0.3, mouth: Math.floor(p * 16) % 2 ? 'pursed' : 'tiny', brows: [[0, 0.4], [0, 0.4]] }
        : { look: 'up', glance: 1, shine: true, mouth: 'D', blush: 1.4, brows: [[0.9, -0.3], [0.9, -0.3]], extra: [turn > 0 ? 'spark1' : 'spark0'] },
      rig: (r) => {
        r.squat = q(0.5 * lean);
        r.frontLeg = [q(1.6 + 0.6 * lean), 0, 2];
        r.backLeg = [q(-1.6 - 0.4 * lean), 0, -4];
        // The free hand holds the piece down on the bench, then comes up to steady it in the light.
        r.backArm = p < 0.73 ? [q(4.5 + 0.3 * fl), q(0.5)] : [q(lerp(4.5, 2.5, hold)), q(lerp(0.5, -5, hold))];
        r.hairLift = hit > 0.5 ? -1 : 0;
      },
    };
  },
};

// The shortest each can be and still read (render/moves.js MOVE_MIN).
export const LIFE_MIN = { gather: 0.9, pluck: 0.9, reap: 1, mine: 1.2, chop: 1.2, fishcast: 0.45, fishwait: 1, fishperk: 0.5, fishbite: 0.5, fishcatch: 1.2, fishmiss: 0.8, cook: 2, craft: 2.2 };
