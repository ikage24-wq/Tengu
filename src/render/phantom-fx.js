// The Phantom Trickster's effects, drawn by hand (world/phantom.js, world/melee.js): her stage smoke
// (real billowing puffs, shaded plum to lavender, rolling out and rising as they thin), her arrows
// (a slim plum shaft with a silver head and a short trail of sparkles), a pool of trick hits so no
// two hits in a row look alike (a fan of cards, a pair of doves, a pop of confetti, a silk scarf
// whipped away), and Showstopper's spotlight.

const TAU = Math.PI * 2;
const PLUM = ['#f4ecff', '#d9c4f2', '#b394d9', '#8a68b8', '#5b3f86'];
const SUITS = ['#d23a4e', '#2a2238'];
const CONFETTI = ['#ffd166', '#ff7aa8', '#8ad8ff', '#c7a6ff', '#9df0c0'];
const ease = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;
const rand = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ---------- Smoke ----------
// One puff: a shaded ball (lit from the top left, a darker plum underside) with a soft rim.
function puff(ctx, x, y, r, a) {
  if (r <= 0.5 || a <= 0) return;
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, PLUM[0]);
  g.addColorStop(0.55, PLUM[1]);
  g.addColorStop(1, PLUM[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
// A cloud of stage smoke `w` wide at its fullest: puffs burst out from the middle, roll outward
// along the floor and rise, swelling and thinning; a couple of sparkles and a card flutter in it.
export function drawSmoke(ctx, x, y, w, p, seed = 0) {
  const k0 = ctx.globalAlpha;
  const n = Math.max(6, Math.round(w / 9));
  const out = ease(p * 1.6);
  ctx.save();
  // Back puffs first (darker, further), then the front ones.
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < n; k++) {
      if ((k % 2) !== pass) continue;
      const a0 = (k / n) * Math.PI + rand(seed + k) * 0.4;
      const side = Math.cos(a0);
      const d = (w / 2) * out * (0.5 + 0.5 * rand(seed + k * 3));
      const px = x + side * d;
      const py = y - 6 - Math.abs(Math.sin(a0)) * w * 0.22 * out - p * w * 0.18 * (0.5 + rand(seed + k * 7));
      const r = (w / 7) * (0.6 + 0.5 * rand(seed + k * 5)) * (0.5 + 0.7 * out);
      const fade = Math.max(0, 1 - Math.max(0, p - 0.35) / 0.65);
      puff(ctx, px, py, r, k0 * fade * (pass ? 0.95 : 0.75));
    }
  }
  // A bright core flash at the very start (the pop).
  if (p < 0.25) puff(ctx, x, y - w * 0.15, (w / 5) * (1 - p * 2), k0 * (1 - p * 4) * 0.9);
  ctx.globalAlpha = k0 * Math.max(0, 1 - p);
  for (let k = 0; k < 3; k++) sparkle(ctx, x + (rand(seed + k * 11) - 0.5) * w * 0.8, y - 10 - rand(seed + k * 13) * w * 0.4 - p * 10, 3 + 2 * (1 - p), k);
  if (w > 50) card(ctx, x + (rand(seed + 3) - 0.5) * w * 0.5, y - w * 0.3 - p * 30, 0.8, p * 8 + seed, 1);
  ctx.restore();
}

// ---------- Little things ----------
function sparkle(ctx, x, y, r, k) {
  ctx.fillStyle = k % 2 ? '#ffffff' : '#f4e6ff';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
}
// A playing card seen spinning (its width shrinks and grows as it turns), a suit pip on its face.
function card(ctx, x, y, s, spin, suit) {
  const w = 5 * s * Math.abs(Math.cos(spin));
  const h = 7 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(spin * 0.7) * 0.6);
  ctx.fillStyle = '#fffaf2';
  ctx.strokeStyle = '#3a2a4e';
  ctx.lineWidth = 0.8;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  if (w > 2) {
    ctx.fillStyle = SUITS[suit % 2];
    ctx.beginPath();
    ctx.arc(0, -0.6 * s, 1.1 * s, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.2 * s, 0);
    ctx.lineTo(1.2 * s, 0);
    ctx.lineTo(0, 1.6 * s);
    ctx.fill();
  }
  ctx.restore();
}
// A dove in flight, wings beating on `flap`.
function dove(ctx, x, y, s, flap, dir) {
  const up = Math.sin(flap);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#6a5a86';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 2.2, -0.15, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(3.6, -1.4, 1.6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(5, -1.6, 1.4, 0.8);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-1, -1);
  ctx.quadraticCurveTo(-3, -1 - 6 * up, -6, -2 - 5 * up);
  ctx.lineTo(1.5, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-7, 1.4);
  ctx.lineTo(-4, 1.2);
  ctx.fill();
  ctx.restore();
}

