// The Online window (N, or the friends button): host a room and share its six-digit code, or type
// a friend's code on the number pad to join theirs. In a room it lists everyone, where they are,
// and their level, with a way out.

import { COLORS, windowFrame, text, button, box, icon, sparkle, wrap } from './kit.js';
import { online, hostRoom, joinRoom, leaveRoom, ROOM_MAX } from '../net/online.js';
import { JOBS } from '../data/jobs.js';
import { MAPS } from '../data/maps.js';

const W = 236;
const H = 262;

export function onlineWindow(ui, state, world) {
  const win = state.windows.online;
  if (!windowFrame(ui, win, W, H, 'Play with Friends')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const x = win.x + 12;
  let y = win.y + 30;
  win.code ??= '';

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
      icon(ctx, 'user', x + 9, y + 11, 11, r.me ? COLORS.gold : '#4f95e0');
      text(ctx, `${r.name}${r.me ? ' (you)' : ''}`, x + 20, y + 10, { size: 8, bold: true });
      text(ctx, `Lv${r.level ?? 1} ${JOBS[r.job]?.name ?? ''}`, x + 20, y + 18.5, { size: 6.5, color: COLORS.muted });
      const where = MAPS[r.map]?.name ?? '';
      const same = r.map === world.map.id;
      text(ctx, where, x + W - 26, y + 14, { size: 6.5, bold: same, align: 'right', color: same ? COLORS.good : COLORS.muted });
      y += 25;
    }
    const left = win.y + H - 30;
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
