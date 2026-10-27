// Idle auras for advanced jobs: a quiet touch around a hero who stands still, layered behind
// ('back') and in front of ('front') the sprite. They stay small, soft, and slow: a glow at the
// feet, a few motes drifting up, and for third jobs a signature: a rune ring with crackling
// lightning or dancing flames, or a halo and angel wings. Warrior paths: a ring of light diamonds
// for the Paladin, red flames and rising embers for the Berserker. Archer paths: a band of wind and
// drifting leaves for the Ranger, a slow sight ring for the Sniper.
// Nothing flashes, and nothing covers the face. Everything is drawn from time alone.
// (x, y) is the hero's feet in screen space, s the draw scale, k the fade (0-1).

import { fxSprite } from './fx-sprites.js';

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

// A rage ember: a small teardrop of flame pointing up, a dark red rim around a hot core, that
// flicks sideways as it rises.
const rageEmber = (ctx, x, y, r, i, t) => {
  const fx = x + Math.sin(t * 9 + i * 2) * r * 0.8;
  const tear = (R, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx, y - R * 2.6);
    ctx.quadraticCurveTo(fx + R * 1.1, y - R * 0.4, fx, y + R);
    ctx.quadraticCurveTo(fx - R * 1.1, y - R * 0.4, fx, y - R * 2.6);
    ctx.fill();
  };
  tear(r * 1.3, '#a81838');
  tear(r, i % 2 ? '#ff5a3c' : '#ff3f4f');
  tear(r * 0.5, '#ffd27a');
};

// Small red flames licking up around the feet (Berserker), the far ones behind the hero.
function rageFlames(ctx, x, y, t, s, a, front) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU + 0.3;
    const sin = Math.sin(ang);
    if (front !== sin > 0) continue;
    const fx = x + Math.cos(ang) * 11 * s;
    const fy = y + sin * 3 * s;
    const h = (3.5 + 2 * Math.sin(t * 8 + i * 1.9) + 1.2 * Math.sin(t * 15 + i)) * s;
    const lean = Math.sin(t * 5 + i) * 1 * s;
    for (const [color, w, k] of [['#a81838', 2, 1.1], ['#ff4a3c', 1.5, 1], ['#ffc46b', 0.7, 0.5]]) {
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

// A ring of small diamonds at the feet turning slowly, split so the hero stands inside it.
function glimRing(ctx, x, y, t, s, color, a, front) {
  ctx.save();
  ctx.globalAlpha = a;
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU + t * 0.5;
    const sin = Math.sin(ang);
    if (front !== sin > 0) continue;
    glim(i % 2 ? '#ffffff' : color)(ctx, x + Math.cos(ang) * 14 * s, y + sin * 3.6 * s - 1.5 * s, 1.1 * s);
  }
  ctx.restore();
}

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
  // Paladin: a warm golden light, a slow ring of light diamonds, and diamonds drifting up.
  paladin: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#ffe08a', k * 0.85);
      glimRing(ctx, x, y, t, s, '#ffd24f', k * 0.8, false);
    },
    front: (ctx, x, y, t, s, k) => {
      glimRing(ctx, x, y, t, s, '#ffd24f', k * 0.8, true);
      motes(ctx, x, y, t, s, k, { n: 3, speed: 0.3, inner: 10, spread: 16, draw: glim('#fff6c9') });
    },
  },
  // Berserker: a low red glow and embers that flick as they climb, quicker than a mage's.
  berserker: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#ff4a3c', k * (0.85 + 0.15 * Math.sin(t * 3)));
      rageFlames(ctx, x, y, t, s, k, false);
    },
    front: (ctx, x, y, t, s, k) => {
      rageFlames(ctx, x, y, t, s, k, true);
      motes(ctx, x, y, t, s, k, { n: 3, speed: 0.5, height: 30, size: 1, inner: 11, spread: 17, draw: rageEmber });
    },
  },
  // Ranger: a slow, faint spin of wind at her feet (effect-pack art, no glow).
  ranger: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'windspin', x, y - 2 * s, { t: t * 0.6, scale: s * 1.5, sy: 0.3, alpha: k * 0.6 }),
    front: () => {},
  },
  // Sniper: the rune wheel turning slowly and faintly at her chest.
  sniper: {
    back: () => {},
    front: (ctx, x, y, t, s, k) => fxSprite(ctx, 'charge', x, y - 22 * s, { frame: 1, rot: t * 0.3, scale: s * 0.55, alpha: k * 0.45 }),
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

// A flame tongue standing at (fx, fy), `h` tall, leaning by `lean`, three tones from rim to core.
function tongue(ctx, fx, fy, h, w, lean, a) {
  for (const [color, ww, hk] of [['#8a1030', w * 1.35, 1.12], ['#f0303f', w, 1], ['#ff9b3c', w * 0.55, 0.62], ['#ffe0a0', w * 0.25, 0.32]]) {
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx - ww, fy);
    ctx.quadraticCurveTo(fx - ww * 1.1, fy - h * hk * 0.45, fx + lean, fy - h * hk);
    ctx.quadraticCurveTo(fx + ww * 1.1, fy - h * hk * 0.45, fx + ww, fy);
    ctx.closePath();
    ctx.fill();
  }
}

