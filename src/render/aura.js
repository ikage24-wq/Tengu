// Idle auras for advanced jobs: a quiet touch around a hero who stands still, layered behind
// ('back') and in front of ('front') the sprite. They stay small, soft, and slow: a glow at the
// feet, a few motes drifting up, and for third jobs a signature: a rune ring with crackling
// lightning or dancing flames, or a halo and angel wings. Warrior paths: a ring of light diamonds
// for the Paladin, red flames and rising embers for the Berserker. Archer paths: a band of wind and
// drifting leaves for the Ranger, a slow sight ring for the Sniper.
// Nothing flashes, and nothing covers the face. Everything is drawn from time alone.
// (x, y) is the hero's feet in screen space, s the draw scale, k the fade (0-1).

import { fxSprite } from './fx-sprites.js';
import { lightPillar } from './warrior-fx.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// A soft oval of light on the ground.
function footGlow(ctx, x, y, s, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.scale(1, 0.28);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * s);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 16 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// A thin ring on the ground with tick marks turning slowly, split into a back and a front half
// so the hero stands inside it.
function runeRing(ctx, x, y, t, s, color, a, front) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, 0.8 * s);
  const rx = 15 * s;
  const ry = 4 * s;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU + t * 0.4;
    const sin = Math.sin(ang);
    if (front !== sin > 0) continue;
    ctx.fillRect(x + Math.cos(ang) * rx - 0.5 * s, y + sin * ry - 1.2 * s, s, 1.6 * s);
  }
  ctx.restore();
}

// A few small motes drifting up around the hero and fading. `draw(ctx, x, y, r, i)` paints one.
// `inner` keeps them that far out to either side, clear of the face.
function motes(ctx, x, y, t, s, a, { n = 4, spread = 14, height = 34, speed = 0.35, size = 1.3, inner = 0, draw }) {
  for (let i = 0; i < n; i++) {
    const cyc = t * speed + i / n;
    const u = cyc % 1;
    const seed = Math.floor(cyc) * 7 + i;
    const h = hash(seed) - 0.5;
    const off = inner ? Math.sign(h || 1) * (inner + Math.abs(h) * 2 * (spread - inner)) : h * spread * 2;
    const mx = x + off * s + Math.sin(t * 1.5 + i) * 2 * s;
    const my = y - (4 + u * height) * s;
    ctx.save();
    ctx.globalAlpha = a * Math.sin(u * Math.PI);
    draw(ctx, mx, my, size * s, i, t);
    ctx.restore();
  }
}

const snow = (ctx, x, y, r, i, t) => {
  ctx.strokeStyle = '#e6f6ff';
  ctx.lineWidth = Math.max(0.8, r * 0.6);
  ctx.translate(x, y);
  ctx.rotate(t * 0.8 + i);
  for (let k = 0; k < 3; k++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(-r * 1.6, 0);
    ctx.lineTo(r * 1.6, 0);
    ctx.stroke();
  }
};

const ember = (ctx, x, y, r, i) => {
  ctx.fillStyle = i % 2 ? '#ffb03b' : '#ff7a3b';
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, r), Math.max(1, r));
};

const bubble = (ctx, x, y, r) => {
  ctx.strokeStyle = '#8fe36b';
  ctx.lineWidth = Math.max(0.8, r * 0.5);
  ctx.beginPath();
  ctx.arc(x, y, r * 1.4, 0, TAU);
  ctx.stroke();
};

const sparkle = (color) => (ctx, x, y, r) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.8);
  ctx.quadraticCurveTo(x, y, x + r * 1.8, y);
  ctx.quadraticCurveTo(x, y, x, y + r * 1.8);
  ctx.quadraticCurveTo(x, y, x - r * 1.8, y);
  ctx.quadraticCurveTo(x, y, x, y - r * 1.8);
  ctx.fill();
};

// A small diamond of light: the holy jobs' rounded, spike-free spark.
const glim = (color) => (ctx, x, y, r) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.5);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r * 1.5);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
};




