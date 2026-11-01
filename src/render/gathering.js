// Gathering and mining spots (world/gathering.js): a clover clump, a copper-veined rock, a hanging
// honeycomb, a bunch of cherries. Ready ones twinkle so you can spot them across a floor; picked
// ones show what's left while they grow back. The "▲ Gather" hint shows over the one you're at,
// and finds pop out of it when you're done.

import { shade, snap } from './pixel.js';
import { text, box, COLORS } from '../ui/kit.js';
import { nodesOf, nodeReady, nodeHere } from '../world/gathering.js';
import { KINDS } from '../data/gathering.js';
import { ITEMS } from '../data/items.js';

function blob(ctx, x, y, rx, ry, fill, a = 0) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = shade(fill, -45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function twinkle(ctx, x, y, time, seed) {
  const k = Math.max(0, Math.sin(time * 2.6 + seed * 1.7));
  if (k < 0.2) return;
  ctx.globalAlpha = k;
  ctx.fillStyle = '#ffffff';
  const r = 1 + 2.2 * k;
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.3, y - r * 0.3); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.3, y + r * 0.3);
  ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.3, y + r * 0.3); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.3, y - r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

const DRAW = {
  // Four round clover leaves on short stems, swaying; picked, a lone sprout.
  herb(ctx, x, y, time, ready) {
    const sway = Math.sin(time * 2 + x) * 1.2;
    if (!ready) {
      blob(ctx, x, y - 3, 2, 3, '#9ad88f');
      return;
    }
    for (const [dx, h, c] of [[-6, 8, '#6cc46c'], [5, 10, '#7fd07a'], [-1, 13, '#8edc86'], [8, 6, '#6cc46c']]) {
      ctx.strokeStyle = '#4f9e55';
      ctx.beginPath();
      ctx.moveTo(x + dx * 0.4, y);
      ctx.lineTo(x + dx + sway, y - h);
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + 0.4;
        blob(ctx, x + dx + sway + Math.cos(a) * 2.2, y - h + Math.sin(a) * 1.6, 2, 1.6, c);
      }
    }
    twinkle(ctx, x + 2, y - 15, time, x);
  },
  // A rock mound with copper veins and glints; mined, a cracked stump of rock.
  ore(ctx, x, y, time, ready) {
    blob(ctx, x, y - 6, 14, ready ? 9 : 5, ready ? '#b8a8c8' : '#a898b4');
    blob(ctx, x - 6, y - 9, 7, 6, ready ? '#c9bcd6' : '#b4a6c0');
    if (!ready) {
      ctx.strokeStyle = '#6e6084';
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 9); ctx.lineTo(x, y - 5); ctx.lineTo(x + 3, y - 8);
      ctx.stroke();
      return;
    }
    for (const [dx, dy] of [[-3, -10], [4, -7], [8, -11], [-8, -5]]) blob(ctx, x + dx, y + dy, 2.2, 1.6, '#e0915a', 0.5);
    blob(ctx, x + 2, y - 13, 1.8, 1.4, '#ffb3d1');
    twinkle(ctx, x + 6, y - 12, time, x);
    twinkle(ctx, x - 4, y - 9, time + 1.3, x + 5);
  },
  // Golden comb hanging on its stalk with a slow drip; taken, an empty pale comb.
  honey(ctx, x, y, time, ready) {
    const top = y - 30;
    ctx.strokeStyle = '#a3714c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, top);
    ctx.stroke();
    ctx.lineWidth = 1;
    const col = ready ? '#ffc83a' : '#f6e6b8';
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, 6], [-4, 12], [4, 12], [0, 18]]) {
      ctx.fillStyle = col;
      ctx.strokeStyle = shade(col, -50);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        ctx.lineTo(x + dx + Math.cos(a) * 4, top + 4 + dy + Math.sin(a) * 3.6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (!ready) return;
    const d = (time * 0.6 + x * 0.01) % 1;
    ctx.fillStyle = '#ffb020';
    ctx.beginPath();
    ctx.ellipse(x + 1, top + 25 + d * 8, 1.4, 1.4 + d, 0, 0, Math.PI * 2);
    ctx.fill();
    twinkle(ctx, x - 3, top + 6, time, x);
  },
  // Two plump cherries on a stem hanging low off the tree's bough; picked, just the leaf.
  fruit(ctx, x, y, time, ready) {
    const top = y - 46;
    const sway = Math.sin(time * 1.6 + x) * 1.5;
    ctx.strokeStyle = '#7a5a3a';
    ctx.beginPath();
    ctx.moveTo(x - 8, top); ctx.quadraticCurveTo(x, top + 4, x + 8, top);
    ctx.stroke();
    blob(ctx, x + 4, top + 3, 4, 2, '#7fd07a', 0.4);
    if (!ready) return;
    ctx.strokeStyle = '#4f9e55';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, top + 2);
      ctx.quadraticCurveTo(x + s * 2 + sway, top + 9, x + s * 4 + sway, top + 15);
      ctx.stroke();
      blob(ctx, x + s * 4 + sway, top + 18, 3.6, 3.6, '#ff4f6e');
      ctx.fillStyle = '#ffd2dc';
      ctx.fillRect(x + s * 4 + sway - 2, top + 16, 1.5, 1.5);
    }
    twinkle(ctx, x + 7 + sway, top + 14, time, x);
  },
};

function hint(ctx, x, y, label, on) {
  ctx.font = 'bold 8px sans-serif';
  const w = ctx.measureText(label).width + 12;
  ctx.globalAlpha = on ? 1 : 0.7;
  box(ctx, x - w / 2, y, w, 12, { fill: '#ffffff', edge: on ? COLORS.accent : COLORS.muted, r: 6 });
  text(ctx, label, x, y + 9, { size: 8, bold: true, align: 'center', color: on ? COLORS.accent : COLORS.muted });
  ctx.globalAlpha = 1;
}

// Behind everyone: the spots, and the finds popping out of the last one you worked.
export function drawNodes(ctx, world, cam, time) {
  const here = !world.dead && !world.gathering ? nodeHere(world) : null;
  nodesOf(world).forEach((n, i) => {
    const x = snap(n.x - cam.x);
    const y = snap(n.y - cam.y);
    if (x < -60 || x > 700 || y < -60 || y > 420) return;
    ctx.save();
    DRAW[n.kind]?.(ctx, x, y, time, nodeReady(world, i));
    ctx.restore();
    if (here?.i === i) hint(ctx, x, y - (n.kind === 'fruit' ? 62 : 32), nodeReady(world, i) ? `▲ ${KINDS[n.kind].verb}` : 'Growing back...', nodeReady(world, i));
  });
  const pop = world.lastGathered;
  const since = pop ? world.now - pop.at : 9;
  if (since < 1) {
    pop.items.forEach((id, k) => {
      const x = pop.x - cam.x + (k - (pop.items.length - 1) / 2) * 10;
      const y = pop.y - cam.y - 20 - 26 * Math.sin(Math.min(1, since * 2) * Math.PI / 2);
      ctx.globalAlpha = Math.min(1, (1 - since) * 3);
      blob(ctx, x, y, 3.5, 3.5, ITEMS[id]?.color ?? '#ffffff');
      twinkle(ctx, x + 3, y - 3, time * 3, k);
    });
    ctx.globalAlpha = 1;
  }
}
