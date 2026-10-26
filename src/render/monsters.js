// Monsters: picks each design's sprite for its pose, frame, and mood, and draws it in the world
// with its shadow, flashes, spawn pop, poof, status effects, and a face that shows how it feels:
//   idle   calm, with blinks and happy squints
//   angry  fierce while it chases you (or a boss winds up)
//   hurt   squeezed >< eyes for a moment after each hit
//   dead   x eyes as it poofs away
// The designs themselves live in mobs/, one module per region. Little emote bubbles (!, anger
// marks, sweat, music notes, z's) float over their heads.

import { sprite, blit, snap, footShadow } from './pixel.js';
import { ART as MEADOW } from './mobs/meadow.js';
import { ART as WILDS } from './mobs/wilds.js';
import { ART as RUINS } from './mobs/ruins.js';
import { ART as SKY } from './mobs/sky.js';
import { ART as HOLLOW } from './mobs/hollow.js';
import { ART as BOSSES } from './mobs/bosses.js';

const ARTS = { ...MEADOW, ...WILDS, ...RUINS, ...SKY, ...HOLLOW, ...BOSSES };

// How many frames an art has for walking (or flying) and for idling.
export function framesOf(art) {
  const a = ARTS[art];
  return { walk: a.walk ?? 4, idle: a.idle ?? 2 };
}

export function monsterSprite(art, frame, mood = 'idle', pose = 'walk') {
  const a = ARTS[art];
  return sprite(`mob|${art}|${pose}${frame}|${mood}`, () => ({ res: 2, soft: 'cel', crisp: true, ...a.draw(pose, frame, mood) }));
}

// How a monster feels right now.
function moodOf(m, t, now) {
  if (m.hp <= 0) return 'dead';
  if (m.flash > 0 || m.stagger > 0) return 'hurt';
  if (m.special?.warn > 0) return 'angry';
  if (now < m.aggroUntil && m.def.aggro) return 'angry';
  const cyc = (t * 0.3) % 1;
  if (cyc < 0.04) return 'blink';
  if (m.state === 'idle' && cyc > 0.55 && cyc < 0.75) return 'happy';
  return 'idle';
}

// Emote bubbles over the head: "!" right after it gets angry, a pulsing anger mark while it
// chases, a sweat drop when hit, and music notes or z's while it lazes about.
function drawEmote(ctx, m, mood, x, top, t, now) {
  ctx.save();
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  const hx = x + (m.dir < 0 ? -1 : 1) * m.def.w * 0.32;
  if (mood === 'angry' && m.aggroUntil - now > 5.4 && !m.def.boss) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ff5b7f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx, top - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff5b7f';
    ctx.fillText('!', hx, top - 4.6);
  } else if (mood === 'angry') {
    const k = 1 + 0.25 * Math.max(0, Math.sin(t * 8));
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 1.4;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath();
      ctx.moveTo(hx + sx * 0.8 * k, top - 6 + sy * 2.6 * k);
      ctx.lineTo(hx + sx * 0.8 * k, top - 6 + sy * 0.8 * k);
      ctx.lineTo(hx + sx * 2.6 * k, top - 6 + sy * 0.8 * k);
      ctx.stroke();
    }
  } else if (mood === 'hurt') {
    ctx.fillStyle = '#9fdcff';
    ctx.beginPath();
    ctx.arc(hx, top + 2, 2.2, 0, Math.PI * 2);
    ctx.moveTo(hx - 2, top + 1.4);
    ctx.lineTo(hx, top - 2.6);
    ctx.lineTo(hx + 2, top + 1.4);
    ctx.fill();
  } else if (m.state === 'idle' && m.hp > 0) {
    const cyc = (t * 0.3) % 1;
    if (cyc > 0.55 && cyc < 0.8) {
      const u = (cyc - 0.55) / 0.25;
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = '#8f7cc4';
      ctx.fillText(m.uid % 3 === 0 ? 'z' : '♪', hx + u * 4, top - 2 - u * 8);
    }
  }
  ctx.restore();
}

