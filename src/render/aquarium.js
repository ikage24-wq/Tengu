// The Sunken Aquarium Palace's rooms (world/aquarium.js runs them), in the scenery's outlined chibi
// style: the lantern corals to light, the vault's giant clams and the tide bell, the moray
// sisters' burrows (drawn over a sister hiding in one, so only her head peeks out), currents
// streaming along a floor, and Queen Coralie's whirlpool. (x, y) is the bottom center on the floor;
// `time` (seconds) animates.

import { R, E, T, F, mix } from './pixel.js';
import { art, place } from './scenery.js';

const TAU = Math.PI * 2;

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
function ring(ctx, x, y, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

// ---------- Lantern coral ----------

function coralLampArt(lit) {
  return art(`aq-coral|${lit}`, 34, 44, () => {
    const c = lit ? '#ff9ab8' : '#8a94b8';
    const bulb = lit ? '#bff6ff' : '#a8b0c8';
    const out = [E(17, 42, 12, 2.4, mix(c, '#3a2d4f', 0.3))];
    for (const [x, h, a] of [[17, 30, 0], [9, 22, -0.45], [25, 24, 0.4]]) {
      const tx = x + Math.sin(a) * h;
      const ty = 42 - Math.cos(a) * h;
      out.push(T([[x - 2.6, 42], [x + 2.6, 42], [tx + 1.6, ty], [tx - 1.6, ty]], c), E(tx, ty - 2, 4, 4.4, bulb), F(E(tx - 1.2, ty - 3.4, 1.4, 1.4, '#ffffff')));
    }
    return out;
  });
}
function drawCoral(ctx, x, y, lit, time, id) {
  if (lit) {
    const p = 0.5 + 0.5 * Math.sin(time * 2.6 + id);
    glow(ctx, x, y - 30, 36 + p * 6, '#9fe8ff', 0.5);
  }
  place(ctx, coralLampArt(lit), x, y);
  // Little fish nose round a lit coral; a sleepy bubble rises from a dark one.
  if (lit) {
    for (let k = 0; k < 2; k++) {
      const a = time * (1.6 + k * 0.5) + id + k * 3;
      ctx.fillStyle = k ? '#ffd36b' : '#ff9ab8';
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 16, y - 30 + Math.sin(a * 1.4) * 6, 2.4, 1.3, 0, 0, TAU);
      ctx.fill();
    }
  } else ring(ctx, x + Math.sin(time * 1.4 + id) * 2, y - 46 - ((time * 8 + id * 5) % 14), 1.6, '#dff6ff');
}

// ---------- Giant clams and the tide bell ----------

const MARK_C = { Conch: '#ffb35a', Star: '#ff9ab8', Pearl: '#ffffff', Wave: '#7fd8ff' };
function markShape(mark, cx, cy, s) {
  const c = MARK_C[mark] ?? '#ffffff';
  if (mark === 'Star') return [T(Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? s * 1.2 : s * 2.8;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }), c)];
  if (mark === 'Pearl') return [E(cx, cy, s * 2.4, s * 2.4, c), F(E(cx - s * 0.8, cy - s * 0.8, s * 0.7, s * 0.7, '#dff6ff'))];
  if (mark === 'Wave') return [T([[cx - s * 3, cy + s], [cx - s * 1.6, cy - s * 1.6], [cx, cy - s * 2], [cx + s * 1.4, cy - s * 0.6], [cx, cy - s * 0.4], [cx + s * 3, cy + s]], c)];
  return [T([[cx - s * 2.4, cy + s * 1.6], [cx, cy - s * 2.6], [cx + s * 2.4, cy + s * 1.6], [cx, cy + s * 0.6]], c)];
}
function clamArt(open, mark) {
  return art(`aq-clam|${open}|${mark}`, 48, 40, () => {
    const shell = '#c9a6ff';
    const shellDk = '#9a7ad8';
    const out = [E(24, 38, 21, 3, '#7a62a8')];
    // The bottom shell, ribbed; the top shell lifted when open, a pearl glowing inside.
    out.push(T([[3, 36], [45, 36], [40, 28], [8, 28]], shellDk));
    if (open) {
      out.push(E(24, 28, 17, 4, '#ffe6f2'), E(24, 27, 4, 4, '#ffffff'), F(E(22.6, 25.6, 1.4, 1.4, '#dff6ff')));
      out.push(T([[4, 26], [44, 26], [40, 6], [24, 0], [8, 6]], shell));
      for (const x of [14, 24, 34]) out.push(F(T([[x - 1, 26], [x + 1, 26], [x + (x - 24) * 0.2 + 1, 3], [x + (x - 24) * 0.2 - 1, 3]], shellDk)));
    } else {
      out.push(T([[3, 30], [45, 30], [40, 14], [24, 8], [8, 14]], shell));
      for (const x of [14, 24, 34]) out.push(F(T([[x - 1, 30], [x + 1, 30], [x + (x - 24) * 0.2 + 1, 11], [x + (x - 24) * 0.2 - 1, 11]], shellDk)));
    }
    out.push(...markShape(mark, 24, open ? 14 : 20, 1.6));
    return out;
  });
}
function drawClam(ctx, x, y, o, time, now) {
  // It snaps shut with a shudder when the order breaks.
  const snap = now - (o.snapAt ?? -9);
  const sx = snap < 0.4 ? Math.sin(snap * 60) * 2 * (1 - snap / 0.4) : 0;
  if (o.done) glow(ctx, x, y - 16, 30, '#ffe6f2', 0.5 + 0.1 * Math.sin(time * 3));
  place(ctx, clamArt(Boolean(o.done), o.mark), x + sx, y);
  if (!o.done) ring(ctx, x + 18 + Math.sin(time + o.id) * 2, y - 30 - ((time * 6 + o.id * 4) % 12), 1.4, '#dff6ff');
}
function bellArt(rung) {
  return art(`aq-bell|${rung}`, 40, 48, () => [
    R(19, 0, 2, 10, '#c8902a'), T([[8, 40], [32, 40], [28, 14], [20, 8], [12, 14]], '#ffd36b'), F(T([[12, 38], [17, 38], [17, 16], [14, 16]], '#fff2b0')),
    E(20, 41, 14, 3, '#c8902a'), E(20 + rung * 3, 44, 3, 3, '#c8902a'),
  ]);
}
// The tide bell over the vault, swinging; the marks it rang hang beside it, each lighting up as
// its clam opens.
function drawBell(ctx, x, y, room, time) {
  const swing = Math.sin(time * 1.6);
  ctx.save();
  ctx.translate(x, y - 70);
  ctx.rotate(swing * 0.12);
  place(ctx, bellArt(Math.round(swing)), 0, 48);
  ctx.restore();
  const b = room.bell;
  b.order.forEach((id, i) => {
    const o = room.objects[id];
    const cx = x - 36 + i * 24;
    const cy = y - 6;
    const lit = i < b.next;
    ctx.fillStyle = lit ? '#ffffff' : 'rgba(58,45,79,0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = MARK_C[o.mark] ?? '#ffffff';
    ctx.globalAlpha = lit ? 1 : 0.7;
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, cx, cy - 10);
    ctx.globalAlpha = 1;
    place(ctx, markArt(o.mark), cx, cy + 5);
  });
}
function markArt(mark) {
  return art(`aq-mark|${mark}`, 14, 12, () => markShape(mark, 7, 6, 1.4));
}

