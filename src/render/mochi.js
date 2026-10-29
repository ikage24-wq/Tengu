// Draws the Mochi, the pets (docs: the pet system), on a skeleton of their own: their look is the
// hero's parts (hair, face, ears, tails) in outfits made for them (jobgear/pets.js), smaller than
// Snow wolf, and nothing of the player's rig moves them. Each of the five forms has a personality
// of its own, and with it its own idle bits and its own cheer:
//   baby    cute and clingy: sways and bounces, plops down to kick her feet, rubs a sleepy eye,
//           spins round after her own tail; cheers hopping and clapping her paws
//   swift   a peppy cheerleader: jogs on the spot, stretches, flips her ponytail; cheers with a
//           pom-pom routine (shake, V, high kick, jump)
//   strong  proud and loud: flexes, shadowboxes, folds his arms and nods; cheers with a jumping
//           fist pump and a roar
//   spirit  shy: hides her face in her sleeves and peeks out, fiddles her fingers, looks away
//           blushing; cheers with a tiny clap behind her sleeves, swaying, hearts
//   sky     dreamy: floats up on flapping wings, twirls slowly, gazes at the clouds humming; cheers
//           fluttering up and twirling in a shower of feathers
// Every part of a pose is carried to the next on a spring (`follow`), so nothing ever jumps; props
// (the pom-poms, the wings, the feathers) are drawn live from where the hands and back really are.
// The figure is never squashed or stretched: only posed, and mirrored when it turns.

import { drawPosed, posedPoint } from './hero.js';

// The five forms' looks (outfits in jobgear/pets.js).
const SKIN = '#fff0e6';
export const MOCHI_LOOKS = {
  baby: { hairStyle: 'fluffybob', hairColor: '#ffc8da', hairTip: '#ff9ec0', eyeStyle: 'big', eyeColor: '#c06a92', browStyle: 'stubby', earStyle: 'wolf', tail: 'wolf', face: 'smile', mouth: 'cat', outfit: 'petbaby', skinTone: SKIN },
  swift: { hairStyle: 'ponytail', hairColor: '#7fd39a', hairTip: '#c8f7d6', eyeStyle: 'sparkle', eyeColor: '#2f8a4f', browStyle: 'stubby', earStyle: 'bunny', face: 'grin', mouth: 'grin', outfit: 'petswift', skinTone: SKIN },
  strong: { hairStyle: 'spiky', hairColor: '#ff9a4f', hairTip: '#ffd08a', eyeStyle: 'round', eyeColor: '#b8561a', browStyle: 'stubby', earStyle: 'round', face: 'determined', mouth: 'grin', outfit: 'petstrong', skinTone: '#ffe2cc' },
  spirit: { hairStyle: 'hime', hairColor: '#b9a2f2', hairTip: '#e8dcff', eyeStyle: 'droopy', eyeColor: '#7a52cc', browStyle: 'stubby', earStyle: 'fox', earTip: '#e8dcff', tail: 'fox', tailTip: '#e8dcff', face: 'shy', mouth: 'cat', outfit: 'petspirit', skinTone: SKIN },
  sky: { hairStyle: 'cloud', hairColor: '#9fd0ff', hairTip: '#ffffff', eyeStyle: 'star', eyeColor: '#3f78c8', browStyle: 'stubby', earStyle: 'elf', face: 'excited', mouth: 'tiny', outfit: 'petsky', skinTone: SKIN },
};
export const MOCHI_FORMS = Object.keys(MOCHI_LOOKS);
// A size down from Snow wolf (0.72): the whole figure scaled, never squashed.
export const MOCHI_SCALE = 0.58;

