// The hero (and NPCs): a layered chibi rig. Each frame the pose is solved into small integer
// offsets for every part (legs, arms, torso, head, hair, cape), the parts are composited with the
// equipped gear's designs, and the result is cached as a sprite. The front arm and the weapon
// are separate layers so weapons can swing around the hand.
//
// Animation: an 8-frame walk cycle driven by distance walked (contact, down, passing, up), a
// breathing idle with blinks, stretch when rising, squash when landing, spring-driven hair and
// cape follow-through, attack anticipation and lunge with a weapon trail, a climb cycle, and a
// hurt recoil.

import { ITEMS, RARITIES } from '../data/items.js';
import { R, E, P, sprite, blit, shade, tinted } from './pixel.js';
import {
  topShapes, sleeveColor, legLook, skirtShapes, legShapes, hatShapes, hatBackShapes, TUCKS_HAIR,
  capeShapes, handShapes, earringShapes,
} from './gear.js';
import { weaponShapes, weaponFrames } from './weapons.js';
import { drawElementAura, ELEMENTS } from './elements.js';
import { walkPhase } from './animator.js';

export const HAIR_STYLES = ['bob', 'wavy', 'twintails', 'ponytail', 'short', 'spiky', 'bun', 'long'];
export const EYE_STYLES = ['sparkle', 'round', 'happy', 'sleepy'];

// Body coordinates are a 30x48 chibi with feet at y 48; the sprite box adds room for hats and wings.
const OX = 6;
const OY = 11;
const W = 30 + OX * 2;
const H = 48 + OY;
const INK = '#3a2d4f';

const move = (shapes, dx, dy) => shapes.map((s) => (s ? { ...s, x: s.x + dx + OX, y: s.y + dy + OY } : s));

// ---------- Gear lookup ----------

function resolveGear(look, gear) {
  const outfit = look.outfitColor ?? '#ffc2d6';
  const piece = (slot, design, color) => {
    const inst = gear?.[slot];
    if (!inst) return design ? { design, color } : null;
    const def = ITEMS[inst.id];
    return { design: def.design ?? design, color: def.color };
  };
  const w = gear?.weapon ? ITEMS[gear.weapon.id] : null;
  return {
    top: piece('top', 'tee', outfit),
    bottom: piece('bottom', 'pants', shade(outfit, -22)),
    shoes: piece('shoes', 'sneakers', '#fffaf0'),
    hat: piece('hat', null),
    cape: piece('cape', null),
    gloves: piece('gloves', null),
    earring: piece('earring', null),
    weapon: w ? { type: w.weaponType, color: w.color, tier: w.tier, element: w.element ?? null, rarity: gear.weapon.rarity ?? 0 } : null,
  };
}

function gearKey(gear) {
  if (!gear) return '-';
  return ['top', 'bottom', 'shoes', 'gloves', 'hat', 'cape', 'earring'].map((s) => gear[s]?.id ?? '').join(',');
}

// ---------- Head ----------

