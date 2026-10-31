// Party UI: the right-click menu on players (and yourself), and the party panel on the HUD with
// each member's level, job, and HP, plus a Leave button.

import { JOBS } from '../data/jobs.js';
import { ROLES } from '../data/dungeons.js';
import { invite, kick, leaveParty, partyMembers, inviteBlocker, PARTY_MAX, LEVEL_GAP, PLAYSTYLES } from '../world/party.js';
import { openProfile } from './profile.js';
import { COLORS, THEMES, text, box, hover, clicked, tooltip, icon, button } from './kit.js';
import { settings } from '../core/settings.js';
import { online } from '../net/online.js';
import { askParty, partyBlocker, inParty, kickFromParty, leaveOnlineParty, partyFriends, askTrade } from '../net/together.js';
import { MAPS } from '../data/maps.js';
import { askFriend, addBlocker, isBuddy, thanked } from '../world/buddies.js';
import { joinGuild, leaveGuild } from '../world/drama.js';
import { found, enterShow } from '../world/events.js';
import { helpOut } from '../world/lives.js';
import { joinGroup } from '../world/market.js';

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
    if (world.char.guild) items.push({ label: `Leave <${world.char.guild}>`, icon: 'door', run: () => leaveGuild(world) });
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
    }
    if (!online.trade) items.push({ label: 'Trade', icon: 'coin', run: () => askTrade(world, g.id) });
    return items;
  }
  const bot = world.bots?.list.find((b) => b.id === m.id);
  if (!bot) return items;
  items.push({ label: 'View profile', icon: 'user', run: () => openProfile(state, { kind: 'bot', id: bot.id, shop: Boolean(bot.shop) }) });
  if (bot.party) items.push({ label: 'Remove from party', icon: 'door', run: () => kick(world.bots, bot, world) });
  else {
    const why = inviteBlocker(world.bots, bot, world);
    const high = bot.level > world.char.level + LEVEL_GAP;
    items.push({ label: 'Invite to party', icon: 'heart', why: why ?? (high ? `Lv ${bot.level} is well above you, they'll likely say no` : null), enabled: !why, run: () => invite(world.bots, bot, world) });
  }
  if (bot.helped && !bot.thanked) items.push({ label: 'Say thanks', icon: 'heart', run: () => thanked(world.bots, world) });
  if (bot.guildOffer && !world.char.guild) items.push({ label: `Join <${bot.guildOffer}>`, icon: 'crown', run: () => joinGuild(world, bot) });
  if (bot.gm && world.bots.events?.gm?.bot === bot && !world.bots.events.gm.done) items.push({ label: 'Found you!', icon: 'star', run: () => found(world.bots.events, world.bots, world) });
  if (bot.showHost?.phase === 'call' && !bot.showHost.you) items.push({ label: 'Enter fashion show', icon: 'star', run: () => enterShow(world, bot) });
  if (bot.helpAsk && !bot.party) items.push({ label: 'Help them', icon: 'heart', run: () => helpOut(world.bots, world, bot) });
  if (bot.lfg && !bot.party) items.push({ label: 'Join their group', icon: 'shield', run: () => joinGroup(world.bots, world, bot) });
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
  rookie: 'Still learning: gets distracted and wanders off.',
  showoff: 'Flashy moves, flips, and taunts.',
};

// Leaving takes you out of both: your friends' party and the players you invited.
export function leaveAll(world) {
  if (online.party) leaveOnlineParty(world, partyMembers(world.bots).length > 0);
  leaveParty(world.bots, world);
}