// A thin halo floating over the head, bobbing gently.
function halo(ctx, x, y, t, s, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#ffe36b';
  ctx.lineWidth = Math.max(1, 1.2 * s);
  ctx.beginPath();
  ctx.ellipse(x, y - 41 * s + Math.sin(t * 1.5) * s, 6.5 * s, 1.8 * s, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// A pair of small angel wings behind the shoulders, beating slowly.
function angelWings(ctx, x, y, t, s, a) {
  const flap = Math.sin(t * 2.2) * 0.12;
  ctx.save();
  ctx.globalAlpha = a;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(x + sd * 5 * s, y - 27 * s);
    ctx.scale(sd, 1);
    ctx.rotate(-0.55 - flap);
    // Long flight feathers fanning out and up, then a soft row of coverts over their roots.
    [[24, -0.5], [25, -0.15], [22, 0.2], [17, 0.55]].forEach(([len, ang], i) => {
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = i % 2 ? '#e6ebff' : '#ffffff';
      ctx.strokeStyle = '#b9c2e8';
      ctx.lineWidth = Math.max(0.6, 0.5 * s);
      ctx.beginPath();
      ctx.moveTo(0, -1.6 * s);
      ctx.quadraticCurveTo(len * 0.6 * s, -3 * s, len * s, -0.5 * s);
      ctx.quadraticCurveTo(len * 0.6 * s, 2 * s, 0, 1.6 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(7 * s, -1.5 * s, 8 * s, 4 * s, -0.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Short arcs of lightning crackling around the hero now and then, each gone in a blink.
function crackle(ctx, x, y, t, s, a) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    const cyc = t * 1.3 + i * 0.5;
    const u = cyc % 1;
    if (u > 0.22) continue;
    const n = Math.floor(cyc) * 3 + i;
    const side = hash(n) < 0.5 ? -1 : 1;
    let px = x + side * (6 + hash(n + 1) * 6) * s;
    let py = y - (2 + hash(n + 2) * 26) * s;
    const pts = [[px, py]];
    for (let j = 0; j < 4; j++) {
      px += side * (2.5 + hash(n + j + 5) * 3) * s;
      py += (j % 2 ? 1 : -1) * (2.5 + hash(n + j + 9) * 3) * s - 1.5 * s;
      pts.push([px, py]);
    }
    const fade = a * (1 - u / 0.22);
    for (const [color, w, al] of [['#2f8cff', 4, 0.8], ['#5ff3ff', 2.4, 1], ['#ffffff', 1, 1]]) {
      ctx.globalAlpha = fade * al;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(0.8, w * s * 0.6);
      ctx.beginPath();
      pts.forEach(([qx, qy], j) => (j ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Little flames dancing around the rune ring at the feet: the far ones behind the hero, the
// near ones in front.
function flameRing(ctx, x, y, t, s, a, front) {
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * TAU + t * 0.4;
    const sin = Math.sin(ang);
    if (front !== sin > 0) continue;
    const fx = x + Math.cos(ang) * 15 * s;
    const fy = y + sin * 4 * s;
    const h = (4 + 2.5 * Math.sin(t * 7 + i * 1.7) + 1.5 * Math.sin(t * 13 + i)) * s;
    const lean = Math.sin(t * 4 + i) * 1.2 * s;
    for (const [color, w, k] of [['#ff6b2b', 1.8, 1], ['#ffd23b', 0.9, 0.55]]) {
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(fx - w * s, fy);
      ctx.quadraticCurveTo(fx - w * s, fy - h * k * 0.5, fx + lean, fy - h * k);
      ctx.quadraticCurveTo(fx + w * s, fy - h * k * 0.5, fx + w * s, fy);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

// Each job: its glow color and what it does on each layer.
const JOBS = {
  // Stormfrost: a cool glow and a few snowflakes; the Archmage crackles with lightning.
  ilwizard: {
    back: (ctx, x, y, t, s, k) => footGlow(ctx, x, y, s, '#5fc4ff', k * 0.8),
    front: (ctx, x, y, t, s, k) => motes(ctx, x, y, t, s, k, { n: 3, draw: snow }),
  },
  ilarchmage: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#5fc4ff', k * 0.8);
      runeRing(ctx, x, y, t, s, '#7fd4ff', k * 0.75, false);
    },
    front: (ctx, x, y, t, s, k) => {
      runeRing(ctx, x, y, t, s, '#7fd4ff', k * 0.75, true);
      motes(ctx, x, y, t, s, k, { n: 4, draw: snow });
      crackle(ctx, x, y, t, s, k);
    },
  },
  // Venomflame: a warm glow, embers, and the odd green bubble; the Archmage stands in a ring of fire.
  fpwizard: {
    back: (ctx, x, y, t, s, k) => footGlow(ctx, x, y, s, '#ff8a3b', k * 0.8),
    front: (ctx, x, y, t, s, k) => motes(ctx, x, y, t, s, k, { n: 4, draw: (c, mx, my, r, i, tt) => (i === 3 ? bubble : ember)(c, mx, my, r, i, tt) }),
  },
  fparchmage: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#ff8a3b', k * 0.8);
      runeRing(ctx, x, y, t, s, '#ff9b5c', k * 0.75, false);
      flameRing(ctx, x, y, t, s, k, false);
    },
    front: (ctx, x, y, t, s, k) => {
      runeRing(ctx, x, y, t, s, '#ff9b5c', k * 0.75, true);
      flameRing(ctx, x, y, t, s, k, true);
      motes(ctx, x, y, t, s, k, { n: 5, draw: (c, mx, my, r, i, tt) => (i % 3 === 2 ? bubble : ember)(c, mx, my, r, i, tt) });
    },
  },
  // Cleric and Bishop: golden light, and for the Bishop a halo and angel wings.
  cleric: {
    back: (ctx, x, y, t, s, k) => footGlow(ctx, x, y, s, '#ffd84f', k * 0.8),
    front: (ctx, x, y, t, s, k) => motes(ctx, x, y, t, s, k, { n: 3, draw: sparkle('#fff6c9') }),
  },
  bishop: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#ffd84f', k * 0.8);
      angelWings(ctx, x, y, t, s, k * 0.9);
    },
    front: (ctx, x, y, t, s, k) => {
      halo(ctx, x, y, t, s, k * 0.75);
      motes(ctx, x, y, t, s, k, { n: 4, draw: sparkle('#fff6c9') });
    },
  },
  // Paladin: a few diamonds of light drifting up round her, faintly.
  paladin: {
    back: () => {},
    front: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celmotes', x, y, { t: t * 0.6, scale: s * 0.5, alpha: k * 0.5 }),
  },
  // Berserker: a faint rose-red ring at his feet.
  berserker: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celringrage', x, y, { frame: 2, scale: s * 0.4, sy: 0.32, alpha: k * 0.5 }),
    front: () => {},
  },
  // Ranger: a slow, faint curl of wind at her feet.
  ranger: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celwindspin', x, y - 2 * s, { t: t * 0.6, scale: s * 0.5, sy: 0.3, alpha: k * 0.6 }),
    front: () => {},
  },
  // Sniper: a faint rose ring at her feet.
  sniper: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celringsight', x, y, { frame: 2, scale: s * 0.4, sy: 0.32, alpha: k * 0.5 }),
    front: () => {},
  },
  // The Game Master: a faint ring and a few stars in every color.
  gamemaster: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#d2b8ff', k * 0.8);
      runeRing(ctx, x, y, t, s, '#d2b8ff', k * 0.75, false);
    },
    front: (ctx, x, y, t, s, k) => {
      runeRing(ctx, x, y, t, s, '#d2b8ff', k * 0.75, true);
      motes(ctx, x, y, t, s, k, { n: 4, draw: (c, mx, my, r, i) => sparkle(['#ff9ec0', '#8fe3ff', '#ffe36b', '#9fe0b0'][i % 4])(c, mx, my, r) });
    },
  },
};

// Jobs that have an idle aura.
export const AURA_JOBS = new Set(Object.keys(JOBS));

export function drawJobAura(ctx, job, layer, x, y, time, scale, k) {
  const def = JOBS[job];
  if (!def?.[layer] || k <= 0) return;
  ctx.save();
  def[layer](ctx, x, y, time, scale, k);
  ctx.restore();
}


// ---------- Combat auras: power that builds as the fight goes on ----------
// A Berserker's Rage and a Paladin's Faith show on the hero in stages (0-1, `k`), in a fight as well
// as at rest. Rage: a red heat glow, then flames licking up around the body, then flames climbing
// to the shoulders with embers streaming off; full (Berserk) adds a pulsing ring. Faith: a warm
// glow, then a turning ring of light diamonds, then a halo and slow rays behind; full (Sanctified)
// adds wings of light.


// Rage, in Tengu's own effect art (fx-sprites.js): a rose-red ring at his feet that widens as Rage
// builds, from halfway a fire burning round his legs, and full (Berserk), rings racing out again
// and again.
function rageAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.1) fxSprite(ctx, 'celringrage', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.1) * 2) });
    if (k >= 1) fxSprite(ctx, 'celringrage', x, y, { t: t % 0.5, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.5) fxSprite(ctx, 'celragefire', x, y + 2 * s, { t, scale: s * (0.35 + 0.25 * k), alpha: Math.min(1, (k - 0.5) * 2.5) * 0.9 });
}

