// The festival stalls' games, drawn in their windows (ui/festival-stall.js). Dango Stack is drawn there;
// the others here.
//
//   Snowball Toss (world/snowball-toss.js): a pale winter sky over snowy hills, a low snow wall with
//   three holes, the snow-Mochi heads bobbing up from them (round, rosy-cheeked, a little knitted hat;
//   the golden one in a gold crown), the aim ring sweeping along the wall, snowballs arcing up to it
//   and bursting, a hit head spinning down with stars, and the time running out along the top.
//
//   Petal Catch (world/petal-catch.js): a soft spring sky, a branch of cherry blossom across the top,
//   petals swaying down, the basket - woven, a pink ribbon on it - sliding along the grass, a pop of
//   sparkle at each catch.
//
//   Ring Toss (world/ring-toss.js): a summer night, lanterns along the top, a wooden board with three
//   pegs (1, 2, 3 tagged on them), the rings already on them, the one in the air spinning over, misses
//   rolling away; the power meter down the side with its marker swinging.

import { TOSS, isUp } from '../world/snowball-toss.js';
import { PETAL } from '../world/petal-catch.js';
import { RING, landAt } from '../world/ring-toss.js';

const TAU = Math.PI * 2;

export function drawTossGame(ctx, x, y, w, h, g, time) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#bcd8f2');
  sky.addColorStop(1, '#eaf2fc');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Snowy hills, and a few flakes.
  ctx.fillStyle = '#f6faff';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.55);
  ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.42, x + w * 0.5, y + h * 0.55);
  ctx.quadraticCurveTo(x + w * 0.75, y + h * 0.4, x + w, y + h * 0.52);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 16; i++) {
    const fy = y + (((i * 37.3 + time * (12 + (i % 4) * 3)) % h) + h) % h;
    const fx = x + ((i * 61.7 + Math.sin(time + i) * 6) % w);
    ctx.fillRect(fx, fy, 1.4, 1.4);
  }
  const cx = x + w / 2;
  const wallY = y + h - 30;
  // The heads, behind the wall: up out of their holes as far as they're up.
  for (const q of g?.targets ?? []) {
    const hx = cx + q.hole;
    // (Up it pops, a touch past and back - a little bounce - and ducks down smoothly; hit, it
    // drops away.)
    let up;
    const pop = (u) => 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2;
    if (q.hit != null) up = Math.max(0, 1 - ((g.t - q.hit) / 0.35) ** 2);
    else if (g.t < q.at + 0.22) up = pop(Math.max(0, (g.t - q.at) / 0.22));
    else if (g.t > q.until) up = Math.max(0, 1 - ((g.t - q.until) / 0.18) ** 2);
    else up = 1;
    head(ctx, hx, wallY + 6 - up * 20, q, g, time);
  }
  // The wall and its holes.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, wallY, w, h);
  ctx.fillStyle = '#dce8f8';
  ctx.fillRect(x, wallY, w, 2.4);
  for (let bx = x - 6; bx < x + w; bx += 18) {
    ctx.fillStyle = '#eef4fc';
    ctx.beginPath();
    ctx.ellipse(bx + 9, wallY + 1, 9, 3, 0, Math.PI, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#c8d8ee';
  for (const hole of TOSS.holes) {
    ctx.beginPath();
    ctx.ellipse(cx + hole, wallY + 1.4, 12, 2.4, 0, 0, TAU);
    ctx.fill();
  }
  if (g) {
    // Snowballs, flying up from below to where the aim was, and bursting there.
    for (const b of g.balls) {
      const k = (g.t - b.t0) / TOSS.fly;
      const tx = cx + b.x;
      const ty = wallY - 6;
      if (k < 1) {
        const bx = cx + (tx - cx) * k;
        const by = y + h + 6 + (ty - (y + h + 6)) * k - 20 * Math.sin(Math.PI * k);
        ball(ctx, bx, by, 3.6 - k * 1);
      } else {
        const u = Math.min(1, (k - 1) * TOSS.fly / 0.4);
        ctx.fillStyle = `rgba(255,255,255,${1 - u})`;
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU;
          ctx.beginPath();
          ctx.arc(tx + Math.cos(a) * (3 + u * 10), ty + Math.sin(a) * (2 + u * 7), 1.6, 0, TAU);
          ctx.fill();
        }
      }
    }
    // The aim: a ring sweeping along the wall.
    const ax = cx + g.x;
    const ay = wallY - 6;
    ctx.strokeStyle = 'rgba(224,80,110,0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(ax, ay, 7, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax - 10, ay);
    ctx.lineTo(ax - 4, ay);
    ctx.moveTo(ax + 4, ay);
    ctx.lineTo(ax + 10, ay);
    ctx.stroke();
    // The time left, along the top.
    const left = Math.max(0, 1 - g.t / TOSS.time);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x + 8, y + 6, w - 16, 4);
    ctx.fillStyle = left < 0.2 ? '#e0607a' : '#5a8ad8';
    ctx.fillRect(x + 8, y + 6, (w - 16) * left, 4);
    // A word for the last throw.
    const words = { hit: 'Got it!', gold: 'Golden!', miss: 'Splat!' }[g.last];
    if (words && g.t - g.lastAt < 0.6) {
      ctx.font = '900 11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3a6ab0';
      ctx.fillStyle = g.last === 'gold' ? '#ffe08a' : '#ffffff';
      ctx.strokeText(words, cx, y + 26);
      ctx.fillText(words, cx, y + 26);
      ctx.textAlign = 'left';
    }
  } else {
    ctx.font = '900 12px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a6ab0';
    ctx.fillText('Snowball Toss', cx, y + 40);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}
