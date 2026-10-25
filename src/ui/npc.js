// NPC conversations: quests, shops, the stylist, and job advancement. Also the "fainted" dialog.

import { NPCS } from '../data/npcs.js';
import { QUESTS } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { JOBS, nextJobs } from '../data/jobs.js';
import { questState, acceptQuest, completeQuest, objectiveProgress } from '../core/quests.js';
import { addItem, removeItem } from '../core/inventory.js';
import { advanceJob } from '../core/character.js';
import { deathExpLoss } from '../core/formulas.js';
import { respawn } from '../world/world.js';
import { drawHero, HAIR_STYLES, PICKABLE_EYE_STYLES, FACE_STYLES, OUTFIT_STYLES } from '../render/hero.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, THEMES, softShadow, windowFrame, button, tabs, text, box, hover, clicked, tooltip, wrap, icon, sparkle, roundRect } from './kit.js';
import { itemTooltip, sellPrice } from './tooltips.js';

const HAIR_COLORS = ['#e9ebfa', '#ff9ec0', '#f5c95c', '#b9a7ff', '#7a5238', '#3b3650', '#9be08f', '#ffb38a', '#8fd3ff'];
const SKIN_TONES = ['#fff0e6', '#fbd9bf', '#e7b48f', '#c98e66', '#8a5a3c'];
const EYE_COLORS = ['#4fcfb8', '#9b6cff', '#5aa8ff', '#e8a23c', '#7a4a2b', '#ff6b8a', '#3f9f5f'];
const OUTFITS = ['#ffc2d6', '#bfe0ff', '#bff0dc', '#fff3a6', '#e0cfff', '#ffd0a8', '#ffffff', '#5d5285'];

export const LOOK_OPTIONS = [
  { key: 'hairStyle', label: 'Hair', options: HAIR_STYLES },
  { key: 'hairColor', label: 'Hair color', options: HAIR_COLORS, color: true },
  { key: 'eyeStyle', label: 'Eyes', options: PICKABLE_EYE_STYLES },
  { key: 'face', label: 'Face', options: FACE_STYLES },
  { key: 'eyeColor', label: 'Eye color', options: EYE_COLORS, color: true },
  { key: 'skinTone', label: 'Skin', options: SKIN_TONES, color: true },
  { key: 'outfit', label: 'Outfit', options: OUTFIT_STYLES },
  { key: 'outfitColor', label: 'Outfit color', options: OUTFITS, color: true },
];

export function cycleLook(look, key, step) {
  const opt = LOOK_OPTIONS.find((o) => o.key === key);
  const i = Math.max(0, opt.options.indexOf(look[key]));
  return { ...look, [key]: opt.options[(i + step + opt.options.length) % opt.options.length] };
}

// Look editor rows: label, value or swatch, and < > arrows. Returns the (possibly) changed look.
export function lookRows(ui, look, x, y, w) {
  let out = look;
  for (const opt of LOOK_OPTIONS) {
    box(ui.ctx, x, y, w, 14, { fill: COLORS.cell, edge: null, r: 5 });
    text(ui.ctx, opt.label, x + 6, y + 10, { size: 8, bold: true });
    if (opt.color) {
      box(ui.ctx, x + w - 52, y + 2, 20, 10, { fill: out[opt.key], edge: '#ffffff', r: 4 });
    } else {
      const value = String(out[opt.key]);
      text(ui.ctx, value, x + w - 42, y + 10, { size: value.length > 8 ? 7 : 8, align: 'center' });
    }
    if (button(ui, x + w - 70, y + 1, 12, 12, '<', { size: 8 })) out = cycleLook(out, opt.key, -1);
    if (button(ui, x + w - 16, y + 1, 12, 12, '>', { size: 8 })) out = cycleLook(out, opt.key, 1);
    y += 16;
  }
  return out;
}

export function questMarker(char, npcId) {
  const ids = NPCS[npcId].quests ?? [];
  if (ids.some((id) => questState(char, id) === 'ready')) return '?';
  if (ids.some((id) => questState(char, id) === 'available')) return '!';
  return null;
}


// ---------- Dialog ----------

// Each NPC role gets its own color.
const ROLE_THEME = { guide: 'mint', shop: 'peach', stylist: 'pink', instructor: 'lavender' };

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
  ctx.font = `bold 10px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  const nw = ctx.measureText(npc.name).width;
  ctx.font = `bold 7px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
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
  const optionCount = questIds.length + (npc.shop ? 1 : 0) + (npc.role === 'stylist' ? 1 : 0) + (npc.role === 'instructor' ? 1 : 0);
  const H = dlg.quest ? 112 : dlg.job ? Math.max(104, 46 + jobOptions.length * 42) : Math.max(96, 58 + Math.ceil(optionCount / 2) * 20);
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
      const parts = [`${q.rewards.exp} EXP`, `${q.rewards.gold} gold`, ...q.rewards.items.map((r) => `${ITEMS[r.id].name}${r.qty > 1 ? ` x${r.qty}` : ''}`)];
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
  if (npc.role === 'instructor' && option('Job advancement', nextJobs(char.job, char.level).some((j) => j.family === npc.family), 'star')) dlg.job = true;
}