// ---------- Arrows ----------
// A slim plum shaft, a silver head and fletching, and a short tail of sparkles and smoke wisps.
export function drawPhantomArrow(ctx, x, y, ang, big, time) {
  const L = big ? 30 : 22;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  // The trail behind (in the arrow's own frame, so it always streams straight back).
  for (let k = 0; k < 5; k++) {
    const d = L * 0.6 + k * (big ? 7 : 5);
    const wob = Math.sin(time * 20 + k * 1.7) * 1.5;
    ctx.globalAlpha = (1 - k / 5) * 0.55;
    ctx.fillStyle = PLUM[1 + (k % 2)];
    ctx.beginPath();
    ctx.arc(-d, wob, (big ? 3 : 2) * (1 - k / 7), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  sparkle(ctx, -L * 0.7 - 6 + Math.sin(time * 13) * 3, Math.cos(time * 11) * 3, 2.2, 0);
  ctx.globalAlpha = 1;
  // Shaft.
  ctx.strokeStyle = '#3a2556';
  ctx.lineWidth = big ? 2.6 : 2;
  ctx.beginPath();
  ctx.moveTo(-L * 0.6, 0);
  ctx.lineTo(L * 0.4, 0);
  ctx.stroke();
  ctx.strokeStyle = PLUM[3];
  ctx.lineWidth = big ? 1.2 : 0.9;
  ctx.beginPath();
  ctx.moveTo(-L * 0.6, -0.3);
  ctx.lineTo(L * 0.4, -0.3);
  ctx.stroke();
  // Fletching.
  ctx.fillStyle = PLUM[2];
  ctx.strokeStyle = '#3a2556';
  ctx.lineWidth = 0.8;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-L * 0.6, 0);
    ctx.lineTo(-L * 0.6 - 4, s * 3.4);
    ctx.lineTo(-L * 0.6 + 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Silver head.
  const hl = big ? 8 : 6;
  ctx.fillStyle = '#e8ecf6';
  ctx.beginPath();
  ctx.moveTo(L * 0.4 + hl, 0);
  ctx.lineTo(L * 0.4 - 1, -(big ? 3.6 : 2.8));
  ctx.lineTo(L * 0.4 + 1, 0);
  ctx.lineTo(L * 0.4 - 1, big ? 3.6 : 2.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (big) {
    // Her big one carries a card on the shaft, spinning.
    card(ctx, -L * 0.1, -5, 1, time * 9, 0);
  }
  ctx.restore();
}

// ---------- Hits ----------
// Which trick a hit plays: picked from the hit's own seed, so the pool shuffles hit to hit.
const TRICKS = ['cards', 'doves', 'confetti', 'scarf'];
function trickHit(ctx, f, x, y, p) {
  const big = f.big || f.crit;
  const s = big ? 1.35 : 1;
  const seed = Math.floor((f.seed ?? 0.5) * 1000);
  const trick = TRICKS[seed % TRICKS.length];
  const e = ease(p * 1.4);
  // Every trick opens on a silver flash and a little puff of smoke.
  if (p < 0.3) {
    ctx.globalAlpha = 1 - p / 0.3;
    sparkle(ctx, x, y, 9 * s * (1 - p), 0);
  }
  // (Only a wisp: the trick is the hit, and a crowd of hits must never pile up into a wall.)
  ctx.save();
  ctx.globalAlpha = 0.6;
  if (p < 0.6) drawSmoke(ctx, x, y + 6 * s, 14 * s, Math.min(1, p / 0.6), seed);
  ctx.restore();
  ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - 0.55) / 0.45);
  if (trick === 'cards') {
    // A fan of cards bursting out and tumbling.
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.45;
      card(ctx, x + Math.cos(a) * 22 * s * e, y + Math.sin(a) * 18 * s * e + 14 * p * p, s, p * 14 + k, k);
    }
  } else if (trick === 'doves') {
    // Two doves bursting up and away, a few feathers drifting down.
    for (const d of [-1, 1]) dove(ctx, x + d * 18 * s * e, y - 26 * s * e, s, p * 40 + d, d);
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 4; k++) ctx.fillRect(x + (rand(seed + k) - 0.5) * 24 * s, y - 6 + p * 16 + k * 2, 1.5, 3);
  } else if (trick === 'confetti') {
    // A pop of confetti and a ring of stars.
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU + rand(seed + k);
      const d = 24 * s * e * (0.6 + 0.4 * rand(seed + k * 2));
      ctx.fillStyle = CONFETTI[k % CONFETTI.length];
      ctx.save();
      ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8 + 16 * p * p);
      ctx.rotate(p * 10 + k);
      ctx.fillRect(-1.6, -0.8, 3.2, 1.6);
      ctx.restore();
    }
    for (let k = 0; k < 5; k++) sparkle(ctx, x + Math.cos(k * 1.26) * 16 * s * e, y + Math.sin(k * 1.26) * 12 * s * e, 2.6, k);
  } else {
    // A silk scarf whipped out of the hit and away, rippling.
    const d = f.dir || 1;
    ctx.strokeStyle = '#ff5c8a';
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      const px = x + d * (u * 40 * s * e);
      const py = y - u * 14 * s * e + Math.sin(u * 7 - p * 18) * 4 * s;
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = '#ffd1df';
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let k = 0; k < 3; k++) sparkle(ctx, x + d * (10 + k * 12) * s * e, y - 10 - k * 4, 2.4, k);
  }
  ctx.globalAlpha = 1;
}

