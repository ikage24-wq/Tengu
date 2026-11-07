// Penny's book at the Trade Hall (world/rep.js): your Merchant Rep, how to earn more, every
// standing with what it gives (the ones you have ticked), and your stall once you're licensed.

import { REP, repTier, repPoints, stallSize } from '../world/rep.js';
import { COLORS, text, box, button, bar } from './kit.js';

const WAYS = 'Earn it: sell at the Auction House, bring in guild bounties, fill fish requests, stay at the Gilded Kettle, sell at your stall.';

// Returns true when it closed.
export function repPage(ui, state, world, area) {
  const { ctx } = ui;
  const { x: tx, w: tw, theme: th } = area;
  const char = world.char;
  const tier = repTier(char);
  const pts = repPoints(char);
  const i = REP.indexOf(tier);
  const next = REP[i + 1];
  text(ctx, `Merchant Rep · ${tier.name}`, tx, area.y, { size: 9, bold: true, color: th.ink });
  text(ctx, next ? `${pts}/${next.need} to ${next.name}` : `${pts} · the highest standing`, tx + tw, area.y, { size: 6.5, align: 'right', color: COLORS.muted });
  const lo = tier.need;
  bar(ctx, tx, area.y + 5, tw, 4, next ? (pts - lo) / (next.need - lo) : 1, tier.color, null);
  text(ctx, WAYS, tx, area.y + 17, { size: 5.8, color: COLORS.muted });
  let y = area.y + 24;
  REP.forEach((t, k) => {
    const have = k <= i;
    box(ctx, tx, y, tw, 17, { fill: have ? '#fffaf0' : '#ffffff', edge: have ? t.color : th.light, r: 6, width: have ? 1.6 : 1 });
    text(ctx, `${have ? '✓ ' : ''}${t.name}`, tx + 6, y + 11, { size: 7, bold: true, color: have ? COLORS.ink : COLORS.muted });
    const perks = [`${Math.round(t.fee * 100)}% auction fee`, `${t.slots} auction slots`, ...(t.stall ? [`your own stall (${t.stall})`] : []), ...(t.title ? ['a title'] : [])].join(' · ');
    text(ctx, `${t.need} rep · ${perks}`, tx + tw - 6, y + 11, { size: 6, align: 'right', color: have ? COLORS.ink : COLORS.muted });
    y += 19;
  });
  // Your stall.
  y += 4;
  if (stallSize(char)) {
    const s = char.stall ?? { items: [], till: 0 };
    text(ctx, `Your stall: ${s.items.length}/${stallSize(char)} on the counter · ${(s.till ?? 0).toLocaleString()} gold in the till`, tx, y + 8, { size: 7, bold: true, color: COLORS.gold });
    if (button(ui, tx + tw - 84, y, 84, 14, 'Tend your stall', { primary: true, size: 6.5 })) {
      Object.assign(state.windows.auction, { open: true, tab: 5 });
      state.npc = null;
      state.windows.npc.open = false;
      return true;
    }
  } else text(ctx, 'A Merchant Friend gets a licence for a stall of their own on the market canal.', tx, y + 8, { size: 6.5, color: COLORS.muted });
  return button(ui, tx + tw - 60, area.bottom - 16, 60, 17, 'Back') || ui.input?.pressed?.has('Backspace');
}
