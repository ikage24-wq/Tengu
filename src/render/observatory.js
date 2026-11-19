// The Star Observatory's rooms (world/observatory.js runs them), in the scenery's outlined chibi
// style: the star lamps (and the constellation lines joining the puzzle's five), the eclipse's
// sunlit and shadowed halves, and Folio's bookcases sliding in. (x, y) is the bottom center on the
// floor; `time` (seconds) animates.

import { R, E, T, F, mix } from './pixel.js';
import { art, place } from './scenery.js';
import { drawSpectator, SPECTATOR_BEATS } from './mochi-anim.js';
import { rollMochi } from '../data/mochi-genes.js';
import { GOMA } from '../data/scenes.js';

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
function star(cx, cy, r, c) {
  return T(Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }), c);
}

// A star lamp: a brass stand holding a glass globe with a star inside, dark or shining.
function lampArt(lit) {
  return art(`obs-lamp|${lit}`, 26, 50, () => [
    E(13, 48, 8, 2, '#8a6a3a'), R(11.6, 22, 2.8, 26, '#c8902a'), F(R(11.6, 22, 1, 26, '#ffd36b')),
    E(13, 14, 10, 10, lit ? '#fff6d8' : '#5a5a8a'), F(E(9.6, 10.4, 3, 3, lit ? '#ffffff' : '#7a7aa8')),
    star(13, 14, 6, lit ? '#ffd36b' : '#8a8ab8'), R(8, 22, 10, 3, '#c8902a'),
  ]);
}
function drawLamp(ctx, x, y, lit, time, id, pressedAt, now) {
  if (lit) glow(ctx, x, y - 36, 34 + Math.sin(time * 2 + id) * 4, '#fff3a6', 0.5);
  // A flick of light when it's pressed.
  const since = now - (pressedAt ?? -9);
  if (since < 0.4) glow(ctx, x, y - 36, 50 * since + 10, '#ffffff', 0.6 * (1 - since / 0.4));
  place(ctx, lampArt(lit), x, y);
  if (lit) for (let k = 0; k < 2; k++) {
    const u = (time * 0.5 + k * 0.5 + id * 0.2) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x - 6 + k * 12 + Math.sin(u * 6) * 3), Math.round(y - 50 - u * 16), 2, 2);
    ctx.globalAlpha = 1;
  }
}

