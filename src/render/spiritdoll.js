// Draws the Spirit Doll, the Spirit Mage's imp of a companion (world/spiritdoll.js), on a skeleton
// of her own: her look is the hero's parts (a kokeshi bob, glassy doll eyes, painted dot brows, a
// paper doll's kimono), but nothing of the player's rig moves her. She never touches the ground: she
// floats, legs dangling and kicking, and everything she does is a pose from here. She never jumps
// to a pose: every part of her is carried there on a spring (`follow`), so she moves fluidly, a
// quick move overshoots a hair and settles, and one action flows into the next. On top of that she
// leans into her flight and her head, hair and sleeves trail after her body (follow-through). The
// result is handed to the hero's drawing whole (hero.js drawPosed). Her paper fan is a bone in her
// right hand, drawn from where the hand really is.
import { drawPosed } from './hero.js';
import { fxSprite } from './fx-sprites.js';
import { paintFan } from './props.js';
import { BITS } from '../world/spiritdoll.js';

// Her look: a black kokeshi bob tied with scarlet cords and bells, big violet doll's eyes, rose
// dot brows, a white paper kimono with streamer sleeves.
export const DOLL_LOOK = {
  hairStyle: 'kokeshi', hairColor: '#2a2440', eyeStyle: 'doll', eyeColor: '#7a62e0', browStyle: 'dots', face: 'smile', mouth: 'cat',
  outfit: 'paperdoll', outfitColor: '#fbf8ff', skinTone: '#fff4ee',
};
// She's tiny: half the Spirit Mage's size (the whole figure scaled, never squashed).
const SCALE = 0.5;
// Her middle, in body px over her feet (what she turns about in a loop).
const MID = 28;

// ---------- Her paper fan ----------
// The little folding fan in her right hand (render/props.js), drawn from where the hand really is.

// ---------- Her skeleton ----------
// A pose, in her own terms (facing right; body px of the hero's rig):
//   tx, by, hx, hy, tilt      the upper body's lean and bob, the head's offset and tilt (degrees)
//   hand, free                where her right hand (the fan) and left hand reach, from rest
//   fan, open                 the fan's direction from her hand (radians, 0 = ahead, -PI/2 = up)
//                             and how far it's opened (0 closed, 1 wide), or null to hide it
//   legF, legB                each foot's [ahead, up (negative), tilt]
//   spin                      the whole figure turned about her middle (radians: loops, hanging
//                             upside down); `turned` faces her the other way (a twirl's half turn)
//   mouth, eyes, brows, extras, blush, puff   the face
//   cloth, kick               the kimono's sway and the hair thrown up
const REST = {
  tx: 0, by: 0, hx: 0, hy: 0, tilt: 0, hand: [0, 0], free: [0, 0], fan: 0.9, open: 0, legF: [0.8, -1, 12], legB: [-0.6, -0.2, -6],
  spin: 0, turned: false, mouth: 'cat', eyes: null, brows: [[0.3, 0], [0.3, 0]], extras: [], blush: 1.2, puff: false, cloth: 0, kick: 0,
};
const pose = (o) => ({ ...REST, ...o });

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const lerp = (a, b, t) => a + (b - a) * t;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
const TAU = Math.PI * 2;
// Her dangling legs kick lazily, one then the other, like treading water.
const kickLegs = (t, k = 1) => ({ legF: [0.8 + 0.6 * Math.sin(t * 3) * k, -1 - 0.8 * Math.max(0, Math.sin(t * 3)) * k, 12 + 10 * Math.sin(t * 3) * k], legB: [-0.6 - 0.6 * Math.sin(t * 3 + 2) * k, -0.2 - 0.8 * Math.max(0, Math.sin(t * 3 + 2)) * k, -6 + 10 * Math.sin(t * 3 + 2) * k] });