// (x, y) is the monster's feet center in screen space; `now` is world time (for aggro).
// Walkers bounce along with a squash on every landing, everyone breathes while idle, new
// monsters pop in, hits squash them flat for a moment, and defeated ones shrink away.
export function drawMonster(ctx, m, x, y, time, now = time) {
  const frozen = m.frozenUntil > now && m.hp > 0;
  const flying = m.def.fly;
  const moving = !frozen && ((m.state === 'walk' && m.stagger <= 0) || flying);
  // Frozen monsters stop animating: their clock stands still with the ice.
  const t = (frozen ? m.phase : time) + m.uid * 0.37;
  const mood = moodOf(m, t, now);
  const fast = mood === 'angry' ? 1.5 : 1;
  const fr = framesOf(m.def.art);
  const pose = moving ? 'walk' : 'idle';
  const frame = moving ? Math.floor(t * (flying ? 3 : 2) * fr.walk * fast) % fr.walk : Math.floor(t * 1.6) % fr.idle;
  const s = monsterSprite(m.def.art, frame, mood, pose);
  let alpha = 1;
  let sx = 1;
  let sy = 1;
  if (m.def.boss) {
    sy = 1 + Math.sin(t * 2) * 0.015;
    if (m.special?.warn > 0) {
      // Wind-up: crouch and tremble before the slam.
      sy = 0.9;
      sx = 1.08;
      x += Math.sin(time * 60) * 1.5;
    }
  } else if (!moving) {
    // The idle frames breathe; this only softens the steps between them.
    sy = 1 + Math.sin(t * 3) * 0.012;
  }
  if (m.flash > 0) {
    sx *= 1.14;
    sy *= 0.86;
  }
  if (m.age < 0.3 && m.hp > 0) {
    // Spawn pop with a little overshoot.
    const k = m.age / 0.3;
    const pop = 1 + Math.sin(k * Math.PI) * 0.25;
    sx *= k * pop;
    sy *= k * pop;
    alpha = Math.min(1, k * 2);
  }
  if (m.hp <= 0) {
    alpha = Math.max(0, 1 - m.dying * 2.2);
    sx *= 1 + m.dying * 0.6;
    sy *= Math.max(0.05, 1 - m.dying * 1.8);
  }
  if (sx <= 0 || sy <= 0) return;
  if (!flying) {
    // Ground shadow, along the slope it stands on.
    footShadow(ctx, x, y, Math.max(8, s.w * 0.42), m.yAt ? (m.yAt(m.x + 6) - m.yAt(m.x - 6)) / 12 : 0, alpha);
  }

  // Knocked up into the air: drawn above its shadow, tumbling a little.
  const air = m.air > 0 ? m.air : 0;
  ctx.save();
  ctx.translate(snap(x), snap(y - air));
  if (air) ctx.rotate(-(m.dir < 0 ? -1 : 1) * Math.min(0.5, (m.airV ?? 0) / 900) * 0.6);
  ctx.scale(sx, sy);
  blit(ctx, s, -s.w / 2, -s.h, { flip: m.dir < 0, flash: m.flash, alpha });
  ctx.restore();
  if (m.poison && m.hp > 0) (m.poison.kind === 'bleed' ? bleedDrops : poisonBubbles)(ctx, x, y, s, time + m.uid);
  if (frozen && m.hold === 'stun') dizzyStars(ctx, x, y - s.h * sy - 2, time + m.uid);
  else if (frozen) iceBlock(ctx, x, y, s, m.frozenUntil - now, time + m.uid);
  if (alpha > 0.5 && !frozen) drawEmote(ctx, m, mood, x, y - s.h * sy, t, now);
}