function hairBack(style, c, sway, lift) {
  const d = shade(c, -18);
  const head = E(15, 13.5, 12.5, 11.5, c);
  // Lower strands follow the hair spring; the crown stays on the head.
  const s = (shape, k = 1) => ({ ...shape, x: shape.x + Math.round(sway * k), y: shape.y + (shape.y >= 20 ? lift : 0) });
  switch (style) {
    case 'bob': return [head, s(R(3, 13, 24, 7, c), 0.5), s(E(15, 20, 12.5, 4.5, c), 0.5), s(E(4.5, 22, 2.5, 2.5, c), 0.7), s(E(25.5, 22, 2.5, 2.5, c), 0.7), s(R(7, 21, 1, 3, d), 0.5), s(R(22, 21, 1, 3, d), 0.5)];
    case 'wavy': return [head, s(R(2, 13, 26, 10, c), 0.4), s(E(4, 25, 3.5, 5, c), 0.8), s(E(26, 25, 3.5, 5, c), 0.8), s(E(5, 31, 3, 3.5, c), 1.2), s(E(25, 31, 3, 3.5, c), 1.2), s(E(4, 35, 2, 2, c), 1.5), s(E(26, 35, 2, 2, c), 1.5), s(R(3, 28, 3, 1, d), 1), s(R(24, 28, 3, 1, d), 1)];
    case 'long': return [head, s(R(3, 13, 24, 10, c), 0.4), s(E(15, 24, 12, 7, c), 0.7), s(E(5, 31, 3.5, 7, c), 1.1), s(E(25, 31, 3.5, 7, c), 1.1), s(E(5.5, 37, 2.5, 3, c), 1.5), s(E(24.5, 37, 2.5, 3, c), 1.5), s(R(5, 27, 1, 8, d), 1.1), s(R(24, 27, 1, 8, d), 1.1)];
    case 'twintails': return [head, s(E(2.5, 24, 4.5, 10, c)), s(E(27.5, 24, 4.5, 10, c)), R(0, 13, 4, 3, '#ff9ec0'), R(26, 13, 4, 3, '#ff9ec0')];
    case 'ponytail': return [head, s(E(3, 22, 4.5, 11, c), 1.4), R(3, 12, 4, 3, '#ffd66b')];
    case 'short': return [E(15, 12.5, 12, 10, c)];
    case 'spiky': return [E(15, 12.5, 12, 10, c), R(5, 1, 4, 5, c), R(11, 0, 4, 5, c), R(17, 0, 4, 5, c), R(22, 2, 4, 5, c)];
    case 'bun': return [head, E(15, 2.5, 5, 4, c), R(13, 5, 4, 1, d)];
    default: return [head];
  }
}

function hairFront(style, c) {
  const l = shade(c, 18);
  if (style === 'short' || style === 'spiky') return [R(5, 4, 20, 5, c), R(5, 8, 3, 4, c), R(9, 5, 5, 1, l)];
  return [R(5, 4, 21, 6, c), R(4, 8, 4, 9, c), R(22, 8, 4, 6, c), R(10, 5, 6, 1, l), R(18, 9, 3, 2, c)];
}

function eyes(style, color, mode) {
  if (mode === 'hurt') return [R(12, 16, 3, 1, INK), R(19, 16, 3, 1, INK), P(13, 15, INK), P(20, 15, INK), P(14, 17, INK), P(19, 17, INK)];
  if (mode === 'blink') return [R(12, 17, 3, 1, INK), R(19, 17, 3, 1, INK)];
  if (mode === 'happy') return [P(12, 17, INK), P(13, 16, INK), P(14, 17, INK), P(19, 17, INK), P(20, 16, INK), P(21, 17, INK)];
  const pair = (x) => {
    switch (style) {
      case 'round': return [R(x, 15, 3, 4, color), P(x, 15, '#ffffff')];
      case 'happy': return [P(x, 17, INK), P(x + 1, 16, INK), P(x + 2, 17, INK)];
      case 'sleepy': return [R(x, 17, 3, 1, INK), P(x + 2, 16, INK)];
      default: return [R(x, 14, 3, 1, INK), R(x, 15, 3, 4, color), R(x, 18, 3, 1, shade(color, -25)), P(x, 15, '#ffffff'), P(x + 2, 17, '#ffffff')];
    }
  };
  return [...pair(12), ...pair(19)];
}

function headShapes(look, g, rig) {
  const skin = look.skinTone ?? '#fff0e6';
  const hair = look.hairColor ?? '#e9ebfa';
  const style = look.hairStyle ?? 'bob';
  const hat = g.hat;
  const out = [];
  if (!hat || !TUCKS_HAIR.has(hat.design)) out.push(...hairBack(style, hair, rig.hair, rig.hairLift));
  if (hat) out.push(...hatBackShapes(hat.design, hat.color));
  out.push(E(15, 15, 10, 10, skin));
  out.push(...eyes(look.eyeStyle ?? 'sparkle', look.eyeColor ?? '#4fcfb8', rig.eyes));
  out.push(R(10, 20, 2, 1, '#ff9fb8'), R(22, 20, 2, 1, '#ff9fb8'));
  if (rig.eyes === 'hurt') out.push(E(17.5, 22, 1.5, 1, INK));
  else if (rig.mouth === 'open') out.push(R(16, 21, 3, 2, '#c25b78'), P(17, 22, '#ff9fb8'));
  else out.push(R(17, 21, 2, 1, '#c25b78'));
  if (!hat || hat.design !== 'bunny') out.push(...hairFront(style, hair));
  if (g.earring) out.push(...earringShapes(g.earring.design, g.earring.color));
  if (hat) out.push(...hatShapes(hat.design, hat.color));
  return out;
}

