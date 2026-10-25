// Idle auras for advanced jobs: flashy effects around a hero who stands still, layered behind
// ('back') and in front of ('front') the sprite. Everything is drawn from time alone, so it
// needs no state. (x, y) is the hero's feet in screen space, s the draw scale, k the fade (0-1),
// dir the facing (1 right, -1 left).

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// Jobs that have an idle aura, and the 2nd-job form a 3rd job builds on.
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
  ctx.beginPath();
  ctx.moveTo(0, r * 1.6);
  ctx.lineTo(-r * 0.3, -r * 0.6);
  ctx.lineTo(r * 0.3, -r * 0.6);
  ctx.fill();
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

// Petals (or leaves) swirling around the body.
function swirl(ctx, x, y, t, s, k, colors, n = 10, front = true) {
  for (let i = 0; i < n; i++) {
    const ang = t * 1.6 + (i / n) * TAU;
    if ((Math.sin(ang) >= 0) !== front) continue;
    const u = (i / n + t * 0.15) % 1;
    const px = x + Math.cos(ang) * 22 * s;
    const py = y - 8 * s - u * 56 * s + Math.sin(ang) * 4 * s;
    ctx.save();
    ctx.globalAlpha = k * Math.sin(u * Math.PI);
    ctx.translate(px, py);
    ctx.rotate(ang * 2);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, 3 * s, 1.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// Layers several auras into one (a third job builds on its second job's look).
function layered(...defs) {
  return {
    back: (...a) => defs.forEach((d) => d.back?.(...a)),
    front: (...a) => defs.forEach((d) => d.front?.(...a)),
  };
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
  ilarchmage: {
    back(ctx, x, y, t, s, k) {
      // Wings of ice, a frozen magic circle, and a blizzard swirling around you.
      wings(ctx, x, y - 30 * s, t, s * 1.15, k * 0.9, ['#e8fbff', '#bfe6ff', '#8fe3ff', '#ffffff'], 6);
      glow(ctx, x, y - 20 * s, 40 * s, '#8fe3ff', k * 0.38);
      magicCircle(ctx, x, y, 34 * s, t * 0.7, '#8fe3ff', k * 0.9, 6);
      magicCircle(ctx, x, y, 24 * s, -t * 1.1, '#ffe86b', k * 0.6, 5);
      for (let i = 0; i < 14; i++) {
        const ang = t * 1.2 + (i / 14) * TAU;
        const u = (i / 14 + t * 0.2) % 1;
        if (Math.sin(ang) > 0) continue;
        snowflake(ctx, x + Math.cos(ang) * 30 * s, y - 10 * s - u * 60 * s, 1.8 * s, '#ffffff', k * Math.sin(u * Math.PI), t * 2 + i);
      }
      orbit(ctx, x, y - 28 * s, t, s, { n: 4, rx: 24, ry: 7, speed: 1.1, draw: (px, py, z) => crystal(ctx, px, py, 4.5 * s * z, k) }, false);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 28 * s, t, s, { n: 4, rx: 24, ry: 7, speed: 1.1, draw: (px, py, z) => crystal(ctx, px, py, 4.5 * s * z, k) }, true);
      for (let i = 0; i < 14; i++) {
        const ang = t * 1.2 + (i / 14) * TAU;
        const u = (i / 14 + t * 0.2) % 1;
        if (Math.sin(ang) <= 0) continue;
        snowflake(ctx, x + Math.cos(ang) * 30 * s, y - 10 * s - u * 60 * s, 1.8 * s, '#ffffff', k * Math.sin(u * Math.PI), t * 2 + i);
      }
      // Lightning arcs crawl over you, and every few seconds a bolt strikes beside you.
      if ((t * 2.1) % 1 < 0.3) zap(ctx, x - 14 * s, y - 40 * s, x + 12 * s, y - 30 * s, t, s, k);
      const p = (t % 3.2) / 3.2;
      if (p < 0.08) {
        const bx = x + (hash(Math.floor(t / 3.2)) > 0.5 ? 26 : -26) * s;
        zap(ctx, bx, y - 90 * s, bx, y, t, s * 1.6, k * (1 - p / 0.08));
        glow(ctx, bx, y, 18 * s, '#ffe86b', k * (1 - p / 0.08));
      }
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
  fparchmage: {
    back(ctx, x, y, t, s, k) {
      // Phoenix wings of flame, a blazing magic circle, and flames licking up its edge.
      wings(ctx, x, y - 30 * s, t, s * 1.15, k * 0.9, ['#ff8a3c', '#ffb35a', '#ffe36b', '#ff6b4a']);
      glow(ctx, x, y - 6 * s, 40 * s, '#ff7a3c', k * 0.35);
      magicCircle(ctx, x, y, 34 * s, t, '#ffb35a', k * 0.9, 6);
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * TAU + t * 0.8;
        const fx = x + Math.cos(ang) * 30 * s;
        const fy = y + Math.sin(ang) * 10 * s;
        const h = (6 + Math.sin(t * 10 + i * 2) * 3) * s;
        ctx.globalAlpha = k * 0.8;
        ctx.fillStyle = i % 2 ? '#ff8a3c' : '#ffd66b';
        ctx.beginPath();
        ctx.moveTo(fx - 2 * s, fy);
        ctx.quadraticCurveTo(fx, fy - h * 2, fx + 2 * s, fy);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      orbit(ctx, x, y - 26 * s, t, s, { n: 5, rx: 24, ry: 7, speed: 1.4, draw: (px, py, z, i) => fireball(ctx, px, py, 2.8 * s * z * k, t, i) }, false);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 26 * s, t, s, { n: 5, rx: 24, ry: 7, speed: 1.4, draw: (px, py, z, i) => fireball(ctx, px, py, 2.8 * s * z * k, t, i) }, true);
      rising(ctx, x, y, t, s, { n: 14, spread: 24, height: 70, speed: 0.8, color: '#ffb35a', size: 1.4, seed: 9 }, k);
      rising(ctx, x, y, t, s, { n: 10, spread: 22, height: 60, speed: 0.55, color: '#9be86b', size: 1.8, seed: 21 }, k * 0.9);
      rising(ctx, x, y, t, s, { n: 5, spread: 18, height: 50, speed: 0.45, color: '#b46bff', size: 1.4, seed: 27 }, k * 0.8);
    },
  },
  bishop: {
    back(ctx, x, y, t, s, k) {
      // Great wings of light, a pillar of light, and a golden holy circle.
      pillar(ctx, x, y, 44 * s, 120 * s, '#fff6c9', k * (0.6 + 0.2 * Math.sin(t * 2)));
      wings(ctx, x, y - 30 * s, t, s * 1.25, k, ['#ffffff', '#fff6c9', '#e6f0ff', '#ffffff'], 6);
      glow(ctx, x, y - 30 * s, 34 * s, '#fff6c9', k * 0.4);
      magicCircle(ctx, x, y, 32 * s, -t, '#ffe36b', k * 0.85, 8);
    },
    front(ctx, x, y, t, s, k) {
      halo(ctx, x, y - 52 * s, s * 1.15, t, '#ffe36b', k);
      rising(ctx, x, y, t, s, { n: 12, spread: 26, height: 80, speed: 0.45, color: '#fff6c9', size: 1.6, seed: 3, shape: 'star' }, k);
      // Every few seconds a burst of light.
      const p = (t % 4) / 4;
      if (p < 0.2) glow(ctx, x, y - 28 * s, (20 + p * 160) * s, '#ffffff', k * (1 - p / 0.2) * 0.5);
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
      // The forest: a green glow, swirling leaves, and fireflies.
      glow(ctx, x, y - 18 * s, 28 * s, '#8fd86b', k * 0.32);
      swirl(ctx, x, y, t, s, k, ['#7fc45a', '#b8e07a', '#5fa84a'], 10, false);
    },
    front(ctx, x, y, t, s, k) {
      swirl(ctx, x, y, t, s, k, ['#7fc45a', '#b8e07a', '#5fa84a'], 10, true);
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
      orbit(ctx, x, y - 26 * s, t, s, { n: 3, rx: 20, ry: 6, speed: 1.8, draw: (px, py, z, i) => goldCoin(ctx, px, py, 3 * s * z, t + i, k) }, false);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 26 * s, t, s, { n: 3, rx: 20, ry: 6, speed: 1.8, draw: (px, py, z, i) => goldCoin(ctx, px, py, 3 * s * z, t + i, k) }, true);
      rising(ctx, x, y, t, s, { n: 5, spread: 14, height: 40, speed: 0.6, color: '#fff6c9', size: 1.5, seed: 41, shape: 'star' }, k);
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

// Third jobs build on their second job's aura with something grander.
Object.assign(JOBS, {
  swordsaint: layered(JOBS.blademaster, {
    back(ctx, x, y, t, s, k) {
      magicCircle(ctx, x, y, 32 * s, t * 0.6, '#cfe0ff', k * 0.8, 8);
      orbit(ctx, x, y - 30 * s, t, s, { n: 4, rx: 26, ry: 7, speed: 1.1, draw: (px, py, z, i) => floatSword(ctx, px, py, 5 * s * z, Math.sin(t * 2 + i) * 0.3, k) }, false);
    },
    front(ctx, x, y, t, s, k) {
      orbit(ctx, x, y - 30 * s, t, s, { n: 4, rx: 26, ry: 7, speed: 1.1, draw: (px, py, z, i) => floatSword(ctx, px, py, 5 * s * z, Math.sin(t * 2 + i) * 0.3, k) }, true);
    },
  }),
  dragonknight: layered({
    back(ctx, x, y, t, s, k) {
      wings(ctx, x, y - 30 * s, t, s * 1.15, k * 0.9, ['#e8364f', '#ff5a5a', '#ffb35a', '#a02a4a'], 5);
      glow(ctx, x, y - 20 * s, 40 * s, '#ff5a5a', k * 0.35);
      magicCircle(ctx, x, y, 32 * s, t * 0.8, '#ff8a3c', k * 0.8, 5);
    },
    front(ctx, x, y, t, s, k) {
      rising(ctx, x, y, t, s, { n: 12, spread: 22, height: 64, speed: 0.8, color: '#ffb35a', size: 1.4, seed: 51 }, k);
    },
  }, JOBS.lancer),
  paladin: layered(JOBS.guardian, {
    back(ctx, x, y, t, s, k) {
      pillar(ctx, x, y, 40 * s, 110 * s, '#fff6c9', k * (0.55 + 0.2 * Math.sin(t * 2)));
      magicCircle(ctx, x, y, 34 * s, -t * 0.7, '#ffe36b', k * 0.85, 4);
    },
    front(ctx, x, y, t, s, k) {
      halo(ctx, x, y - 52 * s, s * 1.1, t, '#ffe36b', k);
      rising(ctx, x, y, t, s, { n: 8, spread: 22, height: 70, speed: 0.45, color: '#fff6c9', size: 1.5, seed: 61, shape: 'star' }, k);
    },
  }),
  windwalker: layered(JOBS.ranger, {
    back(ctx, x, y, t, s, k) {
      wings(ctx, x, y - 30 * s, t, s * 1.1, k * 0.85, ['#e8fff4', '#8fe8c0', '#c9f6e0', '#ffffff'], 6);
      ctx.strokeStyle = '#c9f6e0';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.9 + i / 3) % 1;
        ctx.globalAlpha = k * (1 - u);
        ctx.beginPath();
        ctx.ellipse(x, y - u * 50 * s, (16 + u * 10) * s, 4 * s, 0, t * 4, t * 4 + 4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  }),
  deadeye: layered(JOBS.marksman, {
    back(ctx, x, y, t, s, k) {
      magicCircle(ctx, x, y, 30 * s, t * 0.5, '#ffd66b', k * 0.75, 4);
      glow(ctx, x, y - 20 * s, 34 * s, '#cfe0ff', k * 0.3);
    },
  }),
  beastmaster: layered(JOBS.hunter, {
    back(ctx, x, y, t, s, k) {
      magicCircle(ctx, x, y, 32 * s, t * 0.6, '#8fd86b', k * 0.8, 5);
      // A spirit wolf's head glowing faintly behind you.
      ctx.save();
      ctx.globalAlpha = k * (0.35 + 0.1 * Math.sin(t * 2));
      ctx.fillStyle = '#c9f6b0';
      const hy = y - 52 * s;
      ctx.beginPath();
      ctx.ellipse(x, hy, 14 * s, 11 * s, 0, 0, TAU);
      ctx.moveTo(x - 12 * s, hy - 4 * s);
      ctx.lineTo(x - 10 * s, hy - 20 * s);
      ctx.lineTo(x - 2 * s, hy - 8 * s);
      ctx.moveTo(x + 12 * s, hy - 4 * s);
      ctx.lineTo(x + 10 * s, hy - 20 * s);
      ctx.lineTo(x + 2 * s, hy - 8 * s);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 6 * s, hy - 2 * s, 3 * s, 2 * s);
      ctx.fillRect(x + 3 * s, hy - 2 * s, 3 * s, 2 * s);
      ctx.restore();
    },
  }),
  bladedancer: layered(JOBS.duelist, {
    back(ctx, x, y, t, s, k) {
      glow(ctx, x, y - 22 * s, 34 * s, '#ff9ec0', k * 0.3);
      swirl(ctx, x, y, t, s, k, ['#ff9ec0', '#ffd0e0', '#ffffff'], 14, false);
    },
    front(ctx, x, y, t, s, k) {
      swirl(ctx, x, y, t, s, k, ['#ff9ec0', '#ffd0e0', '#ffffff'], 14, true);
    },
  }),
  nightstalker: layered({
    back(ctx, x, y, t, s, k) {
      wings(ctx, x, y - 30 * s, t, s * 1.1, k * 0.85, ['#3a2a6b', '#5a3f9a', '#9b6bff', '#2a1f4a'], 5);
      magicCircle(ctx, x, y, 30 * s, -t * 0.7, '#9b6bff', k * 0.8, 6);
    },
  }, JOBS.shadow),
  phantomthief: layered(JOBS.trickster, {
    back(ctx, x, y, t, s, k) {
      magicCircle(ctx, x, y, 32 * s, t * 0.8, '#ffd66b', k * 0.8, 5);
      // A swirl of playing-card shapes behind you.
      for (let i = 0; i < 6; i++) {
        const ang = t * 1.2 + (i / 6) * TAU;
        ctx.save();
        ctx.globalAlpha = k * 0.85;
        ctx.translate(x + Math.cos(ang) * 30 * s, y - 34 * s + Math.sin(ang) * 10 * s);
        ctx.rotate(ang);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2.5 * s, -3.5 * s, 5 * s, 7 * s);
        ctx.fillStyle = i % 2 ? '#e8364f' : '#3a2d4f';
        ctx.fillRect(-1 * s, -1 * s, 2 * s, 2 * s);
        ctx.restore();
      }
    },
  }),
});

export function drawJobAura(ctx, job, layer, x, y, time, scale, k, dir = 1) {
  const def = JOBS[job];
  if (!def?.[layer] || k <= 0) return;
  ctx.save();
  def[layer](ctx, x, y, time, scale, k, dir);
  ctx.restore();
}
