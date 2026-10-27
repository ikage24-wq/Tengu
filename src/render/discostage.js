// Dancing Green's stage, modelled on his FFXIV arena. Back to front:
// - a starry night with green, pink and violet nebula clouds;
// - the main sign: an ornate gold crest arch, a huge orange sunburst wheel ringed with chasing
//   bulbs, red-orange neon script, a cyan neon bunny dancer on top, and long neon speed lines
//   shooting out both sides;
// - tall cyan dot-grid dancers that change pose on the beat, spinning X-shaped windmill lamps,
//   a neon star emblem and an open neon ring;
// - big warm mirror balls throwing light specks;
// - hexagon panel walls with lamp clusters on stands;
// - the stage's back: stepped blocks with gold trim, drum pedestals for the frog dancers, and
//   brass posts with velvet rope;
// - sweeping spotlights;
// - the floor: big pastel iridescent tiles with thick glowing gold seams, a light wave rolling
//   across on each beat and a rainbow strip along the front edge.
// The music is 120 bpm: lights hit on every beat (twice a second), and every 4 bars there is a
// "drop": the whole stage flashes and confetti bursts.

const BEAT = 0.5;
const beatPhase = (time) => (time % BEAT) / BEAT;
const hit = (time) => Math.max(0, 1 - beatPhase(time) * 2.4);
const beatNo = (time) => Math.floor(time / BEAT);
const isDrop = (time) => beatNo(time) % 16 === 0;
const dropK = (time) => (isDrop(time) ? hit(time) : 0);

// Screen x of a world x at parallax depth d (1 = moves with the floor).
const sxOf = (cam, width, wx, d) => width / 2 + (wx - (cam.x + width / 2)) * d;

function glowStroke(ctx, col, w, path, k = 1) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = col;
  ctx.globalAlpha = 0.22 * k;
  ctx.lineWidth = w * 3.2;
  path();
  ctx.stroke();
  ctx.globalAlpha = k;
  ctx.lineWidth = w;
  path();
  ctx.stroke();
  ctx.globalAlpha = 0.85 * k;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.6, w * 0.35);
  path();
  ctx.stroke();
  ctx.restore();
}

