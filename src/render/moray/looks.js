// Murri and Ena's cast looks (2026-11-26, their new fight, world/aquarium.js): each telegraph drawn
// whole in the sisters' own soft style (no plain floor marker under it: they are on
// render/bossfx.js OWN_WARN), while its cast winds up (`warn`, p 0..1 through the warning), and in
// place of the plain flash as it lands (`hit`, u 0..1 over its hold, e eased, fade). Their colours:
// Murri's jade, Ena's honey, the grotto's bubbles; every shape rounded, outlined in a deeper shade of
// its own colour, eased. render/dreamfx.js hands each zone with one of these looks to them.
//   mrPeek     Peekaboo! (a bite at a burrow's mouth): the hole's ring on the floor, bubbles rising out
//              of it faster and faster, the water over it darkening; landing, a burst of bubbles and a
//              soft round "chomp" closing over the hole
//   mrChomp    Chomp Chomp! (the tank's marker): a ring under them and two rounded jaw-scallops over
//              them, opening wide; landing, they snap shut in a pop of stars
//   mrGossip   Sister Gossip (a marker on each of you: spread): a whisper bubble over each of you, its
//              three pearl dots popping in one by one; landing, the bubble pops into little ones
//   mrPickM/E  Sister's Pick (Murri's mark / Ena's mark): a ring in her colour round the one she picked,
//              her token bobbing over them (Murri's coral crown, Ena's pearl), a dotted line of bubbles
//              running out toward her side of the grotto
//   mrTwirl    Twin Twirl (a circle round each): a swirl of water running round her, bubbles riding it;
//              landing, flung outward
//   mrHuddle   Double Peekaboo's shared bubble (a stack): a big clear bubble dome on the floor, a shell
//              for each of you it needs round its rim; landing, it pops wide in sparkles
//   mrSquabble Grotto Squabble (everyone): bubbles and little huffy puffs all over the floor, a
//              teal haze; landing, a soft flash and a gust of bubbles

const TAU = Math.PI * 2;
const SW = 640;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
const hash = (i) => {
  const q = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return q - Math.floor(q);
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
function glow(ctx, x, y, r, hex, al) {
  if (al <= 0.005 || r <= 0.1) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, al));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function sparkle(ctx, x, y, k, fill) {
  if (k <= 0.05) return;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fillStyle = fill;
  ctx.fill();
}
function pen(ctx, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

// ---------- Their colours ----------
export const MURRI_C = { lt: '#e2f8ea', base: '#8fdcb0', sh: '#5cb88c', deep: '#3c9472', ink: '#2f7d62' };
export const ENA_C = { lt: '#fff5d2', base: '#ffd779', sh: '#f2ae4c', deep: '#d98a36', ink: '#c0742c' };
const BUB = { fill: 'rgba(226,246,255,0.55)', edge: '#7cc4d8', glint: '#ffffff' };
const CORAL = { base: '#ff9fa6', sh: '#e7788a', ink: '#c95f74', lt: '#ffd2d4' };
const PEARL = { base: '#fbf6ef', sh: '#e2d6ec', ink: '#ad9fc6' };

// A bubble: see-through, an aqua rim, a curved glint.
function bubble(ctx, x, y, r, al = 1) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = BUB.fill;
  ctx.fill();
  pen(ctx, BUB.edge, Math.max(0.5, r * 0.18));
  ctx.stroke();
  pen(ctx, BUB.glint, Math.max(0.5, r * 0.2));
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, -2.6, -1.7);
  ctx.stroke();
  ctx.restore();
}
// A soft floor ring: a flat ellipse, a rim in a deeper shade of its own colour.
function floorRing(ctx, x, y, rx, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, rx, rx * 0.24);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
// A row of bubbles round a floor ring, turning slowly (its edge, readable).
function bubbleRing(ctx, x, y, rx, n, time, al, spin = 0.4, r = 2.2) {
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU + time * spin;
    bubble(ctx, x + Math.cos(an) * rx, y + Math.sin(an) * rx * 0.24 - 2, r * (0.8 + 0.4 * hash(i)), al * (Math.sin(an) > -0.2 ? 1 : 0.55));
  }
}
// A rounded jaw: a scalloped arc (soft round "teeth" of felt, never points), opening by `open`.
function jaw(ctx, x, y, w, open, upper, col, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y + (upper ? -open : open));
  if (!upper) ctx.scale(1, -1);
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.bezierCurveTo(-w * 0.9, -w * 0.75, w * 0.9, -w * 0.75, w, 0);
  // (the soft rounded edge along the mouth: little scallops)
  const n = 5;
  for (let i = n; i > 0; i--) {
    const x1 = -w + (2 * w * (i - 1)) / n;
    const xm = (x1 + (-w + (2 * w * i) / n)) / 2;
    ctx.quadraticCurveTo(xm, w * 0.16, x1, 0);
  }
  ctx.closePath();
  pen(ctx, col.ink, 1.6);
  ctx.stroke();
  ctx.fillStyle = col.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ell(ctx, -w * 0.25, -w * 0.45, w * 0.55, w * 0.18, -0.15);
  ctx.fillStyle = rgba(col.lt, 0.75);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