function rageAura(ctx, x, y, t, s, k, layer) {
  const cy = y - 20 * s;
  if (layer === 'back') {
    // The heat: a red glow that grows with Rage.
    footGlow(ctx, x, y, s * (1 + k), '#ff3f3f', 0.4 + 0.5 * k);
    ctx.save();
    ctx.globalAlpha = 0.18 + 0.32 * k;
    const g = ctx.createRadialGradient(x, cy, 2 * s, x, cy, (16 + 14 * k) * s);
    g.addColorStop(0, '#ff5a3c');
    g.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, (16 + 14 * k) * s, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Flames standing around the body, climbing higher as Rage fills; the back ones taller.
    if (k > 0.25) {
      const f = Math.min(1, (k - 0.25) / 0.6);
      ctx.save();
      for (let i = 0; i < 9; i++) {
        const side = i % 2 ? 1 : -1;
        const row = Math.floor(i / 2);
        const fx = x + side * (7 + (row % 2) * 4 + Math.sin(t * 3 + i) * 1.2) * s;
        const fy = y - row * 6 * s * f;
        const h = (6 + 12 * f + 4 * Math.sin(t * 9 + i * 1.7) + 2 * Math.sin(t * 17 + i)) * s;
        tongue(ctx, fx, fy, h, 2.2 * s, Math.sin(t * 6 + i) * 1.5 * s + side * s, 0.85);
      }
      ctx.restore();
    }
    // Berserk: a red ring pulsing out from the feet.
    if (k >= 1) {
      const u = (t * 1.6) % 1;
      ctx.save();
      ctx.globalAlpha = 0.8 * (1 - u);
      ctx.strokeStyle = '#f0303f';
      ctx.lineWidth = Math.max(1, 2.2 * (1 - u) * s);
      ctx.beginPath();
      ctx.ellipse(x, y, (10 + 26 * u) * s, (3 + 6 * u) * s, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }
  // Front: flames at the hips in front of the body, and embers streaming up off the shoulders.
  if (k > 0.5) {
    const f = Math.min(1, (k - 0.5) / 0.5);
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1;
      const fx = x + side * (9 + (i >> 1) * 3) * s;
      const h = (5 + 8 * f + 3 * Math.sin(t * 11 + i * 2.3)) * s;
      tongue(ctx, fx, y - (i >> 1) * 3 * s, h, 1.8 * s, Math.sin(t * 7 + i) * s, 0.9);
    }
    ctx.restore();
  }
  if (k > 0.1) motes(ctx, x, y, t, s, Math.min(1, k * 1.5), { n: 2 + Math.round(5 * k), speed: 0.5 + 0.4 * k, height: 30 + 14 * k, size: 1 + 0.3 * k, inner: 10, spread: 18, draw: rageEmber });
}

function faithAura(ctx, x, y, t, s, k, layer) {
  const cy = y - 22 * s;
  if (layer === 'back') {
    footGlow(ctx, x, y, s * (1 + 0.8 * k), '#ffe08a', 0.4 + 0.5 * k);
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.3 * k;
    const g = ctx.createRadialGradient(x, cy, 2 * s, x, cy, (18 + 14 * k) * s);
    g.addColorStop(0, '#fff6c9');
    g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, (18 + 14 * k) * s, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Rays of light turning slowly behind her.
    if (k > 0.6) {
      const f = Math.min(1, (k - 0.6) / 0.4);
      ctx.save();
      ctx.globalAlpha = 0.3 * f;
      const rays = ctx.createRadialGradient(x, cy, 4 * s, x, cy, 40 * s);
      rays.addColorStop(0, '#fff2a0');
      rays.addColorStop(0.6, '#ffd24f');
      rays.addColorStop(1, 'rgba(255,210,80,0)');
      ctx.fillStyle = rays;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + t * 0.25;
        const len = (24 + 10 * f + (i % 2) * 8) * s;
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + Math.cos(a - 0.08) * len, cy + Math.sin(a - 0.08) * len);
        ctx.lineTo(x + Math.cos(a + 0.08) * len, cy + Math.sin(a + 0.08) * len);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    if (k >= 1) {
      ctx.save();
      ctx.filter = 'none';
      angelWings(ctx, x, y + 2 * s, t, s * 1.1, 0.9);
      ctx.restore();
    }
    if (k > 0.25) glimRing(ctx, x, y, t * (1 + k), s * (1 + 0.3 * k), '#ffd24f', Math.min(1, (k - 0.25) * 2.5), false);
    return;
  }
  if (k > 0.25) glimRing(ctx, x, y, t * (1 + k), s * (1 + 0.3 * k), '#ffd24f', Math.min(1, (k - 0.25) * 2.5), true);
  if (k > 0.6) halo(ctx, x, y, t, s, Math.min(1, (k - 0.6) * 2.5));
  if (k > 0.1) motes(ctx, x, y, t, s, Math.min(1, k * 1.5), { n: 2 + Math.round(4 * k), speed: 0.35, height: 34, inner: 10, spread: 17, draw: glim('#fff6c9') });
}

// Gale: wind from the effect packs (fx-sprites.js), no glows: a spin of wind at her feet that
// widens and quickens as it fills, gusts of leaves blowing past from halfway, and full (Tailwind),
// rings of wind bursting out from her feet.
function galeAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'windspin', x, y - 2 * s, { t: t * (1 + k), scale: s * (1.6 + 1.4 * k), sy: 0.3, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'windring', x, y, { t: t % 0.55, scale: s * 1.6 });
    return;
  }
  if (k > 0.5) fxSprite(ctx, 'leafgust', x + Math.sin(t * 1.7) * 6 * s, y - 14 * s, { t: (t * 0.9) % 0.7, flip: Math.floor(t * 0.9 / 0.7) % 2 === 1, scale: s * (0.8 + 0.4 * k), alpha: Math.min(1, (k - 0.5) * 2.5) });
}

// Focus: the pack's charging rune wheel turning slowly at her chest, growing as it fills; full
// (Deadeye), the rose star flashes over it on a slow beat.
function focusAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back' || k <= 0.25) return;
  const cy = y - 22 * s;
  fxSprite(ctx, 'charge', x, cy, { frame: 1, rot: t * (0.4 + k), scale: s * (0.6 + 0.5 * k), alpha: Math.min(1, (k - 0.25) * 2) * 0.85 });
  if (k >= 1) fxSprite(ctx, 'deadstar', x, cy, { t: t % 1.2, scale: s * 0.7, alpha: 0.9 });
}

// Draws a combat aura: `kind` 'rage', 'faith', 'gale' or 'focus', `k` how full (0-1).
const COMBAT = { rage: rageAura, faith: faithAura, gale: galeAura, focus: focusAura };
export function drawCombatAura(ctx, kind, layer, x, y, time, scale, k) {
  if (k <= 0.02 || !COMBAT[kind]) return;
  ctx.save();
  COMBAT[kind](ctx, x, y, time, scale, Math.min(1, k), layer);
  ctx.restore();
}
