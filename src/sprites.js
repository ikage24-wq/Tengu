// Cute procedural sprites: customizable chibi characters and soft-styled mobs.
// Everything is drawn with canvas paths, so there are no image assets to load.

const OUTLINE = '#2a2440';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRound(ctx, x, y, w, h, r, color) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function ellipse(ctx, x, y, rx, ry, color, outline = true) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// Hair is drawn behind the face for long/bob and on top for spiky/bun.
function drawHair(ctx, style, color, cx, cy, r, dir) {
  ctx.fillStyle = color;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  if (style === 'long') {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, Math.PI, 0);
    ctx.lineTo(cx + r + 4, cy + 22);
    ctx.lineTo(cx - r - 4, cy + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'bob') {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, Math.PI, 0);
    ctx.lineTo(cx + r + 2, cy + 9);
    ctx.lineTo(cx - r - 2, cy + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'spiky') {
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - 2);
    ctx.lineTo(cx - r + 2, cy - r - 8);
    ctx.lineTo(cx - 3, cy - r + 1);
    ctx.lineTo(cx, cy - r - 10);
    ctx.lineTo(cx + 3, cy - r + 1);
    ctx.lineTo(cx + r - 2, cy - r - 8);
    ctx.lineTo(cx + r, cy - 2);
    ctx.arc(cx, cy, r, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'bun') {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ellipse(ctx, cx + dir * -2, cy - r - 4, 6, 6, color);
  }
  if (style === 'bald') {
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 3, Math.PI, 0);
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function drawEyes(ctx, style, color, cx, cy, dir) {
  for (const side of [-1, 1]) {
    const ex = cx + side * 5 + dir;
    if (style === 'sleepy') {
      ctx.beginPath();
      ctx.arc(ex, cy, 3, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      continue;
    }
    ellipse(ctx, ex, cy, 2.6, 3.4, color, false);
    if (style === 'sparkle') {
      ellipse(ctx, ex + 0.9, cy - 1.2, 1.1, 1.1, '#ffffff', false);
    }
  }
}

// Draws the player. `p` is the physics body; sx is its screen-space x.
export function drawCharacter(ctx, p, sx, appearance, accentColor, time) {
  const walking = Math.abs(p.vx) > 1 && p.onGround;
  const stride = walking ? Math.sin(time * 14) : 0;
  const bob = walking ? Math.abs(Math.sin(time * 14)) * -2 : Math.sin(time * 3) * 0.6;
  const x = sx;
  const y = p.y + bob;
  const dir = p.dir >= 0 ? 1 : -1;
  const cx = x + p.w / 2;

  // Legs, alternating while walking.
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(cx - 7 + stride * 2, y + 42, 5, 6);
  ctx.fillRect(cx + 2 - stride * 2, y + 42, 5, 6);

  // Body and outfit with a class-colored belt.
  fillRound(ctx, cx - 9, y + 25, 18, 19, 7, appearance.outfitColor);
  fillRound(ctx, cx - 9, y + 36, 18, 4, 2, accentColor);

  // Head.
  const headY = y + 14;
  const headR = 12;
  ellipse(ctx, cx, headY, headR, headR, appearance.skinTone);

  // Hair behind the head for long/bob, on top for others.
  const hairBehind = appearance.hairStyle === 'long' || appearance.hairStyle === 'bob';
  if (hairBehind) drawHair(ctx, appearance.hairStyle, appearance.hairColor, cx, headY, headR, dir);

  drawEyes(ctx, appearance.eyeStyle, appearance.eyeColor, cx, headY + 2, dir);

  // Blush.
  ctx.fillStyle = 'rgba(255,120,150,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx - 7 + dir, headY + 6, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 7 + dir, headY + 6, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!hairBehind) drawHair(ctx, appearance.hairStyle, appearance.hairColor, cx, headY, headR, dir);
}

function drawSnail(ctx, mob, sx, t) {
  const y = mob.y;
  // Body.
  fillRound(ctx, sx, y + mob.h - 12, mob.w, 12, 6, '#ffe9a8');
  // Shell with a spiral.
  ellipse(ctx, sx + mob.w * 0.55, y + mob.h - 14, 10, 10, '#ff9e6b');
  ctx.beginPath();
  ctx.arc(sx + mob.w * 0.55, y + mob.h - 14, 5, 0, Math.PI * 1.6);
  ctx.strokeStyle = '#ffe0c7';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Eye stalks wobble a little.
  const wob = Math.sin(t * 2) * 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx + 6, y + mob.h - 12);
  ctx.lineTo(sx + 5 + wob, y + mob.h - 22);
  ctx.stroke();
  ellipse(ctx, sx + 5 + wob, y + mob.h - 23, 2.5, 2.5, '#ffffff');
  ellipse(ctx, sx + 5 + wob, y + mob.h - 23, 1, 1, OUTLINE, false);
}

function drawMushroom(ctx, mob, sx, t) {
  const y = mob.y + Math.sin(t * 3) * 0.8;
  // Stem with a face.
  fillRound(ctx, sx + mob.w * 0.3, y + mob.h * 0.5, mob.w * 0.4, mob.h * 0.5, 5, '#fff1dc');
  ellipse(ctx, sx + mob.w * 0.42, y + mob.h * 0.7, 1.6, 2, OUTLINE, false);
  ellipse(ctx, sx + mob.w * 0.58, y + mob.h * 0.7, 1.6, 2, OUTLINE, false);
  // Cap with spots.
  ctx.beginPath();
  ctx.arc(sx + mob.w / 2, y + mob.h * 0.5, mob.w * 0.5, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = '#ff7a59';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ellipse(ctx, sx + mob.w * 0.3, y + mob.h * 0.35, 3, 2.5, '#ffffff', false);
  ellipse(ctx, sx + mob.w * 0.7, y + mob.h * 0.3, 2.5, 2, '#ffffff', false);
}

function drawWolf(ctx, mob, sx, t, dir) {
  const bob = Math.sin(t * 10) * 1;
  const y = mob.y + bob;
  // Tail.
  ctx.strokeStyle = '#7b7d93';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const tailX = dir > 0 ? sx + 4 : sx + mob.w - 4;
  ctx.moveTo(tailX, y + mob.h * 0.5);
  ctx.quadraticCurveTo(tailX - dir * 10, y - 4, tailX - dir * 4, y + 4);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // Body and head.
  fillRound(ctx, sx + 4, y + mob.h * 0.35, mob.w - 8, mob.h * 0.6, 10, '#8d8fa6');
  const headX = dir > 0 ? sx + mob.w - 12 : sx + 2;
  fillRound(ctx, headX, y + 2, 14, 16, 6, '#8d8fa6');
  // Ears.
  ctx.fillStyle = '#8d8fa6';
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(headX + 2, y + 4);
  ctx.lineTo(headX + 4, y - 4);
  ctx.lineTo(headX + 8, y + 3);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, headX + 9 + dir * 2, y + 8, 2.2, 2.6, '#ffd34d', false);
  ellipse(ctx, headX + 9 + dir * 2, y + 8, 0.9, 1.8, OUTLINE, false);
}

function drawGolem(ctx, mob, sx, t) {
  const bob = Math.sin(t * 2) * 1.2;
  const y = mob.y + bob;
  // Rounded rock body with a mossy top and a sleepy face.
  fillRound(ctx, sx, y + 4, mob.w, mob.h - 4, 16, '#b49872');
  fillRound(ctx, sx + 6, y + 2, mob.w - 12, 10, 5, '#7fb069');
  ellipse(ctx, sx + mob.w * 0.36, y + mob.h * 0.45, 3, 3, '#2a2440', false);
  ellipse(ctx, sx + mob.w * 0.64, y + mob.h * 0.45, 3, 3, '#2a2440', false);
  ctx.beginPath();
  ctx.arc(sx + mob.w / 2, y + mob.h * 0.6, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

// Draws a mob at screen x `sx`. `dir` is its patrol direction.
export function drawMob(ctx, mob, sx, time) {
  const dir = mob.dir ?? 1;
  if (mob.typeId === 'snail') drawSnail(ctx, mob, sx, time);
  else if (mob.typeId === 'mushroom') drawMushroom(ctx, mob, sx, time);
  else if (mob.typeId === 'wolf') drawWolf(ctx, mob, sx, time, dir);
  else if (mob.typeId === 'golem') drawGolem(ctx, mob, sx, time);
}
