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
import { drawHero, HAIR_STYLES, EYE_STYLES } from '../render/hero.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, button, tabs, text, box, hover, tooltip, wrap } from './kit.js';
import { itemTooltip, sellPrice } from './tooltips.js';

const HAIR_COLORS = ['#e9ebfa', '#ff9ec0', '#f5c95c', '#b9a7ff', '#7a5238', '#3b3650', '#9be08f', '#ffb38a', '#8fd3ff'];
const SKIN_TONES = ['#fff0e6', '#fbd9bf', '#e7b48f', '#c98e66', '#8a5a3c'];
const EYE_COLORS = ['#4fcfb8', '#9b6cff', '#5aa8ff', '#e8a23c', '#7a4a2b', '#ff6b8a', '#3f9f5f'];
const OUTFITS = ['#ffc2d6', '#bfe0ff', '#bff0dc', '#fff3a6', '#e0cfff', '#ffd0a8', '#ffffff', '#5d5285'];

export const LOOK_OPTIONS = [
  { key: 'hairStyle', label: 'Hair', options: HAIR_STYLES },
  { key: 'hairColor', label: 'Hair color', options: HAIR_COLORS, color: true },
  { key: 'eyeStyle', label: 'Eyes', options: EYE_STYLES },
  { key: 'eyeColor', label: 'Eye color', options: EYE_COLORS, color: true },
  { key: 'skinTone', label: 'Skin', options: SKIN_TONES, color: true },
  { key: 'outfitColor', label: 'Outfit', options: OUTFITS, color: true },
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
    box(ui.ctx, x, y, w, 16, { fill: COLORS.cell, edge: null, r: 5 });
    text(ui.ctx, opt.label, x + 6, y + 11, { size: 8, bold: true });
    if (opt.color) {
      box(ui.ctx, x + w - 52, y + 3, 20, 10, { fill: out[opt.key], edge: '#ffffff', r: 4 });
    } else {
      const value = String(out[opt.key]);
      text(ui.ctx, value, x + w - 42, y + 11, { size: value.length > 8 ? 7 : 8, align: 'center' });
    }
    if (button(ui, x + w - 70, y + 2, 12, 12, '<', { size: 8 })) out = cycleLook(out, opt.key, -1);
    if (button(ui, x + w - 16, y + 2, 12, 12, '>', { size: 8 })) out = cycleLook(out, opt.key, 1);
    y += 19;
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

export function npcWindow(ui, state, world) {
  const dlg = state.npc;
  if (dlg.mode === 'shop') return shopWindow(ui, state, world);
  if (dlg.mode === 'style') return styleWindow(ui, state, world);
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 300;
  const H = 150;
  if (!windowFrame(ui, win, W, H, `${npc.name} · ${npc.title}`)) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  box(ctx, win.x + 8, win.y + 24, 58, 70, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 6 });
  drawHero(ctx, npc.look, npc.gear ?? null, win.x + 37, win.y + 88, { pose: 'idle', time: world.now, seed: 3 });
  const tx = win.x + 74;
  const tw = W - 84;

  // Sub-pages: a quest's text, a job choice, or the greeting with options.
  if (dlg.quest) {
    const q = QUESTS[dlg.quest];
    const st = questState(char, dlg.quest);
    let y = wrap(ctx, st === 'ready' ? 'You did it! Here is your reward.' : q.text, tx, win.y + 34, tw, { size: 9 });
    if (st === 'active') {
      for (const o of objectiveProgress(char, dlg.quest)) {
        const name = o.type === 'kill' ? `Defeat ${MOBS[o.mob].name}` : ITEMS[o.item].name;
        y = wrap(ctx, `${name}: ${o.have}/${o.count}`, tx, y + 2, tw, { size: 8, color: COLORS.accent });
      }
    }
    if (st !== 'ready') {
      const parts = [`${q.rewards.exp} EXP`, `${q.rewards.gold} gold`, ...q.rewards.items.map((r) => `${ITEMS[r.id].name}${r.qty > 1 ? ` x${r.qty}` : ''}`)];
      wrap(ctx, `Reward: ${parts.join(', ')}`, tx, Math.max(y + 4, win.y + 96), tw, { size: 8, color: COLORS.gold });
    }
    const by = win.y + H - 22;
    if (st === 'available' && button(ui, tx, by, 70, 15, 'Accept', { primary: true })) {
      acceptQuest(char, dlg.quest);
      world.log(`Quest accepted: ${q.name}`, '#bff0dc');
      if (questState(char, dlg.quest) !== 'ready') dlg.quest = null;
    }
    if (st === 'ready' && button(ui, tx, by, 80, 15, 'Complete', { primary: true })) {
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
    if (button(ui, tx + W - 160, by, 70, 15, 'Back')) dlg.quest = null;
    return;
  }

  if (dlg.job) {
    const options = nextJobs(char.job, char.level).filter((j) => !npc.family || j.family === npc.family);
    let y = win.y + 34;
    if (!options.length) {
      const next = Object.values(JOBS).filter((j) => j.parent === char.job && (!npc.family || j.family === npc.family));
      const msg = next.length ? `Come back at level ${next[0].level} and I'll teach you more.` : char.job === 'novice' ? '' : 'You have learned all I can teach for now.';
      const fam = JOBS[char.job].family;
      wrap(ctx, npc.family && char.job !== 'novice' && fam !== npc.family ? `You walk a different path. Seek your own instructor.` : msg, tx, y, tw, { size: 9 });
    }
    for (const j of options) {
      y = wrap(ctx, `${j.name}: ${j.blurb}`, tx, y, tw - 70, { size: 8 }) + 2;
      if (button(ui, tx + tw - 66, y - 16, 64, 15, `Be a ${j.name}`, { primary: true, size: 8 })) {
        advanceJob(char, j.id);
        world.log(`You are now a ${j.name}! Spend your new SP in the Skills window (K).`, '#ffe36b');
        world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
        state.npc = null;
        win.open = false;
        return;
      }
      y += 4;
    }
    if (button(ui, tx + tw - 70, win.y + H - 22, 70, 15, 'Back')) dlg.job = false;
    return;
  }

  wrap(ctx, npc.greeting, tx, win.y + 34, tw, { size: 9 });
  let by = win.y + 72;
  const option = (label, primary = false) => {
    const hit = button(ui, tx, by, tw, 15, label, { primary, size: 8 });
    by += 18;
    return hit;
  };
  for (const id of npc.quests ?? []) {
    const st = questState(char, id);
    if (st === 'locked' || st === 'done') continue;
    const mark = st === 'ready' ? '✓' : st === 'available' ? '!' : '…';
    if (option(`${mark} ${QUESTS[id].name}`, st !== 'active')) dlg.quest = id;
  }
  if (npc.shop && option('Browse the shop')) dlg.mode = 'shop';
  if (npc.role === 'stylist' && option(`Change my look (${npc.styleCost} gold)`)) {
    dlg.mode = 'style';
    dlg.look = { ...char.appearance };
  }
  if (npc.role === 'instructor' && option('About job advancement', nextJobs(char.job, char.level).some((j) => j.family === npc.family))) dlg.job = true;
}

// ---------- Shop ----------

function shopWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 300;
  const H = 232;
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Shop`)) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const shift = ui.input.held.has('ShiftLeft') || ui.input.held.has('ShiftRight');
  dlg.tab = tabs(ui, win.x + 8, win.y + 22, ['Buy', 'Sell'], dlg.tab ?? 0, { w: 50 });
  text(ctx, `${char.gold.toLocaleString()} gold`, win.x + W - 10, win.y + 32, { size: 9, bold: true, align: 'right', color: COLORS.gold });
  const rows = 9;
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
  const H = 168;
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Salon`)) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  box(ctx, win.x + 8, win.y + 24, 90, 136, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 6 });
  drawHero(ctx, dlg.look, char.equipment, win.x + 53, win.y + 150, { pose: 'idle', time: world.now, scale: 2 });
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
  const W = 220;
  const H = 96;
  const x = (640 - W) / 2;
  const y = 110;
  const { ctx } = ui;
  ctx.fillStyle = 'rgba(90,63,122,0.35)';
  ctx.fillRect(0, 0, 640, 360);
  box(ctx, x, y, W, H, { r: 10 });
  text(ctx, 'You fainted!', x + W / 2, y + 24, { size: 13, bold: true, align: 'center', color: COLORS.accent });
  const loss = deathExpLoss(world.char.level, world.char.base.luk);
  wrap(ctx, `You'll wake up in town and lose ${loss} EXP. Higher LUK softens the loss.`, x + 14, y + 42, W - 28, { size: 8, color: COLORS.muted });
  if (button(ui, x + W / 2 - 50, y + H - 24, 100, 16, 'Return to town', { primary: true })) {
    respawn(world);
    state.death = false;
  }
}