function crown(ctx, x, y, s, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-5, 2.5);
  ctx.quadraticCurveTo(-5.6, -2, -3.4, -4.2);
  ctx.quadraticCurveTo(-2.6, -1.6, -1.6, -1.4);
  ctx.quadraticCurveTo(-0.9, -5.6, 0, -6);
  ctx.quadraticCurveTo(0.9, -5.6, 1.6, -1.4);
  ctx.quadraticCurveTo(2.6, -1.6, 3.4, -4.2);
  ctx.quadraticCurveTo(5.6, -2, 5, 2.5);
  ctx.quadraticCurveTo(0, 3.6, -5, 2.5);
  pen(ctx, CORAL.ink, 1.1);
  ctx.stroke();
  ctx.fillStyle = CORAL.base;
  ctx.fill();
  for (const [px, py, r] of [[-3.4, -4.2, 1.1], [0, -6, 1.2], [3.4, -4.2, 1.1]]) {
    ell(ctx, px, py, r, r);
    ctx.fillStyle = CORAL.lt;
    ctx.fill();
  }
  pearl(ctx, 0, 0.4, 1.4);
  ctx.restore();
}
function pearl(ctx, x, y, r, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  pen(ctx, PEARL.ink, Math.max(0.4, r * 0.3));
  ctx.stroke();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, PEARL.base);
  g.addColorStop(1, PEARL.sh);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, x - r * 0.32, y - r * 0.36, r * 0.28, r * 0.2, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

// ---------- Peekaboo! ----------
function peekWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const col = z.from?.def?.id === 'moraymurri' ? MURRI_C : ENA_C;
  floorRing(ctx, x, y, r, rgba(col.lt, 0.22 + 0.2 * p), rgba(col.ink, 0.85), 0.6 + 0.4 * p, 1.8);
  bubbleRing(ctx, x, y, r, 12, time, 0.5 + 0.5 * p, 0.5, 2.2);
  // the water over the hole darkening a little as she comes
  glow(ctx, x, y - 30, r * 0.7, '#2c6a7e', 0.12 + 0.18 * p);
  // bubbles rising out of the hole, faster as she nears
  const n = 6 + Math.round(10 * p);
  for (let i = 0; i < n; i++) {
    const v = (time * (0.6 + 1.2 * p) + hash(i * 3.1)) % 1;
    const bx = x + (hash(i * 7.3) - 0.5) * r * 0.9 + Math.sin(v * 7 + i) * 3;
    bubble(ctx, bx, y - 6 - v * (60 + 30 * p), 1.4 + hash(i) * 2.4, Math.sin(Math.PI * v) * (0.5 + 0.5 * p));
  }
}
function peekHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  const col = z.from?.def?.id === 'moraymurri' ? MURRI_C : ENA_C;
  floorRing(ctx, x, y, r * (1 + 0.08 * e), rgba(col.lt, 0.3), rgba(col.ink, 1), fade, 2);
  // the chomp: the jaws closing over the hole
  const open = 16 * (1 - ease(u / 0.35));
  jaw(ctx, x, y - 40, 22, open, true, col, fade);
  jaw(ctx, x, y - 40, 22, open, false, col, fade);
  for (let i = 0; i < 16; i++) {
    const an = (i / 16) * TAU + hash(i) * 0.4;
    const d = 8 + e * r * 0.9;
    bubble(ctx, x + Math.cos(an) * d, y - 34 + Math.sin(an) * d * 0.55 - e * 10, 1.6 + hash(i * 2) * 2.2, fade);
  }
  sparkle(ctx, x + 18, y - 58, 5 * (1 - u), rgba('#ffffff', fade));
}

