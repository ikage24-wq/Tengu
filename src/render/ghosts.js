// Friends in your online room (see net/online.js), drawn on your map just like you are: their
// own look, gear, moves, buffs and job aura, with a sky-blue name tag and their HP underneath.

import { drawMount } from './mounts.js';
import { MOUNTS } from '../data/mounts.js';
import { tagFade } from './coop.js';
import { drawHero } from './hero.js';
import { drawFallen } from './town.js';
import { drawCombatAura } from './aura.js';
import { drawBuffEffects } from './buffs.js';
import { createAnim, stepAnim } from './animator.js';
import { moveAt } from './moves.js';
import { snap, footShadow, slopeAt } from './pixel.js';
import { text, box, sparkle } from '../ui/kit.js';
import { drawBubble } from '../ui/chat.js';
import { settings } from '../core/settings.js';
import { othersHere, ghostPose } from '../net/online.js';
import { botsHere } from '../net/dungeonrun.js';
import { drawFriendFishing } from './fishing.js';
import { friendFishPose } from './life.js';
import { drawMochiAnim } from './mochi-anim.js';
import { friendMochi, followFriend } from '../world/mochi.js';

const TAG = 'rgba(58,128,214,0.86)';
const TAG_EDGE = '#d6ecff';

export function drawGhosts(ctx, world, cam, width, time) {
  // Friends here, and in a friend's dungeon run, the bots of their group.
  const dt = time - (drawGhosts.at ?? time);
  drawGhosts.at = time;
  for (const g of [...othersHere(world), ...botsHere(world, dt)]) {
    if (!g.look) continue;
    const b = g.body;
    const x = snap(b.x - cam.x);
    const y = snap(b.y - cam.y);
    if (x < -80 || x > width + 80) continue;
    // Their walk cycle, hair and cape springs run here, from how they move on your screen.
    g.anim ??= createAnim();
    const dt = g.drawnAt == null ? 0 : Math.min(0.1, Math.max(0, time - g.drawnAt));
    g.drawnAt = time;
    stepAnim(g.anim, b, dt);
    // A friend fishing plays the same fishing poses you do (render/life.js).
    const p = g.fish ? friendFishPose(g.fish, time) : ghostPose(g);
    let tip = null;
    const look = g.emote ? { ...g.look, face: g.emote } : g.look;
    const state = { ...p, time, facing: b.facing, hurt: g.hurt, alpha: g.dead ? 0.5 : 1, job: g.job, ready: !world.map.isTown, urgent: true };
    // Their Mochi out with them, at their heels (not in a garden, where it's one of the garden's,
    // nor in a race).
    if (g.pet && !world.map.garden && !world.race && !g.dead) {
      if (!g.mochi || g.mochi.map !== world.map.id || g.mochi.rec.seed !== g.pet.seed) g.mochi = friendMochi(world, g.pet, b);
      g.mochi.rec = g.pet;
      g.mochi.m.genes = g.pet;
      followFriend(world, g.mochi, dt, b);
      drawMochiAnim(ctx, g.mochi.m, g.mochi.x - cam.x, g.mochi.y - cam.y, world.now);
    }
    if (b.onGround) footShadow(ctx, x, y, 13, slopeAt(b.surface, b.x));
    if (g.dead) {
      g.fellAt ??= time;
      drawFallen(ctx, look, g.gear, x, y, { ...state, alpha: 0.85 }, time - g.fellAt);
    } else {
      g.fellAt = null;
      drawBuffEffects(ctx, g.buffs, 'back', x, y, time, world.now, b.facing);
      const ay = y - (p.pose ? moveAt(p.pose, p.progress ?? 0, p.dur)?.lift ?? 0 : 0);
      const scale = g.form ? 1.4 : 1;
      if (g.gauge) drawCombatAura(ctx, g.gauge, 'back', x, ay, time, scale, g.gk, b.facing);
      // Riding: their mount, moving as they do (render/mounts.js).
      if (g.ride && MOUNTS[g.ride.id] && !b.rope) {
        const top = 125 * (MOUNTS[g.ride.id].speed / 100);
        if (g.ride.s !== 'glide' && g.ride.s !== 'hover' && !b.onGround !== g.rideAir) g.rideLand = b.onGround ? time : g.rideLand;
        g.rideAir = !b.onGround;
        drawMount(ctx, g, g.ride.id, x, y, time, { facing: b.facing, speed: Math.abs(b.vx) / top, air: !b.onGround, vy: b.vy, special: g.ride.s, hoverLeft: g.ride.h, landAt: g.rideLand ?? -9 }, { look });
      } else drawHero(ctx, look, g.gear, x, y, g.fish ? { ...state, onTool: (pt) => { tip = pt; } } : state, g.anim);
      if (g.gauge) drawCombatAura(ctx, g.gauge, 'front', x, ay, time, scale, g.gk, b.facing);
      drawBuffEffects(ctx, g.buffs, 'front', x, y, time, world.now, b.facing);
      if (g.fish) drawFriendFishing(ctx, g.fish, x, y, cam, time, tip);
    }
    nameTag(ctx, g, x, y, time);
    if (g.bubble && settings.chatBubbles) drawBubble(ctx, x, y - 62, g.bubble.text, Math.min(1, g.bubble.t * 2));
  }
}

// A sky-blue tag with a twinkling star: a real friend, not one of the townsfolk.
function nameTag(ctx, g, x, y, time) {
  ctx.save();
  ctx.globalAlpha *= tagFade(x, y);
  ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const label = `Lv${g.level ?? 1} ${g.name}`;
  const w = ctx.measureText(label).width + 18;
  box(ctx, x - w / 2, y + 2, w, 10, { fill: TAG, edge: TAG_EDGE, r: 5, width: 1 });
  sparkle(ctx, x - w / 2 + 6, y + 7, 2.4 + Math.sin(time * 4 + g.id.length) * 0.4, '#ffffff');
  text(ctx, label, x + 4, y + 9.5, { size: 7, bold: true, align: 'center', color: '#ffffff' });
  if (g.maxHp) {
    const f = Math.max(0, Math.min(1, g.hp / g.maxHp));
    box(ctx, x - 16, y + 13, 32, 4, { fill: 'rgba(58,45,79,0.6)', edge: null, r: 2 });
    if (f > 0) box(ctx, x - 16, y + 13, Math.max(2, 32 * f), 4, { fill: f < 0.3 ? '#ff6b8a' : '#7ee081', edge: null, r: 2 });
  }  ctx.restore();
}
