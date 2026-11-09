// Mochi racing's screens (world/mochi-race.js): the race board at the Race Stadium (pick a stage
// and one of your Mochi, and Race! or race with your party: net/mochi-race.js), a friend's invite
// to their party race (pick one of your Mochi and join), and, while a race is on, the race's own
// screen instead of the usual HUD: everyone's place along the course up top, the countdown, your
// Mochi's stamina and the Cheer button (or Up), and at the end the results and the prize.

import { STAGES as MOCHI_STAGES, HAIR_COLORS } from '../data/mochi-genes.js';
import { RACE_STAGES, RACE_RANKS, RANK_ORDER, CHEER, prizeOf, rankOpen, rankNeeds, medalKey, MEDAL_COLOR } from '../data/mochi-race.js';
import { startRace, leaveRace, standings, progressOf, COUNTDOWN } from '../world/mochi-race.js';
import { inviteParty, cancelLobby, startPartyRace, answerInvite, leaveWait, tickRaceInvites } from '../net/mochi-race.js';
import { partyFriends } from '../net/together.js';
import { online } from '../net/online.js';
import { drawMochiAnim } from '../render/mochi-anim.js';
import { VW, VH } from '../input.js';
import { COLORS, windowFrame, text, box, button, hover, clicked, tooltip, fit, bar, tabs, icon } from './kit.js';

const W = 300;
const H = 274;
const STAT_WORD = { run: 'Run', fly: 'Fly', power: 'Power', stamina: 'Stamina', swim: 'Swim' };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const NTH = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
// (Each Mochi's little portrait in the board's list keeps its own animation.)
const portraits = new WeakMap();
const portraitOf = (rec) => {
  if (!portraits.has(rec)) portraits.set(rec, { genes: rec, dir: 1, speed: 0, dist: 0, size: rec.stage === 'mochiko' ? 'baby' : 'grown', noIdle: true });
  return portraits.get(rec);
};
const nameOf = (r) => (r.you ? r.rec.name ?? `Your ${MOCHI_STAGES[r.rec.stage] ?? 'Mochi'}` : r.name);
// A Mochi's line in a list: its name (or, not named yet, who it is).
const lineOf = (rec) => (rec.name ? `${rec.name} · ${MOCHI_STAGES[rec.stage]}` : `${cap(rec.personality)} ${MOCHI_STAGES[rec.stage]}`);