// Hovering: a slow bob, the legs kicking, the fan tapped against her shoulder, a look round now
// and then with a sly little smile.
function hovering(t) {
  const c = t % 5;
  const look = bump(c, 3.2, 4.4);
  return pose({
    by: 0.6 * Math.sin(t * 2.4), hy: 0.4 * Math.sin(t * 2.4 - 0.6), tilt: 4 * Math.sin(t * 1.3) - 6 * look, hx: -0.6 * look,
    hand: [1.5, -5 + Math.abs(Math.sin(t * 2.2)) * 1.2], fan: -1.9, free: [0.6 * Math.sin(t * 1.7), 0.4], cloth: Math.sin(t * 2) * 0.8,
    mouth: look > 0.5 ? 'smirk' : 'cat', ...kickLegs(t),
  });
}
// Flying: leaning into it, legs trailing behind, arms swept back, hair and sleeves streaming.
function flying(t, sp) {
  const k = clamp01(sp / 300);
  return pose({
    tilt: 14 * k, tx: 0.8 * k, by: 0.4 * Math.sin(t * 6), hand: [-2.4 * k, 1], fan: 2.6, free: [-2.6 * k, 0.6], cloth: -3 * k, kick: -1.5 * k,
    legF: [-0.6 * k, -1.8 * k, -24 * k], legB: [-2 * k, -1.2 * k, -34 * k], mouth: k > 0.6 ? 'grin' : 'cat',
  });
}

// ---------- Her tricks ----------

