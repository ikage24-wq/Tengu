// A little picture of each race stage, for the race board (ui/mochi-race.js). The board used to
// list all seven stages as nothing but a name and a line of text; this gives each one a window on
// to its course, drawn from the same shapes the course itself is built from (render/courseart.js):
// the blossom meadow, the lily lake, the sandstone walls, the cloud sea, the sweets hills, the
// festival at dusk and the royal road at sunset.
//
// A card is only 86 by 48, so each one is built the way a painting is: a sky that says the hour,
// two or three bands of land with a lit crest on each so they sit one behind the other, one big
// thing with a silhouette you could name in the dark, and smaller things in front of it. No two
// cards share a palette, and every one has something that moves - petals, the light on the water,
// a swinging lantern - so the board is never quite still.

import { roundRect } from './kit.js';

// ---------- The shapes the cards share ----------
// A vertical wash: the quickest way to give a card its hour of the day.
const grad = (ctx, x, y, w, h, top, bot, mid) => {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  if (mid) g.addColorStop(0.55, mid);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
};
const blob = (ctx, cx, cy, rx, ry, c) => {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};
// The sun or the moon: a disc with its light falling away around it. `glow` is the light's colour
// as plain numbers, so the far edge of it can be the same colour at nothing.
function sun(ctx, cx, cy, r, core, glow, a) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 3);
  g.addColorStop(0, `rgba(${glow},${a})`);
  g.addColorStop(0.45, `rgba(${glow},${a * 0.4})`);
  g.addColorStop(1, `rgba(${glow},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 3, r * 3, 0, 0, Math.PI * 2);
  ctx.fill();
  blob(ctx, cx, cy, r, r, core);
}
// Rolling land. Filled to the foot of the card, with a lit strip along the crest so each band
// reads as standing in front of the one behind it. Gives back the height of its crest anywhere.
const wave = (sx, f, phase) => Math.sin(sx * f + phase) * 0.6 + Math.sin(sx * f * 2.7 + phase * 1.7) * 0.4;
function band(ctx, x, y, w, h, amp, f, c, phase = 0, rim = null) {
  const pts = [];
  for (let sx = 0; sx <= w + 3; sx += 3) pts.push([x + sx, y - amp * wave(sx, f, phase)]);
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], y + h);
  for (const [px, py] of pts) ctx.lineTo(px, py);
  ctx.lineTo(pts[pts.length - 1][0], y + h);
  ctx.fill();
  if (rim) {
    ctx.fillStyle = rim;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 2.2);
    ctx.fill();
  }
  return (sx) => y - amp * wave(sx, f, phase);
}
// A round tree: a trunk, three puffs with one tucked in behind, and the light on the top one.
function puffTree(ctx, cx, gy, r, trunk, body, top, shade) {
  ctx.fillStyle = trunk;
  ctx.fillRect(cx - r * 0.15, gy - r * 1.5, r * 0.3, r * 1.5);
  blob(ctx, cx + r * 0.52, gy - r * 1.3, r * 0.68, r * 0.6, shade ?? body);
  blob(ctx, cx - r * 0.55, gy - r * 1.5, r * 0.78, r * 0.7, body);
  blob(ctx, cx + r * 0.3, gy - r * 1.8, r * 0.72, r * 0.66, body);
  blob(ctx, cx - r * 0.08, gy - r * 2.05, r * 0.8, r * 0.74, top);
}
// A roof with its eaves swept up: the one shape that says this place more than any other. Drawn
// from the line the eaves sit on, so a tier of a castle or a tower is three numbers.
function roof(ctx, cx, by, half, rise, c, lit) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(cx - half, by);
  ctx.quadraticCurveTo(cx - half * 0.3, by - rise * 0.45, cx, by - rise);
  ctx.quadraticCurveTo(cx + half * 0.3, by - rise * 0.45, cx + half, by);
  ctx.quadraticCurveTo(cx, by + rise * 0.3, cx - half, by);
  ctx.fill();
  if (lit) {
    ctx.fillStyle = lit;
    ctx.beginPath();
    ctx.moveTo(cx - half, by - 0.6);
    ctx.quadraticCurveTo(cx - half * 0.3, by - rise * 0.45 - 0.8, cx, by - rise);
    ctx.quadraticCurveTo(cx - half * 0.34, by - rise * 0.4, cx - half + 0.6, by + 0.8);
    ctx.fill();
  }
}
// Cream poured along a crest and running down it here and there.
function icing(ctx, x, w, crest, c, every, drop) {
  ctx.fillStyle = c;
  ctx.beginPath();
  for (let sx = 0; sx <= w; sx += 3) ctx.lineTo(x + sx, crest(sx) - 1.2);
  for (let sx = w; sx >= 0; sx -= 3) ctx.lineTo(x + sx, crest(sx) + 2.4);
  ctx.fill();
  for (let sx = 5; sx < w - 2; sx += every) {
    const d = drop * (0.45 + (Math.sin(sx * 2.3) * 0.5 + 0.5) * 0.9);
    ctx.beginPath();
    ctx.moveTo(x + sx - 1.9, crest(sx) + 1);
    ctx.lineTo(x + sx + 1.9, crest(sx) + 1);
    ctx.lineTo(x + sx + 1.9, crest(sx) + d);
    ctx.arc(x + sx, crest(sx) + d, 1.9, 0, Math.PI);
    ctx.fill();
  }
}
// Little flecks drifting across a card (petals, dust, sugar), looping on their own.
function drift(ctx, x, y, w, h, t, c, n = 7, speed = 5, size = 1) {
  ctx.fillStyle = c;
  for (let i = 0; i < n; i++) {
    const seed = i * 1.7;
    const fx = x + (((seed * 37 + t * speed) % (w + 10)) + w + 10) % (w + 10) - 5;
    const fy = y + ((seed * 23 + t * speed * 0.6) % h);
    ctx.fillRect(Math.round(fx), Math.round(fy + Math.sin(t * 2 + seed) * 1.2), size, size);
  }
}

// ---------- The seven ----------
const CARDS = {
  // Sakura Sprint: a track worn down a blossom meadow, out from under the torii it starts at.
  sprint(ctx, x, y, w, h, t) {
    grad(ctx, x, y, w, h, '#a4d2f4', '#ffe8dc', '#d6ecf8');
    sun(ctx, x + w - 15, y + 10, 4.4, '#fff8d0', '255,246,196', 0.42);
    // The far ridge, with a hedge of blossom all along the top of it.
    const far = band(ctx, x, y + h * 0.5, w, h, 3.4, 0.05, '#9cc4cc', 1.2, '#bcdfdd');
    for (let i = 0; i < 12; i++) {
      const u = -3 + i * 8.4;
      const r = 3.2 + ((i * 7) % 4) * 0.8;
      const lift = ((i * 5) % 3) * 1.2;
      blob(ctx, x + u, far(u) - 0.4 - lift, r, r * 0.74, '#e3a8bf');
      blob(ctx, x + u - r * 0.3, far(u) - 1.5 - lift, r * 0.64, r * 0.48, '#f6c8d8');
    }
    // The meadow, in two steps down to the near grass.
    const mid = band(ctx, x, y + h * 0.66, w, h, 2.8, 0.075, '#84c083', 2.4, '#abd89b');
    const gy = band(ctx, x, y + h * 0.88, w, h, 2.2, 0.1, '#63ab66', 0.4, '#8ccd88');
    // The track they run, worn pale into the grass and narrowing away.
    ctx.fillStyle = '#e9d9b2';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h);
    ctx.lineTo(x + w * 0.86, y + h);
    ctx.lineTo(x + w * 0.62, mid(w * 0.62) + 1.5);
    ctx.lineTo(x + w * 0.52, mid(w * 0.52) + 1.5);
    ctx.fill();
    ctx.fillStyle = '#f6ecd0';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h);
    ctx.lineTo(x + w * 0.44, y + h);
    ctx.lineTo(x + w * 0.55, mid(w * 0.55) + 1.5);
    ctx.lineTo(x + w * 0.52, mid(w * 0.52) + 1.5);
    ctx.fill();
    // The blossom either side of it.
    puffTree(ctx, x + w * 0.76, mid(w * 0.76) + 2, 5.4, '#9a7462', '#ff9fbe', '#ffd4e4', '#e97fa4');
    puffTree(ctx, x + w * 0.46, gy(w * 0.46) + 2, 4.2, '#9a7462', '#ffafc9', '#ffdfeb', '#f093b2');
    // The torii the course starts under, right up against the near edge.
    const tx = x + 17;
    const ty = y + h - 1;
    const P = 22;
    blob(ctx, tx - 7, ty - 0.5, 5, 1.5, 'rgba(40,90,50,0.22)');
    blob(ctx, tx + 7.4, ty - 2.5, 4.4, 1.3, 'rgba(40,90,50,0.22)');
    ctx.fillStyle = '#a6304a';
    ctx.fillRect(tx + 5.6, ty - P + 2, 3.4, P - 4);
    ctx.fillRect(tx - 11, ty - P + 6.5, 21, 2.4);
    ctx.fillStyle = '#c93b54';
    ctx.fillRect(tx - 9, ty - P, 3.8, P);
    ctx.beginPath();
    ctx.moveTo(tx - 14, ty - P - 1.4);
    ctx.quadraticCurveTo(tx - 0.3, ty - P + 3.2, tx + 13.5, ty - P - 1.4);
    ctx.lineTo(tx + 13.5, ty - P - 4.6);
    ctx.quadraticCurveTo(tx - 0.3, ty - P, tx - 14, ty - P - 4.6);
    ctx.fill();
    ctx.fillStyle = '#e8748a';
    ctx.fillRect(tx - 9, ty - P, 1.3, P);
    ctx.fillRect(tx + 5.6, ty - P + 2, 1.1, P - 4);
    ctx.fillStyle = '#f4e6cc';
    ctx.fillRect(tx - 3, ty - P + 1.6, 5.2, 4.4);
    drift(ctx, x, y, w, h, t, '#ffd2e2', 10, 6);
  },
  // Lily Lake Swim: the lake taking most of the card, the jetty they go in from on the left.
  swim(ctx, x, y, w, h, t) {
    const shore = y + h * 0.42;
    grad(ctx, x, y, w, h * 0.5, '#a8dcf8', '#eaf7fb');
    // The far bank, and the line of trees along it.
    band(ctx, x, shore - 2, w, 12, 2.2, 0.05, '#79a98a', 0.8, '#99c49c');
    for (let i = 0; i < 13; i++) {
      const u = 1 + i * 7.2;
      const r = 2.3 + ((i * 5) % 4) * 0.85;
      blob(ctx, x + u, shore - 3.4 - ((i * 3) % 4) * 1.1, r, r * (1.2 - (i % 3) * 0.16), i % 2 ? '#5b8f6c' : '#6b9f7a');
    }
    // The water, deeper as it comes forward.
    const g = ctx.createLinearGradient(0, shore, 0, y + h);
    g.addColorStop(0, '#62b8d6');
    g.addColorStop(0.3, '#3d93bd');
    g.addColorStop(1, '#17537f');
    ctx.fillStyle = g;
    ctx.fillRect(x, shore, w, y + h - shore);
    // What the bank throws back on to it, wobbling.
    ctx.fillStyle = 'rgba(32,96,84,0.4)';
    for (let i = 0; i < 13; i++) ctx.fillRect(x + i * 7.2 - 1, shore, 4, 2.6 + Math.sin(t * 1.6 + i) * 1.1);
    // The light lying across the surface in long bands.
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 5; i++) ctx.fillRect(x, shore + 4 + i * 5.6 + Math.sin(t * 0.7 + i) * 0.7, w, 1.4);
    // The jetty they start from.
    ctx.fillStyle = '#6b4a2e';
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 3 + i * 10, shore + 6, 2.4, 7);
    ctx.fillStyle = '#8a6240';
    ctx.beginPath();
    ctx.moveTo(x - 2, shore + 2.5);
    ctx.lineTo(x + 29, shore + 5);
    ctx.lineTo(x + 29, shore + 9);
    ctx.lineTo(x - 2, shore + 8);
    ctx.fill();
    ctx.fillStyle = '#b5885c';
    ctx.beginPath();
    ctx.moveTo(x - 2, shore + 2.5);
    ctx.lineTo(x + 29, shore + 5);
    ctx.lineTo(x + 29, shore + 6.4);
    ctx.lineTo(x - 2, shore + 4.4);
    ctx.fill();
    // The pads, bigger as they come forward, one or two of them in flower.
    [[0.5, 0.62, 3.2], [0.76, 0.7, 3.8], [0.42, 0.8, 4.6], [0.88, 0.86, 5], [0.62, 0.97, 6]].forEach(([u, v, r], i) => {
      const px = x + w * u;
      const py = y + h * v + Math.sin(t * 1.1 + i) * 0.5;
      blob(ctx, px, py + 1.2, r, r * 0.46, 'rgba(8,44,74,0.35)');
      blob(ctx, px, py, r, r * 0.5, '#3d8d56');
      blob(ctx, px - r * 0.18, py - r * 0.12, r * 0.7, r * 0.28, '#63b872');
      ctx.fillStyle = '#2a79a8';
      ctx.beginPath();
      ctx.moveTo(px + r, py - 0.3);
      ctx.lineTo(px + r * 0.25, py + 0.2);
      ctx.lineTo(px + r, py + 1.5);
      ctx.fill();
      if (i % 2) {
        blob(ctx, px + r * 0.45, py - r * 0.45, 1.7, 1.4, '#ffd7e6');
        blob(ctx, px + r * 0.45, py - r * 0.6, 0.8, 0.7, '#ffee9c');
      }
    });
    // Rings going out where something went in.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.45 + i * 0.34) % 1;
      ctx.globalAlpha = (1 - k) * 0.55;
      ctx.beginPath();
      ctx.ellipse(x + w * (0.28 + i * 0.26), y + h * (0.74 + (i % 2) * 0.12), 2 + k * 8, (2 + k * 8) * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  // Mortar Cliff Climb: the three walls, stepping up and away, each with its route up it.
  climb(ctx, x, y, w, h, t) {
    grad(ctx, x, y, w, h, '#ffc48c', '#fff0dc', '#ffdcb0');
    sun(ctx, x + 12, y + 10, 4.2, '#fff4cc', '255,226,166', 0.5);
    band(ctx, x, y + h * 0.44, w, h, 4, 0.045, '#d8a07a', 2.4, '#ecbb93');
    band(ctx, x, y + h * 0.9, w, h, 1.8, 0.1, '#b4744a', 0.6, '#cf9263');
    // Back to front, so they step up and away to the right.
    [[0.6, 0.27, 0.54], [0.32, 0.5, 0.78], [-0.02, 0.72, 1.04]].forEach(([u, top, bot]) => {
      const bx = x + w * u;
      const by = y + h * top;
      const bw = w * 0.46;
      ctx.fillStyle = '#c98a5c';
      ctx.fillRect(bx, by, bw, y + h - by);
      ctx.fillStyle = '#e4a974';
      ctx.fillRect(bx, by, bw * 0.4, y + h - by);
      ctx.fillStyle = 'rgba(122,70,38,0.22)';
      for (let r = 1; r < 6; r++) ctx.fillRect(bx, by + 2 + r * 6, bw, 1);
      ctx.fillStyle = '#8f5a36';
      ctx.fillRect(bx, by, bw, 1.8);
      ctx.fillStyle = '#93c66e';
      ctx.fillRect(bx - 1.6, by - 3.6, bw + 3.2, 3.8);
      ctx.fillStyle = '#bde492';
      ctx.fillRect(bx - 1.6, by - 3.6, bw + 3.2, 1.4);
      // The holds, set out as a route to climb and not as spots.
      const vis = h * (bot - top);
      ['#ff7ba2', '#6fc8ff', '#ffd05c', '#8fe09c'].forEach((c, i) => {
        const k = ((i + 1) / 5) * vis;
        if (k > vis - 4) return;
        blob(ctx, bx + bw * (0.26 + (i % 2) * 0.44), by + 3 + k, 1.7, 1.7, c);
      });
    });
    // The pennant they come over the top to.
    const px = x + w * 0.88;
    const py = y + h * 0.27 - 3.6;
    ctx.fillStyle = '#9a7a56';
    ctx.fillRect(px, py - 9, 1.3, 9);
    ctx.fillStyle = '#ff8fb0';
    ctx.beginPath();
    ctx.moveTo(px + 1.3, py - 9);
    ctx.lineTo(px + 7.4 + Math.sin(t * 2.4) * 1.2, py - 6.8);
    ctx.lineTo(px + 1.3, py - 4.6);
    ctx.fill();
    // Maples at the foot of it all.
    puffTree(ctx, x + 8, y + h + 1, 5.6, '#8a6246', '#e8783c', '#ffb061', '#c75e34');
    puffTree(ctx, x + 23, y + h + 2, 4, '#8a6246', '#d8603c', '#f2905c', '#b8482e');
    drift(ctx, x, y, w, h, t, 'rgba(255,208,150,0.5)', 6, 4);
  },
  // Cloud Glide: off the cliff at the left and out over the cloud sea, with the line the glide
  // takes drawn across it.
  glide(ctx, x, y, w, h, t) {
    grad(ctx, x, y, w, h, '#4e8ed2', '#ffe0ac', '#a0c8ec');
    sun(ctx, x + w - 16, y + h * 0.52, 4.6, '#fff6d4', '255,236,176', 0.5);
    // Peaks away under the sun, only their tops out of the cloud.
    [[0.44, 16], [0.6, 11], [0.78, 19], [0.95, 13]].forEach(([u, ph]) => {
      const pk = x + w * u;
      const base = y + h * 0.68;
      ctx.fillStyle = '#7890b8';
      ctx.beginPath();
      ctx.moveTo(pk - ph * 0.85, base);
      ctx.lineTo(pk, base - ph);
      ctx.lineTo(pk + ph * 0.85, base);
      ctx.fill();
      ctx.fillStyle = '#e4eefa';
      ctx.beginPath();
      ctx.moveTo(pk - ph * 0.26, base - ph * 0.68);
      ctx.lineTo(pk, base - ph);
      ctx.lineTo(pk + ph * 0.26, base - ph * 0.68);
      ctx.fill();
    });
    // The cloud sea: three banks, each drifting at its own speed.
    [[0.64, '#bed3ee', 0.006, 8], [0.78, '#dbe8f8', 0.009, 10], [0.92, '#f4faff', 0.013, 13]].forEach(([v, c, sp, r]) => {
      const cy = y + h * v;
      ctx.fillStyle = c;
      ctx.fillRect(x, cy, w, y + h - cy);
      for (let i = -1; i < 7; i++) {
        const u = ((((i * 0.17 + t * sp) % 1) + 1) % 1) * (w + 2 * r) - r;
        blob(ctx, x + u, cy, r, r * 0.46, c);
        blob(ctx, x + u + r * 0.6, cy + 0.4, r * 0.62, r * 0.3, c);
      }
    });
    // The cliff they leave from, and the ramp out over the drop.
    ctx.fillStyle = '#6b5c78';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h * 0.36);
    ctx.lineTo(x + w * 0.19, y + h * 0.38);
    ctx.lineTo(x + w * 0.22, y + h * 0.54);
    ctx.lineTo(x + w * 0.28, y + h * 0.58);
    ctx.lineTo(x + w * 0.31, y + h);
    ctx.lineTo(x - 2, y + h);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let r = 0; r < 4; r++) ctx.fillRect(x - 2, y + h * 0.46 + r * 6, w * 0.27, 1.4);
    ctx.fillStyle = '#8d7c99';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.19, y + h * 0.38);
    ctx.lineTo(x + w * 0.22, y + h * 0.54);
    ctx.lineTo(x + w * 0.28, y + h * 0.58);
    ctx.lineTo(x + w * 0.31, y + h);
    ctx.lineTo(x + w * 0.275, y + h);
    ctx.lineTo(x + w * 0.245, y + h * 0.58);
    ctx.lineTo(x + w * 0.185, y + h * 0.54);
    ctx.lineTo(x + w * 0.158, y + h * 0.38);
    ctx.fill();
    ctx.fillStyle = '#6cc07c';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h * 0.36 - 3);
    ctx.lineTo(x + w * 0.19, y + h * 0.38 - 3);
    ctx.lineTo(x + w * 0.19, y + h * 0.38 + 0.6);
    ctx.lineTo(x - 2, y + h * 0.36 + 0.6);
    ctx.fill();
    ctx.fillStyle = '#a2e09a';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h * 0.36 - 3);
    ctx.lineTo(x + w * 0.19, y + h * 0.38 - 3);
    ctx.lineTo(x + w * 0.19, y + h * 0.38 - 1.6);
    ctx.lineTo(x - 2, y + h * 0.36 - 1.6);
    ctx.fill();
    const rx = x + w * 0.1;
    const ry = y + h * 0.37 - 2;
    ctx.fillStyle = '#8a6240';
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(x + w * 0.4, y + h * 0.25);
    ctx.lineTo(x + w * 0.4, y + h * 0.3);
    ctx.lineTo(rx, ry + 3.4);
    ctx.fill();
    ctx.fillStyle = '#c69a68';
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(x + w * 0.4, y + h * 0.25);
    ctx.lineTo(x + w * 0.4, y + h * 0.27);
    ctx.lineTo(rx, ry + 1.4);
    ctx.fill();
    // The rail along it: every post stands on the planks, which rise as they go out.
    const sl = (ry - (y + h * 0.25)) / (w * 0.3);
    ctx.fillStyle = '#6b4a2e';
    for (let i = 0; i < 4; i++) {
      const fx = rx + 4 + i * 7;
      ctx.fillRect(fx, ry - (fx - rx) * sl - 3.8, 1.2, 4.6);
    }
    ctx.beginPath();
    ctx.moveTo(rx + 4, ry - 4 * sl - 4);
    ctx.lineTo(rx + 26, ry - 26 * sl - 4);
    ctx.lineTo(rx + 26, ry - 26 * sl - 2.9);
    ctx.lineTo(rx + 4, ry - 4 * sl - 2.9);
    ctx.fill();
    // The line the glide takes, falling away to the right.
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) {
      const k = i / 9;
      ctx.globalAlpha = 0.8 - k * 0.72;
      ctx.fillRect(x + w * (0.42 + k * 0.56), y + h * (0.24 + k * k * 0.42), 2.4, 1.2);
    }
    ctx.globalAlpha = 1;
  },
  // Long Hill Run: hill behind hill behind hill, iced and running with cream.
  hills(ctx, x, y, w, h, t) {
    grad(ctx, x, y, w, h, '#ffb6d2', '#fff2e2', '#ffd8dc');
    sun(ctx, x + w * 0.22, y + 10, 4.6, '#fff2c0', '255,226,168', 0.45);
    const cols = ['#ff7ba2', '#6fc8ff', '#8fe09c', '#ffd05c', '#c0a0f0'];
    const sprinkle = (crest, every, k) => {
      for (let sx = 6 + k * 3; sx < w - 3; sx += every) {
        ctx.fillStyle = cols[(sx + k) % 5];
        ctx.fillRect(x + sx, crest(sx) + 0.3 + (sx % 2) * 1.2, 2.8, 1.3);
      }
    };
    // A marker standing on its own hill, smaller the further back that hill is.
    const marker = (crest, u, k, i) => {
      const mx = x + w * u;
      const my = crest(w * u) + 1.6;
      ctx.fillStyle = '#b4788e';
      ctx.fillRect(mx, my - 11 * k, 1 * k + 0.4, 11 * k);
      ctx.fillStyle = i % 2 ? '#fff4f8' : '#ff7ba2';
      ctx.fillRect(mx + 1 * k, my - 11 * k, 5 * k, 3.4 * k);
    };
    // Hill behind hill behind hill, each iced and flagged before the next comes in front of it.
    const h1 = band(ctx, x, y + h * 0.44, w, h, 4.6, 0.04, '#f2abc8', 3.1);
    icing(ctx, x, w, h1, '#fff2e8', 22, 2.2);
    marker(h1, 0.3, 0.46, 0);
    const h2 = band(ctx, x, y + h * 0.66, w, h, 5.4, 0.055, '#dd6f93', 1.4);
    icing(ctx, x, w, h2, '#fff6ea', 14, 4.4);
    sprinkle(h2, 22, 1);
    marker(h2, 0.56, 0.72, 3);
    // A skewer of dango planted on the middle hill, to say how far there still is to go.
    const dx = x + w * 0.8;
    const dy = h2(w * 0.8) + 1;
    ctx.fillStyle = '#b08a5c';
    ctx.fillRect(dx - 0.8, dy - 19, 1.7, 19);
    [0, 5.2, 10.4].forEach((d) => {
      blob(ctx, dx, dy - 16.6 + d, 3.5, 3.3, '#8a5a30');
      blob(ctx, dx, dy - 17 + d, 3.2, 3, '#e8b574');
      blob(ctx, dx - 1.1, dy - 18 + d, 1.4, 1.1, '#ffe2ac');
    });
    const gy = band(ctx, x, y + h * 0.94, w, h, 4, 0.07, '#b14a73', 0.4);
    icing(ctx, x, w, gy, '#fffaf2', 17, 6.4);
    sprinkle(gy, 26, 2);
    drift(ctx, x, y, w, h, t, 'rgba(255,255,255,0.9)', 6, 3);
  },
  // Grand Mochi Course: the festival at dusk, the drum tower under its string of lanterns.
  grand(ctx, x, y, w, h, t) {
    grad(ctx, x, y, w, h, '#2e2358', '#ff9a62', '#8a5690');
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 11; i++) {
      const s = 0.5 + Math.abs(Math.sin(t * 1.1 + i * 1.7)) * 0.7;
      ctx.globalAlpha = 0.45 + s * 0.4;
      ctx.fillRect(x + 3 + ((i * 23) % (w - 6)), y + 2 + ((i * 11) % 13), s, s);
    }
    ctx.globalAlpha = 1;
    sun(ctx, x + 13, y + 8, 4.2, '#fff2c8', '255,232,168', 0.34);
    band(ctx, x, y + h * 0.56, w, h, 3.4, 0.05, '#55407c', 2.2, '#6b5092');
    const gy = band(ctx, x, y + h * 0.82, w, h, 2, 0.08, '#2f2356', 0.4, '#413167');
    // The warmth all that light leaves on the near ground.
    const warm = ctx.createLinearGradient(0, y + h * 0.78, 0, y + h);
    warm.addColorStop(0, 'rgba(255,164,80,0.17)');
    warm.addColorStop(1, 'rgba(255,120,60,0.03)');
    ctx.fillStyle = warm;
    ctx.fillRect(x, y + h * 0.78, w, h * 0.22);
    // The yagura, its drum up on the platform.
    const yx = x + w * 0.68;
    const yy = gy(w * 0.68) + 1;
    blob(ctx, yx, yy + 0.5, 13, 2.2, 'rgba(20,12,36,0.45)');
    ctx.fillStyle = '#241b42';
    ctx.beginPath();
    ctx.moveTo(yx - 11, yy);
    ctx.lineTo(yx - 7, yy - 15);
    ctx.lineTo(yx + 7, yy - 15);
    ctx.lineTo(yx + 11, yy);
    ctx.fill();
    ctx.fillStyle = '#3d2f66';
    ctx.beginPath();
    ctx.moveTo(yx - 11, yy);
    ctx.lineTo(yx - 7, yy - 15);
    ctx.lineTo(yx - 5.4, yy - 15);
    ctx.lineTo(yx - 9.2, yy);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,186,110,0.3)';
    ctx.fillRect(yx - 6, yy - 13, 12, 7);
    ctx.fillStyle = '#4a3670';
    ctx.fillRect(yx - 10, yy - 18, 20, 3.4);
    ctx.fillStyle = '#6a4e94';
    for (let i = 0; i < 6; i++) ctx.fillRect(yx - 9.5 + i * 3.6, yy - 18, 1.2, 3.4);
    blob(ctx, yx, yy - 21, 4.2, 3.2, '#efdcb4');
    ctx.fillStyle = '#c23b52';
    ctx.fillRect(yx - 4.4, yy - 23.4, 8.8, 1.5);
    ctx.fillRect(yx - 4.4, yy - 19.6, 8.8, 1.5);
    roof(ctx, yx, yy - 25, 14, 6, '#c23b52', '#e8697e');
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(yx - 0.8, yy - 33, 1.6, 2.4);
    // The lanterns strung over the way, swinging, each with its own little glow.
    ctx.strokeStyle = 'rgba(255,214,164,0.45)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y + 11);
    ctx.quadraticCurveTo(x + w * 0.5, y + 21, x + w, y + 9);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const u = 0.08 + i * 0.17;
      const lx = x + w * u + Math.sin(t * 1.2 + i * 0.8) * 0.9;
      const ly = y + 14 + Math.sin(u * Math.PI) * 8.6;
      blob(ctx, lx, ly, 5.4, 5.4, 'rgba(255,190,120,0.16)');
      blob(ctx, lx, ly, 2.5, 3.1, i % 2 ? '#ffd27a' : '#ff8f8f');
      blob(ctx, lx - 0.7, ly - 0.8, 0.9, 1.1, '#fff6dc');
      ctx.fillStyle = 'rgba(60,30,20,0.5)';
      ctx.fillRect(lx - 2.5, ly - 3.3, 5, 0.8);
    }
  },
  // Mochi Grand Tour: the long road home at sunset, the castle standing at the end of it.
  tour(ctx, x, y, w, h, t) {
    grad(ctx, x, y, w, h, '#ff8f52', '#ffd6c4', '#ffbc84');
    sun(ctx, x + w * 0.3, y + h * 0.4, 6, '#fff0b0', '255,198,118', 0.45);
    // Cloud lying in bands, lit along the underside of each.
    for (let i = 0; i < 4; i++) {
      const cby = y + 5 + i * 5.5;
      const cw = 20 + (i % 3) * 13;
      const cl = x + ((i * 31) % (w - 10));
      blob(ctx, cl, cby, cw * 0.5, 2.1, 'rgba(255,148,120,0.35)');
      blob(ctx, cl, cby - 0.9, cw * 0.44, 1.5, 'rgba(255,230,200,0.5)');
    }
    band(ctx, x, y + h * 0.52, w, h, 6, 0.035, '#dba6c2', 0.7);
    band(ctx, x, y + h * 0.6, w, h, 3.2, 0.05, '#c489ac', 1.8, '#dda5c0');
    const gy = band(ctx, x, y + h * 0.78, w, h, 2.2, 0.08, '#8e6796', 0.4, '#a97eae');
    // The ground the road runs over, from the near edge of the card to the foot of the castle.
    // Everything that stands beside the road is set on this line, so nothing floats.
    const cx = x + w * 0.54;
    const foot = gy(w * 0.54);
    const cy = foot - 8;
    const at = (k) => ({
      lx: x + w * 0.12 + (cx - 4.5 - x - w * 0.12) * k,
      rx: x + w * 0.7 + (cx + 4.5 - x - w * 0.7) * k,
      gy: y + h + 2 + (cy - y - h - 2) * k,
      s: 1 - 0.62 * k,
    });
    // The rise it is built on. Drawn twice, the second time two lower, which leaves the light
    // lying along the top of the hill.
    const mound = (dy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 40, foot + 10 + dy);
      ctx.quadraticCurveTo(cx - 27, cy + 1 + dy, cx - 18, cy + dy);
      ctx.lineTo(cx + 18, cy + dy);
      ctx.quadraticCurveTo(cx + 27, cy + 1 + dy, cx + 40, foot + 10 + dy);
      ctx.fill();
    };
    blob(ctx, cx, foot + 9, 42, 4, 'rgba(74,44,84,0.16)');
    ctx.fillStyle = '#d2a6d2';
    mound(0);
    ctx.fillStyle = '#a87fb0';
    mound(2.6);
    blob(ctx, cx, cy + 1.4, 15, 2.6, 'rgba(74,44,84,0.32)');
    // The castle, tier on tier on its stone.
    ctx.fillStyle = '#5f4d6b';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx - 8.5, cy - 6);
    ctx.lineTo(cx + 8.5, cy - 6);
    ctx.lineTo(cx + 12, cy);
    ctx.fill();
    ctx.fillStyle = '#7b6788';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx - 8.5, cy - 6);
    ctx.lineTo(cx - 3.5, cy - 6);
    ctx.lineTo(cx - 5.5, cy);
    ctx.fill();
    [[12, 8, 6, 10.5, 4.2], [19, 5.6, 5, 8, 3.6], [25, 3.8, 4.4, 6, 3]].forEach(([up, half, tall, rhalf, rise], k) => {
      ctx.fillStyle = '#fbe8dc';
      ctx.fillRect(cx - half, cy - up, half * 2, tall);
      ctx.fillStyle = '#dcb8b4';
      ctx.fillRect(cx + half * 0.26, cy - up, half * 0.74, tall);
      ctx.fillStyle = '#5b4870';
      for (let i = 0; i < (k < 2 ? 3 : 2); i++) ctx.fillRect(cx - half * 0.66 + i * half * 0.66, cy - up + 1.4, 1.3, 2);
      roof(ctx, cx, cy - up, rhalf, rise, '#4d3c63', '#8a6a84');
    });
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(cx - 0.8, cy - 30.6, 1.7, 2.6);
    // The road up to it, carpeted and edged in gold.
    const n0 = at(0);
    const n1 = at(1);
    ctx.fillStyle = '#9c2e45';
    ctx.beginPath();
    ctx.moveTo(n0.lx, n0.gy);
    ctx.lineTo(n0.rx, n0.gy);
    ctx.lineTo(n1.rx, n1.gy);
    ctx.lineTo(n1.lx, n1.gy);
    ctx.fill();
    ctx.fillStyle = '#cf4057';
    ctx.beginPath();
    ctx.moveTo(n0.lx + 7, n0.gy);
    ctx.lineTo(n0.rx - 7, n0.gy);
    ctx.lineTo(n1.rx - 1.6, n1.gy);
    ctx.lineTo(n1.lx + 1.6, n1.gy);
    ctx.fill();
    ctx.fillStyle = '#e8c46a';
    [[n0.lx, n0.lx + 2.6, n1.lx + 0.9, n1.lx], [n0.rx - 2.6, n0.rx, n1.rx, n1.rx - 0.9]].forEach(([a, b, c2, d]) => {
      ctx.beginPath();
      ctx.moveTo(a, n0.gy);
      ctx.lineTo(b, n0.gy);
      ctx.lineTo(c2, n1.gy);
      ctx.lineTo(d, n1.gy);
      ctx.fill();
    });
    // The banners along it, the far ones first so the near ones stand in front of them.
    [[0.78, 1], [0.54, -1], [0.3, 1], [0.04, -1]].forEach(([k, side], i) => {
      const b = at(k);
      const bx = side < 0 ? b.lx - 3.6 * b.s : b.rx + 1.4 * b.s;
      const tall = 17 * b.s;
      const fly = Math.sin(t * 1.4 + i) * 0.5 * b.s;
      ctx.fillStyle = '#a98f6e';
      ctx.fillRect(bx, b.gy - tall, 1.2 * b.s + 0.4, tall);
      ctx.fillStyle = ['#ffd05c', '#8fd8e8', '#ff9ec0', '#9fe0a8'][i];
      ctx.fillRect(bx + 1.2 * b.s, b.gy - tall + 1 + fly, 5.6 * b.s, 8 * b.s);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(bx + 1.2 * b.s, b.gy - tall + 1 + fly, 5.6 * b.s, 1.6 * b.s);
    });
  },
};

// Draws stage `id`'s picture in the box (x, y, w, h), rounded and framed. Anything the stage has no
// picture for falls back to the sprint's meadow, so a new stage still shows something.
export function stageCard(ctx, id, x, y, w, h, t = 0) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
  ctx.clip();
  (CARDS[id] ?? CARDS.sprint)(ctx, x, y, w, h, t);
  ctx.restore();
  ctx.strokeStyle = '#ffc2d4';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 5);
  ctx.stroke();
}