// ---------- Chomp Chomp! ----------
function chompWarn(ctx, z, x, y, p, time) {
  const col = z.from?.def?.id === 'moraymurri' ? MURRI_C : ENA_C;
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(col.lt, 0.3), rgba(col.ink, 0.9), 0.7 + 0.3 * p, 2);
  bubbleRing(ctx, x, y, r, 8, time, 0.7, 0.6, 1.8);
  // the jaws over them, opening wider as the bite comes (and a little nibble wobble)
  const open = 6 + 14 * ease(p) + Math.sin(time * 9) * 1.2 * (1 - p);
  const cy = y - 46;
  jaw(ctx, x, cy, 18, open, true, col, 0.55 + 0.45 * p);
  jaw(ctx, x, cy, 18, open, false, col, 0.55 + 0.45 * p);
}
function chompHit(ctx, z, x, y, u, e, fade, time) {
  const col = z.from?.def?.id === 'moraymurri' ? MURRI_C : ENA_C;
  const cy = y - 46;
  const open = 20 * (1 - ease(u / 0.18));
  jaw(ctx, x, cy, 18 + e * 2, open, true, col, fade);
  jaw(ctx, x, cy, 18 + e * 2, open, false, col, fade);
  if (u > 0.12) {
    const k = (u - 0.12) / 0.88;
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI / 2 + (i - 2) * 0.6;
      sparkle(ctx, x + Math.cos(an) * (10 + k * 26), cy + Math.sin(an) * (6 + k * 18), 3.2 * (1 - k), i % 2 ? rgba(col.lt, fade) : rgba('#ffffff', fade));
    }
  }
  floorRing(ctx, x, y, z.w / 2, rgba(col.lt, 0.35), rgba(col.ink, 1), fade, 2);
}

// ---------- Sister Gossip ----------
function speech(ctx, x, y, s, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.ellipse(x, y, 9 * s, 6.4 * s, 0, 0, TAU);
  ctx.moveTo(x - 2 * s, y + 5.6 * s);
  ctx.quadraticCurveTo(x - 1 * s, y + 9.4 * s, x - 4.6 * s, y + 10.6 * s);
  ctx.quadraticCurveTo(x + 0.6 * s, y + 9.4 * s, x + 2.6 * s, y + 5.6 * s);
  pen(ctx, BUB.edge, 1.4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,252,255,0.85)';
  ctx.fill('nonzero');
  pen(ctx, '#ffffff', 1.1);
  ctx.beginPath();
  ctx.arc(x - 2 * s, y - 1.4 * s, 5.4 * s, -2.7, -1.9);
  ctx.stroke();
  ctx.restore();
}
function gossipWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(214,244,255,0.28)', 'rgba(108,180,204,0.9)', 0.6 + 0.4 * p);
  bubbleRing(ctx, x, y, r, 7, time, 0.6, 0.5, 1.6);
  const by = y - 58 - Math.sin(time * 3 + z.x * 0.01) * 1.5;
  speech(ctx, x, by, 1, 0.5 + 0.5 * p);
  // the three pearl dots popping in one by one
  for (let i = 0; i < 3; i++) {
    const k = sstep((p - i * 0.25) / 0.2);
    pearl(ctx, x - 4.4 + i * 4.4, by - (i === 1 ? 0.4 : 0), 1.3 * k, k);
  }
}
function gossipHit(ctx, z, x, y, u, e, fade, time) {
  const by = y - 58;
  if (u < 0.2) speech(ctx, x, by, 1 + u, 1 - u / 0.2);
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU + 0.3;
    bubble(ctx, x + Math.cos(an) * (4 + e * 18), by + Math.sin(an) * (3 + e * 12), 2 * (1 - u * 0.5), fade);
  }
  floorRing(ctx, x, y, z.w / 2, 'rgba(214,244,255,0.35)', 'rgba(108,180,204,1)', fade);
}

