// The Wagashi Sprites: the Mochi redraw (2026-11-09). Little spirits born from fresh-pounded mochi.
// No two look alike: every egg rolls its genes (data/mochi-genes.js), and this file turns them into
// a look on the hero's body like every companion: its own hair (hair.js MOCHI_HAIR), its own eyes
// and mouths (hero.js), a plain smock in its rolled colour (jobgear/mochi.js), and the mood sprout
// growing from the top of its head. No hats: the hoods in jobgear/mochi.js are dress-up.
// Rare coats get a little light of their own (`drawCoat`): a shiny coat twinkles, a candied coat
// glints in its gem colour, and a Moonlit one has moon motes drifting up round it.

import { R, E, T, F, mix } from './pixel.js';
import { limb } from './figure.js';
import { art, place } from './scenery.js';
import { HAIR_COLORS, CANDY } from '../data/mochi-genes.js';
import { featureOf } from './mochi-features.js';

// The sprout's mood for each personality when it's just standing about.
export const RESTING_MOOD = {
  playful: 'happy', shy: 'calm', proud: 'happy', sleepy: 'sleepy', curious: 'curious', bossy: 'excited', gentle: 'calm', showoff: 'excited',
  clumsy: 'happy', brave: 'excited', grumpy: 'sad', dreamy: 'calm', cheeky: 'curious', timid: 'sad', bubbly: 'excited', stoic: 'calm',
  foodie: 'happy', sassy: 'curious', lazy: 'sleepy', hyper: 'excited', polite: 'calm', mischief: 'curious', clingy: 'happy', loner: 'calm',
  artsy: 'curious', sporty: 'excited', nosy: 'curious', dramatic: 'excited', cool: 'calm', sweet: 'happy', chatty: 'happy', sneaky: 'curious',
};

