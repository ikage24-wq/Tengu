// Party pings on screen and on the minimap, and the quick-emote bar under the party panel.
//
// A ping pops in with a little overshoot, bobs while it lasts and fades out at the end: a pin
// over the spot ("Here!"), a turning sight round the monster ("Attack this!"), or a "!" with
// rings going out ("Help!"), each on its own colour with a pill saying who sent it. One that's
// off screen shows as an arrow at the edge, toward it.

import { PINGS, PING_LIFE, partyEmote, hasParty } from '../world/grouping.js';
import { EMOTES } from './emotes.js';
import { text, box, icon, hover, clicked, tooltip, font, COLORS, THEMES } from './kit.js';

const easeBack = (u) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
};
const smooth = (u) => u * u * (3 - 2 * u);

// How big and how seen a ping is at its age: popping in, held, fading.
function life(p, now) {
  const age = now - p.at;
  const left = p.until - now;
  const pop = age < 0.28 ? easeBack(Math.max(0, age / 0.28)) : 1;
  const fade = smooth(Math.max(0, Math.min(1, left / 0.8)));
  return { age, pop, fade };
}

// Where a ping is: on its monster while it lives, else where it was dropped.
export function pingSpot(p) {
  if (p.mob && p.mob.hp > 0) return { x: p.mob.x, y: p.mob.y - (p.mob.air ?? 0), h: p.mob.def.h };
  return { x: p.x, y: p.y, h: 0 };
}

