// Asking a Sweetheart on a date (world/dates.js): which date, and off you go.
import { wrap, button } from './kit.js';

export function datePage(ui, state, world, npc, area) {
  const dlg = state.npc;
  wrap(ui.ctx, 'Dates are on their way!', area.x, area.y + 4, area.w, { size: 8 });
  if (button(ui, area.x + area.w - 74, area.bottom - 16, 74, 17, 'Back')) dlg.date = false;
}
