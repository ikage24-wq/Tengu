// The Online window (N, or the friends button). Friends: the players you've added (who's on and
// where, Invite to bring one to you, a friend asking you to hunt). Fame: the hall of fame. Room:
// host a room and share its six-digit code, or type a friend's code on the number pad to join
// theirs. In a room it lists everyone, where they are, and their level (tap a friend for their
// profile), with Party, Warp and Trade buttons, the invites waiting on you, and a way out.

import { COLORS, windowFrame, text, button, box, icon, sparkle, wrap, fit, hover, tooltip, clicked, tabs } from './kit.js';
import { askTrade, answerTrade, warpTo, warpBlocker, askParty, answerParty, partyBlocker, inParty, askJoinParty, answerJoinParty, joinPartyBlocker, leaderOf } from '../net/together.js';
import { openProfile } from './profile.js';
import { online, hostRoom, joinRoom, leaveRoom, ROOM_MAX } from '../net/online.js';
import { JOBS } from '../data/jobs.js';
import { MAPS } from '../data/maps.js';
import { buddiesOf, buddyOnline, callBuddy, answerHunt, removeBuddy, whereIs } from '../world/buddies.js';
import { partyMembers, PARTY_MAX } from '../world/party.js';
import { askToJoin, joinBlocker } from '../world/grouping.js';

const W = 262;
const H = 320;
const PER_PAGE = 7;