// ---------- Showstopper ----------
// A spotlight dropping on her from high above, confetti falling through it, a rose landing at her
// feet.
function spotlight(ctx, x, y, p) {
  const a = Math.max(0, Math.min(1, p * 5, (1 - p) * 2.5));
  const g = ctx.createLinearGradient(0, y - 220, 0, y);
  g.addColorStop(0, 'rgba(255,246,214,0)');
  g.addColorStop(0.6, `rgba(255,246,214,${0.35 * a})`);
  g.addColorStop(1, `rgba(255,240,200,${0.6 * a})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 220);
  ctx.lineTo(x + 10, y - 220);
  ctx.lineTo(x + 34, y);
  ctx.lineTo(x - 34, y);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = a * 0.7;
  ctx.fillStyle = '#fff0c8';
  ctx.beginPath();
  ctx.ellipse(x, y, 34, 6, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = a;
  for (let k = 0; k < 14; k++) {
    const fall = (p * 1.3 + rand(k) * 0.6) % 1;
    ctx.fillStyle = CONFETTI[k % CONFETTI.length];
    ctx.save();
    ctx.translate(x + (rand(k * 3) - 0.5) * 56 + Math.sin(p * 9 + k) * 4, y - 180 + fall * 180);
    ctx.rotate(p * 12 + k);
    ctx.fillRect(-1.6, -0.8, 3.2, 1.6);
    ctx.restore();
  }
  // The rose, tossed in from the side.
  const r = ease(Math.max(0, p - 0.25) / 0.3);
  if (r > 0) {
    const rx = x + 50 * (1 - r) - 12;
    const ry = y - 2 - 40 * Math.sin(Math.PI * r) * (1 - r * 0.3);
    ctx.strokeStyle = '#3f8a4a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 7, ry + 2);
    ctx.stroke();
    ctx.fillStyle = '#d23a4e';
    ctx.beginPath();
    ctx.arc(rx, ry, 2.6, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPhantomFx(ctx, f, x, y, p) {
  switch (f.kind) {
    case 'pthit':
      trickHit(ctx, f, x, y - (f.h ?? 24) / 2, p);
      return true;
    case 'ptsmoke': {
      // (Smoke Bomb's is as wide as it reaches, `bomb`; a Blast Arrow's on a monster, `big`; a
      // trick's puff, `small`, still reads.)
      const w = f.bomb ? 130 : f.big ? 70 : f.small ? 28 : 60;
      ctx.save();
      ctx.globalAlpha = f.small ? 0.7 : 1;
      drawSmoke(ctx, x, y, w, p, Math.floor((f.x ?? 0) * 0.37));
      ctx.restore();
      return true;
    }
    case 'ptshowfx':
      spotlight(ctx, x, y, p);
      return true;
    default:
      return false;
  }
}
