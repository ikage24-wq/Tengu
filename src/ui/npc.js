// NPC conversations: quests, shops, the stylist, and job advancement. Also the "fainted" dialog.

import { NPCS } from '../data/npcs.js';
import { QUESTS } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { JOBS, nextJobs, FAMILY_STATS } from '../data/jobs.js';
import { questState, acceptQuest, completeQuest, objectiveProgress, rewardId, objectiveHint } from '../core/quests.js';
import { advanceJob, wornGear } from '../core/character.js';
import { deathExpLoss } from '../core/formulas.js';
import { respawn } from '../world/world.js';
import { DUNGEONS, ROLES } from '../data/dungeons.js';
import { planGroup, startRun, leaveDungeon } from '../world/dungeon.js';
import { drawHero } from '../render/hero.js';
import { lookRows, sameLook, LOOK_TABS } from './looks.js';
import { COLORS, THEMES, softShadow, windowFrame, button, tabs, text, box, hover, clicked, tooltip, wrap, icon, sparkle, roundRect, font, fit, itemSlot } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { shopWindow } from './shop.js';

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
function dialogFrame(ui, win, npc, H, world, talking = false) {
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
  drawHero(ctx, npc.look, npc.gear ?? null, px, y + H - 8, { pose: 'idle', time: world.now, seed: 3, scale: 2, job: npc.showJob, talking });
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
// `len` is the page's length, so the NPC talks (mouth moving) only while words are still coming;
// Space finishes the page at once, like clicking it.
function typed(ui, dlg, page, world, area, len = Infinity) {
  if (dlg.page !== page) {
    dlg.page = page;
    dlg.typedAt = world.now;
  }
  if (clicked(ui, area.x, area.y - 10, area.w, 30) || ui.input.pressed?.has('Space')) dlg.typedAt = -1e9;
  const n = (world.now - dlg.typedAt) * 70;
  dlg.talking = n < len;
  return n;
}

// Number keys pick dialog choices (the world ignores them while a dialog is open).
const pressedNumber = (ui) => {
  for (let i = 1; i <= 9; i++) if (ui.input.pressed?.has(`Digit${i}`) || ui.input.pressed?.has(`Numpad${i}`)) return i;
  return 0;
};

// A dialog choice: a row with a badge on the left (a quest's state, or an icon), a label and a
// line under it, and its number key on the right. Returns true when picked.
function choice(ui, x, y, w, c, n, th, key) {
  const { ctx } = ui;
  const hot = hover(ui, x, y, w, 21);
  const down = hot && ui.mouse.down;
  const fill = c.primary ? (hot ? '#ffffff' : th.light) : hot ? '#ffffff' : '#fffdfb';
  box(ctx, x, y + (down ? 1 : 0), w, 21, { fill, edge: hot ? th.dark : c.primary ? th.main : th.light, r: 8, width: hot || c.primary ? 1.5 : 1 });
  const bx = x + 11;
  const by = y + 10.5 + (down ? 1 : 0);
  ctx.beginPath();
  ctx.arc(bx, by, 7, 0, Math.PI * 2);
  if (c.badge === 'ready') {
    ctx.fillStyle = COLORS.good;
    ctx.fill();
    icon(ctx, 'check', bx, by, 9, '#ffffff');
  } else if (c.badge === 'available') {
    ctx.fillStyle = COLORS.select;
    ctx.fill();
    text(ctx, '!', bx, by + 3.5, { size: 9, bold: true, align: 'center', color: '#ffffff', outline: '#c99a1f' });
  } else if (c.badge === 'active') {
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = th.main;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 5.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.05, c.progress ?? 0));
    ctx.stroke();
  } else {
    ctx.fillStyle = c.primary ? th.main : th.light;
    ctx.fill();
    icon(ctx, c.icon ?? 'chat', bx, by, 8.5, c.primary ? '#ffffff' : th.dark);
  }
  const lw = w - 38;
  text(ctx, fit(ctx, c.label, lw, 7.5), x + 22, by - 1, { size: 7.5, bold: true, color: c.badge === 'ready' ? '#2f8f52' : COLORS.ink });
  if (c.sub) text(ctx, fit(ctx, c.sub, lw, 6, false), x + 22, by + 6.5, { size: 6, color: c.badge === 'ready' ? COLORS.good : COLORS.muted, bold: c.badge === 'ready' });
  box(ctx, x + w - 13, y + 6 + (down ? 1 : 0), 9, 9, { fill: th.light, edge: null, r: 3 });
  text(ctx, `${n}`, x + w - 8.5, y + 13.2 + (down ? 1 : 0), { size: 6, bold: true, align: 'center', color: th.ink });
  return clicked(ui, x, y, w, 21) || key === n;
}