function blob(ctx, x, y, r, col) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function sky(ctx, width, height, time) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#0b0820');
  g.addColorStop(0.6, '#1c1238');
  g.addColorStop(1, '#2c1844');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  // Nebula clouds drifting very slowly.
  const d = Math.sin(time * 0.1) * 10;
  blob(ctx, width * 0.75 + d, height * 0.2, 170, 'rgba(120,220,140,0.16)');
  blob(ctx, width * 0.85 - d, height * 0.35, 130, 'rgba(255,120,200,0.14)');
  blob(ctx, width * 0.15 - d, height * 0.25, 160, 'rgba(160,110,255,0.16)');
  blob(ctx, width * 0.35 + d, height * 0.1, 120, 'rgba(255,170,120,0.1)');
  for (let i = 0; i < 90; i++) {
    const x = (i * 97.3) % width;
    const y = (i * 53.7) % (height * 0.7);
    const tw = 0.3 + 0.4 * Math.max(0, Math.sin(time * 1.6 + i * 1.7));
    ctx.fillStyle = `rgba(255,255,255,${tw})`;
    ctx.fillRect(Math.round(x), Math.round(y), i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
}

// The main sign.
function mainSign(ctx, cx, cy, r, time) {
  const k = hit(time);
  const drop = dropK(time);
  // The gold crest arch: a scalloped half-ring behind the wheel.
  ctx.save();
  ctx.fillStyle = '#5a3a2a';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.2, Math.PI, 0);
  ctx.fill();
  for (let i = 0; i <= 26; i++) {
    const a = Math.PI + (i / 26) * Math.PI;
    const x = cx + Math.cos(a) * r * 1.2;
    const y = cy + Math.sin(a) * r * 1.2;
    ctx.fillStyle = i % 2 ? '#b8862e' : '#f0c860';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  glowStroke(ctx, '#f0c860', 1.2, () => { ctx.beginPath(); ctx.arc(cx, cy, r * 1.08, Math.PI, 0); }, 0.7);
  ctx.restore();
  // The sunburst wheel: red and orange wedges.
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2;
    const a1 = ((i + 1) / 24) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? '#c8382c' : '#e8642c';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.fill();
  }
  blob(ctx, cx, cy, r * 0.9, `rgba(255,200,120,${0.25 + 0.25 * k})`);
  glowStroke(ctx, '#ff6a3a', 2.6, () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); }, 0.9 + 0.1 * k);
  glowStroke(ctx, '#ffc04a', 1.6, () => { ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2); }, 0.8 + 0.2 * k);
  // Bulbs: two rings, chasing in opposite directions.
  const run = Math.floor(time * 14);
  for (const [rr, n, dir] of [[0.88, 40, 1], [0.6, 24, -1]]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const on = drop > 0.2 || ((i + run * dir) % 5 + 5) % 5 < 2;
      const x = cx + Math.cos(a) * r * rr;
      const y = cy + Math.sin(a) * r * rr;
      if (on) blob(ctx, x, y, 5, 'rgba(255,240,170,0.5)');
      ctx.fillStyle = on ? '#fff6c8' : '#8a4a2a';
      ctx.beginPath();
      ctx.arc(x, y, on ? 1.9 : 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Neon speed lines shooting out both sides, with arrow heads.
  for (const s of [-1, 1]) {
    for (const [dy, len, col] of [[-r * 0.32, 1.9, '#fff2a0'], [-r * 0.18, 1.6, '#fff2a0'], [r * 0.22, 1.75, '#ffd060']]) {
      const x0 = cx + s * r * 0.95;
      const x1 = cx + s * r * len;
      glowStroke(ctx, col, 1.6, () => { ctx.beginPath(); ctx.moveTo(x0, cy + dy); ctx.lineTo(x1, cy + dy); ctx.lineTo(x1 - s * 6, cy + dy - 5); ctx.moveTo(x1, cy + dy); ctx.lineTo(x1 - s * 6, cy + dy + 5); }, 0.75 + 0.25 * k);
    }
    // Chasing light along the speed lines.
    const u = (time * 1.6) % 1;
    blob(ctx, cx + s * r * (0.95 + u * 0.9), cy - r * 0.32, 8, 'rgba(255,255,220,0.8)');
  }
  // Neon script across the wheel.
  ctx.save();
  ctx.translate(cx, cy + r * 0.12);
  ctx.rotate(-0.12);
  ctx.font = `italic bold ${Math.round(r * 0.34)}px "Brush Script MT", "Comic Sans MS", cursive`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,90,60,0.35)';
  ctx.lineWidth = 7;
  ctx.strokeText('Dancing Green', 0, 0);
  ctx.strokeStyle = '#ff4a3a';
  ctx.lineWidth = 2.6;
  ctx.strokeText('Dancing Green', 0, 0);
  ctx.fillStyle = k > 0.5 || drop ? '#fff0d0' : '#ffd0b8';
  ctx.fillText('Dancing Green', 0, 0);
  ctx.restore();
  // The cyan neon bunny dancer on top: a filled glowing silhouette, hip out, finger up; on the
  // drop he flips to the other arm.
  const up = Math.floor(time / (BEAT * 4)) % 2 === 0;
  const s = r * 0.011;
  const P = (x, y) => [cx + x * s * (up ? 1 : -1), cy - r * 0.95 + y * s];
  ctx.save();
  const fig = () => {
    ctx.beginPath();
    ctx.moveTo(...P(-5, -46));
    ctx.lineTo(...P(-8, -70)); ctx.lineTo(...P(-3, -72)); ctx.lineTo(...P(-1, -50));
    ctx.lineTo(...P(2, -51)); ctx.lineTo(...P(6, -74)); ctx.lineTo(...P(10, -71)); ctx.lineTo(...P(6, -46));
    ctx.lineTo(...P(9, -38)); ctx.lineTo(...P(4, -32));
    ctx.lineTo(...P(12, -40)); ctx.lineTo(...P(20, -64)); ctx.lineTo(...P(24, -62)); ctx.lineTo(...P(16, -34));
    ctx.lineTo(...P(8, -22)); ctx.lineTo(...P(10, -4)); ctx.lineTo(...P(22, 14)); ctx.lineTo(...P(17, 17)); ctx.lineTo(...P(4, 0));
    ctx.lineTo(...P(-4, 18)); ctx.lineTo(...P(-10, 16)); ctx.lineTo(...P(-6, -6)); ctx.lineTo(...P(-6, -22));
    ctx.lineTo(...P(-14, -26)); ctx.lineTo(...P(-12, -10)); ctx.lineTo(...P(-17, -10)); ctx.lineTo(...P(-18, -30)); ctx.lineTo(...P(-7, -34));
    ctx.lineTo(...P(-10, -40));
    ctx.closePath();
  };
  fig();
  ctx.fillStyle = `rgba(140,230,255,${0.75 + 0.25 * k})`;
  ctx.fill();
  glowStroke(ctx, '#9cf0ff', 1.2, fig, 0.9);
  ctx.restore();
}

