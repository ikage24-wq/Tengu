// The Sulk's cast looks (2026-11-27, his fight rebuilt, world/skywhale.js): each telegraph drawn whole in his
// own soft storm-duvet style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN, through
// render/skylooks.js), while its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain
// flash as it lands (`hit`, u 0..1 over its hold). His shapes: puffy quilted cloud lumps in his duvet's blues
// (a light along the top, a shade along the bottom, outlined outside in a deeper blue of their own), pale trim,
// point-up raindrops, soft round pillows, slim rounded lightning curls, pastel rainbows and soft four-point
// sparkles (never specks, never a hard starburst). Raid-wide moments are a gentle tint, never a white flash.
//   sbWallop   Duvet Wallop (the tank's marker): the corner of his duvet hauled up over the tank, its shadow
//              darkening under them; landing, it flops down: a soft blue whump of cloud and a splash, "WHUMP!"
//   sbClouds   Sulky Clouds (a marker on each of you: spread): a sulky little raincloud sinking over each of
//              you, raining harder; landing, a splash of drops and a ripple
//   sbPile     Pillow Pile! (a stack): a big pillow tumbling down from above, a little pillow lighting for
//              each guest it needs; landing, it plops down soft: "FLUMP!"
//   sbTantrum  Thunder Tantrum (everyone): grumbling clouds rolling in over the deck, a gentle lilac tint;
//              landing, a soft rumble of rain and slim curls of lightning up in the clouds, "GRRRUMBLE!"
//   sbSob      Mood Swing, sad (a ring round him, its middle safe: get close): a curtain of rain round him
//              and a calm dry patch under his duvet; landing, the rain pours down
//   sbHuff     Mood Swing, cross (round him: get away): a little thundercloud gathering over him, the floor
//              round him lilac; landing, slim lightning curls down into it and puffs rolling out, "HMPH!"
//   sbPillow   Pillow Fight! (pillows bouncing out both ways, one spot after another): each spot's shadow
//              darkening as its pillow comes, the pillow arcing in; landing, a soft bounce and puffs
//   sbSun      Sunshower (everyone, his last phase): a soft warm tint, rain and a rainbow arching over the
//              deck; landing, the rain sparkles through it, "...sniff!"

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const CS = ['#b4c0ec', '#8693cf', '#6874b2', '#4c5890'];
const DARK = ['#a4aede', '#7480bc', '#5a66a2', '#3e4880'];
const INK = '#3e4880';
const TRIM = '#eef2ff';
const RAIN = ['#e6f6ff', '#bfe4ff', '#8ac4f0', '#5a8ec8'];
const BOLTC = ['#fff6c8', '#ffe27a', '#e8b84a'];
const RAINBOW = ['#ffb4c8', '#ffd2a8', '#fff0a8', '#c4f0c4', '#b4dcff', '#d4c4ff'];