// ---------- Burrows, currents, the whirlpool ----------

function burrowArt() {
  return art('aq-burrow', 90, 120, () => [
    T([[0, 120], [0, 0], [90, 0], [90, 120], [74, 120], [72, 60], [60, 38], [45, 32], [30, 38], [18, 60], [16, 120]], '#3a5a6a'),
    F(T([[16, 120], [18, 60], [30, 38], [45, 32], [60, 38], [72, 60], [74, 120], [68, 120], [66, 64], [56, 46], [45, 41], [34, 46], [24, 64], [22, 120]], '#4a7484')),
    F(E(14, 20, 6, 4, '#ff9ab8')), F(E(76, 14, 5, 3, '#ffd36b')), F(E(8, 90, 4, 6, '#7fd8a8')), F(E(82, 96, 4, 6, '#7fd8a8')),
  ]);
}

export function drawAquaBack(ctx, world, cam, time) {
  const run = world.dungeon;
  const room = run.room;
  const map = world.map;
  if (map.dungeon !== 'aquarium') return;
  if (map.bell && room.bell) drawBell(ctx, map.bell.x - cam.x, map.bell.y - cam.y - 40, room, time);
  // Currents: streaks racing along the floor while one runs, a faint shimmer while it builds.
  for (const c of room.currents ?? []) {
    const y = c.y - cam.y;
    ctx.save();
    const n = c.on ? 18 : 5;
    for (let k = 0; k < n; k++) {
      const u = (time * (c.on ? 0.9 : 0.2) + k * 0.13) % 1;
      const span = c.x2 - c.x1;
      const wx = c.dir > 0 ? c.x1 + u * span : c.x2 - u * span;
      const x = wx - cam.x;
      if (x < -20 || x > 700) continue;
      ctx.globalAlpha = (c.on ? 0.6 : 0.2) * Math.sin(Math.PI * u);
      ctx.fillStyle = '#dff6ff';
      ctx.fillRect(x, y - 6 - ((k * 23) % 40), 14 * (c.on ? 1 : 0.5), 1.5);
    }
    ctx.restore();
  }
  const w = room.whirl;
  if (w && world.now < w.until) {
    const x = w.x - cam.x;
    const y = map.groundY - cam.y;
    ctx.save();
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = 0.35 - k * 0.06;
      ctx.strokeStyle = k % 2 ? '#bfeeff' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 30 - k * 14, 120 - k * 24, 14 - k * 2, 0, time * 4 + k, time * 4 + k + Math.PI * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawAquaFront(ctx, world, cam, time) {
  const map = world.map;
  if (map.dungeon !== 'aquarium') return;
  // The burrows sit in front, so a sister hiding inside shows only her head in the hole.
  for (const bx of map.burrows ?? []) {
    const x = bx - cam.x;
    if (x < -100 || x > 760) continue;
    place(ctx, burrowArt(), x, map.groundY - cam.y + 4);
  }
}

export function drawAquaObject(ctx, o, x, y, time, now) {
  if (o.kind === 'coral') drawCoral(ctx, x, y, o.done, time, o.id);
  else if (o.kind === 'clam') drawClam(ctx, x, y, o, time, now);
  else return false;
  return true;
}
export const AQUA_HINT = { coral: '▲ Light', clam: '▲ Open' };