// Fan Slap: the fan snapped open and wound up over her head, then two smacks, forehand and back
// (landing at 0.3 and 0.55), and a cheeky flourish to finish.
function slapping(p) {
  const wind = ease(seg(p, 0, 0.22));
  const s1 = ease(seg(p, 0.22, 0.3));
  const back = ease(seg(p, 0.32, 0.47));
  const s2 = ease(seg(p, 0.47, 0.55));
  const done = ease(seg(p, 0.7, 1));
  const fan = p < 0.3 ? lerp(-2.2, 0.8, s1) - 0.6 * wind * (1 - s1) : p < 0.55 ? lerp(0.8, -1.5, back) + 2.4 * s2 : lerp(0.9, -1.9, done);
  const hand = p < 0.3 ? [lerp(-1, 3, s1), lerp(-8 * wind, 2, s1)] : p < 0.55 ? [lerp(3, -1, back) + 4 * s2, lerp(2, -6, back) + 6 * s2] : [lerp(3, 1.5, done), lerp(0, -5, done)];
  const hit = bump(p, 0.27, 0.36) + bump(p, 0.52, 0.61);
  return pose({
    hand, fan, open: p < 0.7 ? 1 : 1 - done * 0.6, free: [-2, -1 - 2 * wind], tilt: -8 * wind * (1 - s1) + 12 * hit, tx: 1.2 * hit, hy: 0.4 * hit,
    mouth: p < 0.22 ? 'cat' : p < 0.7 ? 'grin' : 'cat', eyes: hit > 0.4 ? 'happy' : null, brows: [[-0.1, 0.5], [-0.1, 0.5]], kick: 1.2 * hit, cloth: 2 * hit,
    extras: p > 0.7 ? ['spark0'] : [], ...kickLegs(p * 6, 0.4),
  });
}
// Streamer Twirl: arms flung out, she wheels round twice in the air (one smooth turn of the whole
// figure, never a flip), fast then slowing, streamers whipping out, and comes out of it dizzy.
function twirling(p) {
  const turns = ease(seg(p, 0.05, 0.85)) * 2;
  const dizzy = seg(p, 0.85, 1);
  return pose({
    spin: -turns * TAU, hand: [3, -3], free: [3, -3], fan: -0.4, open: 1, tilt: 4 * Math.sin(turns * TAU), by: -0.6, cloth: 3, kick: -1.5,
    legF: [1.6, -2, 30], legB: [-1.6, -0.6, -20], mouth: dizzy > 0 ? 'wavy' : 'grin', eyes: dizzy > 0 ? null : 'happy', extras: dizzy > 0 ? [`orbit${Math.floor(p * 40) % 8}`] : [],
  });
}
// Bell Bonk: both arms flung up to call the bell down out of the sky, a finger pointed at the
// monster's head as it falls, then hands over her mouth, giggling.
function bonking(p) {
  const up = ease(seg(p, 0, 0.3));
  const point = ease(seg(p, 0.32, 0.48));
  const giggle = seg(p, 0.6, 1);
  if (giggle > 0) {
    return pose({
      hand: [1.5, -7.5], free: [1.8, -7], fan: -1.6, by: 0.5 * Math.sin(p * 60), tilt: 8 + 4 * Math.sin(p * 50), hy: 0.6,
      mouth: 'grin', eyes: 'happy', extras: ['spark1'], blush: 1.5, ...kickLegs(p * 8, 1.2),
    });
  }
  return pose({
    hand: [lerp(0, 1, up) + 3 * point, lerp(0, -12, up) + 9 * point], free: [lerp(0, 1.5, up), lerp(0, -12, up)], fan: lerp(0.9, -1.4, up) + 1.6 * point,
    tilt: -10 * up + 14 * point, by: -1 * up, mouth: point > 0.3 ? 'open' : 'o', brows: [[0.6, -0.2], [0.6, -0.2]], kick: -up, ...kickLegs(p * 4, 0.6),
  });
}
// Dropkick: tucked up high, knees to her chest and a wicked grin; then the dive, leaning right
// over with both legs shot out straight ahead, fan flung back (it lands at 0.62); she bounces off
// it in a little backflip, cheering.
function dropkicking(p) {
  const tuck = ease(seg(p, 0, 0.3)) * (1 - seg(p, 0.45, 0.52));
  const dive = ease(seg(p, 0.45, 0.6)) * (1 - ease(seg(p, 0.72, 0.85)));
  const flip = ease(seg(p, 0.7, 0.95));
  return pose({
    hand: [lerp(0, -3, dive), lerp(-3 * tuck, 1, dive)], free: [lerp(1, -3, dive), lerp(-4 * tuck, 1, dive)], fan: lerp(-1.8, 2.8, dive), open: 1,
    tilt: -14 * tuck + 34 * dive, by: -1.2 * tuck, spin: -flip * TAU, cloth: 2 + 2 * dive, kick: -1.5 * dive,
    legF: [lerp(2.4, 4.6, dive), lerp(-4.6, -3.2, dive), lerp(70, 92, dive)], legB: [lerp(1.2, 3.8, dive), lerp(-4, -2.4, dive), lerp(60, 86, dive)],
    mouth: dive > 0.3 ? 'open' : tuck > 0.3 ? 'smirk' : 'grin', eyes: flip > 0.2 ? 'happy' : null, brows: [[-0.2, 0.6], [-0.2, 0.6]], extras: flip > 0.4 ? ['spark0'] : [],
  });
}
// Paper Charm: a charm of light drawn from her sleeve, held up between two fingers with a sly look,
// then flicked at the monster with a snap of the wrist (it leaves at 0.42); she blows on her
// fingers after it, very pleased with herself.
function charming(p) {
  const draw = ease(seg(p, 0, 0.3));
  const flick = ease(seg(p, 0.34, 0.44));
  const smug = seg(p, 0.6, 1);
  return pose({
    hand: [1.2, -4], fan: -1.9, free: [lerp(0, -1.5, draw) + 5.5 * flick - 3 * smug, lerp(0, -7, draw) + 5 * flick - 3 * smug],
    tilt: -8 * draw * (1 - flick) + 12 * flick * (1 - smug), tx: 1 * flick, hx: 0.4 * flick,
    mouth: smug > 0 ? 'o' : draw > 0.4 ? 'smirk' : 'cat', eyes: smug > 0 ? 'half' : null, brows: [[-0.1, 0.4], [-0.1, 0.4]], extras: flick > 0.5 && smug === 0 ? ['spark1'] : [], ...kickLegs(p * 5, 0.5),
  });
}
// Akanbe: nose to nose with it, one finger pulling her lower eyelid down and her tongue stuck right
// out ("bleh!"), wagging her head (it lands at 0.5); then she spins off giggling.
function akanbe(p, t) {
  const pull = ease(seg(p, 0.12, 0.32)) * (1 - ease(seg(p, 0.78, 0.92)));
  const wag = Math.sin(t * 16) * pull;
  return pose({
    hand: [1.2, -4], fan: -1.9, free: [lerp(0, 1.4, pull), lerp(0, -10.5, pull)], tilt: 6 * pull + 5 * wag, hx: 0.6 * pull, hy: 0.3 * pull,
    mouth: pull > 0.3 ? 'tongue' : 'grin', eyes: pull > 0.3 ? 'half' : 'happy', brows: [[0.6, -0.3], [-0.2, 0.5]], blush: 1.6, extras: pull > 0.3 ? [] : ['spark0'], ...kickLegs(t * 3, 1.1),
  });
}