// ---------- Astraea's sky (world/observatory.js runs it) ----------
// Where a star is, gliding (as world/observatory.js starAt; kept here so the drawing needs nothing
// from the world).
const GLIDE = 1.2;
const easeIn = (u) => u * u * (3 - 2 * u);
function starPos(st, now) {
  const k = easeIn(Math.min(1, Math.max(0, (now - st.t0) / GLIDE)));
  return [st.fx + (st.x - st.fx) * k, st.fy + (st.y - st.fy) * k];
}
// A constellation's lines: each star to the one before it, and the last back to `close`.
const skyLines = (sky) => [...Array.from({ length: sky.n - 1 }, (_, i) => [i, i + 1]), ...(sky.close != null ? [[sky.n - 1, sky.close]] : [])];
function label(ctx, text, x, y, c = '#ffffff') {
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1a1a4a';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = c;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}
function line(ctx, x0, y0, x1, y1, c, w, alpha, dash = null, off = 0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  if (dash) {
    ctx.setLineDash(dash);
    ctx.lineDashOffset = off;
  }
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}
function starShape(ctx, x, y, r, c, rot = 0) {
  ctx.fillStyle = c;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
function drawSky(ctx, world, cam, time) {
  const boss = world.mobs.find((m) => m.def.mech === 'astraea' && m.hp > 0);
  const sky = boss?.mech?.sky;
  if (!sky) return;
  const now = world.now;
  // A finished one shines, then fades away over its last few seconds.
  const fade = sky.doneAt == null ? 1 : Math.max(0, 1 - Math.max(0, now - sky.doneAt - 10) / 3);
  if (fade <= 0) return;
  const pos = sky.stars.map((st, i) => (i === sky.next && sky.star?.hp > 0 ? [sky.star.x, sky.star.y] : starPos(st, now)));
  const P = pos.map(([x, y]) => [x - cam.x, y - cam.y - 13]);
  const flare = sky.doneAt == null ? 0 : Math.max(0, 1 - (now - sky.doneAt) / 2);
  // The lines: gold where both ends are joined (each drawing itself in), a dashed guide to the next.
  for (const [a, b] of skyLines(sky)) {
    const ja = a < sky.next;
    const jb = b < sky.next;
    if (ja && jb) {
      const t = Math.max(sky.joinedAt[a] ?? 0, sky.joinedAt[b] ?? 0);
      const u = easeIn(Math.min(1, (now - t) / 0.5));
      const [x0, y0] = P[a];
      const x1 = x0 + (P[b][0] - x0) * u;
      const y1 = y0 + (P[b][1] - y0) * u;
      line(ctx, x0, y0, x1, y1, '#fff3a6', 7, (0.22 + flare * 0.3) * fade);
      line(ctx, x0, y0, x1, y1, '#fff8d8', 2.4, (0.85 + flare * 0.15) * fade);
    }
  }
  if (sky.doneAt == null && sky.next > 0) {
    const [x0, y0] = P[sky.next - 1];
    const [x1, y1] = P[sky.next];
    line(ctx, x0, y0, x1, y1, '#c8c8ff', 1.4, 0.55, [5, 6], -time * 14);
  }
  // The stars: joined ones bright, the next one marked (it draws itself), the rest dim, numbered.
  pos.forEach((_, i) => {
    const [x, y] = P[i];
    const tw = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7);
    if (i < sky.next) {
      glow(ctx, x, y, 22 + flare * 18, '#fff3a6', (0.4 + flare * 0.4) * fade);
      ctx.globalAlpha = fade;
      starShape(ctx, x, y, 7 + flare * 3, '#fff3a6', time * 0.4);
      starShape(ctx, x, y, 3.4, '#ffffff', time * 0.4);
      ctx.globalAlpha = 1;
    } else if (i > sky.next) {
      glow(ctx, x, y, 14, '#c8c8ff', 0.25 + tw * 0.15);
      ctx.globalAlpha = 0.75;
      starShape(ctx, x, y, 5, '#a8a8e8', time * 0.3 + i);
      ctx.globalAlpha = 1;
    }
    if (sky.doneAt == null && i >= sky.next) label(ctx, String(i + 1), x, y - (i === sky.next ? 26 : 12), i === sky.next ? '#fff3a6' : '#c8c8ff');
  });
  // Its picture up in the sky, filling in as you join it; its name once it's whole.
  const W = 96;
  const H = 52;
  const ox = 320 - W / 2;
  const oy = 92;
  const Q = sky.pts.map(([u, v]) => [ox + u * W, oy + v * H]);
  // (Behind it, faint, the figure it makes, the way old star charts draw them.)
  ctx.save();
  ctx.globalAlpha = (0.3 + (sky.doneAt != null ? 0.15 : 0)) * fade;
  ctx.fillStyle = '#c8c8ff';
  ctx.strokeStyle = '#c8c8ff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (sky.key === 'mochi') {
    ctx.ellipse(ox + W * 0.5, oy + H * 0.66, W * 0.44, H * 0.33, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ox + W * 0.5, oy + H * 0.34);
    ctx.lineTo(ox + W * 0.5, oy + H * 0.1);
    ctx.stroke();
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(ox + W * (0.5 + d * 0.07), oy + H * 0.12, W * 0.07, H * 0.06, d * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (const [u, v] of [[0, 0.64], [1, 0.64], [0.76, 1], [0.24, 1]]) ctx.lineTo(ox + u * W, oy + v * H);
    ctx.fill();
    ctx.beginPath();
    for (const [u, v] of [[0.46, 0.04], [0.8, 0.56], [0.46, 0.56]]) ctx.lineTo(ox + u * W, oy + v * H);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ox + W * 0.42, oy + H * 0.02);
    ctx.lineTo(ox + W * 0.42, oy + H * 0.64);
    ctx.stroke();
  }
  ctx.restore();
  for (const [a, b] of skyLines(sky)) {
    const on = a < sky.next && b < sky.next;
    line(ctx, Q[a][0], Q[a][1], Q[b][0], Q[b][1], on ? '#fff3a6' : '#8a8ad8', on ? 1.8 : 1, (on ? 0.9 : 0.45) * fade, on ? null : [3, 3]);
  }
  Q.forEach(([x, y], i) => {
    if (i < sky.next) glow(ctx, x, y, 8, '#fff3a6', 0.5 * fade);
    ctx.globalAlpha = fade;
    starShape(ctx, x, y, i === sky.next ? 3.4 + Math.sin(time * 6) * 0.8 : 2.6, i < sky.next ? '#fff8d8' : i === sky.next ? '#fff3a6' : '#a8a8e8');
    ctx.globalAlpha = 1;
  });
  if (sky.doneAt != null) {
    ctx.globalAlpha = Math.min(1, (now - sky.doneAt) / 0.8) * fade;
    label(ctx, sky.name, 320, oy + H + 16, '#fff3a6');
    ctx.globalAlpha = 1;
  }
}
// Elder Goma, counting the stars with Astraea from the gantry beside the great telescope (till she's freed).
const GOMA_FAN = { genes: null };
function drawGoma(ctx, x, y, time) {
  GOMA_FAN.genes ??= Object.assign(rollMochi(GOMA.seed, GOMA.genes), { wear: { ...GOMA.wear } });
  drawSpectator(ctx, GOMA_FAN.genes, x, y, Math.floor(time * 3) % SPECTATOR_BEATS, -1);
}

