// The Meteor Caller's meteors and comets, drawn by hand every frame so they stay smooth at any size
// and burn: `ang` is the way it is travelling (its head leads), `r` the size of its head.
//   meteor  a craggy rock, white-hot on the face it leads with and dark on its back, molten cracks
//           glowing through it; a heat haze round it; a flickering tail of flame (white, then yellow,
//           orange and red, thinning out), embers shed along it and smoke curling off the end
//   comet   an icy core in a soft blue glow, a long fading tail of pale light with a brighter streak
//           down its middle, sparkles shed along it
// Every rock has its own shape (from `seed`), and its flames move on their own clock.

const TAU = Math.PI * 2;
const rand = (n) => {
  const v = Math.sin(n * 127.1 + 74.7) * 43758.5453;
  return v - Math.floor(v);
};

// The rock's outline: `n` points round it, each pushed in or out a little.
function rockShape(r, seed) {
  const n = 9;
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + rand(seed + k) * 0.3;
    const d = r * (0.78 + 0.32 * rand(seed * 3 + k));
    pts.push([Math.cos(a) * d, Math.sin(a) * d]);
  }
  return pts;
}
function path(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// One tongue of flame along the tail, from the head back `len`, `w` wide at its root.
function tongue(ctx, len, w, wob, stops, front = 0) {
  const g = ctx.createLinearGradient(front, 0, -len, 0);
  stops.forEach(([at, c]) => g.addColorStop(at, c));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(front, -w * 0.2);
  ctx.quadraticCurveTo(front * 0.7, -w, 0, -w);
  ctx.bezierCurveTo(-len * 0.35, -w * 1.05 + wob, -len * 0.7, -w * 0.45 + wob * 1.6, -len, wob * 2);
  ctx.bezierCurveTo(-len * 0.7, w * 0.45 + wob * 1.6, -len * 0.35, w * 1.05 + wob, 0, w);
  ctx.quadraticCurveTo(front * 0.7, w, front, w * 0.2);
  ctx.closePath();
  ctx.fill();
}

export function drawMeteor(ctx, x, y, ang, r, time, seed = 1, alpha = 1) {
  if (r <= 0.5 || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  const t = time * 1;
  // Smoke curling off far back (drawn first, under everything).
  for (let k = 0; k < 6; k++) {
    const u = ((t * 1.4 + k / 6) % 1);
    const d = r * (5 + u * 7);
    const s = r * (0.7 + u * 1.3);
    const sy = Math.sin(k * 2.1 + t * 3) * r * 0.9 * u;
    const sg = ctx.createRadialGradient(-d, sy, 0, -d, sy, s * 0.8);
    sg.addColorStop(0, `rgba(120,108,118,${0.32 * (1 - u)})`);
    sg.addColorStop(1, 'rgba(120,108,118,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(-d, sy, s * 0.8, 0, TAU);
    ctx.fill();
  }
  // The tail of fire: three tongues, outer red to inner white, each flickering on its own.
  ctx.globalCompositeOperation = 'lighter';
  const flick = (k) => Math.sin(t * (17 + k * 5) + k * 1.7) * r * 0.18;
  ctx.globalAlpha = alpha * 0.85;
  tongue(ctx, r * (7.5 + Math.sin(t * 11) * 0.6), r * 1.4, flick(0), [[0, 'rgba(255,120,40,0.95)'], [0.45, 'rgba(220,60,30,0.6)'], [1, 'rgba(120,20,40,0)']], r * 1.5);
  tongue(ctx, r * (5.4 + Math.sin(t * 15) * 0.5), r * 1.1, flick(1), [[0, 'rgba(255,214,90,1)'], [0.5, 'rgba(255,150,50,0.6)'], [1, 'rgba(255,90,30,0)']], r * 1.3);
  tongue(ctx, r * (3 + Math.sin(t * 21) * 0.3), r * 0.7, flick(2), [[0, 'rgba(255,255,236,1)'], [0.6, 'rgba(255,230,140,0.5)'], [1, 'rgba(255,200,90,0)']], r * 1.15);
  // The heat haze round the head.
  const halo = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 2.4);
  halo.addColorStop(0, 'rgba(255,190,90,0.55)');
  halo.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.4, 0, TAU);
  ctx.fill();
  // Embers shed along the tail, drifting off it.
  for (let k = 0; k < 10; k++) {
    const u = ((t * 2.2 + rand(seed + k)) % 1);
    const ex = -r * (1.2 + u * 8);
    const ey = (rand(seed + k * 7) - 0.5) * r * 2.2 * (0.4 + u);
    const es = r * 0.16 * (1 - u) + 0.4;
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, es * 2.2);
    eg.addColorStop(0, k % 3 ? 'rgba(255,220,130,1)' : 'rgba(255,255,255,1)');
    eg.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.globalAlpha = alpha * (1 - u);
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, es * 2.2, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha;
  // The rock: dark on its back, burning on its face.
  const rock = rockShape(r, seed);
  const body = ctx.createLinearGradient(-r, 0, r, 0);
  body.addColorStop(0, '#4a2c28');
  body.addColorStop(0.3, '#8a4e34');
  body.addColorStop(0.62, '#d0702e');
  body.addColorStop(0.85, '#f09a48');
  body.addColorStop(1, '#ffe6b0');
  ctx.fillStyle = body;
  path(ctx, rock);
  ctx.fill();
  ctx.save();
  path(ctx, rock);
  ctx.clip();
  // Its craters, shaded.
  for (let k = 0; k < 3; k++) {
    const cx = (rand(seed + k * 11) - 0.7) * r;
    const cy = (rand(seed + k * 13) - 0.5) * r * 1.2;
    const cr = r * (0.18 + 0.12 * rand(seed + k * 17));
    ctx.fillStyle = 'rgba(30,16,20,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,170,90,0.35)';
    ctx.beginPath();
    ctx.arc(cx + cr * 0.3, cy, cr * 0.6, -1.2, 1.2);
    ctx.fill();
  }
  // Molten veins glowing through it, pulsing: thin and branching, brighter toward the hot face.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let k = 0; k < 4; k++) {
    let px = (rand(seed + k * 5) - 0.6) * r * 0.9;
    let py = (rand(seed + k * 9) - 0.5) * r * 1.2;
    let a = rand(seed + k * 3) * TAU;
    ctx.strokeStyle = `rgba(255,${140 + Math.round(70 * Math.sin(t * 9 + k))},60,${0.45 + 0.25 * (px / r + 0.6)})`;
    ctx.lineWidth = Math.max(0.6, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let j = 0; j < 3; j++) {
      a += (rand(seed + k * 7 + j) - 0.5) * 1.6;
      px += Math.cos(a) * r * 0.28;
      py += Math.sin(a) * r * 0.28;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // The white-hot leading face.
  const face = ctx.createRadialGradient(r * 1.05, 0, 0, r * 1.05, 0, r * 1.4);
  face.addColorStop(0, 'rgba(255,255,245,1)');
  face.addColorStop(0.45, 'rgba(255,224,150,0.75)');
  face.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = face;
  ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
  ctx.restore();
  // An outline so it reads against any sky.
  ctx.strokeStyle = 'rgba(40,20,24,0.85)';
  ctx.lineWidth = Math.max(0.7, r * 0.06);
  path(ctx, rock);
  ctx.stroke();
  // The air burning just ahead of it: a soft white-gold glow wrapped round its face.
  ctx.globalCompositeOperation = 'lighter';
  const bow = ctx.createRadialGradient(r * 0.9, 0, r * 0.3, r * 0.9, 0, r * 1.5);
  bow.addColorStop(0, 'rgba(255,240,200,0.5)');
  bow.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = bow;
  ctx.beginPath();
  ctx.arc(r * 0.9, 0, r * 1.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawComet(ctx, x, y, ang, r, time, alpha = 1) {
  if (r <= 0.3 || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';
  const t = time;
  // The tail: a long soft fan of pale light, a brighter streak down its middle.
  const len = r * 14;
  const g = ctx.createLinearGradient(0, 0, -len, 0);
  g.addColorStop(0, 'rgba(190,230,255,0.85)');
  g.addColorStop(0.4, 'rgba(120,170,255,0.4)');
  g.addColorStop(1, 'rgba(90,120,255,0)');
  ctx.fillStyle = g;
  const wob = Math.sin(t * 9) * r * 0.3;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.3);
  ctx.quadraticCurveTo(-len * 0.5, -r * 2.2 + wob, -len, wob * 2);
  ctx.quadraticCurveTo(-len * 0.5, r * 2.2 + wob, 0, r * 1.3);
  ctx.closePath();
  ctx.fill();
  const core = ctx.createLinearGradient(0, 0, -len * 0.7, 0);
  core.addColorStop(0, 'rgba(255,255,255,0.95)');
  core.addColorStop(1, 'rgba(200,230,255,0)');
  ctx.strokeStyle = core;
  ctx.lineWidth = r * 0.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-len * 0.35, wob * 0.6, -len * 0.7, wob * 1.4);
  ctx.stroke();
  // Sparkles shed along it.
  for (let k = 0; k < 8; k++) {
    const u = (t * 1.8 + k / 8) % 1;
    const sx = -len * u;
    const sy = Math.sin(k * 2.7) * r * 1.6 * u;
    const s = r * 0.35 * (1 - u) + 0.4;
    ctx.globalAlpha = alpha * (1 - u);
    ctx.fillStyle = k % 2 ? '#ffffff' : '#bfe6ff';
    ctx.beginPath();
    ctx.moveTo(sx, sy - s * 2);
    ctx.lineTo(sx + s * 0.5, sy);
    ctx.lineTo(sx, sy + s * 2);
    ctx.lineTo(sx - s * 0.5, sy);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(sx - s * 2, sy - s * 0.25, s * 4, s * 0.5);
  }
  ctx.globalAlpha = alpha;
  // The core: an icy ball in a blue glow.
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3);
  halo.addColorStop(0, 'rgba(220,240,255,0.9)');
  halo.addColorStop(0.35, 'rgba(140,190,255,0.5)');
  halo.addColorStop(1, 'rgba(90,120,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d6ecff';
  ctx.beginPath();
  ctx.arc(-r * 0.25, r * 0.2, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}