// ---------- Arms ----------

// An arm from the shoulder (sx, 26) to a hand offset (dx, dy) from its rest spot (sx + 1.5, 34).
function armShapes(sx, dx, dy, sleeve, g, skin) {
  const hx = sx + 1.5 + dx;
  const hy = 34 + dy;
  return [
    R(sx, 26, 3, 3, sleeve),
    R(sx + Math.round(dx * 0.5), 28 + Math.round(dy * 0.5), 3, 4, sleeve),
    ...handShapes(hx, hy, g.gloves, skin),
  ];
}

// Attack arms point along `angle` (0 = down, 90 = forward, 180 = up) from the shoulder.
function aimedArm(angle, sleeve, g, skin) {
  const rad = (angle * Math.PI) / 180;
  const hx = 20 + Math.sin(rad) * 7;
  const hy = 27 + Math.cos(rad) * 7;
  return {
    shapes: [E(20, 28, 2, 2, sleeve), E((20 + hx) / 2, (27 + hy) / 2, 2, 2, sleeve), ...handShapes(hx, hy, g.gloves, skin)],
    hand: [hx, hy],
  };
}

// ---------- Body parts per rig ----------

function bodyShapes(look, g, rig) {
  const skin = look.skinTone ?? '#fff0e6';
  const top = g.top;
  const sleeve = sleeveColor(top.design, top.color);
  const legs = legLook(g.bottom.design, g.bottom.color, skin);
  if (rig.view === 'back') return backShapes(look, g, rig, skin, sleeve, legs);

  // Everything above the hips leans with tx and bobs with by; the legs stay planted.
  const ux = rig.tx;
  const uy = rig.by;
  const shapes = [];
  if (g.cape) shapes.push(...offset(capeShapes(g.cape.design, g.cape.color, rig.cape, rig.flap), ux, uy));
  shapes.push(...offset(armShapes(8, rig.backArm[0], rig.backArm[1], shade(sleeve, -12), g, shade(skin, -6)), ux, uy));
  shapes.push(...offset(legShapes(11 + rig.backLeg[0], legs, g.shoes, true), 0, rig.backLeg[1]));
  shapes.push(...offset(legShapes(16 + rig.frontLeg[0], legs, g.shoes, false), 0, rig.frontLeg[1]));
  const skirt = skirtShapes(g.bottom.design, g.bottom.color);
  if (skirt) shapes.push(...offset(skirt, ux, uy));
  shapes.push(...offset(topShapes(top.design, top.color), ux, uy));
  shapes.push(...offset(headShapes(look, g, rig), ux + rig.hx, uy + rig.hy));
  return move(shapes, 0, 0);
}

const offset = (shapes, dx, dy) => shapes.map((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));

// Seen from behind on a rope: no face, hands reaching up the rope.
function backShapes(look, g, rig, skin, sleeve, legs) {
  const hair = look.hairColor ?? '#e9ebfa';
  const style = look.hairStyle ?? 'bob';
  const a = rig.climb;
  const out = [];
  out.push(R(8, 15 + a, 3, 13, sleeve), R(19, 15 - a, 3, 13, sleeve));
  out.push(...handShapes(9.5, 14 + a, g.gloves, skin), ...handShapes(20.5, 14 - a, g.gloves, skin));
  out.push(...legShapes(11, legs, g.shoes, true).map((s) => ({ ...s, y: s.y - a })));
  out.push(...legShapes(16, legs, g.shoes, false).map((s) => ({ ...s, y: s.y + a })));
  out.push(...topShapes('tee', g.top.color));
  if (g.cape && g.cape.design !== 'fairy' && g.cape.design !== 'angel') out.push(R(9, 26, 13, 15, g.cape.color), R(9, 40, 13, 1, shade(g.cape.color, -20)));
  if (!g.hat || !TUCKS_HAIR.has(g.hat.design)) out.push(...hairBack(style, hair, 0, 0));
  out.push(E(15, 13.5, 12.5, 11.5, hair));
  if (g.hat) out.push(...hatBackShapes(g.hat.design, g.hat.color), ...hatShapes(g.hat.design, g.hat.color));
  if (g.cape?.design === 'fairy' || g.cape?.design === 'angel') {
    const wing = capeShapes(g.cape.design, g.cape.color, 0, rig.flap);
    out.push(...wing, ...wing.map((s) => ({ ...s, x: 30 - s.x - (s.w ?? 0) })));
  }
  return move(out, 0, 0);
}