function pen(ctx, c, w) {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
function floorRing(ctx, x, y, rx, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.26, 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function sparkle(ctx, x, y, r, al, col = '#fff6c8') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}
// A raindrop, point up, softly outlined.
function raindrop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.7);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 0.9, x + r, y - r * 0.3, x + r, y + r * 0.25);
  ctx.arc(x, y + r * 0.25, r, 0, Math.PI);
  ctx.bezierCurveTo(x - r, y - r * 0.3, x - r * 0.5, y - r * 0.9, x, y - r * 1.7);
  ctx.closePath();
  ctx.fillStyle = RAIN[1];
  ctx.fill();
  pen(ctx, RAIN[3], Math.max(0.5, r * 0.3));
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.1, r * 0.22, r * 0.4, -0.3, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A falling streak of rain.
function streak(ctx, x, y, len, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - len * 0.18, y + len);
  pen(ctx, RAIN[2], 1.6);
  ctx.stroke();
  pen(ctx, RAIN[0], 0.7);
  ctx.stroke();
  ctx.restore();
}
// A puffy cloud in his duvet's colours (dark: a cross thundercloud), the lumps merged into one shape
// outlined outside only, light along the top, shade along the bottom, a few raindrops printed on a big one.
function cloud(ctx, x, y, r, al, dark = false, print = false) {
  if (al <= 0.01 || r <= 0.3) return;
  const c = dark ? DARK : CS;
  const lumps = [[-0.66, 0.16, 0.48], [-0.22, -0.24, 0.62], [0.3, -0.16, 0.56], [0.72, 0.18, 0.42], [0.04, 0.26, 0.56]];
  const path = () => {
    ctx.beginPath();
    for (const [dx, dy, rr] of lumps) {
      ctx.moveTo(x + dx * r + rr * r, y + dy * r);
      ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
    }
  };
  ctx.save();
  ctx.globalAlpha *= al;
  path();
  pen(ctx, c[3], Math.max(0.9, r * 0.16));
  ctx.stroke();
  ctx.fillStyle = c[1];
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = c[2];
  ctx.beginPath();
  ctx.ellipse(x + r * 0.1, y + r * 0.64, r * 1.4, r * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c[0];
  ctx.beginPath();
  ctx.ellipse(x - r * 0.28, y - r * 0.52, r * 0.72, r * 0.3, -0.2, 0, TAU);
  ctx.fill();
  if (print && r > 6) {
    for (const [dx, dy] of [[-0.45, 0.05], [0.35, -0.05], [-0.05, 0.3]]) {
      ctx.beginPath();
      const px = x + dx * r;
      const py = y + dy * r;
      const s = r * 0.07;
      ctx.moveTo(px, py - s * 1.6);
      ctx.quadraticCurveTo(px + s, py, px, py + s);
      ctx.quadraticCurveTo(px - s, py, px, py - s * 1.6);
      ctx.fillStyle = dark ? '#5a66a2' : '#a8c8f4';
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.restore();
}
// A pillow: a soft quilted square with puffed corners, his duvet blue with a pale piped edge.
function pillow(ctx, x, y, s, rot, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const w = 9 * s;
  const h = 6.4 * s;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.7);
    ctx.quadraticCurveTo(-w * 1.12, -h * 1.12, -w * 0.7, -h);
    ctx.quadraticCurveTo(0, -h * 0.82, w * 0.7, -h);
    ctx.quadraticCurveTo(w * 1.12, -h * 1.12, w, -h * 0.7);
    ctx.quadraticCurveTo(w * 0.86, 0, w, h * 0.7);
    ctx.quadraticCurveTo(w * 1.12, h * 1.12, w * 0.7, h);
    ctx.quadraticCurveTo(0, h * 0.82, -w * 0.7, h);
    ctx.quadraticCurveTo(-w * 1.12, h * 1.12, -w, h * 0.7);
    ctx.quadraticCurveTo(-w * 0.86, 0, -w, -h * 0.7);
    ctx.closePath();
  };
  shape();
  pen(ctx, INK, Math.max(0.8, s * 1.1));
  ctx.stroke();
  ctx.fillStyle = CS[0];
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = CS[1];
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.75, w * 1.25, h * 0.5, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha *= 0.6;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-w * 0.35, -h * 0.45, w * 0.42, h * 0.2, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  shape();
  pen(ctx, TRIM, Math.max(0.5, s * 0.6));
  ctx.stroke();
  // the quilting: a soft stitch from corner to corner, a raindrop printed in the middle
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.5);
  ctx.quadraticCurveTo(0, -h * 0.1, w * 0.5, h * 0.5);
  pen(ctx, CS[2], Math.max(0.4, s * 0.4));
  ctx.setLineDash([s * 1.2, s * 1.2]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  raindrop(ctx, x + Math.cos(rot) * 2 * s, y + Math.sin(rot) * 2 * s, 1.3 * s, al);
}
// A slim rounded curl of lightning down from (x, y0) to (x, y1): soft gold, round ends.
function curl(ctx, x, y0, y1, seed, al, w = 2.2) {
  if (al <= 0.01) return;
  const pts = [[x, y0]];
  for (let i = 1; i < 5; i++) pts.push([x + (hash(seed + i) - 0.5) * 9, y0 + ((y1 - y0) * i) / 5]);
  pts.push([x + (hash(seed + 9) - 0.5) * 4, y1]);
  ctx.save();
  ctx.globalAlpha *= al;
  for (const [c, ww] of [[BOLTC[2], w + 1.4], [BOLTC[1], w], [BOLTC[0], w * 0.4]]) {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    pen(ctx, c, ww);
    ctx.stroke();
  }
  ctx.restore();
}
function word(ctx, text, x, y, size, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.36;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
function tint(ctx, col, al) {
  if (al <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.fillRect(-20, -20, 700, 420);
  ctx.restore();
}
function arcBow(ctx, x, y, r, k, al, bw) {
  if (k <= 0.01 || al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  for (const [i, c] of RAINBOW.entries()) {
    ctx.beginPath();
    ctx.arc(x, y, r - i * bw, Math.PI, Math.PI + Math.PI * sstep(k));
    pen(ctx, c, bw * 1.1);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Duvet Wallop ----------
function wallopWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  // the shadow of the duvet's corner darkening under the tank
  floorRing(ctx, x, y, r, `rgba(76,88,144,${0.12 + 0.25 * p})`, CS[3], 0.5 + 0.4 * p, 2);
  // the corner itself, hauled up over them: a big quilted lump with a pale trimmed edge, rising and
  // trembling as it builds
  const hy = y - 58 - 18 * ease(p) + Math.sin(time * 26) * 1.2 * p;
  cloud(ctx, x, hy, 20 + 6 * p, 0.35 + 0.55 * sstep(p * 1.6), false, true);
  ctx.save();
  ctx.globalAlpha *= 0.3 + 0.6 * sstep(p * 1.6);
  ctx.beginPath();
  ctx.moveTo(x - 22, hy + 12);
  ctx.quadraticCurveTo(x, hy + 20, x + 22, hy + 12);
  pen(ctx, TRIM, 4);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 4; i++) {
    const v = (time * 1.4 + i / 4) % 1;
    raindrop(ctx, x + (i - 1.5) * 10, hy + 18 + v * (y - hy - 18), 1.6, 0.8 * (1 - v) * p);
  }
}
function wallopHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI + (i / 5) * Math.PI;
    cloud(ctx, x + Math.cos(an) * (6 + e * 30), y - 10 + Math.sin(an) * (4 + e * 16), 7 + e * 5, fade);
  }
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI * 0.95 + (i / 5) * Math.PI * 0.9;
    raindrop(ctx, x + Math.cos(an) * (8 + e * 34), y - 14 + Math.sin(an) * (10 + e * 22) + e * e * 18, 1.8, fade);
  }
  if (u < 0.75) word(ctx, 'WHUMP!', x, y - 56 - e * 6, 13, INK, fade);
}

// ---------- Sulky Clouds ----------
function cloudsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(191,228,255,0.28)', RAIN[3], 0.4 + 0.5 * p);
  const cy = y - 86 + 30 * ease(p);
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.3 * p;
  ctx.beginPath();
  ctx.ellipse(x, y, r * (0.4 + 0.5 * p), r * 0.08 * (0.6 + p), 0, 0, TAU);
  ctx.fillStyle = '#6874b2';
  ctx.fill();
  ctx.restore();
  cloud(ctx, x + Math.sin(time * 1.3 + (z.x ?? 0) * 0.1) * 2, cy, 11 + 2 * p, sstep(p * 3), true);
  // its rain, thickening
  const n = 2 + Math.floor(p * 4);
  for (let i = 0; i < n; i++) {
    const v = (time * 2 + i / n + hash(i) * 0.3) % 1;
    streak(ctx, x - 12 + (i / Math.max(1, n - 1)) * 24, cy + 8 + v * (y - cy - 12), 6, 0.7 * Math.sin(Math.PI * v) * p);
  }
}
function cloudsHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI + 0.25 + (i / 6) * (Math.PI - 0.5);
    raindrop(ctx, x + Math.cos(an) * (4 + e * 24), y - 4 + Math.sin(an) * (4 + e * 18) + e * e * 12, 1.6, fade);
  }
  floorRing(ctx, x, y, 10 + e * 28, 'rgba(191,228,255,0.2)', RAIN[2], fade * 0.8, 1.4);
}