export function npcWindow(ui, state, world) {
  const dlg = state.npc;
  // The shop and the salon are bigger than the talk box, so each places itself when it opens.
  if (dlg.mode !== 'shop') dlg.placedShop = false;
  if (dlg.mode !== 'style') dlg.placed = false;
  if (dlg.mode === 'shop') return shopWindow(ui, state, world);
  if (dlg.mode === 'style') return styleWindow(ui, state, world);
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const char = world.char;
  const { ctx } = ui;
  const jobOptions = dlg.job ? nextJobs(char.job, char.level).filter((j) => !npc.family || j.family === npc.family) : [];
  const questIds = (npc.quests ?? []).filter((id) => !['locked', 'done'].includes(questState(char, id)));

  // What you can say: each quest (new, in progress, or ready to hand in), the NPC's own service,
  // and goodbye.
  const choices = [];
  for (const id of questIds) {
    const st = questState(char, id);
    const objs = objectiveProgress(char, id);
    const progress = objs.length ? objs.reduce((n, o) => n + o.have / o.count, 0) / objs.length : 1;
    const sub = st === 'ready' ? 'Ready to hand in!' : st === 'available' ? `New quest · ${QUESTS[id].rewards.exp.toLocaleString()} EXP` : `In progress · ${Math.round(progress * 100)}%`;
    choices.push({ label: QUESTS[id].name, sub, badge: st, progress, primary: st !== 'active', run: () => (dlg.quest = id) });
  }
  if (npc.shop) choices.push({ label: 'Browse the shop', sub: `${(npc.shop?.length ?? 0) > 0 ? 'Buy and sell' : 'Sell'} · you have ${char.gold.toLocaleString()} gold`, icon: 'shop', run: () => (dlg.mode = 'shop') });
  if (npc.role === 'stylist') choices.push({ label: 'A new look', sub: `${npc.styleCost} gold a visit`, icon: 'wand', primary: true, run: () => Object.assign(dlg, { mode: 'style', look: { ...char.appearance } }) });
  if (npc.role === 'dungeon') choices.push({ label: `Enter ${DUNGEONS[npc.dungeon].name}`, sub: `Lv ${DUNGEONS[npc.dungeon].minLevel}+ · a group of four`, icon: 'star', primary: true, run: () => (dlg.dungeon = true) });
  if (npc.role === 'instructor') {
    const ready = nextJobs(char.job, char.level).some((j) => j.family === npc.family);
    choices.push({ label: 'Job advancement', sub: ready ? 'You are ready!' : 'Not yet', icon: 'star', primary: ready, run: () => (dlg.job = true) });
  }
  choices.push({ label: 'Goodbye', sub: null, icon: 'door', run: () => (dlg.bye = true) });
  const rows = Math.ceil(choices.length / 2);

  const qStateNow = dlg.quest ? questState(char, dlg.quest) : null;
  const H = dlg.quest ? (qStateNow === 'ready' ? 118 : 138) : dlg.dungeon ? 150 : dlg.job ? Math.max(104, 46 + jobOptions.length * 46) : Math.max(100, 50 + rows * 24);
  const area = dialogFrame(ui, win, npc, H, world, dlg.talking);
  if (!area || dlg.bye) {
    state.npc = null;
    win.open = false;
    return;
  }
  const { x: tx, w: tw, theme: th } = area;
  const key = pressedNumber(ui);

  // Sub-pages: a quest's text, a job choice, or the greeting with options.
  if (dlg.quest) {
    questPage(ui, state, world, npc, area, key);
    return;
  }

  if (dlg.dungeon) {
    dlg.talking = false;
    dungeonPage(ui, state, world, npc, area);
    return;
  }

  if (dlg.job) {
    const options = jobOptions;
    let y = area.y - 4;
    if (!options.length) {
      const next = Object.values(JOBS).filter((j) => j.parent === char.job && (!npc.family || j.family === npc.family));
      const msg = next.length ? `Come back at level ${next[0].level} and I'll teach you more.` : char.job === 'novice' ? '' : 'You have learned all I can teach for now.';
      const fam = JOBS[char.job].family;
      const words = npc.family && char.job !== 'novice' && fam !== npc.family ? 'You walk a different path. Seek your own instructor.' : msg;
      wrap(ctx, words, tx, y + 8, tw, { size: 8.5, chars: typed(ui, dlg, `job:${words}`, world, area, words.length) });
    } else dlg.talking = false;
    // One card per path: its name, what it's about, what it fights with and the stat it grows,
    // and a Choose button (or its number key).
    options.forEach((j, i) => {
      box(ctx, tx - 2, y - 4, tw + 4, 42, { fill: '#ffffff', edge: th.light, r: 8, width: 1.5 });
      text(ctx, j.name, tx + 4, y + 7, { size: 9.5, bold: true, color: th.dark });
      wrap(ctx, j.blurb, tx + 4, y + 17, tw - 70, { size: 7, lineHeight: 8.5 });
      const stat = (FAMILY_STATS[j.family] ?? FAMILY_STATS.beginner).primary.toUpperCase();
      const uses = (j.weapons ?? []).filter((w) => w !== 'none').map((w) => w[0].toUpperCase() + w.slice(1)).join(', ');
      text(ctx, fit(ctx, `${uses} · grows ${stat}`, tw - 70, 6.5, false), tx + 4, y + 34, { size: 6.5, color: COLORS.muted });
      const picked = button(ui, tx + tw - 60, y + 9, 58, 18, `${i + 1}  Choose`, { primary: true, size: 8 }) || key === i + 1;
      y += 46;
      if (picked) {
        advanceJob(char, j.id);
        world.log(`You are now a ${j.name}! Spend your new SP in the Skills window (K).`, '#ffe36b');
        world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
        state.npc = null;
        win.open = false;
      }
    });
    if (!state.npc) return;
    if (button(ui, tx + tw - 70, area.bottom - 16, 70, 17, 'Back') || ui.input.pressed?.has('Backspace')) dlg.job = false;
    return;
  }

  // The greeting, typed out, with a bouncing sparkle when it's done; then the choices in two
  // columns, each with its number key.
  const chars = typed(ui, dlg, `hi:${dlg.id}`, world, area, npc.greeting.length);
  const end = wrap(ctx, npc.greeting, tx, area.y + 2, tw, { size: 8.5, chars, lineHeight: 11.5 });
  if (chars >= npc.greeting.length) sparkle(ctx, tx + tw - 4, end - 10 + Math.sin(world.now * 6) * 1.5, 2.5, th.main);
  const colW = (tw - 6) / 2;
  choices.forEach((c, i) => {
    const bx = tx + (i % 2) * (colW + 6);
    const by = area.bottom - rows * 24 + Math.floor(i / 2) * 24 + 2;
    if (choice(ui, bx, by, colW, c, i + 1, th, key)) c.run();
  });
}

