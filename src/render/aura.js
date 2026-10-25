// Idle auras for advanced jobs: a quiet touch around a hero who stands still, layered behind
// ('back') and in front of ('front') the sprite. They stay small, soft, and slow: a glow at the
// feet, a few motes drifting up, and for third jobs one signature detail (a rune ring or a halo).
// Nothing flashes, and nothing covers the face. Everything is drawn from time alone.
// (x, y) is the hero's feet in screen space, s the draw scale, k the fade (0-1).

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
function motes(ctx, x, y, t, s, a, { n = 4, spread = 14, height = 34, speed = 0.35, size = 1.3, draw }) {
  for (let i = 0; i < n; i++) {
    const cyc = t * speed + i / n;
    const u = cyc % 1;
    const seed = Math.floor(cyc) * 7 + i;
    const mx = x + (hash(seed) - 0.5) * spread * 2 * s + Math.sin(t * 1.5 + i) * 2 * s;
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

// Each job: its glow color and what it does on each layer.
const JOBS = {
  // Stormfrost: a cool glow and a few snowflakes.
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
    },
  },
  // Venomflame: a warm glow, embers, and the odd green bubble.
  fpwizard: {
    back: (ctx, x, y, t, s, k) => footGlow(ctx, x, y, s, '#ff8a3b', k * 0.8),
    front: (ctx, x, y, t, s, k) => motes(ctx, x, y, t, s, k, { n: 4, draw: (c, mx, my, r, i, tt) => (i === 3 ? bubble : ember)(c, mx, my, r, i, tt) }),
  },
  fparchmage: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#ff8a3b', k * 0.8);
      runeRing(ctx, x, y, t, s, '#ff9b5c', k * 0.75, false);
    },
    front: (ctx, x, y, t, s, k) => {
      runeRing(ctx, x, y, t, s, '#ff9b5c', k * 0.75, true);
      motes(ctx, x, y, t, s, k, { n: 5, draw: (c, mx, my, r, i, tt) => (i % 3 === 2 ? bubble : ember)(c, mx, my, r, i, tt) });
    },
  },
  // Cleric and Bishop: golden light, and for the Bishop a halo.
  cleric: {
    back: (ctx, x, y, t, s, k) => footGlow(ctx, x, y, s, '#ffd84f', k * 0.8),
    front: (ctx, x, y, t, s, k) => motes(ctx, x, y, t, s, k, { n: 3, draw: sparkle('#fff6c9') }),
  },
  bishop: {
    back: (ctx, x, y, t, s, k) => footGlow(ctx, x, y, s, '#ffd84f', k * 0.8),
    front: (ctx, x, y, t, s, k) => {
      halo(ctx, x, y, t, s, k * 0.75);
      motes(ctx, x, y, t, s, k, { n: 4, draw: sparkle('#fff6c9') });
    },
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
