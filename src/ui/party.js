// Party UI: the right-click menu on players (and yourself), and the party panel on the HUD with
// each member's level, job, and HP, plus a Leave button.

import { askVisit } from '../net/visit.js';
import { JOBS } from '../data/jobs.js';
import { ROLES } from '../data/dungeons.js';
import { invite, kick, leaveParty, partyMembers, inviteBlocker, PARTY_MAX, PLAYSTYLES } from '../world/party.js';
import { openProfile } from './profile.js';
import { COLORS, THEMES, text, box, hover, clicked, tooltip, icon, button, fit } from './kit.js';
import { buffsBottom } from './hud.js';
import { settings } from '../core/settings.js';
import { online } from '../net/online.js';
import { askParty, partyBlocker, inParty, kickFromParty, leaveOnlineParty, partyFriends, askTrade, askJoinParty, joinPartyBlocker, leaderOf } from '../net/together.js';
import { askToJoin, joinBlocker } from '../world/grouping.js';
import { partyEmoteBar } from './grouping.js';
import { MAPS } from '../data/maps.js';
import { askFriend, addBlocker, isBuddy, thanked } from '../world/buddies.js';
import { helpOut } from '../world/lives.js';
import { joinGroup } from '../world/social.js';

// ---------- Right-click menu ----------

export function openMenu(state, menu) {
  state.menu = menu;
}

function menuItems(state, world) {
  const m = state.menu;
  const items = [];
  if (m.kind === 'self') {
    items.push({ label: 'View my profile', icon: 'user', run: () => openProfile(state, { kind: 'self' }) });
    if (partyMembers(world.bots).length || online.party) items.push({ label: 'Leave party', icon: 'door', run: () => leaveAll(world) });
    return items;
  }
  // A friend online.
  if (m.kind === 'ghost') {
    const g = online.ghosts.get(m.id);
    if (!g) return items;
    items.push({ label: 'View profile', icon: 'user', run: () => openProfile(state, { kind: 'ghost', id: g.id }) });
    if (inParty(g.id)) {
      if (online.party.leader === online.id) items.push({ label: 'Remove from party', icon: 'door', run: () => kickFromParty(world, g.id) });
    } else {
      const why = partyBlocker(g);
      items.push({ label: 'Invite to party', icon: 'heart', why, enabled: !why, run: () => askParty(world, g.id) });
      // They're in a party of their own: one click asks its leader to take you in.
      if (leaderOf(g.id) !== g.id || online.rosters?.has(g.id)) {
        const no = joinPartyBlocker(g);
        items.push({ label: 'Join their party', icon: 'friends', why: no, enabled: !no, run: () => askJoinParty(world, g.id) });
      }
    }
    if (!online.trade) items.push({ label: 'Trade', icon: 'coin', run: () => askTrade(world, g.id) });
    // Their island (net/visit.js), if they have one.
    if (g.island) items.push({ label: 'Visit their island', icon: 'heart', run: () => { const why = askVisit(world, g.id); if (why) world.log(why, '#ffb3c6'); } });
    return items;
  }
  const bot = world.bots?.list.find((b) => b.id === m.id);
  if (!bot) return items;
  items.push({ label: 'View profile', icon: 'user', run: () => openProfile(state, { kind: 'bot', id: bot.id, shop: Boolean(bot.shop) }) });
  if (bot.party) items.push({ label: 'Remove from party', icon: 'door', run: () => kick(world.bots, bot, world) });
  else {
    const why = inviteBlocker(world.bots, bot, world);
    items.push({ label: 'Invite to party', icon: 'heart', why, enabled: !why, run: () => invite(world.bots, bot, world) });
    // Or ask to join theirs: they lead, and say yes if your level fits where they hunt.
    if (!bot.lfg && !bot.shop) {
      const no = joinBlocker(world, bot);
      items.push({ label: bot.joinAsk ? 'Asked to join...' : 'Ask to join them', icon: 'friends', why: no, enabled: !no, run: () => askToJoin(world, bot) });
    }
  }
  if (bot.helped && !bot.thanked) items.push({ label: 'Say thanks', icon: 'heart', run: () => thanked(world.bots, world) });
  if (bot.helpAsk && !bot.party) items.push({ label: 'Help them', icon: 'heart', run: () => helpOut(world.bots, world, bot) });
  if (bot.lfg && !bot.party) {
    const why = partyMembers(world.bots).length ? 'Leave your party first' : null;
    items.push({ label: 'Join their group', icon: 'shield', why, enabled: !why, run: () => joinGroup(world.bots, world, bot) });
  }
  if (!isBuddy(world.char, bot.name)) {
    const why = addBlocker(world, bot);
    items.push({ label: 'Add friend', icon: 'friends', why, enabled: !why, run: () => askFriend(world, bot) });
  }
  if (bot.shop) items.push({ label: 'Browse shop', icon: 'shop', run: () => openProfile(state, { kind: 'bot', id: bot.id, shop: true }) });
  return items;
}