// A tall dancer made of a cyan dot grid (halftone), in one of three disco poses.
function dotDancer(ctx, cx, base, h, pose, k) {
  const POSES = [
    // Point up.
    [[0, 0.82, 0.1], [0, 0.62, 0.14], [-0.14, 0.3, 0.07], [0.14, 0.3, 0.07], [-0.2, 0.05, 0.06], [0.22, 0.08, 0.06], [0.16, 0.78, 0.05], [0.24, 0.95, 0.05], [-0.18, 0.6, 0.05], [-0.1, 0.48, 0.05], [0, 0.95, 0.08]],
    // Arms up in a V.
    [[0, 0.82, 0.1], [0, 0.62, 0.14], [-0.12, 0.3, 0.07], [0.12, 0.3, 0.07], [-0.16, 0.05, 0.06], [0.16, 0.05, 0.06], [-0.2, 0.8, 0.05], [-0.3, 0.98, 0.05], [0.2, 0.8, 0.05], [0.3, 0.98, 0.05], [0, 0.95, 0.08]],
    // Lunge, one arm out.
    [[0.04, 0.78, 0.1], [0.02, 0.58, 0.14], [-0.2, 0.28, 0.07], [0.18, 0.3, 0.07], [-0.34, 0.06, 0.06], [0.28, 0.08, 0.06], [0.24, 0.66, 0.05], [0.42, 0.7, 0.05], [-0.18, 0.62, 0.05], [-0.3, 0.52, 0.05], [0.04, 0.92, 0.08]],
  ][pose];
  const pts = [];
  // Limbs as thick capsules between key points, head as a disc.
  const join = (a, b) => { for (let t = 0; t <= 1; t += 0.12) pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); };
  const [head, chest, hipL, hipR, footL, footR, h1, h2, h3, h4, top] = POSES;
  pts.push(head, top);
  join(head, chest); join(chest, [0, 0.4, 0.12]); join([0, 0.4, 0.12], hipL); join([0, 0.4, 0.12], hipR);
  join(hipL, footL); join(hipR, footR); join(chest, h1); join(h1, h2); join(chest, h3); join(h3, h4);
  ctx.fillStyle = `rgba(110,225,255,${0.55 + 0.35 * k})`;
  const step = 2.2;
  for (const [px, py, pr] of pts) {
    const x = cx + px * h;
    const y = base - py * h;
    const rr = pr * h;
    for (let gx = -rr; gx <= rr; gx += step) for (let gy = -rr; gy <= rr; gy += step) {
      if (gx * gx + gy * gy > rr * rr) continue;
      ctx.fillRect(Math.round((x + gx) / step) * step, Math.round((y + gy) / step) * step, 1.4, 1.4);
    }
  }
  blob(ctx, cx, base - h * 0.5, h * 0.55, `rgba(110,225,255,${0.08 + 0.08 * k})`);
}

// A spinning X-shaped windmill lamp: four gold arms with bulbs, turning slowly.
function windmill(ctx, x, y, r, time, dir) {
  const a0 = time * 0.6 * dir;
  ctx.strokeStyle = '#c99a4a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = a0 + (i * Math.PI) / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
    for (const u of [0.45, 0.75, 1]) {
      const on = (Math.floor(time * 6) + i) % 2 === 0;
      ctx.fillStyle = on ? '#fff3c0' : '#9a7a4a';
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * u, y + Math.sin(a) * r * u, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#e8c070';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function starEmblem(ctx, x, y, r, time) {
  const k = hit(time);
  glowStroke(ctx, '#ffc04a', 1.6, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }, 0.8);
  glowStroke(ctx, '#ffe9a0', 1.4, () => {
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const rr = i % 2 ? r * 0.32 : r * 0.72;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
  }, 0.7 + 0.3 * k);
}

