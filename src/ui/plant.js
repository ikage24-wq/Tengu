// Planting a garden plot on your island (world/home.js): Up at an empty plot opens this, the herbs,
// fruit and fibre in your bag that will grow there. Click one to plant it; it grows into a few
// more in real time (data/home.js GROW_SECS), while you're away too, and waits for you when it's
// ripe. Each needs the Gathering level of its tier, like picking it wild.

import { ITEMS } from '../data/items.js';
import { GROW_SECS, HOME_STAGES } from '../data/home.js';
import { plantables, plant, plantLevel, plotYield } from '../world/home.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, windowFrame, text, hover, clicked, itemSlot, tooltip, button } from './kit.js';
import { itemTooltip } from './tooltips.js';

const W = 262;
const COLS = 8;
const CELL = 30;

export function plantWindow(ui, state, world) {
  const dlg = state.npc;
  const win = state.windows.npc;
  const char = world.char;
  const list = plantables(char);
  const rows = Math.max(1, Math.ceil(list.length / COLS));
  const H = 70 + rows * CELL + 26;
  if (!dlg.placedPlant) {
    win.x = Math.round((640 - W) / 2);
    win.y = Math.max(20, 326 - H - 8);
    dlg.placedPlant = true;
  }
  if (!windowFrame(ui, win, W, H, `Garden plot ${dlg.plot + 1}`, { theme: 'mint', icon: 'leaf' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  text(ctx, 'What shall we plant?', win.x + 12, win.y + 36, { size: 9, bold: true, color: COLORS.ink });
  text(ctx, `Ripe in ${Math.round(GROW_SECS / 60)} minutes, even while you're away. It waits for you.`, win.x + 12, win.y + 49, { size: 7, color: COLORS.muted });
  const gx = win.x + 12;
  const gy = win.y + 60;
  list.forEach((e, i) => {
    const x = gx + (i % COLS) * CELL;
    const y = gy + Math.floor(i / COLS) * CELL;
    const hot = hover(ui, x, y, CELL - 3, CELL - 3);
    itemSlot(ctx, x, y, CELL - 3, { id: e.id, qty: e.n }, { state: hot && e.ok ? 'hot' : null, fill: e.ok ? '#fffdfb' : '#efeaf2' });
    // (Locked: faded, its Gathering level, or the stage an island seed waits for, across the top.)
    if (!e.ok) {
      ctx.fillStyle = 'rgba(239, 234, 242, 0.55)';
      ctx.fillRect(x + 1, y + 1, CELL - 5, CELL - 5);
      text(ctx, e.stage ? 'Later' : `Lv ${plantLevel(e.id)}`, x + (CELL - 3) / 2, y + 7, { size: 6.5, bold: true, align: 'center', color: COLORS.bad });
    }
    if (hot) {
      const more = e.ok
        ? { text: `Plant one: grows into ${plotYield(e.id)}`, size: 7, bold: true, color: '#3fb383' }
        : { text: e.stage ? `Needs ${HOME_STAGES[e.stage].name} built first` : `Needs Gathering Lv ${plantLevel(e.id)}`, size: 7, bold: true, color: COLORS.bad };
      tooltip(ui, [...itemTooltip(char, e.id), more]);
    }
    if (clicked(ui, x, y, CELL - 3, CELL - 3)) {
      const why = plant(char, dlg.plot, e.id);
      if (why) {
        world.log(why, '#ffb3c6');
        return;
      }
      world.log(`You plant ${ITEMS[e.id].name}. Shelly gives it a pat. Back in ${Math.round(GROW_SECS / 60)} minutes!`, '#d6f5b0');
      sfx('plantSeed');
      state.npc = null;
    }
  });
  if (button(ui, win.x + W - 62, win.y + H - 22, 54, 16, 'Close', { size: 8 })) state.npc = null;
}
