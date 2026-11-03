// The Party Board (world/partyquest.js): in each town's plaza, kept by Posy. Three party quests at a
// time (a hunt, a gather, a defend) for the region and your level, the one you're on, and Party
// Tokens to trade. Also the little card that tracks a party quest on screen, under the party panel.

import { PQ_KINDS, TOKEN_SHOP } from '../data/coop.js';
import { ITEMS } from '../data/items.js';
import { getMap } from '../data/maps.js';
import { countItem } from '../core/inventory.js';
import { settings } from '../core/settings.js';
import { partyMembers } from '../world/party.js';
import { partyFriends } from '../net/together.js';
import { boardOffers, takePartyQuest, dropPartyQuest, pqGoal, buyWithTokens, boardTurnsIn } from '../world/partyquest.js';
import { COLORS, THEMES, text, box, button, wrap, fit, bar, icon, hover, tooltip } from './kit.js';

const KIND_COLOR = { hunt: '#ff8f9f', gather: '#7fd1a0', defend: '#8fb8ff' };
const KIND_ICON = { hunt: 'star', gather: 'leaf', defend: 'shield' };

// The board's page in Posy's dialog. Returns true when it closed.
export function boardPage(ui, state, world, area) {
  const { ctx } = ui;
  const { x: tx, w: tw, theme: th } = area;
  const char = world.char;
  const offers = boardOffers(world);
  const active = char.partyQuest;
  const party = 1 + partyMembers(world.bots).length + partyFriends().length;
  text(ctx, 'Party Board', tx, area.y, { size: 9, bold: true, color: th.ink });
  text(ctx, `New quests in ${boardTurnsIn(world)} min · Party of ${party}`, tx + tw, area.y, { size: 6.5, align: 'right', color: COLORS.muted });
  let y = area.y + 6;
  const cardW = (tw - 8) / 3;
  offers.forEach((q, i) => {
    const cx = tx + i * (cardW + 4);
    const mine = active?.key === q.key;
    const col = KIND_COLOR[q.kind];
    box(ctx, cx, y, cardW, 70, { fill: mine ? '#fff6fb' : '#ffffff', edge: mine ? col : th.light, r: 8, width: mine ? 2 : 1.2 });
    box(ctx, cx + 3, y + 3, cardW - 6, 12, { fill: col, edge: null, r: 6 });
    icon(ctx, KIND_ICON[q.kind], cx + 10, y + 9, 7, '#ffffff');
    text(ctx, PQ_KINDS[q.kind].label, cx + 17, y + 12, { size: 6.5, bold: true, color: '#ffffff', outline: 'rgba(58,45,79,0.45)' });
    wrap(ctx, pqGoal(q), cx + 5, y + 23, cardW - 10, { size: 6.5, lineHeight: 8, color: COLORS.ink });
    text(ctx, fit(ctx, getMap(q.map).name, cardW - 10, 6, false), cx + 5, y + 47, { size: 6, color: COLORS.muted });
    text(ctx, `${q.reward.exp.toLocaleString()} EXP · ${q.reward.gold} g · ${q.reward.tokens} tokens`, cx + 5, y + 55, { size: 5.5, bold: true, color: COLORS.gold });
    if (mine) text(ctx, `On it: ${active.have}/${active.need}`, cx + cardW / 2, y + 66, { size: 6.5, bold: true, align: 'center', color: col });
    else if (button(ui, cx + cardW / 2 - 22, y + 58, 44, 11, 'Take', { primary: true, size: 6.5, enabled: !active })) {
      const why = takePartyQuest(world, q);
      if (why) world.log(why, '#ffb3c6');
    }
  });
  y += 76;
  // The one you're on (it may be from another town's board, or shared by a friend).
  if (active) {
    box(ctx, tx, y, tw, 18, { fill: '#fff6fb', edge: KIND_COLOR[active.kind], r: 7, width: 1.2 });
    text(ctx, fit(ctx, pqGoal(active), tw - 120, 6.5), tx + 6, y + 8, { size: 6.5, bold: true, color: COLORS.ink });
    bar(ctx, tx + 6, y + 11, tw - 120, 3.5, active.have / active.need, KIND_COLOR[active.kind], null);
    text(ctx, `${active.have}/${active.need}`, tx + tw - 70, y + 12, { size: 7, bold: true, align: 'right', color: COLORS.ink });
    if (button(ui, tx + tw - 62, y + 3, 58, 12, 'Drop it', { size: 6.5 })) dropPartyQuest(world);
  } else text(ctx, party > 1 ? 'Take one: everyone in your party works on it together.' : 'Bring friends or party members: everyone works on it together, and everyone is paid.', tx, y + 10, { size: 6.5, color: COLORS.muted });
  y += 24;
  // Tokens to trade.
  const tokens = countItem(char.inventory, 'party_token');
  text(ctx, `Party Tokens: ${tokens}`, tx, y + 8, { size: 7, bold: true, color: '#e0659f' });
  TOKEN_SHOP.forEach((t, i) => {
    const bx = tx + 74 + i * 76;
    const ok = tokens >= t.cost;
    if (button(ui, bx, y, 72, 13, `${ITEMS[t.id].name.split(' ').slice(-1)[0]} x${t.qty} · ${t.cost}`, { size: 6, enabled: ok, theme: 'pink' })) {
      const why = buyWithTokens(world, i);
      if (why) world.log(why, '#ffb3c6');
    }
    if (hover(ui, bx, y, 72, 13)) tooltip(ui, [{ text: `${ITEMS[t.id].name} x${t.qty}`, bold: true }, { text: `${t.about} · ${t.cost} Party Tokens`, size: 7, color: COLORS.muted }]);
  });
  return button(ui, tx + tw - 60, area.bottom - 16, 60, 17, 'Back') || ui.input?.pressed?.has('Backspace');
}

