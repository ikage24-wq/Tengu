// Idle auras for advanced jobs: flashy effects around a hero who stands still, layered behind
// ('back') and in front of ('front') the sprite. Everything is drawn from time alone, so it
// needs no state. (x, y) is the hero's feet in screen space, s the draw scale, k the fade (0-1),
// dir the facing (1 right, -1 left).

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// Jobs that have an idle aura.
export const AURA_JOBS = new Set([
  'blademaster', 'lancer', 'guardian', 'swordsaint', 'dragonknight', 'paladin',
  'ilwizard', 'fpwizard', 'cleric', 'ilarchmage', 'fparchmage', 'bishop',
  'ranger', 'marksman', 'hunter', 'windwalker', 'deadeye', 'beastmaster',
  'duelist', 'shadow', 'trickster', 'bladedancer', 'nightstalker', 'phantomthief',
  'gamemaster',
]);

function glow(ctx, x, y, r, color, a) {
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// A soft column of light rising from the feet.
function pillar(ctx, x, y, w, h, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y - h * 0.45);
  ctx.scale(1, h / w);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, w / 2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function star(ctx, x, y, r, color, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// A rotating magic circle flat on the ground: two rings, rune ticks, and a star.
function magicCircle(ctx, x, y, r, t, color, a, points = 5) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.translate(x, y);
  ctx.scale(1, 0.32);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, TAU);
  ctx.stroke();
  ctx.rotate(t * 0.8);
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r * 0.8, Math.sin(ang) * r * 0.8);
    ctx.lineTo(Math.cos(ang) * r * (i % 2 ? 0.92 : 0.98), Math.sin(ang) * r * (i % 2 ? 0.92 : 0.98));
    ctx.stroke();
  }
  ctx.rotate(-t * 1.6);
  ctx.beginPath();
  for (let i = 0; i <= points * 2; i++) {
    const ang = (i * 2 * TAU) / (points * 2) - Math.PI / 2;
    const px = Math.cos(ang) * r * 0.76;
    const py = Math.sin(ang) * r * 0.76;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// Particles rising from the feet: count, spread (px), height (px), speed, color, size.
function rising(ctx, x, y, t, s, { n = 8, spread = 16, height = 50, speed = 0.6, color = '#ffffff', size = 1.4, seed = 0, shape = 'dot' }, k) {
  for (let i = 0; i < n; i++) {
    const u = (t * speed + hash(i + seed)) % 1;
    const px = x + (hash(i * 3 + seed) - 0.5) * 2 * spread * s + Math.sin(t * 2 + i) * 3 * s;
    const py = y - u * height * s;
    const a = k * Math.sin(u * Math.PI);
    if (shape === 'star') star(ctx, px, py, size * s * (1.2 - u * 0.5), color, a);
    else {
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, size * s * (1 - u * 0.5), 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Orbs circling the chest; `front` picks the half of the orbit in front of the body.
function orbit(ctx, x, y, t, s, { n = 3, rx = 20, ry = 6, speed = 1.6, draw }, front) {
  for (let i = 0; i < n; i++) {
    const ang = t * speed + (i / n) * TAU;
    const z = Math.sin(ang);
    if ((z >= 0) !== front) continue;
    draw(x + Math.cos(ang) * rx * s, y + z * ry * s, 0.8 + z * 0.2, i);
  }
}

function fireball(ctx, x, y, r, t, i) {
  glow(ctx, x, y, r * 3, '#ff9a3c', 0.55);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff7a3c';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.2, r * 0.55, r * 0.6, 0, 0, TAU);
  ctx.fill();
  // A little flame tail flickering upward.
  ctx.fillStyle = '#ffb35a';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, y - r * 0.4);
  ctx.quadraticCurveTo(x, y - r * (2.4 + Math.sin(t * 14 + i) * 0.5), x + r * 0.7, y - r * 0.4);
  ctx.fill();
}

// Big translucent wings behind the back, flapping slowly.
function wings(ctx, x, y, t, s, k, colors, feathers = 5) {
  const flap = Math.sin(t * 1.6) * 0.12;
  for (const side of [-1, 1]) {
    for (let f = 0; f < feathers; f++) {
      const ang = (-0.95 + f * 0.24 + flap) * side;
      const len = (30 - f * 3) * s;
      ctx.save();
      ctx.translate(x + side * 4 * s, y);
      ctx.rotate(ang + (side > 0 ? 0 : Math.PI) + (side > 0 ? -0.2 : 0.2));
      ctx.globalAlpha = k * (0.55 - f * 0.05);
      ctx.fillStyle = colors[f % colors.length];
      ctx.beginPath();
      ctx.ellipse(len * 0.55, 0, len * 0.55, (5 - f * 0.4) * s, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

function halo(ctx, x, y, s, t, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.ellipse(x, y + Math.sin(t * 2) * s, 8 * s, 2.4 * s, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  glow(ctx, x, y, 14 * s, color, a * 0.4);
}

// A spinning four-pointed throwing star.
// A six-armed snowflake.
function snowflake(ctx, x, y, r, color, a, rot) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI;
    ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    ctx.lineTo(-Math.cos(ang) * r, -Math.sin(ang) * r);
  }
  ctx.stroke();
  ctx.restore();
}

// A floating ice crystal: a tall diamond with a bright facet.
function crystal(ctx, x, y, r, k) {
  glow(ctx, x, y, r * 3, '#8fe3ff', 0.45 * k);
  ctx.globalAlpha = k;
  ctx.fillStyle = '#bfe6ff';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.6);
  ctx.lineTo(x + r * 0.8, y);
  ctx.lineTo(x, y + r * 1.6);
  ctx.lineTo(x - r * 0.8, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.6);
  ctx.lineTo(x - r * 0.8, y);
  ctx.lineTo(x, y);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// A short crackle of lightning between two points.
function zap(ctx, x1, y1, x2, y2, t, s, k) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.strokeStyle = '#fffbe0';
  ctx.shadowColor = '#ffe86b';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const seg = 4;
  for (let i = 1; i < seg; i++) {
    const u = i / seg;
    ctx.lineTo(x1 + (x2 - x1) * u + (hash(Math.floor(t * 20) + i) - 0.5) * 8 * s, y1 + (y2 - y1) * u + (hash(Math.floor(t * 20) + i + 9) - 0.5) * 6 * s);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// A small floating sword, point down, tilted by `rot`.
function floatSword(ctx, x, y, r, rot, k, blade = '#e6f2ff', glowColor = '#8fd3ff') {
  glow(ctx, x, y, r * 2.4, glowColor, 0.4 * k);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = blade;
  ctx.strokeStyle = '#6f8fd8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, r * 1.6);
  ctx.lineTo(-r * 0.3, -r * 0.6);
  ctx.lineTo(r * 0.3, -r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-r * 0.05, -r * 0.5, r * 0.1, r * 1.6);
  ctx.fillStyle = '#ffd66b';
  ctx.fillRect(-r * 0.7, -r * 0.75, r * 1.4, r * 0.25);
  ctx.fillRect(-r * 0.12, -r * 1.3, r * 0.24, r * 0.6);
  ctx.restore();
}

function goldCoin(ctx, x, y, r, t, k) {
  glow(ctx, x, y, r * 2.4, '#ffe36b', 0.4 * k);
  const w = Math.max(0.2, Math.abs(Math.cos(t * 3))) * r;
  ctx.globalAlpha = k;
  ctx.fillStyle = '#c98a2b';
  ctx.beginPath();
  ctx.ellipse(x, y + 0.6, w, r, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath();
  ctx.ellipse(x, y, w, r, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function rock(ctx, x, y, r, k, i) {
  ctx.globalAlpha = k;
  ctx.fillStyle = i % 2 ? '#c99a6b' : '#a87a4f';
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x - r * 0.4, y - r);
  ctx.lineTo(x + r * 0.8, y - r * 0.6);
  ctx.lineTo(x + r, y + r * 0.4);
  ctx.lineTo(x, y + r);
  ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  ctx.fillRect(x - r * 0.3, y - r * 0.6, r * 0.5, r * 0.3);
  ctx.globalAlpha = 1;
}



function shuriken(ctx, x, y, r, t, k) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(x, y);
  ctx.rotate(t * 12);
  ctx.fillStyle = '#5d5285';
  ctx.strokeStyle = '#c9a6ff';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU;
    const rr = i % 2 ? r * 0.35 : r;
    if (i) ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    else ctx.moveTo(rr, 0);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9a6ff';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------- The jobs ----------

const JOBS = {
  blademaster: {
    back(ctx, x, y, t, s, k) {
      // A wind ring at the feet and streaks of sword energy rising around the body.
      ctx.save();
      glow(ctx, x, y - 20 * s, 30 * s, '#8fd3ff', k * 0.35);
      ctx.strokeStyle = '#d6f0ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.8 + i / 3) % 1;
        ctx.globalAlpha = k * (1 - u) * 0.9;
        ctx.beginPath();
        ctx.ellipse(x, y, (10 + u * 26) * s, (3 + u * 6) * s, 0, 0, TAU);
        ctx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const u = (t * 0.9 + hash(i)) % 1;
        const px = x + (hash(i + 4) - 0.5) * 34 * s;
        ctx.globalAlpha = k * Math.sin(u * Math.PI) * 0.8;
        ctx.beginPath();
        ctx.moveTo(px, y - u * 50 * s);
        ctx.lineTo(px, y - u * 50 * s - 9 * s);
        ctx.stroke();
      }
      ctx.restore();
    },
    front(ctx, x, y, t, s, k, dir) {
      // Every couple of seconds a crescent slash of light cuts the air in front.
      const p = (t % 2.4) / 2.4;
      if (p < 0.25) {
        const u = p / 0.25;
        const a0 = -2.4 + hash(Math.floor(t / 2.4)) * 0.6;
        ctx.save();
        ctx.globalAlpha = k * (1 - u);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 * s * (1 - u);
        ctx.shadowColor = '#8fd3ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x + dir * 6 * s, y - 24 * s, 22 * s, a0, a0 + 1.8 * (0.3 + u));
        ctx.stroke();
        ctx.restore();
      }
      rising(ctx, x, y, t, s, { n: 6, spread: 14, height: 46, speed: 0.8, color: '#e6f6ff', size: 1.4, shape: 'star' }, k);
    },
  },
  lancer: {
    back(ctx, x, y, t, s, k) {
      // A dragon-like spiral of light winding up around the body.
      for (let i = 0; i < 28; i++) {
        const u = ((t * 0.5 + i / 28) % 1);
        const ang = u * TAU * 2 + t * 2;
        if (Math.sin(ang) > 0) continue;
        ctx.globalAlpha = k * Math.sin(u * Math.PI) * 0.8;
        ctx.fillStyle = i % 3 ? '#9fd8ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * 18 * s, y - u * 60 * s, (2.6 - u) * s, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      glow(ctx, x, y - 24 * s, 32 * s, '#9fd8ff', k * 0.4);
    },
    front(ctx, x, y, t, s, k) {
      for (let i = 0; i < 28; i++) {
        const u = ((t * 0.5 + i / 28) % 1);
        const ang = u * TAU * 2 + t * 2;
        if (Math.sin(ang) <= 0) continue;
        ctx.globalAlpha = k * Math.sin(u * Math.PI);
        ctx.fillStyle = i % 3 ? '#9fd8ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * 18 * s, y - u * 60 * s, (3 - u) * s, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  },
  fpwizard: {
    back(ctx, x, y, t, s, k) {
      glow(ctx, x, y - 6 * s, 26 * s, '#ff8a3c', k * (0.35 + 0.1 * Math.sin(t * 6)));
      orbit(ctx, x, y - 26 * s, t, s, { n: 3, rx: 20, ry: 6, draw: (px, py, z, i) => fireball(ctx, px, py, 3.4 * s * z * k, t, i) }, false);
      rising(ctx, x, y, t, s, { n: 10, spread: 14, height: 40, speed: 0.9, color: '#ffb35a', size: 1.2, seed: 2 }, k);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 26 * s, t, s, { n: 3, rx: 20, ry: 6, draw: (px, py, z, i) => fireball(ctx, px, py, 3.4 * s * z * k, t, i) }, true);
      // Venom bubbles drift up between the flames.
      rising(ctx, x, y, t, s, { n: 6, spread: 12, height: 44, speed: 0.6, color: '#9be86b', size: 1.6, seed: 11 }, k * 0.9);
      rising(ctx, x, y, t, s, { n: 3, spread: 10, height: 36, speed: 0.5, color: '#b46bff', size: 1.3, seed: 17 }, k * 0.8);
    },
  },
  ilwizard: {
    back(ctx, x, y, t, s, k) {
      glow(ctx, x, y - 10 * s, 28 * s, '#8fe3ff', k * (0.32 + 0.08 * Math.sin(t * 4)));
      // Snow falling around you.
      for (let i = 0; i < 8; i++) {
        const u = (t * 0.3 + hash(i + 40)) % 1;
        snowflake(ctx, x + (hash(i + 3) - 0.5) * 50 * s + Math.sin(t + i) * 4 * s, y - 70 * s + u * 70 * s, 1.6 * s, '#ffffff', k * Math.sin(u * Math.PI), t + i);
      }
      orbit(ctx, x, y - 26 * s, t, s, { n: 2, rx: 20, ry: 6, speed: 1.3, draw: (px, py, z) => crystal(ctx, px, py, 4 * s * z, k) }, false);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 26 * s, t, s, { n: 2, rx: 20, ry: 6, speed: 1.3, draw: (px, py, z) => crystal(ctx, px, py, 4 * s * z, k) }, true);
      // Static crackles off your hands now and then.
      if ((t * 1.7) % 1 < 0.25) zap(ctx, x + 10 * s, y - 24 * s, x + 18 * s, y - 34 * s, t, s, k);
      if ((t * 1.3 + 0.5) % 1 < 0.2) zap(ctx, x - 10 * s, y - 22 * s, x - 17 * s, y - 10 * s, t + 3, s, k);
    },
  },
  cleric: {
    back(ctx, x, y, t, s, k) {
      // A soft pillar of light.
      pillar(ctx, x, y, 34 * s, 90 * s, '#fff6c9', k * (0.6 + 0.2 * Math.sin(t * 2)));
    },
    front(ctx, x, y, t, s, k) {
      halo(ctx, x, y - 50 * s, s, t, '#ffe36b', k);
      // Feathers drifting down and little healing crosses rising.
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.25 + hash(i)) % 1;
        const px = x + (hash(i + 7) - 0.5) * 40 * s + Math.sin(t * 1.5 + i) * 6 * s;
        const py = y - 60 * s + u * 60 * s;
        ctx.save();
        ctx.globalAlpha = k * Math.sin(u * Math.PI) * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.translate(px, py);
        ctx.rotate(Math.sin(t * 2 + i) * 0.8);
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.4 * s, 3.4 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.5 + hash(i + 3)) % 1;
        const px = x + (hash(i * 5) - 0.5) * 30 * s;
        const py = y - 10 * s - u * 40 * s;
        ctx.globalAlpha = k * Math.sin(u * Math.PI);
        ctx.fillStyle = '#9fe0b0';
        ctx.fillRect(px - 0.6 * s, py - 2 * s, 1.2 * s, 4 * s);
        ctx.fillRect(px - 2 * s, py - 0.6 * s, 4 * s, 1.2 * s);
      }
      ctx.globalAlpha = 1;
    },
  },
  ranger: {
    back(ctx, x, y, t, s, k) {
      // Gusts of wind curling around.
      ctx.save();
      glow(ctx, x, y - 20 * s, 30 * s, '#bff0dc', k * 0.35);
      ctx.strokeStyle = '#e6fff0';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.6 + i / 3) % 1;
        ctx.globalAlpha = k * Math.sin(u * Math.PI) * 0.8;
        ctx.beginPath();
        ctx.arc(x + (u - 0.5) * 40 * s, y - (14 + i * 12) * s, 8 * s, Math.PI * 0.9, Math.PI * 1.9);
        ctx.stroke();
      }
      ctx.restore();
    },
    front(ctx, x, y, t, s, k) {
      // A storm of leaves swirling around the body.
      for (let i = 0; i < 14; i++) {
        const ang = t * 2.2 + (i / 14) * TAU;
        const h = ((t * 0.3 + i / 14) % 1) * 54;
        if (Math.sin(ang) < -0.2) continue;
        const px = x + Math.cos(ang) * 18 * s;
        const py = y - (6 + h) * s + Math.sin(ang) * 4 * s;
        ctx.save();
        ctx.globalAlpha = k * 0.95;
        ctx.translate(px, py);
        ctx.rotate(ang * 2);
        ctx.fillStyle = i % 3 ? '#7fd17a' : '#c4f2a8';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.8 * s, 1.8 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  },
  marksman: {
    front(ctx, x, y, t, s, k, dir) {
      // A lock-on reticle scanning in front, snapping tight and flashing red now and then.
      const p = (t % 3) / 3;
      const lock = p > 0.7 ? Math.sin(((p - 0.7) / 0.3) * Math.PI) : 0;
      const rx = x + dir * (34 + Math.sin(t * 1.3) * 8) * s;
      const ry = y - (30 + Math.sin(t * 0.9) * 6) * s;
      const r = (9 - lock * 3) * s;
      ctx.save();
      ctx.globalAlpha = k * 0.9;
      ctx.strokeStyle = lock > 0.3 ? '#ff5b7f' : '#9fd8ff';
      ctx.lineWidth = 1.2;
      ctx.translate(rx, ry);
      ctx.rotate(t * 1.5);
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0.15, Math.PI / 2 - 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r + 1 * s, 0);
        ctx.lineTo(r + 4 * s, 0);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = k;
      ctx.fillStyle = lock > 0.3 ? '#ff5b7f' : '#ffffff';
      ctx.fillRect(rx - s, ry - s, 2 * s, 2 * s);
      // A faint laser from the hero to the reticle.
      ctx.globalAlpha = k * 0.3;
      ctx.strokeStyle = '#ff9ec0';
      ctx.beginPath();
      ctx.moveTo(x + dir * 8 * s, y - 22 * s);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
  },
  duelist: {
    // The afterimages are drawn by the hero renderer; this adds swirling rose petals.
    front(ctx, x, y, t, s, k) {
      for (let i = 0; i < 7; i++) {
        const ang = t * 1.8 + (i / 7) * TAU;
        const px = x + Math.cos(ang) * 20 * s;
        const py = y - (12 + ((t * 8 + i * 9) % 40)) * s;
        ctx.save();
        ctx.globalAlpha = k * 0.9;
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.fillStyle = i % 2 ? '#ff6b9a' : '#ffc2d6';
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.4 * s, 1.4 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  },
  shadow: {
    back(ctx, x, y, t, s, k) {
      // Dark smoke curling around the feet, and purple wisps.
      glow(ctx, x, y - 16 * s, 30 * s, '#7a5fc0', k * 0.45);
      for (let i = 0; i < 12; i++) {
        const u = (t * 0.5 + hash(i)) % 1;
        const px = x + (hash(i + 2) - 0.5) * 36 * s + Math.sin(t + i) * 4 * s;
        const py = y - u * 34 * s;
        ctx.globalAlpha = k * (1 - u) * 0.75;
        ctx.fillStyle = i % 2 ? '#3b3650' : '#5d4a8a';
        ctx.beginPath();
        ctx.arc(px, py, (4 + u * 6) * s, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      orbit(ctx, x, y - 24 * s, t, s, { n: 2, rx: 22, ry: 7, speed: 2.4, draw: (px, py, z) => shuriken(ctx, px, py, 4.4 * s * z, t, k) }, false);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 24 * s, t, s, { n: 2, rx: 22, ry: 7, speed: 2.4, draw: (px, py, z) => shuriken(ctx, px, py, 4.4 * s * z, t, k) }, true);
      rising(ctx, x, y, t, s, { n: 5, spread: 12, height: 40, speed: 0.7, color: '#c9a6ff', size: 1.1, seed: 5 }, k * 0.8);
    },
  },
  guardian: {
    back(ctx, x, y, t, s, k) {
      // Earth: an amber glow, a dust ring, and boulders orbiting slowly.
      glow(ctx, x, y - 16 * s, 30 * s, '#e0a96b', k * 0.35);
      ctx.strokeStyle = '#e0c49b';
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const u = (t * 0.5 + i / 2) % 1;
        ctx.globalAlpha = k * (1 - u) * 0.8;
        ctx.beginPath();
        ctx.ellipse(x, y, (12 + u * 24) * s, (3 + u * 5) * s, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      orbit(ctx, x, y - 22 * s, t, s, { n: 3, rx: 22, ry: 6, speed: 0.9, draw: (px, py, z, i) => rock(ctx, px, py, 3.2 * s * z, k, i) }, false);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 22 * s, t, s, { n: 3, rx: 22, ry: 6, speed: 0.9, draw: (px, py, z, i) => rock(ctx, px, py, 3.2 * s * z, k, i) }, true);
      rising(ctx, x, y, t, s, { n: 6, spread: 16, height: 30, speed: 0.6, color: '#e0c49b', size: 1.3, seed: 31 }, k * 0.8);
    },
  },
  hunter: {
    back(ctx, x, y, t, s, k) {
      // The wild: a ring of thorny brambles curling around your feet, and fireflies.
      glow(ctx, x, y - 18 * s, 28 * s, '#8fd86b', k * 0.3);
      brambles(ctx, x, y, t, s, k, false);
    },
    front(ctx, x, y, t, s, k) {
      brambles(ctx, x, y, t, s, k, true);
      for (let i = 0; i < 5; i++) {
        const px = x + Math.sin(t * 0.9 + i * 2.1) * 26 * s;
        const py = y - 30 * s + Math.cos(t * 1.3 + i * 1.7) * 16 * s;
        glow(ctx, px, py, 4 * s, '#fff6a0', k * (0.5 + 0.5 * Math.sin(t * 4 + i)));
      }
    },
  },
  trickster: {
    back(ctx, x, y, t, s, k) {
      glow(ctx, x, y - 20 * s, 26 * s, '#ffd66b', k * 0.28);
    },
    front(ctx, x, y, t, s, k, dir) {
      // Juggling gold coins hand to hand in a looping arc over the head.
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.8 + i / 4) % 1;
        const px = x + dir * (-16 + 32 * (u < 0.5 ? u * 2 : 2 - u * 2)) * s;
        const py = y - 26 * s - Math.sin((u < 0.5 ? u * 2 : u * 2 - 1) * Math.PI) * (u < 0.5 ? 36 : 14) * s;
        goldCoin(ctx, px, py, 3.2 * s, t * 2 + i, k);
      }
      rising(ctx, x, y, t, s, { n: 4, spread: 14, height: 40, speed: 0.6, color: '#fff6c9', size: 1.5, seed: 41, shape: 'star' }, k);
    },
  },
  gamemaster: {
    back(ctx, x, y, t, s, k) {
      // A rainbow magic circle and a shimmering prism glow.
      const hues = ['#ff9ec0', '#ffd66b', '#9fe0b0', '#8fd3ff', '#c9a6ff'];
      glow(ctx, x, y - 26 * s, 40 * s, hues[Math.floor(t * 2) % hues.length], k * 0.35);
      hues.forEach((c, i) => magicCircle(ctx, x, y, (36 - i * 4) * s, t * (i % 2 ? -1 : 1) * (1 + i * 0.2), c, k * 0.7, 5 + i));
    },
    front(ctx, x, y, t, s, k) {
      // A floating gold crown with a GM tag, and rainbow sparkles rising.
      const cy = y - 60 * s + Math.sin(t * 2) * 2 * s;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = '#ffd66b';
      ctx.strokeStyle = '#b8862b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 8 * s, cy + 4 * s);
      ctx.lineTo(x - 8 * s, cy - 3 * s);
      ctx.lineTo(x - 4 * s, cy);
      ctx.lineTo(x, cy - 5 * s);
      ctx.lineTo(x + 4 * s, cy);
      ctx.lineTo(x + 8 * s, cy - 3 * s);
      ctx.lineTo(x + 8 * s, cy + 4 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff6b9a';
      ctx.beginPath();
      ctx.arc(x, cy + 1 * s, 1.4 * s, 0, TAU);
      ctx.fill();
      ctx.font = `bold ${Math.round(6 * s)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#5a3f7a';
      ctx.strokeText('GM', x, cy - 7 * s);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('GM', x, cy - 7 * s);
      ctx.restore();
      const hues = ['#ff9ec0', '#ffd66b', '#9fe0b0', '#8fd3ff', '#c9a6ff'];
      hues.forEach((c, i) => rising(ctx, x, y, t, s, { n: 3, spread: 22, height: 70, speed: 0.5, color: c, size: 1.5, seed: i * 7, shape: 'star' }, k));
    },
  },
};

// ---------- Third jobs ----------
// Each third job gets a standalone signature look rather than a remix of its branch's aura.


// A coiling serpent-dragon wound around the body as a helix. `front` draws the half in front.
function dragonCoil(ctx, x, y, t, s, k, front) {
  const n = 46;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const ang = u * TAU * 1.6 - t * 1.4;
    pts.push({ x: x + Math.cos(ang) * (20 - u * 4) * s, y: y - 4 * s - u * 62 * s + Math.sin(t * 2 + u * 6) * 1.5 * s, z: Math.sin(ang), w: (2.2 + 4.2 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.9)) * s });
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = k;
  for (const [color, add] of [['#5a0f24', 1.6 * s], ['#d42a46', 0], ['#ffb35a', -0.55]]) {
    for (let i = 1; i <= n; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if ((b.z >= 0) !== front) continue;
      ctx.strokeStyle = color;
      ctx.lineWidth = add < 0 ? b.w * -add : b.w + add;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + (add < 0 ? b.w * 0.25 : 0));
      ctx.lineTo(b.x, b.y + (add < 0 ? b.w * 0.25 : 0));
      ctx.stroke();
    }
  }
  // Golden fins along the spine.
  for (let i = 4; i < n; i += 4) {
    const p = pts[i];
    if ((p.z >= 0) !== front) continue;
    ctx.fillStyle = '#ffd66b';
    ctx.beginPath();
    ctx.moveTo(p.x - 2 * s, p.y - p.w * 0.4);
    ctx.lineTo(p.x, p.y - p.w * 0.5 - 4 * s);
    ctx.lineTo(p.x + 2 * s, p.y - p.w * 0.4);
    ctx.fill();
  }
  // The head rears up at the top of the coil.
  const head = pts[n];
  if ((head.z >= 0) === front) {
    const dir = Math.cos(1.6 * TAU - t * 1.4 + 0.3) > 0 ? -1 : 1;
    ctx.save();
    ctx.translate(head.x, head.y - 3 * s);
    ctx.scale(dir * s, s);
    glow(ctx, 0, 0, 14, '#ff6b4a', 0.6);
    ctx.fillStyle = '#d42a46';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4.5, 0, 0, TAU);
    ctx.moveTo(3, -3);
    ctx.lineTo(11, -1);
    ctx.lineTo(10, 2);
    ctx.lineTo(3, 3);
    ctx.fill();
    ctx.fillStyle = '#ffd66b';
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.lineTo(-9, -10);
    ctx.lineTo(-1, -4);
    ctx.moveTo(0, -4);
    ctx.lineTo(-3, -12);
    ctx.lineTo(3, -4);
    ctx.fill();
    ctx.fillStyle = '#fff6a0';
    ctx.fillRect(2, -2, 2, 1.5);
    // A lick of flame from the jaws now and then.
    if ((t * 0.7) % 1 < 0.35) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#ffe36b' : '#ff8a3c';
        ctx.beginPath();
        ctx.arc(13 + i * 3.5, 1 + Math.sin(t * 30 + i) * 1, 2.4 - i * 0.4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

// A running spirit animal looping around the body; `front` draws it only on the near side.
function spiritWolf(ctx, x, y, t, s, k, front) {
  const ang = t * 1.6;
  const z = Math.sin(ang);
  if ((z >= 0) !== front) return;
  const px = x + Math.cos(ang) * 30 * s;
  const py = y - 1 * s + z * 5 * s;
  const dir = -Math.sin(ang) >= 0 ? 1 : -1;
  const sc = s * (1.05 + z * 0.15);
  const leg = Math.sin(t * 14) * 3;
  ctx.save();
  ctx.globalAlpha = k * (0.85 + z * 0.15);
  ctx.translate(px, py);
  ctx.scale(dir * sc, sc);
  glow(ctx, 0, -8, 18, '#8fd86b', 0.6);
  ctx.fillStyle = '#e8ffe0';
  ctx.strokeStyle = '#4f8a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -8, 10, 4.5, 0, 0, TAU);
  ctx.moveTo(15, -12);
  ctx.ellipse(10, -12, 5, 4, 0, 0, TAU);
  ctx.moveTo(13, -14);
  ctx.lineTo(20, -11);
  ctx.lineTo(13, -9);
  ctx.moveTo(7, -15);
  ctx.lineTo(8, -21);
  ctx.lineTo(11, -15);
  ctx.moveTo(-9, -9);
  ctx.quadraticCurveTo(-18, -16 + leg, -20, -6);
  ctx.quadraticCurveTo(-14, -7, -9, -6);
  ctx.rect(-7 + leg, -5, 2.5, 7);
  ctx.rect(5 - leg, -5, 2.5, 7);
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = '#8fd86b';
  ctx.fillRect(-6, -12, 12, 2);
  ctx.fillStyle = '#2f5a1f';
  ctx.fillRect(12, -13, 1.5, 1.5);
  ctx.restore();
}

// A little hawk silhouette with flapping wings.
function hawk(ctx, x, y, s, t, k, dir) {
  const flap = Math.sin(t * 10);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  glow(ctx, 0, 0, 10, '#fff6a0', 0.45);
  ctx.fillStyle = '#5f7fd8';
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(-8, -6 * flap - 2, -14, -4 * flap);
  ctx.quadraticCurveTo(-7, 1, -2, 2);
  ctx.moveTo(2, 0);
  ctx.quadraticCurveTo(6, -6 * flap - 2, 11, -4 * flap);
  ctx.quadraticCurveTo(6, 1, 2, 2);
  ctx.fill();
  ctx.fillStyle = '#dfe8ff';
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 4, 2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd66b';
  ctx.fillRect(3.5, -0.5, 2, 1);
  ctx.restore();
}

// A playing card, face up, centered on (0, 0) in the current transform.
function card(ctx, s, suit) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c98a2b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.rect(-4.5 * s, -6.5 * s, 9 * s, 13 * s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = suit % 2 ? '#e8364f' : '#3a2d4f';
  ctx.beginPath();
  if (suit % 2) {
    ctx.arc(-1.2 * s, -1 * s, 1.5 * s, 0, TAU);
    ctx.arc(1.2 * s, -1 * s, 1.5 * s, 0, TAU);
    ctx.moveTo(-2.7 * s, -0.4 * s);
    ctx.lineTo(0, 3 * s);
    ctx.lineTo(2.7 * s, -0.4 * s);
  } else {
    ctx.moveTo(0, -3 * s);
    ctx.lineTo(2.5 * s, 0);
    ctx.lineTo(0, 3 * s);
    ctx.lineTo(-2.5 * s, 0);
  }
  ctx.fill();
}

Object.assign(JOBS, {
  swordsaint: {
    back(ctx, x, y, t, s, k) {
      // A fan of seven spectral swords spread behind the back like a mandala, a glint running
      // through them one by one.
      const cx = x;
      const cy = y - 30 * s;
      glow(ctx, cx, cy, 44 * s, '#bfe0ff', k * 0.35);
      const sway = Math.sin(t * 1.2) * 0.06;
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * (0.12 + (i / 6) * 0.76) + sway;
        const r = 30 * s;
        const lit = Math.max(0, 1 - Math.abs(((t * 1.5) % 7) - i));
        floatSword(ctx, cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1, (8 + lit * 1.5) * s, a - Math.PI / 2 + Math.PI, k * (0.75 + lit * 0.25), lit > 0.3 ? '#ffffff' : '#dbe9ff', lit > 0.3 ? '#ffffff' : '#8fd3ff');
      }
      // Sword-cut marks glowing faintly on the ground.
      ctx.save();
      ctx.globalAlpha = k * 0.5;
      ctx.strokeStyle = '#cfe0ff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - (20 - i * 14) * s, y + 1 * s);
        ctx.lineTo(x - (12 - i * 14) * s, y - 1 * s);
        ctx.stroke();
      }
      ctx.restore();
    },
    front(ctx, x, y, t, s, k, dir) {
      // Every few seconds: an iai draw, one razor line across the air and a spray of sparks.
      const p = (t % 3) / 3;
      if (p < 0.18) {
        const u = p / 0.18;
        ctx.save();
        ctx.globalAlpha = k * (1 - u);
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#8fd3ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5 * s * (1 - u) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x - dir * 34 * s, y - 34 * s);
        ctx.lineTo(x - dir * 34 * s + dir * 76 * s * Math.min(1, u * 3), y - 34 * s + 18 * s * Math.min(1, u * 3));
        ctx.stroke();
        ctx.restore();
      }
      rising(ctx, x, y, t, s, { n: 5, spread: 16, height: 50, speed: 0.7, color: '#e6f2ff', size: 1.2, seed: 71, shape: 'star' }, k);
    },
  },

  dragonknight: {
    back(ctx, x, y, t, s, k) {
      // A crimson dragon coils up around you, embers falling off its scales.
      glow(ctx, x, y - 26 * s, 36 * s, '#ff5a5a', k * (0.3 + 0.08 * Math.sin(t * 3)));
      dragonCoil(ctx, x, y, t, s, k, false);
    },
    front(ctx, x, y, t, s, k) {
      dragonCoil(ctx, x, y, t, s, k, true);
      rising(ctx, x, y, t, s, { n: 9, spread: 20, height: 60, speed: 0.9, color: '#ffb35a', size: 1.2, seed: 81 }, k);
    },
  },

  paladin: {
    back(ctx, x, y, t, s, k) {
      // A great tower shield of light behind you, rays fanning out from behind it.
      const cx = x;
      const cy = y - 30 * s;
      ctx.save();
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.28 + Math.sin(t * 0.8) * 0.05;
        const len = (48 + (i % 2) * 12) * s;
        const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        g.addColorStop(0, 'rgba(255,246,201,0.7)');
        g.addColorStop(1, 'rgba(255,246,201,0)');
        ctx.globalAlpha = k * (0.55 + 0.25 * Math.sin(t * 2 + i));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - 0.06) * len, cy + Math.sin(a - 0.06) * len);
        ctx.lineTo(cx + Math.cos(a + 0.06) * len, cy + Math.sin(a + 0.06) * len);
        ctx.fill();
      }
      const w = 17 * s;
      const h = 24 * s;
      ctx.globalAlpha = k * 0.8;
      ctx.fillStyle = 'rgba(255,250,230,0.55)';
      ctx.strokeStyle = '#ffd66b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - w, cy - h * 0.6);
      ctx.lineTo(cx + w, cy - h * 0.6);
      ctx.lineTo(cx + w, cy + h * 0.15);
      ctx.quadraticCurveTo(cx + w, cy + h * 0.75, cx, cy + h);
      ctx.quadraticCurveTo(cx - w, cy + h * 0.75, cx - w, cy + h * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(cx - 2 * s, cy - h * 0.45, 4 * s, h * 1.2);
      ctx.fillRect(cx - w * 0.7, cy - h * 0.1, w * 1.4, 4 * s);
      ctx.restore();
    },
    front(ctx, x, y, t, s, k) {
      // A honeycomb barrier shimmering around you, a wave of light rolling up through it.
      const cx = x;
      const cy = y - 24 * s;
      const rx = 26 * s;
      const ry = 32 * s;
      const hr = 5 * s;
      const wave = ((t * 0.6) % 1.4) - 0.2;
      ctx.save();
      ctx.lineWidth = 1;
      for (let row = -7; row <= 7; row++) {
        for (let col = -6; col <= 6; col++) {
          const hx = cx + col * hr * 1.73 + (row % 2 ? hr * 0.87 : 0);
          const hy = cy + row * hr * 1.5;
          const d = ((hx - cx) / rx) ** 2 + ((hy - cy) / ry) ** 2;
          if (d > 1) continue;
          const edge = d > 0.7 ? (d - 0.7) / 0.3 : 0;
          const lit = Math.max(0, 1 - Math.abs((cy + ry - hy) / (2 * ry) - wave) * 6);
          ctx.globalAlpha = k * (0.08 + edge * 0.35 + lit * 0.5);
          ctx.strokeStyle = lit > 0.3 ? '#ffffff' : '#ffe9a0';
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU + Math.PI / 6;
            ctx.lineTo(hx + Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.9);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();
      rising(ctx, x, y, t, s, { n: 5, spread: 20, height: 64, speed: 0.4, color: '#fff6c9', size: 1.6, seed: 91, shape: 'star' }, k);
    },
  },

  ilarchmage: {
    back(ctx, x, y, t, s, k) {
      // Frost creeps out over the ground in a ring of growing ice spikes, cold mist rising.
      glow(ctx, x, y - 4 * s, 36 * s, '#bfe6ff', k * 0.45);
      ctx.save();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        const px = x + Math.cos(a) * 26 * s;
        const py = y + Math.sin(a) * 6 * s;
        if (Math.sin(a) > 0) continue;
        const h = (6 + 5 * Math.sin(t * 1.5 + i * 1.7)) * s;
        ctx.globalAlpha = k;
        ctx.fillStyle = i % 2 ? '#bfe6ff' : '#e8fbff';
        ctx.beginPath();
        ctx.moveTo(px - 2.2 * s, py);
        ctx.lineTo(px, py - h);
        ctx.lineTo(px + 2.2 * s, py);
        ctx.fill();
      }
      ctx.restore();
    },
    front(ctx, x, y, t, s, k) {
      // A crown of ice shards hovers over your head around a ball of lightning that arcs to them.
      const cx = x;
      const cy = y - 62 * s;
      const shards = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + t * 0.8;
        shards.push({ x: cx + Math.cos(a) * 19 * s, y: cy + Math.sin(a) * 5 * s, z: Math.sin(a) });
      }
      const drawShard = (sh) => {
        ctx.save();
        ctx.globalAlpha = k * (0.7 + sh.z * 0.3);
        ctx.fillStyle = '#c9f0ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y - 11 * s);
        ctx.lineTo(sh.x + 3.2 * s, sh.y);
        ctx.lineTo(sh.x, sh.y + 4 * s);
        ctx.lineTo(sh.x - 3.2 * s, sh.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      shards.filter((sh) => sh.z < 0).forEach(drawShard);
      glow(ctx, cx, cy - 2 * s, 12 * s, '#ffe86b', k * (0.7 + 0.3 * Math.sin(t * 9)));
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - 2 * s, 2.6 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
      const target = shards[Math.floor(t * 6) % shards.length];
      zap(ctx, cx, cy - 2 * s, target.x, target.y - 2 * s, t, s * 0.8, k);
      shards.filter((sh) => sh.z >= 0).forEach(drawShard);
      for (let i = 0; i < 6; i++) {
        const u = (t * 0.25 + hash(i + 90)) % 1;
        snowflake(ctx, x + (hash(i + 3) - 0.5) * 56 * s, y - 70 * s + u * 72 * s, 1.8 * s, '#ffffff', k * Math.sin(u * Math.PI), t + i);
      }
    },
  },

  fparchmage: {
    back(ctx, x, y, t, s, k) {
      // A ring of venom-green and orange flames burning around your feet, purple smoke above.
      glow(ctx, x, y - 10 * s, 36 * s, '#7de04f', k * 0.3);
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.35 + i / 4) % 1;
        glow(ctx, x + Math.sin(t + i * 2) * 10 * s, y - 30 * s - u * 40 * s, (8 + u * 10) * s, '#9b4fe0', k * 0.35 * (1 - u));
      }
      flameRing(ctx, x, y, t, s, k, false);
    },
    front(ctx, x, y, t, s, k, dir) {
      flameRing(ctx, x, y, t, s, k, true);
      // A floating grimoire, pages flipping, green fire curling out of it.
      const bx = x + dir * 22 * s;
      const by = y - 40 * s + Math.sin(t * 2) * 2 * s;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.translate(bx, by);
      glow(ctx, 0, -4 * s, 14 * s, '#7de04f', 0.6);
      ctx.fillStyle = '#5a2a6b';
      ctx.fillRect(-7 * s, -1 * s, 14 * s, 6 * s);
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-4 * s, -3 * s, -7 * s, -1 * s);
      ctx.lineTo(-7 * s, 4 * s);
      ctx.quadraticCurveTo(-4 * s, 2 * s, 0, 4 * s);
      ctx.quadraticCurveTo(4 * s, 2 * s, 7 * s, 4 * s);
      ctx.lineTo(7 * s, -1 * s);
      ctx.quadraticCurveTo(4 * s, -3 * s, 0, 0);
      ctx.fill();
      const flip = (t * 1.8) % 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(flip * Math.PI) * 7 * s, -3 * s - Math.sin(flip * Math.PI) * 4 * s);
      ctx.lineTo(Math.cos(flip * Math.PI) * 7 * s, 2 * s - Math.sin(flip * Math.PI) * 4 * s);
      ctx.lineTo(0, 4 * s);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const u = (t * 1.4 + i / 4) % 1;
        ctx.globalAlpha = k * (1 - u);
        ctx.fillStyle = i % 2 ? '#c9ff9b' : '#7de04f';
        ctx.beginPath();
        ctx.arc(Math.sin(u * 8 + i) * 3 * s, -3 * s - u * 16 * s, (2.4 - u * 1.6) * s, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    },
  },

  bishop: {
    back(ctx, x, y, t, s, k) {
      // Great feathered wings and a stained-glass rose window glowing behind the head.
      wings(ctx, x, y - 30 * s, t, s * 1.2, k, ['#ffffff', '#fff6e0', '#eef2ff', '#ffffff'], 6);
      const cx = x;
      const cy = y - 58 * s;
      const r = 17 * s;
      const panes = ['#ff9ec0', '#8fd3ff', '#ffe36b', '#9fe0b0', '#c9a6ff', '#ffb38a', '#8fd3ff', '#ff9ec0'];
      glow(ctx, cx, cy, r * 2, '#fff6c9', k * 0.5);
      ctx.save();
      ctx.globalAlpha = k * 0.85;
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.25);
      panes.forEach((c, i) => {
        const a0 = (i / 8) * TAU;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, a0, a0 + TAU / 8);
        ctx.closePath();
        ctx.fill();
      });
      ctx.strokeStyle = '#d9a440';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.moveTo(r * 0.55, 0);
      ctx.arc(0, 0, r * 0.55, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#fffbe0';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, TAU);
      ctx.fill();
      ctx.restore();
    },
    front(ctx, x, y, t, s, k) {
      rising(ctx, x, y, t, s, { n: 10, spread: 24, height: 76, speed: 0.4, color: '#fff6c9', size: 1.6, seed: 3, shape: 'star' }, k);
      // White feathers drifting down.
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.2 + hash(i + 60)) % 1;
        ctx.save();
        ctx.globalAlpha = k * Math.sin(u * Math.PI);
        ctx.translate(x + (hash(i + 61) - 0.5) * 60 * s + Math.sin(t * 1.4 + i) * 6 * s, y - 80 * s + u * 80 * s);
        ctx.rotate(Math.sin(t * 2 + i) * 0.8);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.6 * s, 4.5 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  },

  windwalker: {
    back(ctx, x, y, t, s, k) {
      glow(ctx, x, y - 26 * s, 34 * s, '#8fe8c0', k * 0.3);
      windRibbons(ctx, x, y, t, s, k, false);
    },
    front(ctx, x, y, t, s, k) {
      // Ribbons of wind spiral up around you, carrying feathers and leaves along.
      windRibbons(ctx, x, y, t, s, k, true);
      for (let i = 0; i < 5; i++) {
        const u = (t * 0.45 + i / 5) % 1;
        const a = u * TAU * 1.5 + t * 2 + i;
        if (Math.sin(a) < 0) continue;
        ctx.save();
        ctx.globalAlpha = k * Math.sin(u * Math.PI);
        ctx.translate(x + Math.cos(a) * 24 * s, y - 6 * s - u * 64 * s);
        ctx.rotate(a);
        ctx.fillStyle = i % 2 ? '#ffffff' : '#9fe0b0';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4 * s, 1.4 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  },

  deadeye: {
    back(ctx, x, y, t, s, k, dir) {
      // A laser sight from the crossbow out to a red dot, flickering as it sweeps.
      const sx = x + dir * 10 * s;
      const sy = y - 24 * s;
      const len = 120 * s;
      const ex = sx + dir * len;
      const ey = sy + Math.sin(t * 0.9) * 10 * s;
      ctx.save();
      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0, 'rgba(255,90,90,0.9)');
      g.addColorStop(1, 'rgba(255,90,90,0.15)');
      ctx.globalAlpha = k * (0.7 + 0.3 * Math.sin(t * 20));
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
      glow(ctx, ex, ey, 6 * s, '#ff5a5a', k);
    },
    front(ctx, x, y, t, s, k, dir) {
      // A tactical HUD: target brackets drifting around and snapping shut, a scope over one eye,
      // and a scan line sweeping down through it all.
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const cyc = (t * 0.5 + i / 3) % 1;
        const bx = x + (hash(Math.floor(t * 0.5 + i / 3) * 7 + i) - 0.5) * 80 * s;
        const by = y - 20 * s - hash(Math.floor(t * 0.5 + i / 3) * 3 + i * 5) * 50 * s;
        const lock = Math.min(1, cyc * 3);
        const r = (12 - lock * 6) * s;
        ctx.globalAlpha = k * (cyc < 0.8 ? 1 : (1 - cyc) * 5);
        ctx.strokeStyle = lock >= 1 ? '#ff5a5a' : '#8fe3ff';
        ctx.lineWidth = 1;
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          ctx.beginPath();
          ctx.moveTo(bx + sx * r, by + sy * r * 0.4);
          ctx.lineTo(bx + sx * r, by + sy * r);
          ctx.lineTo(bx + sx * r * 0.4, by + sy * r);
          ctx.stroke();
        }
        if (lock >= 1) {
          ctx.fillStyle = '#ff5a5a';
          ctx.fillRect(bx - 1, by - 1, 2, 2);
        }
      }
      // The scope over the eye.
      const ex = x + dir * 5 * s;
      const ey = y - 42 * s;
      ctx.globalAlpha = k * 0.9;
      ctx.strokeStyle = '#8fe3ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ex, ey, 6 * s, 0, TAU);
      ctx.stroke();
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(t * 1.5);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#8fe3ff';
        ctx.fillRect(4 * s, -0.5, 4 * s, 1);
      }
      ctx.restore();
      // The scan line.
      const sy = y - 70 * s + ((t * 0.7) % 1) * 72 * s;
      ctx.globalAlpha = k * 0.35;
      ctx.fillStyle = '#8fe3ff';
      ctx.fillRect(x - 30 * s, sy, 60 * s, 1);
      ctx.restore();
    },
  },

  beastmaster: {
    back(ctx, x, y, t, s, k) {
      // A spirit wolf runs circles around you, leaving glowing paw prints, while a hawk circles above.
      for (let i = 0; i < 6; i++) {
        const age = (t * 1.6 / TAU * 6 + i / 6) % 1;
        const ang = t * 1.6 - (i + 1) * 0.5;
        ctx.save();
        ctx.globalAlpha = k * (1 - age) * 0.5;
        ctx.fillStyle = '#8fd86b';
        const px = x + Math.cos(ang) * 26 * s;
        const py = y + Math.sin(ang) * 4 * s + 1;
        ctx.beginPath();
        ctx.ellipse(px, py, 2 * s, 1 * s, 0, 0, TAU);
        ctx.ellipse(px - 2 * s, py - 1.6 * s, 0.8 * s, 0.6 * s, 0, 0, TAU);
        ctx.ellipse(px + 2 * s, py - 1.6 * s, 0.8 * s, 0.6 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      spiritWolf(ctx, x, y, t, s, k, false);
    },
    front(ctx, x, y, t, s, k) {
      spiritWolf(ctx, x, y, t, s, k, true);
      const ha = t * 0.9;
      hawk(ctx, x + Math.cos(ha) * 28 * s, y - 66 * s + Math.sin(ha * 2) * 4 * s, s * 1.5, t, k, -Math.sin(ha) >= 0 ? 1 : -1);
    },
  },

  bladedancer: {
    back(ctx, x, y, t, s, k) {
      // A pale crescent moon behind you and silk ribbons flowing in the breeze.
      const mx = x - 10 * s;
      const my = y - 52 * s;
      glow(ctx, mx, my, 26 * s, '#ffd0e0', k * 0.5);
      ctx.save();
      ctx.globalAlpha = k * 0.9;
      ctx.fillStyle = '#fff0f6';
      ctx.beginPath();
      ctx.arc(mx, my, 13 * s, 0, TAU);
      ctx.arc(mx + 6 * s, my - 4 * s, 11 * s, 0, TAU, true);
      ctx.fill('evenodd');
      ctx.restore();
      silk(ctx, x, y, t, s, k, '#ff9ec0', 0);
      silk(ctx, x, y, t, s, k, '#ffd0e0', 2.1);
    },
    front(ctx, x, y, t, s, k) {
      // Two daggers dance around you, tracing pink arcs; petals fall.
      for (let d = 0; d < 2; d++) {
        const a = t * 3 + d * Math.PI;
        const z = Math.sin(a);
        if (z < -0.2) continue;
        const px = x + Math.cos(a) * 24 * s;
        const py = y - 30 * s + Math.sin(a * 2) * 8 * s;
        ctx.save();
        ctx.globalAlpha = k * 0.6;
        ctx.strokeStyle = '#ff9ec0';
        ctx.lineWidth = 2 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const aa = a - i * 0.12;
          ctx.lineTo(x + Math.cos(aa) * 24 * s, y - 30 * s + Math.sin(aa * 2) * 8 * s);
        }
        ctx.stroke();
        ctx.globalAlpha = k;
        ctx.translate(px, py);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -6 * s);
        ctx.lineTo(1.5 * s, 1 * s);
        ctx.lineTo(-1.5 * s, 1 * s);
        ctx.fill();
        ctx.fillStyle = '#c94f8a';
        ctx.fillRect(-2.5 * s, 1 * s, 5 * s, 1.2 * s);
        ctx.fillRect(-0.6 * s, 2 * s, 1.2 * s, 3 * s);
        ctx.restore();
      }
      for (let i = 0; i < 6; i++) {
        const u = (t * 0.3 + hash(i + 120)) % 1;
        ctx.save();
        ctx.globalAlpha = k * Math.sin(u * Math.PI);
        ctx.translate(x + (hash(i + 121) - 0.5) * 70 * s + Math.sin(t * 1.5 + i) * 8 * s, y - 78 * s + u * 80 * s);
        ctx.rotate(t * 2 + i);
        ctx.fillStyle = i % 2 ? '#ff9ec0' : '#ffd0e0';
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.6 * s, 1.5 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  },

  nightstalker: {
    back(ctx, x, y, t, s, k) {
      // Darkness pools at your feet, tendrils curling up out of it, and eyes open in the dark behind.
      ctx.save();
      const g = ctx.createRadialGradient(x, y, 2, x, y, 40 * s);
      g.addColorStop(0, 'rgba(26,16,48,0.85)');
      g.addColorStop(1, 'rgba(26,16,48,0)');
      ctx.globalAlpha = k;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 40 * s, 9 * s, 0, 0, TAU);
      ctx.fill();
      glow(ctx, x, y - 28 * s, 40 * s, '#2a1a4a', k * 0.55);
      for (let i = 0; i < 5; i++) {
        const bx = x + (i - 2) * 11 * s;
        const h = (36 + 14 * Math.sin(t * 1.3 + i * 1.9)) * s;
        ctx.strokeStyle = i % 2 ? '#3a2a6b' : '#5a3f9a';
        ctx.lineWidth = (3 - Math.abs(i - 2) * 0.6) * s;
        ctx.lineCap = 'round';
        ctx.globalAlpha = k * 0.85;
        ctx.beginPath();
        ctx.moveTo(bx, y);
        for (let j = 1; j <= 8; j++) {
          const u = j / 8;
          ctx.lineTo(bx + Math.sin(t * 2.2 + i + u * 5) * 5 * s * u, y - h * u);
        }
        ctx.stroke();
      }
      // Pairs of glowing eyes that blink open one at a time.
      for (let i = 0; i < 4; i++) {
        const open = Math.max(0, Math.sin(t * 0.9 + i * 1.7));
        if (open < 0.1) continue;
        const ex = x + (hash(i + 140) - 0.5) * 70 * s;
        const ey = y - 30 * s - hash(i + 141) * 40 * s;
        ctx.globalAlpha = k * open;
        ctx.fillStyle = '#c46bff';
        glow(ctx, ex, ey, 8 * s, '#9b6bff', k * open * 0.6);
        ctx.beginPath();
        ctx.ellipse(ex - 3 * s, ey, 1.6 * s, 1.1 * s * open, 0, 0, TAU);
        ctx.ellipse(ex + 3 * s, ey, 1.6 * s, 1.1 * s * open, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    },
    front(ctx, x, y, t, s, k) {
      rising(ctx, x, y, t, s, { n: 10, spread: 22, height: 60, speed: 0.5, color: '#9b6bff', size: 1.4, seed: 151 }, k);
    },
  },

  phantomthief: {
    back(ctx, x, y, t, s, k) {
      // A fan of playing cards spread behind you like a peacock's tail, gems glinting between them.
      const cx = x;
      const cy = y - 24 * s;
      glow(ctx, cx, cy - 10 * s, 36 * s, '#ffd66b', k * 0.3);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * (0.15 + (i / 6) * 0.7) + Math.sin(t * 1.5 + i * 0.5) * 0.05;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.translate(cx + Math.cos(a) * 26 * s, cy + Math.sin(a) * 26 * s);
        ctx.rotate(a + Math.PI / 2);
        card(ctx, s, i);
        ctx.restore();
      }
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI * (0.2 + (i / 3) * 0.6);
        const tw = Math.max(0, Math.sin(t * 3 + i * 2));
        star(ctx, cx + Math.cos(a) * 38 * s, cy + Math.sin(a) * 38 * s, (1.5 + tw * 2) * s, i % 2 ? '#8fe3ff' : '#ff9ec0', k * (0.4 + tw * 0.6));
      }
    },
    front(ctx, x, y, t, s, k, dir) {
      // A calling card spins in your fingers, and a gold monocle glints.
      const px = x + dir * 16 * s;
      const py = y - 30 * s + Math.sin(t * 2) * 2 * s;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.translate(px, py);
      ctx.scale(Math.cos(t * 4), 1);
      card(ctx, s * 0.9, 1);
      ctx.restore();
      const g = (t % 2.5) / 2.5;
      if (g < 0.15) star(ctx, x + dir * 4 * s, y - 44 * s, 4 * s * (1 - g / 0.15), '#ffffff', k);
      rising(ctx, x, y, t, s, { n: 5, spread: 16, height: 46, speed: 0.6, color: '#ffe36b', size: 1.4, seed: 161, shape: 'star' }, k);
    },
  },
});

// A ring of flames around the feet, alternating venom green and orange; `front` is the near half.
function flameRing(ctx, x, y, t, s, k, front) {
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + t * 0.6;
    if ((Math.sin(a) >= 0) !== front) continue;
    const fx = x + Math.cos(a) * 28 * s;
    const fy = y + Math.sin(a) * 6 * s;
    const h = (10 + 6 * Math.sin(t * 9 + i * 2.3)) * s;
    ctx.globalAlpha = k * 0.9;
    for (const [w, hh, c] of [[3.2, 1, i % 2 ? '#7de04f' : '#ff8a3c'], [1.6, 0.6, i % 2 ? '#e6ffd0' : '#ffe36b']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(fx - w * s, fy);
      ctx.quadraticCurveTo(fx - w * s * 0.6, fy - h * hh * 0.6, fx + Math.sin(t * 6 + i) * 1.5 * s, fy - h * hh);
      ctx.quadraticCurveTo(fx + w * s * 0.6, fy - h * hh * 0.6, fx + w * s, fy);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Three wind ribbons spiraling up around the body; `front` draws their near halves.
function windRibbons(ctx, x, y, t, s, k, front) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let r = 0; r < 3; r++) {
    const n = 26;
    for (let i = 1; i <= n; i++) {
      const u0 = (i - 1) / n;
      const u1 = i / n;
      const a0 = u0 * TAU * 1.3 + t * 2.4 + r * 2.1;
      const a1 = u1 * TAU * 1.3 + t * 2.4 + r * 2.1;
      if ((Math.sin(a1) >= 0) !== front) continue;
      const rad = (22 - u1 * 6) * s;
      ctx.globalAlpha = k * Math.sin(u1 * Math.PI) * 0.85;
      ctx.strokeStyle = r === 1 ? '#ffffff' : '#9fe8c8';
      ctx.lineWidth = (1 + Math.sin(u1 * Math.PI) * 2.2) * s;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a0) * (22 - u0 * 6) * s, y - 4 * s - u0 * 66 * s);
      ctx.lineTo(x + Math.cos(a1) * rad, y - 4 * s - u1 * 66 * s);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A silk ribbon floating out behind the body in a lazy wave.
function silk(ctx, x, y, t, s, k, color, phase) {
  ctx.save();
  ctx.globalAlpha = k * 0.75;
  ctx.fillStyle = color;
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    pts.push([x - 6 * s - u * 40 * s, y - 34 * s + Math.sin(t * 2.2 + u * 5 + phase) * 7 * s * u - u * 10 * s, (1 + u * 2.5) * s]);
  }
  ctx.beginPath();
  pts.forEach(([px, py, w], i) => (i ? ctx.lineTo(px, py - w) : ctx.moveTo(px, py - w)));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + pts[i][2]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Signature touches layered onto the second jobs, so each reads at a glance.
const SIGNATURES = {
  blademaster: {
    back(ctx, x, y, t, s, k) {
      // A great spectral sword hanging diagonally behind the back, a glint sliding down it.
      ctx.save();
      ctx.globalAlpha = k * 0.85;
      ctx.translate(x - 4 * s, y - 34 * s + Math.sin(t * 1.5) * 1.5 * s);
      ctx.rotate(-0.7);
      glow(ctx, 0, 0, 30 * s, '#8fd3ff', 0.5);
      ctx.fillStyle = 'rgba(220,238,255,0.85)';
      ctx.strokeStyle = '#8fd3ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -30 * s);
      ctx.lineTo(4 * s, -24 * s);
      ctx.lineTo(4 * s, 16 * s);
      ctx.lineTo(-4 * s, 16 * s);
      ctx.lineTo(-4 * s, -24 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd66b';
      ctx.fillRect(-9 * s, 16 * s, 18 * s, 3 * s);
      ctx.fillStyle = '#6f8fd8';
      ctx.fillRect(-2 * s, 19 * s, 4 * s, 9 * s);
      const g = ((t * 0.6) % 1) * 50 - 30;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3 * s, g * s, 6 * s, 3 * s);
      ctx.restore();
    },
  },
  lancer: {
    back(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 22 * s, t, s, { n: 4, rx: 26, ry: 7, speed: 1.2, draw: (px, py) => spearTip(ctx, x, y - 22 * s, px, py, s, k) }, false);
    },
    front(ctx, x, y, t, s, k) {
      // A phalanx wheel: spear points circling the waist, all facing outward.
      orbit(ctx, x, y - 22 * s, t, s, { n: 4, rx: 26, ry: 7, speed: 1.2, draw: (px, py) => spearTip(ctx, x, y - 22 * s, px, py, s, k) }, true);
    },
  },
  guardian: {
    back(ctx, x, y, t, s, k) {
      // The ground cracks under your weight, amber light glowing up through the fissures.
      ctx.save();
      ctx.globalAlpha = k * (0.7 + 0.3 * Math.sin(t * 2));
      ctx.strokeStyle = '#ffb35a';
      ctx.shadowColor = '#ff8a3c';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 5 * s, y + Math.sin(a) * 1.5 * s);
        ctx.lineTo(x + Math.cos(a + 0.2) * 16 * s, y + Math.sin(a + 0.2) * 4 * s);
        ctx.lineTo(x + Math.cos(a - 0.1) * 28 * s, y + Math.sin(a - 0.1) * 7 * s);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  ilwizard: {
    back(ctx, x, y, t, s, k) {
      // A great snowflake rune laid flat under your feet, slowly turning.
      ctx.save();
      ctx.globalAlpha = k * 0.85;
      ctx.translate(x, y);
      ctx.scale(1, 0.3);
      ctx.rotate(t * 0.5);
      ctx.strokeStyle = '#bfe6ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#8fe3ff';
      ctx.shadowBlur = 6;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(TAU / 6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(28 * s, 0);
        ctx.moveTo(16 * s, 0);
        ctx.lineTo(22 * s, -6 * s);
        ctx.moveTo(16 * s, 0);
        ctx.lineTo(22 * s, 6 * s);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
  fpwizard: {
    front(ctx, x, y, t, s, k, dir) {
      // Fire dancing in one palm, venom-green flame in the other.
      handFlame(ctx, x + dir * 11 * s, y - 22 * s, t, s, k, ['#ff6b2b', '#ffd66b']);
      handFlame(ctx, x - dir * 11 * s, y - 22 * s, t + 1.3, s, k, ['#5fc84a', '#e6ffd0']);
    },
  },
  cleric: {
    front(ctx, x, y, t, s, k, dir) {
      // A warm healing orb resting over the palm, light pulsing out of it.
      const ox = x + dir * 13 * s;
      const oy = y - 30 * s + Math.sin(t * 2) * 1.5 * s;
      const pulse = (t * 0.8) % 1;
      glow(ctx, ox, oy, 12 * s, '#fff6c9', k * 0.9);
      ctx.save();
      ctx.globalAlpha = k * (1 - pulse);
      ctx.strokeStyle = '#ffe36b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ox, oy, (3 + pulse * 10) * s, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = k;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ox, oy, 2.6 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
    },
  },
  ranger: {
    back(ctx, x, y, t, s, k) {
      // Gusts of wind sweeping past in long arcs.
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.7 + i / 3) % 1;
        const gy = y - (14 + i * 18) * s;
        ctx.globalAlpha = k * Math.sin(u * Math.PI) * 0.8;
        ctx.strokeStyle = '#e8fff4';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.arc(x - 40 * s + u * 80 * s, gy, 10 * s, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
};
for (const [id, extra] of Object.entries(SIGNATURES)) {
  const base = JOBS[id];
  JOBS[id] = {
    back: (...a) => { extra.back?.(...a); base.back?.(...a); },
    front: (...a) => { base.front?.(...a); extra.front?.(...a); },
  };
}

// ---------- Endgame grandeur ----------
// Third jobs get an extra layer of scale on top of their signature look, and every few seconds a
// climax: a short, showy moment that plays out and settles back into the idle aura.

// Progress (0-1) through a climax that fires every `period` seconds and lasts `dur`, else -1.
function climax(t, period, dur) {
  const c = t % period;
  return c < dur ? c / dur : -1;
}

const easeOut = (p) => 1 - (1 - p) * (1 - p);

// An expanding ring flat on the ground (or upright when `flat` is 1).
function ring(ctx, x, y, r, flat, color, width, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * flat, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// A sword stuck point-first in the ground; (x, y) is where the blade meets the ground.
function plantedSword(ctx, x, y, s, k, tilt) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = '#dbe9ff';
  ctx.strokeStyle = '#6f8fd8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.rect(-1.6 * s, -14 * s, 3.2 * s, 14 * s);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd66b';
  ctx.fillRect(-4.5 * s, -15.5 * s, 9 * s, 2 * s);
  ctx.fillStyle = '#6f8fd8';
  ctx.fillRect(-1 * s, -20 * s, 2 * s, 4.5 * s);
  ctx.restore();
}

// A little skull of green fire.
function fireSkull(ctx, x, y, r, k, t) {
  glow(ctx, x, y, r * 3, '#7de04f', k * 0.6);
  ctx.save();
  ctx.globalAlpha = k;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i ? '#c9ff9b' : '#7de04f';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8 + i * r * 0.8, y - r * 0.6);
    ctx.quadraticCurveTo(x - r * 0.6 + i * r * 0.8, y - r * 2.2 - Math.sin(t * 9 + i) * r * 0.5, x - r * 0.4 + i * r * 0.8, y - r * 0.6);
    ctx.fill();
  }
  ctx.fillStyle = '#e6ffd0';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillRect(x - r * 0.6, y + r * 0.5, r * 1.2, r * 0.7);
  ctx.fillStyle = '#2f5a1f';
  ctx.beginPath();
  ctx.arc(x - r * 0.38, y, r * 0.28, 0, TAU);
  ctx.arc(x + r * 0.38, y, r * 0.28, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function musicNote(ctx, x, y, s, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 2.2 * s, 1.6 * s, -0.4, 0, TAU);
  ctx.fill();
  ctx.fillRect(x + 1.4 * s, y - 8 * s, 1 * s, 8 * s);
  ctx.fillRect(x + 1.4 * s, y - 8 * s, 4 * s, 1.4 * s);
  ctx.restore();
}

const GRAND = {
  swordsaint: {
    back(ctx, x, y, t, s, k) {
      // A circle of swords planted in the ground around you, the far half behind.
      glow(ctx, x, y - 30 * s, 60 * s, '#bfe0ff', k * 0.3);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.15;
        if (Math.sin(a) >= 0) continue;
        plantedSword(ctx, x + Math.cos(a) * 34 * s, y + Math.sin(a) * 8 * s, s * 0.9, k * 0.85, Math.cos(a) * 0.15);
      }
    },
    front(ctx, x, y, t, s, k) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.15;
        if (Math.sin(a) < 0) continue;
        plantedSword(ctx, x + Math.cos(a) * 34 * s, y + Math.sin(a) * 8 * s, s, k, Math.cos(a) * 0.15);
      }
      // Climax, Sword Volley: nine blades launch out of the fan in a radial burst, a ring of
      // light cuts across the ground, and the swords streak away.
      const u = climax(t, 5, 1.2);
      if (u < 0) return;
      const cx = x;
      const cy = y - 32 * s;
      if (u < 0.15) glow(ctx, cx, cy, 50 * s, '#ffffff', k * (1 - u / 0.15));
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * (0.08 + (i / 8) * 0.84);
        const d = (34 + easeOut(Math.min(1, u * 1.6)) * 110) * s;
        const fade = 1 - u;
        ctx.save();
        ctx.globalAlpha = k * fade;
        ctx.strokeStyle = '#bfe0ff';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (d - 26 * s), cy + Math.sin(a) * (d - 26 * s));
        ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        ctx.stroke();
        ctx.restore();
        floatSword(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 8 * s, a - Math.PI / 2 + Math.PI, k * fade, '#ffffff', '#8fd3ff');
      }
      ring(ctx, x, y, (12 + easeOut(u) * 80) * s, 0.22, '#ffffff', 3 * s * (1 - u) + 0.5, k * (1 - u));
    },
  },

  dragonknight: {
    back(ctx, x, y, t, s, k) {
      // The ground smolders in a ring of embers and licking flames.
      glow(ctx, x, y - 30 * s, 64 * s, '#ff3a3a', k * 0.22);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        if (Math.sin(a) >= 0) continue;
        const fx = x + Math.cos(a) * 34 * s;
        const fy = y + Math.sin(a) * 8 * s;
        const h = (7 + 4 * Math.sin(t * 8 + i * 2)) * s;
        ctx.save();
        ctx.globalAlpha = k * 0.85;
        ctx.fillStyle = i % 2 ? '#ff5a3a' : '#ffb35a';
        ctx.beginPath();
        ctx.moveTo(fx - 2.5 * s, fy);
        ctx.quadraticCurveTo(fx, fy - h * 1.4, fx + 2.5 * s, fy);
        ctx.fill();
        ctx.restore();
      }
    },
    front(ctx, x, y, t, s, k, dir) {
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        if (Math.sin(a) < 0) continue;
        const fx = x + Math.cos(a) * 34 * s;
        const fy = y + Math.sin(a) * 8 * s;
        const h = (8 + 4 * Math.sin(t * 8 + i * 2)) * s;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.fillStyle = i % 2 ? '#ff5a3a' : '#ffd66b';
        ctx.beginPath();
        ctx.moveTo(fx - 2.8 * s, fy);
        ctx.quadraticCurveTo(fx, fy - h * 1.5, fx + 2.8 * s, fy);
        ctx.fill();
        ctx.restore();
      }
      // Climax, Dragon's Roar: shockwaves blast out of the dragon's jaws, a gout of flame pours
      // out, and the air glows red.
      const u = climax(t, 5.5, 1.3);
      if (u < 0) return;
      const hx = x;
      const hy = y - 70 * s;
      glow(ctx, hx, hy, (40 + u * 60) * s, '#ff3a3a', k * 0.5 * (1 - u));
      for (let r = 0; r < 3; r++) {
        const ru = Math.max(0, u - r * 0.15);
        ring(ctx, hx, hy, (6 + easeOut(ru) * 70) * s, 0.75, r === 1 ? '#ffd66b' : '#ff5a5a', 2.5 * s, k * (1 - ru) * (ru > 0 ? 1 : 0));
      }
      for (let i = 0; i < 14; i++) {
        const v = Math.min(1, u * 1.5) - i * 0.03;
        if (v <= 0) continue;
        const d = v * 90 * s;
        const spread = (hash(i + 7) - 0.5) * 0.7;
        ctx.save();
        ctx.globalAlpha = k * (1 - u);
        ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 2 ? '#ffd66b' : '#ff6b3a';
        ctx.beginPath();
        ctx.arc(hx + dir * d, hy - 6 * s + spread * d, (5 - v * 2) * s, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  },

  paladin: {
    back(ctx, x, y, t, s, k) {
      // A wheel of golden crosses turning slowly on the ground.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + t * 0.4;
        if (Math.sin(a) >= 0) continue;
        crossMark(ctx, x + Math.cos(a) * 34 * s, y + Math.sin(a) * 8 * s, s, k * 0.75);
      }
    },
    front(ctx, x, y, t, s, k) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + t * 0.4;
        if (Math.sin(a) < 0) continue;
        crossMark(ctx, x + Math.cos(a) * 34 * s, y + Math.sin(a) * 8 * s, s, k);
      }
      // Climax, Divine Descent: a column of light slams down onto you, the barrier blazes, and
      // golden feathers scatter.
      const u = climax(t, 6, 1.4);
      if (u < 0) return;
      const drop = Math.min(1, u * 4);
      const fade = u < 0.3 ? 1 : 1 - (u - 0.3) / 0.7;
      const top = y - 200 * s;
      const bottom = top + (y - top) * easeOut(drop);
      const w = (18 - u * 10) * s;
      ctx.save();
      ctx.globalAlpha = k * fade;
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
      g.addColorStop(0, 'rgba(255,246,201,0)');
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(1, 'rgba(255,246,201,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - w, top, w * 2, bottom - top);
      ctx.restore();
      if (drop >= 1) {
        const v = (u - 0.25) / 0.75;
        ring(ctx, x, y, (10 + easeOut(v) * 70) * s, 0.25, '#ffe36b', 3 * s, k * (1 - v));
        glow(ctx, x, y - 24 * s, 50 * s, '#fff6c9', k * (1 - v) * 0.8);
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU;
          const d = easeOut(v) * 50 * s;
          ctx.save();
          ctx.globalAlpha = k * (1 - v);
          ctx.translate(x + Math.cos(a) * d, y - 30 * s + Math.sin(a) * d * 0.7 + v * v * 20 * s);
          ctx.rotate(a + v * 3);
          ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe9a0';
          ctx.beginPath();
          ctx.ellipse(0, 0, 1.5 * s, 4 * s, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }
    },
  },

  ilarchmage: {
    back(ctx, x, y, t, s, k) {
      glow(ctx, x, y - 40 * s, 56 * s, '#bfe6ff', k * 0.25);
    },
    front(ctx, x, y, t, s, k) {
      // The near half of the frost ring, so the ice fully surrounds you.
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        if (Math.sin(a) <= 0) continue;
        const px = x + Math.cos(a) * 26 * s;
        const py = y + Math.sin(a) * 6 * s;
        const h = (7 + 5 * Math.sin(t * 1.5 + i * 1.7)) * s;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.fillStyle = i % 2 ? '#bfe6ff' : '#e8fbff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(px - 2.6 * s, py);
        ctx.lineTo(px, py - h);
        ctx.lineTo(px + 2.6 * s, py);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // Climax, Thunderclap: the ball lightning discharges into the ice around you, then a
      // frost nova bursts out across the ground with shards flying.
      const u = climax(t, 5, 1.1);
      if (u < 0) return;
      const ox = x;
      const oy = y - 64 * s;
      if (u < 0.35) {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU + 0.4;
          zap(ctx, ox, oy, x + Math.cos(a) * 26 * s, y + Math.sin(a) * 6 * s - 6 * s, t + i, s * 1.4, k * (1 - u / 0.35));
        }
        glow(ctx, ox, oy, 36 * s, '#fffbe0', k * (1 - u / 0.35));
      }
      const v = Math.max(0, (u - 0.2) / 0.8);
      if (v > 0) {
        ring(ctx, x, y, (20 + easeOut(v) * 90) * s, 0.22, '#e8fbff', 4 * s * (1 - v) + 0.5, k * (1 - v));
        ring(ctx, x, y, (10 + easeOut(v) * 60) * s, 0.22, '#8fe3ff', 2 * s, k * (1 - v));
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU;
          const d = (20 + easeOut(v) * 70) * s;
          ctx.save();
          ctx.globalAlpha = k * (1 - v);
          ctx.translate(x + Math.cos(a) * d, y - 6 * s + Math.sin(a) * d * 0.25 - Math.sin(v * Math.PI) * 18 * s);
          ctx.rotate(v * 8 + i);
          ctx.fillStyle = i % 2 ? '#e8fbff' : '#8fe3ff';
          ctx.fillRect(-1.5 * s, -3 * s, 3 * s, 6 * s);
          ctx.restore();
        }
      }
    },
  },

  fparchmage: {
    back(ctx, x, y, t, s, k) {
      // Three wisps of green fire with skull faces circling behind you.
      for (let i = 0; i < 3; i++) {
        const a = t * 0.9 + (i / 3) * TAU;
        if (Math.sin(a) >= 0) continue;
        fireSkull(ctx, x + Math.cos(a) * 34 * s, y - 40 * s + Math.sin(a * 2) * 6 * s, 3.2 * s, k * 0.8, t + i);
      }
    },
    front(ctx, x, y, t, s, k, dir) {
      for (let i = 0; i < 3; i++) {
        const a = t * 0.9 + (i / 3) * TAU;
        if (Math.sin(a) < 0) continue;
        fireSkull(ctx, x + Math.cos(a) * 34 * s, y - 40 * s + Math.sin(a * 2) * 6 * s, 3.8 * s, k, t + i);
      }
      // Climax, Plague Eruption: the flame ring roars up into a tower of venom fire, and a great
      // burning skull rises out of the grimoire and howls away.
      const u = climax(t, 5.5, 1.4);
      if (u < 0) return;
      const up = Math.sin(Math.min(1, u * 1.3) * Math.PI);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + t;
        const fx = x + Math.cos(a) * 28 * s;
        const fy = y + Math.sin(a) * 6 * s;
        const h = (20 + 50 * up + 10 * Math.sin(t * 12 + i)) * s;
        ctx.save();
        ctx.globalAlpha = k * up * 0.85;
        ctx.fillStyle = i % 2 ? '#7de04f' : '#ff8a3c';
        ctx.beginPath();
        ctx.moveTo(fx - 3.5 * s, fy);
        ctx.quadraticCurveTo(fx - 2 * s, fy - h * 0.6, fx + Math.sin(t * 7 + i) * 3 * s, fy - h);
        ctx.quadraticCurveTo(fx + 2 * s, fy - h * 0.6, fx + 3.5 * s, fy);
        ctx.fill();
        ctx.restore();
      }
      const sk = Math.min(1, u * 1.2);
      fireSkull(ctx, x + dir * 22 * s, y - 46 * s - easeOut(sk) * 60 * s, (4 + sk * 7) * s, k * (1 - Math.max(0, u - 0.6) / 0.4), t);
    },
  },

  bishop: {
    front(ctx, x, y, t, s, k) {
      // A halo of tiny stars circling the rose window.
      const cx = x;
      const cy = y - 58 * s;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU - t * 0.6;
        star(ctx, cx + Math.cos(a) * 24 * s, cy + Math.sin(a) * 24 * s, (1.2 + Math.max(0, Math.sin(t * 3 + i)) * 1.2) * s, '#fffbe0', k * 0.9);
      }
      // Climax, Hymn of Light: the window flares and casts long rays, rings of gold pulse out like
      // a bell's toll, and music notes drift up.
      const u = climax(t, 6, 1.6);
      if (u < 0) return;
      const fade = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.8);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const len = (60 + (i % 2) * 30) * s;
        const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        g.addColorStop(0, 'rgba(255,251,224,0.9)');
        g.addColorStop(1, 'rgba(255,251,224,0)');
        ctx.globalAlpha = k * fade;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - 0.05) * len, Math.sin(a - 0.05) * len);
        ctx.lineTo(Math.cos(a + 0.05) * len, Math.sin(a + 0.05) * len);
        ctx.fill();
      }
      ctx.restore();
      for (let r = 0; r < 3; r++) {
        const ru = Math.max(0, u - r * 0.2);
        if (ru > 0) ring(ctx, cx, cy, (18 + easeOut(ru) * 60) * s, 1, '#ffe36b', 2 * s, k * (1 - ru));
      }
      for (let i = 0; i < 4; i++) {
        const v = Math.max(0, u - i * 0.12);
        musicNote(ctx, cx + (i - 1.5) * 16 * s + Math.sin(v * 6 + i) * 4 * s, cy - v * 40 * s, s, i % 2 ? '#ffe36b' : '#ffffff', k * Math.sin(Math.min(1, v) * Math.PI));
      }
    },
  },

  windwalker: {
    back(ctx, x, y, t, s, k) {
      glow(ctx, x, y - 30 * s, 56 * s, '#c9f6e0', k * 0.22);
    },
    front(ctx, x, y, t, s, k) {
      // Climax, Gale: a tornado spins up around you, then bursts, flinging feathers outward.
      const u = climax(t, 5, 1.3);
      if (u < 0) return;
      const spin = u < 0.65;
      if (spin) {
        const grow = Math.min(1, u / 0.2);
        // The funnel body: a translucent cone widening upward, with streaks racing around it.
        ctx.save();
        const top = y - 92 * s * grow;
        const g = ctx.createLinearGradient(0, top, 0, y);
        g.addColorStop(0, 'rgba(201,246,224,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0.15)');
        ctx.globalAlpha = k;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - 8 * s, y);
        ctx.quadraticCurveTo(x - 14 * s + Math.sin(t * 5) * 4 * s, y - 50 * s * grow, x - 42 * s * grow, top);
        ctx.lineTo(x + 42 * s * grow, top);
        ctx.quadraticCurveTo(x + 14 * s + Math.sin(t * 5) * 4 * s, y - 50 * s * grow, x + 8 * s, y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        for (let i = 0; i < 9; i++) {
          const v = i / 8;
          const ry = 3 * s + v * 2 * s;
          const rx = (10 + v * 30) * s * grow;
          const py = y - v * 90 * s * grow;
          ctx.save();
          ctx.globalAlpha = k * 0.7;
          ctx.strokeStyle = i % 2 ? '#ffffff' : '#9fe8c8';
          ctx.lineWidth = 2 * s;
          ctx.beginPath();
          ctx.ellipse(x + Math.sin(t * 6 + v * 4) * 4 * s, py, rx, ry, 0, t * 14 + i, t * 14 + i + 4.2);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        const v = (u - 0.65) / 0.35;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU;
          const d = (20 + easeOut(v) * 80) * s;
          ctx.save();
          ctx.globalAlpha = k * (1 - v);
          ctx.translate(x + Math.cos(a) * d, y - 40 * s + Math.sin(a) * d * 0.6);
          ctx.rotate(a + v * 6);
          ctx.fillStyle = i % 2 ? '#ffffff' : '#9fe0b0';
          ctx.beginPath();
          ctx.ellipse(0, 0, 5 * s, 1.6 * s, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ring(ctx, x, y - 40 * s, (20 + easeOut(v) * 70) * s, 0.6, '#c9f6e0', 2 * s, k * (1 - v));
      }
    },
  },

  deadeye: {
    back(ctx, x, y, t, s, k) {
      // A rangefinder dial: a dashed ring with tick marks turning around you.
      ctx.save();
      ctx.globalAlpha = k * 0.6;
      ctx.strokeStyle = '#8fe3ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4 * s, 3 * s]);
      ctx.lineDashOffset = -t * 20;
      ctx.beginPath();
      ctx.ellipse(x, y - 30 * s, 40 * s, 40 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU + t * 0.3;
        const r0 = (i % 6 ? 42 : 40) * s;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r0, y - 30 * s + Math.sin(a) * r0);
        ctx.lineTo(x + Math.cos(a) * 45 * s, y - 30 * s + Math.sin(a) * 45 * s);
        ctx.stroke();
      }
      ctx.restore();
    },
    front(ctx, x, y, t, s, k, dir) {
      // Climax, Lock and Fire: brackets converge on one far target and lock red, then a tracer
      // round cracks across to it with a muzzle flash and a burst of sparks.
      const u = climax(t, 4.5, 1);
      if (u < 0) return;
      const tx = x + dir * 100 * s;
      const ty = y - 26 * s;
      if (u < 0.55) {
        const v = u / 0.55;
        const r = (24 - v * 16) * s;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.strokeStyle = v > 0.8 ? '#ff5a5a' : '#8fe3ff';
        ctx.lineWidth = 1.5;
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          ctx.beginPath();
          ctx.moveTo(tx + sx * r, ty + sy * r * 0.4);
          ctx.lineTo(tx + sx * r, ty + sy * r);
          ctx.lineTo(tx + sx * r * 0.4, ty + sy * r);
          ctx.stroke();
        }
        if (v > 0.8) {
          ctx.font = `bold ${Math.round(6 * s)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ff5a5a';
          ctx.fillText('LOCK', tx, ty - r - 3 * s);
        }
        ctx.restore();
      } else {
        const v = (u - 0.55) / 0.45;
        const sx = x + dir * 12 * s;
        ctx.save();
        ctx.globalAlpha = k * (1 - v);
        ctx.strokeStyle = '#fffbe0';
        ctx.shadowColor = '#ff5a5a';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.5 * s * (1 - v) + 0.5;
        ctx.beginPath();
        ctx.moveTo(sx, ty);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.restore();
        glow(ctx, sx, ty, 14 * s, '#ffe36b', k * (1 - v));
        glow(ctx, tx, ty, 22 * s, '#ff5a5a', k * (1 - v));
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          star(ctx, tx + Math.cos(a) * easeOut(v) * 18 * s, ty + Math.sin(a) * easeOut(v) * 18 * s, 2 * s, '#ffd66b', k * (1 - v));
        }
      }
    },
  },

  beastmaster: {
    back(ctx, x, y, t, s, k) {
      // Climax, Spirit Howl: a giant ghostly wolf rises behind you, throws back its head and
      // howls, sound rings rolling up into the sky.
      const u = climax(t, 6, 1.7);
      if (u < 0) return;
      const rise = Math.min(1, u * 3);
      const fade = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25;
      const hx = x;
      const hy = y - 40 * s - rise * 20 * s;
      ctx.save();
      ctx.globalAlpha = k * fade * 0.9;
      glow(ctx, hx, hy, 60 * s, '#8fd86b', 0.7);
      ctx.translate(hx, hy);
      ctx.rotate(-0.55 * rise);
      // The head: skull, long muzzle with the jaw dropping open, two ears, a ruff of fur.
      const jaw = rise * 6 * s;
      const head = () => {
        ctx.beginPath();
        ctx.ellipse(0, 0, 20 * s, 15 * s, 0, 0, TAU);
        ctx.moveTo(10 * s, -10 * s);
        ctx.lineTo(40 * s, -4 * s);
        ctx.lineTo(39 * s, 1 * s);
        ctx.lineTo(12 * s, 4 * s);
        ctx.moveTo(12 * s, 5 * s);
        ctx.lineTo(36 * s, 5 * s + jaw);
        ctx.lineTo(12 * s, 11 * s);
        ctx.moveTo(-8 * s, -11 * s);
        ctx.lineTo(-4 * s, -32 * s);
        ctx.lineTo(4 * s, -12 * s);
        ctx.moveTo(2 * s, -13 * s);
        ctx.lineTo(9 * s, -30 * s);
        ctx.lineTo(12 * s, -10 * s);
        for (let i = 0; i < 3; i++) {
          const a = Math.PI * (0.8 + i * 0.16);
          ctx.moveTo(Math.cos(a) * 16 * s, Math.sin(a) * 12 * s);
          ctx.lineTo(Math.cos(a) * 26 * s, Math.sin(a) * 20 * s);
          ctx.lineTo(Math.cos(a + 0.12) * 16 * s, Math.sin(a + 0.12) * 12 * s);
        }
      };
      ctx.strokeStyle = '#4f8a3a';
      ctx.lineWidth = 3 * s;
      ctx.lineJoin = 'round';
      head();
      ctx.stroke();
      ctx.fillStyle = '#eaffde';
      head();
      ctx.fill();
      ctx.fillStyle = '#8fd86b';
      ctx.beginPath();
      ctx.ellipse(-4 * s, -4 * s, 12 * s, 5 * s, 0.2, 0, TAU);
      ctx.fill();
      glow(ctx, 14 * s, -4 * s, 7 * s, '#fff6a0', 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12 * s, -5 * s, 4 * s, 2 * s);
      ctx.restore();
      for (let r = 0; r < 3; r++) {
        const ru = Math.max(0, u - 0.25 - r * 0.15);
        if (ru <= 0) continue;
        ctx.save();
        ctx.globalAlpha = k * (1 - ru) * 0.8;
        ctx.strokeStyle = '#c9f6b0';
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.arc(hx + 20 * s, hy - 16 * s, (10 + ru * 50) * s, -Math.PI * 0.85, -Math.PI * 0.25);
        ctx.stroke();
        ctx.restore();
      }
    },
    front(ctx, x, y, t, s, k, dir) {
      // During the howl the hawk dives across in a sweeping arc.
      const u = climax(t, 6, 1.7);
      if (u < 0) return;
      const v = Math.min(1, u * 1.4);
      const hx = x - dir * 80 * s + dir * v * 160 * s;
      const hy = y - 90 * s + Math.sin(v * Math.PI) * 60 * s;
      for (let i = 1; i <= 4; i++) glow(ctx, hx - dir * i * 8 * s, hy - Math.cos(v * Math.PI) * i * 5 * s, 5 * s, '#fff6a0', k * (0.5 - i * 0.1));
      hawk(ctx, hx, hy, s * 1.8, t * 2, k, dir);
    },
  },

  bladedancer: {
    front(ctx, x, y, t, s, k) {
      // Climax, Petal Storm: the two daggers multiply into a spinning ring of eight blades, then
      // everything bursts outward in a spiral of petals.
      const u = climax(t, 5, 1.3);
      if (u < 0) return;
      if (u < 0.6) {
        const grow = Math.min(1, u / 0.15);
        for (let i = 0; i < 8; i++) {
          const a = t * 9 + (i / 8) * TAU;
          const px = x + Math.cos(a) * 38 * s * grow;
          const py = y - 30 * s + Math.sin(a) * 16 * s * grow;
          ctx.save();
          ctx.globalAlpha = k * 0.5;
          ctx.strokeStyle = '#ff9ec0';
          ctx.lineWidth = 3 * s;
          ctx.beginPath();
          ctx.ellipse(x, y - 30 * s, 38 * s * grow, 16 * s * grow, 0, a - 0.5, a);
          ctx.stroke();
          ctx.globalAlpha = k;
          ctx.translate(px, py);
          ctx.rotate(a + Math.PI);
          glow(ctx, 0, 0, 9 * s, '#ff9ec0', 0.7);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#c94f8a';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, -11 * s);
          ctx.lineTo(2.4 * s, 1 * s);
          ctx.lineTo(-2.4 * s, 1 * s);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#c94f8a';
          ctx.fillRect(-3.5 * s, 1 * s, 7 * s, 1.6 * s);
          ctx.fillRect(-0.8 * s, 2.6 * s, 1.6 * s, 4 * s);
          ctx.restore();
        }
      } else {
        const v = (u - 0.6) / 0.4;
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * TAU + v * 2;
          const d = (14 + easeOut(v) * 90 * (0.6 + hash(i) * 0.4)) * s;
          ctx.save();
          ctx.globalAlpha = k * (1 - v);
          ctx.translate(x + Math.cos(a) * d, y - 30 * s + Math.sin(a) * d * 0.6);
          ctx.rotate(a * 3 + v * 5);
          ctx.fillStyle = i % 3 ? '#ff9ec0' : '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.2 * s, 1.8 * s, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }
    },
  },

  nightstalker: {
    back(ctx, x, y, t, s, k) {
      // Climax, A Hundred Eyes: the darkness swells and eyes snap open all around you.
      const u = climax(t, 5.5, 1.4);
      if (u < 0) return;
      const swell = Math.sin(Math.min(1, u * 1.1) * Math.PI);
      glow(ctx, x, y - 30 * s, 80 * s * swell, '#1a1030', k * swell * 0.85);
      for (let i = 0; i < 12; i++) {
        const open = Math.max(0, Math.min(1, (u - i * 0.03) * 6)) * (u > 0.8 ? (1 - u) / 0.2 : 1);
        if (open <= 0) continue;
        const a = (i / 12) * TAU + 0.3;
        const d = (34 + hash(i + 200) * 22) * s;
        const ex = x + Math.cos(a) * d;
        const ey = y - 34 * s + Math.sin(a) * d * 0.7;
        glow(ctx, ex, ey, 7 * s, '#9b6bff', k * open * 0.7);
        ctx.save();
        ctx.globalAlpha = k * open;
        ctx.fillStyle = '#e0b0ff';
        ctx.beginPath();
        ctx.ellipse(ex - 3 * s, ey, 1.8 * s, 1.2 * s * open, 0, 0, TAU);
        ctx.ellipse(ex + 3 * s, ey, 1.8 * s, 1.2 * s * open, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
    front(ctx, x, y, t, s, k) {
      // ...then a purple crescent slash cuts across you and the dark snaps shut.
      const u = climax(t, 5.5, 1.4);
      if (u < 0.6 || u > 0.9) return;
      const v = (u - 0.6) / 0.3;
      ctx.save();
      ctx.globalAlpha = k * (1 - v);
      ctx.strokeStyle = '#c46bff';
      ctx.shadowColor = '#9b6bff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4 * s * (1 - v) + 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y - 30 * s, 34 * s, -2.6, -2.6 + Math.min(1, v * 2.5) * 2.6);
      ctx.stroke();
      ctx.restore();
    },
  },

  phantomthief: {
    front(ctx, x, y, t, s, k) {
      // Climax, The Shuffle: cards fly up into a spinning ring over your head, riffle, and rain
      // back down with a shower of gold coins.
      const u = climax(t, 5, 1.5);
      if (u < 0) return;
      const up = u < 0.25 ? easeOut(u / 0.25) : u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1;
      const cx = x;
      const cy = y - 30 * s - up * 44 * s;
      for (let i = 0; i < 10; i++) {
        const a = t * 5 + (i / 10) * TAU;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.translate(cx + Math.cos(a) * 28 * s * up, cy + Math.sin(a) * 8 * s * up);
        ctx.scale(Math.cos(a * 2), 1);
        card(ctx, s * 0.9, i);
        ctx.restore();
      }
      if (u > 0.4) {
        const v = (u - 0.4) / 0.6;
        for (let i = 0; i < 10; i++) {
          const px = x + (hash(i + 300) - 0.5) * 70 * s;
          const py = y - 80 * s + ((v * 1.4 + hash(i + 301)) % 1) * 80 * s;
          goldCoin(ctx, px, py, 2.6 * s, t * 4 + i, k * (1 - v * 0.6));
        }
      }
    },
  },
};
for (const [id, extra] of Object.entries(GRAND)) {
  const base = JOBS[id];
  JOBS[id] = {
    back: (...a) => { extra.back?.(...a); base.back?.(...a); },
    front: (...a) => { base.front?.(...a); extra.front?.(...a); },
  };
}

function crossMark(ctx, x, y, s, k) {
  glow(ctx, x, y - 3 * s, 6 * s, '#ffe36b', k * 0.6);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = '#ffd66b';
  ctx.fillRect(x - 0.9 * s, y - 7 * s, 1.8 * s, 7 * s);
  ctx.fillRect(x - 2.8 * s, y - 5.2 * s, 5.6 * s, 1.6 * s);
  ctx.restore();
}

// A spear point aimed outward from the center (cx, cy).
function spearTip(ctx, cx, cy, px, py, s, k) {
  const a = Math.atan2(py - cy, (px - cx) / 3.5);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(px, py);
  ctx.rotate(a);
  glow(ctx, 0, 0, 8 * s, '#9fd8ff', 0.6);
  ctx.fillStyle = '#e6f2ff';
  ctx.strokeStyle = '#4f6fb8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(7 * s, 0);
  ctx.lineTo(0, -2.6 * s);
  ctx.lineTo(-3 * s, 0);
  ctx.lineTo(0, 2.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4f6fb8';
  ctx.fillRect(-9 * s, -0.7 * s, 6 * s, 1.4 * s);
  ctx.restore();
}

// A flame flickering above a palm, in two colors (outer, core).
function handFlame(ctx, x, y, t, s, k, [outer, core]) {
  glow(ctx, x, y - 3 * s, 9 * s, outer, k * 0.6);
  ctx.save();
  ctx.globalAlpha = k;
  for (const [w, h, c] of [[3, 9, outer], [1.6, 5, core]]) {
    const hh = h * (0.8 + 0.2 * Math.sin(t * 12)) * s;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - w * s, y);
    ctx.quadraticCurveTo(x - w * s, y - hh * 0.6, x + Math.sin(t * 9) * 1.2 * s, y - hh);
    ctx.quadraticCurveTo(x + w * s, y - hh * 0.6, x + w * s, y);
    ctx.fill();
  }
  ctx.restore();
}

// A ring of thorny brambles curling around the feet; `front` draws the near half.
function brambles(ctx, x, y, t, s, k, front) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.lineCap = 'round';
  const n = 40;
  for (let i = 1; i <= n; i++) {
    const a0 = ((i - 1) / n) * TAU + t * 0.2;
    const a1 = (i / n) * TAU + t * 0.2;
    if ((Math.sin(a1) >= 0) !== front) continue;
    const r0 = (26 + Math.sin(a0 * 5 + t) * 3) * s;
    const r1 = (26 + Math.sin(a1 * 5 + t) * 3) * s;
    const lift = (u) => Math.abs(Math.sin(u * 3)) * 6 * s;
    ctx.strokeStyle = '#4f8a3a';
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a0) * r0, y + Math.sin(a0) * 6 * s - lift(a0));
    ctx.lineTo(x + Math.cos(a1) * r1, y + Math.sin(a1) * 6 * s - lift(a1));
    ctx.stroke();
    if (i % 3 === 0) {
      const tx = x + Math.cos(a1) * r1;
      const ty = y + Math.sin(a1) * 6 * s - lift(a1);
      ctx.fillStyle = '#c9e08f';
      ctx.beginPath();
      ctx.moveTo(tx - 1.2 * s, ty);
      ctx.lineTo(tx, ty - 3.5 * s);
      ctx.lineTo(tx + 1.2 * s, ty);
      ctx.fill();
    }
    if (i % 10 === 0) {
      ctx.fillStyle = '#ff9ec0';
      ctx.beginPath();
      ctx.arc(x + Math.cos(a1) * r1, y + Math.sin(a1) * 6 * s - lift(a1) - 2 * s, 1.8 * s, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawJobAura(ctx, job, layer, x, y, time, scale, k, dir = 1) {
  const def = JOBS[job];
  if (!def?.[layer] || k <= 0) return;
  ctx.save();
  def[layer](ctx, x, y, time, scale, k, dir);
  ctx.restore();
}