// The look a Mochi's genes draw as. `mood` sets the sprout (its personality's resting mood when
// left out); `phase` (0-1) is where a Kohakutou coat is in its slow turn through the colours.
// Each coat's look:
//   shiny        a pearly dough; twinkles
//   twoflavour   the far half of the hair in a second colour
//   candied      glassy gem-coloured hair, white shine
//   goldleaf     flakes of gold leaf in the hair and on the cheeks; gold glints
//   glassjelly   crystal-clear hair, white shine; a bubble drifting up inside it
//   sakura       the hair fading to blossom pink at the ends; petals drifting off
//   moonlit      silver hair and dough, gold star eyes, a gold sprout; a crescent moon behind, motes
//   hanabi       night-navy hair; little fireworks bursting off the ends
//   radiant      becomes Halo Dawn on the angel path (white-gold hair, a soft glow, feathers drifting
//                down) or Ember Spice on the demon path (ember-red hair, sparks drifting up); a
//                Mochiko not yet on a path only twinkles gold and red
//   kohakutou    crystal candy hair turning slowly through pastel jewel colours (mythic)
//   goma, kurozato, yoru   the Mutations: the whole Mochi dark with glowing eyes (see MUTANT)
export const KOHAKU = ['#ffb8d8', '#d0bcff', '#a8e4ff', '#b4f0c8', '#fff0a0', '#ffcca8'];
// The Mutations' colours: dough, hair, hair tip, eyes (and their pupils).
export const MUTANT = {
  // Black Sesame: near-black dough, black hair speckled all over with white sesame seeds.
  goma: { dough: '#2e2a32', hair: '#18161c', tip: null, eyes: '#f2c94c', marks: 'seeds' },
  // Brown Sugar: glossy caramel hair darkening to syrup at the ends.
  kurozato: { dough: '#7a5038', hair: '#e09a4c', tip: '#8a3e22', eyes: '#ffd27a', gloss: true },
  // Midnight: royal-blue dough, navy hair full of tiny stars, like the night sky.
  yoru: { dough: '#4a5ccc', hair: '#1a1c3a', tip: '#6a58b8', eyes: '#fff3a8', pupil: 'star', marks: 'stars' },
  // Red Plum: rose-red dough, snow-white hair tipped pink, a plum blossom tucked in it.
  beniume: { dough: '#d8485e', hair: '#f6eef4', tip: '#ff9ab8', eyes: '#fff0a0', pupil: 'heart', marks: 'blossom' },
  // Deep Sea: turquoise dough, navy hair with glowing aqua ends, deep blue eyes, glowing dots on the cheeks.
  shinkai: { dough: '#33aaa4', hair: '#16304a', tip: '#5ae0d0', eyes: '#21407a', pupil: 'ring', gloss: true, spots: true },
};
export function coatOf(g) {
  if (g.coat !== 'radiant') return g.coat;
  return g.path === 'angel' ? 'dawn' : g.path === 'demon' ? 'ember' : 'radiant';
}
export function lookOf(g, mood = null, phase = 0) {
  const coat = coatOf(g);
  const moon = coat === 'moonlit';
  const candy = coat === 'candied' ? CANDY[g.candy] : null;
  const hairOwn = HAIR_COLORS[g.hairColor];
  const hair = {
    moonlit: '#c9d4f8', candied: candy, glassjelly: '#cdeefa', hanabi: '#283060', dawn: '#fff4d6', ember: '#b8281a',
    kohakutou: KOHAKU[Math.floor(((phase % 1) + 1) % 1 * KOHAKU.length)],
  }[coat] ?? hairOwn;
  const look = {
    outfit: 'mochismock',
    outfitColor: g.smock,
    hairStyle: g.hair,
    hairBangs: g.fringe,
    hairColor: hair,
    eyeStyle: g.eyes,
    eyeColor: moon ? '#e8b84a' : g.eyeColor,
    browStyle: g.brows,
    face: 'smile',
    mouth: g.mouth,
    skinTone: moon ? '#eef0ff' : coat === 'shiny' ? mix(g.dough, '#ffffff', 0.45) : g.dough,
    sprout: { leaf: moon || coat === 'dawn' ? 'gold' : g.sprout, mood: mood ?? RESTING_MOOD[g.personality] ?? 'calm' },
  };
  if (['moonlit', 'candied', 'glassjelly', 'dawn', 'kohakutou'].includes(coat)) look.hairGloss = true;
  const tip = {
    moonlit: '#ffffff', candied: candy && mix(candy, '#ffffff', 0.55), glassjelly: '#ffffff', sakura: '#ffc4d6', hanabi: '#6a58b8', dawn: '#ffd27a', ember: '#ffb040', kohakutou: '#ffffff',
  }[coat] ?? (g.hairTip && coat !== 'twoflavour' ? HAIR_COLORS[g.hairTip] : null);
  if (tip) look.hairTip = tip;
  if (coat === 'twoflavour') look.hairSplit = HAIR_COLORS[g.hairTip ?? g.hairColor2 ?? 'sakura'];
  if (coat === 'goldleaf') look.goldLeaf = true;
  if (g.eyeColor2 && !moon) look.eyeColor2 = g.eyeColor2;
  if (g.cheek) look.cheek = g.cheek;
  if (moon || g.pupil) look.pupil = moon ? 'star' : g.pupil;
  if (!moon && (['matcha', 'yomogi', 'mint'].includes(g.hairColor) || g.candy === 'jade')) look.sprout.pale = true;
  // On a path (grown on it, or a Mochiko leaning that way), its sprout shows it; a Mochi already
  // wearing a halo has no tiny ring over its sprout too.
  // (`lean` is a number while it's being raised, data/mochi-raise.js: it shows past 0.35 either way.)
  const lean = typeof g.lean === 'number' ? (g.lean >= 0.35 ? 'angel' : g.lean <= -0.35 ? 'demon' : null) : g.lean ?? null;
  const way = g.stage === 'amamochi' || g.stage === 'karamochi' || g.stage === 'tsukimochi' ? g.path : lean;
  if (way === 'angel' || way === 'demon') {
    look.sprout.path = way;
    if (featureOf(g) === 'halo') look.sprout.ring = false;
  }
  // The Tsukimochi glows softly, like the moon: a pearly sheen on its dough and hair.
  if (g.stage === 'tsukimochi') {
    look.skinTone = mix(look.skinTone, g.path === 'demon' ? '#ece2ff' : '#fffaf0', 0.35);
    look.hairGloss = true;
    look.sprout.ring = false;
    look.sprout.moon = g.path === 'demon' ? 'dusk' : 'dawn';
  }
  const mu = MUTANT[coat];
  if (mu) {
    Object.assign(look, { skinTone: mu.dough, hairColor: mu.hair, eyeColor: mu.eyes, lightMouth: true });
    delete look.eyeColor2;
    if (mu.tip) look.hairTip = mu.tip;
    else delete look.hairTip;
    if (mu.pupil) look.pupil = mu.pupil;
    if (mu.gloss) look.hairGloss = true;
    if (mu.marks) look.hairMarks = mu.marks;
    if (mu.spots) look.glowSpots = true;
  }
  return look;
}

