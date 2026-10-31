// A player's profile: click another player, a friend online, or yourself to see their look, level,
// job, guild, stat build, gear, and full stats, and to browse their shop if they have one open. A
// friend's profile asks their game for it (and has Invite and Trade buttons).

import { ITEMS, EQUIP_SLOTS, RARITIES } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { computeStats } from '../core/stats.js';
import { physicalRange, magicRange, accuracy, avoid } from '../core/formulas.js';
import { addItem } from '../core/inventory.js';
import { itemName } from '../core/items.js';
import { STAT_KEYS, wornGear } from '../core/character.js';
import { buildLabel, buyFromShop, thank } from '../world/bots.js';
import { haggle } from '../world/market.js';
import { PLAYSTYLES } from '../world/party.js';
import { price } from '../world/chatter.js';
import { drawHero } from '../render/hero.js';
import { COLORS, windowFrame, tabs, text, box, button, hover, tooltip, well, sparkle, wrap, icon, font, itemSlot } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { titleOf } from '../core/collection.js';
import { online } from '../net/online.js';
import { askInspect, askParty, partyBlocker, inParty, askTrade } from '../net/together.js';

const SLOT_NAMES = { weapon: 'Weapon', hat: 'Hat', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', gloves: 'Gloves', cape: 'Cape', earring: 'Earrings' };
const STAT_COLORS = { str: '#ff7a6b', dex: '#3fc48a', int: '#5aa8ff', luk: '#f0b53a' };

export function openProfile(state, who) {
  state.profile = who;
  const win = state.windows.profile;
  win.open = true;
  win.tab = who.shop ? 2 : 0;
  state.order = [...state.order.filter((k) => k !== 'profile'), 'profile'];
}

export function profileWindow(ui, state, world) {
  const win = state.windows.profile;
  const who = state.profile;
  const bot = who?.kind === 'bot' ? world.bots?.list.find((b) => b.id === who.id) : null;
  const friend = who?.kind === 'ghost' ? online.ghosts.get(who.id) : null;
  if (friend) askInspect(friend.id);
  const card = friend?.inspect;
  const char = who?.kind === 'self' ? world.char : friend ? card?.char : bot?.char;
  const H = card ? 262 : 236;
  const W = 320;
  if (!windowFrame(ui, win, W, H, char ? `${char.name}'s Profile` : friend ? `${friend.name}'s Profile` : 'Profile')) return;
  const { ctx } = ui;
  const th = ui.theme;
  if (!char) {
    if (friend) {
      text(ctx, `Asking ${friend.name}'s game...`, win.x + W / 2, win.y + 110, { size: 9, bold: true, align: 'center', color: COLORS.muted });
      for (let i = 0; i < 5; i++) {
        const a = world.now * 3 + (i / 5) * Math.PI * 2;
        sparkle(ctx, win.x + W / 2 + Math.cos(a) * 16, win.y + 135 + Math.sin(a) * 8, 2.2, i % 2 ? th.main : '#ffe36b');
      }
    } else wrap(ctx, 'This player has logged out.', win.x + 20, win.y + 50, W - 40, { size: 9, color: COLORS.muted });
    return;
  }
  const s = who.kind === 'self' ? world.stats : computeStats(char);

  // The character on a little stage, with their name, job, guild, and build.
  const lx = win.x + 8;
  const ly = win.y + 24;
  well(ctx, lx, ly, 104, 204, th);
  ctx.save();
  ctx.beginPath();
  ctx.rect(lx + 2, ly + 2, 100, 110);
  ctx.clip();
  drawHero(ctx, char.appearance, wornGear(char), lx + 52, ly + 104, { pose: 'idle', time: world.now, scale: 1.7, facing: 1, job: char.job });
  ctx.restore();
  const pro = bot?.pro;
  text(ctx, char.name, lx + 52, ly + 124, { size: 9.5, bold: true, align: 'center', color: pro ? '#c99a1f' : COLORS.ink });
  if (pro) sparkle(ctx, lx + 8, ly + 120, 3, '#ffd66b');
  text(ctx, `Lv ${char.level} ${JOBS[char.job].name}`, lx + 52, ly + 136, { size: 7, align: 'center', color: COLORS.muted });
  if (bot?.guild) text(ctx, `<${bot.guild}>`, lx + 52, ly + 147, { size: 7, bold: true, align: 'center', color: '#4f95e0' });
  const tag = (label, y, fill) => {
    ctx.font = font(7, true);
    const w = ctx.measureText(label).width + 12;
    box(ctx, lx + 52 - w / 2, y, w, 12, { fill, edge: null, r: 6 });
    text(ctx, label, lx + 52, y + 8.5, { size: 7, bold: true, align: 'center', color: '#ffffff' });
  };
  tag(buildLabel(char), ly + 154, th.main);
  if (pro) tag('★ Top player', ly + 169, '#e0a52f');
  if (who.kind === 'self') {
    tag("That's you!", ly + 169, COLORS.accent);
    // Your Monster Book, achievements and titles (also B).
    if (button(ui, lx + 12, ly + 183, 80, 16, 'Collection', { size: 7.5, iconName: 'crown', theme: 'gold' })) {
      state.windows.collection.open = true;
      state.order = [...state.order.filter((k) => k !== 'collection'), 'collection'];
    }
  }
  else if (bot?.shop) tag('Shop open', ly + 184, '#ff8fc1');
  // A friend online: invite them, or trade.
  if (friend) {
    if (inParty(friend.id)) tag('In your party', ly + 169, '#4f95e0');
    else {
      const why = partyBlocker(friend);
      if (button(ui, lx + 6, ly + 166, 92, 15, why === 'Waiting for an answer' ? 'Invited...' : 'Invite to party', { size: 7, primary: true, enabled: !why, iconName: 'heart' })) askParty(world, friend.id);
      if (why && why !== 'Waiting for an answer' && hover(ui, lx + 6, ly + 166, 92, 15)) tooltip(ui, [{ text: why, size: 8, color: COLORS.bad }]);
    }
    if (button(ui, lx + 6, ly + 184, 92, 15, 'Trade', { size: 7, enabled: !online.trade, iconName: 'coin' })) askTrade(world, friend.id);
  }
  // The title they wear.
  const title = who.kind === 'self' ? titleOf(char) : card?.title ?? null;
  if (title) text(ctx, title, lx + 52, ly + 146, { size: 6.5, bold: true, align: 'center', color: '#c99a1f' });
  if (bot?.party && bot.ai) tag(`Party · ${PLAYSTYLES[bot.ai.kind].label}`, ly + (pro ? 184 : 169), PLAYSTYLES[bot.ai.kind].color);

  // Tabs: gear, stats, and their shop if one is open.
  const names = ['Gear', 'Stats', ...(bot?.shop ? ['Shop'] : [])];
  win.tab = Math.min(win.tab ?? 0, names.length - 1);
  const rx = win.x + 120;
  win.tab = tabs(ui, rx, win.y + 24, names, win.tab, { w: 60 });
  const page = names[win.tab];
  const rw = W - 128;
  let y = win.y + 46;

  if (page === 'Gear') {
    EQUIP_SLOTS.forEach((slot, i) => {
      const inst = char.equipment[slot];
      const def = inst ? ITEMS[inst.id] : null;
      const cy = y + i * 22;
      const rare = inst?.rarity ? RARITIES[inst.rarity] : null;
      box(ctx, rx, cy, rw, 20, { fill: hover(ui, rx, cy, rw, 20) ? '#ffffff' : '#fffdfb', edge: th.light, r: 6, width: 1 });
      itemSlot(ctx, rx + 1, cy + 1, 18, inst, { shadow: false, fill: th.light, edge: th.light });
      text(ctx, SLOT_NAMES[slot], rx + 24, cy + 8, { size: 6, color: COLORS.muted });
      text(ctx, def ? `${itemName(inst)}${inst.upgrades ? ` +${inst.upgrades}` : ''}` : '—', rx + 24, cy + 16.5, { size: 7.5, bold: true, color: rare ? rare.color : def ? COLORS.ink : COLORS.muted });
      if (inst && hover(ui, rx, cy, rw, 20)) tooltip(ui, itemTooltip(world.char, inst.id, inst));
    });
    return;
  }

  if (page === 'Stats') {
    STAT_KEYS.forEach((k, i) => {
      const cx = rx + (i % 2) * (rw / 2 + 2);
      const cy = y + Math.floor(i / 2) * 20;
      box(ctx, cx, cy, rw / 2 - 2, 17, { fill: '#ffffff', edge: th.light, r: 8, width: 1 });
      box(ctx, cx + 1, cy + 1, 28, 15, { fill: STAT_COLORS[k], edge: null, r: 7 });
      text(ctx, k.toUpperCase(), cx + 15, cy + 11.5, { size: 7.5, bold: true, align: 'center', color: '#ffffff' });
      const bonus = s[k] - char.base[k];
      text(ctx, `${s[k]}`, cx + 34, cy + 12, { size: 8.5, bold: true });
      if (bonus) text(ctx, `+${bonus}`, cx + rw / 2 - 8, cy + 12, { size: 6.5, align: 'right', color: COLORS.good });
    });
    y += 46;
    const phys = physicalRange(s, s.weaponType, 100);
    const mag = magicRange(s, 100);
    const family = JOBS[char.job].family;
    const rows = [
      ['HP', `${who.kind === 'self' ? char.hp : card?.hp ?? s.maxHp} / ${s.maxHp}`], ['MP', `${who.kind === 'self' ? char.mp : card?.mp ?? s.maxMp} / ${s.maxMp}`],
      ['Attack', `${Math.round(phys.min)} ~ ${Math.round(phys.max)}`],
      ['Magic', family === 'mage' ? `${Math.round(mag.min)} ~ ${Math.round(mag.max)}` : `${Math.floor(s.int / 2) + s.matk}`],
      ['Defense', `${s.wdef} / ${s.mdef}`], ['Accuracy', `${accuracy(family, s, char.level)}`], ['Avoid', `${avoid(s)}`],
      ['Critical', `${Math.round((0.05 + s.critRate) * 100)}%`], ['Speed', `${s.speed}%`],
      ...(card ? [['Monster cards · Fish', `${card.cards ?? 0} · ${card.fish ?? 0}`], ['Achievements', `${card.achievements ?? 0}`]] : []),
    ];
    well(ctx, rx, y - 4, rw, rows.length * 13 + 6, th);
    y += 7;
    for (const [k, v] of rows) {
      text(ctx, k, rx + 8, y, { role: 'secondary' });
      text(ctx, v, rx + rw - 8, y, { size: 7.5, bold: true, align: 'right' });
      y += 13;
    }
    return;
  }

  // Shop: their wares with prices; buy straight from the list.
  text(ctx, bot.shop.title, rx + 2, y + 6, { size: 8.5, bold: true, color: '#a8467a' });
  text(ctx, `${price(world.char.gold)} gold`, rx + rw, y + 6, { size: 7.5, bold: true, align: 'right', color: COLORS.gold });
  y += 12;
  const rows = 7;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, bot.shop.items.length - rows));
  if (hover(ui, rx, y, rw, rows * 22)) win.scroll = Math.max(0, Math.min(bot.shop.items.length - rows, win.scroll + ui.mouse.wheel));
  bot.shop.items.slice(win.scroll, win.scroll + rows).forEach((it, i) => {
    const index = i + win.scroll;
    const def = ITEMS[it.id];
    const cy = y + i * 22;
    const rare = it.inst?.rarity ? RARITIES[it.inst.rarity] : null;
    box(ctx, rx, cy, rw, 20, { fill: '#ffffff', edge: th.light, r: 6, width: 1 });
    itemSlot(ctx, rx + 1, cy + 1, 18, it.inst ?? { id: it.id }, { shadow: false, fill: th.light, edge: th.light });
    text(ctx, `${itemName(it.inst ?? it.id)}${it.qty > 1 ? ` x${it.qty}` : ''}`, rx + 24, cy + 9, { size: 7, bold: true, color: rare ? rare.color : COLORS.ink });
    icon(ctx, 'coin', rx + 27, cy + 14.5, 6, '#f0b53a');
    text(ctx, price(it.price), rx + 32, cy + 17, { size: 7, bold: true, color: world.char.gold >= it.price ? COLORS.gold : COLORS.bad });
    if (hover(ui, rx, cy, rw - 90, 20)) tooltip(ui, itemTooltip(world.char, it.id, it.inst ?? null));
    // Haggle first (once per item), if you like.
    if (button(ui, rx + rw - 86, cy + 2, 42, 16, 'Haggle', { enabled: !it.haggled && !(world.now < (bot.offended ?? 0)), size: 7 })) {
      const r = haggle(world.bots, world, bot, index);
      if (r) world.log(r.text, r.ok ? '#bff0dc' : '#ffb3c6');
    }
    if (button(ui, rx + rw - 42, cy + 2, 38, 16, 'Buy', { primary: true, enabled: world.char.gold >= it.price, size: 7.5 })) {
      const r = buyFromShop(bot, index, world.char, addItem);
      if (r) world.log(r.text, r.ok ? '#bff0dc' : '#ffb3c6');
      if (r?.ok) thank(world.bots, bot, world.char.name);
    }
  });
  if (!bot.shop?.items.length) text(ctx, 'Sold out!', rx + rw / 2, y + 40, { size: 9, align: 'center', color: COLORS.muted });
}