// ---------- Sister's Pick ----------
function pickWarn(murri) {
  return (ctx, z, x, y, p, time) => {
    const col = murri ? MURRI_C : ENA_C;
    const r = z.w / 2;
    // her colour round the one she picked, a soft pulse
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    floorRing(ctx, x, y, r * (1 + 0.06 * pulse), rgba(col.lt, 0.35), rgba(col.ink, 0.95), 1, 2.2);
    floorRing(ctx, x, y, r * 0.55, rgba(col.base, 0.25), rgba(col.sh, 0.6), 0.8, 1.2);
    // a dotted line of bubbles running out toward her side of the grotto (where she'll come from)
    const side = (z.from?.x ?? x) < x ? -1 : 1;
    for (let i = 1; i <= 7; i++) {
      const v = (i / 7 + time * 0.8) % 1;
      bubble(ctx, x + side * (r + v * 120), y - 6 - Math.sin(v * TAU) * 1.5, 1.6 + 0.8 * (1 - v), (1 - v) * (0.5 + 0.5 * p));
    }
    // her token bobbing over them: Murri's coral crown, Ena's pearl on a coral ribbon
    const ty = y - 64 - Math.sin(time * 3.2) * 2;
    glow(ctx, x, ty, 14, col.lt, 0.6);
    if (murri) crown(ctx, x, ty, 1.5);
    else {
      ctx.save();
      pen(ctx, CORAL.ink, 2.6);
      ctx.beginPath();
      ctx.moveTo(x - 7, ty - 4);
      ctx.quadraticCurveTo(x, ty + 3, x + 7, ty - 4);
      ctx.stroke();
      pen(ctx, CORAL.base, 1.5);
      ctx.stroke();
      ctx.restore();
      pearl(ctx, x, ty + 1.4, 3.6);
    }
    // getting close: a sparkle as it locks
    if (p > 0.82) sparkle(ctx, x + 9, ty - 6, 3 * Math.sin(Math.PI * (p - 0.82) / 0.18), '#ffffff');
  };
}
function pickHit(murri) {
  return (ctx, z, x, y, u, e, fade) => {
    const col = murri ? MURRI_C : ENA_C;
    floorRing(ctx, x, y, z.w / 2 * (1 - 0.3 * e), rgba(col.lt, 0.3), rgba(col.ink, 1), fade, 2);
    sparkle(ctx, x, y - 30 - e * 10, 4 * (1 - u), rgba(col.lt, fade));
  };
}

// ---------- Twin Twirl ----------
function twirlWarn(ctx, z, x, y, p, time) {
  const col = z.from?.def?.id === 'moraymurri' ? MURRI_C : ENA_C;
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(col.lt, 0.18 + 0.15 * p), rgba(col.ink, 0.85), 1, 1.8);
  // the swirl: three soft water streaks running round her, faster as she winds up
  for (let k = 0; k < 3; k++) {
    const sp = time * (1.6 + 3 * p) + (k / 3) * TAU;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.45 * p;
    for (const [w, c] of [[4, BUB.edge], [2, '#e8faff']]) {
      pen(ctx, c, w);
      ctx.beginPath();
      ctx.ellipse(x, y - 14 - k * 9, r * (0.92 - k * 0.12), r * 0.22, 0, sp, sp + 1.6);
      ctx.stroke();
    }
    ctx.restore();
    const an = sp + 1.6;
    bubble(ctx, x + Math.cos(an) * r * (0.92 - k * 0.12), y - 14 - k * 9 + Math.sin(an) * r * 0.22, 2.2, 0.6 + 0.4 * p);
  }
}
function twirlHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  for (let k = 0; k < 3; k++) {
    ctx.save();
    ctx.globalAlpha = fade * 0.8;
    pen(ctx, k % 2 ? '#e8faff' : BUB.edge, 3 - k * 0.6);
    ctx.beginPath();
    ctx.ellipse(x, y - 14 - k * 9, r * (0.92 + e * 0.5), r * 0.22 * (1 + e * 0.5), 0, time * 6 + k, time * 6 + k + 2.4);
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    bubble(ctx, x + Math.cos(an) * r * (0.7 + e * 0.7), y - 20 + Math.sin(an) * r * 0.3, 2 + hash(i) * 1.6, fade);
  }
}

