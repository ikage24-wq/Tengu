// Set dressing for dungeon rooms whose names promise a place: the Funhouse's mirrors, the Toy
// Workshop's gears and benches, the Candy Kitchen's ovens and jars, the Caramel Forge's furnaces and
// vats, Backstage's painted flats and costume racks, the Spine Market's stalls, and the Barnacle
// Fortress's shell walls. Each room has a far wall (drawFarRoom, behind everything) and a middle
// plane of furniture standing on the floor line (drawMidRoom). Everything is modelled in three
// values (lit, body, shadow) clear of the wall behind it, and anything that moves keys its phase
// off its own place in the world.

import { shade, mix, snap } from './pixel.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const pick = (list, seed) => list[Math.floor(seed * list.length) % list.length];
function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 1;
  const count = Math.ceil(width / spacing) + 3;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}
function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
// A box modelled in three values: lit left edge, body, shadowed right edge and foot.
function box(ctx, x, y, w, h, c, lit = 3, sh = 4) {
  ctx.fillStyle = c;
  ctx.fillRect(snap(x), snap(y), w, h);
  ctx.fillStyle = mix(c, '#ffffff', 0.25);
  ctx.fillRect(snap(x), snap(y), lit, h);
  ctx.fillRect(snap(x), snap(y), w, 2);
  ctx.fillStyle = shade(c, -12);
  ctx.fillRect(snap(x + w - sh), snap(y), sh, h);
}
function disc(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
// A toothed gear turning: shaded rim and teeth, spokes, a hub.
function gear(ctx, cx, cy, r, a, c) {
  ctx.fillStyle = shade(c, -10);
  ctx.beginPath();
  for (let k = 0; k < 28; k++) {
    const u = a + (k / 28) * Math.PI * 2;
    const rr = k % 2 ? r : r * 0.86;
    ctx.lineTo(cx + Math.cos(u) * rr, cy + Math.sin(u) * rr);
  }
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(cx - 1, cy - 1, r * 0.8, 0, Math.PI * 2);
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.strokeStyle = c;
  ctx.lineWidth = Math.max(3, r * 0.14);
  for (let s = 0; s < 4; s++) {
    const u = a * 1.0 + (s / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(u) * r * 0.62, cy + Math.sin(u) * r * 0.62);
    ctx.lineTo(cx - Math.cos(u) * r * 0.62, cy - Math.sin(u) * r * 0.62);
    ctx.stroke();
  }
  disc(ctx, cx, cy, r * 0.2, mix(c, '#ffffff', 0.3));
  disc(ctx, cx + 1, cy + 1, r * 0.08, shade(c, -20));
  ctx.strokeStyle = mix(c, '#ffffff', 0.4);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, Math.PI * 1.05, Math.PI * 1.55);
  ctx.stroke();
}
// A striped awning edged with scallops, over (x..x+w) at y.
function awning(ctx, x, y, w, c1, c2, time, i) {
  const n = Math.max(3, Math.round(w / 14));
  const sw = w / n;
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = k % 2 ? c2 : c1;
    ctx.beginPath();
    ctx.moveTo(x + k * sw + 4, y - 16);
    ctx.lineTo(x + (k + 1) * sw + 4, y - 16);
    ctx.lineTo(x + (k + 1) * sw, y);
    ctx.lineTo(x + k * sw, y);
    ctx.fill();
    const flap = Math.sin(time * 2.4 + i + k * 0.6) * 1.2;
    ctx.beginPath();
    ctx.arc(x + k * sw + sw / 2, y + flap * 0.3, sw / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(snap(x), snap(y + sw / 2), w, 4);
}

// ---------- Far walls ----------

export function drawFarRoom(ctx, t, cam, width, y0, time, kind) {
  const F = FAR[kind];
  if (!F) return false;
  ctx.fillStyle = t.far;
  ctx.fillRect(0, 0, width, 700);
  F(ctx, t, cam, width, y0, time);
  return true;
}

const FAR = {
  // The Funhouse: tilted harlequin wallpaper, a hypnotic spiral turning high up, and a row of tall
  // warped mirrors in gilt frames whose glass wobbles.
  funhouse(ctx, t, cam, width, y0, time) {
    const off = cam.x * 0.2;
    const a = mix('#7a3a9a', t.far, 0.45);
    const b = mix('#c85a9a', t.far, 0.5);
    ctx.save();
    ctx.translate(-((off % 40) + 40), 0);
    for (let gx = 0; gx < width + 120; gx += 40) {
      for (let gy = -40; gy < y0 + 80; gy += 40) {
        ctx.fillStyle = ((gx + gy) / 40) % 2 ? a : b;
        ctx.beginPath();
        ctx.moveTo(gx + 20 + (gy % 80 ? 6 : -6), gy);
        ctx.lineTo(gx + 40, gy + 20);
        ctx.lineTo(gx + 20, gy + 40);
        ctx.lineTo(gx, gy + 20);
        ctx.fill();
      }
    }
    ctx.restore();
    // The dado rail and skirting.
    ctx.fillStyle = mix('#ffd36b', t.far, 0.4);
    ctx.fillRect(0, snap(y0 - 4), width, 5);
    ctx.fillStyle = mix('#4a2a5a', t.far, 0.3);
    ctx.fillRect(0, snap(y0 + 1), width, 400);
    repeat(cam.x, 0.2, 520, width, (i, x) => {
      // The hypno spiral.
      const sx = x + 260;
      const sy = y0 - 190;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(time * 0.8 * (i % 2 ? 1 : -1));
      disc(ctx, 0, 0, 34, mix('#ffffff', t.far, 0.35));
      ctx.fillStyle = mix('#ff5a9a', t.far, 0.3);
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const u = k / 60;
        ctx.lineTo(Math.cos(u * 14) * u * 32, Math.sin(u * 14) * u * 32);
      }
      for (let k = 60; k >= 0; k--) {
        const u = k / 60;
        ctx.lineTo(Math.cos(u * 14 + 0.5) * u * 32, Math.sin(u * 14 + 0.5) * u * 32);
      }
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = mix('#ffd36b', t.far, 0.3);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, 36, 0, Math.PI * 2);
      ctx.stroke();
    });
    repeat(cam.x, 0.2, 130, width, (i, x) => {
      // A warped mirror: its sides bulge in and out on their own beat.
      const mx = x + 40;
      const top = y0 - 150;
      const wob = Math.sin(time * 1.3 + i * 1.7) * 6;
      const shape = (pad) => {
        ctx.beginPath();
        ctx.moveTo(mx - pad, y0 - 10 + pad);
        ctx.bezierCurveTo(mx - 10 - pad + wob, y0 - 60, mx + 10 - pad - wob, y0 - 110, mx - pad, top + 20);
        ctx.arc(mx + 25, top + 20, 25 + pad, Math.PI, 0);
        ctx.bezierCurveTo(mx + 40 + pad + wob, y0 - 110, mx + 60 + pad - wob, y0 - 60, mx + 50 + pad, y0 - 10 + pad);
        ctx.closePath();
      };
      shape(5);
      ctx.fillStyle = mix('#e0a83a', t.far, 0.25);
      ctx.fill();
      shape(0);
      const g = ctx.createLinearGradient(mx, top, mx + 50, y0);
      g.addColorStop(0, mix('#e8f4ff', t.far, 0.3));
      g.addColorStop(0.5, mix('#a8c0e8', t.far, 0.35));
      g.addColorStop(1, mix('#d8e8ff', t.far, 0.3));
      ctx.fillStyle = g;
      ctx.fill();
      // The glare across the glass, and a stretched silhouette in it.
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(mx - 10, y0 - 40);
      ctx.lineTo(mx + 10, top);
      ctx.lineTo(mx + 22, top);
      ctx.lineTo(mx + 2, y0 - 40);
      ctx.fill();
      ctx.fillStyle = mix('#5a3a7a', t.far, 0.55);
      ctx.beginPath();
      ctx.ellipse(mx + 25, y0 - 96, 6 + wob * 0.6, 10 - wob * 0.4, 0, 0, Math.PI * 2);
      ctx.ellipse(mx + 25, y0 - 50, 10 - wob, 34 + wob, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      disc(ctx, mx + 25, top - 8, 4, mix('#ffd36b', t.far, 0.2));
    });
  },

  // The Toy Workshop: panelled walls, great brass gears turning, shelves of finished toys, and a
  // conveyor belt carrying boxes along the back.
  workshop(ctx, t, cam, width, y0, time) {
    const wood = mix('#8a5a3a', t.far, 0.5);
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, width, 700);
    repeat(cam.x, 0.2, 60, width, (i, x) => {
      ctx.fillStyle = shade(wood, -6);
      ctx.fillRect(snap(x), 0, 2, y0 + 40);
      ctx.fillStyle = shade(wood, 4);
      ctx.fillRect(snap(x + 2), 0, 2, y0 + 40);
    });
    const brass = mix('#d8a84a', t.far, 0.35);
    repeat(cam.x, 0.2, 260, width, (i, x) => {
      const r = 40 + hash(i + 2) * 22;
      const cx = x + 60;
      const cy = y0 - 170 + hash(i) * 40;
      gear(ctx, cx, cy, r, time * 0.5 * (40 / r) * (i % 2 ? 1 : -1), brass);
      gear(ctx, cx + r + 18, cy + r * 0.6, r * 0.55, -time * 0.5 * (40 / (r * 0.55)) * (i % 2 ? 1 : -1) + 0.2, shade(brass, -6));
      // A shelf of toys: a bear, blocks, a soldier, a top.
      const sx = x + 150;
      const sy = y0 - 74;
      box(ctx, sx, sy, 96, 6, mix('#6a4028', t.far, 0.3), 2, 3);
      const toy = (k) => mix(['#ff8ab0', '#7fc8ff', '#ffd36b', '#9ae6a8'][k], t.far, 0.4);
      disc(ctx, sx + 14, sy - 12, 9, mix('#c88a5a', t.far, 0.35));
      disc(ctx, sx + 14, sy - 24, 7, mix('#c88a5a', t.far, 0.35));
      disc(ctx, sx + 9, sy - 30, 3, mix('#c88a5a', t.far, 0.35));
      disc(ctx, sx + 19, sy - 30, 3, mix('#c88a5a', t.far, 0.35));
      box(ctx, sx + 30, sy - 12, 12, 12, toy(0), 2, 2);
      box(ctx, sx + 42, sy - 12, 12, 12, toy(1), 2, 2);
      box(ctx, sx + 36, sy - 24, 12, 12, toy(2), 2, 2);
      box(ctx, sx + 62, sy - 26, 8, 26, toy(1), 2, 2);
      disc(ctx, sx + 66, sy - 30, 5, mix('#ffd8b8', t.far, 0.35));
      box(ctx, sx + 61, sy - 38, 10, 6, toy(0), 2, 2);
      ctx.fillStyle = toy(3);
      ctx.beginPath();
      ctx.moveTo(sx + 78, sy - 18);
      ctx.lineTo(sx + 92, sy - 18);
      ctx.lineTo(sx + 85, sy);
      ctx.fill();
      ctx.fillRect(snap(sx + 84), snap(sy - 24), 2, 6);
    });
    // The conveyor: a belt on rollers, boxes riding it along.
    const by = y0 - 18;
    ctx.fillStyle = mix('#3a3040', t.far, 0.3);
    ctx.fillRect(0, snap(by), width, 8);
    ctx.fillStyle = mix('#8a8898', t.far, 0.3);
    repeat(cam.x * 0.2 + time * 30, 1, 16, width, (i, x) => ctx.fillRect(snap(x), snap(by + 2), 6, 2));
    repeat(cam.x * 0.2 - time * 24, 1, 120, width, (i, x) => {
      const c = mix(pick(['#ff8ab0', '#7fc8ff', '#ffd36b', '#9ae6a8'], hash(i)), t.far, 0.35);
      box(ctx, x, by - 18, 20, 18, c, 2, 3);
      ctx.fillStyle = mix('#ffffff', t.far, 0.3);
      ctx.fillRect(snap(x + 9), snap(by - 18), 2, 18);
    });
  },

  // The Candy Kitchen: checked tiles, shelves of sweet jars, copper pans hanging on a rail, and a
  // great arched oven glowing in the back wall.
  kitchen(ctx, t, cam, width, y0, time) {
    const off = cam.x * 0.2;
    const ta = mix('#ffd8e2', t.far, 0.55);
    const tb = mix('#fff4ec', t.far, 0.55);
    for (let gx = -((off % 24) + 24); gx < width + 24; gx += 24) {
      for (let gy = y0 - 140; gy < y0 + 40; gy += 24) {
        ctx.fillStyle = (Math.round((gx + off) / 24) + gy / 24) % 2 ? ta : tb;
        ctx.fillRect(snap(gx), snap(gy), 23, 23);
      }
    }
    const wall = mix('#c87a8a', t.far, 0.55);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, width, snap(y0 - 140));
    ctx.fillStyle = mix('#ffd36b', t.far, 0.35);
    ctx.fillRect(0, snap(y0 - 142), width, 4);
    repeat(cam.x, 0.2, 340, width, (i, x) => {
      // The oven: a brick arch with a glowing door.
      const ox = x + 70;
      const brick = mix('#b8604a', t.far, 0.35);
      ctx.fillStyle = brick;
      ctx.beginPath();
      ctx.roundRect(ox, y0 - 130, 110, 170, [55, 55, 0, 0]);
      ctx.fill();
      ctx.fillStyle = shade(brick, -10);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 5; c++) ctx.fillRect(snap(ox + 4 + c * 22 + (r % 2) * 11), snap(y0 - 80 + r * 12), 18, 1.5);
      ctx.fillStyle = mix('#ff8a3a', '#ffd36b', 0.4 + 0.2 * Math.sin(time * 3 + i));
      ctx.beginPath();
      ctx.roundRect(ox + 28, y0 - 70, 54, 56, [27, 27, 0, 0]);
      ctx.fill();
      glow(ctx, ox + 55, y0 - 40, 60, '#ffb06a', 0.35 + 0.1 * Math.sin(time * 3 + i));
      ctx.fillStyle = mix('#3a2a2a', t.far, 0.2);
      ctx.fillRect(snap(ox + 26), snap(y0 - 16), 58, 4);
      // A shelf of sweet jars.
      const sx = x + 200;
      const sy = y0 - 160;
      box(ctx, sx, sy, 110, 6, mix('#8a5a3a', t.far, 0.3), 2, 3);
      for (let k = 0; k < 5; k++) {
        const jx = sx + 6 + k * 21;
        const jh = 18 + hash(i * 5 + k) * 8;
        const c = mix(pick(['#ff8ab0', '#ffd36b', '#9ae6a8', '#9fd8ff', '#c9a6ff'], hash(i * 3 + k)), t.far, 0.3);
        ctx.fillStyle = mix('#e8f4ff', t.far, 0.4);
        ctx.beginPath();
        ctx.roundRect(jx, sy - jh, 16, jh, 4);
        ctx.fill();
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.roundRect(jx + 2, sy - jh * 0.7, 12, jh * 0.7 - 2, 3);
        ctx.fill();
        box(ctx, jx + 2, sy - jh - 4, 12, 4, mix('#ff7aa8', t.far, 0.3), 1, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(snap(jx + 3), snap(sy - jh + 2), 2, jh - 6);
      }
      // Copper pans on a rail.
      const ry = y0 - 210;
      ctx.fillStyle = mix('#a87a4a', t.far, 0.3);
      ctx.fillRect(snap(x), snap(ry), 340, 3);
      for (let k = 0; k < 3; k++) {
        const px = x + 30 + k * 26 + (k === 2 ? 200 : 0);
        const sw = Math.sin(time * 0.9 + i + k) * 0.06;
        ctx.save();
        ctx.translate(px, ry + 3);
        ctx.rotate(sw);
        const cu = mix('#d8804a', t.far, 0.3);
        ctx.fillStyle = shade(cu, -10);
        ctx.fillRect(-1.5, 0, 3, 18);
        disc(ctx, 0, 30, 12, cu);
        disc(ctx, -3, 27, 5, mix(cu, '#ffffff', 0.35));
        ctx.restore();
      }
    });
  },

  // The Caramel Forge: furnaces in brick arches roaring under hoods, chains with candy moulds hung
  // between, caramel running down a channel in the wall.
  forge(ctx, t, cam, width, y0, time) {
    const brick = mix('#7a3a2a', t.far, 0.45);
    ctx.fillStyle = brick;
    ctx.fillRect(0, 0, width, 700);
    const off = cam.x * 0.2;
    ctx.fillStyle = shade(brick, -6);
    for (let r = 0; r * 14 < y0 + 40; r++) {
      ctx.fillRect(0, snap(r * 14), width, 1.5);
      for (let c = -1; c * 28 < width + 28; c++) ctx.fillRect(snap(c * 28 - (off % 28) + (r % 2) * 14), snap(r * 14), 1.5, 14);
    }
    repeat(cam.x, 0.2, 280, width, (i, x) => {
      const fx = x + 140;
      const stone = mix('#b07a5a', t.far, 0.3);
      // The hood and chimney.
      ctx.fillStyle = shade(stone, -8);
      ctx.fillRect(snap(fx - 22), 0, 44, y0 - 200);
      ctx.fillStyle = stone;
      ctx.beginPath();
      ctx.moveTo(fx - 22, y0 - 200);
      ctx.lineTo(fx + 22, y0 - 200);
      ctx.lineTo(fx + 66, y0 - 150);
      ctx.lineTo(fx - 66, y0 - 150);
      ctx.fill();
      ctx.fillStyle = mix(stone, '#ffffff', 0.2);
      ctx.fillRect(snap(fx - 66), snap(y0 - 152), 132, 3);
      // The furnace: a stone arch, voussoirs, and a roaring mouth.
      ctx.fillStyle = stone;
      ctx.beginPath();
      ctx.roundRect(fx - 60, y0 - 140, 120, 180, [60, 60, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = shade(stone, -12);
      ctx.lineWidth = 1.5;
      for (let v = 0; v < 9; v++) {
        const a = Math.PI + (v / 8) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(fx + Math.cos(a) * 40, y0 - 80 + Math.sin(a) * 40);
        ctx.lineTo(fx + Math.cos(a) * 58, y0 - 80 + Math.sin(a) * 58);
        ctx.stroke();
      }
      const roar = 0.5 + 0.5 * Math.sin(time * 5 + i * 2) * Math.sin(time * 3.3 + i);
      const g = ctx.createLinearGradient(0, y0 - 120, 0, y0 + 20);
      g.addColorStop(0, '#ff6a2a');
      g.addColorStop(1, '#ffe08a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(fx - 38, y0 - 118, 76, 140, [38, 38, 0, 0]);
      ctx.fill();
      for (let k = 0; k < 5; k++) {
        const h = 30 + 30 * Math.abs(Math.sin(time * 6 + k * 1.7 + i));
        ctx.fillStyle = k % 2 ? '#fff2b0' : '#ffb04a';
        ctx.beginPath();
        ctx.moveTo(fx - 30 + k * 15, y0 + 10);
        ctx.quadraticCurveTo(fx - 24 + k * 15, y0 + 10 - h, fx - 18 + k * 15, y0 + 10);
        ctx.fill();
      }
      glow(ctx, fx, y0 - 40, 110, '#ffa04a', 0.35 + 0.15 * roar);
      // Chains between the furnaces, a heart-shaped mould on each.
      const cx = x;
      const sw = Math.sin(time * 0.7 + i) * 3;
      ctx.strokeStyle = mix('#5a4a4a', t.far, 0.2);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx + sw, y0 - 120);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = mix('#c8b8a8', t.far, 0.3);
      ctx.beginPath();
      ctx.arc(cx + sw - 6, y0 - 114, 7, Math.PI, 0);
      ctx.arc(cx + sw + 6, y0 - 114, 7, Math.PI, 0);
      ctx.lineTo(cx + sw, y0 - 98);
      ctx.fill();
    });
  },

  // Backstage: a bare brick wall, painted scenery flats leaning against it on their braces, a
  // costume rack, and the rigging's sandbags swinging on their lines.
  backstage(ctx, t, cam, width, y0, time) {
    const brick = mix('#5a4a5a', t.far, 0.4);
    ctx.fillStyle = brick;
    ctx.fillRect(0, 0, width, 700);
    const off = cam.x * 0.2;
    ctx.fillStyle = shade(brick, -5);
    for (let r = 0; r * 12 < y0 + 40; r++) for (let c = -1; c * 26 < width + 26; c++) ctx.fillRect(snap(c * 26 - (off % 26) + (r % 2) * 13), snap(r * 12), 24, 10);
    repeat(cam.x, 0.2, 300, width, (i, x) => {
      // A flat: a canvas panel on a timber frame, painted with a scene, leaning a little.
      const fx = x + 30;
      const kind = Math.floor(hash(i) * 3);
      ctx.save();
      ctx.translate(fx, y0 + 30);
      ctx.rotate(-0.04);
      const W = 120;
      const H = 170;
      box(ctx, 0, -H, W, H, mix('#d8c8a8', t.far, 0.35), 4, 6);
      ctx.save();
      ctx.beginPath();
      ctx.rect(6, -H + 6, W - 12, H - 12);
      ctx.clip();
      const sky = mix(['#7fb8ff', '#3a3a7a', '#ffb88a'][kind], t.far, 0.35);
      ctx.fillStyle = sky;
      ctx.fillRect(6, -H + 6, W - 12, H - 12);
      if (kind === 0) {
        // A castle on a green hill.
        ctx.fillStyle = mix('#7fd38f', t.far, 0.35);
        ctx.beginPath();
        ctx.ellipse(W / 2, -10, 80, 50, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = mix('#e8e0f0', t.far, 0.35);
        ctx.fillRect(40, -110, 40, 60);
        ctx.fillRect(34, -128, 14, 80);
        ctx.fillRect(72, -128, 14, 80);
        ctx.fillStyle = mix('#ff7aa8', t.far, 0.35);
        for (const tx of [41, 79]) {
          ctx.beginPath();
          ctx.moveTo(tx - 9, -128);
          ctx.lineTo(tx, -146);
          ctx.lineTo(tx + 9, -128);
          ctx.fill();
        }
      } else if (kind === 1) {
        // A night forest under a paper moon.
        disc(ctx, 80, -130, 14, mix('#fff3c0', t.far, 0.2));
        ctx.fillStyle = mix('#2a5a4a', t.far, 0.3);
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.moveTo(10 + k * 28, -6);
          ctx.lineTo(24 + k * 28, -90 + (k % 2) * 20);
          ctx.lineTo(38 + k * 28, -6);
          ctx.fill();
        }
      } else {
        // A sunset sea with a little boat.
        disc(ctx, W / 2, -70, 22, mix('#ffe08a', t.far, 0.2));
        ctx.fillStyle = mix('#4a8ac8', t.far, 0.35);
        ctx.fillRect(6, -70, W - 12, 64);
        ctx.fillStyle = mix('#ffffff', t.far, 0.4);
        for (let k = 0; k < 4; k++) ctx.fillRect(14 + k * 26, -50 + (k % 2) * 14, 16, 2);
        ctx.fillStyle = mix('#8a5a3a', t.far, 0.3);
        ctx.beginPath();
        ctx.moveTo(40, -74);
        ctx.lineTo(80, -74);
        ctx.lineTo(72, -64);
        ctx.lineTo(48, -64);
        ctx.fill();
      }
      ctx.restore();
      // Its brace at the back, and a stage weight on the foot.
      ctx.fillStyle = mix('#8a6a4a', t.far, 0.3);
      ctx.fillRect(W - 8, -H + 10, 5, H - 10);
      box(ctx, W - 20, -12, 22, 12, mix('#4a4a5a', t.far, 0.2), 2, 3);
      ctx.restore();
      // The costume rack: a rail on two stands, gowns and coats hanging.
      const rx = x + 180;
      const ry = y0 - 90;
      ctx.fillStyle = mix('#a8a8b8', t.far, 0.3);
      ctx.fillRect(snap(rx), snap(ry), 96, 3);
      ctx.fillRect(snap(rx + 2), snap(ry), 3, 120);
      ctx.fillRect(snap(rx + 91), snap(ry), 3, 120);
      for (let k = 0; k < 5; k++) {
        const c = mix(pick(['#c83a5a', '#3a6ac8', '#e8b83a', '#8a3aa8', '#3aa88a'], hash(i * 5 + k)), t.far, 0.35);
        const cx = rx + 14 + k * 17;
        const sway = Math.sin(time * 0.8 + i + k) * 1.5;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(cx - 6, ry + 6);
        ctx.lineTo(cx + 6, ry + 6);
        ctx.lineTo(cx + 10 + sway, ry + 70 + (k % 2) * 14);
        ctx.lineTo(cx - 10 + sway, ry + 70 + (k % 2) * 14);
        ctx.fill();
        ctx.fillStyle = shade(c, -10);
        ctx.fillRect(snap(cx + 2), snap(ry + 8), 4, 60);
        ctx.fillStyle = mix('#ffffff', t.far, 0.4);
        ctx.fillRect(snap(cx - 1), snap(ry + 2), 2, 5);
      }
      // A sandbag on its line from the fly gallery.
      const bx = x + 150;
      const sw = Math.sin(time * 0.8 + i * 1.3) * 5;
      const bag = y0 - 130 - hash(i) * 50;
      ctx.strokeStyle = mix('#c8a878', t.far, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + sw, bag - 10);
      ctx.stroke();
      const sand = mix('#a8885a', t.far, 0.3);
      ctx.fillStyle = sand;
      ctx.beginPath();
      ctx.ellipse(bx + sw, bag, 10, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mix(sand, '#ffffff', 0.2);
      ctx.beginPath();
      ctx.ellipse(bx + sw - 3, bag - 3, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade(sand, -14);
      ctx.fillRect(snap(bx + sw - 4), snap(bag - 13), 8, 3);
    });
  },
};

// The far plane on the Sky Whale for the market and the fortress (over its cloud sea).
export function drawFarWhaleRoom(ctx, t, cam, width, y0, time, kind) {
  if (kind === 'market') {
    // Market tents far off along the whale's back: pitched canvas with stripes, a lit flank,
    // a pole and a flag at the peak, strings of pennants between.
    repeat(cam.x, 0.22, 170, width, (i, x) => {
      const c = mix(pick(['#ff9ab8', '#ffd36b', '#9fd0ff', '#9ae6a8'], hash(i)), t.far, 0.4);
      const h = 60 + hash(i + 2) * 30;
      const px = x + 85;
      const base = y0 + 30;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x + 30, base);
      ctx.quadraticCurveTo(px - 20, base - h * 0.5, px, base - h);
      ctx.quadraticCurveTo(px + 20, base - h * 0.5, x + 140, base);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = mix('#ffffff', t.far, 0.45);
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(px, base - h);
        ctx.lineTo(x + 30 + k * 30, base);
        ctx.lineTo(x + 44 + k * 30, base);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(40,30,80,0.18)';
      ctx.fillRect(px, base - h, 60, h);
      ctx.restore();
      // The door flap, dark inside.
      ctx.fillStyle = mix('#3a2a4a', t.far, 0.35);
      ctx.beginPath();
      ctx.moveTo(px - 10, base);
      ctx.lineTo(px, base - 30);
      ctx.lineTo(px + 10, base);
      ctx.fill();
      ctx.fillStyle = mix('#8a6a4a', t.far, 0.3);
      ctx.fillRect(snap(px - 1), snap(base - h - 16), 2, 16);
      const fl = Math.sin(time * 3 + i) * 2;
      ctx.fillStyle = mix('#ff7aa8', t.far, 0.25);
      ctx.beginPath();
      ctx.moveTo(px + 1, base - h - 16);
      ctx.lineTo(px + 14, base - h - 12 + fl);
      ctx.lineTo(px + 1, base - h - 8);
      ctx.fill();
      for (let k = 0; k < 6; k++) {
        const qx = px + 10 + k * 13;
        const qy = base - h + 8 + Math.sin((k / 5) * Math.PI) * 18;
        ctx.fillStyle = mix(pick(['#ff7aa8', '#ffd36b', '#7fd8ff'], hash(i * 7 + k)), t.far, 0.3);
        ctx.beginPath();
        ctx.moveTo(qx, qy);
        ctx.lineTo(qx + 8, qy);
        ctx.lineTo(qx + 4 + Math.sin(time * 4 + k + i) * 2, qy + 9);
        ctx.fill();
      }
    });
    return true;
  }
  if (kind === 'fortress') {
    // The Barnacle Fortress: a curtain wall of shell plates with crenellations, round towers
    // crowned with conch spires, barnacles crusting it, banners on the towers.
    const shell = mix('#e8c8c8', t.far, 0.4);
    const wy = y0 - 40;
    ctx.fillStyle = shell;
    ctx.fillRect(0, snap(wy), width, 300);
    ctx.fillStyle = mix(shell, '#ffffff', 0.2);
    ctx.fillRect(0, snap(wy), width, 3);
    repeat(cam.x, 0.2, 22, width, (i, x) => {
      ctx.fillStyle = shell;
      ctx.fillRect(snap(x), snap(wy - 10), 13, 10);
      ctx.fillStyle = mix(shell, '#ffffff', 0.2);
      ctx.fillRect(snap(x), snap(wy - 10), 13, 2);
    });
    ctx.fillStyle = shade(shell, -7);
    repeat(cam.x, 0.2, 40, width, (i, x) => {
      ctx.beginPath();
      ctx.arc(x + 20, wy + 30, 18, Math.PI, 0);
      ctx.arc(x + 20, wy + 30, 15, 0, Math.PI, true);
      ctx.fill();
    });
    repeat(cam.x, 0.2, 240, width, (i, x) => {
      const tx = x + 120;
      const h = 130 + hash(i) * 50;
      const w = 44;
      const top = y0 + 30 - h;
      ctx.fillStyle = shell;
      ctx.fillRect(snap(tx - w / 2), snap(top), w, h);
      ctx.fillStyle = mix(shell, '#ffffff', 0.25);
      ctx.fillRect(snap(tx - w / 2), snap(top), 8, h);
      ctx.fillStyle = shade(shell, -10);
      ctx.fillRect(snap(tx + w / 2 - 9), snap(top), 9, h);
      // The conch spire: a spiral cone.
      const conch = mix('#ffd8b0', t.far, 0.35);
      ctx.fillStyle = conch;
      ctx.beginPath();
      ctx.moveTo(tx - w / 2 - 6, top);
      ctx.quadraticCurveTo(tx - 10, top - 40, tx + 4, top - 70);
      ctx.quadraticCurveTo(tx + 14, top - 36, tx + w / 2 + 6, top);
      ctx.fill();
      ctx.strokeStyle = shade(conch, -14);
      ctx.lineWidth = 2;
      for (let s = 0; s < 4; s++) {
        const sy = top - 8 - s * 15;
        const half = (w / 2 + 4) * (1 - s * 0.22);
        ctx.beginPath();
        ctx.moveTo(tx - half, sy + 4);
        ctx.quadraticCurveTo(tx, sy - 4, tx + half * 0.9, sy - 2);
        ctx.stroke();
      }
      // A lit arrow slit, barnacles, a banner.
      ctx.fillStyle = '#ffe6a0';
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(time * 0.7 + i);
      ctx.fillRect(snap(tx - 2), snap(top + 30), 4, 16);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 6; k++) {
        const bx = tx - w / 2 + 6 + hash(i * 5 + k) * (w - 12);
        const by = top + 50 + hash(i * 3 + k) * (h - 60);
        disc(ctx, bx, by, 3.4, mix('#f4ece0', t.far, 0.2));
        disc(ctx, bx, by, 1.4, shade(shell, -18));
      }
      const fl = Math.sin(time * 2.4 + i) * 3;
      ctx.fillStyle = mix('#3a8ac8', t.far, 0.25);
      ctx.beginPath();
      ctx.moveTo(tx + w / 2, top + 10);
      ctx.lineTo(tx + w / 2 + 16, top + 12 + fl);
      ctx.lineTo(tx + w / 2 + 12, top + 34 + fl);
      ctx.lineTo(tx + w / 2 + 6, top + 28);
      ctx.lineTo(tx + w / 2, top + 34);
      ctx.fill();
    });
    return true;
  }
  return false;
}

// ---------- The middle plane: furniture on the floor line ----------

export function drawMidRoom(ctx, t, cam, width, y0, time, kind) {
  const M = MID[kind];
  if (!M) return false;
  M(ctx, t, cam, width, y0, time);
  return true;
}

const MID = {
  // Striped barrel tunnels rolling, a clown-face doorway, tilted "this way" signs.
  funhouse(ctx, t, cam, width, y0, time) {
    repeat(cam.x, 0.45, 300, width, (i, x) => {
      const s = hash(i + 3);
      if (s < 0.45) {
        // A big rolling barrel on its side.
        const bx = x + 80;
        const by = y0 - 34;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(bx, by, 60, 34, 0, 0, Math.PI * 2);
        ctx.clip();
        const roll = (time * 30) % 24;
        for (let k = -6; k < 8; k++) {
          ctx.fillStyle = k % 2 ? mix('#ff5a8a', t.mid, 0.2) : mix('#fff2f8', t.mid, 0.2);
          ctx.fillRect(bx - 60 + k * 12 + roll - 12, by - 34, 12, 68);
        }
        ctx.fillStyle = 'rgba(40,20,60,0.25)';
        ctx.fillRect(bx - 60, by + 10, 120, 30);
        ctx.restore();
        ctx.fillStyle = mix('#3a1e4a', t.mid, 0.2);
        ctx.beginPath();
        ctx.ellipse(bx + 58, by, 10, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = mix('#ffd36b', t.mid, 0.2);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(bx + 58, by, 10, 30, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s < 0.7) {
        // A clown face over a doorway: the mouth is the door.
        const cx = x + 80;
        const face = mix('#fff2f8', t.mid, 0.15);
        disc(ctx, cx, y0 - 70, 52, face);
        disc(ctx, cx - 48, y0 - 92, 22, mix('#ff7a4a', t.mid, 0.15));
        disc(ctx, cx + 48, y0 - 92, 22, mix('#ff7a4a', t.mid, 0.15));
        disc(ctx, cx, y0 - 76, 9, mix('#ff3a5a', t.mid, 0.1));
        const blink = Math.sin(time * 0.7 + i * 3) > 0.96;
        for (const dx of [-18, 18]) {
          ctx.fillStyle = mix('#6a8aff', t.mid, 0.2);
          ctx.beginPath();
          ctx.moveTo(cx + dx, y0 - 108);
          ctx.lineTo(cx + dx + 8, y0 - 96);
          ctx.lineTo(cx + dx, y0 - 84);
          ctx.lineTo(cx + dx - 8, y0 - 96);
          ctx.fill();
          disc(ctx, cx + dx, y0 - 96, blink ? 0.6 : 3.2, '#2a1e3a');
        }
        ctx.fillStyle = mix('#c8203a', t.mid, 0.1);
        ctx.beginPath();
        ctx.ellipse(cx, y0 - 30, 34, 30, 0, Math.PI, 0);
        ctx.lineTo(cx + 34, y0);
        ctx.lineTo(cx - 34, y0);
        ctx.fill();
        ctx.fillStyle = mix('#2a1428', t.mid, 0.1);
        ctx.beginPath();
        ctx.ellipse(cx, y0 - 24, 24, 22, 0, Math.PI, 0);
        ctx.lineTo(cx + 24, y0);
        ctx.lineTo(cx - 24, y0);
        ctx.fill();
      } else {
        // A crooked signpost.
        const px = x + 80;
        const lean = Math.sin(i) * 0.12;
        ctx.save();
        ctx.translate(px, y0);
        ctx.rotate(lean);
        box(ctx, -3, -90, 6, 90, mix('#8a5a3a', t.mid, 0.2), 2, 2);
        ctx.fillStyle = mix('#ffd36b', t.mid, 0.15);
        ctx.beginPath();
        ctx.moveTo(-30, -84);
        ctx.lineTo(24, -84);
        ctx.lineTo(36, -74);
        ctx.lineTo(24, -64);
        ctx.lineTo(-30, -64);
        ctx.fill();
        ctx.fillStyle = mix('#c8203a', t.mid, 0.1);
        ctx.fillRect(-22, -77, 34, 3);
        ctx.beginPath();
        ctx.moveTo(12, -82);
        ctx.lineTo(20, -75.5);
        ctx.lineTo(12, -69);
        ctx.fill();
        ctx.restore();
      }
    });
  },
  // Workbenches with a vise and toys being made, and marionettes hanging from the beams.
  workshop(ctx, t, cam, width, y0, time) {
    repeat(cam.x, 0.45, 260, width, (i, x) => {
      const bx = x + 30;
      const wood = mix('#a8703a', t.mid, 0.2);
      box(ctx, bx, y0 - 46, 120, 8, wood, 2, 3);
      box(ctx, bx + 6, y0 - 38, 8, 38, shade(wood, -8), 2, 2);
      box(ctx, bx + 106, y0 - 38, 8, 38, shade(wood, -8), 2, 2);
      box(ctx, bx + 14, y0 - 14, 92, 4, shade(wood, -6), 1, 2);
      // The vise, a half-painted rocking horse, a hammer and a pot of paint.
      box(ctx, bx + 8, y0 - 58, 18, 12, mix('#7a8a9a', t.mid, 0.2), 2, 3);
      const horse = mix('#ffffff', t.mid, 0.15);
      ctx.fillStyle = mix('#c8203a', t.mid, 0.15);
      ctx.beginPath();
      ctx.ellipse(bx + 66, y0 - 48, 26, 5, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = horse;
      ctx.beginPath();
      ctx.ellipse(bx + 64, y0 - 66, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bx + 74, y0 - 86, 8, 20);
      ctx.beginPath();
      ctx.ellipse(bx + 82, y0 - 86, 9, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mix('#ffd36b', t.mid, 0.15);
      for (let k = 0; k < 3; k++) ctx.fillRect(snap(bx + 70 + k * 2), snap(y0 - 92 + k * 4), 3, 6);
      for (const lx of [52, 60, 70, 76]) ctx.fillRect(snap(bx + lx), snap(y0 - 60), 3, 12);
      box(ctx, bx + 96, y0 - 58, 12, 12, mix('#7fc8ff', t.mid, 0.2), 2, 2);
      ctx.fillStyle = mix('#3a8ae8', t.mid, 0.1);
      ctx.fillRect(snap(bx + 97), snap(y0 - 58), 10, 3);
      // A marionette dangling on its strings, dancing a little.
      const mx = x + 200;
      const my = y0 - 120 + Math.sin(time * 1.4 + i) * 6;
      const sw = Math.sin(time * 1.1 + i) * 6;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const dx of [-10, 0, 10]) {
        ctx.moveTo(mx + dx, 0);
        ctx.lineTo(mx + dx + sw * 0.3, my - 10 + Math.abs(dx));
      }
      ctx.stroke();
      ctx.fillStyle = mix('#8a6a4a', t.mid, 0.2);
      ctx.fillRect(snap(mx - 14), snap(my - 40), 28, 3);
      const coat = mix(pick(['#3a6ac8', '#c8203a', '#3aa88a'], hash(i)), t.mid, 0.15);
      disc(ctx, mx + sw * 0.3, my - 4, 7, mix('#ffe0c8', t.mid, 0.15));
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.moveTo(mx - 8 + sw * 0.3, my + 4);
      ctx.lineTo(mx + 8 + sw * 0.3, my + 4);
      ctx.lineTo(mx + 11 + sw * 0.5, my + 26);
      ctx.lineTo(mx - 11 + sw * 0.5, my + 26);
      ctx.fill();
      ctx.fillStyle = mix('#2a2a3a', t.mid, 0.2);
      ctx.fillRect(snap(mx - 6 + sw * 0.6), snap(my + 26), 4, 14 + Math.sin(time * 3 + i) * 3);
      ctx.fillRect(snap(mx + 2 + sw * 0.6), snap(my + 26), 4, 14 - Math.sin(time * 3 + i) * 3);
    });
  },
  // Counters with mixing bowls and canisters, and a copper pot steaming on the stove.
  kitchen(ctx, t, cam, width, y0, time) {
    repeat(cam.x, 0.45, 280, width, (i, x) => {
      const cx = x + 20;
      const top = mix('#fff4ec', t.mid, 0.1);
      const base = mix('#c87a8a', t.mid, 0.2);
      box(ctx, cx, y0 - 50, 140, 50, base, 3, 5);
      box(ctx, cx - 4, y0 - 56, 148, 7, top, 2, 3);
      for (let d = 0; d < 3; d++) {
        ctx.fillStyle = shade(base, -10);
        ctx.fillRect(snap(cx + 8 + d * 44), snap(y0 - 42), 38, 1.5);
        disc(ctx, cx + 27 + d * 44, y0 - 34, 2, mix('#ffd36b', t.mid, 0.1));
      }
      // A mixing bowl with a whisk, and striped canisters.
      ctx.fillStyle = mix('#9fd8ff', t.mid, 0.15);
      ctx.beginPath();
      ctx.ellipse(cx + 30, y0 - 60, 18, 12, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = mix('#ffb3cf', t.mid, 0.1);
      ctx.fillRect(snap(cx + 13), snap(y0 - 62), 34, 3);
      ctx.strokeStyle = mix('#c8c8d8', t.mid, 0.1);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 34, y0 - 62);
      ctx.lineTo(cx + 44, y0 - 84);
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const kx = cx + 66 + k * 18;
        const h = 22 + k * 6;
        box(ctx, kx, y0 - 56 - h, 14, h, mix('#fff2f8', t.mid, 0.1), 2, 3);
        ctx.fillStyle = mix(['#ff7aa8', '#7fd8a8', '#ffd36b'][k], t.mid, 0.1);
        for (let s = 0; s < h; s += 8) ctx.fillRect(snap(kx), snap(y0 - 56 - h + s + 2), 14, 3);
        box(ctx, kx - 1, y0 - 60 - h, 16, 4, mix('#c8a878', t.mid, 0.1), 1, 2);
      }
      // The stove and its pot, steam curling up.
      const sx = x + 200;
      box(ctx, sx, y0 - 44, 60, 44, mix('#4a4a5a', t.mid, 0.2), 3, 5);
      ctx.fillStyle = mix('#ff8a3a', '#ffd36b', 0.5 + 0.3 * Math.sin(time * 4 + i));
      ctx.fillRect(snap(sx + 14), snap(y0 - 30), 32, 14);
      const pot = mix('#d8804a', t.mid, 0.1);
      box(ctx, sx + 6, y0 - 76, 48, 32, pot, 5, 7);
      box(ctx, sx + 2, y0 - 80, 56, 5, shade(pot, 6), 2, 3);
      ctx.fillStyle = mix('#ff9ac0', t.mid, 0.1);
      ctx.beginPath();
      ctx.ellipse(sx + 30, y0 - 80, 24, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let k = 0; k < 4; k++) {
        const u = (time * 0.3 + k / 4 + hash(i)) % 1;
        ctx.globalAlpha = 0.4 * Math.sin(Math.PI * u);
        disc(ctx, sx + 22 + k * 6 + Math.sin(u * 6 + k) * 6, y0 - 86 - u * 70, 6 + u * 12, '#ffffff');
      }
      ctx.globalAlpha = 1;
    });
  },
  // Anvils, bubbling caramel vats, and racks of tongs and hammers.
  forge(ctx, t, cam, width, y0, time) {
    repeat(cam.x, 0.45, 300, width, (i, x) => {
      // A caramel vat on legs, bubbling.
      const vx = x + 30;
      const iron = mix('#4a3a3a', t.mid, 0.2);
      box(ctx, vx + 6, y0 - 20, 6, 20, iron, 1, 2);
      box(ctx, vx + 70, y0 - 20, 6, 20, iron, 1, 2);
      ctx.fillStyle = iron;
      ctx.beginPath();
      ctx.moveTo(vx, y0 - 70);
      ctx.lineTo(vx + 82, y0 - 70);
      ctx.lineTo(vx + 74, y0 - 18);
      ctx.lineTo(vx + 8, y0 - 18);
      ctx.fill();
      ctx.fillStyle = mix(iron, '#ffffff', 0.15);
      ctx.fillRect(snap(vx + 2), snap(y0 - 70), 8, 50);
      ctx.fillStyle = shade(iron, 8);
      ctx.fillRect(snap(vx - 3), snap(y0 - 74), 88, 6);
      ctx.fillStyle = '#e8902a';
      ctx.beginPath();
      ctx.ellipse(vx + 41, y0 - 72, 38, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      glow(ctx, vx + 41, y0 - 80, 40, '#ffb04a', 0.35);
      for (let k = 0; k < 3; k++) {
        const u = (time * 0.8 + k / 3 + hash(i)) % 1;
        disc(ctx, vx + 20 + k * 20, y0 - 74 - u * 6, 3 * Math.sin(Math.PI * u), '#ffc86a');
      }
      // Caramel dripping over the lip.
      ctx.fillStyle = '#d87a2a';
      for (const dx of [12, 50, 70]) {
        const len = 8 + 6 * Math.abs(Math.sin(time * 0.7 + dx + i));
        ctx.beginPath();
        ctx.roundRect(vx + dx, y0 - 70, 4, len, 2);
        ctx.fill();
      }
      // An anvil on a stump.
      const ax = x + 160;
      const wood = mix('#7a4a2a', t.mid, 0.2);
      box(ctx, ax + 10, y0 - 28, 34, 28, wood, 3, 4);
      const steel = mix('#6a6a7a', t.mid, 0.15);
      ctx.fillStyle = steel;
      ctx.beginPath();
      ctx.moveTo(ax - 6, y0 - 46);
      ctx.lineTo(ax + 60, y0 - 46);
      ctx.lineTo(ax + 52, y0 - 38);
      ctx.lineTo(ax + 40, y0 - 36);
      ctx.lineTo(ax + 40, y0 - 28);
      ctx.lineTo(ax + 14, y0 - 28);
      ctx.lineTo(ax + 14, y0 - 36);
      ctx.quadraticCurveTo(ax, y0 - 38, ax - 6, y0 - 46);
      ctx.fill();
      ctx.fillStyle = mix(steel, '#ffffff', 0.35);
      ctx.fillRect(snap(ax - 4), snap(y0 - 46), 62, 2);
      // A rack of tools.
      const rx = x + 240;
      box(ctx, rx, y0 - 110, 6, 110, wood, 2, 2);
      box(ctx, rx + 40, y0 - 110, 6, 110, wood, 2, 2);
      box(ctx, rx, y0 - 104, 46, 5, shade(wood, 6), 1, 2);
      for (let k = 0; k < 3; k++) {
        const tx = rx + 10 + k * 12;
        ctx.fillStyle = mix('#8a6a4a', t.mid, 0.2);
        ctx.fillRect(snap(tx), snap(y0 - 100), 3, 40);
        ctx.fillStyle = steel;
        if (k === 1) ctx.fillRect(snap(tx - 5), snap(y0 - 64), 13, 9);
        else {
          ctx.fillRect(snap(tx - 2), snap(y0 - 62), 2, 10);
          ctx.fillRect(snap(tx + 3), snap(y0 - 62), 2, 10);
        }
      }
    });
  },
  // Prop trunks, a dressing mirror ringed with bulbs, a spotlight on its stand.
  backstage(ctx, t, cam, width, y0, time) {
    repeat(cam.x, 0.45, 320, width, (i, x) => {
      const tx = x + 30;
      const trunk = mix('#8a4a3a', t.mid, 0.2);
      box(ctx, tx, y0 - 36, 64, 36, trunk, 3, 5);
      ctx.fillStyle = shade(trunk, 8);
      ctx.beginPath();
      ctx.roundRect(tx - 2, y0 - 48, 68, 14, [8, 8, 0, 0]);
      ctx.fill();
      ctx.fillStyle = mix('#ffd36b', t.mid, 0.15);
      for (const dx of [0, 60]) ctx.fillRect(snap(tx + dx), snap(y0 - 48), 4, 48);
      ctx.fillRect(snap(tx + 28), snap(y0 - 38), 8, 8);
      // A feather boa and a crown spilling out of it.
      ctx.fillStyle = mix('#ff7ab8', t.mid, 0.1);
      for (let k = 0; k < 6; k++) disc(ctx, tx + 8 + k * 7, y0 - 48 + Math.sin(k) * 2, 4, mix('#ff7ab8', t.mid, 0.1));
      ctx.fillStyle = mix('#ffd36b', t.mid, 0.05);
      ctx.beginPath();
      ctx.moveTo(tx + 48, y0 - 50);
      ctx.lineTo(tx + 50, y0 - 60);
      ctx.lineTo(tx + 54, y0 - 54);
      ctx.lineTo(tx + 58, y0 - 62);
      ctx.lineTo(tx + 62, y0 - 54);
      ctx.lineTo(tx + 66, y0 - 60);
      ctx.lineTo(tx + 66, y0 - 50);
      ctx.fill();
      // The dressing mirror: a frame ringed with bulbs on a little table.
      const mx = x + 150;
      const wood = mix('#c8a878', t.mid, 0.2);
      box(ctx, mx, y0 - 40, 70, 6, wood, 2, 3);
      box(ctx, mx + 4, y0 - 34, 5, 34, shade(wood, -8), 1, 2);
      box(ctx, mx + 61, y0 - 34, 5, 34, shade(wood, -8), 1, 2);
      box(ctx, mx + 8, y0 - 104, 54, 62, wood, 3, 4);
      const g = ctx.createLinearGradient(mx + 14, y0 - 98, mx + 56, y0 - 48);
      g.addColorStop(0, '#e8f4ff');
      g.addColorStop(1, '#a8b8d8');
      ctx.fillStyle = g;
      ctx.fillRect(snap(mx + 14), snap(y0 - 98), 42, 50);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(snap(mx + 18), snap(y0 - 94), 4, 40);
      for (let k = 0; k < 10; k++) {
        const side = k < 5;
        const bx = side ? mx + 10 : mx + 60;
        const by = y0 - 98 + (k % 5) * 12;
        disc(ctx, bx, by, 2.6, '#fff2c0');
        glow(ctx, bx, by, 9, '#ffe6a0', 0.35 + 0.1 * Math.sin(time * 2 + k));
      }
      // A spotlight on a tripod, pointing up into the flies.
      const sx = x + 270;
      ctx.strokeStyle = mix('#3a3a4a', t.mid, 0.2);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, y0 - 60);
      ctx.lineTo(sx - 16, y0);
      ctx.moveTo(sx, y0 - 60);
      ctx.lineTo(sx + 16, y0);
      ctx.moveTo(sx, y0 - 60);
      ctx.lineTo(sx, y0);
      ctx.stroke();
      ctx.save();
      ctx.translate(sx, y0 - 66);
      ctx.rotate(-0.6 + Math.sin(time * 0.3 + i) * 0.1);
      box(ctx, -10, -12, 30, 24, mix('#2a2a3a', t.mid, 0.2), 2, 4);
      disc(ctx, 20, 0, 9, '#fff6d0');
      ctx.restore();
    });
  },
  // Market stalls: a counter of goods under a striped awning, crates and lanterns.
  market(ctx, t, cam, width, y0, time) {
    repeat(cam.x, 0.45, 300, width, (i, x) => {
      const sx = x + 30;
      const wood = mix('#a8805a', t.mid, 0.2);
      const c = pick([['#ff7aa8', '#fff2f8'], ['#3aa8e8', '#ffffff'], ['#ffc84a', '#fff8e0'], ['#7fd38f', '#ffffff']], hash(i));
      box(ctx, sx + 4, y0 - 110, 5, 110, shade(wood, -6), 1, 2);
      box(ctx, sx + 125, y0 - 110, 5, 110, shade(wood, -6), 1, 2);
      awning(ctx, sx - 4, y0 - 100, 142, mix(c[0], t.mid, 0.1), mix(c[1], t.mid, 0.1), time, i);
      box(ctx, sx, y0 - 44, 134, 44, wood, 3, 5);
      box(ctx, sx - 4, y0 - 50, 142, 7, shade(wood, 8), 2, 3);
      // The goods: a basket of fruit, a string of fish, jars of cloud-honey.
      const kind = Math.floor(hash(i + 7) * 3);
      if (kind === 0) {
        ctx.fillStyle = mix('#c8a060', t.mid, 0.1);
        ctx.beginPath();
        ctx.ellipse(sx + 40, y0 - 52, 24, 9, 0, 0, Math.PI);
        ctx.fill();
        for (let k = 0; k < 6; k++) disc(ctx, sx + 22 + k * 7, y0 - 56 - (k % 2) * 5, 5, mix(pick(['#ff5a6a', '#ffb04a', '#9ae66a'], hash(i * 9 + k)), t.mid, 0.1));
      } else if (kind === 1) {
        for (let k = 0; k < 4; k++) {
          const fx = sx + 20 + k * 22;
          ctx.fillStyle = mix('#8ab8d8', t.mid, 0.1);
          ctx.beginPath();
          ctx.ellipse(fx, y0 - 72, 5, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(fx, y0 - 60);
          ctx.lineTo(fx - 5, y0 - 54);
          ctx.lineTo(fx + 5, y0 - 54);
          ctx.fill();
        }
        ctx.fillStyle = mix('#c8a878', t.mid, 0.1);
        ctx.fillRect(snap(sx + 10), snap(y0 - 86), 80, 2);
      } else {
        for (let k = 0; k < 5; k++) {
          const jx = sx + 14 + k * 16;
          box(ctx, jx, y0 - 66, 12, 16, mix('#ffd36b', t.mid, 0.15), 2, 3);
          box(ctx, jx - 1, y0 - 70, 14, 4, mix('#ff9ab8', t.mid, 0.1), 1, 2);
        }
      }
      // A lantern hung from the awning, swaying.
      const lx = sx + 110;
      const sw = Math.sin(time * 1.2 + i) * 2;
      ctx.strokeStyle = mix('#5a4a3a', t.mid, 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, y0 - 92);
      ctx.lineTo(lx + sw, y0 - 80);
      ctx.stroke();
      ctx.fillStyle = mix('#ff8a5a', t.mid, 0.1);
      ctx.beginPath();
      ctx.ellipse(lx + sw, y0 - 72, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      glow(ctx, lx + sw, y0 - 72, 16, '#ffd27a', 0.4);
      // Crates stacked by the stall.
      box(ctx, sx + 146, y0 - 30, 30, 30, wood, 3, 4);
      box(ctx, sx + 152, y0 - 54, 22, 24, shade(wood, 4), 2, 3);
      ctx.strokeStyle = shade(wood, -14);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + 146, y0 - 30);
      ctx.lineTo(sx + 176, y0);
      ctx.moveTo(sx + 176, y0 - 30);
      ctx.lineTo(sx + 146, y0);
      ctx.stroke();
    });
  },
  // Barnacle-crusted wall pieces and coral by the walkway, a weapon rack of harpoons.
  fortress(ctx, t, cam, width, y0, time) {
    repeat(cam.x, 0.45, 280, width, (i, x) => {
      const shell = mix('#e8c8c8', t.mid, 0.25);
      const wx = x + 20;
      const h = 70 + hash(i) * 30;
      box(ctx, wx, y0 - h, 90, h, shell, 5, 8);
      for (let c = 0; c < 4; c++) box(ctx, wx + c * 24, y0 - h - 12, 16, 12, shell, 2, 3);
      ctx.fillStyle = shade(shell, -8);
      for (let r = 1; r < 4; r++) ctx.fillRect(snap(wx), snap(y0 - h + r * (h / 4)), 90, 1.5);
      for (let k = 0; k < 7; k++) {
        const bx = wx + 8 + hash(i * 7 + k) * 74;
        const by = y0 - h + 10 + hash(i * 3 + k) * (h - 16);
        disc(ctx, bx, by, 4, mix('#f8f0e4', t.mid, 0.15));
        disc(ctx, bx, by, 1.6, shade(shell, -20));
      }
      // Coral and a sea fan at the wall's foot, swaying.
      const sw = Math.sin(time * 0.8 + i) * 3;
      ctx.strokeStyle = mix('#ff6a8a', t.mid, 0.15);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wx + 110, y0);
      ctx.quadraticCurveTo(wx + 110 + sw, y0 - 24, wx + 100 + sw, y0 - 44);
      ctx.moveTo(wx + 110 + sw * 0.5, y0 - 14);
      ctx.quadraticCurveTo(wx + 124 + sw, y0 - 26, wx + 128 + sw, y0 - 40);
      ctx.stroke();
      ctx.lineCap = 'butt';
      // A rack of harpoons.
      const rx = x + 190;
      const wood = mix('#8a6a4a', t.mid, 0.2);
      box(ctx, rx, y0 - 20, 50, 20, wood, 2, 3);
      for (let k = 0; k < 3; k++) {
        const hx = rx + 10 + k * 15;
        ctx.fillStyle = shade(wood, -6);
        ctx.fillRect(snap(hx), snap(y0 - 110), 3, 92);
        ctx.fillStyle = mix('#c8d0e0', t.mid, 0.1);
        ctx.beginPath();
        ctx.moveTo(hx - 4, y0 - 108);
        ctx.lineTo(hx + 1.5, y0 - 124);
        ctx.lineTo(hx + 7, y0 - 108);
        ctx.fill();
      }
    });
  },
};