function pin(ctx, x, y, s, k) {
  // A soft drop shape, white-rimmed, in the ping's colour with a white core.
  ctx.beginPath();
  ctx.arc(x, y - 9 * s, 7 * s, Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 9 * s, 5.6 * s, Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(x, y - 1.6 * s);
  ctx.closePath();
  ctx.fillStyle = k.color;
  ctx.fill();
  ctx.strokeStyle = k.dark;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function ring(ctx, x, y, r, color, a, squash = 0.38) {
  ctx.globalAlpha *= a;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * squash, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawPings(ui, state, world) {
  const cam = state.cam;
  const list = (world.pings ?? []).filter((p) => p.map === world.map.id);
  if (!cam || !list.length || world.scene) return;
  const { ctx } = ui;
  const now = world.now;
  for (const p of list) {
    const k = PINGS[p.kind];
    const { age, pop, fade } = life(p, now);
    const s = pingSpot(p);
    const x = s.x - cam.x;
    const gy = s.y - cam.y;
    const on = x > 10 && x < 630 && gy > 24 && gy < 345;
    ctx.save();
    ctx.globalAlpha = fade;
    if (!on) {
      // Off screen: an arrow at the edge, nudging toward it.
      const ex = Math.max(18, Math.min(622, x));
      const ey = Math.max(60, Math.min(300, gy - 20));
      const a = Math.atan2(gy - 20 - ey, x - ex || (x < 320 ? -1 : 1));
      const push = Math.sin(now * 6) * 2.5;
      ctx.translate(ex + Math.cos(a) * push, ey + Math.sin(a) * push);
      ctx.rotate(a);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-5, -7.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 7.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = k.color;
      ctx.beginPath();
      ctx.moveTo(6.5, 0);
      ctx.lineTo(-3.5, -5);
      ctx.lineTo(-1, 0);
      ctx.lineTo(-3.5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      continue;
    }
    // On the ground: rings going out.
    for (let i = 0; i < 2; i++) {
      const u = ((age * 0.9 + i * 0.5) % 1);
      ctx.save();
      ring(ctx, x, gy, 6 + u * 18, k.color, (1 - u) * 0.8);
      ctx.restore();
    }
    const bob = Math.sin(age * 4.2) * 1.6;
    const top = gy - s.h - 8 + bob;
    if (p.kind === 'attack') {
      // A sight round the monster, its corners turning slowly.
      const r = Math.max(10, s.h * 0.62) * (0.7 + 0.3 * pop);
      const cy = gy - s.h / 2;
      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(age * 0.9);
      ctx.lineCap = 'round';
      for (const [w, c] of [[3.4, '#ffffff'], [1.6, k.color]]) {
        ctx.lineWidth = w;
        ctx.strokeStyle = c;
        for (let q = 0; q < 4; q++) {
          ctx.beginPath();
          ctx.arc(0, 0, r, q * Math.PI / 2 + 0.25, q * Math.PI / 2 + 1.1);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    // The pin, popping in.
    ctx.save();
    ctx.translate(x, top);
    ctx.scale(pop, pop);
    pin(ctx, 0, 0, 1.15, k);
    if (p.kind === 'help') text(ctx, '!', 0, -6.6, { size: 9, bold: true, align: 'center', color: '#ffffff', outline: k.dark });
    else icon(ctx, p.kind === 'attack' ? 'sight' : 'pin', 0, -10.3, 7, '#ffffff');
    ctx.restore();
    // Who sent it, on a pill.
    const label = `${p.from === 'you' ? 'You' : p.name}: ${k.label}`;
    ctx.font = font(7, true);
    const w = ctx.measureText(label).width + 10;
    const ly = top - 30 + (1 - pop) * 4;
    box(ctx, x - w / 2, ly, w, 11, { fill: 'rgba(255,255,255,0.94)', edge: k.color, r: 5.5, width: 1.2 });
    text(ctx, label, x, ly + 8.2, { size: 7, bold: true, align: 'center', color: k.dark });
    ctx.restore();
  }
}

// On the minimap: a pulsing ring in the ping's colour (X and Y take map spots to the minimap).
export function drawMinimapPings(ctx, world, X, Y) {
  for (const p of world.pings ?? []) {
    if (p.map !== world.map.id) continue;
    const s = pingSpot(p);
    const { age, fade } = life(p, world.now);
    const k = PINGS[p.kind];
    const x = X(s.x);
    const y = Y(s.y) - 2;
    ctx.save();
    ctx.globalAlpha = fade;
    const u = (age * 1.2) % 1;
    ctx.strokeStyle = k.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = fade * (1 - u);
    ctx.beginPath();
    ctx.arc(x, y, 2.5 + u * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = fade;
    // A little diamond, so it reads apart from the round dots for people.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y - 3.6);
    ctx.lineTo(x + 3.6, y);
    ctx.lineTo(x, y + 3.6);
    ctx.lineTo(x - 3.6, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = k.color;
    ctx.beginPath();
    ctx.moveTo(x, y - 2.4);
    ctx.lineTo(x + 2.4, y);
    ctx.lineTo(x, y + 2.4);
    ctx.lineTo(x - 2.4, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ---------- Quick emotes for the party ----------

const QUICK = [
  ['cheer', 'Yay'], ['pray', 'Ty'], ['love', '<3'], ['flex', 'Flex'], ['sleepy', 'Zzz'],
];

// A row of chips under the party panel: tap one and it plays over your head for the party.
export function partyEmoteBar(ui, state, world, x, y, w) {
  if (world.dungeon || !hasParty(world)) return 0;
  const { ctx } = ui;
  const th = THEMES.mint;
  const n = QUICK.length;
  const cw = (w - 4 - (n - 1) * 2) / n;
  const recent = world.now - (world.partyEmoteAt ?? -99);
  QUICK.forEach(([id, label], i) => {
    const e = EMOTES.find((m) => m.id === id);
    const cx = x + 2 + i * (cw + 2);
    const hot = hover(ui, cx, y, cw, 12);
    const lift = hot ? 1 : 0;
    box(ctx, cx, y - lift, cw, 12, { fill: hot ? th.main : 'rgba(255,250,246,0.9)', edge: th.main, r: 6, width: 1 });
    text(ctx, label, cx + cw / 2, y + 8.5 - lift, { size: 6.5, bold: true, align: 'center', color: hot ? '#ffffff' : th.dark });
    if (hot) tooltip(ui, [{ text: `${e.label} for the party`, bold: true }, { text: recent < 1.5 ? 'A moment...' : 'Shows over your head; your party may answer', size: 7, color: COLORS.muted }]);
    if (clicked(ui, cx, y, cw, 12)) partyEmote(world, e);
  });
  return 14;
}
