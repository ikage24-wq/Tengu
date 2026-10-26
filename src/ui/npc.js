// NPC conversations: quests, shops, the stylist, and job advancement. Also the "fainted" dialog.

import { NPCS, shopStock } from '../data/npcs.js';
import { QUESTS } from '../data/quests.js';
import { ITEMS, RARITIES, variantsFor } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { JOBS, nextJobs } from '../data/jobs.js';
import { questState, acceptQuest, completeQuest, objectiveProgress, rewardId } from '../core/quests.js';
import { addItem, removeItem, rechargePrice } from '../core/inventory.js';
import { makeEquip, itemName, itemColors, variantPrice } from '../core/items.js';
import { shade } from '../render/pixel.js';
import { advanceJob, wornGear } from '../core/character.js';
import { deathExpLoss } from '../core/formulas.js';
import { respawn } from '../world/world.js';
import { DUNGEONS, ROLES } from '../data/dungeons.js';
import { planGroup, startRun, leaveDungeon } from '../world/dungeon.js';
import { drawHero } from '../render/hero.js';
import { lookRows, sameLook, LOOK_TABS } from './looks.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, THEMES, softShadow, windowFrame, button, tabs, text, box, hover, clicked, tooltip, wrap, icon, sparkle, roundRect, font, rarityCell } from './kit.js';
import { itemTooltip, sellPrice } from './tooltips.js';

export function questMarker(char, npcId) {
  const ids = NPCS[npcId].quests ?? [];
  if (ids.some((id) => questState(char, id) === 'ready')) return '?';
  if (ids.some((id) => questState(char, id) === 'available')) return '!';
  return null;
}


// ---------- Dialog ----------

// Each NPC role gets its own color.
const ROLE_THEME = { guide: 'mint', shop: 'peach', stylist: 'pink', instructor: 'lavender', dungeon: 'mint' };

// A visual-novel style dialog box along the bottom of the screen: the NPC stands large at the
// left, their name on a ribbon, and their words type out. Returns the text area, or null if the
// player closed it.
function dialogFrame(ui, win, npc, H, world) {
  const { ctx } = ui;
  const th = THEMES[ROLE_THEME[npc.role] ?? 'pink'];
  const W = 440;
  const x = (640 - W) / 2;
  const y = 322 - H;
  Object.assign(win, { x, y, w: W, h: H });
  ui.theme = th;
  softShadow(ctx, x, y, W, H, 12, 4);
  box(ctx, x, y, W, H, { fill: 'rgba(255,250,246,0.97)', edge: th.dark, r: 12, width: 2 });
  roundRect(ctx, x + 3, y + 3, W - 6, H - 6, 9);
  ctx.strokeStyle = th.light;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // The NPC, drawn big on a soft round stage, peeking over the top of the box.
  const px = x + 52;
  const g = ctx.createRadialGradient(px, y + H - 34, 4, px, y + H - 34, 46);
  g.addColorStop(0, th.light);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(px - 50, y + H - 84, 100, 84);
  ctx.save();
  roundRect(ctx, x - 40, y - 60, 140, H + 60 - 3, 10);
  ctx.clip();
  drawHero(ctx, npc.look, npc.gear ?? null, px, y + H - 8, { pose: 'idle', time: world.now, seed: 3, scale: 2, job: npc.showJob });
  ctx.restore();

  // The name ribbon.
  ctx.font = font(10, true);
  const nw = ctx.measureText(npc.name).width;
  ctx.font = font(7, true);
  const tw = ctx.measureText(npc.title).width;
  const rx = x + 104;
  box(ctx, rx, y - 9, nw + tw + 30, 18, { fill: th.main, edge: '#ffffff', r: 9, width: 2 });
  text(ctx, npc.name, rx + 10, y + 4, { size: 10, bold: true, color: '#ffffff', outline: th.ink });
  text(ctx, npc.title, rx + 18 + nw, y + 3.5, { size: 7, bold: true, color: th.light });

  // Close.
  const cx = x + W - 20;
  const cy = y + 6;
  const hot = hover(ui, cx, cy, 13, 13);
  ctx.fillStyle = hot ? '#ff6b8a' : '#ffffff';
  ctx.beginPath();
  ctx.arc(cx + 6.5, cy + 6.5, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hot ? '#e04a6c' : th.dark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = hot ? '#ffffff' : th.dark;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy + 4);
  ctx.lineTo(cx + 9, cy + 9);
  ctx.moveTo(cx + 9, cy + 4);
  ctx.lineTo(cx + 4, cy + 9);
  ctx.stroke();
  if (clicked(ui, cx, cy, 13, 13)) return null;
  return { x: x + 108, y: y + 22, w: W - 128, bottom: y + H - 10, theme: th };
}

