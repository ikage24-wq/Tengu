// Draws the Spirit Doll, the Spirit Mage's imp of a companion (world/spiritdoll.js), on a skeleton
// of her own: her look is the hero's parts (a kokeshi bob, glassy doll eyes, painted dot brows, a
// paper doll's kimono), but nothing of the player's rig moves her. She never touches the ground: she
// floats, legs dangling and kicking, and everything she does is a pose from here, blended into the
// next so nothing ever snaps, handed to the hero's drawing whole (hero.js drawPosed). Her paper fan
// is a bone in her right hand, drawn from where the hand really is.
import { drawPosed } from './hero.js';
import { fxSprite } from './fx-sprites.js';
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
// A folded fan (sensu): white paper pleats fanning out from a gold rivet, a scarlet edge band, the
// ribs showing between the pleats. Drawn along +x from the rivet, `k` px per unit; `open` 0-1.
const FAN_R = 10;
function paintFan(ctx, k, open) {
  const half = 0.15 + 0.6 * open;
  const n = 6;
  ctx.save();
  ctx.scale(k, k);
  for (let i = 0; i < n; i++) {
    const a0 = -half + (2 * half * i) / n;
    const a1 = -half + (2 * half * (i + 1)) / n;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0) * FAN_R, Math.sin(a0) * FAN_R);
    ctx.lineTo(Math.cos(a1) * FAN_R, Math.sin(a1) * FAN_R);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#e6e0f2' : '#ffffff';
    ctx.fill();
  }
  // The scarlet band along the edge, and the outline in a darker shade of the paper.
  ctx.beginPath();
  ctx.arc(0, 0, FAN_R, -half, half);
  ctx.arc(0, 0, FAN_R * 0.78, half, -half, true);
  ctx.closePath();
  ctx.fillStyle = '#e0303e';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, FAN_R, -half, half);
  ctx.closePath();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = '#8a7aa8';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 1.1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd36a';
  ctx.fill();
  ctx.restore();
}

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
// Streamer Twirl: arms flung out, she spins (a clean flip each half turn) three times, faster
// then slowing, and comes out of it dizzy for a beat.
function twirling(p) {
  const turns = ease(seg(p, 0.05, 0.85)) * 3;
  const half = Math.floor(turns * 2) % 2 === 1;
  const dizzy = seg(p, 0.85, 1);
  return pose({
    turned: half && dizzy === 0, hand: [3, -3], free: [3, -3], fan: -0.4, open: 1, tilt: 6 * Math.sin(turns * TAU), by: -0.6, cloth: 3, kick: -1.5,
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

// Blending: every number eases over, angles the short way round.
function blend(a, b, k) {
  if (k >= 1) return b;
  const out = { ...b };
  for (const key of Object.keys(b)) {
    const x = a[key];
    const y = b[key];
    if (typeof y === 'number' && typeof x === 'number') out[key] = lerp(x, y, k);
    else if (Array.isArray(y) && Array.isArray(x) && typeof y[0] === 'number') out[key] = y.map((v, i) => lerp(x[i], v, k));
  }
  return out;
}

const q = (v) => Math.round(v * 2) / 2;
const deg3 = (v) => Math.round(v / 3) * 3;
// Her state between frames: what she was doing and the pose it blends from, the hair spring,
// blinks, and the motes she trails when she flies.
const STATE = new WeakMap();

export function drawSpiritDoll(ctx, world, d, cam, time, layer) {
  if (!d) return;
  let st = STATE.get(d);
  if (!st) STATE.set(d, (st = { last: time, doing: null, from: null, since: -9, shown: null, hair: 0, hairV: 0, tip: 0, tipV: 0, motes: [] }));
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  // Her bells falling on heads (drawn on the front layer, over the monsters).
  if (layer === 'front') drawBells(ctx, world, d, cam);
  if (layer !== d.layer) return;
  const x = d.x - cam.x;
  const y = d.y - cam.y;
  const sp = Math.hypot(d.vx, d.vy);
  const a = d.act;
  // What she's doing, and her pose for it.
  let doing;
  let p;
  if (a) {
    doing = a.kind;
    const u = clamp01((world.now - a.t0) / a.dur);
    p = a.kind === 'slap' ? slapping(u) : a.kind === 'twirl' ? twirling(u) : bonking(u);
  } else if (d.mood === 'peace') {
    doing = 'peace';
    p = cheering(0, time);
  } else if (d.mood === 'mad') {
    doing = 'mad';
    p = fuming(0, time);
  } else if (d.bit) {
    doing = d.bit.kind;
    const u = clamp01((world.now - d.bit.t0) / BITS[d.bit.kind]);
    p = { orbit: () => orbiting(time, u), peek: () => peeking(u), poke: () => poking(u, time), blep: () => blepping(u, time), loop: () => looping(u), hum: () => humming(u, time) }[d.bit.kind]();
  } else if (sp > 90) {
    doing = 'fly';
    p = flying(time, sp);
  } else {
    doing = 'hover';
    p = hovering(time);
  }
  if (doing !== st.doing) {
    st.from = st.shown;
    st.since = time;
    st.doing = doing;
  }
  const k = st.from ? ease(clamp01((time - st.since) / 0.16)) : 1;
  const P = st.from ? blend(st.from, p, k) : p;
  st.shown = P;
  // The hair: a spring that swings after her and is thrown about by what she does.
  const pull = -(d.vx / 90) * (d.dir || 1) + (P.kick ?? 0);
  [st.hair, st.hairV] = spring(st.hair, st.hairV, pull, 60, 6, dt);
  [st.tip, st.tipV] = spring(st.tip, st.tipV, st.hair, 40, 4.5, dt);
  // Motes of spirit light trailing her when she flies fast.
  if (sp > 140 && Math.random() < dt * 30) st.motes.push({ x: d.x, y: d.y - 14 + (Math.random() - 0.5) * 10, t: 0, life: 0.5, r: 0.8 + Math.random() });
  drawMotes(ctx, st.motes, cam, dt);
  const blink = (time * 0.37) % 1;
  const eyes = P.eyes ?? (blink < 0.012 || (blink > 0.03 && blink < 0.042) ? 'half' : blink < 0.03 ? 'blink' : 'open');
  const look = { ...DOLL_LOOK, mouth: P.mouth };
  const dir = d.dir || 1;
  const facing = P.turned ? -dir : dir;
  const rig = {
    tx: q(P.tx), by: q(P.by), hx: q(P.hx), hy: q(P.hy), tilt: deg3(P.tilt), backArm: [q(P.hand[0]), q(P.hand[1])], frontArm: [q(P.free[0]), q(P.free[1])], armSide: 0.6,
    frontLeg: [q(P.legF[0]), q(P.legF[1]), deg3(P.legF[2])], backLeg: [q(P.legB[0]), q(P.legB[1]), deg3(P.legB[2])], air: true,
    hair: q(Math.max(-3, Math.min(3, st.hair))), hairTip: q(Math.max(-4, Math.min(4, st.tip))), hairLift: q(-(P.kick ?? 0)), hairWave: Math.floor((((time / 2.2) % 1) + 1) % 1 * 8),
    cape: q(P.cloth), eyes, face: { brows: P.brows, extra: P.extras, blush: P.blush, puff: P.puff },
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
  drawPosed(ctx, look, Math.round(x), Math.round(y), rig, { scale: SCALE, facing, over: fanOn });
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