export function drawMenu(ui, state, world) {
  const m = state.menu;
  if (!m) return;
  const { ctx } = ui;
  const items = menuItems(state, world);
  const bot = m.kind === 'bot' ? world.bots?.list.find((b) => b.id === m.id) : m.kind === 'ghost' ? online.ghosts.get(m.id) : null;
  if (!items.length || (m.kind !== 'self' && !bot)) {
    state.menu = null;
    return;
  }
  const th = THEMES.lavender;
  const w = 118;
  const h = 18 + items.length * 17;
  const x = Math.min(m.x, 640 - w - 4);
  const y = Math.min(m.y, 326 - h);
  box(ctx, x, y + 3, w, h, { fill: 'rgba(90,50,120,0.18)', edge: null, r: 8 });
  box(ctx, x, y, w, h, { fill: '#fffaf6', edge: th.dark, r: 8, width: 1.5 });
  const title = bot ? `${bot.name} · Lv ${bot.level}` : world.char.name;
  box(ctx, x + 3, y + 3, w - 6, 12, { fill: th.main, edge: null, r: 6 });
  text(ctx, title, x + w / 2, y + 12, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: th.ink });
  items.forEach((it, i) => {
    const iy = y + 18 + i * 17;
    const enabled = it.enabled !== false;
    const hot = enabled && hover(ui, x + 3, iy, w - 6, 15);
    if (hot) box(ctx, x + 3, iy, w - 6, 15, { fill: th.light, edge: null, r: 6 });
    icon(ctx, it.icon, x + 12, iy + 7.5, 9, enabled ? th.dark : '#c4b4d8');
    text(ctx, it.label, x + 21, iy + 10.5, { size: 7.5, bold: true, color: enabled ? COLORS.ink : '#b8a8c8' });
    if (it.why && hover(ui, x + 3, iy, w - 6, 15)) tooltip(ui, [{ text: it.why, size: 8, color: enabled ? COLORS.gold : COLORS.bad }]);
    if (enabled && clicked(ui, x + 3, iy, w - 6, 15)) {
      it.run();
      state.menu = null;
    }
  });
  // Any other click closes it.
  if (ui.mouse.clicked || ui.mouse.right) {
    if (!hover(ui, x, y, w, h)) state.menu = null;
    if (hover(ui, x, y, w, h)) {
      ui.mouse.clicked = false;
      ui.used = true;
    }
  }
}

// ---------- Party panel ----------

const PLAYSTYLE_TEXT = {
  rusher: 'Hunts on their own and dives into packs.',
  guardian: 'Hunts on their own, picking off monsters near you.',
  sniper: 'Hunts on their own from range, shooting across ledges.',
  healer: 'Hunts on their own and heals you from anywhere on the map.',
};

// Leaving takes you out of both: your friends' party and the players you invited.
export function leaveAll(world) {
  if (online.party) leaveOnlineParty(world, partyMembers(world.bots).length > 0);
  leaveParty(world.bots, world);
}

// On a phone the left column has to stop above the thumb stick.
const TOUCH_FLOOR = 214;