// Typewriter text: how many characters of the current page show. Clicking the text finishes it.
function typed(ui, dlg, page, world, area) {
  if (dlg.page !== page) {
    dlg.page = page;
    dlg.typedAt = world.now;
  }
  const n = (world.now - dlg.typedAt) * 70;
  if (clicked(ui, area.x, area.y - 10, area.w, 30)) dlg.typedAt = -1e9;
  return n;
}

export function npcWindow(ui, state, world) {
  const dlg = state.npc;
  if (dlg.mode === 'shop') return shopWindow(ui, state, world);
  if (dlg.mode === 'style') return styleWindow(ui, state, world);
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const char = world.char;
  const { ctx } = ui;
  const jobOptions = dlg.job ? nextJobs(char.job, char.level).filter((j) => !npc.family || j.family === npc.family) : [];
  const questIds = (npc.quests ?? []).filter((id) => !['locked', 'done'].includes(questState(char, id)));
  const optionCount = questIds.length + (npc.shop ? 1 : 0) + (npc.role === 'stylist' ? 1 : 0) + (npc.role === 'instructor' ? 1 : 0) + (npc.role === 'dungeon' ? 1 : 0);
  const H = dlg.quest ? 112 : dlg.dungeon ? 150 : dlg.job ? Math.max(104, 46 + jobOptions.length * 42) : Math.max(96, 58 + Math.ceil(optionCount / 2) * 20);
  const area = dialogFrame(ui, win, npc, H, world);
  if (!area) {
    state.npc = null;
    win.open = false;
    return;
  }
  const { x: tx, w: tw, theme: th } = area;

  // Sub-pages: a quest's text, a job choice, or the greeting with options.
  if (dlg.quest) {
    const q = QUESTS[dlg.quest];
    const st = questState(char, dlg.quest);
    const words = st === 'ready' ? 'You did it! Here is your reward.' : q.text;
    const chars = typed(ui, dlg, `q:${dlg.quest}:${st}`, world, area);
    text(ctx, q.name, tx, area.y, { size: 9, bold: true, color: th.ink });
    let y = wrap(ctx, words, tx, area.y + 13, tw, { size: 8.5, chars });
    if (st === 'active') {
      for (const o of objectiveProgress(char, dlg.quest)) {
        const name = o.type === 'kill' ? `Defeat ${MOBS[o.mob].name}` : ITEMS[o.item].name;
        y = wrap(ctx, `${name}: ${o.have}/${o.count}`, tx, y + 1, tw, { size: 8, color: th.dark });
      }
    }
    const by = area.bottom - 16;
    if (st !== 'ready') {
      const parts = [`${q.rewards.exp} EXP`, `${q.rewards.gold} gold`, ...q.rewards.items.map((r) => `${ITEMS[rewardId(char, r)].name}${r.qty > 1 ? ` x${r.qty}` : ''}`)];
      icon(ctx, 'coin', tx + 4, by - 7, 8, '#f0b53a');
      text(ctx, `Reward: ${parts.join(', ')}`, tx + 11, by - 4, { size: 7.5, bold: true, color: COLORS.gold });
    }
    if (st === 'available' && button(ui, tx + tw - 154, by, 74, 17, 'Accept', { primary: true })) {
      acceptQuest(char, dlg.quest);
      world.log(`Quest accepted: ${q.name}`, '#bff0dc');
      if (questState(char, dlg.quest) !== 'ready') dlg.quest = null;
    }
    if (st === 'ready' && button(ui, tx + tw - 154, by, 74, 17, 'Complete', { primary: true })) {
      const r = completeQuest(char, dlg.quest);
      if (r) {
        world.log(`Quest complete: ${q.name}! +${r.exp} EXP, +${r.gold} gold`, '#ffe36b');
        for (const it of r.items) world.log(`Received ${ITEMS[it.id].name}${it.qty > 1 ? ` x${it.qty}` : ''}.`, ITEMS[it.id].color);
        if (r.levels) world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
        dlg.quest = null;
      } else {
        world.log('Make room in your bag first.', '#ffb3c6');
      }
    }
    if (button(ui, tx + tw - 74, by, 74, 17, 'Back')) dlg.quest = null;
    return;
  }

  if (dlg.dungeon) {
    dungeonPage(ui, state, world, npc, area);
    return;
  }

  if (dlg.job) {
    const options = jobOptions;
    let y = area.y;
    if (!options.length) {
      const next = Object.values(JOBS).filter((j) => j.parent === char.job && (!npc.family || j.family === npc.family));
      const msg = next.length ? `Come back at level ${next[0].level} and I'll teach you more.` : char.job === 'novice' ? '' : 'You have learned all I can teach for now.';
      const fam = JOBS[char.job].family;
      const words = npc.family && char.job !== 'novice' && fam !== npc.family ? 'You walk a different path. Seek your own instructor.' : msg;
      wrap(ctx, words, tx, y + 4, tw, { size: 8.5, chars: typed(ui, dlg, `job:${words}`, world, area) });
    }
    // One card per branch: the name, its blurb, and a Choose button.
    for (const j of options) {
      box(ctx, tx - 2, y - 8, tw + 4, 38, { fill: '#ffffff', edge: th.light, r: 8, width: 1.5 });
      text(ctx, j.name, tx + 4, y + 3, { size: 9, bold: true, color: th.dark });
      wrap(ctx, j.blurb, tx + 4, y + 14, tw - 66, { size: 7, lineHeight: 9 });
      const picked = button(ui, tx + tw - 58, y + 1, 56, 18, 'Choose', { primary: true, size: 8 });
      y += 42;
      if (picked) {
        advanceJob(char, j.id);
        world.log(`You are now a ${j.name}! Spend your new SP in the Skills window (K).`, '#ffe36b');
        world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
        state.npc = null;
        win.open = false;
        return;
      }
    }
    if (button(ui, tx + tw - 70, area.bottom - 16, 70, 17, 'Back')) dlg.job = false;
    return;
  }

  // The greeting, typed out, with a bouncing arrow when it's done; then the options as two
  // columns of buttons.
  const chars = typed(ui, dlg, `hi:${dlg.id}`, world, area);
  const end = wrap(ctx, npc.greeting, tx, area.y + 2, tw, { size: 8.5, chars });
  if (chars >= npc.greeting.length) sparkle(ctx, tx + tw - 4, end - 10 + Math.sin(world.now * 6) * 1.5, 2.5, th.main);
  const colW = (tw - 6) / 2;
  let i = 0;
  const option = (label, primary = false, iconName = null) => {
    const bx = tx + (i % 2) * (colW + 6);
    const by = area.bottom - Math.ceil(optionCount / 2) * 20 + Math.floor(i / 2) * 20;
    i++;
    return button(ui, bx, by, colW, 18, label, { primary, size: 8, iconName });
  };
  for (const id of questIds) {
    const st = questState(char, id);
    const mark = st === 'ready' ? '✓' : st === 'available' ? '!' : '…';
    if (option(`${mark} ${QUESTS[id].name}`, st !== 'active', null)) dlg.quest = id;
  }
  if (npc.shop && option('Browse the shop', false, 'shop')) dlg.mode = 'shop';
  if (npc.role === 'stylist' && option(`New look (${npc.styleCost}g)`, false, 'wand')) {
    dlg.mode = 'style';
    dlg.look = { ...char.appearance };
  }
  if (npc.role === 'dungeon' && option(`Enter ${DUNGEONS[npc.dungeon].name}`, true, 'star')) dlg.dungeon = true;
  if (npc.role === 'instructor' && option('Job advancement', nextJobs(char.job, char.level).some((j) => j.family === npc.family), 'star')) dlg.job = true;
}