// A little snow-Mochi head: round and white, dot eyes, rosy cheeks, a knitted hat with a bobble (a
// gold crown on the golden one); hit, it spins with its eyes as crosses and stars round it.
function head(ctx, x, y, q, g, time) {
  const hit = q.hit != null;
  const spin = hit ? (g.t - q.hit) * 8 : Math.sin(time * 3 + q.hole) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = q.gold ? '#fff2c0' : '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#dce6f4';
  ctx.beginPath();
  ctx.ellipse(2, 3, 6, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a3a4a';
  if (hit) {
    ctx.fillRect(-4.4, -1.4, 2.4, 0.8);
    ctx.fillRect(2, -1.4, 2.4, 0.8);
  } else {
    ctx.beginPath();
    ctx.arc(-3.2, -1, 1, 0, TAU);
    ctx.arc(3.2, -1, 1, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,130,150,0.55)';
  ctx.beginPath();
  ctx.ellipse(-5.4, 2, 1.8, 1, 0, 0, TAU);
  ctx.ellipse(5.4, 2, 1.8, 1, 0, 0, TAU);
  ctx.fill();
  if (q.gold) {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-3, -8);
    ctx.lineTo(0, -12);
    ctx.lineTo(3, -8);
    ctx.lineTo(6, -11);
    ctx.lineTo(6, -6);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#e0607a';
    ctx.beginPath();
    ctx.ellipse(0, -6.4, 7, 3.4, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7, -6.6, 14, 1.4);
    ctx.beginPath();
    ctx.arc(0, -10.4, 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  if (hit && g.t - q.hit < 0.5) {
    ctx.fillStyle = '#ffd24a';
    for (let i = 0; i < 3; i++) {
      const a = (g.t - q.hit) * 9 + (i * TAU) / 3;
      ctx.fillRect(x + Math.cos(a) * 11 - 1, y - 6 + Math.sin(a) * 4 - 1, 2, 2);
    }
  }
}
function ball(ctx, x, y, r) {
  ctx.fillStyle = '#c8d4ea';
  ctx.beginPath();
  ctx.arc(x + 0.5, y + 0.5, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.92, 0, TAU);
  ctx.fill();
}
// (Whether a head can be hit now - for the tests.)
export { isUp };

const say = (ctx, words, x, y, color, edge) => {
  ctx.font = '900 11px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = edge;
  ctx.fillStyle = color;
  ctx.strokeText(words, x, y);
  ctx.fillText(words, x, y);
  ctx.textAlign = 'left';
};

export function drawPetalGame(ctx, x, y, w, h, g, time) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#ffe4ee');
  sky.addColorStop(1, '#fff8f0');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  const s = (w / 2) / PETAL.half;
  // The branch across the top, in bloom.
  ctx.strokeStyle = '#7a5232';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 10);
  ctx.quadraticCurveTo(x + w * 0.4, y + 22, x + w + 4, y + 6);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const bx = x + (i + 0.5) * (w / 14);
    const by = y + 12 + Math.sin(i * 1.7) * 5;
    flower(ctx, bx, by, i % 2 ? '#ffc2d6' : '#ffe4ee');
  }
  // The grass.
  ctx.fillStyle = '#9fd88a';
  ctx.fillRect(x, y + h - 14, w, 14);
  ctx.fillStyle = '#86c870';
  ctx.fillRect(x, y + h - 14, w, 1.6);
  if (g) {
    for (const p of g.petals) petal(ctx, cx + p.x * s, y + p.y, time + p.ph, p.gold);
    // The basket: leaning into its way, and dipping as a petal lands in it.
    const bx0 = cx + g.x * s;
    const caughtAt = g.pops.length ? g.pops.at(-1).t : -9;
    const dip = g.t - caughtAt < 0.24 ? 2 * Math.sin((Math.PI * (g.t - caughtAt)) / 0.24) : 0;
    const by0 = y + PETAL.catchY + dip;
    ctx.save();
    ctx.translate(bx0, by0 + 4);
    ctx.rotate(-((g.vx ?? 0) / PETAL.speed) * 0.14);
    ctx.translate(-bx0, -(by0 + 4));
    const bx = bx0;
    const by = by0;
    ctx.fillStyle = '#c8945a';
    ctx.beginPath();
    ctx.moveTo(bx - PETAL.basket * s - 2, by - 2);
    ctx.lineTo(bx + PETAL.basket * s + 2, by - 2);
    ctx.lineTo(bx + PETAL.basket * s - 2, by + 10);
    ctx.lineTo(bx - PETAL.basket * s + 2, by + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a8763e';
    ctx.lineWidth = 0.8;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(bx + k * 5, by - 2);
      ctx.lineTo(bx + k * 4.2, by + 10);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff8fb4';
    ctx.fillRect(bx - PETAL.basket * s - 2, by + 2, (PETAL.basket * s + 2) * 2, 2);
    ctx.fillStyle = '#ffc2d6';
    ctx.fillRect(bx - 1, by - 3, 2, 3);
    ctx.restore();
    // A sparkle at each catch.
    for (const q of g.pops) {
      const a = (g.t - q.t) / 0.7;
      ctx.fillStyle = q.gold ? `rgba(255,210,80,${1 - a})` : `rgba(255,140,180,${1 - a})`;
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * TAU;
        ctx.fillRect(cx + q.x * s + Math.cos(ang) * (4 + a * 10) - 1, by - 6 + Math.sin(ang) * (3 + a * 6) - a * 8 - 1, 2, 2);
      }
    }
    const left = Math.max(0, 1 - g.t / PETAL.time);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x + 8, y + h - 8, w - 16, 3);
    ctx.fillStyle = left < 0.2 ? '#e0607a' : '#ff8fb4';
    ctx.fillRect(x + 8, y + h - 8, (w - 16) * left, 3);
    if (g.last && g.t - g.lastAt < 0.5) say(ctx, g.last === 'gold' ? 'Golden!' : 'Caught!', cx, y + 40, g.last === 'gold' ? '#ffe08a' : '#ffffff', '#c0407a');
  } else say(ctx, 'Petal Catch', cx, y + 60, '#ffffff', '#c0407a');
  ctx.restore();
}
function flower(ctx, x, y, c) {
  ctx.fillStyle = c;
  for (let p = 0; p < 5; p++) {
    const a = (p / 5) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.9, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ff7aa6';
  ctx.beginPath();
  ctx.arc(x, y, 1, 0, TAU);
  ctx.fill();
}
function petal(ctx, x, y, t, gold) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2) * 0.8);
  ctx.scale(1.4 * (Math.cos(t * 3) * 0.3 + 0.85), 1.4);
  ctx.fillStyle = gold ? '#ffd24a' : '#ff9ec0';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(3.4, -1, 0, 3.4);
  ctx.quadraticCurveTo(-3.4, -1, 0, -4);
  ctx.fill();
  if (gold) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-0.6, -2, 1.2, 1.2);
  }
  ctx.restore();
}

