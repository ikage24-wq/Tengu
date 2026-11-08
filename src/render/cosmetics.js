// How the capsule skins (data/cosmetics.js) dress your chat bubble, name tag and damage numbers:
// the decorations drawn round them, each alive (petals drifting, a vine's leaves stirring).

const TAU = Math.PI * 2;

// A little five-petal blossom.
function blossom(ctx, x, y, r, c, centre = '#ffe36b', rot = 0) {
  ctx.fillStyle = c;
  for (let k = 0; k < 5; k++) {
    const a = rot + (k * TAU) / 5;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, r * 0.42, a, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = centre;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.32, 0, TAU);
  ctx.fill();
}
function leaf(ctx, x, y, len, ang, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.4, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.4, 0, 0);
  ctx.fill();
  ctx.restore();
}

// A twisted rope following a rounded rect: a brown line with cream twists along it.
function rope(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#8a5a32';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#e8cc98';
  ctx.setLineDash([1.2, 1.6]);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}
// A little anchor hanging from (x, y), swung by `a` radians.
function anchor(ctx, x, y, a, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0.8, 0.9, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 1.7);
  ctx.lineTo(0, 7);
  ctx.moveTo(-1.8, 3);
  ctx.lineTo(1.8, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 5, 2.6, 0.25, Math.PI - 0.25);
  ctx.stroke();
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 2.9, 5.2);
    ctx.lineTo(sd * 3.1, 3.8);
    ctx.lineTo(sd * 2, 5);
    ctx.fill();
  }
  ctx.restore();
}
// A tiny lighthouse standing at (x, y) (its foot), `on` 0..1 how bright its lamp is.
function tinyLighthouse(ctx, x, y, on) {
  const bands = ['#e8484a', '#ffffff', '#e8484a', '#ffffff'];
  bands.forEach((c, i) => {
    const y0 = y - i * 2.4;
    const w0 = 2.6 - i * 0.25;
    const w1 = 2.6 - (i + 1) * 0.25;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - w0, y0);
    ctx.lineTo(x + w0, y0);
    ctx.lineTo(x + w1, y0 - 2.4);
    ctx.lineTo(x - w1, y0 - 2.4);
    ctx.fill();
  });
  ctx.fillStyle = '#1f3358';
  ctx.fillRect(x - 2.4, y - 10.2, 4.8, 0.8);
  ctx.fillStyle = on > 0.5 ? '#fff6c8' : '#ffe08a';
  ctx.fillRect(x - 1.3, y - 12.4, 2.6, 2.2);
  ctx.fillStyle = '#e8484a';
  ctx.beginPath();
  ctx.arc(x, y - 12.4, 1.8, Math.PI, 0);
  ctx.fill();
  if (on > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 * on;
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(x, y - 11.3, 3.4 * on + 1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// A little glowing ember at (x, y).
function ember(ctx, x, y, r, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= a * 0.5;
  ctx.fillStyle = '#ff7a2a';
  ctx.beginPath();
  ctx.arc(x, y, r * 2.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = '#fff0a0';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// A tiny molten crown floating at (x, y), its five points, a lava gem.
function tinyCrown(ctx, x, y, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= 0.45;
  ctx.fillStyle = '#ff9a3a';
  ctx.beginPath();
  ctx.arc(x, y - 1.4, 5, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffcf4a';
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  for (const [dx, h] of [[-4, 2.4], [-2, 3.4], [0, 4.6], [2, 3.4], [4, 2.4]]) {
    ctx.lineTo(x + dx - 0.6, y - 0.6);
    ctx.lineTo(x + dx, y - h - Math.sin(time * 8 + dx) * 0.3);
    ctx.lineTo(x + dx + 0.6, y - 0.6);
  }
  ctx.lineTo(x + 4, y);
  ctx.lineTo(x + 4, y + 1.2);
  ctx.lineTo(x - 4, y + 1.2);
  ctx.fill();
  ctx.fillStyle = '#ff5a1a';
  ctx.beginPath();
  ctx.arc(x, y + 0.5, 0.8, 0, TAU);
  ctx.fill();
}

// Round a chat bubble (bx, by, w, h): a blossom tucked on its corner, petals drifting off it.
export function bubbleDeco(ctx, deco, bx, by, w, h, time) {
  if (deco === 'molten') {
    // Obsidian with a gold edge: lava cracks glowing along its foot, molten drops gathering and
    // falling off it, embers rising from its top corners.
    ctx.save();
    ctx.strokeStyle = '#ff5a1a';
    ctx.lineWidth = 0.9;
    ctx.globalAlpha *= 0.6 + 0.4 * Math.sin(time * 3);
    ctx.beginPath();
    ctx.moveTo(bx + 3, by + h - 1.6);
    ctx.lineTo(bx + w * 0.3, by + h - 2.6);
    ctx.lineTo(bx + w * 0.45, by + h - 1.4);
    ctx.lineTo(bx + w * 0.7, by + h - 2.4);
    ctx.lineTo(bx + w - 3, by + h - 1.6);
    ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 2; k++) {
      const u = (time * 0.7 + k * 0.5) % 1;
      const dx = bx + w * (0.32 + k * 0.4);
      ctx.fillStyle = '#ff7a2a';
      ctx.beginPath();
      ctx.ellipse(dx, by + h + (u < 0.5 ? u * 2 : 1 + (u - 0.5) * 14), 0.9, u < 0.5 ? 0.8 + u * 1.6 : 1, 0, 0, TAU);
      ctx.fill();
    }
    for (let k = 0; k < 3; k++) {
      const u = (time * 0.5 + k / 3) % 1;
      ember(ctx, (k % 2 ? bx + w - 2 : bx + 2) + Math.sin(u * 6 + k) * 1.5, by - u * 10, 0.6, Math.sin(Math.PI * u));
    }
  }
  if (deco === 'rope') {
    // The keeper's logbook page: a rope round its edge and a brass ship's bell at the corner,
    // swinging and now and then ringing (a little shake and two sound arcs).
    rope(ctx, bx - 0.6, by - 0.6, w + 1.2, h + 1.2, 5);
    const ring = (time % 3.2) < 0.5;
    const sw = Math.sin(time * (ring ? 18 : 2)) * (ring ? 0.35 : 0.12);
    ctx.save();
    ctx.translate(bx + w - 3, by - 1.6);
    ctx.rotate(sw);
    ctx.fillStyle = '#d8a440';
    ctx.beginPath();
    ctx.moveTo(-1.4, 0.6);
    ctx.quadraticCurveTo(-1.6, 3.4, -2.6, 4.2);
    ctx.lineTo(2.6, 4.2);
    ctx.quadraticCurveTo(1.6, 3.4, 1.4, 0.6);
    ctx.quadraticCurveTo(0, -0.6, -1.4, 0.6);
    ctx.fill();
    ctx.fillStyle = '#f4d488';
    ctx.fillRect(-0.9, 1, 0.6, 2.6);
    ctx.fillStyle = '#8a5a32';
    ctx.beginPath();
    ctx.arc(0, 4.6, 0.7, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (ring) {
      ctx.save();
      ctx.strokeStyle = '#d8a440';
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = 1 - (time % 3.2) / 0.5;
      for (const k of [1, 2]) {
        ctx.beginPath();
        ctx.arc(bx + w - 3, by + 1, 3 + k * 1.6 + ((time % 3.2) / 0.5) * 2, -1.1, -0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  if (deco === 'petals') {
    blossom(ctx, bx + w - 2, by + 1, 4.4, '#ff9ec8', '#ffe36b', time * 0.3);
    blossom(ctx, bx + 3, by + h - 1, 3, '#ffc8de', '#ffe36b', -time * 0.4);
    for (let k = 0; k < 3; k++) {
      const u = (time * 0.35 + k / 3) % 1;
      ctx.globalAlpha *= 1;
      ctx.fillStyle = '#ffb8d4';
      ctx.beginPath();
      ctx.ellipse(bx + w + 2 + u * 8 + Math.sin(u * 8 + k) * 2, by + 4 + u * 14, 1.4, 0.9, u * 6, 0, TAU);
      ctx.fill();
    }
  }
}

// Your name tag, skinned (centred at x, its top at y): its own colours and its decoration.
export function drawSkinTag(ctx, skin, x, y, label, time, hot = false) {
  const w = ctx.measureText(label).width + 12;
  const left = x - w / 2;
  ctx.fillStyle = hot ? '#ffffff' : skin.fill;
  ctx.strokeStyle = skin.edge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(left, y, w, 10, 5);
  ctx.fill();
  ctx.stroke();
  if (skin.deco === 'vine') {
    // A vine curling off both ends, its leaves stirring.
    for (const [ex, dir] of [[left, -1], [left + w, 1]]) {
      ctx.strokeStyle = '#4fae5f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex, y + 5);
      ctx.quadraticCurveTo(ex + dir * 5, y + 1, ex + dir * 6, y + 6);
      ctx.stroke();
      leaf(ctx, ex + dir * 2.4, y + 3, 4, dir < 0 ? Math.PI + 0.5 + Math.sin(time * 2) * 0.15 : -0.5 + Math.sin(time * 2) * 0.15, '#9be08a');
      leaf(ctx, ex + dir * 5.4, y + 6, 3.4, dir < 0 ? Math.PI - 0.6 : 0.6, '#7fd17a');
    }
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(left + w / 2 - w * 0.38, y - 0.6, 1.4, 0, TAU);
    ctx.fill();
  }
  if (skin.deco === 'anchor') {
    // A rope twisted round the tag and a little anchor hanging from it, swaying.
    rope(ctx, left - 0.5, y - 0.5, w + 1, 11, 5.5);
    anchor(ctx, left + w - 5, y + 10, Math.sin(time * 1.6) * 0.25, '#f4ecd8');
  }
  if (skin.deco === 'beacon') {
    // A gold-edged night-blue tag, a tiny lighthouse at its end, its beam sweeping across the tag
    // and its lamp flashing as the beam comes round.
    const u = (time / 2.6) % 1;
    const bxp = left + 4 + u * (w + 4);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(left, y, w, 10, 5);
    ctx.clip();
    const g = ctx.createLinearGradient(bxp - 8, 0, bxp + 2, 0);
    g.addColorStop(0, 'rgba(255,230,150,0)');
    g.addColorStop(1, 'rgba(255,230,150,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(bxp - 8, y, 10, 10);
    ctx.restore();
    tinyLighthouse(ctx, left - 1, y + 10.4, u > 0.85 || u < 0.08 ? 1 : 0.25);
  }
  if (skin.deco === 'runes' || skin.deco === 'godcrown') {
    // Gold runes burning at both ends of the tag, a seam of lava under the name.
    const glow = 0.55 + 0.45 * Math.sin(time * 3);
    ctx.save();
    ctx.globalAlpha *= glow;
    ctx.fillStyle = '#ffcf4a';
    for (const ex of [left + 3, left + w - 3]) {
      ctx.fillRect(ex - 0.4, y + 2, 0.8, 6);
      ctx.fillRect(ex - 1.4, y + 4.2, 2.8, 0.7);
    }
    ctx.restore();
    ctx.fillStyle = '#ff5a1a';
    ctx.fillRect(left + 6, y + 8.6, w - 12, 0.6);
    if (skin.deco === 'godcrown') {
      // Over it floats the Forge God's crown, bobbing, its gem burning; embers drift off it.
      tinyCrown(ctx, x, y - 3 + Math.sin(time * 2) * 0.8, time);
      for (let k = 0; k < 2; k++) {
        const u = (time * 0.6 + k * 0.5) % 1;
        ember(ctx, x + (k ? 3 : -3) + Math.sin(u * 6) * 1, y - 6 - u * 8, 0.5, Math.sin(Math.PI * u));
      }
    }
  }
  if (skin.deco === 'seal') {
    // A shine sweeping across the gold now and then, and a wax seal pressed on its left end,
    // a sprout stamped in it.
    const u = (time / 3.2) % 1;
    if (u < 0.35) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(left, y, w, 10, 5);
      ctx.clip();
      const sx = left - 6 + (u / 0.35) * (w + 12);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + 4, y);
      ctx.lineTo(sx + 1, y + 10);
      ctx.lineTo(sx - 3, y + 10);
      ctx.fill();
      ctx.restore();
    }
    const cx = left - 1;
    const cy = y + 5;
    ctx.fillStyle = '#c8403a';
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k * TAU) / 10;
      const r = k % 2 ? 5 : 5.8;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.fill();
    ctx.fillStyle = '#a82c2a';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ffb0a0';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2.4);
    ctx.lineTo(cx, cy - 0.4);
    ctx.stroke();
    leaf(ctx, cx, cy - 0.2, 2.6, -2.4 + Math.sin(time * 2) * 0.1, '#ffb0a0');
    leaf(ctx, cx, cy - 0.2, 2.6, -0.7 - Math.sin(time * 2) * 0.1, '#ffb0a0');
  }
  ctx.fillStyle = hot ? skin.fill : skin.text;
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 7.6);
  ctx.textAlign = 'left';
}

// Over one of your damage numbers, skinned: petals bursting off it as it pops.
export function numberDeco(ctx, deco, x, y, size, age) {
  if (deco === 'hammerfall' && age < 0.6) {
    // A hammer of light slams down on the number as it pops: a shock ring and sparks.
    const cy = y - size * 0.35;
    ctx.save();
    if (age < 0.12) {
      const u = age / 0.12;
      ctx.globalAlpha *= 0.9;
      ctx.translate(x + size * 0.3, cy - size * (1.6 - u * 1.2));
      ctx.rotate(-0.9 + u * 0.9);
      ctx.fillStyle = '#ffcf4a';
      ctx.fillRect(-0.6, -1, 1.2, size * 0.9);
      ctx.fillStyle = '#2a2232';
      ctx.fillRect(-size * 0.3, -size * 0.22, size * 0.6, size * 0.3);
      ctx.fillStyle = '#ff7a2a';
      ctx.fillRect(-size * 0.3, -size * 0.22, size * 0.06, size * 0.3);
      ctx.fillRect(size * 0.24, -size * 0.22, size * 0.06, size * 0.3);
    } else {
      const u = (age - 0.12) / 0.48;
      ctx.globalAlpha *= 1 - u;
      ctx.strokeStyle = '#ffb04a';
      ctx.lineWidth = 1.2 * (1 - u) + 0.3;
      ctx.beginPath();
      ctx.ellipse(x, cy, size * (0.6 + u * 1.2), size * (0.25 + u * 0.4), 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#fff0a0';
      for (let k = 0; k < 6; k++) {
        const a2 = -Math.PI * (0.1 + k * 0.16);
        const d = size * (0.5 + u * 1.1);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a2) * d, cy + Math.sin(a2) * d * 0.8 + u * u * size * 0.6, 1, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }
  if (deco === 'beam' && age < 0.55) {
    // A lighthouse flash behind the number: rays of light turning out from it as it pops.
    const u = age / 0.55;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= (1 - u) * 0.6;
    ctx.fillStyle = '#ffe9a0';
    const cy = y - size * 0.35;
    for (let k = 0; k < 6; k++) {
      const a = (k * TAU) / 6 + u * 1.4;
      const r0 = size * 0.5;
      const r1 = size * (0.9 + u * 1.2);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a - 0.12) * r0, cy + Math.sin(a - 0.12) * r0 * 0.7);
      ctx.lineTo(x + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7);
      ctx.lineTo(x + Math.cos(a + 0.12) * r0, cy + Math.sin(a + 0.12) * r0 * 0.7);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  if (deco !== 'petals' || age > 0.5) return;
  const u = age / 0.5;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  for (let k = 0; k < 5; k++) {
    const a = (k * TAU) / 5 + 0.4;
    const d = size * 0.4 + u * size * 0.9;
    ctx.fillStyle = k % 2 ? '#ff9ec8' : '#ffd8e8';
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * d, y - size * 0.35 + Math.sin(a) * d * 0.7, 2.2, 1.4, a + u * 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