// The party quest's card on screen: under the party panel at the left.
export function drawPartyQuestCard(ui, state, world) {
  const q = world.char.partyQuest;
  if (!q || world.dungeon || state.windows.quests?.open) return;
  const { ctx } = ui;
  const map = world.map;
  const members = partyMembers(world.bots).length + partyFriends().length;
  const top = settings.minimap ? 20 + Math.max(24, Math.round(map.height * (128 / map.width))) + 8 : 8;
  const panelY = top + (Object.keys(world.char.buffs).length ? 30 : 0);
  const y = members ? panelY + 18 + (members + 1) * 19 + 4 : panelY;
  const x = 6;
  const w = 120;
  const col = KIND_COLOR[q.kind];
  const pop = Math.max(0, 1 - (world.now - (q.at ?? -9)) / 0.6);
  box(ctx, x, y, w, 30, { fill: 'rgba(255,250,246,0.88)', edge: col, r: 8, width: 1.4 });
  box(ctx, x + 2, y + 2, w - 4, 11, { fill: col, edge: null, r: 5.5 });
  icon(ctx, KIND_ICON[q.kind], x + 9, y + 7.5, 7, '#ffffff');
  text(ctx, `Party quest · ${PQ_KINDS[q.kind].label}`, x + 16, y + 10.5, { size: 6.5, bold: true, color: '#ffffff', outline: 'rgba(58,45,79,0.45)' });
  text(ctx, fit(ctx, pqGoal(q).replace(', together', ''), w - 40, 6, false), x + 6, y + 20, { size: 6, color: COLORS.ink });
  text(ctx, `${q.have}/${q.need}`, x + w - 6, y + 20 + pop, { size: 6.5 * (1 + 0.4 * pop * pop), bold: true, align: 'right', color: THEMES.pink.ink });
  bar(ctx, x + 6, y + 23, w - 12, 3, q.have / q.need, col, null, { flash: pop });
  if (hover(ui, x, y, w, 30)) tooltip(ui, [{ text: pqGoal(q), bold: true }, { text: `${getMap(q.map).name} · shared with your whole party`, size: 7, color: COLORS.muted }]);
}
