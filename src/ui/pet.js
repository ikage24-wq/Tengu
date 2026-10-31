// The Pet window (P): your Mochi (world/mochi.js). With none yet, an egg to adopt for Cash. With
// one: it on the left, bouncing and cheering when you click it, and its name; on the right what it
// does for you (loot, and the HP and MP it drinks a tonic at), and whether it's out with you.

import { drawMochi, MOCHI_CHEER } from '../render/mochi.js';
import { adoptPet, EGG_CASH, PET_REACH } from '../world/mochi.js';
import { COLORS, windowFrame, button, text, hover, clicked, tooltip, well, toggle } from './kit.js';

const W = 330;
const H = 214;
// The Mochi shown in the window (its own, so its idle bits don't fight the one in the world).
const preview = { form: 'baby', dir: 1, seed: 3, cheerAt: null };

export function petWindow(ui, state, world) {
  const win = state.windows.pet;
  if (!windowFrame(ui, win, W, H, 'Mochi')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const pet = char.pet;
  const x0 = win.x + 10;
  const y0 = win.y + 26;
  const now = world.now;

  // ----- The left: the Mochi (or its egg) -----
  well(ctx, x0, y0, 110, H - 36, th);
  if (!pet) {
    // An egg, rocking a little, and the price.
    const ex = x0 + 55;
    const ey = y0 + 70 + Math.sin(now * 3) * 1.5;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(Math.sin(now * 2) * 0.12);
    ctx.fillStyle = '#fff8ee';
    ctx.strokeStyle = '#d9b98a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#f4a7c4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -3);
    for (let i = 0; i < 5; i++) ctx.lineTo(-13 + (i + 0.5) * 6.5, i % 2 ? -3 : 3);
    ctx.stroke();
    ctx.restore();
    text(ctx, 'A Mochi egg!', ex, y0 + 116, { size: 9, bold: true, align: 'center', color: th.ink });
    text(ctx, `${EGG_CASH.toLocaleString()} Cash`, ex, y0 + 128, { size: 8, align: 'center', color: COLORS.muted });
    const reason = (char.cash ?? 0) < EGG_CASH ? `You have ${(char.cash ?? 0).toLocaleString()} Cash.` : null;
    if (button(ui, x0 + 12, y0 + 138, 86, 18, 'Adopt', { primary: true, enabled: !reason, size: 9 })) {
      const why = adoptPet(char);
      if (why) world.log(why, '#ffb3c6');
      else {
        world.log('Your Mochi hatched! Say hello.', '#ffc2d8');
        preview.cheerAt = now;
      }
    }
    if (reason && hover(ui, x0 + 12, y0 + 138, 86, 18)) tooltip(ui, [{ text: reason, bold: true }]);
    // What a Mochi does, while you think about it.
    const lines = ['A pet that follows you round:', '• picks up your loot', '• drinks a tonic when you run low', '', 'It never needs feeding.'];
    lines.forEach((l, i) => text(ctx, l, x0 + 120, y0 + 12 + i * 12, { size: 8, bold: i === 0, color: i === 0 ? th.ink : COLORS.ink }));
    return;
  }
  // Click it to make it cheer.
  if (clicked(ui, x0, y0, 110, 100)) preview.cheerAt = now;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 + 2, y0 + 2, 106, 98);
  ctx.clip();
  ctx.translate(x0 + 55, y0 + 92);
  ctx.scale(2, 2);
  drawMochi(ctx, preview, 0, 0, now);
  ctx.restore();
  if (preview.cheerAt != null && now - preview.cheerAt > (MOCHI_CHEER.baby ?? 2)) preview.cheerAt = null;
  text(ctx, pet.name, x0 + 55, y0 + 114, { size: 11, bold: true, align: 'center', color: th.ink });
  if (button(ui, x0 + 12, y0 + 150, 86, 16, pet.out ? 'Send home' : 'Take along', { size: 8, primary: !pet.out })) pet.out = !pet.out;

  // ----- The right: helping -----
  const rx = x0 + 118;
  const rw = W - 138;
  let y = y0 + 4;
  // What it does for you.
  const opts = pet.opts;
  text(ctx, 'Loot', rx, y + 9, { size: 7.5, bold: true, color: th.ink });
  opts.loot = toggle(ui, rx + 26, y + 1, opts.loot);
  text(ctx, `${PET_REACH.range}px`, rx + rw - 4, y + 9, { size: 6.5, align: 'right', color: COLORS.muted });
  y += 16;
  const stepper = (label, key, color) => {
    text(ctx, label, rx, y + 9, { size: 7.5, bold: true, color });
    if (button(ui, rx + 44, y, 16, 13, '-', { size: 8 })) opts[key] = Math.max(0, opts[key] - 5);
    text(ctx, opts[key] ? `${opts[key]}%` : 'off', rx + 76, y + 9.5, { size: 8, bold: true, align: 'center', color: COLORS.ink });
    if (button(ui, rx + 92, y, 16, 13, '+', { size: 8 })) opts[key] = Math.min(90, opts[key] + 5);
    y += 15;
  };
  stepper('HP tonic', 'hp', COLORS.hp);
  stepper('MP tonic', 'mp', COLORS.mp);
}
