// The quest log (L) and the HUD quest tracker.
//
// The log has two panes. Tabs pick quests in progress, ones you can pick up (plus the next few
// you're close to the level for), and ones you've finished; the list on the left shows each with
// a badge (a progress ring, a ready check, a "!" or a lock), and the pane on the right shows the
// chosen one: who gave it and where they stand, the story, each objective with where to work on
// it, the rewards, and a pin for the tracker.
//
// The tracker is a card in the top-right corner with the pinned quests (every quest in progress
// until you pin your own). Counts pop when they move, a finished quest says who to report to,
// the card can be dragged anywhere by its header (the spot is saved), folded, or closed (the
// quest log and Options turn it back on), and clicking a quest opens the log on it.

import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { questTarget, setRoute } from '../world/routes.js';
import { questState, objectiveText, objectiveProgress, rewardId, trackedQuests, isTracked, toggleTracked, npcMap, objectiveHint, reportTo } from '../core/quests.js';
import { COLORS, THEMES, windowFrame, button, tabs, text, box, bar, hover, clicked, tooltip, wrap, well, icon, fit, toggle, itemSlot, font, textFont } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { settings, saveSettings } from '../core/settings.js';

const GREEN = '#2f8f52';
const READY_FILL = '#effcf3';

// A hunt or a fetch names what it wants ("Turnip Tot"); an errand says the whole thing ("Talk to Pip").
const errand = (o) => o.type !== 'kill' && o.type !== 'collect';
const objName = (o) => {
  const { verb, name } = objectiveText(o);
  return errand(o) ? `${verb} ${name}` : name;
};
const giverName = (q) => NPCS[q.giver]?.name ?? '';
const giverPlace = (q) => MAPS[npcMap(q.giver)]?.name ?? '';
// (Who you report to once it's done: usually the giver.)
const reportName = (q) => NPCS[reportTo(q.id)]?.name ?? '';
const reportPlace = (q) => MAPS[npcMap(reportTo(q.id))]?.name ?? '';

// How far along a quest is (0..1), across all its objectives.
function progressOf(char, id) {
  const objs = objectiveProgress(char, id);
  if (!objs.length) return 1;
  return objs.reduce((n, o) => n + o.have / o.count, 0) / objs.length;
}

// The quests on each tab. In progress lists finished ones (ready to hand in) first. Available
// also shows quests you're up to ten levels short of, locked, so you can plan ahead; quests still
// behind another one stay hidden.
function questLists(char) {
  const ids = Object.keys(QUESTS);
  const st = Object.fromEntries(ids.map((id) => [id, questState(char, id)]));
  const live = ids.filter((id) => st[id] === 'active' || st[id] === 'ready').sort((a, b) => (st[b] === 'ready') - (st[a] === 'ready'));
  const open = ids.filter((id) => st[id] === 'available');
  const soon = ids
    .filter((id) => st[id] === 'locked' && QUESTS[id].minLevel <= char.level + 10 && (!QUESTS[id].prereq || char.quests[QUESTS[id].prereq]?.state === 'done'))
    .sort((a, b) => QUESTS[a].minLevel - QUESTS[b].minLevel);
  const done = ids.filter((id) => st[id] === 'done');
  // The story: every chapter step reached so far, in order, and the next one coming up.
  const story = ids.filter((id) => QUESTS[id].story && (st[id] !== 'locked' || soon.includes(id)));
  const side = (list) => list.filter((id) => !QUESTS[id].story);
  return [story, live, side([...open, ...soon]), side(done)];
}

