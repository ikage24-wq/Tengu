// The Bubble Healer's bubbles (world/melee.js blowBubbles/tickBubbles) and their pops, drawn by hand
// so every one can be its own size and wobble: a clear soap film with a rainbow sheen sliding round
// its rim, a bright window highlight, and a soft squash-and-stretch as it drifts (the film itself
// wobbles; the character is never distorted). A bubble swells out of the wand in its first moments
// and thins out (the sheen gets stronger and more golden) just before it pops by itself.

const TAU = Math.PI * 2;
const SWELL = 0.16;
const SHEEN = ['#ff9ad5', '#ffd27a', '#9df0c0', '#8ad8ff', '#c7a6ff'];

export function drawFilm(ctx, x, y, r, t, thin, alpha) {
  film(ctx, x, y, r, t, thin, alpha);
}
function film(ctx, x, y, r, t, thin, alpha) {
  if (r <= 0.5) return;
  const wob = Math.sin(t * 7) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + wob, 1 - wob);
  ctx.globalAlpha = alpha;
  // The body: almost clear, a touch of blue at the edge.
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,0.05)');
  g.addColorStop(0.75, 'rgba(190,230,255,0.12)');
  g.addColorStop(1, 'rgba(170,215,255,0.38)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  // The rainbow sheen sliding round the rim.
  const lw = Math.max(1, r * 0.13);
  for (let k = 0; k < SHEEN.length; k++) {
    const a0 = t * 1.6 + (k / SHEEN.length) * TAU;
    ctx.strokeStyle = SHEEN[(k + (thin > 0.5 ? 1 : 0)) % SHEEN.length];
    ctx.globalAlpha = alpha * (0.45 + 0.4 * thin);
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(0, 0, r - lw / 2, a0, a0 + TAU / SHEEN.length + 0.05);
    ctx.stroke();
  }
  // A crisp outline so it reads on any backdrop.
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.6, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  // Window highlight and a little second glint.
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-r * 0.38, -r * 0.4, r * 0.24, r * 0.13, -0.7, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.42, r * 0.36, r * 0.08, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawSoapBubbles(ctx, world, cam, time) {
  if (!world.soap?.length) return;
  for (const b of world.soap) {
    if (b.popped || world.now < b.born) continue;
    const age = world.now - b.born;
    const grow = Math.min(1, age / SWELL);
    const r = b.r * (1 - (1 - grow) ** 3);
    const thin = Math.max(0, (age - b.life * 0.7) / (b.life * 0.3));
    film(ctx, b.x - cam.x, b.y - cam.y, r, time + b.wob, thin, 1);
  }
}

// A pop: the film snaps into a ring of droplets flying out, a soft splash of foam, and (healing)
// little green-gold sparkles drifting up.
function pop(ctx, x, y, p, r, n) {
  const e = 1 - (1 - p) ** 2;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - p);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.8, r * 0.12 * (1 - p));
  ctx.beginPath();
  ctx.arc(x, y, r * (1 + 0.6 * e), 0, TAU);
  ctx.stroke();
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + 0.3;
    const d = r * (0.9 + 1.4 * e);
    ctx.fillStyle = SHEEN[k % SHEEN.length];
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + 6 * p * p, Math.max(0.5, Math.min(2.4, r * 0.14) * (1 - p)), 0, TAU);
    ctx.fill();
  }
  for (let k = 0; k < 3; k++) {
    const sx = x + (k - 1) * r * 0.6;
    const sy = y - r * 0.4 - 18 * e - k * 3;
    ctx.fillStyle = k % 2 ? '#c8ff9a' : '#fff1a0';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 3);
    ctx.lineTo(sx + 1, sy - 1);
    ctx.lineTo(sx + 3, sy);
    ctx.lineTo(sx + 1, sy + 1);
    ctx.lineTo(sx, sy + 3);
    ctx.lineTo(sx - 1, sy + 1);
    ctx.lineTo(sx - 3, sy);
    ctx.lineTo(sx - 1, sy - 1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Suds: a cluster of foam blobs clinging and fizzing away.
function suds(ctx, x, y, p, r) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - p) * 0.9;
  for (let k = 0; k < 6; k++) {
    const a = k * 1.9;
    const d = r * (0.4 + 0.3 * (k % 3)) * (1 + p);
    const rr = r * (0.28 + 0.1 * (k % 2)) * (1 - p * 0.6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, rr, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = SHEEN[k % SHEEN.length];
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

// A ring of foam blobs lying on the floor out to `r` (flattened into the ground), for the rings and
// waves that roll along it.
function foamBand(ctx, x, y, r, w, p, seed) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - p) * 0.9;
  const n = Math.max(6, Math.round(r / 10));
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + seed;
    const d = r + Math.sin(k * 3.1 + seed) * w * 0.3;
    const bx = x + Math.cos(a) * d;
    const by = y + Math.sin(a) * d * 0.22;
    const rr = w * (0.45 + 0.25 * Math.sin(k * 1.7));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(bx, by, Math.max(0.5, rr), Math.max(0.5, rr * 0.6), 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = SHEEN[k % SHEEN.length];
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}
const fadeIO = (f, a = 4, b = 2.5) => Math.max(0, Math.min(1, f.t * a, (f.dur - f.t) * b));
const grow3 = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;

export function drawBubbleFx(ctx, f, x, y, p, cam, time) {
  switch (f.kind) {
    case 'bbpopgiant':
      pop(ctx, x, y, p, 30, 16);
      suds(ctx, x, y, p, 22);
      return true;
    // Bubble Ride: the bubble she rides in, round her, bobbing; it pops at the end.
    case 'bbride': {
      const out = p > 0.82 ? (p - 0.82) / 0.18 : 0;
      if (out > 0) {
        pop(ctx, x, y - 26, out, 26, 12);
        return true;
      }
      film(ctx, x, y - 16 - 10 * grow3(p * 6), 26 * grow3(p * 6), time, 0, 0.85);
      return true;
    }
    // Foam Burst: a ring of foam bursting out over the floor to its reach, bubbles flung off it.
    case 'bbfoam': {
      const r = (f.r ?? 170) * grow3(p * 1.6);
      foamBand(ctx, x, y, r, 12 * (1 - p * 0.5), Math.max(0, p - 0.4) / 0.6, 0.4);
      foamBand(ctx, x, y, r * 0.65, 9, Math.max(0, p - 0.3) / 0.7, 1.7);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        film(ctx, x + Math.cos(a) * r * 0.9, y - 6 - 30 * p - Math.abs(Math.sin(a)) * 10, 4 + (k % 3), time + k, p, Math.max(0, 1 - p));
      }
      return true;
    }
    // Bubble Bath: a cloud of bubbles gathering overhead and drifting down over everyone near her.
    case 'bbbath': {
      const a = Math.max(0, Math.min(1, p * 4, (1 - p) * 3));
      for (let k = 0; k < 22; k++) {
        const sx = x + Math.sin(k * 2.39) * 110;
        const fall = Math.min(1, Math.max(0, p * 1.5 - (k % 5) * 0.08));
        const sy = y - 120 + fall * 110 + Math.sin(time * 2 + k) * 4;
        film(ctx, sx + Math.sin(time * 1.5 + k) * 5, sy, 3 + (k % 4) * 1.5, time + k, fall, a);
      }
      return true;
    }
    // Bubble Wrap: one big bubble closing over her (and the party round her), wobbling as it settles.
    case 'bbwrap': {
      const g = grow3(p * 3);
      const r = 44 * g * (1 + 0.08 * Math.sin(p * 30) * (1 - p));
      film(ctx, x, y - 22, r, time, p > 0.7 ? (p - 0.7) / 0.3 : 0, Math.max(0, Math.min(1, (1 - p) * 4)) * 0.8);
      return true;
    }
    // Bubble Storm's last splash: every bubble going at once in a wave of foam and spray.
    case 'bbsplash': {
      const r = (f.r ?? 210) * grow3(p * 1.4);
      foamBand(ctx, x, y, r, 18 * (1 - p * 0.4), Math.max(0, p - 0.3) / 0.7, 0.2);
      if (p < 0.5) pop(ctx, x, y - 40, p * 2, 60, 18);
      suds(ctx, x, y - 20, p, 30);
      return true;
    }
    // Guardian Bubble: a bubble round whoever she is mending, floating with them (world/idol.js
    // moves it), glints of healing rising inside it.
    case 'bbspot': {
      const fade = fadeIO(f);
      if (fade <= 0) return true;
      const r = (f.big ? 30 : 26) * (f.live ? 1.15 : 1) * grow3(f.t / 0.3);
      film(ctx, x, y - 22 + 2 * Math.sin(f.t * 3), r, time, 0, fade * 0.85);
      ctx.save();
      ctx.globalAlpha = fade;
      for (let k = 0; k < 4; k++) {
        const u = (f.t * 0.8 + k / 4) % 1;
        ctx.fillStyle = k % 2 ? '#c8ff9a' : '#fff1a0';
        ctx.fillRect(x + Math.sin(k * 2.3) * r * 0.5 - 1, y - 6 - u * r * 1.4, 2, 2);
      }
      ctx.restore();
      return true;
    }
    // Bubble Wave: a rolling crest of foam racing along the ground to the edge of its reach.
    case 'bbhype': {
      const roll = Math.max(0.01, f.dur - 0.35);
      const u = Math.min(1, f.t / roll);
      const fade = Math.min(1, f.t * 8, f.t < roll ? 1 : Math.max(0, (f.dur - f.t) / 0.35));
      if (fade <= 0) return true;
      const d = f.dir || 1;
      const cx = x + d * f.r * u;
      const h = (f.live ? 30 : 24) * (0.7 + 0.3 * Math.sin(f.t * 12));
      ctx.save();
      ctx.globalAlpha = fade;
      for (let k = 0; k < 7; k++) {
        const bx = cx - d * k * 5;
        const by = y - h * (1 - k / 8) + Math.sin(f.t * 10 + k) * 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, 7 - k * 0.6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = SHEEN[k % SHEEN.length];
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
      for (let k = 0; k < 3; k++) film(ctx, cx - d * (10 + k * 12), y - h - 8 - k * 6, 3 + k, time + k, 0, fade * 0.8);
      foamBand(ctx, cx - d * 14, y, 14, 7, 1 - fade, f.t);
      return true;
    }
    // A puff of bubbles bursting out round her.
    case 'bbring': {
      const n = f.big ? 10 : 6;
      const R = (f.big ? 40 : 26) * (f.scale ? f.scale / 0.45 : 1);
      const e = grow3(p * 1.5);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU;
        film(ctx, x + Math.cos(a) * R * e, y + Math.sin(a) * R * e * 0.6, 3 + (k % 3), time + k, p, Math.max(0, 1 - p));
      }
      return true;
    }
    case 'bbsparkle':
      pop(ctx, x, y - (f.h ?? 0) * 0.55, p, f.big ? 16 : 10, f.big ? 12 : 8);
      return true;
    // Lather Cloud: a fluffy cloud of lather drifting after the monsters (world/idol.js moves it).
    case 'bblather': {
      const fade = fadeIO(f, 3, 2);
      if (fade <= 0) return true;
      const r = (f.r ?? 70) * 0.55 * grow3(f.t / 0.3);
      const cy = y - 40 + 3 * Math.sin(f.t * 2.2);
      ctx.save();
      ctx.globalAlpha = fade * 0.95;
      for (let k = 0; k < 9; k++) {
        const a = k * 0.7 + f.t * 0.6;
        const bx = x + Math.cos(a) * r * (0.3 + 0.12 * (k % 3));
        const by = cy + Math.sin(a) * r * 0.25;
        const rr = Math.max(0.5, r * (0.32 + 0.08 * (k % 3)));
        // (Each puff of lather shaded: a soft blue underside, a bright top, a pastel rim.)
        const g = ctx.createRadialGradient(bx - rr * 0.3, by - rr * 0.4, rr * 0.1, bx, by, rr);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.7, '#eef4ff');
        g.addColorStop(1, '#c4d6f2');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, rr, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = SHEEN[k % SHEEN.length];
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
      for (let k = 0; k < 4; k++) film(ctx, x + Math.sin(f.t * 1.3 + k * 1.6) * r * 0.8, cy - r * 0.3 - ((f.t * 0.6 + k / 4) % 1) * 30, 2.5 + (k % 2), time + k, 0, fade);
      return true;
    }
    // Bubble Party: one enormous dome over everyone, bouncing with her, popping at the end.
    case 'bbdome': {
      const u = f.t / f.dur;
      const out = u > 0.88 ? (u - 0.88) / 0.12 : 0;
      const r = 120 * grow3(f.t / 0.5);
      if (out > 0.4) {
        pop(ctx, x, y - 50, (out - 0.4) / 0.6, r, 24);
        return true;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.62 + 0.04 * Math.sin(f.t * 8));
      film(ctx, 0, -r * 0.6, r, time, out * 2, 0.6);
      ctx.restore();
      return true;
    }
    // A bounce of the dome: a surge of foam racing out along the floor.
    case 'bbsurge': {
      const u = Math.min(1, f.t / f.dur);
      const go = 1 - (1 - u) ** 2;
      const d = f.dir || 1;
      foamBand(ctx, x + d * f.r * go, y + 26, 12, f.big ? 12 : 9, u, f.t);
      for (let k = 0; k < 3; k++) film(ctx, x + d * (f.r * go - k * 14), y + 10 - k * 8, 4 + k, time + k, u, Math.max(0, 1 - u));
      return true;
    }
    // A fountain of bubbles off the dome's edge on a bounce.
    case 'bbfount': {
      const e = grow3(p * 1.3);
      for (let k = 0; k < (f.big ? 12 : 8); k++) {
        const v = (k / 8 - 0.5) * 60;
        film(ctx, x + v * e, y - 70 * e + 50 * p * p - (k % 3) * 6, 3 + (k % 4), time + k, p, Math.max(0, 1 - p));
      }
      return true;
    }
    // Rebirth Bubble: the biggest, slowest bubble rising from her wand high over the fallen, then
    // bursting gently into a shower of small ones.
    case 'bbrevive': {
      const rise = grow3(Math.max(0, p - 0.3) / 0.35);
      const out = p > 0.62 ? (p - 0.62) / 0.38 : 0;
      const r = 36 * grow3(Math.max(0, p - 0.2) / 0.3);
      if (out > 0) {
        pop(ctx, x, y - 80, out, 36, 16);
        for (let k = 0; k < 12; k++) film(ctx, x + Math.sin(k * 2.4) * 140 * out, y - 80 + out * 70 + Math.cos(k) * 10, 2.5 + (k % 3), time + k, out, Math.max(0, 1 - out));
        return true;
      }
      film(ctx, x, y - 40 - 40 * rise, r, time, 0, 0.9);
      return true;
    }
    // Bubble Party's circle on the floor round her, out to the blasts' reach: a ring of bubbles
    // with foam along it, bubbles rising off it the whole time it lasts.
    case 'bbcircle': {
      const fade = fadeIO(f, 5, 3);
      if (fade <= 0) return true;
      const r = (f.r ?? 260) * grow3(f.t / 0.35);
      ctx.save();
      ctx.globalAlpha = fade;
      foamBand(ctx, x, y, r, 9, 0, 0.3);
      ctx.restore();
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU + f.t * 0.6;
        const rise = (f.t * 0.7 + k / 14) % 1;
        film(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.22 - rise * 90, 3 + (k % 3), time + k, rise, fade * (1 - rise));
      }
      return true;
    }
    // One of its blasts: a wave of foam and bubbles racing out to the circle's edge, and green-gold
    // sparkles of healing rising off everyone it washes over.
    case 'bbpulse': {
      const r = (f.r ?? 260) * grow3(p * 1.5);
      foamBand(ctx, x, y, r, f.big ? 14 : 11, Math.max(0, p - 0.3) / 0.7, p * 3);
      if (p < 0.4) pop(ctx, x, y - 40, p / 0.4, 50, 16);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p);
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU;
        const sx = x + Math.cos(a) * r * 0.8;
        const sy = y - 10 - p * 40 + Math.sin(a) * r * 0.18;
        ctx.fillStyle = k % 2 ? '#c8ff9a' : '#fff1a0';
        ctx.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
      }
      ctx.restore();
      return true;
    }
    case 'bbpop':
      pop(ctx, x, y, p, 7, 6);
      return true;
    case 'bbpopbig':
      pop(ctx, x, y, p, 15, 10);
      return true;
    case 'bbhit':
      suds(ctx, x, y - (f.h ?? 40) * 0.55, p, 7);
      return true;
    case 'bbhitbig':
      suds(ctx, x, y - (f.h ?? 40) * 0.55, p, 13);
      return true;
    // A puff of tiny bubbles off the wand's tip as she blows or flicks.
    case 'bbpuff': {
      const d = f.dir || 1;
      for (let k = 0; k < 5; k++) {
        const e = 1 - (1 - p) ** 2;
        const bx = x + d * (4 + e * (8 + k * 4));
        const by = y + Math.sin(k * 2.1) * 6 * e - e * 4;
        film(ctx, bx, by, (1.6 + (k % 3)) * (1 - p * 0.5), time + k, p, Math.max(0, 1 - p));
      }
      return true;
    }
    // A big bubble closed round a monster: it hangs in it, bobbing, until the trap runs out, then pops.
    case 'bbtrap': {
      const m = f.mob;
      const mx = m ? m.x - cam.x : x;
      const my = m ? m.y - (m.air ?? 0) - cam.y : y;
      const h = f.h ?? 40;
      const r = Math.max(18, h * 0.7) * (1 - (1 - Math.min(1, p * 6)) ** 3);
      const out = p > 0.85 ? (p - 0.85) / 0.15 : 0;
      if (out > 0.5) {
        pop(ctx, mx, my - h * 0.5, (out - 0.5) * 2, r, 12);
        return true;
      }
      film(ctx, mx, my - h * 0.5 + Math.sin(time * 4) * 2, r, time, out * 2, 0.9);
      return true;
    }
    // Mended: a few small bubbles rising round them, each with a green-gold glint inside.
    case 'bbhealed': {
      for (let k = 0; k < 6; k++) {
        const q = Math.min(1, Math.max(0, (p - k * 0.06) / 0.7));
        if (q <= 0) continue;
        const side = k % 2 ? 1 : -1;
        const bx = x + side * (8 + (k % 3) * 3) + Math.sin(q * 6 + k) * 2;
        const by = y - 6 - q * 36 - k * 2;
        film(ctx, bx, by, 2.4 + (k % 3), time + k, q, Math.max(0, 1 - q * q));
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - q);
        ctx.fillStyle = k % 2 ? '#c8ff9a' : '#fff1a0';
        ctx.fillRect(bx - 0.6, by - 0.6, 1.2, 1.2);
        ctx.restore();
      }
      return true;
    }
    default:
      return false;
  }
}