// A big mirror ball: gold, pink and white facets turning, a glint, and specks thrown around.
function mirrorBall(ctx, x, y, r, time, width, height) {
  ctx.strokeStyle = 'rgba(220,210,240,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y - r);
  ctx.stroke();
  blob(ctx, x, y, r * 2.2, 'rgba(255,200,160,0.18)');
  ctx.fillStyle = '#6a4a6a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  const spin = time * 0.9;
  const cols = ['#ffe0a0', '#ffb0d0', '#ffffff', '#ffc070', '#e0a0ff', '#a0e8ff'];
  for (let row = -5; row <= 5; row++) {
    const lat = (row / 6) * (Math.PI / 2);
    const ring = Math.max(4, Math.round(16 * Math.cos(lat)));
    for (let col = 0; col < ring; col++) {
      const lon = (col / ring) * Math.PI * 2 + spin;
      const z = Math.cos(lon) * Math.cos(lat);
      if (z < 0.05) continue;
      const fx = x + Math.sin(lon) * Math.cos(lat) * r;
      const fy = y + Math.sin(lat) * r;
      const light = 0.35 + 0.65 * z;
      ctx.globalAlpha = light;
      ctx.fillStyle = cols[(col + row * 3 + 60) % cols.length];
      const sz = Math.max(1, (r / 6) * z);
      ctx.fillRect(Math.round(fx - sz / 2), Math.round(fy - sz / 2), Math.ceil(sz), Math.ceil(sz * 0.8));
    }
  }
  ctx.globalAlpha = 1;
  blob(ctx, x - r * 0.35, y - r * 0.4, r * 0.4, 'rgba(255,255,255,0.8)');
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39 + spin * 0.5;
    const sx = ((x + Math.cos(a) * (60 + (i % 5) * 70) + spin * 40) % width + width) % width;
    const sy = y + 20 + ((i * 41 + spin * 25) % (height * 0.75));
    ctx.fillStyle = ['rgba(255,190,230,0.6)', 'rgba(255,240,180,0.6)', 'rgba(170,230,255,0.6)'][i % 3];
    ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
  }
}

// A wall of dark hexagon panels with a few lit ones, behind the sides of the stage.
function hexWall(ctx, x, base, cols, rows, time) {
  const R = 9;
  for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
    const hx = x + c * R * 1.55;
    const hy = base - rr * R * 1.75 - (c % 2) * R * 0.88;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) ctx.lineTo(hx + Math.cos((i * Math.PI) / 3) * R * 0.9, hy + Math.sin((i * Math.PI) / 3) * R * 0.9);
    ctx.closePath();
    const lit = (c * 3 + rr * 5 + beatNo(time)) % 7 === 0;
    ctx.fillStyle = lit ? 'rgba(255,220,150,0.55)' : '#211a34';
    ctx.fill();
    ctx.strokeStyle = '#3a2f58';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// A cluster of round lamps on a tall stand, flashing on the beat.