// A round badge for a quest's state: a progress ring while active, a check when ready or done,
// a "!" when you can pick it up, and a lock when you can't yet.
function badge(ctx, state, x, y, p, th) {
  const r = 7;
  const disc = (fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  if (state === 'ready') {
    disc(COLORS.good);
    icon(ctx, 'check', x, y, 9, '#ffffff');
  } else if (state === 'done') {
    disc(THEMES.mint.light);
    icon(ctx, 'check', x, y, 9, THEMES.mint.dark);
  } else if (state === 'available') {
    disc(COLORS.select);
    text(ctx, '!', x, y + 3.5, { size: 9, bold: true, align: 'center', color: '#ffffff', outline: '#c99a1f' });
  } else if (state === 'locked') {
    disc('#ddd2e8');
    icon(ctx, 'lock', x, y, 8, '#ffffff');
  } else {
    disc('#ffffff');
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = th.light;
    ctx.beginPath();
    ctx.arc(x, y, r - 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = th.main;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r - 1.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.04, p));
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
}

// ---------- Quest log ----------

const W = 312;
const H = 240;
const LIST_W = 118;
const ROW = 25;
const TABS = ['Story', 'In progress', 'Available', 'Done'];
const EMPTY = ['The story begins with Mira in Sprout Village (look for the ★).', 'Nothing in progress. Look for villagers with a "!" over their heads.', 'No new quests right now. Level up and check back!', 'Finished quests are kept here.'];

export function questsWindow(ui, state, world) {
  const win = state.windows.quests;
  if (!windowFrame(ui, win, W, H, 'Quests')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const lists = questLists(char);
  win.tab ??= 1;
  const tab = tabs(ui, win.x + 10, win.y + 27, TABS.map((l, i) => (i ? `${l} (${lists[i].length})` : l)), win.tab, { w: 70, h: 15 });
  if (tab !== win.tab) Object.assign(win, { tab, sel: null, scroll: 0 });
  const list = lists[win.tab];
  if (!list.includes(win.sel)) win.sel = list[0] ?? null;

  // The list, scrolled by the wheel; the chosen quest stays in view when picked from the tracker.
  const lx = win.x + 8;
  const ly = win.y + 50;
  const lh = H - 58;
  // Under the list: the switch for the HUD tracker.
  const sy = win.y + H - 20;
  text(ctx, 'Tracker', lx + 4, sy + 9.5, { size: 7.5, bold: true, color: th.ink });
  const show = toggle(ui, lx + LIST_W - 28, sy, settings.questTracker);
  if (show !== settings.questTracker) {
    settings.questTracker = show;
    saveSettings();
  }
  const rows = Math.floor((lh - 18) / ROW);
  if (win.reveal) {
    const i = list.indexOf(win.sel);
    if (i >= 0) win.scroll = Math.max(0, i - rows + 1);
    win.reveal = false;
  }
  if (hover(ui, lx, ly, LIST_W, lh)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, list.length - rows));
  if (!list.length) wrap(ctx, EMPTY[win.tab], lx + 4, ly + 12, LIST_W - 8, { role: 'secondary', lineHeight: 10 });
  const sbw = list.length > rows ? 5 : 0;
  list.slice(win.scroll, win.scroll + rows).forEach((id, i) => {
    if (listRow(ui, char, id, lx, ly + i * ROW, LIST_W - sbw, id === win.sel, th)) win.sel = id;
  });
  if (sbw) {
    // A slim scrollbar: the thumb's size is how much of the list shows.
    const tx = lx + LIST_W - 3;
    box(ctx, tx - 1, ly, 3, rows * ROW - 2, { fill: th.light, edge: null, r: 1.5 });
    const th2 = Math.max(10, ((rows * ROW - 2) * rows) / list.length);
    const ty = ly + ((rows * ROW - 2 - th2) * win.scroll) / Math.max(1, list.length - rows);
    box(ctx, tx - 1, ty, 3, th2, { fill: th.main, edge: null, r: 1.5 });
  }

  const dx = lx + LIST_W + 6;
  details(ui, char, win.sel, dx, ly, win.x + W - 8 - dx, lh, th, world);
}

// One quest in the list: its badge, name, and a line on where it stands. Returns true when clicked.
function listRow(ui, char, id, x, y, w, on, th) {
  const { ctx } = ui;
  const q = QUESTS[id];
  const st = questState(char, id);
  const hot = hover(ui, x, y, w, ROW - 2);
  const ready = st === 'ready';
  box(ctx, x, y, w, ROW - 2, { fill: on ? (ready ? READY_FILL : th.light) : hot ? '#ffffff' : 'rgba(255,255,255,0.65)', edge: on ? (ready ? COLORS.good : th.main) : th.light, r: 7, width: on ? 1.5 : 1 });
  badge(ctx, st, x + 11, y + 11.5, progressOf(char, id), th);
  const pinned = (st === 'active' || ready) && isTracked(char, id);
  const nameW = w - 26 - (pinned ? 8 : 0);
  text(ctx, fit(ctx, q.name, nameW, 7.5), x + 21, y + 10, { size: 7.5, bold: true, color: st === 'locked' ? COLORS.muted : ready ? GREEN : COLORS.ink });
  if (pinned) icon(ctx, 'pin', x + w - 7, y + 7, 6.5, th.main);
  let sub;
  if (ready) sub = `Report to ${reportName(q)}`;
  else if (st === 'active') {
    const o = objectiveProgress(char, id).find((x) => x.have < x.count);
    sub = o ? (errand(o) ? objName(o) : `${objName(o)} ${o.have}/${o.count}`) : `${Math.round(progressOf(char, id) * 100)}%`;
  } else if (st === 'available') sub = q.story ? `Chapter ${q.chapter} · ${giverName(q)}` : `${giverName(q)}, ${giverPlace(q)}`;
  else if (st === 'locked') sub = `Opens at Lv ${q.minLevel}`;
  else sub = giverName(q);
  text(ctx, fit(ctx, sub, w - 26, 6.5, false), x + 21, y + 19, { size: 6.5, color: ready ? COLORS.good : COLORS.muted, bold: ready });
  return clicked(ui, x, y, w, ROW - 2);
}

// A small heading with a rule after it.
function section(ctx, label, x, y, w, th) {
  text(ctx, label, x, y, { size: 7, bold: true, color: th.dark });
  ctx.font = textFont(7, true);
  const lw = ctx.measureText(label).width + 4;
  box(ctx, x + lw, y - 3, w - lw, 1, { fill: th.light, edge: null, r: 0.5 });
}

// The chosen quest in full.
function details(ui, char, id, x0, y0, w0, h0, th, world = null) {
  const { ctx } = ui;
  well(ctx, x0, y0, w0, h0, th);
  if (!id) {
    // Nothing chosen (an empty list): a little scroll and a line, so the panel isn't blank.
    const cx = x0 + w0 / 2;
    const cy = y0 + h0 / 2 - 8;
    ctx.fillStyle = th.light;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    icon(ctx, 'scroll', cx, cy, 18, th.main);
    text(ctx, 'No quests here yet', cx, cy + 32, { size: 7.5, bold: true, align: 'center', color: th.dark });
    return;
  }
  const q = QUESTS[id];
  const st = questState(char, id);
  const live = st === 'active' || st === 'ready';
  const x = x0 + 8;
  const w = w0 - 16;
  let y = y0 + 14;

  // Name, the level it needs, and who gives it where.
  const lvOk = char.level >= q.minLevel;
  text(ctx, fit(ctx, q.name, w - 34, 9.5), x, y, { size: 9.5, bold: true, color: st === 'ready' ? GREEN : th.ink });
  box(ctx, x + w - 28, y - 8, 28, 11, { fill: lvOk ? th.light : '#ffe0e8', edge: null, r: 5.5 });
  text(ctx, `Lv ${q.minLevel}`, x + w - 14, y + 0.5, { size: 6.5, bold: true, align: 'center', color: lvOk ? th.ink : COLORS.bad });
  y += 11;
  icon(ctx, 'user', x + 3, y - 2.5, 7, COLORS.muted);
  text(ctx, fit(ctx, `${giverName(q)}, ${giverPlace(q)}`, w - 10, 6.5, false), x + 9, y, { role: 'minor' });

  // The story, as the giver told it.
  y = wrap(ctx, q.text, x, y + 11, w, { size: 6.8, color: '#7a6296', lineHeight: 8.6 }) + 2;

  // Objectives: progress bars while it's yours, otherwise just what it asks.
  section(ctx, 'Objectives', x, y, w, th);
  y += 4;
  const objs = objectiveProgress(char, id);
  if (!objs.length) {
    text(ctx, `Talk to ${giverName(q)}.`, x + 2, y + 8, { size: 7, color: COLORS.ink });
    y += 12;
  }
  for (const o of objs) {
    const done = live && o.have >= o.count;
    const { verb } = objectiveText(o);
    const label = errand(o) ? objName(o) : live ? `${verb} ${objName(o)}` : `${verb} ${o.count} ${objName(o)}`;
    text(ctx, fit(ctx, label, w - 30, 7), x + 2, y + 8, { size: 7, bold: true, color: done ? GREEN : COLORS.ink });
    if (live) {
      text(ctx, `${o.have}/${o.count}`, x + w - 1, y + 8, { size: 7, bold: true, align: 'right', color: done ? GREEN : th.dark });
      bar(ctx, x + 2, y + 10.5, w - 3, 4, o.have / o.count, done ? COLORS.good : th.main, null);
      y += 6;
    }
    const hint = objectiveHint(o);
    if (hint) {
      icon(ctx, 'map', x + 5, y + 13.6, 6, COLORS.muted);
      text(ctx, fit(ctx, hint, w - 12, 6.2, false), x + 10, y + 16, { size: 6.2, color: COLORS.muted });
      y += 8;
    }
    y += 12;
  }

  // Rewards: the items as icons (hover for details), then EXP and gold.
  y += 5;
  section(ctx, 'Rewards', x, y, w, th);
  y += 4;
  let ix = x + 1;
  for (const r of q.rewards.items) {
    const rid = rewardId(char, r);
    itemSlot(ctx, ix, y, 18, { id: rid, qty: r.qty, variant: r.variant === 'roll' ? null : r.variant ?? null }, { shadow: false });
    if (hover(ui, ix, y, 18, 18)) tooltip(ui, itemTooltip(char, rid));
    ix += 20;
  }
  const rx = ix + 3;
  icon(ctx, 'star', rx + 3, y + 5, 7, COLORS.exp);
  text(ctx, `${q.rewards.exp.toLocaleString()} EXP`, rx + 9, y + 7.5, { size: 7, bold: true, color: COLORS.ink });
  icon(ctx, 'coin', rx + 3, y + 14, 7, COLORS.gold);
  text(ctx, `${q.rewards.gold.toLocaleString()} gold`, rx + 9, y + 16.5, { size: 7, bold: true, color: COLORS.ink });

  // Footer: what to do next, and the tracker pin.
  const fy = y0 + h0 - 20;
  const pinW = live ? 50 : 0;
  let note;
  let color = COLORS.muted;
  if (st === 'ready') {
    note = `Report to ${reportName(q)} in ${reportPlace(q)}!`;
    color = GREEN;
  } else if (st === 'active') note = `${Math.round(progressOf(char, id) * 100)}% done`;
  else if (st === 'available') note = `Talk to ${giverName(q)} in ${giverPlace(q)} to start.`;
  else if (st === 'locked') note = `Reach Lv ${q.minLevel} to start.`;
  else {
    note = 'Completed!';
    color = GREEN;
  }
  // "Go": the guide leads you to wherever the quest wants you next.
  const target = world && (live || st === 'available') ? questTarget(char, id) : null;
  const goW = target && target !== world.map.id ? 26 : 0;
  wrap(ctx, note, x, fy + 7, w - pinW - goW - 6, { size: 6.8, bold: true, color, lineHeight: 8 });
  if (goW && button(ui, x + w - pinW - goW - 2, fy, goW, 16, 'Go', { primary: true, theme: 'pink', size: 7.5 })) setRoute(world, target);
  if (live) {
    const on = isTracked(char, id);
    if (button(ui, x + w - pinW, fy, pinW, 16, on ? 'Pinned' : 'Pin', { primary: on, size: 7.5, iconName: 'pin' })) toggleTracked(char, id);
  }
}

// ---------- Tracker ----------

// Each objective's last count and when it last went up, so the count can pop.
const seen = new Map();
const POP = 0.6;

// Where the card was last drawn (for the layout editor, ui/layout.js).
export let trackerBox = null;
export function drawQuestTracker(ui, state, world) {
  const log = state.windows.quests;
  if (log.open) return;
  const char = world.char;
  const ids = trackedQuests(char);
  if (!ids.length) return;
  const { ctx } = ui;
  const th = THEMES.mint;
  const t = world.now;
  const cards = ids.map((id) => ({ id, q: QUESTS[id], ready: questState(char, id) === 'ready', objs: objectiveProgress(char, id) }));
  const cardH = (c) => 14 + (c.ready ? 10 : c.objs.length * 12);
  const folded = Boolean(state.trackerFolded);
  const w = 138;
  const h = 15 + (folded ? 0 : cards.reduce((n, c) => n + cardH(c) + 2, 0) + 1);
  // Where it sits: the top right, or wherever it was dragged (kept on screen).
  const pos = settings.trackerPos;
  const x = Math.max(0, Math.min(640 - w, pos ? pos.x : 640 - w - 6));
  const y = Math.max(0, Math.min(360 - 15, pos ? pos.y : 6));
  // Windows drawn over the tracker take the clicks there.
  const m = ui.mouse;
  const covered = Object.values(state.windows).some((win) => win.open && win.w && m.x >= win.x && m.x < win.x + win.w && m.y >= win.y && m.y < win.y + win.h);
  const press = (bx, by, bw, bh) => !covered && clicked(ui, bx, by, bw, bh);

  trackerBox = { x, y, w, h };
  box(ctx, x, y, w, h, { fill: 'rgba(255,250,246,0.86)', edge: th.main, r: 8, width: 1.2 });
  const hotHead = !covered && hover(ui, x, y, w - 28, 14);
  box(ctx, x + 2, y + 2, w - 4, 11, { fill: hotHead || state.trackerDrag ? th.dark : th.main, edge: null, r: 5.5 });
  icon(ctx, 'scroll', x + 9, y + 7.5, 8, '#ffffff');
  text(ctx, `Quests (${ids.length})`, x + 16, y + 10.5, { size: 7, bold: true, color: '#ffffff', outline: th.ink });
  // Two small buttons at the right of the header: fold (an arrow) and close (an x).
  const fx = x + w - 27;
  const cx = x + w - 14;
  for (const [bx, kind] of [[fx, 'fold'], [cx, 'close']]) {
    const hot = !covered && hover(ui, bx, y + 2, 11, 11);
    if (hot) box(ctx, bx, y + 2.5, 11, 10, { fill: 'rgba(255,255,255,0.35)', edge: null, r: 5 });
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    const ax = bx + 5.5;
    const ay = y + 7.5;
    ctx.beginPath();
    if (kind === 'close') {
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      ctx.moveTo(ax - 2, ay - 2);
      ctx.lineTo(ax + 2, ay + 2);
      ctx.moveTo(ax + 2, ay - 2);
      ctx.lineTo(ax - 2, ay + 2);
      ctx.stroke();
      ctx.lineCap = 'butt';
    } else {
      // Down while open, left when folded.
      if (folded) {
        ctx.moveTo(ax + 1.8, ay - 2.4);
        ctx.lineTo(ax + 1.8, ay + 2.4);
        ctx.lineTo(ax - 1.8, ay);
      } else {
        ctx.moveTo(ax - 2.4, ay - 1.4);
        ctx.lineTo(ax + 2.4, ay - 1.4);
        ctx.lineTo(ax, ay + 2.2);
      }
      ctx.fill();
    }
    if (hot) tooltip(ui, [{ text: kind === 'close' ? 'Close the tracker' : folded ? 'Show quests' : 'Fold away', bold: true }, ...(kind === 'close' ? [{ text: 'Turn it back on in the quest log (L)', color: COLORS.muted, size: 7 }] : [])]);
    if (press(bx, y + 2, 11, 11)) {
      if (kind === 'fold') state.trackerFolded = !folded;
      else {
        settings.questTracker = false;
        saveSettings();
        world.log('Quest tracker hidden. Turn it back on in the quest log (L).', '#bff0dc');
        return;
      }
    }
  }
  // Dragging the header moves the card; letting go saves the spot.
  if (press(x, y, w - 28, 14)) state.trackerDrag = { dx: m.x - x, dy: m.y - y };
  if (state.trackerDrag) {
    if (m.down) {
      settings.trackerPos = { x: Math.round(Math.max(0, Math.min(640 - w, m.x - state.trackerDrag.dx))), y: Math.round(Math.max(0, Math.min(360 - 15, m.y - state.trackerDrag.dy))) };
    } else {
      state.trackerDrag = null;
      saveSettings();
    }
  } else if (hotHead) tooltip(ui, [{ text: 'Drag to move', bold: true }]);
  if (folded) return;

  let cy = y + 16;
  for (const c of cards) {
    const ch = cardH(c);
    const hot = !covered && hover(ui, x + 3, cy, w - 6, ch);
    box(ctx, x + 3, cy, w - 6, ch, { fill: c.ready ? READY_FILL : hot ? '#ffffff' : 'rgba(255,255,255,0.55)', edge: c.ready ? COLORS.good : hot ? th.main : null, r: 6, width: 1 });
    // A quest that just finished glows for a moment.
    const doneKey = `${c.id}|ready`;
    const was = seen.get(doneKey);
    if (!was || was.have !== c.ready) seen.set(doneKey, { have: c.ready, at: was && c.ready ? t : -9 });
    const glow = Math.max(0, 1 - (t - seen.get(doneKey).at) / 1.2);
    if (glow > 0) {
      ctx.globalAlpha = glow * 0.6;
      box(ctx, x + 1.5, cy - 1.5, w - 3, ch + 3, { fill: null, edge: COLORS.good, r: 7, width: 2.5 });
      ctx.globalAlpha = 1;
    }
    text(ctx, fit(ctx, c.q.name, w - (c.ready ? 36 : 24), 7.5), x + 8, cy + 9.5, { size: 7.5, bold: true, color: c.ready ? GREEN : th.ink });
    if (c.ready) {
      icon(ctx, 'check', x + w - 11, cy + 6.5, 8, COLORS.good);
      const bob = Math.sin(t * 5) * 1;
      text(ctx, fit(ctx, `➜ Report to ${reportName(c.q)}`, w - 20, 6.5), x + 9 + Math.max(0, bob), cy + 19.5, { size: 6.5, bold: true, color: COLORS.good });
    } else {
      c.objs.forEach((o, i) => {
        const key = `${c.id}|${i}`;
        const prev = seen.get(key);
        if (!prev || prev.have !== o.have) seen.set(key, { have: o.have, at: prev && o.have > prev.have ? t : -9 });
        const pop = Math.max(0, 1 - (t - seen.get(key).at) / POP);
        const done = o.have >= o.count;
        const oy = cy + 13 + i * 12;
        if (done) icon(ctx, 'check', x + 10, oy + 3.6, 6, COLORS.good);
        else {
          ctx.fillStyle = th.main;
          ctx.beginPath();
          ctx.arc(x + 10, oy + 3.6, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
        text(ctx, fit(ctx, objName(o), w - 52, 6.5, false), x + 15, oy + 6, { size: 6.5, color: done ? GREEN : COLORS.ink });
        // The count grows and settles back when it moves.
        const size = 6.5 * (1 + 0.45 * pop * pop);
        text(ctx, `${o.have}/${o.count}`, x + w - 9, oy + 6 + pop, { size, bold: true, align: 'right', color: done ? GREEN : pop > 0 ? th.ink : th.dark });
        bar(ctx, x + 15, oy + 8.2, w - 24, 2.6, o.have / o.count, done ? COLORS.good : th.main, null, { flash: pop });
        // A party member's kill or find: a little rose heart and their name rise off the count.
        const credit = world.partyCredit?.[`${c.id}|${o.mob ?? o.item}`];
        const age = credit ? t - credit.at : 9;
        if (age < 2.2) {
          const u = age / 2.2;
          ctx.globalAlpha = Math.min(1, age * 6) * (1 - u * u);
          const rise = (1 - Math.pow(1 - u, 3)) * 5;
          const label = `+${credit.name}`;
          ctx.font = font(5.5, true);
          const lw = ctx.measureText(label).width;
          const lx = x + w - 30 - lw;
          icon(ctx, 'heart', lx - 4, oy + 3 - rise, 5, '#ff6b9a');
          text(ctx, label, lx, oy + 5 - rise, { size: 5.5, bold: true, color: '#e0659f' });
          ctx.globalAlpha = 1;
        }
      });
    }
    // A map pin: the guide trail straight to where the quest wants you now.
    const to = questTarget(char, c.id);
    const px = x + w - (c.ready ? 24 : 12);
    const pinHot = to && !covered && hover(ui, px - 5, cy + 1, 11, 11);
    if (to) {
      const guiding = world.route?.to === to;
      if (pinHot || guiding) box(ctx, px - 5, cy + 1.5, 11, 10, { fill: guiding ? th.main : 'rgba(255,255,255,0.9)', edge: th.main, r: 5, width: 0.8 });
      icon(ctx, 'map', px, cy + 6.5, 7, guiding ? '#ffffff' : th.dark);
    }
    if (pinHot) tooltip(ui, [{ text: world.route?.to === to ? 'Stop the guide' : `Show the way: ${MAPS[to].name}`, bold: true }]);
    else if (hot) tooltip(ui, [{ text: c.q.name, bold: true }, { text: 'Click to open the quest log', color: COLORS.muted, size: 7 }]);
    if (to && press(px - 5, cy + 1, 11, 11)) setRoute(world, world.route?.to === to ? null : to);
    else if (press(x + 3, cy, w - 6, ch)) {
      Object.assign(log, { open: true, tab: QUESTS[c.id].story ? 0 : 1, sel: c.id, reveal: true });
    }
    cy += ch + 2;
  }
}