export function drawObsBack(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'observatory') return;
  if (map.id === 'observatory6') {
    if (!world.char.elders?.goma && !(world.cine?.cast ?? []).some((c) => c.id === 'goma' && c.alpha > 0)) drawGoma(ctx, 1092 - cam.x, 300 - cam.y, time);
    drawSky(ctx, world, cam, time);
  }
  // The constellation: faint lines joining its lamps, glowing gold where both ends shine.
  const lamps = room.objects.filter((o) => o.kind === 'starlamp');
  for (const [a, b] of map.constellation ?? []) {
    const p = lamps[a];
    const q = lamps[b];
    if (!p || !q) continue;
    const on = p.lit && q.lit;
    ctx.save();
    ctx.strokeStyle = on ? '#fff3a6' : '#8a8ab8';
    ctx.globalAlpha = on ? 0.8 : 0.35;
    ctx.lineWidth = on ? 2 : 1;
    ctx.setLineDash(on ? [] : [4, 4]);
    ctx.lineDashOffset = -time * 10;
    ctx.beginPath();
    ctx.moveTo(p.x - cam.x, p.y - 36 - cam.y);
    ctx.lineTo(q.x - cam.x, q.y - 36 - cam.y);
    ctx.stroke();
    ctx.restore();
  }
  // The eclipse: the sunlit half washed gold, the shadowed half deep blue.
  const e = room.eclipse;
  if (e) {
    const mid = map.width / 2 - cam.x;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#ffd36b';
    if (e.lightLeft) ctx.fillRect(-10, 0, mid + 10, 600);
    else ctx.fillRect(mid, 0, 700, 600);
    ctx.fillStyle = '#1a1a5a';
    ctx.globalAlpha = 0.22;
    if (e.lightLeft) ctx.fillRect(mid, 0, 700, 600);
    else ctx.fillRect(-10, 0, mid + 10, 600);
    ctx.restore();
    ctx.fillStyle = '#fff3a6';
    ctx.fillRect(Math.round(mid) - 1, 0, 2, 600);
  }
}

export function drawObsFront(ctx, world, cam, time) {
  const room = world.dungeon.room;
  const map = world.map;
  if (map.dungeon !== 'observatory' || !room.walls) return;
  // Folio's bookcases sliding in from both ends.
  const gy = map.groundY - cam.y;
  for (const [edge, dir] of [[room.walls.l, -1], [room.walls.r, 1]]) {
    const x = edge - cam.x;
    const x0 = dir < 0 ? -10 : x;
    const w = dir < 0 ? x + 10 : 660 - x;
    ctx.fillStyle = '#5a3a4a';
    ctx.fillRect(x0, -10, w, gy + 20);
    for (let r = 0; r < 8; r++) {
      const sy = gy - 20 - r * 34;
      ctx.fillStyle = '#3a2430';
      ctx.fillRect(x0, sy, w, 4);
      for (let b = 0; b < Math.ceil(w / 8); b++) {
        const h = 16 + ((b * 7 + r * 3) % 9);
        ctx.fillStyle = ['#7a3a5a', '#3a5a8a', '#5a7a4a', '#8a6a3a'][(b + r) % 4];
        ctx.fillRect(x0 + 2 + b * 8, sy - h, 6, h);
      }
    }
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(Math.round(x) - 1, -10, 3, gy + 20);
  }
}

export function drawObsObject(ctx, o, x, y, time, now) {
  if (o.kind === 'starlamp') drawLamp(ctx, x, y, Boolean(o.lit), time, o.id, o.pressedAt, now);
  else if (o.kind === 'starlamp1') drawLamp(ctx, x, y, Boolean(o.done), time, o.id, null, now);
  else return false;
  return true;
}
export const OBS_HINT = { starlamp: '▲ Light', starlamp1: '▲ Light' };
