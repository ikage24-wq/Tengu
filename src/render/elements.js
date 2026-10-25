// Weapon elements: the palette for Holy, Cosmic, Lightning, Fire, and Water, and for the endgame
// weapon themes (Demonic, Bone, Laser, Chainsaw, Cyber), and the live aura drawn along an
// elemental weapon's blade. Hits, footsteps, and sparkles take on the element's colors.

export const ELEMENTS = {
  holy: { color: '#ffe36b', glow: '#fff3a6', gem: '#ff9ec0', sparks: ['#ffffff', '#ffe36b', '#fff3a6'] },
  cosmic: { color: '#9b7bff', glow: '#b49cff', gem: '#8fe3ff', sparks: ['#c9b6ff', '#ff7ad9', '#8fe3ff'] },
  storm: { color: '#5ff3ff', glow: '#5ff3ff', gem: '#5ff3ff', sparks: ['#5ff3ff', '#ffffff', '#c9f6ff'] },
  fire: { color: '#ff6b2b', glow: '#ff8a3b', gem: '#ffd23b', sparks: ['#ff6b2b', '#ffa53b', '#ffd23b'] },
  water: { color: '#4fc8ff', glow: '#8fe3ff', gem: '#fff6fb', sparks: ['#8fe3ff', '#ffffff', '#4fc8ff'] },
  demonic: { color: '#ff3b2b', glow: '#ff4a5a', gem: '#ff2b3b', sparks: ['#ff3b2b', '#ffb03b', '#7a1022'] },
  bone: { color: '#6bff9a', glow: '#9dffbe', gem: '#6bff9a', sparks: ['#6bff9a', '#e6ffee', '#f3e9cf'] },
  laser: { color: '#5ff3ff', glow: '#9ff8ff', gem: '#ffffff', sparks: ['#ffffff', '#5ff3ff', '#ff6bf0'] },
  chainsaw: { color: '#ffb03b', glow: '#ffd23b', gem: '#ffd23b', sparks: ['#ffe36b', '#ffffff', '#ff8a1f'] },
  cyber: { color: '#3bf0ff', glow: '#ff3bd4', gem: '#ff3bd4', sparks: ['#3bf0ff', '#ff3bd4', '#ffffff'] },
};

// ---------- Live auras around elemental weapons ----------
// Drawn in the weapon's rotated frame: grip at the origin, the weapon toward -y. `top`/`base`
// bound the weapon's main part in that frame (negative numbers); `s` is the pixel scale.

export function drawElementAura(ctx, element, top, base, time, s) {
  const len = base - top;
  ctx.save();
  // Sparkles twinkling around the whole weapon, in every element.
  const spark = ELEMENTS[element].sparks;
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.9 + i / 4) % 1;
    const tw = Math.sin(k * Math.PI);
    ctx.globalAlpha = tw;
    ctx.fillStyle = spark[i % spark.length];
    const x = Math.round(Math.sin(i * 2.4 + Math.floor(time * 0.9 + i / 4) * 1.7) * 10 * s);
    const y = Math.round(top + ((i * 0.31 + Math.floor(time * 0.9 + i / 4) * 0.23) % 1) * len);
    const r = tw > 0.7 ? 2 : 1;
    ctx.fillRect(x - r * s, y, (r * 2 + 1) * s, s);
    ctx.fillRect(x, y - r * s, s, (r * 2 + 1) * s);
  }
  ctx.globalAlpha = 1;
  switch (element) {
    case 'holy':
      for (let i = 0; i < 3; i++) {
        const k = (time * 0.25 + i / 3) % 1;
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.fillStyle = '#ffffff';
        const x = Math.sin(time * 1.5 + i * 2) * 10 * s;
        ctx.fillRect(Math.round(x), Math.round(top + k * len), 3 * s, s);
        ctx.fillRect(Math.round(x + s), Math.round(top + k * len + s), s, s);
      }
      break;
    case 'cosmic': {
      const a = time * 2.2;
      const x = Math.cos(a) * 12 * s;
      const y = top + len * 0.45 + Math.sin(a) * 3 * s;
      ctx.globalAlpha = Math.sin(a) > 0 ? 1 : 0.45;
      ctx.fillStyle = '#ff9ec0';
      ctx.fillRect(Math.round(x - s), Math.round(y - s), 3 * s, 3 * s);
      ctx.fillStyle = '#ffd66b';
      ctx.fillRect(Math.round(x - 2 * s), Math.round(y), 5 * s, s);
      break;
    }
    case 'storm': {
      const step = Math.floor(time * 10);
      ctx.lineWidth = s;
      for (let a = 0; a < 2; a++) {
        const r = (n) => {
          const v = Math.sin((step + a * 13) * 91.7 + n * 37.3) * 43758.5;
          return v - Math.floor(v);
        };
        if (r(0) < 0.3) continue;
        ctx.strokeStyle = a ? '#ffffff' : '#5ff3ff';
        ctx.beginPath();
        let x = (a ? 5 : -5) * s;
        let y = top + r(1) * len;
        ctx.moveTo(x, y);
        for (let i = 0; i < 4; i++) {
          x += (a ? 3 : -3) * s;
          y += (r(i + 2) - 0.5) * 8 * s;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'fire':
      for (let i = 0; i < 7; i++) {
        const k = (time * 0.8 + i / 7) % 1;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = HEAT[i % 3];
        ctx.fillRect(Math.round(Math.sin(time * 3 + i * 1.7) * 7 * s), Math.round(base - ((i / 7) * len + k * 20 * s)), s, s);
      }
      break;
    case 'water':
      ctx.lineWidth = Math.max(1, s * 0.75);
      ctx.strokeStyle = '#c9f6ff';
      for (let i = 0; i < 4; i++) {
        const k = (time * 0.45 + i / 4) % 1;
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.beginPath();
        ctx.arc(Math.sin(time * 2 + i * 1.9) * 10 * s, base - k * len, (1 + (i % 2)) * s, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
  }
  ctx.restore();
}
