// The Masked Moth's wares at the Night Market (world/nightmarket.js), in her dialog: tonight's
// oddity, large, and three one-off wares, each with its price and Buy (or Sold).

import { ITEMS, RARITIES } from '../data/items.js';
import { itemName } from '../core/items.js';
import { drawItemIcon } from '../render/icons.js';
import { tonight, buyNight, boughtTonight } from '../world/nightmarket.js';
import { COLORS, text, box, button, wrap, fit, hover, tooltip } from './kit.js';
import { itemTooltip } from './tooltips.js';

const MOTH = '#8f6ad8';

// Returns true when it closed.
export function nightPage(ui, state, world, area) {
  const { ctx } = ui;
  const { x: tx, w: tw } = area;
  const char = world.char;
  const goods = tonight(world);
  text(ctx, 'Tonight at the Night Market', tx, area.y, { size: 9, bold: true, color: MOTH });
  text(ctx, `Gold: ${char.gold.toLocaleString()}`, tx + tw, area.y, { size: 6.5, align: 'right', color: COLORS.gold });
  let y = area.y + 8;
  // The oddity: a card across the top.
  const [odd, ...wares] = goods;
  const card = (g, cx, cy, w, h, big) => {
    const sold = boughtTonight(world, g.key);
    box(ctx, cx, cy, w, h, { fill: sold ? '#f4f0fa' : big ? '#faf4ff' : '#ffffff', edge: big ? MOTH : '#d8c8f0', r: 8, width: big ? 2 : 1.2 });
    drawItemIcon(ctx, g.id, cx + 6, cy + (big ? 8 : 6), big ? 1.5 : 1);
    if (hover(ui, cx + 6, cy + 6, big ? 24 : 16, big ? 24 : 16)) tooltip(ui, itemTooltip(char, g.id, g.rarity ? { id: g.id, rarity: g.rarity } : null));
    const rar = RARITIES[g.rarity ?? 0];
    const x0 = cx + (big ? 36 : 26);
    const name = g.name ?? `${g.rarity ? `${rar.name} ` : ''}${itemName(g.id)}${g.qty > 1 ? ` ×${g.qty}` : ''}`;
    if (big) {
      text(ctx, "The Moth's oddity", x0, cy + 10, { size: 6, bold: true, color: MOTH });
      text(ctx, fit(ctx, name, w - 110, 8, true), x0, cy + 21, { size: 8, bold: true, color: g.rarity ? rar.color : COLORS.ink });
      text(ctx, fit(ctx, ITEMS[g.id].desc ?? '', w - 110, 5.8, false), x0, cy + 30, { size: 5.8, color: COLORS.muted });
    } else wrap(ctx, name, x0, cy + 10, w - 32, { size: 6.4, lineHeight: 7.6, bold: true, color: g.rarity ? rar.color : COLORS.ink });
    text(ctx, `${g.price.toLocaleString()} gold`, big ? cx + w - 74 : cx + 6, big ? cy + 14 : cy + h - 18, { size: big ? 7.5 : 6.5, bold: true, color: COLORS.gold });
    const bx = big ? cx + w - 74 : cx + w - 44;
    const by = big ? cy + 20 : cy + h - 16;
    if (sold) text(ctx, 'Sold!', bx + 20, by + 9, { size: 7, bold: true, align: 'center', color: COLORS.muted });
    else if (button(ui, bx, by, big ? 66 : 40, 13, 'Buy', { primary: true, size: 6.5, enabled: char.gold >= g.price })) {
      const why = buyNight(world, g.key);
      if (why) world.log(why, '#ffb3c6');
    }
  };
  card(odd, tx, y, tw, 40, true);
  y += 46;
  const cw = (tw - 8) / 3;
  wares.forEach((g, i) => card(g, tx + i * (cw + 4), y, cw, 64, false));
  text(ctx, 'Only once each, only tonight. New wares when the lamps are lit again.', tx, y + 76, { size: 6.2, color: COLORS.muted });
  return button(ui, tx + tw - 60, area.bottom - 16, 60, 17, 'Back') || ui.input?.pressed?.has('Backspace');
}
