// The trade window (net/together.js), open while you trade with a friend: your bag's tradable
// things on the left (tap to offer one; Shift or a double tap for the whole stack), your offer and
// your gold in the middle, theirs on the right, each under its trader standing on a little stage
// (facing each other, cheering once Ready), a chat just between the two of you, and Ready. When you're both ready the swap happens.

import { ITEMS } from '../data/items.js';
import { online } from '../net/online.js';
import { offerItem, takeBack, offerGold, setReady, cancelTrade, TRADE_SLOTS } from '../net/together.js';
import { COLORS, windowFrame, tabs, text, box, button, itemSlot, hover, clicked, tooltip, fit, font } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { drawHero } from '../render/hero.js';
import { wornGear } from '../core/character.js';

const W = 420;
const H = 280;
const STAGE = 70;
const TABS = ['Equip', 'Use', 'Etc', 'Mats'];

export function tradeWindow(ui, state, world) {
  const tr = online.trade;
  const win = state.windows.trade;
  win.open = Boolean(tr);
  if (!tr) return;
  const friend = online.ghosts.get(tr.with)?.name ?? 'Friend';
  if (!windowFrame(ui, win, W, H, `Trade with ${friend}`)) {
    cancelTrade(world);
    return;
  }
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const x = win.x + 8;
  const y = win.y + 24;
  // Your bag.
  win.tab = tabs(ui, x, y, TABS, win.tab ?? 0, { w: 36, h: 14 });
  const key = ['equip', 'use', 'etc', 'mats'][win.tab];
  const list = char.inventory[key].filter((e) => e && ITEMS[e.id] && !ITEMS[e.id].quest && ITEMS[e.id].type !== 'cash');
  list.slice(0, 24).forEach((e, i) => {
    const sx = x + (i % 6) * 22;
    const sy = y + 20 + Math.floor(i / 6) * 22;
    itemSlot(ctx, sx, sy, 20, e, { shadow: false });
    if (hover(ui, sx, sy, 20, 20)) tooltip(ui, itemTooltip(char, e.id, e.uid ? e : null));
    if (clicked(ui, sx, sy, 20, 20)) offerItem(world, key, e, ui.input.held.has('ShiftLeft') || ui.mouse.double);
  });
  text(ctx, 'Tap to offer (Shift: all)', x, y + 116, { size: 6.5, color: COLORS.muted });
  tradeChat(ui, state, world, tr, x, y + 122, 132, 104);
  // An offer: its slots and gold.
  const g = online.ghosts.get(tr.with);
  const offer = (o, ox, mine, ready) => {
    const look = mine ? char.appearance : g?.look;
    const sy = y + 2;
    box(ctx, ox, sy, 128, STAGE - 6, { fill: ready ? '#e4f8ea' : '#f4ecfb', edge: ready ? COLORS.good : th.light, r: 10, width: ready ? 2 : 1.2 });
    ctx.fillStyle = 'rgba(120,90,160,0.15)';
    ctx.beginPath();
    ctx.ellipse(ox + 64, sy + STAGE - 15, 22, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (look) {
      const t = world.now + (mine ? 0 : 0.7);
      const cheer = ready ? { pose: 'cheer', progress: (t % 1.2) / 1.2, dur: 1.2 } : { pose: 'idle' };
      drawHero(ctx, ready ? { ...look, face: 'excited' } : look, mine ? wornGear(char) : g.gear, ox + 64, sy + STAGE - 15, { ...cheer, time: t, scale: 1.1, facing: mine ? 1 : -1, job: mine ? char.job : g.job, seed: mine ? 1 : 2 });
    }
    text(ctx, mine ? char.name : fit(ctx, friend, 110, 8, true), ox + 6, sy + 11, { size: 7.5, bold: true, color: th.dark });
    if (ready) text(ctx, 'Ready!', ox + 122, sy + 11, { size: 7.5, bold: true, align: 'right', color: COLORS.good });
    const py = sy + STAGE - 2;
    box(ctx, ox, py, 128, 142, { fill: ready ? '#effcf3' : '#ffffff', edge: ready ? COLORS.good : th.light, r: 10, width: ready ? 2 : 1.2 });
    text(ctx, mine ? 'You give' : `${fit(ctx, friend, 70, 8, true)} gives`, ox + 6, py + 12, { size: 8, bold: true, color: th.dark });
    for (let i = 0; i < TRADE_SLOTS; i++) {
      const it = o.items[i];
      const sx = ox + 8 + (i % 3) * 38;
      const sy = py + 20 + Math.floor(i / 3) * 40;
      box(ctx, sx, sy, 34, 34, { fill: '#f7f0fc', edge: '#e2d3f0', r: 8 });
      if (!it) continue;
      const inst = it.inst ?? (it.uid ? char.inventory.equip.find((e) => e.uid === it.uid) : null);
      itemSlot(ctx, sx + 7, sy + 4, 20, inst ?? { id: it.id, qty: it.qty }, { shadow: false });
      if (hover(ui, sx, sy, 34, 34)) tooltip(ui, itemTooltip(char, inst?.id ?? it.id, inst));
      if (mine && clicked(ui, sx, sy, 34, 34)) takeBack(world, i);
    }
    text(ctx, `${o.gold.toLocaleString()} gold`, ox + 8, py + 112, { size: 8, bold: true, color: COLORS.gold });
  };
  offer(tr.mine, x + 140, true, tr.ready.me);
  offer(tr.theirs, x + 276, false, tr.ready.them);
  // Gold.
  for (const [i, n] of [100, 1000, 10000].entries()) {
    if (button(ui, x + 140 + i * 30, y + STAGE + 122, 28, 14, `+${n >= 1000 ? `${n / 1000}k` : n}`, { size: 6.5 })) offerGold(world, tr.mine.gold + n);
  }
  if (button(ui, x + 232, y + STAGE + 122, 30, 14, 'Clear', { size: 6.5 })) offerGold(world, 0);
  // Ready, or call it off.
  const by = win.y + H - 26;
  text(ctx, 'When you are both Ready, the trade happens.', x, by + 11, { size: 7, color: COLORS.muted });
  if (button(ui, win.x + W - 150, by, 70, 18, tr.ready.me ? 'Waiting...' : 'Ready', { primary: true, enabled: !tr.ready.me, size: 8 })) setReady(world);
  if (button(ui, win.x + W - 76, by, 66, 18, 'Cancel', { size: 8 })) cancelTrade(world);
}

// The trade's chat: the newest lines at the bottom (yours on the right, theirs on the left), and a
// box to type in (tap it, or press Enter).
function tradeChat(ui, state, world, tr, x, y, w, h) {
  const { ctx } = ui;
  const th = ui.theme;
  box(ctx, x, y, w, h, { fill: '#fbf8ff', edge: th.light, r: 8 });
  // Wrap each line to the box.
  ctx.font = font(7, false);
  const rows = [];
  for (const m of tr.chat) {
    let line = '';
    const out = [];
    for (const word of `${m.mine ? '' : `${m.who}: `}${m.text}`.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > w - 30 && line) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
    out.forEach((l) => rows.push({ text: l, mine: m.mine }));
  }
  const fieldH = 15;
  const room = Math.floor((h - fieldH - 8) / 9);
  const shown = rows.slice(-room);
  if (!shown.length) text(ctx, 'Chat with your trade partner here', x + w / 2, y + (h - fieldH) / 2, { size: 6.5, align: 'center', color: COLORS.muted });
  shown.forEach((r, i) => {
    const ly = y + 10 + i * 9;
    text(ctx, r.text, r.mine ? x + w - 6 : x + 6, ly, { size: 7, align: r.mine ? 'right' : 'left', color: r.mine ? th.dark : COLORS.ink });
  });
  // The box to type in.
  const fx = x + 3;
  const fy = y + h - fieldH - 3;
  const fw = w - 6;
  const typing = state.chat.typing;
  box(ctx, fx, fy, fw, fieldH, { fill: '#ffffff', edge: typing != null ? COLORS.accent : '#e2d3f0', r: 6, width: typing != null ? 1.5 : 1 });
  state.typeField = { x: fx, y: fy, w: fw, h: fieldH };
  if (typing != null) {
    const caret = Math.floor(world.now * 2) % 2 ? '|' : '';
    ctx.font = font(7, false);
    let shownText = typing;
    while (shownText && ctx.measureText(shownText).width > fw - 12) shownText = shownText.slice(1);
    text(ctx, shownText + caret, fx + 5, fy + 10.5, { size: 7, color: COLORS.ink });
  } else {
    text(ctx, 'Tap here or press Enter to chat', fx + 5, fy + 10.5, { size: 6.5, color: COLORS.muted });
    if (clicked(ui, fx, fy, fw, fieldH)) state.chat.typing = '';
  }
}