// ---------- Shop ----------

function shopWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 300;
  const H = 232;
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Shop`, { theme: 'peach', icon: 'shop' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const shift = ui.input.held.has('ShiftLeft') || ui.input.held.has('ShiftRight');
  dlg.tab = tabs(ui, win.x + 8, win.y + 22, ['Buy', 'Sell'], dlg.tab ?? 0, { w: 50 });
  text(ctx, `${char.gold.toLocaleString()} gold`, win.x + W - 10, win.y + 32, { size: 9, bold: true, align: 'right', color: COLORS.gold });
  const rows = 8;
  dlg.scroll = Math.max(0, dlg.scroll ?? 0);
  let entries;
  if (dlg.tab === 0) {
    entries = npc.shop.map((id) => ({ id }));
  } else {
    dlg.sellTab = tabs(ui, win.x + 120, win.y + 22, ['Equip', 'Use', 'Etc'], dlg.sellTab ?? 0, { w: 40 });
    const tab = ['equip', 'use', 'etc'][dlg.sellTab];
    entries = char.inventory[tab].map((e, index) => ({ id: e.id, qty: e.qty, inst: tab === 'equip' ? e : null, index, tab }));
  }
  if (hover(ui, win.x, win.y + 40, W, rows * 20)) dlg.scroll += ui.mouse.wheel;
  dlg.scroll = Math.min(dlg.scroll, Math.max(0, entries.length - rows));
  let y = win.y + 40;
  for (const e of entries.slice(dlg.scroll, dlg.scroll + rows)) {
    const def = ITEMS[e.id];
    box(ctx, win.x + 8, y, W - 16, 18, { fill: COLORS.cell, edge: null, r: 5 });
    drawItemIcon(ctx, e.id, win.x + 10, y + 1);
    text(ctx, `${def.name}${e.qty > 1 ? ` x${e.qty}` : ''}`, win.x + 30, y + 12, { size: 8, bold: true });
    if (def.type === 'equip') text(ctx, `Lv ${def.reqLevel}`, win.x + 168, y + 12, { size: 7, color: char.level >= def.reqLevel ? COLORS.muted : COLORS.bad });
    if (hover(ui, win.x + 8, y, W - 70, 18)) tooltip(ui, itemTooltip(char, e.id, e.inst));
    if (dlg.tab === 0) {
      const qty = shift && def.type !== 'equip' ? 10 : 1;
      const cost = def.price * qty;
      text(ctx, `${cost}g`, win.x + W - 62, y + 12, { size: 8, bold: true, align: 'right', color: char.gold >= cost ? COLORS.gold : COLORS.bad });
      if (button(ui, win.x + W - 56, y + 2, 46, 14, qty > 1 ? 'Buy 10' : 'Buy', { enabled: char.gold >= cost, primary: true, size: 8 })) {
        if (addItem(char.inventory, e.id, qty)) {
          char.gold -= cost;
          world.log(`Bought ${def.name}${qty > 1 ? ` x${qty}` : ''}.`, def.color);
        } else {
          world.log('Your bag is full.', '#ffb3c6');
        }
      }
    } else {
      const qty = e.inst ? 1 : shift ? e.qty : 1;
      const gain = sellPrice(e.id) * qty;
      text(ctx, `${gain}g`, win.x + W - 62, y + 12, { size: 8, bold: true, align: 'right', color: COLORS.gold });
      if (button(ui, win.x + W - 56, y + 2, 46, 14, qty > 1 ? 'Sell all' : 'Sell', { size: 8 })) {
        if (e.inst) char.inventory.equip.splice(e.index, 1);
        else removeItem(char.inventory, e.id, qty);
        char.gold += gain;
      }
    }
    y += 20;
  }
  if (!entries.length) text(ctx, 'Nothing here.', win.x + W / 2, win.y + 90, { size: 9, align: 'center', color: COLORS.muted });
  text(ctx, 'Shift: buy 10 / sell all · Scroll for more', win.x + 10, win.y + H - 8, { size: 7, color: COLORS.muted });
  if (button(ui, win.x + W - 60, win.y + H - 20, 52, 14, 'Back', { size: 8 })) dlg.mode = null;
}

// ---------- Stylist ----------

function styleWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 280;
  const H = 184;
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Salon`, { theme: 'pink', icon: 'wand' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  box(ctx, win.x + 8, win.y + 24, 90, 152, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 6 });
  drawHero(ctx, dlg.look, char.equipment, win.x + 53, win.y + 160, { pose: 'idle', time: world.now, scale: 2 });
  dlg.look = lookRows(ui, dlg.look, win.x + 104, win.y + 24, 168);
  const cost = npc.styleCost;
  const by = win.y + H - 22;
  if (button(ui, win.x + 104, by, 90, 15, `Done (${cost}g)`, { primary: true, enabled: char.gold >= cost })) {
    char.gold -= cost;
    char.appearance = dlg.look;
    world.log('Lulu: You look adorable!', '#ffc2d6');
    dlg.mode = null;
  }
  if (button(ui, win.x + 200, by, 72, 15, 'Cancel')) dlg.mode = null;
}

// ---------- Fainted ----------

export function deathWindow(ui, state, world) {
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