// ---------- The skeleton ----------
// A pose, in the Mochi's own terms (facing right; body px of the hero's rig):
//   tx, by, hx, hy, tilt   the upper body's lean and bob, the head's offset and tilt (degrees)
//   hand, free             where the back and front hands reach, from where they'd rest
//   legF, legB             each foot's [ahead, up (negative), tilt]; squat, lift (a hop, px)
//   ears, tail             ears and tail (degrees); turned: facing the other way (a spin)
//   mouth, eyes, brows, extras, blush   the face
//   poms, wing, flap       the pom-poms (0 away - 1 in hand), the wings' spread and flap angle
//   feathers               a shower of feathers (0-1 through it) for Sky's cheer
const REST = {
  tx: 0, by: 0, hx: 0, hy: 1, tilt: -2, hand: [0, 0], free: [0, 0], legF: [0.8, 0, 0], legB: [-0.8, 0, 0], squat: 0, lift: 0,
  ears: [4, 4], tail: 6, turned: false, mouth: null, eyes: null, brows: [[0.2, 0], [0.2, 0]], extras: [], blush: 1.2, poms: 0, wing: 0.3, flap: 0, feathers: -1,
};
const pose = (o) => ({ ...REST, ...o });

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const lerp = (a, b, k) => a + (b - a) * k;
const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const TAU = Math.PI * 2;
// A bit's in and out: 0 at its ends, 1 through the middle.
const env = (u, a = 0.14, b = 0.86) => soft(seg(u, 0, a)) * (1 - soft(seg(u, b, 1)));
// Breathing, under everything.
const breathe = (t) => ({ by: 0.35 * Math.sin(t * 2.4), hy: 1 + 0.25 * Math.sin(t * 2.4 - 0.6) });