// Spitball Volley: a paper straw whipped up to her lips, cheeks puffed right out; pff, pff (her head
// jerks back with each), then a huge breath and one big soggy one (at 0.3, 0.42, 0.6); then a
// coughing fit, doubled over, and a wipe of her mouth with her sleeve.
function spitting(p, t) {
  const up = ease(seg(p, 0, 0.18)) * (1 - ease(seg(p, 0.66, 0.74)));
  const shot = Math.max(bump(p, 0.3, 0.37), bump(p, 0.42, 0.49), 1.4 * bump(p, 0.6, 0.7));
  const gulp = bump(p, 0.47, 0.6);
  const cough = seg(p, 0.72, 1);
  const hack = cough > 0 && cough < 0.75 ? Math.abs(Math.sin(t * 22)) : 0;
  return pose({
    hand: [lerp(1.2, 2, up), lerp(-4, -8.4, up) + 4 * cough], free: [lerp(0, 3.4, up) + 1.4 * cough, lerp(0, -8, up) - 1.6 * cough], fan: up > 0.2 ? null : -1.9, straw: up > 0.2,
    tilt: -9 * shot - 4 * gulp + cough * (14 + 6 * hack), hx: -0.6 * shot + 0.4 * cough, hy: 0.5 * cough * hack, by: 0.6 * hack,
    puff: up > 0.3 && shot < 0.4, mouth: shot > 0.4 ? 'o' : cough > 0 ? 'wavy' : 'cat', eyes: shot > 0.4 ? 'half' : cough > 0 ? 'blink' : null,
    brows: cough > 0 ? [[0.8, -0.3], [0.8, -0.3]] : [[-0.1, 0.5], [-0.1, 0.5]], blush: 1.4 + 0.6 * gulp, kick: 0.8 * shot, extras: cough > 0.2 && cough < 0.8 ? ['steam0'] : [], ...kickLegs(t * 2, 0.6 + cough),
  });
}

// ---------- Her idle bits ----------