// ---------- Pose solving ----------

// Walk cycle tables, 8 frames: contact, down, passing, up, then the same on the other foot.
const WALK = {
  front: [[3, 0], [2, 0], [0, 0], [-2, 0], [-3, 0], [-2, -1], [0, -2], [2, -1]],
  back: [[-3, 0], [-2, -1], [0, -2], [2, -1], [3, 0], [2, 0], [0, 0], [-2, 0]],
  bob: [0, 1, 0, -1, 0, 1, 0, -1],
};

const ease = (t) => 1 - (1 - t) ** 3;

function baseRig() {
  return {
    view: 'side', tx: 0, by: 0, hx: 0, hy: 0,
    frontLeg: [0, 0], backLeg: [0, 0], frontArm: [0, 0], backArm: [0, 0],
    hair: 0, hairLift: 0, cape: 0, flap: false, eyes: 'open', mouth: null, climb: 0,
  };
}

function solveRig(state, anim) {
  const { pose = 'idle', time = 0, progress = 0, hurt = false, seed = 0 } = state;
  const r = baseRig();
  const t = time + seed * 1.37;
  r.hair = anim ? Math.round(Math.max(-3, Math.min(3, anim.hair))) : Math.round(Math.sin(t * 1.3) * 0.6);
  r.cape = anim ? Math.round(Math.max(-4, Math.min(4, anim.cape))) : Math.round(Math.sin(t * 1.1) * 0.8);
  r.flap = Math.floor(t * (pose === 'jump' ? 10 : 4)) % 2 === 0;
  // A blink every few seconds, slightly offset per character.
  const cycle = (t * 0.31) % 1;
  if (cycle < 0.035 || (cycle > 0.5 && cycle < 0.53 && seed % 2 === 0)) r.eyes = 'blink';

  if (pose === 'climb') {
    r.view = 'back';
    const f = Math.floor(((anim ? anim.climb : t * 20) / 10) % 4 + 4) % 4;
    r.climb = [2, 0, -2, 0][f];
    return r;
  }

  if (pose === 'walk') {
    const phase = anim ? walkPhase(anim) : (t * 2.7) % 1;
    const f = Math.floor(phase * 8) % 8;
    r.frontLeg = WALK.front[f];
    r.backLeg = WALK.back[f];
    r.by = WALK.bob[f];
    r.frontArm = [-Math.round(WALK.front[f][0] * 0.7), 0];
    r.backArm = [-Math.round(WALK.back[f][0] * 0.7), 0];
    r.tx = 1;
  } else if (pose === 'jump') {
    const vy = state.vy ?? -1;
    if (anim?.rise > 0 || vy < -250) {
      // Rising: stretched tall, legs tucked, arms swept back.
      r.by = -1;
      r.frontLeg = [1, -3];
      r.backLeg = [-1, -1];
      r.frontArm = [-2, -2];
      r.backArm = [-2, -3];
    } else if (vy < 120) {
      // Apex: a little ball.
      r.frontLeg = [2, -3];
      r.backLeg = [-1, -2];
      r.frontArm = [1, -3];
      r.backArm = [-1, -3];
    } else {
      // Falling: legs reach for the ground, arms out for balance, hair floats up.
      r.frontLeg = [1, -1];
      r.backLeg = [-2, 0];
      r.frontArm = [2, -4];
      r.backArm = [-3, -4];
      r.hairLift = -1;
    }
    r.mouth = 'open';
  } else {
    // Idle breathing: the upper body settles a pixel on each exhale, the arms follow.
    const breath = Math.sin(t * 2.4);
    r.by = breath > 0.3 ? 1 : 0;
    r.frontArm = [0, r.by];
    r.backArm = [0, r.by];
  }

  // Landing squash: the body drops and the legs spread.
  if (anim?.land > 0 && pose !== 'jump') {
    const k = anim.land > 0.06 ? 2 : 1;
    r.by = k;
    r.frontLeg = [r.frontLeg[0] + k, 0];
    r.backLeg = [r.backLeg[0] - k, 0];
    r.frontArm = [k, 1];
    r.backArm = [-k, 1];
  }

  if (hurt) {
    r.tx = -1;
    r.hx = -1;
    r.eyes = 'hurt';
    r.frontArm = [-1, -2];
    r.backArm = [-2, -2];
  }

  if (pose === 'swing') {
    if (progress < 0.3) {
      // Anticipation: lean back and wind up.
      r.tx = -1;
      r.by = 0;
      r.backArm = [-2, -1];
    } else if (progress < 0.7) {
      // The strike: lunge forward and dip.
      r.tx = 2;
      r.by = 1;
      r.frontLeg = [3, 0];
      r.backLeg = [-2, 0];
      r.backArm = [-3, -1];
      r.mouth = 'open';
    } else {
      r.tx = 1;
      r.frontLeg = [2, 0];
      r.backLeg = [-1, 0];
    }
  } else if (pose === 'shoot') {
    r.tx = progress < 0.25 ? -1 : 0;
    r.frontLeg = [2, 0];
    r.backLeg = [-2, 0];
    r.backArm = [2, -3];
  } else if (pose === 'cast') {
    // Rise on tiptoe with the free arm open; hair and cape lift in the magic wind.
    r.by = progress > 0.2 && progress < 0.8 ? -1 : 0;
    r.backArm = [-2, -4];
    r.hairLift = -1;
    r.cape = r.cape - 2;
    r.mouth = 'open';
  }
  return r;
}