// ---------- Dungeon group finder ----------

// The group you'd go in with: one row per role, filled by you, your party, or the finder.
function dungeonPage(ui, state, world, npc, area) {
  const { ctx } = ui;
  const def = DUNGEONS[npc.dungeon];
  const { x: tx, w: tw, theme: th } = area;
  text(ctx, `${def.name}  ·  Lv ${def.minLevel}+`, tx, area.y, { size: 9, bold: true, color: th.ink });
  wrap(ctx, def.blurb, tx, area.y + 12, tw, { size: 7, lineHeight: 9, color: COLORS.muted });
  const plan = planGroup(world, def.id);
  let y = area.y + 42;
  if (plan.why) wrap(ctx, plan.why, tx, y + 8, tw, { size: 8.5, color: COLORS.bad });
  else {
    plan.slots.forEach((s, i) => {
      const cx = tx + (i % 2) * (tw / 2 + 2);
      const cy = y + Math.floor(i / 2) * 22;
      const r = ROLES[s.role];
      box(ctx, cx, cy, tw / 2 - 2, 19, { fill: '#ffffff', edge: th.light, r: 7, width: 1.2 });
      box(ctx, cx + 3, cy + 3, 36, 13, { fill: r.color, edge: null, r: 6 });
      text(ctx, r.label, cx + 21, cy + 12.5, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: 'rgba(58,45,79,0.5)' });
      const who = s.who === 'you' ? `${world.char.name} (you)` : s.who ? `Lv${s.who.level} ${s.who.name}` : 'Group finder...';
      const job = s.who === 'you' ? JOBS[world.char.job].name : s.who ? JOBS[s.who.char.job].short ?? JOBS[s.who.char.job].name : s.role === 'healer' ? 'a Mage' : s.role === 'tank' ? 'a Warrior' : 'any job';
      text(ctx, who, cx + 44, cy + 9, { size: 7.5, bold: true, color: s.who ? COLORS.ink : COLORS.muted });
      text(ctx, job, cx + 44, cy + 16.5, { size: 6, color: COLORS.muted });
    });
    text(ctx, 'Warriors tank, Mages heal, everyone else deals damage.', tx, y + 52, { role: 'minor' });
  }
  const by = area.bottom - 16;
  if (!plan.why && button(ui, tx + tw - 154, by, 74, 17, 'Find group & go', { primary: true, size: 7.5 })) {
    const why = startRun(world, def.id);
    if (why) world.log(why, '#ffb3c6');
    state.npc = null;
    state.windows.npc.open = false;
    return;
  }
  if (button(ui, tx + tw - 74, by, 74, 17, 'Back')) state.npc.dungeon = false;
}