// A lap round the Spirit Mage's head, giggling, arms out like a plane.
function orbiting(t, u) {
  return pose({ tilt: 16, hand: [-2, -2], free: [-2.4, -2], fan: 2.4, mouth: 'grin', eyes: u > 0.2 && u < 0.8 ? 'happy' : null, cloth: -2, kick: -1, legF: [-0.6, -1.6, -20], legB: [-1.8, -1, -30], by: 0.5 * Math.sin(t * 8) });
}
// Hanging upside down over the Spirit Mage's head, peering into her face; a "boo!" with her arms
// flung out, then a giggle.
function peeking(u) {
  const flip = ease(seg(u, 0, 0.18)) * (1 - ease(seg(u, 0.85, 1)));
  const boo = bump(u, 0.45, 0.65);
  const giggle = u > 0.65 && u < 0.85;
  return pose({
    spin: Math.PI * flip, hand: [1 + 3 * boo, 4 - 10 * boo], free: [1 + 3 * boo, 4 - 10 * boo], fan: 0.9, open: boo, hy: 0.6,
    mouth: boo > 0.3 ? 'open' : giggle ? 'grin' : 'o', eyes: giggle ? 'happy' : null, brows: boo > 0.3 ? [[0.9, -0.3], [0.9, -0.3]] : REST.brows,
    extras: boo > 0.5 ? ['bang1'] : giggle ? ['spark0'] : [], legF: [0.4, -2.4, 30], legB: [-0.4, -1.6, 10],
  });
}
// Poking the Spirit Mage's cheek: three quick pokes with her free hand, then a snicker behind the fan.
function poking(u, t) {
  const pokes = u < 0.65 ? Math.max(0, Math.sin(seg(u, 0.1, 0.65) * Math.PI * 6)) : 0;
  const snicker = seg(u, 0.68, 1);
  return pose({
    free: snicker > 0 ? [1.5, -6] : [3 + 3 * pokes, -3.5], hand: snicker > 0 ? [1.6, -7] : [0, -1], fan: snicker > 0 ? -1.2 : 1.2, open: snicker > 0 ? 1 : 0.3,
    tilt: 6 * pokes, tx: 0.6 * pokes, mouth: snicker > 0 ? 'grin' : 'cat', eyes: snicker > 0 ? 'happy' : null, extras: snicker > 0.3 ? ['spark1'] : [],
    by: snicker > 0 ? 0.5 * Math.sin(t * 40) : 0, ...kickLegs(t, 0.6),
  });
}
// Sticking her tongue out at the world, a finger pulling down one eyelid, hip cocked.
function blepping(u, t) {
  const k = ease(seg(u, 0, 0.2)) * (1 - ease(seg(u, 0.8, 1)));
  return pose({
    free: [lerp(0, 2.2, k), lerp(0, -9.5, k)], hand: [lerp(0, 2, k), lerp(0, 2, k)], fan: 1.6, tilt: -10 * k, hx: -0.6 * k, hy: 0.4 * k,
    mouth: k > 0.4 ? 'tongue' : 'cat', eyes: k > 0.4 ? 'half' : null, brows: [[0.6, -0.4], [0.2, 0.3]], extras: k > 0.6 ? ['spark0'] : [], ...kickLegs(t, 1),
  });
}
// A loop-the-loop in the air: a backflip right round, giggling at the top.
function looping(u) {
  const f = ease(seg(u, 0.05, 0.85));
  return pose({ spin: -f * TAU, hand: [-1, -3], free: [-1, -3], fan: 2, legF: [2, -4, 30], legB: [0.6, -3, 20], mouth: 'grin', eyes: f > 0.2 && f < 0.8 ? 'happy' : null, kick: 1.4, cloth: 2 });
}
// Humming to herself: sat cross-legged on nothing, swaying side to side, eyes shut, fanning herself.
function humming(u, t) {
  const sway = Math.sin(t * 3);
  return pose({
    tilt: 8 * sway, hx: 0.6 * sway, by: 0.4, hand: [1.6, -4 + Math.sin(t * 9) * 0.8], fan: -1.3 + 0.35 * Math.sin(t * 9), open: 1, free: [1.6, 2],
    legF: [2.6, -3.2, 70], legB: [1.2, -2.6, 50], mouth: 'tiny', eyes: 'happy', extras: [`spark${Math.floor(t * 2) % 2}`],
  });
}

// ---------- Rodeo ----------

// The hop up onto a monster: knees tucked, both arms flung up, bell held high, a whoop.
function hopping(u) {
  const k = Math.sin(u * Math.PI);
  return pose({
    hand: [1.4, -11], free: [2, -10], fan: null, bell: true, tilt: -12 * k, by: -1 * k, kick: -1.2 * k, cloth: 2,
    legF: [2.4, -4.6, 70], legB: [1.2, -4, 60], mouth: 'open', eyes: 'happy', blush: 1.5,
  });
}

// Riding a monster: sat astride its head, legs kicking at its sides, the gold bell swung up high
// and brought down on the beat (`since`: seconds since the last bonk, `beat` between bonks), a
// big grin on every bonk and her free hand waving like a rodeo rider.
function riding(since, beat, t) {
  const u = clamp01(since / beat);
  const hit = 1 - ease(seg(u, 0, 0.18));
  // Raised slowly after a bonk, held high, then whipped down so it lands on the next.
  const up = ease(seg(u, 0.18, 0.7)) * (1 - seg(u, 0.86, 1) ** 2);
  return pose({
    hand: [lerp(1.4, 3.6, hit), lerp(-1.5, -11, up)], free: [2 + Math.sin(t * 10) * 0.8, -10 + Math.sin(t * 10) * 1.2], fan: null, bell: true,
    tilt: -10 * up + 16 * hit, by: 1.4 * hit, hy: 0.6 * hit, cloth: 2, kick: 0.6 * up,
    legF: [2.4 + 0.6 * Math.sin(t * 12), -2.6, 64 + 8 * Math.sin(t * 12)], legB: [1, -2.2, 52 + 8 * Math.sin(t * 12 + 2)],
    mouth: hit > 0.3 ? 'grin' : 'cat', eyes: hit > 0.3 ? 'happy' : null, extras: hit > 0.4 ? ['spark1'] : [], blush: 1.5,
  });
}