function rigKey(r) {
  return [r.view, r.tx, r.by, r.hx, r.hy, ...r.frontLeg, ...r.backLeg, ...r.backArm, r.hair, r.hairLift, r.cape, r.flap ? 1 : 0, r.eyes, r.mouth, r.climb].join(',');
}

// ---------- Weapons ----------

function weaponSprite(w, time) {
  const frames = weaponFrames(w.type, w.tier);
  const frame = frames > 1 ? Math.floor(time * 9) % frames : 0;
  const def = weaponShapes(w.type, w.color, w.tier, null, frame);
  if (!def) return null;
  const s = sprite(`weapon|${w.type}|${w.tier}|${frame}`, () => ({ w: def.w, h: def.h, shapes: def.shapes }));
  return { ...s, grip: def.grip, blade: def.blade };
}

// Elemental weapons always glow softly in their element's color.
function elementGlow(ctx, wpn, element, time, scale) {
  const glow = tinted(wpn, ELEMENTS[element].glow);
  const ox = -(wpn.grip[0] + 1) * scale;
  const oy = -(wpn.grip[1] + 1) * scale;
  const base = ctx.globalAlpha;
  ctx.globalAlpha = base * (0.3 + 0.2 * Math.sin(time * 4));
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.drawImage(glow, ox + dx * scale, oy + dy * scale, wpn.canvas.width * scale, wpn.canvas.height * scale);
  ctx.globalAlpha = base;
}