// ---------- Each form: its idle (between bits), its bits, and its cheer ----------
// A bit is [seconds, (u 0-1, t seconds) => pose].
const FORMS = {
  baby: {
    idle: (t) => pose({ ...breathe(t), tilt: -2 + 3 * Math.sin(t * 1.6), tail: 10 * Math.sin(t * 4), mouth: 'cat' }),
    bits: {
      // A happy sway side to side with little bounces, ears flicking.
      sway: [3, (u, t) => { const k = env(u); const s = Math.sin(u * TAU * 3); return pose({ tx: 0.8 * s * k, tilt: -2 + 7 * s * k, lift: 1.5 * Math.abs(Math.sin(u * TAU * 3)) * k, tail: 22 * Math.sin(t * 9) * k, ears: [4 - 8 * k, 4 - 8 * k], eyes: k > 0.5 ? 'happy' : null, mouth: 'open', extras: k > 0.6 ? [`spark${Math.floor(t * 3) % 2}`] : [] }); }],
      // Plops down on her bottom and kicks her feet.
      plop: [4, (u, t) => { const k = env(u, 0.12, 0.88); const kick = Math.sin(t * 10) * k; return pose({ squat: Math.round(3 * k), by: 1.4 * k, legF: [lerp(0.8, 3.2, k), -2.4 * k + Math.max(0, kick) * -1, 50 * k + 18 * kick], legB: [lerp(-0.8, 1.6, k), -2 * k + Math.max(0, -kick) * -1, 40 * k - 18 * kick], hand: [1 * k, 1.5 * k], free: [1.6 * k, 1.5 * k], tail: 14 * Math.sin(t * 6) * k, mouth: k > 0.4 ? 'open' : 'cat', eyes: k > 0.5 ? 'happy' : null }); }],
      // A sleepy yawn, rubbing one eye with a paw.
      rub: [3.2, (u, t) => { const k = env(u, 0.2, 0.8); const rub = Math.sin(t * 14) * 0.6 * k; return pose({ free: [2.6 * k + rub, -8.6 * k], hy: 1 + 0.8 * k, tilt: -2 + 4 * k, eyes: k > 0.4 ? 'half' : null, mouth: k > 0.3 && u < 0.6 ? 'yawn' : 'cat', ears: [4 + 18 * k, 4 + 20 * k], extras: u > 0.55 && u < 0.85 ? ['tear0'] : [] }); }],
      // Spins round after her own tail, twice, and gets dizzy.
      chase: [3, (u, t) => { const spin = seg(u, 0.1, 0.7); const turned = Math.floor(spin * 4) % 2 === 1; const dizzy = seg(u, 0.7, 1); return pose({ turned, tilt: turned ? 8 : -8, lift: 2 * bump(spin, 0, 1), tail: 30 * Math.sin(t * 16), hand: [-1, -2], free: [-1, -2], eyes: dizzy > 0 && dizzy < 0.9 ? 'happy' : null, mouth: dizzy > 0 ? 'wavy' : 'open', extras: dizzy > 0 && dizzy < 0.9 ? [`orbit${Math.floor(t * 8) % 8}`] : [] }); }],
    },
    // Hops and claps her paws over her head, eyes squeezed happy.
    cheer: [2, (u, t) => { const hop = Math.abs(Math.sin(u * TAU * 2)) * env(u, 0.08, 0.92); const clap = Math.abs(Math.sin(t * 12)); return pose({ lift: 5 * hop, legF: [1.6, -2 * hop, 20 * hop], legB: [-1.2, -1.6 * hop, -20 * hop], free: [4.6 + 1.8 * clap, -4], hand: [5.2 - 1.8 * clap, -4], tilt: -4, eyes: 'happy', mouth: 'open', tail: 30 * Math.sin(t * 14), ears: [-10, -10], blush: 1.6, extras: [`spark${Math.floor(t * 6) % 2}`] }); }],
  },
  swift: {
    idle: (t) => pose({ ...breathe(t), legF: [1.2, 0, 2], legB: [-1.2, 0, -2], tilt: -3, mouth: 'grin' }),
    bits: {
      // Jogs on the spot, knees up, arms pumping.
      jog: [3, (u, t) => { const k = env(u); const s = Math.sin(t * 12); return pose({ lift: 1.2 * Math.abs(s) * k, legF: [1, -2.4 * Math.max(0, s) * k, 30 * Math.max(0, s) * k], legB: [-1, -2.4 * Math.max(0, -s) * k, -30 * Math.max(0, -s) * k], hand: [2 * s * k, -2.4 * k], free: [-2 * s * k, -2.4 * k], tilt: 4 * k, mouth: 'grin' }); }],
      // A stretch: one leg back, both arms out wide.
      stretch: [3.2, (u) => { const k = env(u, 0.2, 0.8); return pose({ hand: [-7 * k, -6 * k], free: [7 * k, -6 * k], legB: [-0.8 - 3 * k, -2 * k, -40 * k], tilt: -6 * k, hy: 1 - 0.6 * k, eyes: k > 0.5 ? 'happy' : null, mouth: k > 0.5 ? 'o' : 'grin' }); }],
      // Flips her ponytail with a hand and a toss of the head, then a wink.
      flip: [2.4, (u) => { const k = env(u, 0.15, 0.85); const toss = bump(u, 0.25, 0.6); return pose({ free: [2 * k, -9 * k], hx: -0.8 * toss, tilt: -2 - 12 * toss, hy: 1 - 0.6 * toss, eyes: u > 0.6 && u < 0.85 ? 'happy' : null, mouth: u > 0.6 ? 'tongue' : 'grin', extras: u > 0.62 && u < 0.85 ? ['spark1'] : [] }); }],
    },
    // A pom-pom routine: pom-poms out, a shake at the hips, a V up, a high kick, a jump.
    cheer: [2.6, (u, t) => {
      const poms = soft(seg(u, 0, 0.1)) * (1 - soft(seg(u, 0.9, 1)));
      const shake = u < 0.3 ? Math.sin(t * 22) : 0;
      const v = soft(seg(u, 0.28, 0.36)) * (1 - soft(seg(u, 0.5, 0.56)));
      const kick = bump(u, 0.52, 0.72);
      const jump = bump(u, 0.72, 0.92);
      return pose({
        poms,
        hand: v > 0 ? lerp2([1.6 + shake, 1], [-7, -7], v) : jump > 0 ? [-6, -6 * jump] : [1.6 + shake, 1 - 2 * kick],
        free: v > 0 ? lerp2([1.6 - shake, 1], [7, -7], v) : jump > 0 ? [6, -6 * jump] : [1.6 - shake, 1 - 2 * kick],
        legF: [1.2 + 2 * kick, -3 * kick - 2 * jump, 80 * kick + 20 * jump], legB: [-1.2, -2 * jump, -20 * jump], lift: 6 * jump, tx: 0.6 * shake * (u < 0.3 ? 1 : 0),
        tilt: -3 - 6 * kick, mouth: 'open', eyes: v > 0.5 || jump > 0.4 ? 'happy' : null, extras: v > 0.5 || jump > 0.5 ? [`spark${Math.floor(t * 6) % 2}`] : [], blush: 1.5,
      });
    }],
  },
  strong: {
    idle: (t) => pose({ ...breathe(t), legF: [1.6, 0, 4], legB: [-1.6, 0, -4], hand: [0.6, -0.6], free: [0.6, -0.6], tilt: -4, mouth: 'grin' }),
    bits: {
      // Flexes one arm, proud, a sparkle off the bicep.
      flex: [2.8, (u) => { const k = env(u, 0.2, 0.8); return pose({ free: [3.6 * k, -7.6 * k], hand: [0.6, -0.6], tilt: -4 - 4 * k, hy: 1 - 0.5 * k, legF: [1.8, 0, 6], legB: [-1.8, 0, -6], mouth: k > 0.4 ? 'grin' : 'smirk', extras: k > 0.6 ? ['spark0'] : [] }); }],
      // Shadowboxing: quick jabs, one hand then the other, bouncing on his feet.
      box: [3, (u, t) => { const k = env(u, 0.1, 0.9); const j = Math.max(0, Math.sin(t * 14)); const which = Math.floor(t * 14 / Math.PI) % 2; return pose({ free: [which ? 0.6 + 5 * j * k : 1.6, -4 * k], hand: [which ? 2.6 : 2.6 + 5 * j * k, -4 * k], lift: 1 * Math.abs(Math.sin(t * 7)) * k, tilt: 4 * k, legF: [2.2, 0, 6], legB: [-2.2, 0, -6], mouth: 'grit', brows: k > 0.5 ? [[-0.3, 0.6], [-0.3, 0.6]] : null }); }],
      // Folds his arms and nods to himself, very pleased.
      fold: [3.4, (u, t) => { const k = env(u, 0.18, 0.82); return pose({ free: [2.6 * k, -4.6 * k], hand: [3 * k, -4.4 * k], hy: 1 + 0.6 * Math.max(0, Math.sin(t * 5)) * k, tilt: -4 + 3 * Math.sin(t * 5) * k, eyes: k > 0.5 ? 'happy' : null, mouth: 'smirk' }); }],
    },
    // A big jumping fist pump and a roar.
    cheer: [2, (u, t) => {
      const wind = soft(seg(u, 0, 0.18)) * (1 - soft(seg(u, 0.18, 0.28)));
      const pump = soft(seg(u, 0.22, 0.32)) * (1 - soft(seg(u, 0.85, 1)));
      const jump = bump(u, 0.24, 0.6);
      return pose({ squat: Math.round(2 * wind), free: lerp2([1.6, 1], [4.6, -9.6], pump), hand: lerp2([0.6, -0.6], [2.4, -3.6], pump), lift: 9 * jump, legF: [1.6, -3 * jump, 30 * jump], legB: [-1.6, -2 * jump, -30 * jump], tilt: -4 - 8 * pump, mouth: pump > 0.3 ? 'yell' : 'grit', eyes: pump > 0.3 ? 'happy' : null, extras: pump > 0.4 ? ['bang1', `spark${Math.floor(t * 6) % 2}`] : [], blush: 1.5 });
    }],
  },
  spirit: {
    idle: (t) => pose({ ...breathe(t), hand: [2, -2.6], free: [2.4, -2.6], tilt: 3 + 2 * Math.sin(t * 1.2), hx: -0.4, eyes: 'half', mouth: 'cat', blush: 1.5, tail: 8 * Math.sin(t * 1.5) }),
    bits: {
      // Hides her face in her sleeves, then peeks out over them, and hides again.
      peek: [4, (u) => { const k = env(u, 0.12, 0.88); const peek = bump(u, 0.35, 0.65); return pose({ free: [2.8 * k, (-9 + 2.6 * peek) * k], hand: [1.8 * k, (-9 + 2.6 * peek) * k], hy: 1 + 0.8 * k - 0.6 * peek, tilt: 4 * k, eyes: peek > 0.4 ? null : 'blink', mouth: 'tiny', blush: 1.8, extras: peek > 0.5 ? ['sweat0'] : [] }); }],
      // Fiddles her fingers together, looking down, swaying a little.
      fiddle: [3.4, (u, t) => { const k = env(u); const f = Math.sin(t * 9) * 0.5 * k; return pose({ free: [3 + f, -3.4 * k], hand: [3.4 - f, -3.2 * k], hy: 1 + 1 * k, hx: 0.4 * k, tilt: 5 * k + 2 * Math.sin(t * 2), eyes: 'half', mouth: 'pout', blush: 1.7 }); }],
      // Looks away blushing, one sleeve to her cheek.
      away: [3, (u) => { const k = env(u, 0.2, 0.8); return pose({ turned: k > 0.5, free: [2.4 * k, -8 * k], hand: [2, -2.6], tilt: 6 * k, eyes: 'half', mouth: 'wavy', blush: 2, extras: k > 0.6 ? ['dots2'] : [] }); }],
    },
    // A tiny clap behind her sleeves, a happy sway, little hearts.
    cheer: [2.2, (u, t) => { const k = env(u, 0.1, 0.9); const clap = Math.abs(Math.sin(t * 10)); return pose({ free: [3 + clap * 1.4, -6 * k], hand: [3.4 - clap * 1.4, -6 * k], tilt: 6 * Math.sin(u * TAU * 2) * k, lift: 1.5 * bump(u, 0.4, 0.6), hy: 1 + 0.4 * k, eyes: 'happy', mouth: 'cat', blush: 2, tail: 20 * Math.sin(t * 8) * k, extras: k > 0.3 ? ['hearts'] : [] }); }],
  },
  sky: {
    idle: (t) => pose({ ...breathe(t), lift: 1 + Math.sin(t * 1.8), wing: 0.4, flap: 0.15 * Math.sin(t * 3), tilt: -3, mouth: 'tiny' }),
    bits: {
      // Floats up on quick wingbeats, toes pointed, and drifts back down.
      float: [3.6, (u, t) => { const k = env(u, 0.2, 0.8); return pose({ lift: 1 + 9 * k + Math.sin(t * 1.8), wing: 0.4 + 0.6 * k, flap: (0.15 + 0.5 * k) * Math.sin(t * (3 + 11 * k)), legF: [1.2, -1.6 * k, 40 * k], legB: [0, -1.2 * k, 30 * k], hand: [-2 * k, -2 * k], free: [-2 * k, -2 * k], eyes: k > 0.5 ? 'happy' : null, mouth: 'open' }); }],
      // A slow twirl on her toes, arms out, wings open.
      twirl: [3.2, (u, t) => { const spin = soft(seg(u, 0.1, 0.9)); const turned = Math.floor(spin * 4) % 2 === 1; const k = env(u); return pose({ turned, hand: [-6 * k, -5 * k], free: [6 * k, -5 * k], wing: 0.4 + 0.4 * k, flap: 0.2 * Math.sin(t * 6), lift: 1 + 2 * k, tilt: turned ? 4 : -4, eyes: 'happy', mouth: 'open', extras: k > 0.5 ? ['note'] : [] }); }],
      // Gazes up at the clouds, a hand shading her eyes, humming.
      gaze: [3.6, (u, t) => { const k = env(u, 0.2, 0.8); return pose({ free: [2.6 * k, -9.6 * k], hy: 1 - 0.8 * k, tilt: -8 * k, lift: 1 + Math.sin(t * 1.8), wing: 0.4, eyes: k > 0.5 ? 'half' : null, mouth: 'o', extras: k > 0.4 && Math.floor(t * 2) % 2 ? ['note'] : [] }); }],
    },
    // Flutters up, twirls once, and comes down in a shower of feathers.
    cheer: [2.4, (u, t) => {
      const up = bump(u, 0.05, 0.95);
      const spin = soft(seg(u, 0.3, 0.7));
      return pose({ lift: 1 + 12 * up, wing: 1, flap: 0.7 * Math.sin(t * 16), turned: Math.floor(spin * 2) % 2 === 1, hand: [-6, -6], free: [6, -6], legF: [1.2, -2 * up, 40 * up], legB: [0, -1.6 * up, 30 * up], eyes: 'happy', mouth: 'open', blush: 1.5, feathers: seg(u, 0.35, 1), extras: [`spark${Math.floor(t * 6) % 2}`] });
    }],
  },
};
export const MOCHI_CHEER = Object.fromEntries(Object.entries(FORMS).map(([k, f]) => [k, f.cheer[0]]));