// ---------- Her moods ----------

// A peace sign and a wink at what she just beat, bouncing.
function cheering(p, t) {
  return pose({ free: [2.6, -11], hand: [1.6, -4], fan: -1.6, open: 1, by: -0.8 * Math.abs(Math.sin(t * 9)), tilt: -8, hx: 0.4, mouth: 'grin', eyes: 'happy', extras: ['spark1'], blush: 1.5, ...kickLegs(t * 2, 1.2) });
}
// Furious that the Spirit Mage was hurt: cheeks puffed, fists pumping, a vein, steam.
function fuming(p, t) {
  const pump = Math.abs(Math.sin(t * 14));
  return pose({
    hand: [1, -2 - 3 * pump], free: [1, -2 - 3 * (1 - pump)], fan: -1, puff: true, mouth: 'pout', brows: [[-0.2, 0.9], [-0.2, 0.9]], tilt: 6,
    extras: [Math.floor(t * 6) % 2 ? 'veinbig' : 'vein', `steam${Math.floor(t * 8) % 3}`], blush: 1.6, ...kickLegs(t * 3, 1.4),
  });
}

// Following: every number of her pose is carried toward the pose she's in on a spring, a touch
// under-damped (so a quick move overshoots a hair and settles, and nothing ever snaps); whole turns
// (`spin`) take the short way round. Faces, the bell and other switches change at once.
const FOLLOW = { k: 420, damp: 0.74 };
function follow(st, target, dt) {
  if (!st.P) {
    st.P = structuredClone(target);
    st.V = {};
    return st.P;
  }
  const c = 2 * Math.sqrt(FOLLOW.k) * FOLLOW.damp;
  const P = { ...target };
  const step = (x, v, to, h) => {
    const nv = v + ((to - x) * FOLLOW.k - v * c) * h;
    return [x + nv * h, nv];
  };
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  for (const key of Object.keys(target)) {
    const to = target[key];
    const was = st.P[key];
    if (typeof to === 'number' && typeof was === 'number') {
      let x = key === 'spin' ? was - TAU * Math.round((was - to) / TAU) : was;
      let v = st.V[key] ?? 0;
      for (let i = 0; i < n; i++) [x, v] = step(x, v, to, h);
      P[key] = x;
      st.V[key] = v;
    } else if (Array.isArray(to) && Array.isArray(was) && to.every((e) => typeof e === 'number') && was.length === to.length) {
      const vs = (st.V[key] ??= to.map(() => 0));
      P[key] = to.map((t, i) => {
        let x = was[i];
        let v = vs[i];
        for (let j = 0; j < n; j++) [x, v] = step(x, v, t, h);
        vs[i] = v;
        return x;
      });
    } else st.V[key] = undefined;
  }
  st.P = P;
  return P;
}

const q = (v) => Math.round(v * 4) / 4;
const deg2 = (v) => Math.round(v / 2) * 2;
// Her state between frames: her pose as it's carried along (and its speeds), the hair spring, her
// flight (to lean into turns), blinks, and the motes she trails when she flies.
const STATE = new WeakMap();