// Rarity effects drawn in the weapon's rotated frame (grip at the origin, tip toward -y).
// Rare: a glint sweeps up the weapon. Epic: a glowing outline and motes circling the tip.
// Legendary: a stronger pulsing aura and sparkles rising off the whole weapon.
function weaponGlow(ctx, wpn, rarity, time, scale, draw) {
  const color = RARITIES[rarity].color;
  const ox = -(wpn.grip[0] + 1) * scale;
  const oy = -(wpn.grip[1] + 1) * scale;
  const w = wpn.canvas.width * scale;
  const h = wpn.canvas.height * scale;
  if (rarity >= 2) {
    const pulse = 0.5 + 0.5 * Math.sin(time * (rarity >= 3 ? 5 : 3));
    const glow = tinted(wpn, color);
    const reach = rarity >= 3 ? 2 : 1;
    const base = ctx.globalAlpha;
    ctx.globalAlpha = base * (0.35 + 0.35 * pulse);
    for (let r = 1; r <= reach; r++) {
      for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) ctx.drawImage(glow, ox + dx * scale, oy + dy * scale, w, h);
    }
    ctx.globalAlpha = base;
  }
  draw(ox, oy, w, h);
  const len = (wpn.grip[1] - 4) * scale;
  ctx.fillStyle = '#ffffff';
  // Glint sliding from grip to tip.
  const p = (time * 0.9) % 1.6;
  if (p < 1) {
    const gy = -p * len;
    const k = Math.sin(p * Math.PI) * 2 * scale;
    ctx.fillRect(-0.5 * scale, gy - k, scale, k * 2 + scale);
    ctx.fillRect(-k, gy, k * 2 + scale, scale);
  }
  if (rarity >= 2) {
    ctx.fillStyle = color;
    const n = rarity >= 3 ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const a = time * 3 + (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(Math.cos(a) * 7 * scale), Math.round(-len * 0.85 + Math.sin(a) * 4 * scale), scale * 1.5, scale * 1.5);
    }
  }
  if (rarity >= 3) {
    for (let i = 0; i < 5; i++) {
      const k = (time * 0.7 + i / 5) % 1;
      ctx.fillStyle = i % 2 ? '#ffffff' : color;
      ctx.globalAlpha *= 1 - k;
      ctx.fillRect(Math.round(Math.sin(i * 2.3 + time) * 5 * scale), Math.round(-len * (i / 5) - k * 10 * scale), scale, scale);
      ctx.globalAlpha /= Math.max(0.01, 1 - k);
    }
  }
}

// Weapon angle (degrees, 0 = up, positive tips forward) and attack arm angle for a pose.
function weaponPose(type, pose, progress) {
  if (pose === 'swing') {
    if (progress < 0.3) {
      const t = ease(progress / 0.3);
      return { weapon: 25 - 110 * t, arm: 40 + 125 * t };
    }
    const t = ease(Math.min(1, (progress - 0.3) / 0.35));
    return { weapon: -85 + 235 * t, arm: 165 - 120 * t };
  }
  if (pose === 'shoot') {
    const pull = progress < 0.25 ? -6 : 0;
    return { weapon: type === 'bow' || type === 'crossbow' ? 0 : 90, arm: 95 + pull };
  }
  if (pose === 'cast') return { weapon: -25 + ease(Math.min(1, progress * 1.6)) * 35, arm: 150 };
  return null;
}

// ---------- Public drawing ----------