export function drawPartyPanel(ui, state, world) {
  const members = partyMembers(world.bots);
  const friends = world.dungeon ? [] : partyFriends();
  if (!members.length && !friends.length) return;
  const { ctx } = ui;
  const th = THEMES.mint;
  const x = 6;
  const map = world.map;
  const top = settings.minimap ? 20 + Math.max(24, Math.round(map.height * (128 / map.width))) + 8 : 8;
  const y = top + (Object.keys(world.char.buffs).length ? 30 : 0);
  const w = 120;
  const h = 18 + (members.length + friends.length + 1) * 19;
  box(ctx, x, y, w, h, { fill: 'rgba(255,250,246,0.88)', edge: th.main, r: 8, width: 1.5 });
  box(ctx, x + 2, y + 2, w - 4, 12, { fill: th.main, edge: null, r: 6 });
  icon(ctx, 'heart', x + 9, y + 8, 8, '#ffffff');
  // In a dungeon the panel shows the group: everyone's role and real HP.
  const run = world.dungeon;
  text(ctx, run ? 'Dungeon group' : friends.length ? `Party ${members.length + friends.length + 1}` : `Party ${members.length + 1}/${PARTY_MAX + 1}`, x + 17, y + 11, { size: 7, bold: true, color: '#ffffff', outline: th.ink });
  if (!run && button(ui, x + w - 32, y + 2, 28, 12, 'Leave', { size: 6.5 })) leaveAll(world);
  const role = (id) => ROLES[run.roles[id] ?? 'dps'];
  const row = (i, name, level, job, hp, leader, onClick, onRight, hot, style = null) => {
    const ry = y + 17 + i * 19;
    box(ctx, x + 3, ry, w - 6, 17, { fill: hp <= 0 ? '#e8e0f0' : hot ? '#ffffff' : '#fffdfb', edge: th.light, r: 6, width: 1 });
    if (leader) icon(ctx, 'crown', x + 10, ry + 6, 7, '#f0b53a');
    else if (style) {
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.arc(x + 9, ry + 5.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, name, x + (leader || style ? 14 : 7), ry + 8, { size: 6.5, bold: true });
    text(ctx, `Lv${level} ${style ? style.label : JOBS[job].short ?? JOBS[job].name}`, x + w - 6, ry + 8, { size: 5.5, bold: Boolean(style), align: 'right', color: style ? style.color : COLORS.muted });
    box(ctx, x + 7, ry + 11, w - 14, 3, { fill: 'rgba(74,53,96,0.2)', edge: null, r: 1.5 });
    if (hp > 0) box(ctx, x + 7, ry + 11, Math.max(2, (w - 14) * hp), 3, { fill: hp < 0.3 ? '#ff6b8a' : run ? '#7ee081' : COLORS.hp, edge: null, r: 1.5 });
    if (clicked(ui, x + 3, ry, w - 6, 17)) onClick();
    if (ui.mouse.right && hover(ui, x + 3, ry, w - 6, 17)) {
      ui.used = true;
      ui.mouse.right = false;
      onRight(ry);
    }
  };
  const s = world.stats;
  const lead = !online.party || online.party.leader === online.id;
  row(0, world.char.name, world.char.level, world.char.job, world.dead ? 0 : world.char.hp / s.maxHp, !run && lead,
    () => openProfile(state, { kind: 'self' }), (ry) => openMenu(state, { kind: 'self', x: x + w + 2, y: ry }), hover(ui, x + 3, y + 17, w - 6, 17), run ? role('you') : null);
  // Friends online in your party: their HP, and where they are when it isn't here.
  friends.forEach((g, i) => {
    const ry = y + 17 + (i + 1) * 19;
    const hot = hover(ui, x + 3, ry, w - 6, 17);
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
    row(i + 1, bot.name, bot.level, bot.char.job, hp, false,
      () => openProfile(state, { kind: 'bot', id: bot.id }), (ry) => openMenu(state, { kind: 'bot', id: bot.id, x: x + w + 2, y: ry }), hover(ui, x + 3, y + 17 + (i + 1) * 19, w - 6, 17),
      run ? role(bot.id) : bot.ai ? PLAYSTYLES[bot.ai.kind] : null);
    if (!run && bot.ai && hover(ui, x + 3, y + 17 + (i + 1) * 19, w - 6, 17)) tooltip(ui, [{ text: `${bot.name} · ${PLAYSTYLES[bot.ai.kind].label}`, bold: true, color: PLAYSTYLES[bot.ai.kind].color }, { text: PLAYSTYLE_TEXT[bot.ai.kind], size: 8, color: COLORS.muted }, { text: 'Click for profile · right-click for options', size: 7, color: COLORS.muted }]);
  });
}
