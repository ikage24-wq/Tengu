// Fish requests (world/fishrequests.js): the page in a tackle shop's dialog (Pip, Marlo, Mister
// Brine). Three cards: who wants what, the fish itself, how far along you are, and a Hand in
// button.

import { FISH_BY_ID, WHEN_NAMES, SPOTS } from '../data/fishing.js';
import { getMap } from '../data/maps.js';
import { drawItemIcon } from '../render/icons.js';
import { fishRequests, requestText, requestProgress, handInRequest } from '../world/fishrequests.js';
import { COLORS, text, box, button, wrap, fit, bar, icon } from './kit.js';

const KIND = { bring: ['Bring some', '#7fd1a0'], size: ['A big one', '#8fb8ff'], rare: ['Something rare', '#ffb36b'] };

// Where a fish bites, for its card: the first place that has it.
const whereOf = (id) => {
  const at = Object.entries(SPOTS).find(([, list]) => list.some((s) => s.pool[id]));
  return !at ? '' : at[0].startsWith('voyage') ? 'At sea on the Sea Biscuit' : getMap(at[0]).name;
};

// Returns true when it closed.
export function fishRequestPage(ui, state, world, area) {
  const { ctx } = ui;
  const { x: tx, w: tw, theme: th } = area;
  const char = world.char;
  const list = fishRequests(world);
  text(ctx, 'Fish Requests', tx, area.y, { size: 9, bold: true, color: th.ink });
  text(ctx, 'New ones every day', tx + tw, area.y, { size: 6.5, align: 'right', color: COLORS.muted });
  const y = area.y + 6;
  const cardW = (tw - 8) / 3;
  list.forEach((r, i) => {
    const f = FISH_BY_ID[r.fish];
    const cx = tx + i * (cardW + 4);
    const [label, col] = KIND[r.kind];
    const p = requestProgress(char, r);
    box(ctx, cx, y, cardW, 112, { fill: r.done ? '#f4fff8' : '#ffffff', edge: r.done ? '#7fd1a0' : p.ready ? col : th.light, r: 8, width: p.ready || r.done ? 2 : 1.2 });
    box(ctx, cx + 3, y + 3, cardW - 6, 12, { fill: col, edge: null, r: 6 });
    icon(ctx, r.kind === 'rare' ? 'star' : r.kind === 'size' ? 'heart' : 'leaf', cx + 10, y + 9, 7, '#ffffff');
    text(ctx, label, cx + 17, y + 12, { size: 6.5, bold: true, color: '#ffffff', outline: 'rgba(58,45,79,0.45)' });
    drawItemIcon(ctx, f.id, cx + cardW / 2 - 12, y + 18, 1.5);
    wrap(ctx, requestText(r), cx + 5, y + 50, cardW - 10, { size: 6.2, lineHeight: 7.6, color: COLORS.ink });
    const hint = f.when ? `${whereOf(f.id)} · ${WHEN_NAMES[f.when]}` : whereOf(f.id);
    text(ctx, fit(ctx, hint, cardW - 10, 5.6, false), cx + 5, y + 82, { size: 5.6, color: COLORS.muted });
    text(ctx, `${r.gold.toLocaleString()} gold · Fishing EXP`, cx + 5, y + 90, { size: 5.8, bold: true, color: COLORS.gold });
    if (r.done) text(ctx, 'Done! Thank you!', cx + cardW / 2, y + 104, { size: 7, bold: true, align: 'center', color: '#3f9f5f' });
    else {
      bar(ctx, cx + 5, y + 95, cardW - 56, 3.5, p.have / p.need, col, null);
      text(ctx, `${p.have}/${p.need}`, cx + 5, y + 106, { size: 6, bold: true, color: COLORS.ink });
      if (button(ui, cx + cardW - 48, y + 96, 44, 12, 'Hand in', { primary: true, size: 6.5, enabled: p.ready })) {
        const why = handInRequest(world, i);
        if (why) world.log(why, '#ffb3c6');
      }
    }
  });
  if (!list.length) text(ctx, 'No requests today. Come back with a rod!', tx, y + 20, { size: 7, color: COLORS.muted });
  return button(ui, tx + tw - 60, area.bottom - 16, 60, 17, 'Back') || ui.input?.pressed?.has('Backspace');
}