// ---------- Pillow Pile! ----------
function pileWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(212,196,255,0.3)', CS[3], 0.5 + 0.4 * p, 2.2);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.35 * p;
  ctx.beginPath();
  ctx.ellipse(x, y, r * (0.35 + 0.45 * p), r * 0.09, 0, 0, TAU);
  ctx.fillStyle = '#5a66a2';
  ctx.fill();
  ctx.restore();
  // the big pillow tumbling down from above, turning slowly
  const py = -40 + (y - 40 + 40) * ease(clamp((p - 0.15) / 0.85, 0, 1)) * 0.92;
  pillow(ctx, x, Math.min(y - 26, py), 2.4, Math.sin(time * 1.6) * 0.25 * (1 - p), sstep(p * 4));
  // a little pillow lighting for each guest it needs
  const need = z.need ?? 2;
  for (let i = 0; i < need; i++) {
    const on = clamp(p * need - i, 0.25, 1);
    pillow(ctx, x + (i - (need - 1) / 2) * 16, y - 60 - 40 * (1 - p), 0.6, 0, on);
  }
}
function pileHit(ctx, z, x, y, u, e, fade) {
  pillow(ctx, x, y - 14 - Math.sin(Math.PI * clamp(u * 2, 0, 1)) * 8, 2.4, 0, fade);
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI + (i / 5) * Math.PI;
    cloud(ctx, x + Math.cos(an) * (20 + e * 26), y - 4 + Math.sin(an) * (2 + e * 6), 4 + e * 3, fade * 0.9);
  }
  for (let i = 0; i < 5; i++) sparkle(ctx, x + (i - 2) * 14 * (0.5 + e), y - 36 - e * 14 - (i % 2) * 6, 3 * (1 - u), fade);
  if (u < 0.75) word(ctx, 'FLUMP!', x, y - 62 - e * 6, 13, INK, fade);
}