export function onlineWindow(ui, state, world) {
  const win = state.windows.online;
  if (!windowFrame(ui, win, W, H, 'Play with Friends')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const x = win.x + 12;
  let y = win.y + 26;
  win.code ??= '';
  // The tabs: your friends list, or a room with friends online.
  const TABS = ['friends', 'room'];
  win.tab = TABS.includes(win.tab) ? win.tab : 'friends';
  const t = tabs(ui, x, y, ['Friends', 'Room'], TABS.indexOf(win.tab), { w: 76, h: 15 });
  win.tab = TABS[t];
  y += 20;
  if (win.tab === 'friends') return friendsTab(ui, state, world, win, x, y);

  if (online.status === 'connecting') {
    const t = performance.now() / 1000;
    text(ctx, online.host ? 'Opening a room...' : `Looking for room ${online.code}...`, win.x + W / 2, y + 70, { size: 10, bold: true, align: 'center' });
    for (let i = 0; i < 5; i++) {
      const a = t * 3 + (i / 5) * Math.PI * 2;
      sparkle(ctx, win.x + W / 2 + Math.cos(a) * 18, y + 100 + Math.sin(a) * 10, 2.4, i % 2 ? th.main : '#ffe36b');
    }
    if (button(ui, win.x + W / 2 - 40, y + 140, 80, 18, 'Cancel', { size: 8.5 })) leaveRoom(world);
    return;
  }

  if (online.status === 'on') {
    box(ctx, x - 2, y, W - 20, 44, { fill: '#ffffff', edge: th.light, r: 10, width: 1.5 });
    text(ctx, 'Room code', x + 8, y + 13, { size: 8, bold: true, color: COLORS.muted });
    text(ctx, online.code.split('').join(' '), x + 8, y + 34, { size: 17, bold: true, color: th.dark });
    text(ctx, online.host ? 'You are the host' : 'Joined', x + W - 30, y + 13, { size: 7, bold: true, align: 'right', color: COLORS.muted });
    y += 52;
    text(ctx, `Players ${online.order.length || 1}/${ROOM_MAX}`, x, y + 8, { size: 8.5, bold: true });
    y += 14;
    const rows = [{ name: world.char.name, level: world.char.level, job: world.char.job, map: world.map.id, me: true }];
    for (const id of online.order) {
      const g = online.ghosts.get(id);
      if (g && id !== online.id) rows.push(g);
    }
    for (const r of rows) {
      box(ctx, x - 2, y, W - 20, 22, { fill: r.me ? '#fff3c4' : '#ffffff', edge: r.me ? COLORS.select : th.light, r: 8, width: 1 });
      const mate = r.me ? Boolean(online.party) : inParty(r.id);
      icon(ctx, mate ? 'heart' : 'user', x + 9, y + 11, 11, r.me ? COLORS.gold : mate ? '#ff6b9a' : '#3fae86');
      if (online.party && (r.me ? online.party.leader === online.id : online.party.leader === r.id)) icon(ctx, 'crown', x + 9, y + 2, 7, '#f0b53a');
      text(ctx, fit(ctx, `${r.name}${r.me ? ' (you)' : ''}`, 78, 8, true), x + 20, y + 10, { size: 8, bold: true });
      const where = MAPS[r.map]?.name ?? '';
      const same = r.map === world.map.id;
      text(ctx, fit(ctx, `Lv${r.level ?? 1} ${JOBS[r.job]?.short ?? JOBS[r.job]?.name ?? ''} · ${same ? 'here' : where}`, 96, 6.5, false), x + 20, y + 18.5, { size: 6.5, color: same ? COLORS.good : COLORS.muted });
      // Tap a friend (or yourself) for their profile.
      if (clicked(ui, x - 2, y, 118, 22)) openProfile(state, r.me ? { kind: 'self' } : { kind: 'ghost', id: r.id });
      if (hover(ui, x - 2, y, 118, 22)) tooltip(ui, [{ text: r.me ? 'Your profile' : `${r.name}'s profile`, size: 8 }]);
      // A friend: invite them to your party, warp to them, or trade with them.
      if (!r.me) {
        // In a party of their own (and you're free): Join asks its leader; otherwise Party invites.
        const theirs = !inParty(r.id) && !online.party && (leaderOf(r.id) !== r.id || online.rosters?.has(r.id));
        if (theirs) {
          const jw = joinPartyBlocker(r);
          if (button(ui, x + W - 128, y + 3, 34, 16, online.joinAsked === leaderOf(r.id) ? '...' : 'Join', { size: 7, enabled: !jw, theme: 'pink' })) askJoinParty(world, r.id);
          if (hover(ui, x + W - 128, y + 3, 34, 16)) tooltip(ui, [{ text: jw ?? `Ask to join ${online.ghosts.get(leaderOf(r.id))?.name ?? r.name}'s party`, size: 8 }]);
        } else if (!inParty(r.id)) {
          const pw = partyBlocker(r);
          if (button(ui, x + W - 128, y + 3, 34, 16, online.partyAsked === r.id ? '...' : 'Party', { size: 7, enabled: !pw, theme: 'pink' })) askParty(world, r.id);
          if (pw && hover(ui, x + W - 128, y + 3, 34, 16)) tooltip(ui, [{ text: pw, size: 8 }]);
        }
        const why = warpBlocker(world, r);
        if (!why) {
          if (button(ui, x + W - 92, y + 3, 36, 16, 'Warp', { size: 7, enabled: !why, primary: true, theme: 'sky' })) {
            const no = warpTo(world, r);
            if (no) world.log(no, '#ffb3c6');
            else win.open = false;
          }
          if (hover(ui, x + W - 92, y + 3, 36, 16)) tooltip(ui, [{ text: `Warp to ${r.name}`, bold: true }, { text: 'Free', size: 8, color: COLORS.muted }]);
        }
        if (!online.trade && button(ui, x + W - 54, y + 3, 34, 16, 'Trade', { size: 7, enabled: online.tradeAsked !== r.id })) askTrade(world, r.id);
      }
      y += 25;
    }
    // Someone invited you to their party.
    if (online.partyAsk && !online.party) {
      const name = online.ghosts.get(online.partyAsk)?.name ?? 'Someone';
      box(ctx, x - 2, y, W - 20, 22, { fill: '#ffe9f2', edge: '#ff8fc1', r: 8, width: 1.5 });
      icon(ctx, 'heart', x + 9, y + 11, 10, '#ff6b9a');
      text(ctx, fit(ctx, `${name} invited you to a party!`, W - 130, 8, true), x + 20, y + 14, { size: 8, bold: true });
      if (button(ui, x + W - 92, y + 3, 36, 16, 'Join', { size: 7.5, primary: true })) answerParty(world, true);
      if (button(ui, x + W - 54, y + 3, 34, 16, 'No', { size: 7.5 })) answerParty(world, false);
      y += 25;
    }
    // Someone asked to join your party.
    if (online.joinAsk) {
      const name = online.ghosts.get(online.joinAsk)?.name ?? 'Someone';
      box(ctx, x - 2, y, W - 20, 22, { fill: '#ffe9f2', edge: '#ff8fc1', r: 8, width: 1.5 });
      icon(ctx, 'friends', x + 9, y + 11, 10, '#ff6b9a');
      text(ctx, fit(ctx, `${name} asks to join your party!`, W - 130, 8, true), x + 20, y + 14, { size: 8, bold: true });
      if (button(ui, x + W - 92, y + 3, 36, 16, 'Let in', { size: 7.5, primary: true })) answerJoinParty(world, true);
      if (button(ui, x + W - 54, y + 3, 34, 16, 'No', { size: 7.5 })) answerJoinParty(world, false);
      y += 25;
    }
    // Someone asked to trade.
    if (online.tradeAsk && !online.trade) {
      const name = online.ghosts.get(online.tradeAsk)?.name ?? 'Someone';
      box(ctx, x - 2, y, W - 20, 22, { fill: '#fff3c4', edge: COLORS.select, r: 8, width: 1.5 });
      text(ctx, `${name} wants to trade!`, x + 6, y + 14, { size: 8, bold: true });
      if (button(ui, x + W - 92, y + 3, 36, 16, 'Yes', { size: 7.5, primary: true })) answerTrade(world, true);
      if (button(ui, x + W - 54, y + 3, 34, 16, 'No', { size: 7.5 })) answerTrade(world, false);
      y += 25;
    }
    const left = win.y + H - 26;
    if (button(ui, win.x + W / 2 - 46, left, 92, 19, 'Leave room', { size: 8.5, iconName: 'door' })) leaveRoom(world);
    return;
  }

  // Not in a room: host one, or join a friend's.
  wrap(ctx, 'Play with up to 3 friends. Everyone sees each other, fights the same monsters, and shares the EXP. Each of you gets your own loot.', x, y + 6, W - 24, { size: 7.5, color: COLORS.ink });
  y += 40;
  if (button(ui, x, y, W - 24, 22, 'Host a room', { primary: true, size: 9.5, iconName: 'crown' })) {
    win.code = '';
    hostRoom(world);
  }
  y += 30;
  text(ctx, 'Or join with a code', x, y + 8, { size: 8, bold: true, color: COLORS.muted });
  y += 13;
  // The six digits, typed on the keyboard or on the pad.
  for (const ch of ui.input.typed) {
    if (ch === '\b') win.code = win.code.slice(0, -1);
    else if (/\d/.test(ch) && win.code.length < 6) win.code += ch;
  }
  const cw = 20;
  const cx0 = x + (W - 24 - (6 * cw + 5 * 3)) / 2;
  for (let i = 0; i < 6; i++) {
    const on = i === win.code.length;
    box(ctx, cx0 + i * (cw + 3), y, cw, 22, { fill: '#ffffff', edge: on ? th.main : th.light, r: 6, width: on ? 2 : 1.2 });
    if (win.code[i]) text(ctx, win.code[i], cx0 + i * (cw + 3) + cw / 2, y + 16, { size: 12, bold: true, align: 'center', color: th.dark });
  }
  y += 28;
  // A phone-style pad: three keys across.
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '\b', '0', 'go'];
  const kw = 62;
  const kh = 19;
  const kx = x + (W - 24 - (3 * kw + 2 * 4)) / 2;
  keys.forEach((k, i) => {
    const bx = kx + (i % 3) * (kw + 4);
    const by = y + Math.floor(i / 3) * (kh + 3);
    const label = k === '\b' ? 'Del' : k === 'go' ? 'Join' : k;
    const ok = k !== 'go' || win.code.length === 6;
    if (button(ui, bx, by, kw, kh, label, { size: 9, enabled: ok, primary: k === 'go' })) {
      if (k === '\b') win.code = win.code.slice(0, -1);
      else if (k === 'go') joinRoom(world, win.code);
      else if (win.code.length < 6) win.code += k;
    }
  });
  if (ui.input.pressed?.has('Enter') && win.code.length === 6) joinRoom(world, win.code);
  if (online.error) text(ctx, online.error, win.x + W / 2, win.y + H - 10, { size: 7.5, bold: true, align: 'center', color: COLORS.bad });
}