// A clear block of ice around a frozen monster, with frosty edges, glints, and cracks as it thaws.
function iceBlock(ctx, x, y, s, left, time) {
  const w = s.w + 8;
  const h = s.h + 6;
  const bx = snap(x - w / 2);
  const by = snap(y - h);
  ctx.save();
  // Shiver just before it breaks.
  if (left < 0.4) ctx.translate(Math.sin(time * 70) * 1, 0);
  ctx.globalAlpha = 0.42;
  const g = ctx.createLinearGradient(bx, by, bx + w, by + h);
  g.addColorStop(0, '#e8fbff');
  g.addColorStop(0.5, '#9fe3ff');
  g.addColorStop(1, '#6fc4f0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(bx + 3, by);
  ctx.lineTo(bx + w - 2, by + 2);
  ctx.lineTo(bx + w, by + h);
  ctx.lineTo(bx, by + h);
  ctx.lineTo(bx - 1, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Shine streaks and a top rim of frost.
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 4, by + 3, 2, Math.round(h * 0.45));
  ctx.fillRect(bx + 8, by + 3, 1, Math.round(h * 0.25));
  ctx.fillRect(bx + 3, by, w - 6, 2);
  // Little crystals poking out of the top.
  ctx.fillStyle = '#c9f6ff';
  for (const [dx, ch] of [[0.25, 6], [0.55, 9], [0.8, 5]]) {
    const cx = bx + w * dx;
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, by + 1);
    ctx.lineTo(cx, by - ch);
    ctx.lineTo(cx + 2.5, by + 1);
    ctx.fill();
  }
  // A glint that sweeps across.
  const k = (time * 0.8) % 1.6;
  if (k < 1) {
    ctx.globalAlpha = 0.8 * Math.sin(k * Math.PI);
    ctx.fillStyle = '#ffffff';
    const gx = bx + k * w;
    ctx.beginPath();
    ctx.moveTo(gx, by + 2);
    ctx.lineTo(gx + 4, by + 2);
    ctx.lineTo(gx - 2, by + h - 2);
    ctx.lineTo(gx - 6, by + h - 2);
    ctx.fill();
  }
  // Cracks spread as the ice is about to give.
  if (left < 1) {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(bx + w * 0.5, by + h * 0.2);
    ctx.lineTo(bx + w * 0.4, by + h * 0.45);
    ctx.lineTo(bx + w * 0.6, by + h * 0.6);
    if (left < 0.5) {
      ctx.moveTo(bx + w * 0.4, by + h * 0.45);
      ctx.lineTo(bx + w * 0.2, by + h * 0.55);
      ctx.moveTo(bx + w * 0.6, by + h * 0.6);
      ctx.lineTo(bx + w * 0.75, by + h * 0.85);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Stunned: little stars and a swirl circling over the head.
function dizzyStars(ctx, x, y, time) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = time * 5 + (i / 3) * Math.PI * 2;
    const sx = x + Math.cos(a) * 13;
    const sy = y + Math.sin(a) * 4;
    const r = 4 + Math.sin(a) * 1;
    ctx.fillStyle = i === 1 ? '#ffffff' : '#ffe36b';
    ctx.strokeStyle = '#c98a2b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 ? r * 0.45 : r;
      ctx.lineTo(sx + Math.cos(ang) * rr, sy + Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// Bleeding: red drops falling off the monster.
function bleedDrops(ctx, x, y, s, time) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const u = (time * 0.9 + i / 4) % 1;
    const bx = x + (i - 1.5) * s.w * 0.18;
    const by = y - s.h * 0.6 + u * s.h * 0.6;
    ctx.globalAlpha = 1 - u;
    ctx.fillStyle = '#e8364f';
    ctx.beginPath();
    ctx.moveTo(bx, by - 3);
    ctx.quadraticCurveTo(bx + 2.2, by + 0.5, bx, by + 2);
    ctx.quadraticCurveTo(bx - 2.2, by + 0.5, bx, by - 3);
    ctx.fill();
  }
  ctx.restore();
}

// Venom: a sickly green sheen and bubbles that rise and pop off a poisoned monster.
function poisonBubbles(ctx, x, y, s, time) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const u = (time * 0.7 + i / 5) % 1;
    const bx = x + Math.sin(i * 2.3 + time * 2) * s.w * 0.35;
    const by = y - s.h * 0.4 - u * s.h * 0.9;
    const r = (1.2 + (i % 3) * 0.7) * (u > 0.85 ? 1 + (u - 0.85) * 6 : 1);
    ctx.globalAlpha = u > 0.85 ? (1 - u) * 6 * 0.8 : 0.8;
    ctx.fillStyle = i % 2 ? '#9be86b' : '#c46bff';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(bx - r * 0.4), Math.round(by - r * 0.5), 1, 1);
  }
  ctx.globalAlpha = 0.18 + 0.08 * Math.sin(time * 5);
  const g = ctx.createRadialGradient(x, y - s.h / 2, 1, x, y - s.h / 2, s.w * 0.7);
  g.addColorStop(0, '#7de04f');
  g.addColorStop(1, 'rgba(125,224,79,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - s.w, y - s.h * 1.2, s.w * 2, s.h * 1.4);
  ctx.restore();
}