// ---------- Shop ----------

function shopWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 320;
  const H = 240;
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Shop`, { theme: 'peach', icon: 'shop' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const shift = ui.input.held.has('ShiftLeft') || ui.input.held.has('ShiftRight');
  const was = `${dlg.tab}|${dlg.sellTab}|${dlg.buyTab}`;
  dlg.tab = tabs(ui, win.x + 8, win.y + 22, ['Buy', 'Sell'], dlg.tab ?? 0, { w: 46 });
  const rows = 7;
  const rowH = 23;
  let entries;
  if (dlg.tab === 0) {
    dlg.buyTab = tabs(ui, win.x + 106, win.y + 22, ['All', 'Gear', 'Arms', 'Other'], dlg.buyTab ?? 0, { w: 38 });
    const kind = (id) => (ITEMS[id].type !== 'equip' ? 3 : ITEMS[id].slot === 'weapon' ? 2 : 1);
    entries = shopStock(npc, char).filter((id) => !dlg.buyTab || kind(id) === dlg.buyTab).map((id) => ({ id }));
  } else {
    dlg.sellTab = tabs(ui, win.x + 106, win.y + 22, ['Equip', 'Use', 'Etc'], dlg.sellTab ?? 0, { w: 40 });
    const tab = ['equip', 'use', 'etc'][dlg.sellTab];
    entries = char.inventory[tab].map((e, index) => ({ id: e.id, qty: e.qty, inst: tab === 'equip' ? e : null, index, tab }));
  }
  // A new list starts at the top.
  if (was !== `${dlg.tab}|${dlg.sellTab}|${dlg.buyTab}`) dlg.scroll = 0;
  dlg.scroll = Math.max(0, dlg.scroll ?? 0);
  dlg.pick ??= {};
  if (hover(ui, win.x, win.y + 42, W, rows * rowH)) dlg.scroll += ui.mouse.wheel;
  dlg.scroll = Math.min(dlg.scroll, Math.max(0, entries.length - rows));
  let y = win.y + 42;
  for (const e of entries.slice(dlg.scroll, dlg.scroll + rows)) {
    const def = ITEMS[e.id];
    const variants = dlg.tab === 0 ? variantsFor(def) : null;
    const variant = e.inst?.variant ?? (variants ? dlg.pick[e.id] ?? null : null);
    const shown = e.inst ?? { id: e.id, variant };
    const colors = itemColors(shown);
    // Gear you're selling shows its rarity on the row's edge and around its icon.
    const rare = e.inst?.rarity ? RARITIES[e.inst.rarity].color : null;
    box(ctx, win.x + 8, y, W - 16, rowH - 2, { fill: COLORS.cell, edge: rare ?? (variant ? colors.main : null), r: 6, width: rare ? 1.6 : 1.2 });
    drawItemIcon(ctx, e.id, win.x + 11, y + 2.5, 1, variant);
    rarityCell(ctx, win.x + 9, y + 1, 18, rowH - 4, rare, e.inst?.rarity ?? 0, 5);
    const name = `${itemName(shown)}${e.qty > 1 ? ` x${e.qty}` : ''}`;
    text(ctx, fit(ctx, name, def.star ? 132 : 150, 7.5), win.x + 31, y + 9, { size: 7.5, bold: true, color: variant ? readable(colors.main) : COLORS.ink });
    if (def.star) text(ctx, `Lv ${def.reqLevel} · +${def.star.watk} attack`, win.x + 31, y + 18, { size: 6.5, color: char.level >= def.reqLevel ? COLORS.muted : COLORS.bad });
    if (def.type === 'equip') text(ctx, `Lv ${def.reqLevel}`, win.x + 31, y + 18, { size: 6.5, color: char.level >= def.reqLevel ? COLORS.muted : COLORS.bad });
    // Color swatches: pick the variant you want before buying.
    if (variants) {
      const keys = [null, ...Object.keys(variants)];
      keys.forEach((k, i) => {
        const cx = win.x + 64 + i * 10;
        const cy = y + 15.5;
        const on = k === variant;
        const hot = hover(ui, cx - 4.5, cy - 4.5, 9, 9);
        ctx.fillStyle = on ? '#4a3560' : hot ? '#b9a2d6' : 'rgba(74,53,96,0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, on ? 4.4 : 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = k ? variants[k].main : def.color;
        ctx.beginPath();
        ctx.arc(cx, cy, on ? 3.2 : 2.8, 0, Math.PI * 2);
        ctx.fill();
        if (hot) tooltip(ui, [{ text: k ? `${variants[k].name}: +${variants[k].about}` : 'Standard', bold: true, color: k ? readable(variants[k].main) : COLORS.ink }, { text: k ? `${Math.round((variantPrice(def, k) / def.price - 1) * 100)}% more gold` : 'No extra bonus', size: 7, color: COLORS.muted }]);
        if (clicked(ui, cx - 4.5, cy - 4.5, 9, 9)) dlg.pick[e.id] = k;
      });
    }
    if (hover(ui, win.x + 8, y, 54, rowH - 2) || (hover(ui, win.x + 8, y, W - 70, rowH - 2) && !variants)) tooltip(ui, itemTooltip(char, e.id, e.inst ?? (variant ? makePreview(e.id, variant) : null)));
    if (dlg.tab === 0) {
      // Throwing stars come by the full set.
      const qty = def.star ? def.stack : shift && def.type !== 'equip' ? 10 : 1;
      const cost = (variant ? variantPrice(def, variant) : def.price) * (def.star ? 1 : qty);
      text(ctx, `${cost.toLocaleString()}g`, win.x + W - 62, y + 13, { size: 8, bold: true, align: 'right', color: char.gold >= cost ? COLORS.gold : COLORS.bad });
      if (button(ui, win.x + W - 56, y + 3, 46, 15, def.star ? 'Buy set' : qty > 1 ? 'Buy 10' : 'Buy', { enabled: char.gold >= cost, primary: true, size: 8 })) {
        const item = def.type === 'equip' ? makeEquip(e.id, { variant }) : e.id;
        if (addItem(char.inventory, item, def.type === 'equip' ? 1 : qty)) {
          char.gold -= cost;
          world.log(`Bought ${itemName(def.type === 'equip' ? item : e.id)}${qty > 1 ? ` x${qty}` : ''}.`, colors.main);
        } else {
          world.log('Your bag is full.', '#ffb3c6');
        }
      }
    } else {
      // A set of stars sells whole, for what its stars are worth; a part-thrown set can be
      // recharged back to full.
      const qty = e.inst ? 1 : shift || def.star ? e.qty : 1;
      const gain = def.star ? starSellPrice(def, qty) : sellPrice(e.id, e.inst) * qty;
      if (def.star && qty < def.stack) {
        const cost = rechargePrice(def, qty);
        if (button(ui, win.x + W - 150, y + 3, 52, 15, `Refill ${cost.toLocaleString()}g`, { enabled: char.gold >= cost, primary: true, size: 6.5 })) {
          char.inventory.use[e.index].qty = def.stack;
          char.gold -= cost;
          world.log(`Recharged ${def.name}.`, def.color);
        }
      }
      text(ctx, `${gain.toLocaleString()}g`, win.x + W - 62, y + 13, { size: 8, bold: true, align: 'right', color: COLORS.gold });
      if (button(ui, win.x + W - 56, y + 3, 46, 15, def.star ? 'Sell set' : qty > 1 ? 'Sell all' : 'Sell', { size: 8 })) {
        if (e.inst) char.inventory.equip.splice(e.index, 1);
        else if (def.star) char.inventory.use.splice(e.index, 1);
        else removeItem(char.inventory, e.id, qty);
        char.gold += gain;
      }
    }
    y += rowH;
  }
  if (!entries.length) text(ctx, 'Nothing here.', win.x + W / 2, win.y + 90, { size: 9, align: 'center', color: COLORS.muted });
  icon(ctx, 'coin', win.x + 16, win.y + H - 13, 8, '#f0b53a');
  text(ctx, `${char.gold.toLocaleString()} gold`, win.x + 23, win.y + H - 10, { size: 8.5, bold: true, color: COLORS.gold });
  text(ctx, dlg.tab === 0 ? 'Pick a color · Shift: buy 10' : 'Shift: sell all', win.x + W - 68, win.y + H - 10, { size: 7, align: 'right', color: COLORS.muted });
  if (button(ui, win.x + W - 60, win.y + H - 20, 52, 14, 'Back', { size: 8 })) dlg.mode = null;
}

function starSellPrice(def, qty) {
  return Math.max(1, Math.floor((def.price * 0.4 * qty) / def.stack));
}

// A shop item with a variant, for its tooltip before you buy it (stats as sold).
const previews = new Map();
function makePreview(id, variant) {
  const key = `${id}|${variant}`;
  if (!previews.has(key)) previews.set(key, makeEquip(id, { variant }));
  return previews.get(key);
}

// Shortens text with an ellipsis to fit `w` pixels.
function fit(ctx, s, w, size) {
  ctx.font = font(size, true);
  if (ctx.measureText(s).width <= w) return s;
  while (s.length > 3 && ctx.measureText(`${s}…`).width > w) s = s.slice(0, -1);
  return `${s}…`;
}

// A variant's color, darkened enough to read on the pale window.
const readable = (c) => shade(c, lum(c) > 0.75 ? -45 : -8);

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255;
}

// ---------- Stylist ----------

function styleWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 400;
  const H = 250;
  // The salon is bigger than the talk box it opens from, so it starts centred on screen.
  if (!dlg.placed) {
    win.x = (640 - W) / 2;
    win.y = Math.round((360 - H) / 2) - 8;
    dlg.placed = true;
  }
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Salon`, { theme: 'pink', icon: 'wand' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  dlg.tab ??= 0;
  box(ctx, win.x + 8, win.y + 24, 104, H - 32, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 6 });
  drawHero(ctx, dlg.look, wornGear(char), win.x + 60, win.y + 170, { pose: 'idle', time: world.now, scale: 2.2 });
  if (button(ui, win.x + 20, win.y + H - 30, 80, 15, 'As before', { size: 8, enabled: !sameLook(dlg.look, char.appearance) })) dlg.look = { ...char.appearance };
  dlg.tab = tabs(ui, win.x + 124, win.y + 26, LOOK_TABS.map((t) => t.label), dlg.tab, { w: 56, h: 15 });
  dlg.look = lookRows(ui, dlg.look, dlg.tab, win.x + 122, win.y + 46, W - 132, { cell: [24, 22, 32][dlg.tab], time: world.now, gap: 2 }).look;
  const cost = npc.styleCost;
  const by = win.y + H - 22;
  if (button(ui, win.x + 122, by, 110, 15, `Done (${cost}g)`, { primary: true, enabled: char.gold >= cost && !sameLook(dlg.look, char.appearance) })) {
    char.gold -= cost;
    char.appearance = dlg.look;
    world.log('Lulu: You look adorable!', '#ffc2d6');
    dlg.mode = null;
  }
  if (button(ui, win.x + W - 82, by, 72, 15, 'Cancel')) dlg.mode = null;
}

