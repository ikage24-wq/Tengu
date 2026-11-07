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

// Round a chat bubble (bx, by, w, h): a blossom tucked on its corner, petals drifting off it.
export function bubbleDeco(ctx, deco, bx, by, w, h, time) {
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
  ctx.fillStyle = hot ? skin.fill : skin.text;
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 7.6);
  ctx.textAlign = 'left';
}

// Over one of your damage numbers, skinned: petals bursting off it as it pops.
export function numberDeco(ctx, deco, x, y, size, age) {
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