// ---------- Thunder Tantrum ----------
function tantrumWarn(ctx, z, x, y, p, time) {
  tint(ctx, '#b8b4e8', 0.04 + 0.07 * p);
  // grumbling clouds rolling in along the top of the deck
  for (let i = 0; i < 7; i++) {
    const cx = -30 + i * 110 + Math.sin(time * 0.8 + i) * 10;
    cloud(ctx, cx, 18 + (i % 2) * 14 - 30 * (1 - ease(p)), 26 + (i % 3) * 5, 0.5 + 0.4 * p, true);
  }
  // a soft flicker up in them now and then, more as it comes
  const seed = Math.floor(time * 5);
  if (hash(seed) < 0.25 + 0.5 * p) curl(ctx, 60 + hash(seed + 3) * 520, 26, 64 + hash(seed + 4) * 20, seed, 0.7 * p, 1.6);
}
function tantrumHit(ctx, z, x, y, u, e, fade) {
  tint(ctx, '#b0aae0', 0.11 * fade);
  for (let i = 0; i < 7; i++) cloud(ctx, -30 + i * 110, 18 + (i % 2) * 14, 28 + (i % 3) * 5, 0.85 * fade, true);
  for (let i = 0; i < 4; i++) curl(ctx, 70 + i * 160 + hash(i) * 40, 30, 90 + hash(i + 3) * 40, i * 7, fade * (u < 0.5 ? 1 : 0.6));
  for (let i = 0; i < 26; i++) {
    const v = (e * 1.6 + hash(i)) % 1;
    streak(ctx, 10 + hash(i + 40) * 640, 30 + v * 300, 12, 0.7 * fade);
  }
  if (u < 0.8) word(ctx, 'GRRRUMBLE!', 320, 104 - e * 6, 16, INK, fade);
}

