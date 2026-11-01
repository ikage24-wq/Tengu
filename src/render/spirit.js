// A map's spirit (world/calm.js): when the map is calm it shows at its home (`map.spirit`), a
// little blossom spirit bobbing in the air with a crown of petals, glowing softly. It turns to look
// at you, waves when you come close, blinks, and scatters a petal now and then. Soured maps fade
// toward grey instead.

import { shade, snap } from './pixel.js';
import { calmOf, CALM, SOUR, soothes } from '../world/calm.js';

const fade = new WeakMap();

function blob(ctx, x, y, rx, ry, fill, a = 0) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = shade(fill, -40);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawSpirit(ctx, world, cam, time) {
  const map = world.map;
  const home = map.spirit;
  if (!home || !soothes(map)) return;
  // It fades in and out over a second rather than popping.
  const st = fade.get(world) ?? { k: 0, map: null };
  if (st.map !== map.id) Object.assign(st, { k: 0, map: map.id });
  const want = calmOf(world) >= CALM ? 1 : 0;
  st.k += Math.sign(want - st.k) * Math.min(Math.abs(want - st.k), 1 / 60);
  fade.set(world, st);
  if (st.k <= 0) return;
  const bob = Math.sin(time * 1.6) * 4;
  const x = snap(home.x + Math.sin(time * 0.4) * 14 - cam.x);
  const y = snap(home.y + bob - cam.y);
  if (x < -40 || x > 680 || y < -40 || y > 400) return;
  const b = world.body;
  const look = Math.max(-1, Math.min(1, (b.x - home.x) / 120));
  const near = Math.abs(b.x - home.x) < 90 && Math.abs(b.y - home.y) < 120;
  const blink = (time % 3.4) < 0.12;
  ctx.save();
  ctx.globalAlpha = st.k;
  // Drawn a size up, so it reads from across the floor.
  ctx.translate(x, y);
  ctx.scale(1.5, 1.5);
  ctx.translate(-x, -y);
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
  glow.addColorStop(0, 'rgba(255,214,232,0.6)');
  glow.addColorStop(1, 'rgba(255,214,232,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 26, y - 26, 52, 52);
  // A wisp of a tail trailing below.
  ctx.fillStyle = '#fff4fa';
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 4);
  ctx.quadraticCurveTo(x + Math.sin(time * 3) * 5, y + 16, x + 2 + Math.sin(time * 3 + 1) * 4, y + 20);
  ctx.quadraticCurveTo(x + 4, y + 10, x + 6, y + 4);
  ctx.fill();
  // Little arms: one waves when you're near.
  const wave = near ? Math.sin(time * 9) * 0.6 : 0;
  blob(ctx, x - 9, y + 1, 3, 2, '#fff4fa', -0.4);
  blob(ctx, x + 9 + wave * 2, y - 1 - (near ? 4 : 0), 3, 2, '#fff4fa', 0.4 - wave);
  blob(ctx, x, y, 9, 8, '#fff4fa');
  // A crown of petals.
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k - 2) * 0.5;
    blob(ctx, x + Math.cos(a) * 7, y - 8 + Math.sin(a) * 2 + 2, 3, 2, k % 2 ? '#ffb0d0' : '#ff9ec7', a + Math.PI / 2);
  }
  // Face: eyes that follow you, rosy cheeks, a small smile.
  ctx.fillStyle = '#5a3f6e';
  const ex = look * 1.5;
  if (blink) {
    ctx.fillRect(x - 4 + ex, y, 2.4, 0.8);
    ctx.fillRect(x + 2 + ex, y, 2.4, 0.8);
  } else {
    ctx.beginPath();
    ctx.ellipse(x - 3 + ex, y, 1.2, 1.6, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 3 + ex, y, 1.2, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,140,180,0.6)';
  ctx.fillRect(x - 6 + ex, y + 2, 2, 1);
  ctx.fillRect(x + 4 + ex, y + 2, 2, 1);
  ctx.strokeStyle = '#5a3f6e';
  ctx.beginPath();
  ctx.arc(x + ex, y + 2.5, near ? 1.8 : 1.2, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // A petal drifting off it now and then.
  const p = (time * 0.5) % 1;
  ctx.globalAlpha = st.k * (1 - p);
  blob(ctx, x + 6 + p * 20, y + 6 + p * 30 + Math.sin(p * 9) * 3, 2, 1.2, '#ff9ec7', time);
  ctx.restore();
}

// A soured map's colours fade toward grey (the further below SOUR, the greyer).
export function drawSoured(ctx, world, w, h) {
  if (!soothes(world.map)) return;
  const v = calmOf(world);
  if (v >= SOUR) return;
  ctx.save();
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = `rgba(128,128,128,${0.55 * (1 - v / SOUR)})`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
