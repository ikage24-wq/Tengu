// The Sunken Aquarium Palace's Keepsake Bubble (the bosses themselves were redrawn 2026-11-19 and
// live in their own folders: the Twin Morays in render/moray/, Lady Abyssia in render/abyssia/, Queen Coralie in render/coralie/).

import { E, T, F, stroke } from './kit.js';
import { arcP, shift } from './rigkit.js';
import { TAU } from './rig.js';

// =====================================================================================
// The Keepsake Bubble (added 2026-11-18)
// =====================================================================================
// A big wobbly bubble Queen Coralie blows. It drifts after someone; whoever it reaches floats inside
// it (world/aquarium.js) till it's popped. Drawn live (a bubble you see through), no sprite.
export const keepsakeRig = {
  w: 60,
  h: 80,
  draw(ctx, m, a) {
    const t = a.t + (m.uid % 7) * 0.7;
    const held = m.heldId != null;
    const r = 19;
    // (Rising as it takes someone up, eased, 2026-11-19: it jumped.)
    const mo = a.mo ?? {};
    const goal = held ? 22 : 12;
    mo.kbUp = mo.kbUp == null ? goal : mo.kbUp + (goal - mo.kbUp) * Math.min(1, (a.dt ?? 1 / 60) * 6);
    const cy = -r - mo.kbUp - Math.sin(t * 2) * 3;
    // Popped: the skin bursts into curved shards flying out and fading, a few droplets falling,
    // the little bow tumbling down (2026-11-19: it just vanished).
    if (m.hp <= 0) {
      const u = Math.min(1, (m.dying ?? 1) / 0.45);
      if (u >= 1) return;
      const e = 1 - (1 - u) * (1 - u);
      ctx.save();
      ctx.globalAlpha = a.alpha * (1 - u);
      ctx.strokeStyle = '#d8f8ff';
      ctx.lineWidth = 1.6 * (1 - u) + 0.4;
      for (let k = 0; k < 7; k++) {
        const ang = (k / 7) * TAU + 0.3;
        const rr = r * (1 + e * 0.9);
        ctx.beginPath();
        ctx.arc(0, cy, rr, ang, ang + 0.42 * (1 - u * 0.6));
        ctx.stroke();
      }
      ctx.fillStyle = '#e8fbff';
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * TAU + 0.7;
        const d = r * (0.6 + e * 0.9);
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * d, cy + Math.sin(ang) * d + u * u * 14, 1.6 * (1 - u) + 0.4, 2 * (1 - u) + 0.5, 0, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#ff9ab8';
      ctx.save();
      ctx.translate(e * 4, cy - r + u * u * 30);
      ctx.rotate(u * 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-6, 3);
      ctx.closePath();
      ctx.moveTo(0, 0);
      ctx.lineTo(6, -4);
      ctx.lineTo(6, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();
      return;
    }
    const wob = Math.sin(t * 3.4) * 0.05;
    ctx.save();
    const g = ctx.createRadialGradient(-6, cy - 7, 1, 0, cy, r);
    g.addColorStop(0, `rgba(240,253,255,${0.45 * a.alpha})`);
    g.addColorStop(0.75, `rgba(159,230,246,${0.12 * a.alpha})`);
    g.addColorStop(1, `rgba(159,230,246,${0.45 * a.alpha})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, cy, r * (1 + wob), r * (1 - wob), 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
    ctx.strokeStyle = a.flash > 0 ? '#ffffff' : '#d8f8ff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, cy, r * 0.72, r * 0.72, 0, Math.PI * 1.1, Math.PI * 1.45);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.45, cy + r * 0.4, 1.8, 0, TAU);
    ctx.fill();
    // A little bow of seafoam ribbon on top: her keepsakes are gifts.
    ctx.fillStyle = '#ff9ab8';
    ctx.beginPath();
    ctx.moveTo(0, cy - r);
    ctx.lineTo(-6, cy - r - 4);
    ctx.lineTo(-6, cy - r + 3);
    ctx.closePath();
    ctx.moveTo(0, cy - r);
    ctx.lineTo(6, cy - r - 4);
    ctx.lineTo(6, cy - r + 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },
};
export function keepsakeStill() {
  return { w: 50, h: 54, res: 2, shapes: shift([...stroke(arcP(0, -24, 19, 19, 0, 360, 24), 1.6, '#d8f8ff', false), F(E(-6, -31, 3, 2, '#ffffff')), T([[0, -43], [-6, -47], [-6, -40]], '#ff9ab8'), T([[0, -43], [6, -47], [6, -40]], '#ff9ab8')], 25, 50) };
}