// ---------- Fainted ----------

export function deathWindow(ui, state, world) {
  // Got back up (a revive, or the group regrouping after a wipe).
  if (!world.dead) {
    state.death = false;
    return;
  }
  if (world.dungeon) return dungeonDeath(ui, state, world);
  const W = 230;
  const H = 112;
  const x = (640 - W) / 2;
  const y = 100;
  const { ctx } = ui;
  const th = THEMES.pink;
  ctx.fillStyle = 'rgba(70,40,100,0.4)';
  ctx.fillRect(0, 0, 640, 360);
  softShadow(ctx, x, y, W, H, 12, 5);
  box(ctx, x, y, W, H, { fill: '#fffaf6', edge: th.dark, r: 12, width: 2 });
  // A cracked heart bobbing sadly above the card.
  const bob = Math.sin(world.now * 2.5) * 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + W / 2, y + bob, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = th.dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  icon(ctx, 'heart', x + W / 2, y + bob + 1, 18, th.main);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + W / 2, y + bob - 4);
  ctx.lineTo(x + W / 2 - 2, y + bob);
  ctx.lineTo(x + W / 2 + 2, y + bob + 2);
  ctx.lineTo(x + W / 2, y + bob + 6);
  ctx.stroke();
  text(ctx, 'You fainted!', x + W / 2, y + 36, { size: 14, bold: true, align: 'center', color: '#ffffff', outline: th.ink });
  const loss = deathExpLoss(world.char.level, world.char.base.luk);
  wrap(ctx, `You'll wake up in town and lose ${loss} EXP. Higher LUK softens the loss.`, x + 18, y + 54, W - 36, { size: 8, color: COLORS.muted });
  ui.theme = th;
  if (button(ui, x + W / 2 - 56, y + H - 28, 112, 19, 'Return to town', { primary: true })) {
    respawn(world);
    state.death = false;
  }
}

// Fainting in a dungeon: a small note at the top instead of a modal, so you can watch your group
// finish the fight. They'll get you up after it, or you can leave.
function dungeonDeath(ui, state, world) {
  const { ctx } = ui;
  const th = THEMES.pink;
  const W = 220;
  const x = (640 - W) / 2;
  const y = 92;
  box(ctx, x, y, W, 40, { fill: 'rgba(255,250,246,0.95)', edge: th.dark, r: 10, width: 1.5 });
  text(ctx, 'You fainted!', x + 10, y + 14, { size: 9, bold: true, color: th.ink });
  text(ctx, 'Your group will get you up after the fight.', x + 10, y + 26, { role: 'minor' });
  ui.theme = th;
  if (button(ui, x + W - 62, y + 6, 54, 15, 'Leave', { size: 7.5 })) {
    leaveDungeon(world);
    state.death = false;
  }
}