// A quest, told by its giver: the story typing out, what it asks (with progress once it's yours,
// and where to go), the rewards as item cells, and Accept, Complete, or Back. Enter takes the main
// action and Backspace goes back.
function questPage(ui, state, world, npc, area, key) {
  const { ctx } = ui;
  const dlg = state.npc;
  const char = world.char;
  const { x: tx, w: tw, theme: th } = area;
  const q = QUESTS[dlg.quest];
  const st = questState(char, dlg.quest);
  const words = st === 'ready' ? 'You did it! Thank you so much. Here is your reward.' : q.text;
  const chars = typed(ui, dlg, `q:${dlg.quest}:${st}`, world, area, words.length);
  text(ctx, q.name, tx, area.y, { size: 9.5, bold: true, color: th.ink });
  ctx.font = font(9.5, true);
  const nw = ctx.measureText(q.name).width;
  const chipText = st === 'ready' ? 'Complete!' : st === 'active' ? 'In progress' : 'New';
  ctx.font = font(6.5, true);
  const cw = ctx.measureText(chipText).width + 10;
  box(ctx, tx + nw + 6, area.y - 8, cw, 10, { fill: st === 'ready' ? COLORS.good : st === 'active' ? th.light : COLORS.select, edge: null, r: 5 });
  text(ctx, chipText, tx + nw + 6 + cw / 2, area.y - 0.5, { size: 6.5, bold: true, align: 'center', color: st === 'active' ? th.ink : '#ffffff' });
  let y = wrap(ctx, words, tx, area.y + 13, tw, { size: 8, chars, lineHeight: 10.5 });

  // What it asks.
  if (st !== 'ready') {
    for (const o of objectiveProgress(char, dlg.quest)) {
      const name = o.type === 'kill' ? `Defeat ${MOBS[o.mob].name}` : `Bring ${ITEMS[o.item].name}`;
      const done = st === 'active' && o.have >= o.count;
      text(ctx, fit(ctx, `${name}${st === 'active' ? '' : ` x${o.count}`}`, tw / 2, 7, true), tx, y + 2, { size: 7, bold: true, color: done ? '#2f8f52' : COLORS.ink });
      if (st === 'active') {
        box(ctx, tx + tw / 2 + 4, y - 3.5, tw / 2 - 40, 4, { fill: COLORS.cell, edge: null, r: 2 });
        box(ctx, tx + tw / 2 + 4, y - 3.5, Math.max(4, ((tw / 2 - 40) * o.have) / o.count), 4, { fill: done ? COLORS.good : th.main, edge: null, r: 2 });
        text(ctx, `${o.have}/${o.count}`, tx + tw, y + 2, { size: 7, bold: true, align: 'right', color: done ? '#2f8f52' : th.dark });
      } else {
        const hint = objectiveHint(o);
        if (hint) text(ctx, fit(ctx, hint, tw / 2 - 8, 6.5, false), tx + tw, y + 2, { size: 6.5, align: 'right', color: COLORS.muted });
      }
      y += 10;
    }
  }

  // The rewards, as cells you can hover, then EXP and gold.
  const by = area.bottom - 16;
  const ry = by - 23;
  text(ctx, st === 'ready' ? 'Your reward' : 'Reward', tx, ry + 12, { size: 7, bold: true, color: th.dark });
  let ix = tx + (st === 'ready' ? 50 : 34);
  for (const r of q.rewards.items) {
    const rid = rewardId(char, r);
    itemSlot(ctx, ix, ry + 1, 18, { id: rid, qty: r.qty, variant: r.variant === 'roll' ? null : r.variant ?? null }, { shadow: false });
    if (hover(ui, ix, ry + 1, 18, 18)) tooltip(ui, itemTooltip(char, rid));
    ix += 20;
  }
  icon(ctx, 'star', ix + 6, ry + 6, 7, COLORS.exp);
  text(ctx, `${q.rewards.exp.toLocaleString()} EXP`, ix + 12, ry + 8.5, { size: 7, bold: true, color: COLORS.ink });
  icon(ctx, 'coin', ix + 6, ry + 15, 7, COLORS.gold);
  text(ctx, `${q.rewards.gold.toLocaleString()} gold`, ix + 12, ry + 17.5, { size: 7, bold: true, color: COLORS.ink });

  const enter = ui.input.pressed?.has('Enter') && chars >= words.length;
  if (st === 'available' && (button(ui, tx + tw - 154, by, 74, 17, 'Accept', { primary: true }) || enter)) {
    acceptQuest(char, dlg.quest);
    world.log(`Quest accepted: ${q.name}`, '#bff0dc');
    if (questState(char, dlg.quest) !== 'ready') dlg.quest = null;
    return;
  }
  if (st === 'ready' && (button(ui, tx + tw - 154, by, 74, 17, 'Complete', { primary: true }) || enter)) {
    const r = completeQuest(char, dlg.quest);
    if (r) {
      world.log(`Quest complete: ${q.name}! +${r.exp} EXP, +${r.gold} gold`, '#ffe36b');
      for (const it of r.items) world.log(`Received ${ITEMS[it.id].name}${it.qty > 1 ? ` x${it.qty}` : ''}.`, ITEMS[it.id].color);
      if (r.levels) world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
      dlg.quest = null;
    } else {
      world.log('Make room in your bag first.', '#ffb3c6');
    }
    return;
  }
  if (button(ui, tx + tw - 74, by, 74, 17, 'Back') || ui.input.pressed?.has('Backspace')) dlg.quest = null;
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

// ---------- Stylist ----------

function styleWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 400;
  // Tall enough for the hair tab's rows (styles, bangs, colour and tips).
  const H = 290;
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
  drawHero(ctx, dlg.look, wornGear(char), win.x + 60, win.y + 190, { pose: 'idle', time: world.now, scale: 2.2 });
  if (button(ui, win.x + 20, win.y + H - 30, 80, 15, 'As before', { size: 8, enabled: !sameLook(dlg.look, char.appearance) })) dlg.look = { ...char.appearance };
  dlg.tab = tabs(ui, win.x + 124, win.y + 26, LOOK_TABS.map((t) => t.label), dlg.tab, { w: 56, h: 15 });
  dlg.look = lookRows(ui, dlg.look, dlg.tab, win.x + 122, win.y + 46, W - 132, { cell: [20, 24, 24, 32][dlg.tab], time: world.now, gap: 2 }).look;
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