export function drawRingGame(ctx, x, y, w, h, g, time) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#22285a');
  sky.addColorStop(1, '#5a3a6a');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Lanterns along the top.
  for (let i = 0; i < 9; i++) {
    const lx = x + 14 + i * ((w - 28) / 8);
    const ly = y + 12 + Math.sin(i * 1.3) * 2;
    ctx.fillStyle = 'rgba(255,140,110,0.25)';
    ctx.beginPath();
    ctx.arc(lx, ly, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = i % 2 ? '#ff6a5a' : '#fff2d6';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 3.6, 4.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(lx - 2.4, ly - 5, 4.8, 1);
    ctx.fillRect(lx - 2.4, ly + 4, 4.8, 1);
  }
  // The board and its pegs.
  const ox = x + 26;
  const boardY = y + h - 30;
  ctx.fillStyle = '#c8945a';
  ctx.fillRect(x + 30, boardY, w - 40, 10);
  ctx.fillStyle = '#e2b47a';
  ctx.fillRect(x + 30, boardY, w - 40, 2);
  for (const [px, value] of RING.pegs) {
    const pxs = ox + px;
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(pxs - 1.6, boardY - 26, 3.2, 26);
    ctx.fillStyle = '#fff6ea';
    ctx.fillRect(pxs - 5, boardY - 32, 10, 7);
    ctx.font = '900 7px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c8303a';
    ctx.fillText(String(value), pxs, boardY - 26.5);
    ctx.textAlign = 'left';
  }
  if (g) {
    // Rings on the pegs, stacked.
    const stack = {};
    const top = boardY - 26;
    for (const r of g.on) {
      const n = (stack[r.peg] = (stack[r.peg] ?? 0) + 1);
      const rest = boardY - 2 - n * 2.6;
      const a = g.t - (r.t ?? -9);
      const fall = 0.16;
      const ry = a < fall ? top + (rest - top) * (a / fall) ** 2 : rest - (a < fall + 0.18 ? 1.6 * Math.sin((Math.PI * (a - fall)) / 0.18) : 0);
      const wobble = a > fall && a < fall + 0.6 ? 0.55 * Math.sin((a - fall) * 22) * (1 - (a - fall) / 0.6) : 0;
      ring(ctx, ox + r.peg, ry, wobble, '#ffd24a');
    }
    // Misses: down onto the board (a clink first bounces up off the peg's top), and rolling away.
    for (const m of g.off) {
      const a = g.t - m.t;
      if (a > 1.5) continue;
      const floor = boardY - 2;
      let my;
      let ax;
      if (m.clink) {
        const up = 0.22;
        my = a < up ? top - 32 * (a / up) * (1 - a / up) : top + (floor - top) * Math.min(1, ((a - up) / 0.22) ** 2);
        ax = a * 30;
      } else {
        const drop = 0.17;
        my = a < drop ? top + (floor - top) * (a / drop) ** 2 : floor - 3 * Math.abs(Math.sin((Math.PI * (a - drop)) / 0.2)) * Math.exp(-(a - drop) * 9);
        ax = Math.max(0, a - drop) * 14;
      }
      ring(ctx, ox + m.x + m.dir * ax, my, a * 10 * m.dir, '#ffb08a');
    }
    // The one in the air.
    if (g.flying) {
      const k = Math.min(1, (g.t - g.flying.t0) / RING.fly);
      const tx = ox + g.flying.x;
      const fx = ox + (tx - ox) * k;
      const fy = boardY - 30 + (34 - 30) * k - 46 * Math.sin(Math.PI * k);
      ring(ctx, fx, fy, k * 12, '#ffd24a');
    }
    // The power meter, down the left.
    const mx = x + 10;
    const my = y + 26;
    const mh = h - 60;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(mx - 3, my, 6, mh);
    const grad = ctx.createLinearGradient(0, my + mh, 0, my);
    grad.addColorStop(0, '#8fd3ff');
    grad.addColorStop(1, '#ff6a5a');
    ctx.fillStyle = grad;
    ctx.fillRect(mx - 2, my + mh * (1 - g.meter), 4, mh * g.meter);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - 5, my + mh * (1 - g.meter) - 1, 10, 2);
    // Where it would land, shown faintly on the board.
    if (g.phase === 'aim') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(ox + landAt(g.meter) - 1, boardY - 1, 2, 3);
    }
    for (let i = 0; i < RING.rings; i++) ring(ctx, x + w - 12 - (i % 5) * 8, y + 28 + Math.floor(i / 5) * 8, 0, i < RING.rings - g.n - (g.flying ? 1 : 0) ? '#ffd24a' : 'rgba(255,255,255,0.15)', 2.6);
    const words = { ringer: 'Ringer!', clink: 'Clink!', miss: 'Missed' }[g.last];
    if (words && g.t - g.lastAt < 0.6) say(ctx, words, x + w / 2, y + 40, g.last === 'ringer' ? '#ffe08a' : '#ffffff', '#c8303a');
  } else say(ctx, 'Ring Toss', x + w / 2, y + 60, '#ffe08a', '#c8303a');
  ctx.restore();
}
function ring(ctx, x, y, spin, color, r = 4.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.4 + 0.3 * Math.abs(Math.cos(spin)));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
