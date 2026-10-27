// The Boss Rush booth in Sprout Village (Roxy's stage): a small stage under a neon marquee whose
// bulbs chase round, red velvet curtains, wanted-style posters of the bosses you can challenge,
// a gold trophy, and spotlights that cross over the stage now and then.

const neon = (ctx, col, w, path, k = 1) => {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = col;
  ctx.globalAlpha = 0.25 * k;
  ctx.lineWidth = w * 3;
  path();
  ctx.stroke();
  ctx.globalAlpha = k;
  ctx.lineWidth = w;
  path();
  ctx.stroke();
  ctx.restore();
};

function bulbs(ctx, pts, time, phase = 0) {
  const run = Math.floor(time * 10);
  pts.forEach(([x, y], i) => {
    const on = (i + run + phase) % 4 < 2;
    if (on) {
      ctx.fillStyle = 'rgba(255,240,170,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = on ? '#fff6c8' : '#9a6a4a';
    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// A boss poster: a dark frame, a coloured backdrop, the boss's silhouette and a name strip.
function poster(ctx, x, y, w, h, kind, time) {
  ctx.fillStyle = '#c99a3e';
  ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  const C = { green: ['#ff6ab4', '#5a1f7a'], crystal: ['#8fd8ff', '#3a2f7a'], locked: ['#5a5070', '#2a2238'] }[kind];
  bg.addColorStop(0, C[0]);
  bg.addColorStop(1, C[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#1a1028';
  const cx = x + w / 2;
  const by = y + h - 6;
  if (kind === 'green') {
    // Bunny ears, a big head of hair, shades, the point.
    ctx.beginPath();
    ctx.ellipse(cx, by - 13, 7, 6, 0, 0, Math.PI * 2);
    ctx.moveTo(cx - 4, by - 17); ctx.lineTo(cx - 5, by - 27); ctx.lineTo(cx - 2, by - 27); ctx.lineTo(cx - 1, by - 18);
    ctx.moveTo(cx + 2, by - 18); ctx.lineTo(cx + 3, by - 28); ctx.lineTo(cx + 6, by - 27); ctx.lineTo(cx + 4, by - 17);
    ctx.fill();
    ctx.fillRect(cx - 4, by - 8, 8, 8);
    ctx.fillRect(cx + 3, by - 22, 2, 14);
    ctx.fillStyle = '#ff5bb0';
    ctx.fillRect(cx - 5, by - 14, 10, 2);
  } else if (kind === 'crystal') {
    ctx.beginPath();
    ctx.moveTo(cx - 9, by); ctx.lineTo(cx - 6, by - 16); ctx.lineTo(cx - 3, by - 10); ctx.lineTo(cx, by - 22); ctx.lineTo(cx + 3, by - 10); ctx.lineTo(cx + 6, by - 16); ctx.lineTo(cx + 9, by);
    ctx.fill();
    ctx.fillStyle = '#bff0ff';
    ctx.fillRect(cx - 1, by - 15, 2, 2);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', cx, by - 6);
  }
  ctx.fillStyle = 'rgba(20,10,30,0.75)';
  ctx.fillRect(x, y + h - 5, w, 5);
  ctx.fillStyle = kind === 'locked' ? '#8a80a0' : '#ffe36b';
  ctx.fillRect(x + 3, y + h - 3.2, w - 6, 1.2);
  // A glint sweeping over the posters.
  const g = ((time * 0.6 + x * 0.01) % 2) - 0.5;
  if (g > 0 && g < 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(x + g * w - 3, y); ctx.lineTo(x + g * w + 1, y); ctx.lineTo(x + g * w - 6, y + h); ctx.lineTo(x + g * w - 10, y + h);
    ctx.fill();
  }
}

function trophy(ctx, x, y, time) {
  ctx.fillStyle = '#7a5a2a';
  ctx.fillRect(x - 5, y - 4, 10, 4);
  ctx.fillStyle = '#e8b850';
  ctx.fillRect(x - 1.5, y - 9, 3, 5);
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 19); ctx.lineTo(x + 6, y - 19); ctx.quadraticCurveTo(x + 6, y - 9, x, y - 9); ctx.quadraticCurveTo(x - 6, y - 9, x - 6, y - 19);
  ctx.fill();
  ctx.strokeStyle = '#e8b850';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x - 6.5, y - 15, 2.5, Math.PI * 0.5, Math.PI * 1.5);
  ctx.moveTo(x + 6.5, y - 17.5);
  ctx.arc(x + 6.5, y - 15, 2.5, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#fff3b0';
  ctx.fillRect(x - 3.5, y - 18, 1.5, 6);
  // A twinkle on the cup.
  const tw = Math.max(0, Math.sin(time * 2.4));
  if (tw > 0.8) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y - 21, 1, 5);
    ctx.fillRect(x - 0.5, y - 19, 6, 1);
  }
}

function curtain(ctx, x, top, h, side, time) {
  const sway = Math.sin(time * 1.3 + side) * 1.2;
  const g = ctx.createLinearGradient(x, 0, x + side * 16, 0);
  g.addColorStop(0, '#8a1428');
  g.addColorStop(0.5, '#d42a48');
  g.addColorStop(1, '#8a1428');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + side * 22, top);
  ctx.quadraticCurveTo(x + side * 8 + sway, top + h * 0.45, x + side * 6, top + h * 0.62);
  ctx.quadraticCurveTo(x + side * 3, top + h * 0.8, x + side * 4 + sway, top + h);
  ctx.lineTo(x, top + h);
  ctx.fill();
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath();
  ctx.ellipse(x + side * 6, top + h * 0.62, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// (x, gy): the booth's centre at the ground, in screen space.
export function drawArenaBooth(ctx, x, gy, time) {
  const W = 132;
  const L = x - W / 2;
  const top = gy - 108;
  // Back wall: a dark violet panel with a starry sheen.
  const wall = ctx.createLinearGradient(0, top + 24, 0, gy);
  wall.addColorStop(0, '#2a1840');
  wall.addColorStop(1, '#3f2458');
  ctx.fillStyle = wall;
  ctx.fillRect(L + 6, top + 24, W - 12, gy - top - 34);
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(time * 2 + i)})`;
    ctx.fillRect(Math.round(L + 10 + ((i * 37) % (W - 20))), Math.round(top + 28 + ((i * 23) % 40)), 1, 1);
  }
  // The posters.
  poster(ctx, L + 18, top + 38, 26, 32, 'crystal', time);
  poster(ctx, x - 15, top + 34, 30, 38, 'green', time);
  poster(ctx, L + W - 44, top + 38, 26, 32, 'locked', time);
  // The trophy on a little pedestal.
  ctx.fillStyle = '#5a3a72';
  ctx.fillRect(x - 8, gy - 16, 16, 6);
  trophy(ctx, x, gy - 16, time);
  // Pillars with chasing bulbs.
  for (const px of [L + 2, L + W - 10]) {
    ctx.fillStyle = '#4a2a62';
    ctx.fillRect(px, top + 20, 8, gy - top - 28);
    ctx.fillStyle = '#e8b850';
    ctx.fillRect(px, top + 20, 8, 2);
    bulbs(ctx, Array.from({ length: 9 }, (_, i) => [px + 4, top + 28 + i * 8.5]), time, px > x ? 2 : 0);
  }
  curtain(ctx, L + 10, top + 24, 62, 1, time);
  curtain(ctx, L + W - 10, top + 24, 62, -1, time);
  // The stage floor: a step with a gold rim and footlights.
  ctx.fillStyle = '#3a2250';
  ctx.fillRect(L - 2, gy - 10, W + 4, 10);
  ctx.fillStyle = '#e8b850';
  ctx.fillRect(L - 2, gy - 10, W + 4, 2);
  for (let i = 0; i < 8; i++) {
    const fx = L + 8 + i * ((W - 16) / 7);
    const on = (Math.floor(time * 4) + i) % 2 === 0;
    ctx.fillStyle = on ? '#ffe9a0' : '#8a6a4a';
    ctx.fillRect(Math.round(fx) - 1, gy - 6, 3, 2);
  }
  // The marquee: a dark sign with a neon border, chasing bulbs and BOSS RUSH in flickering neon.
  const mw = 112;
  const mx = x - mw / 2;
  const my = top - 4;
  ctx.fillStyle = '#1a0f2a';
  ctx.beginPath();
  ctx.moveTo(mx, my + 26);
  ctx.lineTo(mx, my + 8);
  ctx.quadraticCurveTo(x, my - 10, mx + mw, my + 8);
  ctx.lineTo(mx + mw, my + 26);
  ctx.closePath();
  ctx.fill();
  neon(ctx, '#ff4f9a', 1.6, () => {
    ctx.beginPath();
    ctx.moveTo(mx + 2, my + 24);
    ctx.lineTo(mx + 2, my + 9);
    ctx.quadraticCurveTo(x, my - 7, mx + mw - 2, my + 9);
    ctx.lineTo(mx + mw - 2, my + 24);
    ctx.closePath();
  });
  const arc = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const bx = mx + 5 + u * (mw - 10);
    const by = my + 10 - Math.sin(u * Math.PI) * 7.5 - 1;
    arc.push([bx, by]);
  }
  bulbs(ctx, arc, time);
  const flick = Math.sin(time * 37) > 0.97 ? 0.35 : 1;
  ctx.save();
  ctx.font = 'bold 13px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = flick;
  ctx.shadowColor = '#ffd84a';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffe96a';
  ctx.fillText('BOSS RUSH', x, my + 22);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff8d0';
  ctx.fillText('BOSS RUSH', x, my + 22);
  ctx.restore();
  // Little lightning bolts either side of the sign, flashing on the beat.
  const beat = Math.floor(time * 2) % 2;
  for (const s of [-1, 1]) {
    const bx = x + s * (mw / 2 + 8);
    neon(ctx, beat ? '#7fe8ff' : '#4aa8d8', 1.4, () => {
      ctx.beginPath();
      ctx.moveTo(bx + s * 2, my + 4); ctx.lineTo(bx - s * 2, my + 13); ctx.lineTo(bx + s * 1.5, my + 13); ctx.lineTo(bx - s * 2.5, my + 23);
    }, beat ? 1 : 0.6);
  }
  // Two spotlights cross over the stage now and then.
  const sw = Math.sin(time * 0.9);
  if (Math.abs(sw) > 0.2) {
    for (const s of [-1, 1]) {
      const ex = x + s * sw * 40;
      ctx.fillStyle = s < 0 ? 'rgba(255,120,200,0.12)' : 'rgba(120,220,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(x + s * 50, my + 26);
      ctx.lineTo(x + s * 54, my + 26);
      ctx.lineTo(ex + 14, gy - 8);
      ctx.lineTo(ex - 14, gy - 8);
      ctx.fill();
    }
  }
}