export function drawSpiritDoll(ctx, world, d, cam, time, layer) {
  if (!d) return;
  let st = STATE.get(d);
  if (!st) STATE.set(d, (st = { last: time, P: null, V: {}, hair: 0, hairV: 0, tip: 0, tipV: 0, lean: 0, leanV: 0, head: 0, headV: 0, vx: 0, vy: 0, motes: [] }));
  // Her bells falling on heads (drawn on the front layer, over the monsters).
  if (layer === 'front') drawBells(ctx, world, d, cam);
  // She's asked for on both layers each frame but drawn on one: her springs step once, there, by
  // the time since she was last drawn.
  if (layer !== d.layer) return;
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  const x = d.x - cam.x;
  const y = d.y - cam.y;
  const sp = Math.hypot(d.vx, d.vy);
  const a = d.act;
  // What she's doing, and her pose for it.
  let p;
  if (a) {
    const u = clamp01((world.now - a.t0) / a.dur);
    if (a.kind === 'ride') {
      const t = world.now - a.t0;
      const last = a.hits.filter((h) => h <= t).at(-1);
      p = t < a.hits[0] - 0.2 ? hopping(clamp01(t / (a.hits[0] - 0.2))) : riding(last == null ? 0.25 : t - last, a.hits[1] - a.hits[0] || 0.34, time);
    } else p = { slap: slapping, twirl: twirling, bonk: bonking, kick: dropkicking, charm: charming, akanbe: (v) => akanbe(v, time), spit: (v) => spitting(v, time) }[a.kind](u);
  } else if (d.mood === 'peace') p = cheering(0, time);
  else if (d.mood === 'mad') p = fuming(0, time);
  else if (d.bit) {
    const u = clamp01((world.now - d.bit.t0) / BITS[d.bit.kind]);
    p = { orbit: () => orbiting(time, u), peek: () => peeking(u), poke: () => poking(u, time), blep: () => blepping(u, time), loop: () => looping(u), hum: () => humming(u, time) }[d.bit.kind]();
  } else if (sp > 90) p = flying(time, sp);
  else p = hovering(time);
  const P = follow(st, p, dt);
  // Follow-through: she banks into her flight (leaning the way she's going, harder as she speeds
  // up or swerves), and her head trails her body a beat behind; both on springs of their own.
  const dir = d.dir || 1;
  const ax = dt > 0 ? (d.vx - st.vx) / dt : 0;
  const ay = dt > 0 ? (d.vy - st.vy) / dt : 0;
  [st.vx, st.vy] = [d.vx, d.vy];
  const bank = Math.max(-22, Math.min(22, (d.vx * dir) / 22 + (ax * dir) / 260));
  [st.lean, st.leanV] = spring(st.lean, st.leanV, a ? bank * 0.3 : bank, 90, 13, dt);
  [st.head, st.headV] = spring(st.head, st.headV, Math.max(-1.6, Math.min(1.6, -(ax * dir) / 900 + ay / 1400)), 120, 11, dt);
  // The hair: a spring that swings after her and is thrown about by what she does.
  const pull = -(d.vx / 90) * dir + (P.kick ?? 0) - ay / 900;
  [st.hair, st.hairV] = spring(st.hair, st.hairV, pull, 60, 6, dt);
  [st.tip, st.tipV] = spring(st.tip, st.tipV, st.hair, 40, 4.5, dt);
  // Motes of spirit light trailing her when she flies fast.
  if (sp > 140 && Math.random() < dt * 30) st.motes.push({ x: d.x, y: d.y - 14 + (Math.random() - 0.5) * 10, t: 0, life: 0.5, r: 0.8 + Math.random() });
  drawMotes(ctx, st.motes, cam, dt);
  const blink = (time * 0.37) % 1;
  const eyes = P.eyes ?? (blink < 0.012 || (blink > 0.03 && blink < 0.042) ? 'half' : blink < 0.03 ? 'blink' : 'open');
  const look = { ...DOLL_LOOK, mouth: P.mouth };
  const facing = P.turned ? -dir : dir;
  const rig = {
    tx: q(P.tx), by: q(P.by), hx: q(P.hx + st.head), hy: q(P.hy), tilt: deg2(P.tilt + st.lean), backArm: [q(P.hand[0]), q(P.hand[1])], frontArm: [q(P.free[0]), q(P.free[1])], armSide: 0.6,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg2(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg2(P.legB[2])], air: true,
    hair: q(Math.max(-3, Math.min(3, st.hair))), hairTip: q(Math.max(-4, Math.min(4, st.tip))), hairLift: q(-(P.kick ?? 0)), hairWave: Math.floor((((time / 2.2) % 1) + 1) % 1 * 8),
    cape: q(P.cloth - st.lean / 8), eyes, face: { brows: P.brows, extra: P.extras, blush: P.blush, puff: P.puff },
  };
  // A soft glow of spirit light under her, so she reads as floating, not standing.
  ctx.save();
  ctx.globalAlpha = 0.35;
  const g = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, 9);
  g.addColorStop(0, 'rgba(255, 250, 235, 0.9)');
  g.addColorStop(1, 'rgba(230, 220, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 10, y - 6, 20, 16);
  ctx.restore();
  const fanOn = (c, hand, flip) => {
    // Riding, she swings a gold bell instead of her fan.
    if (P.bell) {
      fxSprite(c, 'celdollbell', hand[0], hand[1] - 2, { frame: 0, scale: 0.22, rot: (flip ? 1 : -1) * 0.3 });
      return;
    }
    // Her spitball straw: a rolled tube of white paper with scarlet bands, held to her lips.
    if (P.straw) {
      c.save();
      c.translate(hand[0], hand[1]);
      if (flip) c.scale(-1, 1);
      c.rotate(-0.2);
      c.fillStyle = '#fbf8ff';
      c.strokeStyle = '#8a7cc0';
      c.lineWidth = 0.4;
      c.fillRect(1.5, -1.2, 8.5, 1.4);
      c.strokeRect(1.5, -1.2, 8.5, 1.4);
      c.fillStyle = '#d8323e';
      for (const bx of [4, 7.5]) c.fillRect(bx, -1.2, 0.7, 1.4);
      c.restore();
    }
    if (P.fan == null) return;
    c.save();
    c.translate(hand[0], hand[1]);
    if (flip) c.scale(-1, 1);
    c.rotate(P.fan);
    paintFan(c, SCALE * 1.15, P.open);
    c.restore();
  };
  ctx.save();
  if (P.spin) {
    // A loop or hanging upside down: the whole figure turned about her middle, drawn whole.
    const cy = y - MID * SCALE;
    ctx.translate(x, cy);
    ctx.rotate(P.spin * dir);
    ctx.translate(-x, -cy);
  }
  drawPosed(ctx, look, Math.round(x * 2) / 2, Math.round(y * 2) / 2, rig, { scale: SCALE, facing, over: fanOn });
  ctx.restore();
}