export function drawPartyPanel(ui, state, world) {
  state.leftColumnY = buffsBottom(world);
  const members = partyMembers(world.bots);
  const friends = world.dungeon ? [] : partyFriends();
  if (!members.length && !friends.length) return;
  const { ctx } = ui;
  const th = THEMES.mint;
  const x = 6;
  const map = world.map;
  const y = state.leftColumnY;
  const w = 120;
  // On a phone the rows are slim (name and HP side by side) and the panel stops above the thumb
  // stick: rows past that fold into a "+N more" line. The header folds the panel either way.
  const touch = Boolean(ui.input?.touch);
  const rowH = touch ? 14 : 19;
  const total = members.length + friends.length + 1;
  const fold = Boolean(state.partyFold);
  const room = touch ? Math.max(1, Math.floor((TOUCH_FLOOR - y - 18) / rowH)) : total;
  const shown = fold ? 0 : total > room ? room - 1 : total;
  const more = fold ? 0 : total - shown;
  const h = 18 + shown * rowH + (more ? 11 : 0) - (fold ? 3 : 0);
  const lead = world.bots?.partyLead ?? null;
  box(ctx, x, y, w, h, { fill: 'rgba(255,250,246,0.88)', edge: th.main, r: 8, width: 1.5 });
  box(ctx, x + 2, y + 2, w - 4, 12, { fill: th.main, edge: null, r: 6 });
  icon(ctx, 'heart', x + 9, y + 8, 8, '#ffffff');
  // In a dungeon the panel shows the group: everyone's role and real HP.
  const run = world.dungeon;
  text(ctx, run ? 'Dungeon group' : friends.length ? `Party ${members.length + friends.length + 1}` : `Party ${members.length + 1}/${PARTY_MAX + 1}`, x + 17, y + 11, { size: 7, bold: true, color: '#ffffff', outline: th.ink });
  // A little chevron: the header folds the panel away and back.
  text(ctx, fold ? '▸' : '▾', x + w - 40, y + 11, { size: 7, bold: true, align: 'center', color: '#ffffff' });
  if (!run && button(ui, x + w - 32, y + 2, 28, 12, 'Leave', { size: 6.5 })) leaveAll(world);
  if (clicked(ui, x, y, w - 34, 14)) state.partyFold = !fold;
  if (hover(ui, x, y, w - 34, 14)) tooltip(ui, fold ? 'Show the party' : 'Fold the party panel');
  const role = (id) => ROLES[run.roles[id] ?? 'dps'];
  const row = (i, name, level, job, hp, leader, onClick, onRight, hot, style = null) => {
    if (i >= shown) return;
    const ry = y + 17 + i * rowH;
    const rh = rowH - 2;
    box(ctx, x + 3, ry, w - 6, rh, { fill: hp <= 0 ? '#e8e0f0' : hot ? '#ffffff' : '#fffdfb', edge: th.light, r: 6, width: 1 });
    const my = touch ? ry + rh / 2 : ry + 5.5;
    if (leader) icon(ctx, 'crown', x + 10, my + 0.5, 7, '#f0b53a');
    else if (style) {
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.arc(x + 9, my, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    const nx = x + (leader || style ? 14 : 7);
    if (touch) {
      // Slim: the name on the left, the HP bar on the right.
      text(ctx, fit(ctx, name, 56, 7.5, true), nx, ry + rh / 2 + 2.8, { size: 7.5, bold: true });
      box(ctx, x + 74, ry + rh / 2 - 1.5, w - 81, 3, { fill: 'rgba(74,53,96,0.2)', edge: null, r: 1.5 });
      if (hp > 0) box(ctx, x + 74, ry + rh / 2 - 1.5, Math.max(2, (w - 81) * hp), 3, { fill: hp < 0.3 ? '#ff6b8a' : run ? '#7ee081' : COLORS.hp, edge: null, r: 1.5 });
    } else {
      text(ctx, name, nx, ry + 8, { size: 6.5, bold: true });
      text(ctx, `Lv${level} ${style ? style.label : JOBS[job].short ?? JOBS[job].name}`, x + w - 6, ry + 8, { size: 5.5, bold: Boolean(style), align: 'right', color: style ? style.color : COLORS.muted });
      box(ctx, x + 7, ry + 11, w - 14, 3, { fill: 'rgba(74,53,96,0.2)', edge: null, r: 1.5 });
      if (hp > 0) box(ctx, x + 7, ry + 11, Math.max(2, (w - 14) * hp), 3, { fill: hp < 0.3 ? '#ff6b8a' : run ? '#7ee081' : COLORS.hp, edge: null, r: 1.5 });
    }
    if (clicked(ui, x + 3, ry, w - 6, rh)) onClick();
    if (ui.mouse.right && hover(ui, x + 3, ry, w - 6, rh)) {
      ui.used = true;
      ui.mouse.right = false;
      onRight(ry);
    }
  };
  const rowHot = (i) => i < shown && hover(ui, x + 3, y + 17 + i * rowH, w - 6, rowH - 2);
  const s = world.stats;
  const leadMe = (!online.party || online.party.leader === online.id) && !lead;
  row(0, world.char.name, world.char.level, world.char.job, world.dead ? 0 : world.char.hp / s.maxHp, !run && leadMe,
    () => openProfile(state, { kind: 'self' }), (ry) => openMenu(state, { kind: 'self', x: x + w + 2, y: ry }), rowHot(0), run ? role('you') : null);
  // Friends online in your party: their HP, and where they are when it isn't here.
  friends.forEach((g, i) => {
    const hot = rowHot(i + 1);
    const away = g.map !== world.map.id;
    row(i + 1, g.name, g.level ?? 1, g.job ?? 'novice', g.dead ? 0 : (g.hp ?? 1) / (g.maxHp || 1), online.party.leader === g.id,
      () => openProfile(state, { kind: 'ghost', id: g.id }), (r) => openMenu(state, { kind: 'ghost', id: g.id, x: x + w + 2, y: r }), hot,
      { label: away ? (MAPS[g.map]?.name ?? '...') : JOBS[g.job]?.short ?? JOBS[g.job]?.name ?? '', color: away ? '#9c86b8' : '#4f95e0' });
    if (hot) tooltip(ui, [{ text: `${g.name} · friend online`, bold: true, color: '#4f95e0' }, { text: away ? `In ${MAPS[g.map]?.name ?? 'somewhere'}` : 'Here with you', size: 8, color: COLORS.muted }, { text: 'Click for profile · right-click for options', size: 7, color: COLORS.muted }]);
  });
  const off = friends.length;
  members.forEach((bot, i) => {
    i += off;
    // (Their HP shows out in the field too, where monsters fight back; nothing while they're away.)
    const hp = bot.away || bot.down ? 0 : bot.hp == null || !bot.stats ? 1 : bot.hp / bot.stats.maxHp;
    // (Away in town after a fall: the row says so, in place of their playstyle.)
    const away = bot.away && !run ? { label: 'In town', color: '#9c86b8' } : null;
    row(i + 1, bot.name, bot.level, bot.char.job, hp, !run && bot.id === lead,
      () => openProfile(state, { kind: 'bot', id: bot.id }), (ry) => openMenu(state, { kind: 'bot', id: bot.id, x: x + w + 2, y: ry }), rowHot(i + 1),
      run ? role(bot.id) : away ?? (bot.ai ? PLAYSTYLES[bot.ai.kind] : null));
    if (!run && bot.ai && rowHot(i + 1)) tooltip(ui, [{ text: `${bot.name} · ${PLAYSTYLES[bot.ai.kind].label}${bot.id === lead ? ' · leader' : ''}`, bold: true, color: PLAYSTYLES[bot.ai.kind].color }, { text: PLAYSTYLE_TEXT[bot.ai.kind], size: 8, color: COLORS.muted }, { text: bot.away ? 'Back in town after a fall; walking back soon' : `Here in ${map.name}`, size: 7.5 }, { text: 'Click for profile · right-click for options', size: 7, color: COLORS.muted }]);
  });
  if (more) {
    text(ctx, `+${more} more`, x + w / 2, y + 17 + shown * rowH + 7, { size: 6.5, bold: true, align: 'center', color: COLORS.muted });
    if (clicked(ui, x, y + 15 + shown * rowH, w, 11)) state.partyFold = true;
  }
  // Quick emotes for the party, under it (on a phone, the Emote button does this). The party
  // quest card stacks under whatever is last.
  const bar = touch ? 0 : partyEmoteBar(ui, state, world, x, y + h + 3, w);
  state.leftColumnY = y + h + (bar ? 3 + bar : 0) + 4;
}