// ---------- Following: every number of the pose is carried to the next on a spring ----------
const FOLLOW = { k: 300, damp: 0.78 };
function follow(st, target, dt) {
  if (!st.P) {
    st.P = structuredClone(target);
    st.V = {};
    return st.P;
  }
  const c = 2 * Math.sqrt(FOLLOW.k) * FOLLOW.damp;
  const P = { ...target };
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const step = (x, v, to) => {
    for (let i = 0; i < n; i++) {
      v += ((to - x) * FOLLOW.k - v * c) * h;
      x += v * h;
    }
    return [x, v];
  };
  for (const key of Object.keys(target)) {
    const to = target[key];
    const was = st.P[key];
    if (typeof to === 'number' && typeof was === 'number' && key !== 'feathers') {
      [P[key], st.V[key]] = step(was, st.V[key] ?? 0, to);
    } else if (Array.isArray(to) && Array.isArray(was) && to.every((e) => typeof e === 'number') && was.length === to.length) {
      const vs = (st.V[key] ??= to.map(() => 0));
      P[key] = to.map((t, i) => {
        const [x, v] = step(was[i], vs[i], t);
        vs[i] = v;
        return x;
      });
    }
  }
  st.P = P;
  return P;
}

// ---------- Props ----------
// A pom-pom: a burst of streamers in the form's colours.
function pomPom(c, x, y, k, t, seed) {
  if (k <= 0.02) return;
  const r = 3.4 * k;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + Math.sin(t * 9 + seed + i) * 0.15;
    c.strokeStyle = i % 2 ? '#ff8fb0' : '#ffffff';
    c.lineWidth = 1.2 * k;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    c.stroke();
  }
  c.fillStyle = '#ff6f9a';
  c.beginPath();
  c.arc(x, y, 1 * k, 0, TAU);
  c.fill();
}
// One wing from the shoulder: a single feathered shape, its trailing edge scalloped into three
// feathers, swept back and up and raised by `flap` (radians), opening wider with `spread`.
function wingShape(c, x, y, dir, spread, flap, near) {
  const L = 10 + 4 * spread;
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.rotate(-(0.25 + 0.35 * spread) - flap);
  c.fillStyle = near ? '#ffffff' : '#dceafc';
  c.strokeStyle = '#7fa8e0';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(L * 0.45, -L * 0.42, L, -L * 0.3);
  c.lineTo(L * 0.86, L * 0.06);
  c.lineTo(L * 0.66, L * 0.02);
  c.lineTo(L * 0.56, L * 0.26);
  c.lineTo(L * 0.36, L * 0.16);
  c.lineTo(L * 0.24, L * 0.36);
  c.closePath();
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(L * 0.2, -L * 0.04);
  c.lineTo(L * 0.66, -L * 0.14);
  c.moveTo(L * 0.16, L * 0.12);
  c.lineTo(L * 0.46, L * 0.08);
  c.stroke();
  c.restore();
}

