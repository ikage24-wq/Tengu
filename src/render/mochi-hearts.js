// What the Mochi feel and say to each other, over their heads (world/mochi-heart.js,
// world/garden-life.js): a little bubble with an icon when a feeling comes over one (a note for joy,
// a heart for love, a storm cloud for a sulk, a tear when it's lonely...) - and a sulk, a yawn or a
// lonely sigh keeps a small mark bobbing over it while it lasts; the picture words two friends trade
// in a chat; a game's invitation, and a "no thanks"; the counting in hide-and-seek, and "found you!".

import { feelingOf, FEELINGS } from '../world/mochi-heart.js';

const TAU = Math.PI * 2;
const INK = '#5a3a5a';

function bubble(ctx, x, y, alpha, w = 7.5) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e8c8d8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, w, 6, 0, 0, TAU);
  ctx.moveTo(x - 2, y + 5);
  ctx.lineTo(x - 1, y + 9);
  ctx.lineTo(x + 2, y + 5);
  ctx.fill();
  ctx.stroke();
}
function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - s * 0.5, y, s * 0.6, 0, TAU);
  ctx.arc(x + s * 0.5, y, s * 0.6, 0, TAU);
  ctx.moveTo(x - s * 1.08, y + s * 0.2);
  ctx.lineTo(x, y + s * 1.4);
  ctx.lineTo(x + s * 1.08, y + s * 0.2);
  ctx.fill();
}
function starShape(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const q = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
  }
  ctx.closePath();
  ctx.fill();
}
function drop(ctx, x, y, s, color, lean = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.6);
  ctx.quadraticCurveTo(s * 1.1, 0, 0, s);
  ctx.quadraticCurveTo(-s * 1.1, 0, 0, -s * 1.6);
  ctx.fill();
  ctx.restore();
}
function word(ctx, text, x, y, color, size = 8) {
  ctx.fillStyle = color;
  ctx.font = `900 ${size}px Nunito, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}
// An icon, centred at (x, y): a feeling's or a picture word's.
export function drawIcon(ctx, icon, x, y, time = 0) {
  switch (icon) {
    case 'note': {
      ctx.fillStyle = '#ff6f9a';
      ctx.strokeStyle = '#ff6f9a';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(x - 1.2, y + 2, 1.5, 1.1, -0.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 0.2, y + 1.8);
      ctx.lineTo(x + 0.2, y - 3.4);
      ctx.quadraticCurveTo(x + 2.4, y - 2.2, x + 1.8, y + 0.2);
      ctx.stroke();
      return;
    }
    case 'bang':
      return word(ctx, '!', x, y + 3, '#ff8a3a', 9);
    case 'q':
      return word(ctx, '?', x, y + 3, '#7a8ad8', 8.5);
    case 'star':
      return starShape(ctx, x, y, 3.6, '#ffc83a');
    case 'heart':
      return heart(ctx, x, y - 0.6, 2.6, '#ff6f9a');
    case 'cloud': {
      ctx.fillStyle = '#9a90a8';
      for (const [dx, dy, r] of [[-2.4, 0.4, 2], [0, -1, 2.6], [2.4, 0.4, 2]]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = '#ffd040';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + 0.4, y + 1.6);
      ctx.lineTo(x - 0.8, y + 3.4);
      ctx.lineTo(x + 0.6, y + 3.4);
      ctx.lineTo(x - 0.4, y + 5.2);
      ctx.stroke();
      return;
    }
    case 'tear':
      return drop(ctx, x, y + 0.6, 1.8, '#6ab4f0');
    case 'sweat':
      return drop(ctx, x + 0.5, y + 0.4, 1.6, '#8fd3ff', 0.5);
    case 'zzz':
      word(ctx, 'z', x - 1.6, y + 3, '#8a9ad8', 6.5);
      return word(ctx, 'z', x + 1.8, y - 0.4, '#8a9ad8', 5);
    case 'dots':
      ctx.fillStyle = '#a88a9e';
      for (const dx of [-2.6, 0, 2.6]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + 0.5, 0.9, 0, TAU);
        ctx.fill();
      }
      return;
    case 'anger': {
      ctx.strokeStyle = '#ff5a5a';
      ctx.lineWidth = 1.1;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(x + sx * 0.8, y + sy * 2.6);
        ctx.quadraticCurveTo(x + sx * 0.8, y + sy * 0.8, x + sx * 2.6, y + sy * 0.8);
        ctx.stroke();
      }
      return;
    }
    // Picture words.
    case 'sweet':
      ctx.fillStyle = '#c8945a';
      ctx.fillRect(x - 3.6, y - 0.3, 7.2, 0.7);
      for (const [dx, c] of [[-2.2, '#ffb3c8'], [0, '#fff8f2'], [2.2, '#9fd87a']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x + dx, y, 1.3, 0, TAU);
        ctx.fill();
      }
      return;
    case 'ball':
      ctx.fillStyle = '#ff6f8a';
      ctx.beginPath();
      ctx.arc(x, y, 2.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2.8, -0.3, Math.PI * 0.7);
      ctx.fill();
      return;
    case 'kite':
      ctx.fillStyle = '#ff9ec0';
      ctx.beginPath();
      ctx.moveTo(x, y - 3.4);
      ctx.lineTo(x + 2.6, y - 0.4);
      ctx.lineTo(x, y + 3);
      ctx.lineTo(x - 2.6, y - 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8fd3ff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.quadraticCurveTo(x + 2, y + 4, x + 3.4, y + 3.4);
      ctx.stroke();
      return;
    case 'sun':
      ctx.strokeStyle = '#ffc83a';
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + time * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6);
        ctx.lineTo(x + Math.cos(a) * 3.8, y + Math.sin(a) * 3.8);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffd64a';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, TAU);
      ctx.fill();
      return;
    case 'flower':
      ctx.fillStyle = '#ffb3c8';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 1.7, y + Math.sin(a) * 1.7, 1.3, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd64a';
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, TAU);
      ctx.fill();
      return;
    case 'fish':
      ctx.fillStyle = '#6ab4f0';
      ctx.beginPath();
      ctx.ellipse(x - 0.6, y, 2.6, 1.6, 0, 0, TAU);
      ctx.moveTo(x + 1.6, y);
      ctx.lineTo(x + 3.6, y - 1.6);
      ctx.lineTo(x + 3.6, y + 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 2, y - 0.6, 0.7, 0.7);
      return;
    case 'rain':
      ctx.fillStyle = '#b8c4d8';
      for (const [dx, r] of [[-1.6, 1.6], [0.6, 2], [2.2, 1.4]]) {
        ctx.beginPath();
        ctx.arc(x + dx, y - 1, r, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#6ab4f0';
      for (const dx of [-1.6, 0.4, 2.2]) ctx.fillRect(x + dx, y + 1.6, 0.6, 1.4);
      return;
    case 'moon':
      ctx.fillStyle = '#ffe680';
      ctx.beginPath();
      ctx.arc(x, y, 2.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 1.3, y - 0.9, 2.4, 0, TAU);
      ctx.fill();
      return;
    case 'you':
      // (You: a little face with a pink bow.)
      ctx.fillStyle = '#ffe2d0';
      ctx.beginPath();
      ctx.arc(x, y + 0.4, 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#7a5a8a';
      ctx.beginPath();
      ctx.arc(x, y - 0.6, 2.5, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff6f9a';
      ctx.beginPath();
      ctx.ellipse(x + 2, y - 2.4, 1.1, 0.7, 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillRect(x - 1, y + 0.4, 0.6, 0.7);
      ctx.fillRect(x + 0.6, y + 0.4, 0.6, 0.7);
      return;
    default:
      word(ctx, String(icon), x, y + 3, '#ff6f9a', 8);
  }
}

const GAME_ICON = { tag: 'ball', hide: 'q', chat: 'heart', trick: 'star', dance: 'note', snack: 'sweet', comfort: 'heart', makeup: 'flower' };
// Everything over their heads, in the garden (render/garden.js draws it after the Mochi).
export function drawHearts(ctx, world, life, cam, time) {
  const now = world.now;
  const headY = (e) => e.y - cam.y - (e.m.size === 'baby' ? 40 : 48);
  ctx.save();
  // Feelings: a pop of a bubble as one comes over it; a little mark that stays for the lingering ones.
  for (const e of life.mochi) {
    if (e.hidden || e.x == null || e.duo) continue;
    const f = feelingOf(e, now);
    if (!f) continue;
    const icon = FEELINGS[f.kind].icon;
    const t = now - f.t0;
    const x = e.x - cam.x + 5;
    const y = headY(e);
    if (t < 2.2) {
      const a = Math.min(1, t * 5, (2.2 - t) * 2.5);
      const pop = 1 + Math.max(0, 0.3 - t) * 1.2;
      bubble(ctx, x, y - Math.sin(t * 4) * 0.8, a, 7.5 * pop);
      ctx.globalAlpha = a;
      drawIcon(ctx, icon, x, y - Math.sin(t * 4) * 0.8, time);
    } else if (['sulky', 'sleepy', 'lonely'].includes(f.kind) && f.k >= 0.5 && !e.thought) {
      const fade = Math.min(1, (f.until - now) / 1.5, (t - 2.2) / 0.6);
      ctx.globalAlpha = 0.85 * fade;
      drawIcon(ctx, icon, x + 2, y + 3 - Math.sin(time * 2 + e.rec.seed) * 1.2, time);
    }
  }
  // Two together: what they're up to, said in pictures.
  for (const d of life.duos ?? []) {
    const t = d.t ?? now - d.t0;
    const over = (e, icon, t0, len = 1.5, wide = 7.5) => {
      const u = t - t0;
      if (u < 0 || u > len || e.hidden || e.x == null) return;
      const a = Math.min(1, u * 6, (len - u) * 3);
      const x = e.x - cam.x + 4;
      const y = headY(e) - Math.sin(u * 4) * 0.8;
      bubble(ctx, x, y, a, wide);
      ctx.globalAlpha = a;
      drawIcon(ctx, icon, x, y, time);
    };
    if (d.kind === 'decline') {
      over(d.a, GAME_ICON[d.asked] ?? 'heart', 0, 1.0);
      over(d.b, 'dots', 0.4, 1.6);
    } else if (d.kind === 'squabble') {
      over(d.a, 'anger', 0.3, 2.2);
      over(d.b, 'anger', 0.5, 2.2);
    } else {
      // The asking: what it wants to do, over its head as it gets there.
      if (d.kind !== 'comfort') over(d.a, GAME_ICON[d.kind] ?? 'heart', 0, 1.3);
      if (d.kind === 'chat' && d.say) {
        over(d.a, d.say[0], 0.5, 1.5);
        over(d.b, d.say[1], 2.3, 1.5);
        over(d.a, d.say[2], 4.1, 1.4);
        over(d.b, d.say[3], 5.0, 1.2);
      }
      if (d.kind === 'hide') {
        // Counting: three, two, one... and "there you are!"
        for (const [i, n] of ['3', '2', '1'].entries()) over(d.b, n, 0.6 + i * 1, 0.95);
        if (d.found != null) over(d.b, 'bang', d.found - d.t0, 1.4);
      }
      if (d.kind === 'comfort') over(d.a, 'heart', 2.6, 2);
      if (d.kind === 'makeup') over(d.a, 'flower', 0.4, 1.8);
    }
  }
  ctx.restore();
}