// Babies are a size down from the grown forms (the hero is 1, Snow wolf 0.72).
export const MOCHI_SIZE = { baby: 0.5, grown: 0.6 };

// ---------- Rare coats ----------
// (Everything below is drawn live over the sprite in small fixed steps: nothing is painted into a
// sprite, so the effects cost nothing to repaint.)
const step = (u, n) => Math.floor((((u % 1) + 1) % 1) * n) / n;
// A four-point twinkle.
function twinkle(ctx, x, y, r, c) {
  const k = r * 0.3;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + k, y - k);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + k, y + k);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - k, y + k);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - k, y - k);
  ctx.closePath();
  ctx.fill();
}
const dot = (ctx, x, y, r, c, a = 1) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};
// Where the twinkles sit round the head (body px from the feet, facing right), each with its own
// beat so they never blink together.
const GLINTS = [[-9, -38, 0], [10, -31, 0.37], [-11, -24, 0.71]];
const GLINT_COLOR = { goma: '#ffe680', kurozato: '#ffc870', yoru: '#c8e8ff', beniume: '#ffd0e0', shinkai: '#a8fff0', shiny: '#ffffff', twoflavour: '#ffffff', goldleaf: '#ffe680', glassjelly: '#ffffff', sakura: '#ffe0ea', moonlit: '#fff3c4', hanabi: '#fff3c4', dawn: '#fff6d8', ember: '#ffcf6a', kohakutou: '#ffffff' };
// What a rare coat puts behind the Mochi (drawn before it): the Moonlit crescent and the Halo
// Dawn glow.
export function drawCoatBack(ctx, g, x, y, s, time = 0) {
  const coat = coatOf(g);
  if (coat === 'kohakutou') {
    // A soft glow behind, shifting through the same jewel colours.
    ctx.save();
    dot(ctx, x, y - 30 * s, 20 * s, KOHAKU[Math.floor(step(time * 0.1, KOHAKU.length) * KOHAKU.length)], 0.18);
    ctx.restore();
  }
  if (coat === 'dawn') {
    ctx.save();
    for (const [rr, a] of [[22, 0.14], [15, 0.2]]) dot(ctx, x, y - 30 * s, rr * s, '#fff1c0', a);
    ctx.restore();
  }
  if (coat !== 'moonlit') return;
  const [cx, cy, r] = [x - 10 * s, y - 43 * s, 8.5 * s];
  ctx.save();
  dot(ctx, cx, cy, r * 1.5, '#fff3c4', 0.22);
  ctx.restore();
  // The moon itself is a pixel sprite like everything else (only its glow is soft).
  ctx.save();
  ctx.translate(cx, cy + 10 * s);
  ctx.scale(s, s);
  place(ctx, art('mochi-moon', 20, 20, moonShapes, false), 0, 0);
  ctx.restore();
}
// A crescent moon, 20 x 20, its horns to the right.
function moonShapes() {
  const arcPts = (cx, cy, r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
  });
  return [T([...arcPts(10, 10, 8.5, 62, 298), ...arcPts(14.2, 9.4, 7, 250, 110)], '#fff3c4'), F(T([...arcPts(10, 10, 7.2, 120, 240, 8), ...arcPts(10.8, 10, 6.6, 232, 128, 8)], '#ffffff'))];
}
// Draws a rare coat's light over a Mochi standing at (x, y), `s` its size, at `time` seconds.
export function drawCoat(ctx, g, x, y, s, time) {
  const coat = coatOf(g);
  if (!coat) return;
  const S = s * 1.4;
  ctx.save();
  // Twinkles round the head (the radiant Mochiko's alternate gold and red).
  GLINTS.forEach(([gx, gy, ph], i) => {
    const r = Math.sin(step(time * 0.7 + ph, 8) * Math.PI) * 2.2;
    const c = coat === 'candied' ? mix(CANDY[g.candy], '#ffffff', 0.35) : coat === 'radiant' ? (i % 2 ? '#ff7a3a' : '#ffe680') : coat === 'kohakutou' ? KOHAKU[(i * 2 + Math.floor(time)) % KOHAKU.length] : GLINT_COLOR[coat];
    if (r > 0.3) twinkle(ctx, x + gx * s, y + gy * s, r * S, c);
  });
  if (coat === 'moonlit') {
    // Moon motes rise slowly round it and fade.
    for (let i = 0; i < 5; i++) {
      const u = step(time * 0.18 + i * 0.2, 24);
      dot(ctx, x + (Math.sin(i * 2.4) * 13 + Math.sin(u * 6 + i) * 1.5) * s, y - (6 + u * 40) * s, 0.9 * S, i % 2 ? '#fff3c4' : '#e6e9ff', Math.sin(u * Math.PI) * 0.85);
    }
  } else if (coat === 'glassjelly') {
    // A bubble drifts up inside the hair, wobbling side to side, and pops at the top.
    const u = step(time * 0.35, 24);
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.35 * S;
    ctx.beginPath();
    ctx.arc(x + (-6 + Math.sin(u * 9) * 1.2) * s, y - (20 + u * 16) * s, 1.3 * S, 0, Math.PI * 2);
    ctx.stroke();
    dot(ctx, x + (-6.5 + Math.sin(u * 9) * 1.2) * s, y - (20.6 + u * 16) * s, 0.35 * S, '#ffffff', Math.sin(u * Math.PI));
  } else if (coat === 'sakura') {
    // Petals slip off the hair and drift away and down, turning.
    for (let i = 0; i < 4; i++) {
      const u = step(time * 0.3 + i * 0.25, 30);
      const px = x + (-15 - u * 16 + Math.sin(u * 7 + i) * 2) * s;
      const py = y - (38 - i * 5 - u * 22) * s;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.95;
      ctx.fillStyle = i % 2 ? '#ff9fbf' : '#ffb8cf';
      ctx.beginPath();
      ctx.ellipse(px, py, 1.4 * S, 0.75 * S, u * 6 + i, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (coat === 'hanabi') {
    // Every so often a little firework bursts off an end of the hair: a ring of sparks flying
    // out and fading, each burst its own colour.
    const BURSTS = [[-10, -22], [9, -26], [-4, -40]];
    for (let b = 0; b < 3; b++) {
      const u = step(time * 0.45 + b / 3, 20);
      if (u > 0.6) continue;
      const k = u / 0.6;
      const [bx, by] = BURSTS[b];
      const c = ['#ffd24a', '#ff6fa8', '#6fd8ff'][(b + Math.floor(time * 0.45)) % 3];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        dot(ctx, x + (bx + Math.cos(a) * 4.5 * k) * s, y + (by + Math.sin(a) * 4.5 * k + k * k * 2) * s, 0.55 * S * (1 - k * 0.5), c, 1 - k);
      }
    }
  } else if (coat === 'dawn') {
    // Soft feathers drift down round it, rocking as they fall.
    for (let i = 0; i < 3; i++) {
      const u = step(time * 0.22 + i / 3, 30);
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath();
      ctx.ellipse(x + (-12 + i * 12 + Math.sin(u * 8 + i) * 2.4) * s, y - (44 - u * 40) * s, 1.8 * S, 0.7 * S, Math.sin(u * 8 + i) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (coat === 'goma') {
    // Sesame seeds drift slowly up round it, turning, pale against the dark.
    for (let i = 0; i < 5; i++) {
      const u = step(time * 0.2 + i / 5, 30);
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.ellipse(x + (Math.sin(i * 2.1) * 14 + Math.sin(u * 5 + i) * 1.6) * s, y - (8 + u * 36) * s, 0.9 * S, 0.5 * S, u * 4 + i, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (coat === 'kurozato') {
    // Drops of caramel light gather and fall from the ends of the hair.
    for (let i = 0; i < 3; i++) {
      const u = step(time * 0.4 + i / 3, 20);
      dot(ctx, x + (-9 + i * 9) * s, y - (20 - u * u * 14) * s, 0.8 * S, '#ffc870', Math.sin(u * Math.PI));
    }
  } else if (coat === 'yoru') {
    // Little stars twinkle on and off round it, each on its own beat.
    [[-15, -30, 0.1], [14, -36, 0.45], [-12, -46, 0.7], [16, -18, 0.85], [2, -50, 0.3]].forEach(([sx, sy, ph], i) => {
      const r = Math.sin(step(time * 0.6 + ph, 8) * Math.PI) * 1.6;
      if (r > 0.3) twinkle(ctx, x + sx * s, y + sy * s, r * S, i % 2 ? '#c8e8ff' : '#e6d4ff');
    });
  } else if (coat === 'beniume') {
    // Plum blossoms drift down round it, turning slowly.
    for (let i = 0; i < 3; i++) {
      const u = step(time * 0.2 + i / 3, 30);
      const [bx, by] = [x + (-14 + i * 13 + Math.sin(u * 6 + i) * 2.4) * s, y - (46 - u * 40) * s];
      ctx.globalAlpha = Math.sin(u * Math.PI);
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 + u * 3;
        dot(ctx, bx + Math.cos(a) * 0.9 * S, by + Math.sin(a) * 0.9 * S, 0.75 * S, '#ffe4ee', Math.sin(u * Math.PI));
      }
      dot(ctx, bx, by, 0.45 * S, '#ff6a8a', Math.sin(u * Math.PI));
    }
  } else if (coat === 'shinkai') {
    // Softly lit bubbles rise round it and wobble, like light in the deep sea.
    for (let i = 0; i < 5; i++) {
      const u = step(time * 0.25 + i / 5, 30);
      const [bx, by] = [x + (Math.sin(i * 2.6) * 14 + Math.sin(u * 8 + i) * 1.4) * s, y - (6 + u * 44) * s];
      dot(ctx, bx, by, (0.9 + (i % 2) * 0.5) * S * 1.6, '#5ae0d0', Math.sin(u * Math.PI) * 0.25);
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      ctx.strokeStyle = '#a8fff0';
      ctx.lineWidth = 0.3 * S;
      ctx.beginPath();
      ctx.arc(bx, by, (0.9 + (i % 2) * 0.5) * S, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (coat === 'kohakutou') {
    // Little crystals of candy circle the head, each its own jewel colour, catching the light.
    for (let i = 0; i < 5; i++) {
      const a = (step(time * 0.12, 48) + i / 5) * Math.PI * 2;
      const [cx, cy] = [x + Math.cos(a) * 15 * s, y - (30 + Math.sin(a) * 5) * s];
      const k = 1.3 * S * (0.8 + 0.2 * Math.sin(a));
      const c = KOHAKU[i % KOHAKU.length];
      ctx.globalAlpha = 1;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx, cy - k * 1.4);
      ctx.lineTo(cx + k, cy);
      ctx.lineTo(cx, cy + k * 1.4);
      ctx.lineTo(cx - k, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx, cy - k * 1.4);
      ctx.lineTo(cx + k * 0.45, cy - k * 0.3);
      ctx.lineTo(cx - k * 0.2, cy - k * 0.1);
      ctx.closePath();
      ctx.fill();
    }
  } else if (coat === 'ember') {
    // Sparks drift up off the hair, flicker and go out.
    for (let i = 0; i < 6; i++) {
      const u = step(time * 0.5 + i / 6, 20);
      dot(ctx, x + (-10 + i * 4 + Math.sin(u * 10 + i) * 1.5) * s, y - (26 + u * 22) * s, 0.5 * S, i % 2 ? '#ffb040' : '#ff5a2a', (1 - u) * (Math.floor(time * 12 + i) % 3 ? 1 : 0.5));
    }
  }
  ctx.restore();
}

// ---------- The egg ----------
// A mochi ball sitting in a little wooden mortar, a sprout on top. The egg hints at what's inside:
// its ball takes a blush of the Mochi's hair colour, stronger the rarer it is; a rare egg catches
// the light now and then, an epic one often; a legendary or mythic one sits in a mortar with a
// gold band and glows softly; a mythic one's ball turns slowly through the jewel colours.
const WOOD = '#a8784a';
const WOOD_LT = '#c8975e';
const WOOD_DK = '#7e5634';
const DOUGH = '#fffaf4';
const EGG_TINT = { common: 0.1, uncommon: 0.18, rare: 0.24, epic: 0.32, legendary: 0.4, mythic: 0.45, mutation: 0.85 };
const EGG_GLINTS = { common: 0, uncommon: 0, rare: 1, epic: 2, legendary: 3, mythic: 3, mutation: 3 };
// 26 x 24, its foot at the bottom middle.
function eggShapes(ball, band) {
  return [...mortarBack(), ...ballShapes(ball), ...mortarFront(band)];
}
// The mortar's rim and the hollow inside it, behind the ball.
const mortarBack = () => [E(13, 13, 10, 2.8, WOOD_LT), E(13, 12.9, 8, 1.9, '#5e3e24')];
// The ball, its shine and the sprout on top; hatching, it puffs up (`puff` 0-1) like mochi toasting,
// a blister swelling up on top, and wobbles `wob` from side to side.
function ballShapes(ball, puff = 0, wob = 0) {
  const [cx, rx, ry] = [13 + wob, 7.4 + 2.2 * puff, 6.6 + 3.2 * puff];
  const cy = 9.8 - 2.6 * puff;
  const d = Math.max(0, (puff - 0.4) / 0.6);
  const top = cy - ry - 2.4 * d;
  const sp = (pts) => pts.map(([x, y]) => [x + cx - 13, y + top - 3.2]);
  return [
    ...(d > 0 ? [E(cx + 1.6, cy - ry + 0.8 - 1.6 * d, 2.2 + 1.6 * d, 1.8 + 1.8 * d, ball), F(E(cx + 2.4, cy - ry + 0.4 - 1.6 * d, 1.2 + 0.4 * d, 0.5, '#f2deb0'))] : []),
    E(cx, cy, rx, ry, ball), F(E(cx - 2.6 - puff, cy - 3.2 - 1.6 * puff, 2.4 + 0.6 * puff, 1.3, '#ffffff')),
    F(limb(...sp([[13.2, 3.4]])[0], ...sp([[13.6, 1]])[0], 0.45, 0.35, '#4f8f45')), T(sp([[13.6, 1.2], [15.4, -0.2], [17, 0.4], [15.4, 1.6]]), '#86c96e'), T(sp([[13.4, 1.4], [11.8, 0.2], [10.6, 0.8], [12, 1.8]]), '#78b862'),
  ];
}
function mortarFront(band) {
  return [
    // The front lip of the rim, over the ball's bottom.
    T([[3, 13], [3.6, 14.6], [8, 15.8], [13, 16.1], [18, 15.8], [22.4, 14.6], [23, 13], [21, 14.2], [13, 14.9], [5, 14.2]], WOOD_LT),
    // The mortar itself, a little barrel, with its grain and a darker foot.
    T([[3.4, 13.6], [22.6, 13.6], [23, 17.6], [21.6, 22.4], [4.4, 22.4], [3, 17.6]], WOOD), F(R(4.6, 21.2, 16.8, 1.4, WOOD_DK)),
    F(limb(8, 15.6, 7.6, 20.8, 0.3, 0.25, WOOD_DK)), F(limb(13.2, 16, 13, 21, 0.3, 0.25, WOOD_DK)), F(limb(18.2, 15.6, 18.6, 20.8, 0.3, 0.25, WOOD_DK)),
    F(limb(4.2, 15, 22, 15, 0.35, 0.35, WOOD_LT)),
    // (A legendary or mythic egg's mortar: a gold band round its middle.)
    ...(band ? [F(T([[3.2, 17], [22.8, 17], [22.7, 18.8], [3.3, 18.8]], '#f2c94c')), F(R(4, 17.2, 18, 0.5, '#fff0b0'))] : []),
  ];
}
// An egg hatching (render/mochi-life.js runs it): the ball puffed up `puff` (in twentieths) and
// shifted `wob`, or the mortar left empty once it's out (`empty`), fading by `alpha`, the whole
// thing rocked `rock` radians about its base.
const shiftShapes = (shapes, dx, dy) => shapes.map((sh) => ({ ...sh, x: (sh.x ?? 0) + dx, y: (sh.y ?? 0) + dy }));
export function drawHatchEgg(ctx, x, y, g, puff = 0, wob = 0, empty = false, alpha = 1, rock = 0, scale = EGG_SCALE) {
  const tier = g?.rarity ?? 'common';
  const hair = g ? (MUTANT[coatOf(g)]?.dough ?? lookOf(g, null, 0).hairColor) : DOUGH;
  const ball = g ? mix(DOUGH, hair, EGG_TINT[tier]) : DOUGH;
  const band = tier === 'legendary' || tier === 'mythic' || tier === 'mutation';
  const k = scale;
  const p = Math.round(puff * 20) / 20;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(70,40,30,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y, 11 * k, 2.2 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, y);
  if (rock) ctx.rotate(rock);
  ctx.scale(k, k);
  // (A taller box than the egg's, room for the ball to swell up out of it.)
  const shapes = () => shiftShapes([...mortarBack(), ...(empty ? [] : ballShapes(ball, p, wob)), ...mortarFront(band)], 4, 12);
  place(ctx, art(`mochi-hatch|${ball}|${band ? 1 : 0}|${empty ? 'e' : `${p},${wob}`}`, 34, 36, shapes), 0, 0, { alpha });
  ctx.restore();
}
// The egg is a little smaller than the baby that hatches from it.
export const EGG_SCALE = 0.72;
// Draws the egg of Mochi `g` (or a plain one) with its foot at (x, y), on a small contact shadow,
// at `time` seconds.
export function drawMochiEgg(ctx, x, y, g = null, time = 0, scale = EGG_SCALE) {
  const tier = g?.rarity ?? 'common';
  const hair = g ? (MUTANT[coatOf(g)]?.dough ?? lookOf(g, null, step(time * 0.1, KOHAKU.length)).hairColor) : DOUGH;
  const ball = g ? mix(DOUGH, hair, EGG_TINT[tier]) : DOUGH;
  const band = tier === 'legendary' || tier === 'mythic' || tier === 'mutation';
  const k = scale;
  ctx.save();
  if (band) {
    for (const [rr, a] of [[16, 0.14], [11, 0.2]]) dot(ctx, x, y - 12 * k, rr * k, tier === 'mythic' ? ball : '#fff1c0', a);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(70,40,30,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y, 11 * k, 2.2 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(x, y);
  ctx.scale(k, k);
  place(ctx, art(`mochi-egg|${ball}|${band ? 1 : 0}`, 26, 24, () => eggShapes(ball, band)), 0, 0);
  ctx.restore();
  // Its glints: none for a common egg, more the rarer it is.
  ctx.save();
  for (let i = 0; i < EGG_GLINTS[tier]; i++) {
    const r = Math.sin(step(time * 0.5 + i * 0.37, 8) * Math.PI) * 1.8;
    const [gx, gy] = [[-4, -18], [4, -14], [-1, -22]][i];
    if (r > 0.3) twinkle(ctx, x + gx * k, y + gy * k, r * k * 1.4, tier === 'mythic' ? KOHAKU[(i + Math.floor(time)) % KOHAKU.length] : band ? '#fff3c4' : '#ffffff');
  }
  ctx.restore();
}