// Faith: a golden ring at her feet, diamonds of light rising round her as Faith builds, and full
// (Sanctified), the golden magic circle under her and a pillar of light rising through her again
// and again.
function faithAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.25) fxSprite(ctx, 'celringholy', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.25) * 2) });
    if (k >= 1) {
      fxSprite(ctx, 'celcircle', x, y, { frame: 0, scale: s * 0.5, sy: 0.3, alpha: 0.85 });
      lightPillar(ctx, 'celpillarholy', x, y, (t % 1.1) / 1.1, 70 * s);
    }
    return;
  }
  if (k > 0.4) fxSprite(ctx, 'celmotes', x, y, { t, scale: s * 0.6, alpha: Math.min(1, (k - 0.4) * 2.5) });
}

// Gale, in Tengu's own effect art: a curl of wind spinning at her feet that widens and quickens
// as it fills, leaves blowing past from halfway, and full (Tailwind), rings of wind racing out
// from her feet.
function galeAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celwindspin', x, y - 2 * s, { t: t * (1 + k), scale: s * (0.5 + 0.4 * k), sy: 0.3, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celringwind', x, y, { t: t % 0.5, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.5) fxSprite(ctx, 'celleaves', x + Math.sin(t * 1.7) * 6 * s, y - 14 * s, { t: (t * 0.9) % 0.45, flip: Math.floor((t * 0.9) / 0.45) % 2 === 1, scale: s * (0.4 + 0.2 * k), alpha: Math.min(1, (k - 0.5) * 2.5) });
}