// ---------- Double Peekaboo's shared bubble ----------
function shell(ctx, x, y, s, lit, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 2.6);
  ctx.bezierCurveTo(-4.6, 2.6, -4.6, -2.4, 0, -3.2);
  ctx.bezierCurveTo(4.6, -2.4, 4.6, 2.6, 0, 2.6);
  pen(ctx, CORAL.ink, 1);
  ctx.stroke();
  ctx.fillStyle = lit ? CORAL.lt : '#f4e8ee';
  ctx.fill();
  pen(ctx, rgba(CORAL.sh, 0.7), 0.5);
  for (const dx of [-1.8, 0, 1.8]) {
    ctx.beginPath();
    ctx.moveTo(0, 2.2);
    ctx.lineTo(dx, -2.4);
    ctx.stroke();
  }
  ctx.restore();
}
function huddleWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(226,250,255,0.35)', 'rgba(100,176,206,0.95)', 1, 2.2);
  // the dome: one big clear bubble over the spot, wobbling softly
  const wob = Math.sin(time * 3.4) * 1.5;
  ctx.save();
  ctx.globalAlpha = 0.45 + 0.35 * p;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, r + wob, r * 0.78 - wob, 0, Math.PI, TAU);
  ctx.closePath();
  ctx.fillStyle = 'rgba(226,248,255,0.25)';
  ctx.fill();
  pen(ctx, BUB.edge, 1.8);
  ctx.stroke();
  pen(ctx, '#ffffff', 2);
  ctx.beginPath();
  ctx.ellipse(x - r * 0.15, y - 2, r * 0.75, r * 0.6, 0, Math.PI + 0.5, Math.PI + 1.3);
  ctx.stroke();
  ctx.restore();
  // a shell for each of you it needs, round its rim
  const need = z.need ?? 2;
  for (let i = 0; i < need; i++) {
    const an = Math.PI + ((i + 0.5) / need) * Math.PI;
    shell(ctx, x + Math.cos(an) * r * 0.9, y - 2 + Math.sin(an) * r * 0.7, 1.4, p > 0.5, 0.9);
  }
}
function huddleHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  for (let i = 0; i < 18; i++) {
    const an = Math.PI + (i / 17) * Math.PI;
    const d = r * (0.8 + e * 0.6);
    bubble(ctx, x + Math.cos(an) * d, y - 2 + Math.sin(an) * d * 0.75, 2 + hash(i) * 2, fade);
  }
  sparkle(ctx, x, y - r * 0.6, 6 * (1 - u), rgba('#ffffff', fade));
  floorRing(ctx, x, y, r, 'rgba(226,250,255,0.4)', 'rgba(100,176,206,1)', fade, 2);
}

// ---------- Grotto Squabble ----------
function puffy(ctx, x, y, s, col, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (const [dx, dy, r] of [[-3, 0.6, 3], [0, -1.4, 3.6], [3.2, 0.4, 2.8]]) {
    ctx.moveTo(x + (dx + r) * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  pen(ctx, col.ink, 1.2);
  ctx.stroke();
  ctx.fillStyle = col.lt;
  ctx.fill('nonzero');
  ctx.restore();
}
function squabbleWarn(ctx, z, x, y, p, time) {
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.16 * p;
  ctx.fillStyle = '#7fd0d8';
  ctx.fillRect(-40, y - 10, SW + 80, 16);
  ctx.restore();
  for (let i = 0; i < 22; i++) {
    const v = (time * (0.3 + hash(i) * 0.25) + hash(i * 4.7)) % 1;
    const px = hash(i * 2.3) * SW;
    const py = y - 8 - v * 120;
    if (i % 3 === 0) puffy(ctx, px + Math.sin(v * 8 + i) * 4, py, 0.9, i % 2 ? MURRI_C : ENA_C, Math.sin(Math.PI * v) * (0.4 + 0.6 * p));
    else bubble(ctx, px + Math.sin(v * 6 + i) * 4, py, 1.4 + hash(i) * 2, Math.sin(Math.PI * v) * (0.4 + 0.6 * p));
  }
}
function squabbleHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.18 * (1 - e);
  ctx.fillStyle = '#e8fbff';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 26; i++) {
    const px = hash(i * 3.3) * SW;
    bubble(ctx, px, y - 10 - e * (40 + hash(i) * 80), 2 + hash(i * 1.7) * 2.6, fade);
  }
}

export const MORAY_FX = {
  mrPeek: { warn: peekWarn, hit: peekHit },
  mrChomp: { warn: chompWarn, hit: chompHit },
  mrGossip: { warn: gossipWarn, hit: gossipHit },
  mrPickM: { warn: pickWarn(true), hit: pickHit(true) },
  mrPickE: { warn: pickWarn(false), hit: pickHit(false) },
  mrTwirl: { warn: twirlWarn, hit: twirlHit },
  mrHuddle: { warn: huddleWarn, hit: huddleHit },
  mrSquabble: { warn: squabbleWarn, hit: squabbleHit },
};
// How long each landing plays (s).
export const MORAY_HOLD = { mrPeek: 0.8, mrChomp: 0.7, mrGossip: 0.6, mrPickM: 0.4, mrPickE: 0.4, mrTwirl: 0.7, mrHuddle: 0.8, mrSquabble: 1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const MORAY_OWN_WARN = Object.keys(MORAY_FX);
