// The hero (and NPCs): a chibi body built from shapes, colored by appearance and equipped gear,
// with poses for idle, walk, jump, climb, hurt, and attacks. Weapons are separate sprites so they
// can swing around the hand.

import { ITEMS } from '../data/items.js';
import { R, E, P, sprite, blit, shade } from './pixel.js';

export const HAIR_STYLES = ['bob', 'wavy', 'twintails', 'ponytail', 'short', 'spiky', 'bun', 'long'];
export const EYE_STYLES = ['sparkle', 'round', 'happy', 'sleepy'];

const W = 30;
const H = 48;
const INK = '#3a2d4f';

// ---------- Body ----------

function hairBack(style, c) {
  const d = shade(c, -18);
  const head = E(15, 13.5, 12.5, 11.5, c);
  switch (style) {
    case 'bob': return [head, R(3, 13, 24, 11, c), R(3, 22, 24, 2, d)];
    case 'wavy': return [head, R(2, 13, 26, 18, c), R(2, 28, 4, 4, c), R(24, 28, 4, 4, c), R(2, 26, 26, 2, d)];
    case 'long': return [head, R(3, 13, 24, 24, c), R(3, 34, 24, 2, d)];
    case 'twintails': return [head, E(2.5, 24, 4.5, 10, c), E(27.5, 24, 4.5, 10, c), R(0, 13, 4, 3, '#ff9ec0'), R(26, 13, 4, 3, '#ff9ec0')];
    case 'ponytail': return [head, E(3, 22, 4.5, 11, c), R(3, 12, 4, 3, '#ffd66b')];
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

function eyes(style, color, hurt) {
  if (hurt) return [R(12, 16, 3, 1, INK), R(19, 16, 3, 1, INK), P(13, 15, INK), P(20, 15, INK)];
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

function gearColors(look, gear) {
  const color = (slot, fallback) => (gear?.[slot] ? ITEMS[gear[slot].id].color : fallback);
  const outfit = look.outfitColor ?? '#ffc2d6';
  return {
    top: color('top', outfit),
    bottom: color('bottom', shade(outfit, -22)),
    shoes: color('shoes', '#fffaf0'),
    gloves: gear?.gloves ? ITEMS[gear.gloves.id].color : null,
    hat: gear?.hat ? ITEMS[gear.hat.id].color : null,
    cape: gear?.cape ? ITEMS[gear.cape.id].color : null,
  };
}

// Leg and arm offsets for each pose/frame.
function limbs(pose, frame) {
  if (pose === 'walk') {
    const steps = [[-2, 0, 2, -1], [0, -1, 0, 0], [2, -1, -2, 0], [0, 0, 0, -1]];
    const [l1x, l1y, l2x, l2y] = steps[frame % 4];
    return { legs: [[l1x, l1y], [l2x, l2y]], bob: frame % 2 ? -1 : 0, arm: frame % 2 ? 1 : -1 };
  }
  if (pose === 'jump') return { legs: [[-1, -3], [2, -1]], bob: 0, arm: -3 };
  return { legs: [[0, 0], [0, 0]], bob: pose === 'idle' && frame % 2 ? 1 : 0, arm: 0 };
}

function bodyShapes(look, gear, pose, frame, hurt) {
  const skin = look.skinTone ?? '#fff0e6';
  const hair = look.hairColor ?? '#e9ebfa';
  const style = look.hairStyle ?? 'bob';
  const g = gearColors(look, gear);
  const hand = g.gloves ?? skin;
  const shapes = [];

  if (pose === 'climb') {
    // Back view on a rope: no face, arms reaching up.
    const a = frame % 2 ? 2 : -2;
    if (g.cape) shapes.push(R(8, 26, 15, 15, g.cape));
    shapes.push(R(8, 16 + a, 3, 12, g.top), R(19, 16 - a, 3, 12, g.top), E(9.5, 15 + a, 2, 2, hand), E(20.5, 15 - a, 2, 2, hand));
    shapes.push(R(11, 36, 4, 8 - a, g.bottom), R(16, 36, 4, 8 + a, g.bottom), R(10, 43 - a, 6, 3, g.shoes), R(16, 43 + a, 6, 3, g.shoes));
    shapes.push(R(10, 25, 11, 12, g.top));
    shapes.push(...hairBack(style, hair), E(15, 13.5, 12.5, 11.5, hair));
    if (g.hat) shapes.push(E(15, 4, 10, 4.5, g.hat));
    return shapes;
  }

  const { legs, bob, arm } = limbs(pose, frame);
  const y = bob;
  if (g.cape) shapes.push(R(7, 26 + y, 16, 15, g.cape), R(7, 40 + y, 16, 1, shade(g.cape, -20)));
  shapes.push(...hairBack(style, hair).map((s) => ({ ...s, y: s.y + y })));
  // Back arm
  shapes.push(R(8, 26 + y - arm, 3, 8, shade(g.top, -12)), E(9.5, 34 + y - arm, 2, 2, hand));
  // Legs and shoes
  legs.forEach(([lx, ly], i) => {
    const x = i === 0 ? 11 : 16;
    shapes.push(R(x + lx, 36 + ly, 4, 8, i === 0 ? shade(g.bottom, -10) : g.bottom), R(x - 1 + lx, 44 + ly, 6, 3, g.shoes));
  });
  // Torso with a little collar and belt
  shapes.push(R(10, 25 + y, 11, 12, g.top), R(13, 25 + y, 5, 2, shade(g.top, 18)), R(10, 34 + y, 11, 1, shade(g.top, -20)));
  // Head and face
  shapes.push(E(15, 15 + y, 10, 10, skin));
  shapes.push(...eyes(look.eyeStyle ?? 'sparkle', look.eyeColor ?? '#4fcfb8', hurt).map((s) => ({ ...s, y: s.y + y })));
  shapes.push(R(10, 20 + y, 2, 1, '#ff9fb8'), R(22, 20 + y, 2, 1, '#ff9fb8'));
  shapes.push(hurt ? R(16, 22 + y, 3, 1, INK) : R(17, 21 + y, 2, 1, '#c25b78'));
  shapes.push(...hairFront(style, hair).map((s) => ({ ...s, y: s.y + y })));
  if (g.hat) shapes.push(E(15, 4 + y, 10, 4.5, g.hat), R(5, 6 + y, 21, 2, shade(g.hat, -18)), P(11, 2 + y, shade(g.hat, 25)));
  // Front arm (drawn after the torso so it overlaps it)
  if (pose !== 'attack') {
    shapes.push(R(19, 26 + y + arm, 3, 8, g.top), E(20.5, 34 + y + arm, 2, 2, hand));
  }
  return shapes;
}

// Attack poses draw the front arm separately so it can point where the weapon is.
function armShapes(look, gear, angle) {
  const g = gearColors(look, gear);
  const hand = g.gloves ?? (look.skinTone ?? '#fff0e6');
  // A short arm from the shoulder at (20, 27), pointing along `angle` (0 = down, 90 = forward).
  const rad = (angle * Math.PI) / 180;
  const hx = 20 + Math.sin(rad) * 7;
  const hy = 27 + Math.cos(rad) * 7;
  return { shapes: [E(20, 28, 2, 2, g.top), E((20 + hx) / 2, (27 + hy) / 2, 2, 2, g.top), E(hx, hy, 2, 2, hand)], hand: [hx, hy] };
}

// ---------- Weapons ----------
// Weapon sprites point straight up with the grip near the bottom; we rotate them around the grip.

function weaponShapes(type, color) {
  const wood = '#a0703f';
  const gold = '#ffd66b';
  const light = shade(color, 22);
  switch (type) {
    case 'sword': return { w: 9, h: 26, grip: [4, 22], shapes: [R(3, 1, 3, 17, color), R(4, 1, 1, 16, light), P(4, 0, light), R(0, 18, 9, 2, gold), R(3, 20, 3, 5, wood), E(4.5, 25, 2, 1.5, gold)] };
    case 'axe': return { w: 14, h: 26, grip: [6, 22], shapes: [R(5, 2, 3, 24, wood), E(10, 6, 4, 5, color), R(7, 2, 3, 8, color), P(12, 4, light)] };
    case 'spear': return { w: 9, h: 34, grip: [4, 26], shapes: [R(3, 8, 3, 26, wood), E(4.5, 4, 3, 5, color), R(4, 0, 1, 4, light), R(1, 9, 7, 1, gold)] };
    case 'wand': return { w: 8, h: 20, grip: [3, 16], shapes: [R(3, 6, 2, 14, wood), E(4, 4, 3.5, 3.5, color), P(3, 3, '#ffffff')] };
    case 'staff': return { w: 10, h: 32, grip: [4, 22], shapes: [R(4, 8, 2, 24, wood), E(5, 5, 4.5, 4.5, color), P(4, 3, '#ffffff'), R(2, 9, 6, 1, gold)] };
    case 'bow': return { w: 10, h: 28, grip: [3, 14], shapes: [E(4, 14, 5, 13, color), E(6, 14, 4, 11, 'none'), R(7, 2, 1, 24, '#fff6fb'), R(2, 12, 3, 4, wood)] };
    case 'crossbow': return { w: 18, h: 16, grip: [4, 10], shapes: [R(0, 7, 16, 3, wood), R(12, 0, 3, 16, color), R(13, 1, 1, 14, light), R(2, 10, 3, 4, wood)] };
    case 'dagger': return { w: 7, h: 15, grip: [3, 12], shapes: [R(2, 1, 3, 8, color), R(3, 1, 1, 7, light), P(3, 0, light), R(0, 9, 7, 1, gold), R(2, 10, 3, 4, wood)] };
    case 'claw': return { w: 10, h: 12, grip: [4, 8], shapes: [R(1, 4, 8, 6, color), R(1, 0, 2, 5, light), R(4, 0, 2, 5, light), R(7, 0, 2, 5, light)] };
    default: return null;
  }
}

function weaponSprite(type, color) {
  const def = weaponShapes(type, color);
  if (!def) return null;
  const s = sprite(`weapon|${type}|${color}`, () => ({ w: def.w, h: def.h, shapes: def.shapes }));
  return { ...s, grip: def.grip };
}

// Angle (degrees, 0 = pointing up, positive = tipping forward) and arm angle for the current pose.
function weaponPose(type, pose, progress) {
  const ranged = type === 'bow' || type === 'crossbow' || type === 'claw';
  if (pose === 'swing') {
    if (progress < 0.35) return { weapon: -75, arm: 160 };
    const t = Math.min(1, (progress - 0.35) / 0.4);
    return { weapon: -75 + 220 * t, arm: 160 - 110 * t };
  }
  if (pose === 'shoot') return { weapon: type === 'crossbow' ? 0 : ranged ? 0 : 90, arm: 95 };
  if (pose === 'cast') return { weapon: -20 + progress * 30, arm: 150 };
  return { weapon: 25, arm: 20 };
}

// ---------- Public drawing ----------

// look: appearance; gear: equipment map or null; state: { pose, frame, facing, progress, hurt, flash, alpha }
// (x, y) is the character's feet center in screen space.
export function drawHero(ctx, look, gear, x, y, state) {
  const { pose = 'idle', frame = 0, facing = 1, progress = 0, hurt = false, alpha = 1, scale = 1 } = state;
  const attack = pose === 'swing' || pose === 'shoot' || pose === 'cast';
  const bodyPose = attack ? 'idle' : pose;
  const key = `hero|${JSON.stringify(look)}|${gearKey(gear)}|${pose}|${frame % 4}|${hurt}`;
  const body = sprite(key, () => ({ w: W, h: H, shapes: bodyShapes(look, gear, attack ? 'attack' : bodyPose, frame, hurt) }));

  const flip = facing < 0;
  const left = x - (W / 2) * scale;
  const top = y - H * scale;
  // Mirror a point inside the sprite box when facing left.
  const sx = (px) => (flip ? left + (W - px) * scale : left + px * scale);
  const sy = (py) => top + py * scale;

  const wType = gear?.weapon ? ITEMS[gear.weapon.id].weaponType : null;
  const wColor = gear?.weapon ? ITEMS[gear.weapon.id].color : null;
  const wpn = wType && pose !== 'climb' ? weaponSprite(wType, wColor) : null;
  const angles = weaponPose(wType, pose, progress);

  let hand = [20.5, 34 + (pose === 'walk' ? (frame % 2 ? 1 : -1) : 0)];
  let arm = null;
  if (attack) {
    arm = armShapes(look, gear, angles.arm);
    hand = arm.hand;
  }

  const drawWeapon = () => {
    if (!wpn) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(sx(hand[0]), sy(hand[1]));
    if (flip) ctx.scale(-1, 1);
    ctx.rotate((angles.weapon * Math.PI) / 180);
    ctx.drawImage(wpn.canvas, -(wpn.grip[0] + 1) * scale, -(wpn.grip[1] + 1) * scale, wpn.canvas.width * scale, wpn.canvas.height * scale);
    ctx.restore();
  };

  // Idle weapons sit behind the body; attacking weapons swing in front.
  if (!attack) drawWeapon();
  blit(ctx, body, left, top, { flip, flash: state.flash ?? 0, alpha, scale });
  if (attack) {
    drawWeapon();
    const armSprite = sprite(`arm|${JSON.stringify(look)}|${gearKey(gear)}|${Math.round(angles.arm / 5)}`, () => ({ w: W, h: H, shapes: arm.shapes }));
    blit(ctx, armSprite, left, top, { flip, alpha, scale });
  }
}

function gearKey(gear) {
  if (!gear) return '-';
  return ['top', 'bottom', 'shoes', 'gloves', 'hat', 'cape'].map((s) => gear[s]?.id ?? '').join(',');
}