// Focus: lines of light gathering at her chest, growing as it fills; full (Deadeye), the rose
// sight snaps shut over it on a slow beat.
function focusAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back' || k <= 0.25) return;
  const cy = y - 22 * s;
  fxSprite(ctx, 'celcharge', x, cy, { t, scale: s * (0.35 + 0.25 * k), alpha: Math.min(1, (k - 0.25) * 2) * 0.85 });
  if (k >= 1) fxSprite(ctx, 'celdeadeye', x, cy, { t: (t % 1.2) * 0.8, scale: s * 0.5, alpha: 0.9 });
}

// Valor: a steel ring at his feet widening as it builds, steel chevrons and diamonds rising round
// him from halfway, and full (Unbroken), the steel emblem over his head and rings racing out
// again and again.
function valorAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celring', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celring', x, y, { t: t % 0.6, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.5) fxSprite(ctx, 'celvalor', x, y, { t, scale: s * (0.6 + 0.3 * k), alpha: Math.min(1, (k - 0.5) * 2.5) });
  if (k >= 1) fxSprite(ctx, 'celembsteel', x, y - 62 * s, { frame: 1, scale: s * 0.32, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Momentum: a sky-blue ring at her feet, gold feathers circling her on a ring of wind as it
// builds, and full (Hawkeye), the hawk emblem over her head and gold rings racing out.
function momentumAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celringsky', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celringhawk', x, y, { t: t % 0.5, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.4) fxSprite(ctx, 'celmomentum', x, y, { t: t * (0.8 + 0.6 * k), scale: s * (0.55 + 0.25 * k), alpha: Math.min(1, (k - 0.4) * 2.5) });
  if (k >= 1) fxSprite(ctx, 'celembhawk', x, y - 62 * s, { frame: 1, scale: s * 0.32, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Shadow: a violet ring at the thief's feet, wisps of shadow curling up round her as it builds,
// and full (Phantom), the crescent emblem over her head and violet rings racing out (the shadow
// copy itself is drawn with the hero).
function shadowAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celringshadow', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celringshadow', x, y, { t: t % 0.5, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.4) fxSprite(ctx, 'celshadowaura', x, y, { t: t * (0.8 + 0.6 * k), scale: s * (0.55 + 0.25 * k), alpha: Math.min(1, (k - 0.4) * 2.5) });
  if (k >= 1) fxSprite(ctx, 'celembshadow', x, y - 62 * s, { frame: 1, scale: s * 0.32, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Draws a combat aura: `kind` a job's gauge ('valor', 'momentum', 'shadow', 'rage', 'faith', 'gale' or
// 'focus'), `k` how full (0-1).
const COMBAT = { valor: valorAura, momentum: momentumAura, shadow: shadowAura, rage: rageAura, faith: faithAura, gale: galeAura, focus: focusAura };
export function drawCombatAura(ctx, kind, layer, x, y, time, scale, k) {
  if (k <= 0.02 || !COMBAT[kind]) return;
  ctx.save();
  COMBAT[kind](ctx, x, y, time, scale, Math.min(1, k), layer);
  ctx.restore();
}
