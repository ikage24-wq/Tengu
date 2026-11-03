// The crafting window, opened at a town's craft bench (data/crafting.js): your Crafting level up
// top, the recipes by category (Gear by level for your own job, Trinkets, Tools, Tonics, Stones)
// on the left, and on the right the picked recipe: what it makes and its stats (against what you
// wear), the quality odds for a piece, what it needs (have/need, green when it's enough), and the
// Craft button. Crafting is a short moment at the bench (world/crafting.js): the hero works, the
// anvil sparks, and the piece comes out. Along the bottom, the life tools you have equipped.
// The "For" pill picks who it's for: you, or a party member here (a bot party member or an online
// party friend), who gets it straight away (world/coop-life.js), gear tagged "Made by" you.

import { ITEMS } from '../data/items.js';
import { CATEGORIES, QUALITIES, ARTISAN_LEVELS, TOOL_SLOTS } from '../data/crafting.js';
import { JOBS } from '../data/jobs.js';
import { countItem } from '../core/inventory.js';
import { lifeLevel, lifeExp, lifeExpToNext, LIFE_MAX } from '../core/life.js';
import { recipesIn, craftBlocker, qualityOdds, BLOCKER_TEXT, equipTool, unequipTool, toolEquipped, lifeTool } from '../core/crafting.js';
import { itemName } from '../core/items.js';
import { startCrafting, benchHere, BENCH_REACH } from '../world/crafting.js';
import { MOVES } from '../render/moves.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, text, box, button, hover, clicked, tooltip, fit, wrap, tabs, bar, itemSlot, sparkle, icon } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { craftTargets } from '../world/coop-life.js';