// look: appearance; gear: equipment map or null.
// state: { pose, time, facing, progress, hurt, flash, alpha, scale, seed, vy }; anim: from createAnim().
// (x, y) is the character's feet center in screen space.
export function drawHero(ctx, look, gear, x, y, state, anim = null) {
  const { pose = 'idle', facing = 1, progress = 0, alpha = 1, scale = 1 } = state;
  const attack = pose === 'swing' || pose === 'shoot' || pose === 'cast';
  const g = resolveGear(look, gear);
  const rig = solveRig(state, anim);
  const lookKey = JSON.stringify(look);
  const gk = gearKey(gear);
  const body = sprite(`hero|${lookKey}|${gk}|${rigKey(rig)}`, () => ({ w: W, h: H, shapes: bodyShapes(look, g, rig) }));

  const flip = facing < 0;
  const left = x - (W / 2) * scale;
  const top = y - H * scale;
  // Mirror a point given in body coordinates when facing left.
  const sx = (px) => (flip ? left + (W - (px + OX)) * scale : left + (px + OX) * scale);
  const sy = (py) => top + (py + OY) * scale;

  const skin = look.skinTone ?? '#fff0e6';
  const sleeve = sleeveColor(g.top.design, g.top.color);
  const wpn = g.weapon && rig.view !== 'back' ? weaponSprite(g.weapon, state.time ?? 0) : null;
  const angles = attack ? weaponPose(g.weapon?.type, pose, progress) : null;

  // Front arm layer.
  let armShapesNow;
  let hand;
  let armKey;
  if (angles) {
    const aimed = aimedArm(angles.arm, sleeve, g, skin);
    armShapesNow = aimed.shapes;
    hand = [aimed.hand[0] + rig.tx, aimed.hand[1] + rig.by];
    armKey = `a${Math.round(angles.arm / 5)}`;
  } else {
    armShapesNow = armShapes(19, rig.frontArm[0], rig.frontArm[1], sleeve, g, skin);
    hand = [20.5 + rig.frontArm[0] + rig.tx, 34 + rig.frontArm[1] + rig.by];
    armKey = `r${rig.frontArm.join(',')}`;
  }
  const armDx = rig.tx;
  const armDy = rig.by;

  const restAngle = { bow: 60, crossbow: 10, claw: 70 }[g.weapon?.type] ?? 25;
  const weaponAngle = angles ? angles.weapon : restAngle + rig.frontArm[0] * 4 + (pose === 'jump' ? -15 : 0);

  const drawWeapon = () => {
    if (!wpn) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(sx(hand[0])), Math.round(sy(hand[1])));
    if (flip) ctx.scale(-1, 1);
    ctx.rotate((weaponAngle * Math.PI) / 180);
    const time = state.time ?? 0;
    const paint = (ox, oy, w, h) => ctx.drawImage(wpn.canvas, ox, oy, w, h);
    const el = g.weapon.element;
    if (el) elementGlow(ctx, wpn, el, time, scale);
    if (g.weapon.rarity) weaponGlow(ctx, wpn, g.weapon.rarity, time, scale, paint);
    else paint(-(wpn.grip[0] + 1) * scale, -(wpn.grip[1] + 1) * scale, wpn.canvas.width * scale, wpn.canvas.height * scale);
    if (el && wpn.blade) drawElementAura(ctx, el, (wpn.blade[0] - wpn.grip[1]) * scale, (wpn.blade[1] - wpn.grip[1]) * scale, time, scale);
    ctx.restore();
  };

  // Weapon trail: remember where the tip was during a swing, drawn as a fading ribbon.
  if (anim && wpn && pose === 'swing' && progress > 0.28 && progress < 0.75) {
    const len = (wpn.grip[1] - 6) * scale;
    const rad = (weaponAngle * Math.PI) / 180;
    const tipX = sx(hand[0]) + Math.sin(rad) * len * (flip ? -1 : 1);
    const tipY = sy(hand[1]) - Math.cos(rad) * len;
    anim.trail.push({ dx: tipX - x, dy: tipY - y, hx: sx(hand[0]) - x, hy: sy(hand[1]) - y, age: 0 });
  }
  if (anim && anim.trail.length > 1) drawTrail(ctx, anim.trail, x, y, g.weapon?.color ?? '#ffffff');

  if (wpn && !attack && rig.view !== 'back') drawWeapon();
  blit(ctx, body, left, top, { flip, flash: state.flash ?? 0, alpha, scale });
  if (rig.view === 'back') return;
  if (attack) drawWeapon();
  const arm = sprite(`arm|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(armShapesNow, 0, 0) }));
  blit(ctx, arm, left + (flip ? -armDx : armDx) * scale, top + armDy * scale, { flip, flash: state.flash ?? 0, alpha, scale });
}

function drawTrail(ctx, trail, x, y, color) {
  ctx.save();
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    const fade = 1 - b.age / 0.14;
    ctx.globalAlpha = Math.max(0, fade) * 0.7;
    ctx.fillStyle = i % 2 ? '#ffffff' : shade(color, 30);
    ctx.beginPath();
    // A quad between two tip samples and points two-thirds of the way down the blade.
    const mid = (p) => [x + p.hx + (p.dx - p.hx) * 0.45, y + p.hy + (p.dy - p.hy) * 0.45];
    const [am, an] = mid(a);
    const [bm, bn] = mid(b);
    ctx.moveTo(x + a.dx, y + a.dy);
    ctx.lineTo(x + b.dx, y + b.dy);
    ctx.lineTo(bm, bn);
    ctx.lineTo(am, an);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