// A medal: a little coin in its colour, or an empty ring where there isn't one yet.
function medalDot(ctx, x, y, medal, r = 3.2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (medal) {
    ctx.fillStyle = MEDAL_COLOR[medal];
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(x - r * 0.45, y - r * 0.5, r * 0.4, r * 0.4);
  } else {
    ctx.strokeStyle = '#e8d8e0';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ---------- The race board ----------
export function raceBoardWindow(ui, state, world) {
  const win = state.windows.race;
  const board = world.map.raceBoard;
  if (board == null || world.race || Math.abs(board - world.body.x) > 80) {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Race Board')) return;
  const { ctx } = ui;
  const x = win.x + 10;
  let y = win.y + 30;
  // The stage: a tab each, and its card.
  const ids = Object.keys(RACE_STAGES);
  win.stage ??= ids[0];
  win.rank ??= 'beginner';
  win.stage = ids[tabs(ui, x, y, ids.map((id) => RACE_STAGES[id].tab), ids.indexOf(win.stage), { w: 45, h: 14 })];
  y += 18;
  const char = world.char;
  const stage = RACE_STAGES[win.stage];
  // (A rank not open here: back to Beginner.)
  if (!rankOpen(char, win.stage, win.rank)) win.rank = 'beginner';
  const rank = RACE_RANKS[win.rank];
  box(ctx, x, y, W - 20, 40, { fill: '#fff4f8', edge: '#ffc2d4', r: 8, width: 1 });
  text(ctx, stage.name, x + 8, y + 12, { size: 8.5, bold: true });
  text(ctx, `${rank.name} · ${stage.stat ? `tests ${STAT_WORD[stage.stat]}` : 'tests everything'}`, x + W - 28, y + 12, { size: 6.5, align: 'right', color: '#d0507a' });
  text(ctx, fit(ctx, stage.about, W - 40, 6.5, false), x + 8, y + 23, { size: 6.5, color: COLORS.muted });
  text(ctx, `Prizes: ${[1, 2, 3].map((p) => `${NTH[p - 1]} ${prizeOf(win.stage, win.rank, p)} gold`).join(', ')}`, x + 8, y + 33, { size: 6, color: '#b08a2a' });
  y += 46;
  // The ranks: a button each (a lock on one not open yet), with the picked Mochi's medal there.
  const rw = (W - 20 - 8) / 3;
  RANK_ORDER.forEach((rk, i) => {
    const bx = x + i * (rw + 4);
    const open = rankOpen(char, win.stage, rk);
    if (button(ui, bx, y, rw, 16, RACE_RANKS[rk].name, { primary: win.rank === rk, enabled: open, size: 7.5 })) win.rank = rk;
    if (!open) icon(ctx, 'lock', bx + 9, y + 8, 6, COLORS.muted);
    else medalDot(ctx, bx + rw - 9, y + 8, win.pick?.medals?.[medalKey(win.stage, rk)]);
    if (hover(ui, bx, y, rw, 16)) tooltip(ui, open ? [{ text: `${RACE_RANKS[rk].name}`, bold: true }, { text: `1st: ${prizeOf(win.stage, rk, 1)} gold`, color: COLORS.muted }] : [{ text: 'Not open yet', bold: true, color: COLORS.bad }, { text: rankNeeds(char, win.stage, rk), color: COLORS.muted }]);
  });
  y += 22;
  // Your Mochi: pick who races.
  text(ctx, 'Who races?', x, y + 4, { size: 7, bold: true, color: COLORS.muted });
  // (The picked one's whole page: ui/mochi-info.js.)
  if (win.pick && button(ui, win.x + W - 46, y - 3, 36, 11, 'Info', { size: 6.5 })) {
    world.mochiInfo = win.pick;
    world.events.push({ type: 'mochiinfo' });
  }
  const list = (world.char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  if (!list.length) {
    text(ctx, 'Hatch a Mochi in your Garden first!', x, y + 20, { size: 7, color: COLORS.muted });
    return;
  }
  if (!list.includes(win.pick)) win.pick = list[0];
  const cw = (W - 24) / 2;
  list.slice(0, 8).forEach((rec, i) => {
    const cx = x + (i % 2) * (cw + 4);
    const cy = y + 9 + Math.floor(i / 2) * 26;
    const on = win.pick === rec;
    box(ctx, cx, cy, cw, 23, { fill: on ? '#ffe8f0' : '#ffffff', edge: on ? '#ff8fb0' : '#f0dce4', r: 6, width: on ? 1.5 : 1 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 1, cy + 1, 22, 21);
    ctx.clip();
    drawMochiAnim(ctx, portraitOf(rec), cx + 12, cy + 31, world.now);
    ctx.restore();
    text(ctx, fit(ctx, lineOf(rec), cw - 30, 7, true), cx + 26, cy + 10, { size: 7, bold: true });
    // (What this stage tests, and Stamina; the Grand course, its best two.)
    const shown = stage.stat ? [stage.stat, stage.stat === 'stamina' ? 'run' : 'stamina'] : Object.keys(STAT_WORD).sort((a, b) => rec.stats[b].points - rec.stats[a].points).slice(0, 2);
    text(ctx, shown.map((st) => `${STAT_WORD[st]} Lv ${rec.stats[st].level}`).join(' · '), cx + 26, cy + 19, { size: 6, color: COLORS.muted });
    // (Its medals on this stage: Beginner, Challenge, Master.)
    RANK_ORDER.forEach((rk, k) => medalDot(ctx, cx + cw - 22 + k * 7, cy + 7, rec.medals?.[medalKey(win.stage, rk)], 2.4));
    if (clicked(ui, cx, cy, cw, 23)) win.pick = rec;
  });
  const open = rankOpen(char, win.stage, win.rank);
  const L = world.raceLobby;
  const by = win.y + H - 26;
  if (L) {
    // Your party race: who's in (and with which Mochi), who's still deciding; Start or call it off.
    const names = L.invited.map((id) => {
      const g = online.ghosts.get(id);
      const j = L.joined[id];
      return `${g?.name ?? 'A friend'}${j ? ` (${MOCHI_STAGES[j.rec.stage] ?? 'Mochi'}) is in` : L.declined.includes(id) ? ' said no' : '...'}`;
    });
    text(ctx, fit(ctx, `${RACE_STAGES[L.stageId].name}: ${names.join(', ')}`, W - 24, 6.5, false), win.x + W / 2, by - 8, { size: 6.5, align: 'center', color: '#d0507a' });
    if (button(ui, win.x + W / 2 - 86, by, 84, 18, 'Start!', { primary: true, size: 8.5 })) {
      if (startPartyRace(world)) win.open = false;
    }
    if (button(ui, win.x + W / 2 + 2, by, 84, 18, 'Call it off', { size: 8 })) cancelLobby(world);
    return;
  }
  if (!open) text(ctx, rankNeeds(char, win.stage, win.rank), win.x + W / 2, by - 8, { size: 6.5, align: 'center', color: COLORS.bad });
  const party = partyFriends().length > 0;
  const rx = party ? win.x + W / 2 - 86 : win.x + W / 2 - 40;
  if (button(ui, rx, by, party ? 84 : 80, 18, 'Race!', { primary: open, enabled: open, size: 9 })) {
    if (startRace(world, win.pick, win.stage, win.rank)) win.open = false;
  }
  // (With your party online: race them, each with one of their own Mochi.)
  if (party && button(ui, win.x + W / 2 + 2, by, 84, 18, 'With party', { enabled: open, size: 8 })) {
    const why = inviteParty(world, win.pick, win.stage, win.rank);
    if (why) world.log(why, '#ffb3c6');
  }
  if (party && hover(ui, win.x + W / 2 + 2, by, 84, 18)) tooltip(ui, [{ text: 'Race with your party', bold: true }, { text: 'Everyone in your party online picks one of their Mochi; rivals fill the rest.', color: COLORS.muted }]);
}

// ---------- A friend's invite ----------
// A friend invites you to their party race: pick one of your Mochi and join (you're brought to the
// course when they start, and back here after), or no thanks. Once in, it says so until they start.
export function raceInviteWindow(ui, state, world) {
  const win = state.windows.raceinvite;
  tickRaceInvites();
  const inv = online.raceInvite;
  const wait = online.raceWait;
  if ((!inv && !wait) || world.race) {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, wait ? 70 : 196, 'Party Race')) return;
  const { ctx } = ui;
  const x = win.x + 10;
  let y = win.y + 32;
  if (wait) {
    text(ctx, `You're in! Waiting for ${wait.name} to start...`, x, y, { size: 8, bold: true });
    if (button(ui, win.x + W / 2 - 40, y + 10, 80, 16, 'Leave', { size: 7.5 })) leaveWait(world);
    return;
  }
  text(ctx, `${inv.name} invites you to race your Mochi!`, x, y, { size: 8.5, bold: true });
  text(ctx, `${RACE_STAGES[inv.stageId]?.name ?? 'A race'} (${RACE_RANKS[inv.rank]?.name ?? ''})`, x, y + 12, { size: 7, color: '#d0507a' });
  y += 20;
  const list = (world.char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  if (!list.length) text(ctx, "You haven't a Mochi to race yet: hatch one in your Garden!", x, y + 14, { size: 7, color: COLORS.muted });
  if (!list.includes(win.pick)) win.pick = list[0] ?? null;
  const cw = (W - 24) / 2;
  list.slice(0, 8).forEach((rec, i) => {
    const cx = x + (i % 2) * (cw + 4);
    const cy = y + 4 + Math.floor(i / 2) * 26;
    const on = win.pick === rec;
    box(ctx, cx, cy, cw, 23, { fill: on ? '#ffe8f0' : '#ffffff', edge: on ? '#ff8fb0' : '#f0dce4', r: 6, width: on ? 1.5 : 1 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 1, cy + 1, 22, 21);
    ctx.clip();
    drawMochiAnim(ctx, portraitOf(rec), cx + 12, cy + 31, world.now);
    ctx.restore();
    text(ctx, fit(ctx, lineOf(rec), cw - 30, 7, true), cx + 26, cy + 10, { size: 7, bold: true });
    const st = RACE_STAGES[inv.stageId]?.stat ?? 'run';
    text(ctx, `${STAT_WORD[st]} Lv ${rec.stats[st].level}`, cx + 26, cy + 19, { size: 6, color: COLORS.muted });
    if (clicked(ui, cx, cy, cw, 23)) win.pick = rec;
  });
  const by = win.y + 196 - 26;
  if (button(ui, win.x + W / 2 - 86, by, 84, 18, 'Join!', { primary: Boolean(win.pick), enabled: Boolean(win.pick), size: 8.5 })) answerInvite(world, win.pick);
  if (button(ui, win.x + W / 2 + 2, by, 84, 18, 'No thanks', { size: 8 })) answerInvite(world, null);
}

// ---------- The race itself ----------
export function raceHud(ui, state, world) {
  const R = world.race;
  const { ctx } = ui;
  const course = world.map.race;
  const you = R.racers[R.me];
  // Up top: the course as a line, everyone's head along it, yours with a heart; your place.
  const x0 = 150;
  const x1 = VW - 110;
  box(ctx, x0 - 12, 8, x1 - x0 + 30, 22, { fill: 'rgba(255,250,246,0.92)', edge: '#f0c8d8', r: 11, width: 1, plain: true });
  ctx.fillStyle = '#f0dce4';
  ctx.fillRect(x0, 18, x1 - x0, 3);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#3a3040' : '#ffffff';
    ctx.fillRect(x1 + 2, 12 + i * 2.5, 3, 2.5);
    ctx.fillStyle = i % 2 ? '#ffffff' : '#3a3040';
    ctx.fillRect(x1 + 5, 12 + i * 2.5, 3, 2.5);
  }
  for (const r of [...R.racers].reverse()) {
    const k = Math.max(0, Math.min(1, progressOf(course, r) / course.total));
    const hx = x0 + (x1 - x0) * k;
    const s = r.you ? 6 : 4.4;
    ctx.fillStyle = r.you ? '#ffffff' : 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(hx, 19.5, s + 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = HAIR_COLORS[r.rec.hairColor] ?? '#ffb3c8';
    ctx.beginPath();
    ctx.arc(hx, 19.5, s, 0, Math.PI * 2);
    ctx.fill();
    if (r.you) {
      ctx.strokeStyle = '#ff6f9a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  const order = standings(R, course);
  const place = order.indexOf(you) + 1;
  text(ctx, NTH[place - 1], x0 - 30, 24, { size: 11, bold: true, align: 'center', color: place === 1 ? '#e0a020' : '#d0507a' });
  text(ctx, RACE_STAGES[R.stageId].name, VW - 12, 44, { size: 7, align: 'right', color: '#8a6a9a' });
  // The countdown, and Go!
  const big = (s, color) => {
    text(ctx, s, VW / 2 + 2, VH * 0.38 + 2, { size: 30, bold: true, align: 'center', color: 'rgba(80,40,70,0.25)' });
    text(ctx, s, VW / 2, VH * 0.38, { size: 30, bold: true, align: 'center', color });
  };
  if (R.phase === 'ready') big(String(Math.max(1, Math.ceil(COUNTDOWN - R.t))), '#ff6f9a');
  else if (R.phase === 'run' && R.t < 0.8) big('Go!', '#ffb020');
  if (R.phase === 'run' && you.done != null && R.clock - you.done < 2) big(you.place === 1 ? 'Winner!' : 'Finish!', you.place === 1 ? '#ffb020' : '#ff6f9a');
  if (R.phase !== 'done') {
    // Your Mochi's stamina, and the Cheer button.
    const cx = VW / 2;
    const by = VH - 58;
    const tired = you.m.tired ?? 0;
    const resting = you.m.rest;
    bar(ctx, cx - 70, by - 16, 140, 9, 1 - tired, tired > 0.7 ? '#ff8a6a' : '#7fd07a', resting ? 'Catching its breath...' : 'Stamina', { size: 6 });
    const ready = R.phase === 'run' && you.done == null && R.clock >= you.cheerReady;
    if (button(ui, cx - 60, by, 120, 26, ready ? 'Cheer!  (Up)' : 'Cheering...', { primary: ready, enabled: ready, size: 10 })) R.cheerAsk = true;
    if (!ready && R.phase === 'run' && you.done == null) {
      const k = Math.max(0, Math.min(1, 1 - (you.cheerReady - R.clock) / CHEER.every));
      ctx.fillStyle = 'rgba(255,111,154,0.35)';
      ctx.fillRect(cx - 56, by + 21, 112 * k, 2);
    }
    if (hover(ui, cx - 60, by, 120, 26)) tooltip(ui, [{ text: 'Cheer it on', bold: true }, { text: 'A burst of speed, but it tires it a little. Every couple of seconds.', color: COLORS.muted }]);
    return;
  }
  // The results.
  const pw = 250;
  const ph = 214;
  const px = VW / 2 - pw / 2;
  const py = VH / 2 - ph / 2 - 6;
  box(ctx, px, py, pw, ph, { fill: '#fffaf6', edge: '#ffb3c8', r: 12, width: 2 });
  text(ctx, `${RACE_STAGES[R.stageId].name} (${RACE_RANKS[R.rank].name}): results`, VW / 2, py + 18, { size: 9.5, bold: true, align: 'center' });
  R.results.forEach((r, i) => {
    const ry = py + 30 + i * 20;
    if (r.you) box(ctx, px + 10, ry - 2, pw - 20, 18, { fill: '#ffe8f0', edge: '#ff8fb0', r: 6, width: 1, plain: true });
    text(ctx, NTH[i], px + 26, ry + 11, { size: 8, bold: true, align: 'center', color: i === 0 ? '#e0a020' : '#8a6a9a' });
    ctx.fillStyle = HAIR_COLORS[r.rec.hairColor] ?? '#ffb3c8';
    ctx.beginPath();
    ctx.arc(px + 48, ry + 8, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, fit(ctx, nameOf(r), 120, 8, r.you), px + 60, ry + 11, { size: 8, bold: r.you });
    if (r.you && R.medal) medalDot(ctx, px + 186, ry + 8, R.medal.medal, 4);
    text(ctx, r.done != null ? `${r.done.toFixed(1)}s` : 'not home', px + pw - 18, ry + 11, { size: 7, align: 'right', color: r.done != null ? COLORS.muted : COLORS.bad });
  });
  // The prize, the medal, and anything a win has opened.
  const medal = R.medal ? `  ·  ${cap(R.medal.medal)} medal${R.medal.best ? '!' : ' (it has a better one here)'}` : '';
  text(ctx, fit(ctx, `${R.prize ? `+${R.prize} gold!` : 'No prize this time.'}${medal}`, pw - 20, 8.5, true), VW / 2, py + 166, { size: 8.5, bold: true, align: 'center', color: R.prize ? '#c89a20' : COLORS.muted });
  const news = [R.dressWon ? `The ${R.dressWon}!` : null, R.starEgg ? 'A Star Egg!' : null, R.opened?.length ? `Now open: ${R.opened.join(', ')}` : null].filter(Boolean).join('  ·  ');
  if (news) text(ctx, fit(ctx, news, pw - 20, 7, true), VW / 2, py + 179, { size: 7, bold: true, align: 'center', color: '#d0507a' });
  if (button(ui, VW / 2 - 64, py + ph - 26, 128, 18, 'Back to the Stadium', { primary: true, size: 8 }) && R.t > 0.6) leaveRace(world);
}

