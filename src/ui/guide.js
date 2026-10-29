// The guide (world.route, world/routes.js): while it leads you somewhere, an arrow points at the
// next portal on the way (bouncing over it when it's on screen, or at the screen's edge toward it
// when it isn't), and a pill above the hotkeys says where you're headed and how many maps are
// left. Tap the pill to stop the guide.

import { MAPS } from '../data/maps.js';
import { nextStep, setRoute } from '../world/routes.js';
import { text, box, clicked, hover, font } from './kit.js';

const PINK = '#ff6b9a';

export function drawGuide(ui, state, world) {
  const route = world.route;
  const cam = state.cam;
  if (!route || !cam || world.scene) return;
  const step = nextStep(world.map.id, route.to);
  if (!step) return;
  const { ctx } = ui;
  const t = world.now;
  const p = step.portal;
  const x = p.x - cam.x;
  const y = p.y - cam.y;
  const onScreen = x > 16 && x < 624 && y > 40 && y < 330;
  ctx.save();
  if (onScreen) {
    // Over the portal: a bouncing arrow pointing down at it.
    const ay = y - 122 - Math.abs(Math.sin(t * 4)) * 5;
    arrow(ctx, x, ay, Math.PI / 2, 1);
  } else {
    // At the edge of the screen, toward it.
    const ex = Math.max(22, Math.min(618, x));
    const ey = Math.max(70, Math.min(300, y - 40));
    const a = Math.atan2(y - 40 - ey + (ex === 22 || ex === 618 ? 0 : 1), x - ex || (x < 320 ? -1 : 1));
    const push = Math.sin(t * 5) * 3;
    arrow(ctx, ex + Math.cos(a) * push, ey + Math.sin(a) * push, a, 1);
  }
  ctx.restore();
  // The pill: where you're headed, and how far.
  const dest = MAPS[route.to].name;
  const label = `★ ${dest}  ·  ${step.left} map${step.left === 1 ? '' : 's'} to go`;
  ctx.font = font(7.5, true);
  const w = ctx.measureText(label).width + 30;
  const bx = 320 - w / 2;
  const by = 300;
  const hot = hover(ui, bx, by, w, 15);
  box(ctx, bx, by, w, 15, { fill: hot ? '#ff8fb5' : PINK, edge: '#ffffff', r: 7.5, width: 1.5 });
  text(ctx, label, bx + 10, by + 10.5, { size: 7.5, bold: true, color: '#ffffff' });
  text(ctx, '✕', bx + w - 11, by + 10.5, { size: 7.5, bold: true, color: '#ffffff' });
  if (clicked(ui, bx, by, w, 15)) setRoute(world, null);
}

// A fat pink arrow with a white rim, pointing along angle `a`.
function arrow(ctx, x, y, a, k) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-2, -10);
  ctx.lineTo(-2, -4);
  ctx.lineTo(-12, -4);
  ctx.lineTo(-12, 4);
  ctx.lineTo(-2, 4);
  ctx.lineTo(-2, 10);
  ctx.closePath();
  ctx.fillStyle = PINK;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}