const W = 360;
const H = 252;
const ROW = 25;
const LIST_W = 152;
// The hero's move at the bench: the crafting motion (hammer, file, hold it up), or a pickaxe-like
// swing where the motion isn't in yet.
const CRAFT_MOVE = MOVES.craft ? 'craft' : MOVES.mine ? 'mine' : 'gather';
const STAT_SHORT = { watk: 'ATK', matk: 'M.ATK', wdef: 'DEF', mdef: 'M.DEF', str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', hp: 'HP', mp: 'MP', acc: 'ACC', eva: 'AVD', speed: 'SPD', jump: 'JMP' };
const SLOT_NAMES = { fishing: 'Fishing', mining: 'Mining', gathering: 'Gathering', chopping: 'Chopping' };
const CAT_ABOUT = {
  accessory: 'Rings, earrings and charms, set with mined gems.',
  tool: 'Tools make a life skill faster and richer. Equip one per skill.',
  potion: 'Tonics brewed from herbs, a batch at a time.',
  stone: "For Tora's forge: one stone makes a polish likelier to take.",
};
const SHEET = { hat: 'Hat', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', gloves: 'Gloves', cape: 'Cape', earring: 'Earrings', ring: 'Ring', charm: 'Charm' };

function kindOf(def) {
  if (def.slot === 'weapon') return def.weaponType[0].toUpperCase() + def.weaponType.slice(1);
  if (def.slot) return SHEET[def.slot] ?? def.slot;
  if (def.life) return `${SLOT_NAMES[def.life.slot]} tool`;
  if (def.type === 'use') return 'Tonic';
  return 'Material';
}

export function craftingWindow(ui, state, world) {
  const win = state.windows.craft;
  // Walk away from the bench and the window closes.
  if (!benchHere(world, BENCH_REACH + 40)) {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Crafting')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const ox = win.x;
  const oy = win.y;

  // ---- Your Crafting level ----
  const lv = lifeLevel(char, 'crafting');
  icon(ctx, 'hammer', ox + 16, oy + 32, 11, th.dark);
  text(ctx, `Crafting Lv ${lv}`, ox + 25, oy + 31, { size: 8.5, bold: true, color: th.ink });
  const need = lifeExpToNext(lv);
  bar(ctx, ox + 25, oy + 34, 92, 6, lv >= LIFE_MAX ? 1 : lifeExp(char, 'crafting') / need, COLORS.exp, '', { rim: true });
  if (hover(ui, ox + 8, oy + 24, 112, 18)) tooltip(ui, [{ text: `Crafting Lv ${lv}`, bold: true }, { text: lv >= LIFE_MAX ? 'Mastered!' : `${lifeExp(char, 'crafting')} / ${need} EXP to the next level`, size: 8, color: COLORS.muted }, { text: 'Higher levels open new recipes and make Superb and Masterwork pieces likelier.', size: 8, color: COLORS.muted }]);

  // ---- Categories ----
  const catWas = win.cat ?? 0;
  win.cat = tabs(ui, ox + 128, oy + 25, CATEGORIES.map((c) => c.name), catWas, { w: 42, h: 14 });
  if (win.cat !== catWas) Object.assign(win, { scroll: 0, sel: null });
  const cat = CATEGORIES[win.cat].key;
  let list = recipesIn(char, cat);
  let y = oy + 47;
  if (cat === 'gear') {
    // The Artisan line, one level at a time.
    const lvWas = win.gearLv ?? 0;
    ARTISAN_LEVELS.forEach((L, i) => {
      const bx = ox + 8 + i * 30;
      const on = i === lvWas;
      box(ctx, bx, y, 28, 12, { fill: on ? th.main : hover(ui, bx, y, 28, 12) ? '#ffffff' : th.light, edge: on ? th.dark : null, r: 6, width: 1 });
      text(ctx, `Lv${L}`, bx + 14, y + 8.6, { size: 6.5, bold: true, align: 'center', color: on ? '#ffffff' : th.ink, outline: on ? th.ink : null });
      if (clicked(ui, bx, y, 28, 12) && !on) Object.assign(win, { gearLv: i, scroll: 0, sel: null });
    });
    list = list.filter((r) => ITEMS[r.makes].reqLevel === ARTISAN_LEVELS[win.gearLv ?? 0]);
    text(ctx, 'Artisan gear: a little better than shop or drop gear.', ox + 164, y + 8.6, { size: 6.5, color: COLORS.muted });
  } else text(ctx, CAT_ABOUT[cat], ox + 10, y + 8.6, { size: 6.5, color: COLORS.muted });
  y += 16;

  // ---- The recipe list ----
  const rows = Math.floor((H - 63 - 30) / ROW);
  const lx = ox + 8;
  if (!list.length) {
    wrap(ctx, JOBS[char.job].family === 'beginner' ? 'Artisan gear opens once you choose a job: come back after your first advancement!' : 'Nothing here yet.', lx + 4, y + 14, LIST_W - 8, { size: 7.5, color: COLORS.muted, lineHeight: 10 });
  }
  if (hover(ui, lx, y, LIST_W, rows * ROW)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, list.length - rows));
  if (!list.some((r) => r.id === win.sel)) win.sel = (list.find((r) => !craftBlocker(char, r)) ?? list.find((r) => lv >= r.level) ?? list[0])?.id ?? null;
  for (const r of list.slice(win.scroll, win.scroll + rows)) {
    const why = craftBlocker(char, r);
    const on = r.id === win.sel;
    const hot = hover(ui, lx, y, LIST_W, ROW - 3);
    box(ctx, lx, y, LIST_W, ROW - 3, { fill: on ? '#fff3c4' : hot ? '#ffffff' : '#fffdfb', edge: on ? COLORS.select : th.light, r: 7, width: on ? 2 : 1 });
    ctx.globalAlpha = why === 'level' ? 0.45 : 1;
    drawItemIcon(ctx, r.makes, lx + 4, y + 3);
    ctx.globalAlpha = 1;
    text(ctx, fit(ctx, `${itemName(r.makes)}${r.qty > 1 ? ` x${r.qty}` : ''}`, LIST_W - 34, 7.5, true), lx + 24, y + 10, { size: 7.5, bold: true, color: why === 'level' ? COLORS.muted : COLORS.ink });
    // What's in the way, row by row: the level, or what you're short of (the first material and
    // have/need), so each row says something of its own instead of the same line.
    const short = why === 'materials' ? Object.entries(r.needs).find(([id, n]) => countItem(char.inventory, id) < n) : null;
    const sub = why === 'level' ? `Needs Crafting Lv ${r.level}` : short ? `${ITEMS[short[0]]?.name ?? short[0]} ${countItem(char.inventory, short[0])}/${short[1]}` : why === 'bag' ? 'Bag full' : 'Ready to craft';
    text(ctx, fit(ctx, sub, LIST_W - 34, 6, !why), lx + 24, y + 18.5, { size: 6, color: why === 'level' ? COLORS.bad : why ? COLORS.muted : COLORS.good, bold: !why });
    if (!why) sparkle(ctx, lx + LIST_W - 8, y + 11, 2.6 + Math.sin(performance.now() / 300 + y) * 0.6, COLORS.good);
    if (clicked(ui, lx, y, LIST_W, ROW - 3)) win.sel = r.id;
    y += ROW;
  }
  if (list.length > rows) text(ctx, `${win.scroll + 1}-${Math.min(list.length, win.scroll + rows)} of ${list.length} · scroll`, lx + LIST_W / 2, oy + H - 31, { size: 6, color: COLORS.muted, align: 'center' });

  // ---- The picked recipe ----
  const r = list.find((q) => q.id === win.sel);
  if (r) detail(ui, win, world, r, ox + LIST_W + 16, oy + 63, W - LIST_W - 24);

  // ---- Your life tools ----
  toolBelt(ui, world, ox + 8, oy + H - 24);
}

function detail(ui, win, world, r, x, y, w) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const def = ITEMS[r.makes];
  const why = craftBlocker(char, r);
  box(ctx, x - 4, y - 2, w + 6, 160, { fill: '#ffffff', edge: th.light, r: 9, width: 1 });
  itemSlot(ctx, x, y + 2, 34, { id: r.makes }, { scale: 2, fill: th.light, edge: th.main });
  if (hover(ui, x, y + 2, 34, 34)) tooltip(ui, itemTooltip(char, r.makes));
  text(ctx, fit(ctx, itemName(r.makes), w - 42, 9, true), x + 40, y + 12, { size: 9, bold: true });
  const who = def.family ? ` · ${JOBS[char.job].name}` : '';
  text(ctx, `${kindOf(def)}${def.reqLevel ? ` · Lv ${def.reqLevel}` : ''}${who}${r.qty > 1 ? ` · makes ${r.qty}` : ''}`, x + 40, y + 22, { size: 6.5, color: COLORS.muted });
  text(ctx, `Crafting Lv ${r.level}`, x + 40, y + 31, { size: 6.5, bold: true, color: lifeLevel(char, 'crafting') >= r.level ? COLORS.good : COLORS.bad });
  const forWho = friendPill(ui, win, world, x + w - 66, y + 24, 64);
  let ly = y + 46;

  // What it is: stats (against what you wear in that slot), a tool's numbers, or what it does.
  if (def.type === 'equip') {
    const worn = char.equipment?.[def.slot];
    const keys = Object.keys(def.stats);
    keys.slice(0, 8).forEach((k, i) => {
      const v = def.stats[k];
      const d = v - (worn?.stats?.[k] ?? 0);
      const cx = x + (i % 2) * (w / 2);
      const cy = ly + Math.floor(i / 2) * 9;
      text(ctx, `${STAT_SHORT[k] ?? k} +${v}`, cx, cy, { size: 7, bold: true, color: COLORS.ink });
      if (worn && d) text(ctx, d > 0 ? `▲${d}` : `▼${-d}`, cx + 50, cy, { size: 6.5, bold: true, color: d > 0 ? COLORS.good : COLORS.bad });
    });
    ly += Math.ceil(Math.min(8, keys.length) / 2) * 9 + 2;
  } else if (def.life) {
    const L = def.life;
    const now = lifeTool(char, L.slot);
    text(ctx, `${Math.round(L.speed * 100)}% faster · +${Math.round(L.yield * 100)}% more finds · +${(L.rare * 100).toFixed(1)}% rare`, x, ly, { size: 6.8, bold: true, color: '#3f9f5f' });
    text(ctx, now ? `Now using: ${ITEMS[now.id].name}` : `No ${SLOT_NAMES[L.slot].toLowerCase()} tool equipped yet`, x, ly + 10, { size: 6.5, color: COLORS.muted });
    ly += 22;
  } else {
    ly = wrap(ctx, def.desc ?? '', x, ly, w, { size: 6.8, color: COLORS.ink, lineHeight: 8.5 }) + 2;
  }

  // The quality odds for a piece: one bar split by chance, and the shares under it.
  if (r.quality) {
    const odds = qualityOdds(char, r);
    let bx = x;
    const bw = w - 2;
    box(ctx, x - 1, ly - 1, bw + 2, 8, { fill: '#f6eefb', edge: null, r: 4 });
    odds.forEach((p, i) => {
      const segW = bw * p;
      if (segW > 0.5) box(ctx, bx, ly, segW, 6, { fill: QUALITIES[i].color, edge: null, r: 3 });
      bx += segW;
    });
    const label = odds.map((p, i) => `${QUALITIES[i].name} ${Math.round(p * 100)}%`).join(' · ');
    text(ctx, fit(ctx, label, w, 6.3, true), x, ly + 15, { size: 6.3, bold: true, color: COLORS.muted });
    if (hover(ui, x, ly - 2, w, 20)) tooltip(ui, [{ text: 'Quality', bold: true }, ...QUALITIES.map((q, i) => ({ text: `${q.name}: ${Math.round(odds[i] * 100)}%${q.mult > 1 ? `, stats x${q.mult} and +${q.main} main stat` : ''}`, size: 8, color: q.color })), { text: 'Your Crafting level raises the odds.', size: 8, color: COLORS.muted }]);
    ly += 22;
  }

  // What it needs.
  let ix = x;
  for (const [id, n] of Object.entries(r.needs)) {
    const have = countItem(char.inventory, id);
    itemSlot(ctx, ix, ly, 20, { id }, { fill: have >= n ? '#eefbf2' : '#fff4f6', edge: have >= n ? '#a8e6bf' : '#ffc6d2', shadow: false });
    text(ctx, `${Math.min(have, 99)}/${n}`, ix + 10, ly + 28, { size: 6, bold: true, align: 'center', color: have >= n ? COLORS.good : COLORS.bad });
    if (hover(ui, ix, ly, 20, 20)) tooltip(ui, itemTooltip(char, id));
    ix += 24;
  }
  ly = y + 130;

  // Craft (or the moment it's being made), and Equip for a tool you have.
  const busy = world.crafting;
  if (busy?.recipe.id === r.id) {
    bar(ctx, x, ly + 4, w - 4, 9, busy.t / busy.secs, th.main, 'Crafting...', { rim: true, size: 6.5 });
  } else {
    const ok = !why && !busy;
    const bw = def.life ? 62 : w - 4;
    if (button(ui, x, ly, bw, 18, forWho && !def.life ? fit(ctx, `Craft for ${forWho.name}`, bw - 24, 8, true) : 'Craft', { primary: ok, enabled: ok, size: 8, iconName: 'hammer' })) {
      const no = startCrafting(world, r, CRAFT_MOVE);
      if (no) world.log(BLOCKER_TEXT[no] ?? 'Stand at the bench to craft.', '#ffb3c6');
      else if (forWho) world.crafting.forWho = forWho;
    }
    if (why && hover(ui, x, ly, bw, 18)) tooltip(ui, BLOCKER_TEXT[why]);
    if (def.life) {
      const owned = countItem(char.inventory, r.makes) > 0;
      const using = toolEquipped(char, r.makes);
      if (button(ui, x + 66, ly, w - 70, 18, using ? 'Equipped' : 'Equip', { enabled: owned && !using, size: 8 })) {
        equipTool(char, r.makes);
        world.log(`Now using your ${ITEMS[r.makes].name}.`, '#d8f5d0');
      }
    }
  }
  // What just came off the bench.
  const last = world.lastCrafted;
  if (last?.result.ok && last.recipe.id === r.id && world.now - last.at < 3) {
    const q = last.result.quality;
    const a = Math.min(1, 3 - (world.now - last.at));
    ctx.globalAlpha = a;
    const msg = last.forWho ? `${r.quality ? `${QUALITIES[q].name}! ` : ''}Sent to ${last.forWho.name}!` : last.result.inst ? `${r.quality ? `${QUALITIES[q].name}! ` : ''}Into your bag.` : `+${last.result.qty} into your bag.`;
    text(ctx, msg, x + 40, y + 40, { size: 7, bold: true, color: r.quality ? QUALITIES[q].color : COLORS.good });
    if (q === 2) sparkle(ctx, x + 30, y + 6, 4 + Math.sin(world.now * 9) * 1.5, '#ffd27a');
    ctx.globalAlpha = 1;
  }
}

// Who the piece is for: a pill that steps through you and the party members here (a bot party
// member or an online party friend). Returns the target, or null for yourself.
function friendPill(ui, win, world, x, y, w) {
  const { ctx } = ui;
  const list = craftTargets(world);
  const who = list.find((t) => t.id === win.forWho) ?? null;
  if (!who) win.forWho = null;
  const hot = hover(ui, x, y, w, 12);
  const on = Boolean(who);
  box(ctx, x, y, w, 12, { fill: on ? '#ffe4f0' : hot ? '#ffffff' : '#f6f2fb', edge: on ? '#ff8fc1' : ui.theme.light, r: 6, width: 1 });
  if (on) sparkle(ctx, x + 5, y + 6, 2 + Math.sin(performance.now() / 260) * 0.5, '#ff8fc1');
  text(ctx, fit(ctx, on ? `For ${who.name}` : 'For: me', w - 14, 6.3, true), x + w / 2 + (on ? 3 : 0), y + 8.4, { size: 6.3, bold: true, align: 'center', color: on ? '#c0407a' : list.length ? COLORS.ink : COLORS.muted });
  if (hot) tooltip(ui, list.length ? [{ text: 'Craft for a friend', bold: true }, { text: 'Click to pick who gets it: a party member on this map. Gear you make for them says it was made by you.', size: 8, color: COLORS.muted }] : [{ text: 'Craft for a friend', bold: true }, { text: 'Party up with someone here to make things for them.', size: 8, color: COLORS.muted }]);
  if (list.length && clicked(ui, x, y, w, 12)) {
    const i = who ? list.indexOf(who) : -1;
    win.forWho = i + 1 < list.length ? list[i + 1].id : null;
  }
  return list.find((t) => t.id === win.forWho) ?? null;
}

// The four tool slots: the tool in use for each, or a ghost; click one to put it away.
function toolBelt(ui, world, x, y) {
  const { ctx } = ui;
  const char = world.char;
  text(ctx, 'Tools', x + 2, y + 12, { size: 7, bold: true, color: COLORS.muted });
  const ghost = { fishing: 'rod_oak', mining: 'pickaxe_copper', gathering: 'sickle_copper', chopping: 'woodaxe_copper' };
  TOOL_SLOTS.forEach((slot, i) => {
    const sx = x + 30 + i * 74;
    const t = lifeTool(char, slot);
    itemSlot(ctx, sx, y, 18, t ? { id: t.id } : null, { ghost: ghost[slot], shadow: false });
    text(ctx, fit(ctx, t ? ITEMS[t.id].name : SLOT_NAMES[slot], 50, 6.2, Boolean(t)), sx + 21, y + 12, { size: 6.2, bold: Boolean(t), color: t ? COLORS.ink : COLORS.muted });
    if (hover(ui, sx, y, 70, 18)) tooltip(ui, t ? [...itemTooltip(char, t.id), { text: 'Click to put it away', size: 8, color: COLORS.muted }] : [{ text: `${SLOT_NAMES[slot]} tool`, bold: true }, { text: 'Craft one in Tools, then Equip it here or in your bag.', size: 8, color: COLORS.muted }]);
    if (t && clicked(ui, sx, y, 18, 18)) unequipTool(char, slot);
  });
}