// The bells she's dropped, falling on heads: out of the sky, faster and faster, swinging.
function drawBells(ctx, world, d, cam) {
  for (const bell of d.bells) {
    if (bell.landed) continue;
    const u = clamp01((world.now - bell.t0) / (bell.at - bell.t0));
    const fall = Math.max(0, (u - 0.35) / 0.65);
    const head = bell.y - (bell.mob?.def.h ?? 30);
    const by = head - 140 * (1 - fall * fall) - 10;
    const appear = clamp01(u / 0.3);
    fxSprite(ctx, 'celdollbell', bell.x - cam.x, by - cam.y, { frame: 0, scale: 0.42 * (0.6 + 0.4 * appear), rot: Math.sin(world.now * 14) * 0.25 * (1 - fall), alpha: appear });
  }
}

// A damped spring toward `to` (stiffness k, damping c).
function spring(x, v, to, k, c, dt) {
  const nv = v + ((to - x) * k - v * c) * dt;
  return [x + nv * dt, nv];
}

// The motes of light she trails, drifting up and fading.
function drawMotes(ctx, motes, cam, dt) {
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i];
    m.t += dt;
    if (m.t >= m.life) {
      motes.splice(i, 1);
      continue;
    }
    m.y -= 12 * dt;
    ctx.globalAlpha = (1 - m.t / m.life) * 0.8;
    ctx.fillStyle = Math.random() < 0.2 ? '#ffe9a6' : '#ffffff';
    ctx.fillRect(Math.round(m.x - cam.x - m.r), Math.round(m.y - cam.y - m.r), m.r * 2, m.r * 2);
  }
  ctx.globalAlpha = 1;
}