// ---------- Mood Swing: sad (get close) ----------
function sobWarn(ctx, z, x, y, p, time) {
  const R = z.w / 2;
  const r0 = z.inner;
  // the curtain of rain round him: both sides of the ring, soft blue on the floor
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.22 * p;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(d < 0 ? x - R : x + r0, y - 26, R - r0, 28, 10);
    ctx.fillStyle = '#9ec6f0';
    ctx.fill();
  }
  ctx.restore();
  for (const d of [-1, 1]) {
    const n = Math.max(2, Math.floor((R - r0) / 26));
    for (let i = 0; i < n; i++) {
      const v = (time * (1.2 + p) + i * 0.37 + (d > 0 ? 0.5 : 0)) % 1;
      const sx = x + d * (r0 + 10 + ((i + 0.5) / n) * (R - r0 - 20));
      streak(ctx, sx, y - 90 + v * 80, 10, (0.3 + 0.6 * p) * Math.sin(Math.PI * v));
    }
  }
  // the dry patch right by him: calm and pale, his duvet's hem keeping it dry
  floorRing(ctx, x, y, r0 - 4, 'rgba(255,252,236,0.5)', '#e8d08a', 0.5 + 0.4 * p, 1.6);
  for (let i = 0; i < 2; i++) sparkle(ctx, x + (i ? 1 : -1) * r0 * 0.5, y - 10 - i * 4 + Math.sin(time * 3 + i) * 2, 2.4, 0.6 * p);
}
function sobHit(ctx, z, x, y, u, e, fade) {
  const R = z.w / 2;
  const r0 = z.inner;
  for (const d of [-1, 1]) {
    const n = Math.max(3, Math.floor((R - r0) / 20));
    for (let i = 0; i < n; i++) {
      const sx = x + d * (r0 + ((i + 0.5) / n) * (R - r0));
      for (let k = 0; k < 2; k++) raindrop(ctx, sx + (k ? 5 : -5) + d * e * 6, y - 6 - Math.sin(Math.PI * clamp(e + k * 0.2, 0, 1)) * 14, 1.5, fade * 0.9);
      floorRing(ctx, sx, y, 6 + e * 10, 'rgba(191,228,255,0.15)', RAIN[2], fade * 0.6, 1);
    }
  }
}

// ---------- Mood Swing: cross (get away) ----------
function huffWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, `rgba(150,140,210,${0.16 + 0.2 * p})`, DARK[3], 0.5 + 0.4 * p, 2);
  // the thundercloud gathering over him
  cloud(ctx, x, y - 150 + 10 * ease(p), 30 + 10 * p, 0.3 + 0.6 * sstep(p * 2), true, true);
  for (let i = 0; i < 4; i++) {
    const an = (i / 4) * TAU + time * 1.2;
    cloud(ctx, x + Math.cos(an) * r * 0.75, y - 128 + Math.sin(an) * 8, 12, 0.3 + 0.5 * p, true);
  }
  const seed = Math.floor(time * 6);
  if (p > 0.4 && hash(seed) < p * 0.6) curl(ctx, x + (hash(seed + 1) - 0.5) * r, y - 130, y - 100, seed, 0.6, 1.4);
}
function huffHit(ctx, z, x, y, u, e, fade) {
  const r = z.w / 2;
  cloud(ctx, x, y - 140, 40, fade, true, true);
  for (let i = 0; i < 3; i++) curl(ctx, x + (i - 1) * r * 0.5, y - 124, y - 6, i * 11 + 3, fade * (u < 0.4 ? 1 : 0.5), 2.4);
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU;
    cloud(ctx, x + Math.cos(an) * r * (0.3 + 0.75 * e), y - 6 + Math.sin(an) * r * 0.2 * (0.3 + 0.75 * e), 6 + e * 3, 0.85 * fade, true);
  }
  if (u < 0.7) word(ctx, 'HMPH!', x, y - 92 - e * 6, 14, INK, fade);
}