function lampStand(ctx, x, base, time, phase) {
  ctx.fillStyle = '#2a2140';
  ctx.fillRect(x - 1, base - 52, 3, 52);
  ctx.fillRect(x - 7, base - 3, 15, 3);
  const on = (beatNo(time) + phase) % 2 === 0 || dropK(time) > 0.2;
  const cy = base - 62;
  if (on) blob(ctx, x, cy, 40, 'rgba(255,245,215,0.45)');
  for (const [dx, dy] of [[0, 0], [-7, -4], [7, -4], [-7, 4], [7, 4], [0, -8], [0, 8]]) {
    ctx.fillStyle = '#3a3058';
    ctx.beginPath();
    ctx.arc(x + dx, cy + dy, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = on ? '#ffffff' : '#8a80a8';
    ctx.beginPath();
    ctx.arc(x + dx, cy + dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The back of the stage: stepped blocks with gold trim, drum pedestals for the frog dancers, and
// brass posts with velvet rope.
function backStage(ctx, cam, width, groundY, time, mapW) {
  const y = groundY - 30;
  const X = (wx) => sxOf(cam, width, wx, 0.9);
  // Stepped blocks.
  for (let i = -1; i < 12; i++) {
    const wx = i * 110;
    const h = i % 3 === 1 ? 16 : 10;
    const x = X(wx);
    ctx.fillStyle = '#3c3050';
    ctx.fillRect(Math.round(x), y - h, 104, h + 30);
    ctx.fillStyle = '#e8b850';
    ctx.fillRect(Math.round(x), y - h, 104, 2);
    ctx.fillStyle = '#2c2240';
    ctx.fillRect(Math.round(x), y - h + 2, 104, 3);
  }
  ctx.fillStyle = '#2a1f3c';
  ctx.fillRect(0, y + 18, width, 12);
  // Drum pedestals with lit tops.
  const k = hit(time);
  for (let i = 0; i < 8; i++) {
    const x = X(mapW * 0.5 + (i - 3.5) * 70);
    if (x < -40 || x > width + 40) continue;
    ctx.fillStyle = '#5a4a72';
    ctx.fillRect(Math.round(x - 16), y - 2, 32, 16);
    ctx.fillStyle = '#7a6a96';
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,${210 + Math.round(45 * k)},140,${0.6 + 0.4 * k})`;
    ctx.fillRect(Math.round(x - 16), y + 6, 32, 2);
    ctx.fillStyle = `rgba(255,230,160,${0.25 + 0.35 * k})`;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 13, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Velvet rope on brass posts.
  for (let i = -1; i < 26; i++) {
    const px = X(i * 48);
    ctx.fillStyle = '#d9a640';
    ctx.fillRect(Math.round(px), y + 4, 2, 14);
    ctx.fillStyle = '#fff0a8';
    ctx.fillRect(Math.round(px) - 1, y + 2, 4, 3);
    ctx.strokeStyle = '#c0283c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 1, y + 6);
    ctx.quadraticCurveTo(px + 25, y + 13, px + 49, y + 6);
    ctx.stroke();
  }
}

// Spotlights from the rafters, sweeping slowly; they swing in fast on the drop.
function spotlights(ctx, width, groundY, time) {
  const fast = dropK(time);
  for (const [x, ph, col] of [[width * 0.12, 0, '255,130,220'], [width * 0.5, 2.1, '255,250,220'], [width * 0.88, 4.2, '130,230,255']]) {
    const ex = width * 0.5 + Math.sin(time * (0.7 + fast * 2) + ph) * width * 0.4;
    const g = ctx.createLinearGradient(0, 0, 0, groundY);
    g.addColorStop(0, `rgba(${col},0.03)`);
    g.addColorStop(1, `rgba(${col},${0.16 + 0.12 * fast})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 5, 0);
    ctx.lineTo(x + 5, 0);
    ctx.lineTo(ex + 36, groundY + 6);
    ctx.lineTo(ex - 36, groundY + 6);
    ctx.fill();
    ctx.fillStyle = `rgba(${col},0.25)`;
    ctx.beginPath();
    ctx.ellipse(ex, groundY + 8, 36, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The floor: big pastel iridescent tiles with thick glowing gold seams. On each beat a light wave
// rolls across from the middle; a rainbow strip runs along the front edge.
function danceFloor(ctx, cam, width, height, groundY, time) {
  const TILES = ['#8e7cc0', '#7fc4ac', '#6aa8c4', '#b58cc0', '#9cc48a', '#7e90d0'];
  const T = 72;
  const top = groundY - 2;
  const ph = beatPhase(time);
  const k = hit(time);
  const drop = dropK(time);
  const first = Math.floor(cam.x / T) - 1;
  const rows = [[top, groundY + 22], [groundY + 22, groundY + 50], [groundY + 50, height]];
  for (let r = 0; r < rows.length; r++) {
    const [y0, y1] = rows[r];
    for (let i = first; i < first + Math.ceil(width / T) + 3; i++) {
      const x0 = i * T - cam.x;
      const c = TILES[((i * 5 + r * 2) % TILES.length + TILES.length) % TILES.length];
      // A wave of light rolls out from the stage's centre on every beat.
      const dist = Math.abs(x0 + T / 2 - width / 2) / (width / 2);
      const wave = Math.max(0, 1 - Math.abs(dist - ph * 1.3) * 4);
      const g = ctx.createLinearGradient(x0, y0, x0 + T, y1);
      g.addColorStop(0, c);
      g.addColorStop(0.5, '#3a2f5a');
      g.addColorStop(1, c);
      ctx.fillStyle = g;
      ctx.fillRect(Math.round(x0), Math.round(y0), T, Math.ceil(y1 - y0));
      // Iridescent sheen, brighter on the wave and the drop.
      ctx.fillStyle = `rgba(255,255,255,${0.06 + 0.22 * wave + 0.3 * drop})`;
      ctx.fillRect(Math.round(x0), Math.round(y0), T, Math.ceil(y1 - y0));
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(Math.round(x0 + 4), Math.round(y0 + 2), T - 8, 2);
    }
  }
  // Gold seams with a glow, brighter on the beat.
  const seam = `rgba(255,${200 + Math.round(40 * k)},110,${0.75 + 0.25 * k})`;
  ctx.save();
  ctx.shadowColor = 'rgba(255,200,100,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = seam;
  for (let i = first; i < first + Math.ceil(width / T) + 3; i++) ctx.fillRect(Math.round(i * T - cam.x) - 1, Math.round(top), 2, height - top);
  ctx.fillRect(0, Math.round(top), width, 2);
  ctx.fillRect(0, Math.round(groundY + 22), width, 2);
  ctx.fillRect(0, Math.round(groundY + 50), width, 2);
  ctx.restore();
  // A rainbow strip glowing along the front of the stage.
  const strip = ctx.createLinearGradient(0, 0, width, 0);
  const off = (time * 0.2) % 1;
  ['#ff6aa8', '#ffb24a', '#ffe86a', '#7ae08a', '#6ad0ff', '#b07aff', '#ff6aa8'].forEach((c, i, a) => strip.addColorStop(((i / (a.length - 1)) + off) % 1, c));
  ctx.fillStyle = strip;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, Math.round(top) - 3, width, 2);
  ctx.globalAlpha = 1;
}

// Confetti bursts on the drop, drifting down for a couple of beats.
function confetti(ctx, width, time) {
  const n = beatNo(time) % 16;
  if (n > 3) return;
  const u = (time % (BEAT * 16)) / (BEAT * 4);
  for (let i = 0; i < 50; i++) {
    const x = (i * 71.3 + Math.sin(i + time * 3) * 10) % width;
    const y = -10 + u * 260 + (i % 7) * 12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 6 + i);
    ctx.globalAlpha = Math.max(0, 1 - u);
    ctx.fillStyle = ['#ff5b9f', '#ffe36b', '#7fe0ff', '#9fff8f', '#c49aff'][i % 5];
    ctx.fillRect(-2, -1, 4, 2);
    ctx.restore();
  }
}

export function drawDiscoBack(ctx, map, cam, width, height, time) {
  const groundY = map.groundY - cam.y;
  const mid = map.width / 2;
  sky(ctx, width, height, time);
  // Background pieces are placed by their offset on screen from the stage's centre, and drift
  // with the camera at their own depth.
  const X = (off, d) => width / 2 + off + (mid - (cam.x + width / 2)) * d;
  const k = hit(time);
  hexWall(ctx, X(-318, 0.3), groundY - 40, 6, 6, time);
  hexWall(ctx, X(240, 0.3), groundY - 40, 6, 6, time);
  starEmblem(ctx, X(-245, 0.35), groundY - 180, 15, time);
  glowStroke(ctx, '#ffb24a', 2.4, () => { ctx.beginPath(); ctx.arc(X(250, 0.35), groundY - 188, 13, 0.4, Math.PI * 2 - 0.4); }, 0.8);
  windmill(ctx, X(-140, 0.4), groundY - 60, 20, time, 1);
  windmill(ctx, X(145, 0.4), groundY - 66, 22, time, -1);
  mainSign(ctx, X(0, 0.25), groundY - 150, 60, time);
  const b = beatNo(time);
  dotDancer(ctx, X(-290, 0.45), groundY - 34, 92, b % 3, k);
  dotDancer(ctx, X(-200, 0.45), groundY - 34, 62, (b + 1) % 3, k);
  dotDancer(ctx, X(205, 0.45), groundY - 34, 64, (b + 2) % 3, k);
  dotDancer(ctx, X(292, 0.45), groundY - 34, 96, b % 3, k);
  mirrorBall(ctx, X(-232, 0.55), groundY - 225, 20, time, width, height);
  mirrorBall(ctx, X(238, 0.55), groundY - 238, 24, time, width, height);
  for (const [off, ph] of [[-330, 0], [-110, 1], [115, 1], [335, 0]]) lampStand(ctx, X(off, 0.75), groundY - 30, time, ph);
  backStage(ctx, cam, width, groundY, time, map.width);
  danceFloor(ctx, cam, width, height, groundY, time);
  spotlights(ctx, width, groundY, time);
  confetti(ctx, width, time);
  // The drop: a white flash over everything for a beat.
  const drop = dropK(time);
  if (drop > 0) {
    ctx.fillStyle = `rgba(255,240,255,${0.25 * drop})`;
    ctx.fillRect(0, 0, width, height);
  }
}