// ---------- Drawing ----------
// Each Mochi's state between frames: the pose being carried along, its idle bit, its cheer.
const STATE = new WeakMap();

// Draws a Mochi `m` ({ form, dir, cheerAt?, seed? }) with its feet at (x, y) at `time` seconds. A
// cheer plays when `m.cheerAt` is set (time it started); otherwise it does its idle bits, a
// different one each time, with a breather between.
export function drawMochi(ctx, m, x, y, time) {
  const F = FORMS[m.form] ?? FORMS.baby;
  const look0 = MOCHI_LOOKS[m.form] ?? MOCHI_LOOKS.baby;
  let st = STATE.get(m);
  if (!st) STATE.set(m, (st = { last: time, bit: null, nextBit: time + 2 + (m.seed ?? 0) % 3 }));
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  let p;
  const cheer = m.cheerAt != null && time - m.cheerAt < F.cheer[0] ? (time - m.cheerAt) / F.cheer[0] : null;
  if (cheer != null) {
    p = F.cheer[1](cheer, time);
    st.bit = null;
    st.nextBit = time + 2;
  } else {
    if (st.bit && time - st.bit.t0 >= F.bits[st.bit.kind][0]) {
      st.bit = null;
      st.nextBit = time + 1.6 + Math.random() * 2.4;
    }
    if (!st.bit && time >= st.nextBit && !m.moving) {
      const pick = Object.keys(F.bits).filter((k) => k !== st.lastBit);
      const kind = pick[Math.floor(Math.random() * pick.length)];
      st.bit = { kind, t0: time };
      st.lastBit = kind;
    }
    p = st.bit ? F.bits[st.bit.kind][1]((time - st.bit.t0) / F.bits[st.bit.kind][0], time) : F.idle(time);
  }
  const P = follow(st, p, dt);
  const dir = m.dir || 1;
  const facing = P.turned ? -dir : dir;
  const q = (v) => Math.round(v * 4) / 4;
  const blink = (time * 0.33 + (m.seed ?? 0) * 0.17) % 1;
  const rig = {
    tx: q(P.tx), by: q(P.by), hx: q(P.hx), hy: q(P.hy), tilt: Math.round(P.tilt / 2) * 2, lift: q(P.lift), squat: Math.round(P.squat),
    backArm: [q(P.hand[0]), q(P.hand[1])], frontArm: [q(P.free[0]), q(P.free[1])], armSide: 0.6,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), Math.round(P.legF[2] / 3) * 3], backLeg: [q(P.legB[0]), q(P.legB[1]), Math.round(P.legB[2] / 3) * 3],
    ears: [Math.round(P.ears[0] / 3) * 3, Math.round(P.ears[1] / 3) * 3], tail: Math.round(P.tail / 3) * 3, air: P.lift > 1.5,
    eyes: P.eyes ?? (blink < 0.012 || (blink > 0.03 && blink < 0.042) ? 'half' : blink < 0.03 ? 'blink' : 'open'),
    face: { brows: P.brows ?? REST.brows, extra: P.extras, blush: P.blush },
  };
  const look = P.mouth ? { ...look0, mouth: P.mouth } : look0;
  const opts = { scale: MOCHI_SCALE, facing };
  // A soft shadow under the feet (smaller as it rises).
  ctx.fillStyle = 'rgba(70,40,90,0.16)';
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(3, 7 - P.lift * 0.3), 1.8, 0, 0, TAU);
  ctx.fill();
  // Sky's wings, behind her, flapping from her shoulder blades.
  if (m.form === 'sky') {
    // Rooted at her back, below the hair, long enough to stand out past it.
    const [wx, wy] = posedPoint(x, y, rig, opts, [13, 31]);
    wingShape(ctx, wx - facing * 2, wy - 1, -facing, P.wing, P.flap, false);
    wingShape(ctx, wx, wy, -facing, P.wing, P.flap * 0.9, true);
  }
  drawPosed(ctx, look, Math.round(x * 2) / 2, Math.round(y * 2) / 2, rig, {
    ...opts,
    over: (c, hand, flip, other) => {
      // Swift's pom-poms, one in each hand.
      if (P.poms > 0.02) {
        pomPom(c, hand[0], hand[1], P.poms, time, 0);
        pomPom(c, other[0], other[1], P.poms, time, 2);
      }
    },
  });
  // Sky's cheer: feathers drifting down round her.
  if (P.feathers >= 0 && P.feathers < 1) {
    for (let i = 0; i < 7; i++) {
      const f = (P.feathers + i * 0.11) % 1;
      const fx = x + Math.sin(i * 2.3 + f * 6) * 14;
      const fy = y - 40 + f * 40;
      ctx.save();
      ctx.globalAlpha = 1 - f;
      ctx.translate(fx, fy);
      ctx.rotate(Math.sin(f * 8 + i) * 0.8);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#7fa8e0';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.6, 0.9, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}
