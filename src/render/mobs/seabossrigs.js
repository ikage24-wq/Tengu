// The Sunken Aquarium Palace's Keepsake Bubble (the bosses themselves were redrawn 2026-11-19 and
// live in their own modules: morayrig.js, abyssiarig.js, coralierig.js).

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
    if (m.hp <= 0) return;
    const t = a.t + (m.uid % 7) * 0.7;
    const held = m.heldId != null;
    const r = 19;
    const cy = -r - (held ? 22 : 12) - Math.sin(t * 2) * 3;
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