// ---------- Friends ----------

const ago = (t) => {
  const m = Math.max(1, Math.round((Date.now() - (t ?? Date.now())) / 60000));
  return m < 60 ? `${m}m ago` : m < 60 * 24 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};
const jobOf = (snap) => snap.jobs?.[snap.jobs.length - 1] ?? 'novice';
const jobName = (job) => JOBS[job]?.short ?? JOBS[job]?.name ?? '';

function friendsTab(ui, state, world, win, x, y) {
  const { ctx } = ui;
  const th = ui.theme;
  const bots = world.bots;
  // A friend asking you to come hunt.
  const ask = bots?.huntAsk;
  if (ask) {
    box(ctx, x - 2, y, W - 20, 22, { fill: '#e6f3ff', edge: '#7ec8ff', r: 8, width: 1.5 });
    icon(ctx, 'friends', x + 9, y + 11, 10, '#3fae86');
    text(ctx, fit(ctx, `${ask.bot.name} wants to hunt!`, W - 130, 8, true), x + 20, y + 14, { size: 8, bold: true });
    if (button(ui, x + W - 92, y + 3, 36, 16, 'Join', { size: 7.5, primary: true })) answerHunt(bots, world, true);
    if (button(ui, x + W - 54, y + 3, 34, 16, 'No', { size: 7.5 })) answerHunt(bots, world, false);
    y += 26;
  }
  const list = buddiesOf(world.char);
  text(ctx, `Friends ${list.length}`, x, y + 8, { size: 8.5, bold: true });
  y += 13;
  if (!list.length) {
    wrap(ctx, 'Right-click a player and choose Add friend. Friends log in now and then, wave when they see you, and ask you along to hunt.', x, y + 8, W - 24, { size: 7.5, color: COLORS.muted });
    return;
  }
  // Online first, then whoever was on most recently.
  const rows = list.map((snap) => ({ snap, bot: buddyOnline(bots, snap.name) })).sort((a, b) => Number(Boolean(b.bot)) - Number(Boolean(a.bot)) || (b.snap.seen ?? 0) - (a.snap.seen ?? 0));
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  win.page = Math.min(win.page ?? 0, pages - 1);
  const full = partyMembers(bots).length >= PARTY_MAX;
  for (const { snap, bot } of rows.slice(win.page * PER_PAGE, (win.page + 1) * PER_PAGE)) {
    box(ctx, x - 2, y, W - 20, 22, { fill: '#ffffff', edge: th.light, r: 8, width: 1 });
    box(ctx, x + 5, y + 8, 6, 6, { fill: bot ? '#7ee081' : '#d4cbe8', edge: null, r: 3 });
    text(ctx, fit(ctx, snap.name, 100, 8, true), x + 16, y + 10, { size: 8, bold: true });
    const where = bot ? (bot.party ? 'in your party' : bot.map === world.map.id ? 'here' : whereIs(bot)) : `offline · ${ago(snap.seen)}`;
    text(ctx, fit(ctx, `Lv${bot?.char.level ?? snap.level} ${jobName(jobOf(snap))} · ${where}`, bot && !bot.party ? 104 : 130, 6.5, false), x + 16, y + 18.5, { size: 6.5, color: bot ? COLORS.good : COLORS.muted });
    if (bot && clicked(ui, x - 2, y, 150, 22)) openProfile(state, { kind: 'bot', id: bot.id });
    if (bot && !bot.party) {
      // Join: you go to them (they lead), if your level fits where they hunt.
      const jw = joinBlocker(world, bot);
      if (button(ui, x + W - 134, y + 3, 38, 16, bot.joinAsk ? '...' : 'Join', { size: 7, enabled: !jw, theme: 'sky' })) askToJoin(world, bot);
      if (hover(ui, x + W - 134, y + 3, 38, 16)) tooltip(ui, [{ text: `Join ${snap.name}'s party`, bold: true }, { text: jw ?? (bot.map === world.map.id ? 'They lead; you hunt together' : `They take you to ${whereIs(bot)}`), size: 8, color: COLORS.muted }]);
      if (button(ui, x + W - 92, y + 3, 40, 16, 'Invite', { size: 7, primary: true, enabled: !full, theme: 'pink' })) {
        const no = callBuddy(bots, world, bot);
        if (no) world.log(no, '#ffb3c6');
      }
      if (hover(ui, x + W - 92, y + 3, 40, 16)) tooltip(ui, [{ text: `Invite ${snap.name}`, bold: true }, { text: full ? 'Your party is full' : 'They come to you and join your party', size: 8, color: COLORS.muted }]);
    }
    if (button(ui, x + W - 48, y + 3, 24, 16, '', { size: 7, iconName: 'trash' })) {
      if (win.confirm === snap.name) {
        removeBuddy(world, bots, snap.name);
        win.confirm = null;
        world.log(`${snap.name} was removed from your friends.`, '#d4cbe8');
      } else win.confirm = snap.name;
    }
    if (hover(ui, x + W - 48, y + 3, 24, 16)) tooltip(ui, [{ text: win.confirm === snap.name ? 'Click again to remove' : 'Remove friend', size: 8 }]);
    y += 25;
  }
  if (pages > 1) {
    const py = win.y + H - 26;
    if (button(ui, win.x + W / 2 - 62, py, 30, 17, '<', { size: 9, enabled: win.page > 0 })) win.page -= 1;
    text(ctx, `${win.page + 1}/${pages}`, win.x + W / 2, py + 12, { size: 8, bold: true, align: 'center' });
    if (button(ui, win.x + W / 2 + 32, py, 30, 17, '>', { size: 9, enabled: win.page < pages - 1 })) win.page += 1;
  }
}