// ---------- Pillow Fight! ----------
function pillowWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  // each spot's shadow darkening as its pillow comes (the next to land always the darkest)
  floorRing(ctx, x, y, r, `rgba(76,88,144,${0.06 + 0.32 * p * p})`, CS[3], 0.25 + 0.7 * p * p, 1.6);
  const left = z.warn - z.t;
  if (left < 0.7) {
    // the pillow arcing in from the bounce before it
    const v = 1 - left / 0.7;
    const d = z.dir ?? 1;
    const px = x - d * 70 * (1 - v);
    const py = y - 20 - Math.sin(Math.PI * (0.5 + 0.5 * v)) * 60;
    pillow(ctx, px, py, 1.5, d * v * 1.2, sstep(v * 4));
  }
}
function pillowHit(ctx, z, x, y, u, e, fade) {
  const d = z.dir ?? 1;
  pillow(ctx, x + d * e * 12, y - 12 - Math.sin(Math.PI * clamp(u * 1.4, 0, 1)) * 16, 1.5, d * (1 + u), fade);
  for (let i = 0; i < 4; i++) {
    const an = -Math.PI + (i / 3) * Math.PI;
    cloud(ctx, x + Math.cos(an) * (10 + e * 18), y - 3 + Math.sin(an) * (2 + e * 4), 3.6 + e * 2.4, 0.85 * fade);
  }
  sparkle(ctx, x - d * 6, y - 28 - e * 10, 3 * (1 - u), fade);
}

// ---------- Sunshower ----------
function sunWarn(ctx, z, x, y, p, time) {
  tint(ctx, '#ffd8e4', 0.04 + 0.06 * p);
  for (let i = 0; i < 16; i++) {
    const v = (time * 1.1 + hash(i)) % 1;
    streak(ctx, 20 + hash(i + 20) * 600, 20 + v * 300, 10, (0.2 + 0.4 * p) * Math.sin(Math.PI * v));
  }
  arcBow(ctx, 320, 330, 300, p, 0.55, 9);
}
function sunHit(ctx, z, x, y, u, e, fade) {
  tint(ctx, '#ffe2ec', 0.09 * fade);
  arcBow(ctx, 320, 330, 300, 1, 0.65 * fade, 9);
  for (let i = 0; i < 22; i++) {
    const v = (e * 1.4 + hash(i)) % 1;
    const sx = 10 + hash(i + 50) * 620;
    if (i % 2) sparkle(ctx, sx, 30 + v * 280, 3 * (1 - u * 0.6), 0.9 * fade, i % 4 === 1 ? '#fff6c8' : '#ffd2e0');
    else streak(ctx, sx, 30 + v * 280, 10, 0.6 * fade);
  }
  if (u < 0.8) word(ctx, '...sniff!', 320, 96 - e * 6, 15, INK, fade);
}

export const SULK_FX = {
  sbWallop: { warn: wallopWarn, hit: wallopHit },
  sbClouds: { warn: cloudsWarn, hit: cloudsHit },
  sbPile: { warn: pileWarn, hit: pileHit },
  sbTantrum: { warn: tantrumWarn, hit: tantrumHit },
  sbSob: { warn: sobWarn, hit: sobHit },
  sbHuff: { warn: huffWarn, hit: huffHit },
  sbPillow: { warn: pillowWarn, hit: pillowHit },
  sbSun: { warn: sunWarn, hit: sunHit },
};
// How long each landing plays (s), for world/bossfight.js LOOK_HOLD.
export const SULK_HOLD = { sbWallop: 0.8, sbClouds: 0.6, sbPile: 0.9, sbTantrum: 1, sbSob: 0.8, sbHuff: 0.8, sbPillow: 0.6, sbSun: 1.1 };
export const SULK_OWN_WARN = Object.keys(SULK_FX);
