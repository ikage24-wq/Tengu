// Mochi racing's screens (world/mochi-race.js): the race board at the Race Stadium (pick a stage
// and one of your Mochi, and Race! or race with your party: net/mochi-race.js), a friend's invite
// to their party race (pick one of your Mochi and join), and, while a race is on, the race's own
// screen instead of the usual HUD: everyone's place along the course up top, the countdown, your
// Mochi's stamina and the Cheer button (or Up), and at the end the results and the prize.

import { STAGES as MOCHI_STAGES, HAIR_COLORS } from '../data/mochi-genes.js';
import { CANT_POINTS } from '../data/mochi-raise.js';
import { RACE_STAGES, RACE_RANKS, RANK_ORDER, CHEER, prizeOf, rankOpen, rankNeeds, medalKey, MEDAL_COLOR } from '../data/mochi-race.js';
import { startRace, leaveRace, standings, progressOf, COUNTDOWN, INTRO, introLen, PODIUM, SLOW_MO, cheerCost, canAffordCheer, cheerTiming, beatOf, forkAhead, FORK_NEAR } from '../world/mochi-race.js';
import { inviteParty, cancelLobby, startPartyRace, answerInvite, leaveWait, tickRaceInvites, askGhost } from '../net/mochi-race.js';
import { partyFriends } from '../net/together.js';
import { online } from '../net/online.js';
import { drawMochiAnim } from '../render/mochi-anim.js';
import { STAT_ORDER, statIcon, gradeBadge, portraitCard, portraitOf as kitPortrait, tag } from './mochi-kit.js';
import { VW, VH } from '../input.js';
import { COLORS, windowFrame, text, box, button, hover, clicked, tooltip, fit, wrap, bar, tabs, icon, roundRect, tape } from './kit.js';
import { stageCard } from './race-cards.js';

const W = 300;
const H = 292;
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
  if (board == null || world.race || world.gardenVisit || Math.abs(board - world.body.x) > 80) {
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
  // (New to racing: the Hatchling races first.)
  win.rank ??= Object.keys(world.char.raceWins ?? {}).length ? 'beginner' : 'hatchling';
  win.stage = ids[tabs(ui, x, y, ids.map((id) => RACE_STAGES[id].tab), ids.indexOf(win.stage), { w: 39, h: 14 })];
  y += 18;
  const char = world.char;
  const stage = RACE_STAGES[win.stage];
  // (A rank not open here: back to Beginner.)
  if (!rankOpen(char, win.stage, win.rank)) win.rank = 'beginner';
  const rank = RACE_RANKS[win.rank];
  box(ctx, x, y, W - 20, 58, { fill: '#fff4f8', edge: '#ffc2d4', r: 8, width: 1 });
  // A window on to the course itself (ui/race-cards.js), so the stage is known by its look and not
  // only by its name.
  stageCard(ctx, win.stage, x + 5, y + 5, 86, 48, world.now);
  const tx = x + 97;
  text(ctx, stage.name, tx, y + 14, { size: 8.5, bold: true });
  // What it tests (its stat's icon), and the prizes.
  if (stage.stat) statIcon(ctx, stage.stat, x + W - 30, y + 11.5, 5);
  else STAT_ORDER.forEach((st, k) => statIcon(ctx, st, x + W - 30 - (4 - k) * 9, y + 11.5, 4));
  text(ctx, `${rank.name} · ${stage.stat ? `tests ${STAT_WORD[stage.stat]}` : 'tests everything'}`, tx, y + 24, { size: 6.5, color: '#d0507a' });
  wrap(ctx, stage.about, tx, y + 34, W - 20 - 92 - 12, { size: 6.5, lineHeight: 8.4, color: COLORS.muted });
  icon(ctx, 'coin', tx + 4, y + 50, 7, '#e0a82a');
  text(ctx, [1, 2, 3].map((p) => `${NTH[p - 1]} ${prizeOf(win.stage, win.rank, p).toLocaleString()}`).join('  ·  '), tx + 12, y + 52.5, { size: 6.5, bold: true, color: '#b08a2a' });
  y += 64;
  // The ranks: a button each (a lock on one not open yet), with the picked Mochi's medal there.
  const rw = (W - 20 - (RANK_ORDER.length - 1) * 4) / RANK_ORDER.length;
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
    // (Its head and shoulders, the whole head in the frame.)
    ctx.translate(cx + 12, cy + 23);
    ctx.scale(0.82, 0.82);
    drawMochiAnim(ctx, portraitOf(rec), 0, 0, world.now);
    ctx.restore();
    text(ctx, fit(ctx, lineOf(rec), cw - 30, 7, true), cx + 26, cy + 10, { size: 7, bold: true });
    // (What this stage tests, and Stamina; the Grand course, its best two.)
    // (What this stage tests, and Stamina; the Grand course, its best two: icon, grade, level.)
    const shown = stage.stat ? [stage.stat, stage.stat === 'stamina' ? 'run' : 'stamina'] : Object.keys(STAT_WORD).sort((a, b) => rec.stats[b].points - rec.stats[a].points).slice(0, 2);
    shown.forEach((st, k) => {
      const sx = cx + 30 + k * 50;
      statIcon(ctx, st, sx, cy + 16.5, 3.6);
      gradeBadge(ctx, sx + 9, cy + 16.5, rec.stats[st].grade, 3.4);
      text(ctx, `Lv ${rec.stats[st].level}`, sx + 15, cy + 19, { size: 6, bold: true, color: COLORS.muted });
    });
    // (Too little for this course: a small warning mark.)
    if (tooLittle(rec, win.stage)) icon(ctx, 'skull', cx + cw - 9, cy + 17, 6, '#e0a0b0');
    // (Its medals on this stage: Beginner, Challenge, Master.)
    RANK_ORDER.forEach((rk, k) => medalDot(ctx, cx + cw - 8 - (RANK_ORDER.length - 1 - k) * 7, cy + 7, rec.medals?.[medalKey(win.stage, rk)], 2.4));
    if (clicked(ui, cx, cy, cw, 23)) win.pick = rec;
  });
  // ---- Best times here (course and rank): yours, friends' in your room, ghosts you've kept; race a
  // friend's ghost (asked for over the room the first time, kept after).
  const rows = Math.ceil(Math.min(list.length, 8) / 2);
  let ty = y + 9 + rows * 26 + 6;
  const key = medalKey(win.stage, win.rank);
  const times = [];
  if (char.raceBests?.[key]) times.push({ name: 'You', time: char.raceBests[key].time, you: true });
  for (const g of online.status === 'on' ? online.ghosts.values() : []) if (g.bests?.[key]) times.push({ name: g.name, time: g.bests[key], id: g.id });
  for (const [k, v] of Object.entries(char.ghosts ?? {})) if (k.endsWith(`|${key}`) && !times.some((t) => t.name === v.name)) times.push({ name: v.name, time: v.best.time, kept: true });
  times.sort((a, b) => a.time - b.time);
  const by0 = win.y + H - 40;
  if (times.length && ty + 22 < by0) {
    text(ctx, 'Best times', x, ty + 4, { size: 7, bold: true, color: COLORS.muted });
    ty += 8;
    for (const [n, t] of times.slice(0, Math.floor((by0 - ty) / 15)).entries()) {
      const kept = char.ghosts?.[`${t.name}|${key}`];
      box(ctx, x, ty, W - 20, 13, { fill: t.you ? '#fff0f6' : '#ffffff', edge: '#f2dce6', r: 6, width: 1, plain: true });
      text(ctx, `${n + 1}. ${t.name}`, x + 6, ty + 9.4, { size: 6.8, bold: t.you });
      text(ctx, `${t.time.toFixed(1)}s`, x + W - 20 - 64, ty + 9.4, { size: 6.8, bold: true, align: 'right', color: '#c89a20' });
      if (!t.you && button(ui, x + W - 20 - 56, ty + 1, 54, 11, kept ? 'Race ghost' : 'Get ghost', { size: 6, primary: Boolean(kept), enabled: Boolean(kept) || Boolean(t.id) })) {
        if (kept) {
          if (startRace(world, win.pick, win.stage, win.rank, { ghost: kept, ...(world.map.garden ? { back: { map: world.map.id, x: world.body.x } } : {}) })) win.open = false;
        } else if (t.id && askGhost(world, t.id, key)) world.log(`Asking ${t.name} for their ghost...`, '#cfe8ff');
      }
      ty += 15;
    }
  }
  // ---- No times here yet: how the picked Mochi measures up against this rank's rivals, a bar for
  // each stat the course tests (the rivals' range shaded, yours marked), so you can tell if it's ready.
  if (!times.length && win.pick && ty + 34 < by0) {
    const rec = win.pick;
    const [lo, hi] = RACE_RANKS[win.rank].rivals;
    const stats = stage.stat ? [stage.stat, stage.stat === 'stamina' ? 'run' : 'stamina'] : STAT_ORDER;
    text(ctx, fit(ctx, `${rec.name ?? 'Your Mochi'} against the ${RACE_RANKS[win.rank].name} rivals`, W - 20, 7, true), x, ty + 4, { size: 7, bold: true, color: COLORS.muted });
    ty += 9;
    for (const st of stats) {
      if (ty + 12 > by0) break;
      const have = rec.stats[st]?.points ?? 0;
      const top = Math.max(hi * 1.4, have * 1.1, 10);
      const bx = x + 52;
      const bw = W - 20 - 52 - 34;
      statIcon(ctx, st, x + 5, ty + 5, 3.4);
      text(ctx, STAT_WORD[st], x + 12, ty + 7.5, { size: 6.8, bold: true });
      box(ctx, bx, ty + 2, bw, 7, { fill: '#fff4f8', edge: '#f2dce6', r: 3.5, width: 1, plain: true });
      box(ctx, bx + (lo / top) * bw, ty + 2, ((hi - lo) / top) * bw, 7, { fill: '#ffd8e6', edge: null, r: 3.5, plain: true });
      const mx = bx + Math.min(1, have / top) * bw;
      box(ctx, mx - 2.5, ty, 5, 11, { fill: have >= hi ? '#62c072' : have >= lo ? '#ffb347' : '#e0659f', edge: '#ffffff', r: 2.5, width: 1, plain: true });
      text(ctx, `${Math.round(have)}`, x + W - 20 - 2, ty + 8, { size: 6.8, bold: true, align: 'right', color: have >= hi ? '#3f9a50' : have >= lo ? '#c07a10' : COLORS.bad });
      ty += 13;
    }
    if (ty + 9 < by0) text(ctx, 'Pink: where the rivals are. Green: ahead of them all.', x, ty + 5, { size: 6, color: COLORS.muted });
  }
  const open = rankOpen(char, win.stage, win.rank);
  const L = world.raceLobby;
  const by = win.y + H - 26;
  if (L) {
    // Your party race: who's in (and with which Mochi), who's still deciding; Start or call it off.
    const names = L.invited.map((id) => {
      const g = online.ghosts.get(id);
      const j = L.joined[id];
      return `${g?.name ?? 'A friend'}${j ? ` is in with ${j.rec.name ?? MOCHI_STAGES[j.rec.stage] ?? 'their Mochi'}` : L.declined.includes(id) ? ' said no' : '...'}`;
    });
    text(ctx, fit(ctx, `${RACE_STAGES[L.stageId].name}: ${names.join(', ')}`, W - 24, 6.5, false), win.x + W / 2, by - 8, { size: 6.5, align: 'center', color: '#d0507a' });
    if (button(ui, win.x + W / 2 - 86, by, 84, 18, 'Start!', { primary: true, size: 8.5 })) {
      if (startPartyRace(world)) win.open = false;
    }
    if (button(ui, win.x + W / 2 + 2, by, 84, 18, 'Call it off', { size: 8 })) cancelLobby(world);
    return;
  }
  const little = open ? tooLittle(win.pick, win.stage) : null;
  if (!open) text(ctx, rankNeeds(char, win.stage, win.rank), win.x + W / 2, by - 8, { size: 6.5, align: 'center', color: COLORS.bad });
  else if (little) text(ctx, fit(ctx, little, W - 20, 6.5, true), win.x + W / 2, by - 8, { size: 6.5, bold: true, align: 'center', color: '#d0507a' });
  const party = partyFriends().length > 0;
  const rx = party ? win.x + W / 2 - 86 : win.x + W / 2 - 40;
  if (button(ui, rx, by, party ? 84 : 80, 18, 'Race!', { primary: open, enabled: open, size: 9 })) {
    // (Entered from the Garden, at Kinako's counter: back to the Garden afterwards.)
    const back = world.map.garden ? { back: { map: world.map.id, x: world.body.x } } : {};
    if (startRace(world, win.pick, win.stage, win.rank, back)) win.open = false;
  }
  // (With your party online: race them, each with one of their own Mochi.)
  if (party && button(ui, win.x + W / 2 + 2, by, 84, 18, 'With party', { enabled: open, size: 8 })) {
    const why = inviteParty(world, win.pick, win.stage, win.rank);
    if (why) world.log(why, '#ffb3c6');
  }
  if (party && hover(ui, win.x + W / 2 + 2, by, 84, 18)) tooltip(ui, [{ text: 'Race with your party', bold: true }, { text: 'Everyone in your party online picks one of their Mochi; rivals fill the rest.', color: COLORS.muted }]);
}

// A gentle word when the Mochi picked can't yet do what this course asks (it can still race, but
// it won't get far): crawling instead of walking, flailing in water, flopping off the glide. Null
// when it's ready.
const LITTLE = [
  ['run', 'Too little to race: it only crawls. Cook it Kinako Mochi to get it walking!'],
  ['swim', "It can't swim yet, so it'll flail in the lake. Taiyaki helps!"],
  ['fly', "It can't fly yet, so it'll drop off the launch. Sakura Mochi helps!"],
];
const COURSE_NEEDS = { sprint: ['run'], hills: ['run'], climb: ['run'], swim: ['run', 'swim'], glide: ['run', 'fly'], grand: ['run', 'swim', 'fly'], tour: ['run', 'swim', 'fly'] };
export function tooLittle(rec, stageId) {
  if (!rec) return null;
  const needs = COURSE_NEEDS[stageId] ?? ['run'];
  return LITTLE.find(([st]) => needs.includes(st) && (rec.stats?.[st]?.points ?? 0) < CANT_POINTS[st])?.[1] ?? null;
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
  // The cutscenes (the opening, the podium, the finish in slow motion) between black bars.
  const il = introLen(R);
  const intro = R.phase === 'ready' && R.t < il;
  const podium = R.phase === 'done' && R.t < PODIUM.secs;
  const slow = R.slowLeft > 0 ? Math.min(1, (SLOW_MO.secs - R.slowLeft) / 0.25, R.slowLeft / 0.3) : 0;
  letterbox(ctx, intro ? Math.min(1, R.t / 0.4, (il - R.t) / 0.3) : podium ? Math.min(1, R.t / 0.4, (PODIUM.secs - R.t) / 0.3) : slow * 0.7);
  if (intro) {
    introCards(ctx, R, il, world.now);
    return;
  }
  if (podium) {
    podiumTitle(ctx, R);
    return;
  }
  // Up top: the course as a track (quarter marks, the chequered finish), everyone's head along it,
  // yours bigger with a heart over it; your place on a rosette (gold, silver, bronze), the course's
  // name under it.
  const x0 = 168;
  const x1 = VW - 112;
  // (Not over the results at the end: the race's over.)
  ctx.save();
  if (R.phase === 'done') ctx.globalAlpha = 0;
  box(ctx, x0 - 14, 8, x1 - x0 + 34, 24, { fill: 'rgba(255,250,246,0.94)', edge: '#f0c8d8', r: 12, width: 1.2, plain: true });
  const lead = Math.max(...R.racers.map((r) => Math.max(0, Math.min(1, progressOf(course, r) / course.total))));
  // (A festival course, Sakura Sprint's: the track is a blossom branch that blooms as the race goes.)
  // (Lily Lake's: a little stream with lily pads along it, their lotus opening as the leader passes.)
  const track = world.map.look?.bar;
  const festive = track === 'branch' || track === 'lily' || track === 'maple' || track === 'snow' || track === 'dango' || track === 'lantern' || track === 'scroll';
  if (track === 'branch') blossomBranch(ctx, x0, x1, 20.5, lead, world.now);
  else if (track === 'maple') mapleBranch(ctx, x0, x1, 20.5, lead, world.now);
  else if (track === 'snow') snowString(ctx, x0, x1, 20.5, lead, world.now);
  else if (track === 'dango') dangoSkewer(ctx, x0, x1, 20.5, lead, world.now);
  else if (track === 'lantern') lanternString(ctx, x0, x1, 20.5, lead, world.now);
  else if (track === 'scroll') royalScroll(ctx, x0, x1, 20.5, lead, world.now);
  else if (track === 'lily') lilyStream(ctx, x0, x1, 20.5, lead, world.now);
  else {
    ctx.fillStyle = '#f4e2ea';
    roundRect(ctx, x0, 18, x1 - x0, 5, 2.5);
    ctx.fill();
    ctx.fillStyle = '#ffd0e0';
    roundRect(ctx, x0, 18, (x1 - x0) * lead, 5, 2.5);
    ctx.fill();
  }
  // (A long course in parts: a little plate with each part's icon where it begins; otherwise quarter marks.)
  if (festive) {
    // (Its quarter marks are the branch's three open blossoms.)
  } else if (course.parts) {
    for (const p of course.parts.slice(1)) {
      const px = x0 + (x1 - x0) * partFrac(course, p.from);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, 20.5, 5.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, 20.5, 4.4, 0, Math.PI * 2);
      ctx.fill();
      icon(ctx, p.icon, px, 20.5, 5.6, '#ffffff');
    }
  } else {
    for (const q of [0.25, 0.5, 0.75]) {
      ctx.fillStyle = '#e8cfdc';
      ctx.fillRect(x0 + (x1 - x0) * q - 0.5, 15, 1, 11);
    }
  }
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#3a3040' : '#ffffff';
    ctx.fillRect(x1 + 2, 13 + i * 2.5, 3, 2.5);
    ctx.fillStyle = i % 2 ? '#ffffff' : '#3a3040';
    ctx.fillRect(x1 + 5, 13 + i * 2.5, 3, 2.5);
  }
  const order = standings(R, course);
  for (const r of [...R.racers].sort((a, b) => (a.you ? 1 : 0) - (b.you ? 1 : 0))) {
    const k = Math.max(0, Math.min(1, progressOf(course, r) / course.total));
    const hx = x0 + (x1 - x0) * k;
    const sz = r.you ? 6.5 : 4.6;
    ctx.fillStyle = 'rgba(70,40,90,0.18)';
    ctx.beginPath();
    ctx.arc(hx + 0.5, 21.5, sz + 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hx, 20.5, sz + 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = HAIR_COLORS[r.rec.hairColor] ?? '#ffb3c8';
    ctx.beginPath();
    ctx.arc(hx, 20.5, sz, 0, Math.PI * 2);
    ctx.fill();
    trackFace(ctx, hx, 20.5, sz, R, r, order);
    if (r.you) icon(ctx, 'heart', hx, 9, 7, '#ff6f9a');
  }
  const place = order.indexOf(you) + 1;
  const PLACE_C = ['#ffcc3a', '#c8ccd8', '#e09a5a'];
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x0 - 34, 20, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PLACE_C[place - 1] ?? '#f6dce8';
  ctx.beginPath();
  ctx.arc(x0 - 34, 20, 12.5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, NTH[place - 1], x0 - 34, 24, { size: 9.5, bold: true, align: 'center', color: place <= 3 ? '#ffffff' : '#d0507a', outline: place <= 3 ? '#a8763a' : null });
  text(ctx, RACE_STAGES[R.stageId].name, VW - 12, 46, { size: 7, bold: true, align: 'right', color: '#a8467a' });
  ctx.restore();
  // The countdown, and Go!
  const big = (s, color) => {
    text(ctx, s, VW / 2 + 2, VH * 0.38 + 2, { size: 30, bold: true, align: 'center', color: 'rgba(80,40,70,0.25)' });
    text(ctx, s, VW / 2, VH * 0.38, { size: 30, bold: true, align: 'center', color });
  };
  if (R.phase === 'ready') {
    const left = il + COUNTDOWN - R.t;
    const n = Math.max(1, Math.ceil(left));
    pop(ctx, String(n), n - left, ['#ff6f9a', '#f0a03a', '#5a9ae0'][n - 1] ?? '#ff6f9a', false, true);
  } else if (R.phase === 'run' && R.t < 0.9) pop(ctx, 'GO!', R.t / 0.9, '#ffb020', true);
  // A fork coming up: which way yours will go, the other way, and Down to switch.
  const fk = R.phase === 'run' && you.done == null ? forkAhead(course, you) : null;
  if (fk && fk.at - you.x < FORK_NEAR && fk.at > you.x) {
    const leg = course.legs[fk.leg];
    const alt = Boolean(you.alt?.[fk.leg]);
    const ways = [cap(leg.name ?? leg.kind), cap(leg.alt.name ?? leg.alt.kind)];
    const fw = 228;
    const fx = VW / 2 - fw / 2;
    const fy = 52;
    const pulse = R.forkFlip != null && R.clock - R.forkFlip < 0.25 ? 1 - (R.clock - R.forkFlip) / 0.25 : 0;
    ctx.fillStyle = 'rgba(70,40,90,0.16)';
    roundRect(ctx, fx + 1.5, fy + 2.5, fw, 30, 12);
    ctx.fill();
    box(ctx, fx, fy - pulse * 2, fw, 30, { fill: 'rgba(255,250,246,0.96)', edge: '#ffb3cf', r: 12, width: 1.4, plain: true });
    text(ctx, 'Fork ahead!', fx + 10, fy + 12, { size: 7.5, bold: true, color: '#d0507a' });
    text(ctx, 'Down: switch', fx + 10, fy + 23, { size: 6, color: COLORS.muted });
    ways.forEach((w, i) => {
      const on = (i === 1) === alt;
      const wx = fx + 78 + i * 74;
      ctx.fillStyle = on ? '#ff8fb8' : '#f6e8ee';
      roundRect(ctx, wx, fy + 7, 70, 16, 8);
      ctx.fill();
      icon(ctx, i === 0 ? (leg.kind === 'swim' ? 'drop' : 'gust') : leg.alt.kind === 'swim' ? 'drop' : 'gust', wx + 10, fy + 15, 8, on ? '#ffffff' : '#c8a8b8');
      text(ctx, fit(ctx, w, 52, 6.5, true), wx + 40, fy + 17.6, { size: 6.5, bold: true, align: 'center', color: on ? '#ffffff' : '#a88898' });
    });
  }
  // A long course: as yours comes into each new part, its name sweeps across on a ribbon in its colour.
  if (course.parts && R.phase === 'run') {
    let k = 0;
    course.parts.forEach((p, i) => {
      if (you.x >= p.from) k = i;
    });
    if (R.myPart == null) R.myPart = k;
    if (k > R.myPart) {
      R.myPart = k;
      R.partAt = R.clock;
    }
    if (R.partAt != null && R.clock - R.partAt < 2.4) {
      const p = course.parts[R.myPart];
      banner(ctx, `${R.myPart + 1} · ${p.name}`, (R.clock - R.partAt) / 2.4, p.color);
    }
  }
  // The leader into the last fifth: the final stretch.
  if (R.phase === 'run') {
    if (R.finalAt == null && progressOf(course, order[0]) >= course.total * 0.8) R.finalAt = R.clock;
    if (R.finalAt != null && R.clock - R.finalAt < 2) banner(ctx, 'Final Stretch!', (R.clock - R.finalAt) / 2);
  }
  // The winner crossing the line: a flash.
  if (R.slowLeft > SLOW_MO.secs - 0.3) {
    ctx.fillStyle = `rgba(255,255,255,${(0.55 * (R.slowLeft - (SLOW_MO.secs - 0.3))) / 0.3})`;
    ctx.fillRect(0, 0, VW, VH);
  }
  if (R.phase === 'run' && you.done != null && R.clock - you.done < 2) big(you.place === 1 ? 'Winner!' : 'Finish!', you.place === 1 ? '#ffb020' : '#ff6f9a');
  if (R.phase !== 'done') {
    // Your Mochi's stamina, and the Cheer button, on one card: its little photo, a leaf and the
    // stamina pill, and Cheer with a heart that refills.
    const cw = 236;
    const cx = VW / 2 - cw / 2;
    const cy = VH - 62;
    const tired = you.m.tired ?? 0;
    ctx.fillStyle = 'rgba(70,40,90,0.18)';
    roundRect(ctx, cx + 1.5, cy + 3, cw, 46, 14);
    ctx.fill();
    box(ctx, cx, cy, cw, 46, { fill: 'rgba(255,250,246,0.96)', edge: '#ffb3cf', r: 14, width: 1.6, plain: true });
    // (Its face feels the race: set at the start, smug in front, worried behind, worn out, or
    // sparkling when you cheer it on.)
    const face = R.phase !== 'run' ? 'race_ready' : R.clock < you.cheerUntil ? 'race_cheered' : (you.m.tired ?? 0) > 0.7 ? 'race_tired'
      : place === 1 && R.clock > 2 ? 'race_smug' : place > Math.ceil(R.racers.length / 2) && R.clock > 2 ? 'race_worried' : 'race_ready';
    const pm = kitPortrait(you.rec);
    pm.feel = null;
    if (pm.action?.name !== face) pm.action = { name: face, t0: null, hold: 999 };
    portraitCard(ctx, you.rec, cx + 5, cy + 4, 38, 38, world.now, { scale: 1.25, drop: 20, ribbon: false });
    const sx = cx + 48;
    const sw = 86;
    const low = tired > 0.7;
    const sc = low ? '#ff8a6a' : '#62c072';
    ctx.fillStyle = sc;
    ctx.beginPath();
    ctx.arc(sx + 5, cy + 14, 5.5, 0, Math.PI * 2);
    ctx.fill();
    icon(ctx, 'leaf', sx + 5, cy + 14, 7, '#ffffff');
    text(ctx, low ? 'Tiring!' : 'Stamina', sx + 14, cy + 16.5, { size: 7, bold: true, color: low ? '#e0604a' : '#4a9a5a' });
    ctx.fillStyle = '#f0e4ea';
    roundRect(ctx, sx, cy + 23, sw, 9, 4.5);
    ctx.fill();
    ctx.fillStyle = sc;
    roundRect(ctx, sx, cy + 23, Math.max(6, sw * (1 - tired)), 9, 4.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(sx + 3, cy + 24.5, Math.max(0, sw * (1 - tired) - 6), 1.5);
    // (What the next cheer would spend: the end of the bar, pale and pulsing, while it can cheer.)
    const cost = cheerCost(you.rec);
    const afford = canAffordCheer(you);
    if (R.phase === 'run' && you.done == null && afford) {
      const full = sw * (1 - tired);
      const cw2 = Math.min(full, sw * cost);
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(R.clock * 6);
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, sx + full - cw2, cy + 23, cw2, 9, 4.5);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ff9ec0';
      ctx.fillRect(sx + full - cw2, cy + 23, 1, 9);
    }
    const ready = R.phase === 'run' && you.done == null && R.clock >= you.cheerReady && afford;
    const broke = R.phase === 'run' && you.done == null && !afford;
    // (On the beat: the moment it's full, it glows gold, "Now!", for a Perfect cheer. Pressed while
    // it's refilling, "Too soon!", a shake, and the gold mark at the end of its bar goes grey: the
    // next can only be Good.)
    const now = ready && cheerTiming(R, you) === 'perfect';
    const soonK = you.soonAt != null && R.phase === 'run' ? (R.clock - you.soonAt) / 0.6 : 1;
    const soon = soonK < 1 && !ready;
    const bx = cx + cw - 96;
    const label = now ? 'Now!  (Up)' : ready ? 'Cheer!  (Up)' : broke ? 'Too tired' : soon ? 'Too soon!' : R.clock < you.cheerUntil ? 'Cheering...' : 'Get set...';
    const shake = soon ? Math.sin(soonK * Math.PI * 6) * 2.2 * (1 - soonK) : 0;
    if (now) {
      // (A soft gold halo breathing round it.)
      const k = Math.min(1, beatOf(R, you) / CHEER.window);
      ctx.globalAlpha = 0.5 * (1 - k * 0.6) * (0.75 + 0.25 * Math.sin(R.clock * 18));
      ctx.fillStyle = '#ffd75e';
      roundRect(ctx, bx - 3 - k * 2, cy + 5 - k * 2, 94 + k * 4, 36 + k * 4, 18 + k * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (button(ui, bx + shake, cy + 8, 88, 30, label, { primary: ready, theme: now ? 'gold' : null, enabled: ready, size: 8.5, iconName: 'heart' })) R.cheerAsk = true;
    // (How the last cheer landed, rising off the button: Perfect! in gold, Good! in pink.)
    const landK = you.cheerAt != null && R.phase === 'run' ? (R.clock - you.cheerAt) / 0.9 : 1;
    if (landK < 1 && you.cheerKind) {
      const perfect = you.cheerKind === 'perfect';
      const e = 1 - (1 - landK) ** 3;
      ctx.globalAlpha = landK < 0.7 ? 1 : 1 - (landK - 0.7) / 0.3;
      const size = (perfect ? 11 : 9) * (landK < 0.15 ? 0.7 + (landK / 0.15) * 0.3 : 1);
      const ty = cy + 2 - e * 16;
      text(ctx, perfect ? 'Perfect!' : 'Good!', bx + 45, ty + 1, { size, bold: true, align: 'center', color: 'rgba(80,40,70,0.3)' });
      text(ctx, perfect ? 'Perfect!' : 'Good!', bx + 44, ty, { size, bold: true, align: 'center', color: perfect ? '#f0a020' : '#ff6f9a' });
      ctx.globalAlpha = 1;
    }
    if (R.phase === 'run' && you.done == null) {
      const k = ready ? 1 : Math.max(0, Math.min(1, 1 - (you.cheerReady - R.clock) / CHEER.every));
      ctx.fillStyle = '#f6dce8';
      roundRect(ctx, bx + 8, cy + 40, 72, 3, 1.5);
      ctx.fill();
      ctx.fillStyle = now ? '#ffc94f' : ready ? '#ff6f9a' : '#ffb3cf';
      roundRect(ctx, bx + 8, cy + 40, 72 * k, 3, 1.5);
      ctx.fill();
      // (Full and waiting: the next beat sweeping in, a gold glow growing along the bar toward it.)
      if (ready && !now && !you.fumbled) {
        const b = beatOf(R, you) / CHEER.every;
        ctx.globalAlpha = 0.6 * b * b;
        ctx.fillStyle = '#ffd75e';
        roundRect(ctx, bx + 8 + 72 * (1 - b), cy + 40, 72 * b, 3, 1.5);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // (Where the beat lands: a little gold mark at the end, grey once a press came too soon.)
      ctx.fillStyle = you.fumbled ? '#cdbfca' : '#f0a020';
      roundRect(ctx, bx + 78, cy + 38.5, 3, 6, 1.5);
      ctx.fill();
    }
    if (hover(ui, bx, cy + 8, 88, 30)) tooltip(ui, [{ text: 'Cheer it on  (Up)', bold: true }, { text: `A burst of speed, paid for with ${Math.round(cost * 100)}% of its stamina (less the better its Stamina). The more it's spent, the slower it runs, till it gets its breath back.`, color: COLORS.muted }, { text: 'Press the moment the bar fills, when it glows gold, for a Perfect cheer: faster, longer and cheaper. Pressing too soon spoils the next one.', color: COLORS.muted }]);
    return;
  }
  // The results: your Mochi's photo with its place on a big rosette, the standings with gold, silver
  // and bronze stickers, the prize, and anything a win has opened.
  const pw = 330;
  const ph = 222;
  const px = VW / 2 - pw / 2;
  const py = VH / 2 - ph / 2 - 6;
  box(ctx, px, py, pw, ph, { fill: '#fffaf6', edge: '#ffb3c8', r: 12, width: 2 });
  text(ctx, `${RACE_STAGES[R.stageId].name} · ${RACE_RANKS[R.rank].name}`, VW / 2, py + 18, { size: 10, bold: true, align: 'center', color: '#a8467a' });
  const mine = R.racers[R.me];
  const myPlace = R.results.indexOf(mine) + 1;
  // (Its photo shows how it feels about it: happy tears for a win, a cheer for the podium, a pout
  // for last, and a little wave otherwise.)
  const feel = myPlace === 1 ? 'race_joy' : myPlace <= 3 ? 'cheer' : myPlace === R.results.length ? 'sulk' : 'wave';
  const fm = kitPortrait(mine.rec);
  if (fm.feel !== feel) {
    fm.feel = feel;
    fm.action = { name: feel, t0: null, hold: 999 };
  }
  portraitCard(ctx, mine.rec, px + 12, py + 28, 96, 110, world.now, { scale: 2.2 });
  const PLACE = ['#ffcc3a', '#c8ccd8', '#e09a5a'];
  const rc = PLACE[myPlace - 1] ?? '#e6d6de';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px + 96, py + 128, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rc;
  ctx.beginPath();
  ctx.arc(px + 96, py + 128, 12.5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, NTH[myPlace - 1] ?? '', px + 96, py + 132, { size: 8.5, bold: true, align: 'center', color: myPlace <= 3 ? '#ffffff' : '#8a6a9a', outline: myPlace <= 3 ? '#a8763a' : null });
  text(ctx, fit(ctx, nameOf(mine), 96, 8, true), px + 60, py + 152, { size: 8, bold: true, align: 'center' });
  const lx = px + 120;
  const lw = pw - 132;
  R.results.forEach((r, i) => {
    const ry = py + 30 + i * 19;
    if (r.you) box(ctx, lx - 4, ry - 2, lw + 4, 17, { fill: '#ffe8f0', edge: '#ff8fb0', r: 6, width: 1, plain: true });
    ctx.fillStyle = PLACE[i] ?? '#f0e4ea';
    ctx.beginPath();
    ctx.arc(lx + 7, ry + 6.5, 6.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, String(i + 1), lx + 7, ry + 9.5, { size: 7.5, bold: true, align: 'center', color: i < 3 ? '#ffffff' : '#8a6a9a' });
    ctx.fillStyle = HAIR_COLORS[r.rec.hairColor] ?? '#ffb3c8';
    ctx.beginPath();
    ctx.arc(lx + 22, ry + 6.5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    trackFace(ctx, lx + 22, ry + 6.5, 5.5, R, r, R.results);
    text(ctx, fit(ctx, nameOf(r), lw - 90, 7.5, r.you), lx + 31, ry + 9.5, { size: 7.5, bold: r.you });
    if (r.you && R.medal) medalDot(ctx, lx + lw - 50, ry + 6.5, R.medal.medal, 4);
    // (Home: its time. Still out at the end: the time it was on course for, with a little ~.)
    const time = r.done ?? r.est;
    text(ctx, time != null ? `${r.done != null ? '' : '~'}${time.toFixed(1)}s` : '', lx + lw, ry + 9.5, { size: 7, align: 'right', color: COLORS.muted });
  });
  // (How you cheered: how many, and how many on the beat.)
  if (mine.cheers) {
    const py2 = py + 30 + R.results.length * 19 + 6;
    icon(ctx, 'heart', lx + 5, py2, 7, '#ff8fb0');
    text(ctx, `${mine.cheers} cheer${mine.cheers === 1 ? '' : 's'}${mine.perfects ? `, ${mine.perfects} Perfect!` : ''}`, lx + 13, py2 + 2.5, { size: 7, bold: Boolean(mine.perfects), color: mine.perfects ? '#e09a20' : COLORS.muted });
  }
  // The prize and the medal.
  const by = py + 166;
  icon(ctx, 'coin', px + 20, by, 9, R.prize ? '#e0a82a' : '#c8b8c8');
  const medal = R.medal ? `  ·  ${cap(R.medal.medal)} medal${R.medal.best ? '!' : ' (it has a better one here)'}` : '';
  text(ctx, fit(ctx, `${R.prize ? `+${R.prize.toLocaleString()} gold!` : 'No prize this time.'}${medal}`, pw - 50, 8.5, true), px + 30, by + 3, { size: 8.5, bold: true, color: R.prize ? '#c89a20' : COLORS.muted });
  // Anything new: a costume, a Star Egg, a rank opened.
  const news = [R.dressWon ? `The ${R.dressWon}!` : null, R.starEgg ? 'A Star Egg!' : null, ...(R.opened ?? []).map((o) => `${o} open`)].filter(Boolean);
  let nx = px + 14;
  for (const n of news.slice(0, 3)) nx += tag(ctx, n, nx, by + 17, '#ff8fb8') + 4;
  if (button(ui, VW / 2 - 66, py + ph - 26, 132, 19, R.back?.map === 'garden' ? 'Back to the Garden' : 'Back to the Stadium', { primary: true, size: 8, iconName: 'door' }) && R.t > PODIUM.secs + 0.6) leaveRace(world);
}

// The track as a blossom branch (a festival course's): a gently bending bough with little twigs,
// open blossoms at the quarters, and buds opening into flowers along it as far as the leader has
// got, each swaying a touch; behind the leader the branch is still bare.
function blossomBranch(ctx, x0, x1, y, lead, time) {
  const bend = (x) => y + Math.sin((x - x0) * 0.045) * 1.2;
  ctx.lineCap = 'round';
  for (const [c, w, dy] of [['#8a5a60', 3.4, 0.5], ['#b08088', 1.4, -0.6]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let x = x0 - 6; x <= x1 + 1; x += 3) (x === x0 - 6 ? ctx.moveTo(x, bend(x) + dy) : ctx.lineTo(x, bend(x) + dy));
    ctx.stroke();
  }
  // Twigs.
  ctx.strokeStyle = '#8a5a60';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 9; k++) {
    const x = x0 + ((k + 0.5) / 9) * (x1 - x0);
    const up = k % 2 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x, bend(x));
    ctx.lineTo(x + 4, bend(x) - up * 4);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  const flower = (fx, fy, r, open, c) => {
    if (open <= 0.05) {
      ctx.fillStyle = '#e8a0b4';
      ctx.beginPath();
      ctx.arc(fx, fy, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.fillStyle = c;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * r * 0.62 * open, fy + Math.sin(a) * r * 0.62 * open, r * (0.35 + 0.2 * open), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  };
  // Buds along it, opening behind the leader (each eases open as the leader goes past it).
  for (let k = 0; k < 22; k++) {
    const u = (k + 0.5) / 22;
    const x = x0 + u * (x1 - x0);
    const sway = Math.sin(time * 2 + k) * 0.5;
    const open = Math.max(0, Math.min(1, (lead - u) / 0.06));
    flower(x + sway, bend(x) + (k % 2 ? -2.6 : 2.6), 2.4, open, k % 3 ? '#ffb8cc' : '#ffd2de');
  }
  // The quarters: bigger blossoms, open from the start.
  for (const q of [0.25, 0.5, 0.75]) {
    const x = x0 + (x1 - x0) * q;
    flower(x, bend(x) - 3.4, 3.6, 1, '#ffffff');
  }
}

// The Mochi Grand Tour's track: the royal proclamation, a parchment scroll on a gold roller. It
// unrolls as the leader goes, the written line running out behind it; at the quarters, a red wax
// seal stamped with a crown.
function royalScroll(ctx, x0, x1, y, lead, time) {
  const W = x1 - x0;
  const open = Math.max(0.02, Math.min(1, lead));
  // The parchment that has been unrolled, with its curled top and bottom edge.
  ctx.fillStyle = '#e8d8b4';
  roundRect(ctx, x0 - 4, y - 5.4, W * open + 6, 10.8, 1.6);
  ctx.fill();
  ctx.fillStyle = '#f6ecd4';
  roundRect(ctx, x0 - 4, y - 4.6, W * open + 6, 9.2, 1.4);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,164,118,0.5)';
  ctx.fillRect(x0 - 4, y - 5.4, W * open + 6, 1);
  ctx.fillRect(x0 - 4, y + 4.4, W * open + 6, 1);
  // The writing on it: short strokes of ink, and a crown at its head.
  crownMark2(ctx, x0 + 2, y, 3, '#b8203a');
  ctx.fillStyle = 'rgba(90,70,60,0.55)';
  for (let k = 0; k < 40; k++) {
    const lx = x0 + 8 + k * 7.4;
    if (lx > x0 + W * open - 10) break;
    ctx.fillRect(lx, y - 2.2, 4.4 + (k % 3), 0.9);
    ctx.fillRect(lx, y + 1, 3.2 + ((k + 1) % 3), 0.9);
  }
  // The roller the rest is still wound on, moving along as it opens.
  const rx = x0 + W * open + 4;
  ctx.fillStyle = '#c89a30';
  roundRect(ctx, rx - 3, y - 8, 6, 16, 3);
  ctx.fill();
  ctx.fillStyle = '#ffd75e';
  roundRect(ctx, rx - 2.2, y - 7.4, 4.4, 14.8, 2.2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(rx - 1.6, y - 6, 1.2, 12);
  // The quarters: a red wax seal with a crown pressed into it.
  for (const q of [0.25, 0.5, 0.75]) {
    const x = x0 + W * q;
    if (x > rx - 4) continue;
    ctx.fillStyle = '#a81f36';
    ctx.beginPath();
    ctx.arc(x, y, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8304a';
    ctx.beginPath();
    ctx.arc(x - 0.3, y - 0.3, 4, 0, Math.PI * 2);
    ctx.fill();
    crownMark2(ctx, x, y, 2.4, '#8a1628');
  }
  void time;
}
// A little crown for the bar: three points over a band.
function crownMark2(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x - r, y + r * 0.5);
  ctx.lineTo(x - r, y - r * 0.6);
  ctx.lineTo(x - r * 0.5, y - r * 0.1);
  ctx.lineTo(x, y - r * 0.8);
  ctx.lineTo(x + r * 0.5, y - r * 0.1);
  ctx.lineTo(x + r, y - r * 0.6);
  ctx.lineTo(x + r, y + r * 0.5);
  ctx.closePath();
  ctx.fill();
}

// The Grand Mochi Course's track: a string of paper lanterns, dark until the leader reaches them,
// then each lighting up warm (red and white by turns) and swaying a little; at the quarters, bigger
// gold-rimmed lanterns, already lit.
function lanternString(ctx, x0, x1, y, lead, time) {
  const sagAt = (x) => y - 3 + Math.sin(((x - x0) / (x1 - x0)) * Math.PI * 6) * 0.8;
  ctx.strokeStyle = '#5a4050';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = x0 - 6; x <= x1 + 1; x += 3) (x === x0 - 6 ? ctx.moveTo(x, sagAt(x)) : ctx.lineTo(x, sagAt(x)));
  ctx.stroke();
  const lamp = (lx, r, lit, white, gold, sway) => {
    const top = sagAt(lx);
    const cx = lx + sway;
    const cy = top + r + 1.4;
    if (lit > 0) {
      ctx.globalAlpha = lit * 0.45;
      ctx.fillStyle = white ? '#ffe6b0' : '#ffb090';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#3a2a30';
    ctx.fillRect(cx - r * 0.5, top, r, 1.4);
    ctx.fillRect(cx - r * 0.5, cy + r - 0.4, r, 1.4);
    ctx.fillStyle = '#d8ccd0';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.8, r, 0, 0, Math.PI * 2);
    ctx.fill();
    if (lit > 0) {
      ctx.globalAlpha = lit;
      ctx.fillStyle = gold ? '#ffd75e' : white ? '#fff4e0' : '#f05a6a';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.8, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(cx - r * 0.45, cy - r * 0.5, 0.9, r * 0.8);
      ctx.globalAlpha = 1;
    }
    if (gold) {
      ctx.fillStyle = '#c89a30';
      ctx.fillRect(cx - r * 0.5, top, r, 1.4);
      ctx.fillRect(cx - r * 0.5, cy + r - 0.4, r, 1.4);
    }
  };
  for (let k = 0; k < 18; k++) {
    const u = (k + 0.5) / 18;
    if ([0.25, 0.5, 0.75].some((q) => Math.abs(q - u) < 0.03)) continue;
    const lit = Math.max(0, Math.min(1, (lead - u) / 0.05));
    lamp(x0 + u * (x1 - x0), 2.6, lit, k % 2 === 1, false, Math.sin(time * 1.8 + k) * 0.5);
  }
  for (const q of [0.25, 0.5, 0.75]) lamp(x0 + (x1 - x0) * q, 3.8, 1, false, true, Math.sin(time * 1.4 + q * 9) * 0.4);
}

// Long Hill Run's track: a long bamboo skewer threaded with dango, plain rice-white until the leader
// reaches them, then each warming into its colour (pink, white, green in turn) with a shine and a
// little bob; at the quarters, bigger dango glazed in sweet soy sauce.
function dangoSkewer(ctx, x0, x1, y, lead, time) {
  const dot = (cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.lineCap = 'round';
  for (const [c, w, dy] of [['#c8945a', 2, 0], ['#ecc490', 0.7, -0.5]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0 - 6, y + dy);
    ctx.lineTo(x1 + 1, y + dy);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  const COL = ['#ffb7cf', '#fffaf4', '#c4e8a8'];
  const RIM = ['#e890aa', '#e2d2c6', '#8cc070'];
  for (let k = 0; k < 18; k++) {
    const u = (k + 0.5) / 18;
    if ([0.25, 0.5, 0.75].some((q) => Math.abs(q - u) < 0.03)) continue;
    const x = x0 + u * (x1 - x0);
    const lit = Math.max(0, Math.min(1, (lead - u) / 0.05));
    const by = y + Math.sin(time * 3 + k) * 0.35 * lit;
    const r = 2.6 + 0.4 * lit;
    ctx.fillStyle = '#e4d8d0';
    dot(x, by, r + 0.8);
    ctx.fillStyle = '#f6f0ea';
    dot(x - 0.3, by - 0.3, r);
    if (lit > 0) {
      ctx.globalAlpha = lit;
      ctx.fillStyle = RIM[k % 3];
      dot(x, by, r + 0.8);
      ctx.fillStyle = COL[k % 3];
      dot(x - 0.3, by - 0.3, r);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      dot(x - 1.1, by - 1.2, 0.8);
      ctx.globalAlpha = 1;
    }
  }
  for (const q of [0.25, 0.5, 0.75]) {
    const x = x0 + (x1 - x0) * q;
    ctx.fillStyle = '#d8b090';
    dot(x, y, 4.6);
    ctx.fillStyle = '#fff4e4';
    dot(x - 0.3, y - 0.3, 3.9);
    ctx.fillStyle = '#c8784a';
    ctx.beginPath();
    ctx.ellipse(x - 0.3, y - 0.6, 3.9, 3, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - 0.3, y - 0.6, 3.9, 1.4, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,236,210,0.9)';
    dot(x - 1.6, y - 2.2, 0.9);
  }
}

// Cloud Glide's track: an icy ribbon strung with snowflakes, each lighting up white and twinkling
// as the leader passes it; at the quarters, bigger flakes with a gold heart.
function snowString(ctx, x0, x1, y, lead, time) {
  ctx.fillStyle = '#dceaff';
  roundRect(ctx, x0 - 4, y - 2.4, x1 - x0 + 6, 4.8, 2.4);
  ctx.fill();
  ctx.fillStyle = '#b4d4f6';
  roundRect(ctx, x0 - 4, y - 2.4, Math.max(4.8, (x1 - x0) * lead + 4), 4.8, 2.4);
  ctx.fill();
  const flake = (fx, fy, r, lit, rot) => {
    if (lit) {
      ctx.fillStyle = 'rgba(191,224,255,0.6)';
      ctx.beginPath();
      ctx.arc(fx, fy, r + 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = lit ? '#ffffff' : '#b8c8e0';
    ctx.lineWidth = lit ? 1.3 : 1;
    ctx.lineCap = 'round';
    for (let q = 0; q < 3; q++) {
      const a = (q / 3) * Math.PI + rot;
      ctx.beginPath();
      ctx.moveTo(fx - Math.cos(a) * r, fy - Math.sin(a) * r);
      ctx.lineTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  };
  for (let k = 0; k < 18; k++) {
    const u = (k + 0.5) / 18;
    if ([0.25, 0.5, 0.75].some((q) => Math.abs(q - u) < 0.03)) continue;
    const x = x0 + u * (x1 - x0);
    const lit = lead > u;
    flake(x, y + (k % 2 ? -0.5 : 0.5), lit ? 2.6 + Math.sin(time * 3 + k) * 0.3 : 2.2, lit, lit ? time * 0.6 + k : k);
  }
  for (const q of [0.25, 0.5, 0.75]) {
    const x = x0 + (x1 - x0) * q;
    flake(x, y, 3.8, true, time * 0.4 + q * 5);
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Mortar Cliff's track: a maple branch, its leaves green until the leader goes past and then
// turning, gold to orange to red; at the quarters, bigger leaves already red.
function mapleBranch(ctx, x0, x1, y, lead, time) {
  const bend = (x) => y + Math.sin((x - x0) * 0.045) * 1.2;
  ctx.lineCap = 'round';
  for (const [c, w, dy] of [['#7a5440', 3.4, 0.5], ['#a8806a', 1.4, -0.6]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let x = x0 - 6; x <= x1 + 1; x += 3) (x === x0 - 6 ? ctx.moveTo(x, bend(x) + dy) : ctx.lineTo(x, bend(x) + dy));
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  const leaf = (fx, fy, r, c, rot) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    const D = (Math.PI * 2) / 5;
    for (let l = 0; l < 5; l++) {
      const a = rot - Math.PI / 2 + l * D;
      for (const [da, k] of [[-0.5, 0.36], [-0.27, 0.72], [0, 1], [0.27, 0.72]]) {
        const px = fx + Math.cos(a + da * D) * r * k;
        const py = fy + Math.sin(a + da * D) * r * k;
        if (l === 0 && da === -0.5) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  };
  const TURNED = ['#ffc85a', '#ff9a4a', '#f25a4a', '#ffb04a', '#e8603a'];
  for (let k = 0; k < 22; k++) {
    const u = (k + 0.5) / 22;
    const x = x0 + u * (x1 - x0);
    const fy = bend(x) + (k % 2 ? -2.8 : 2.8);
    const rot = Math.sin(time * 2 + k) * 0.15 + (k % 2 ? -0.3 : 0.3);
    const turned = Math.max(0, Math.min(1, (lead - u) / 0.06));
    leaf(x, fy, 2.8, '#a8cc70', rot);
    if (turned > 0) {
      ctx.globalAlpha = turned;
      leaf(x, fy, 2.8, TURNED[k % TURNED.length], rot);
      ctx.globalAlpha = 1;
    }
  }
  for (const q of [0.25, 0.5, 0.75]) {
    const x = x0 + (x1 - x0) * q;
    leaf(x, bend(x) - 3, 4.2, '#e8503a', Math.sin(time * 1.4 + q * 9) * 0.12);
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(x, bend(x) - 3, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Lily Lake's track: a ribbon of water (deeper blue where the leader has already been), ripples
// drifting along it, lily pads floating on it, each sprouting a pink lotus that eases open as the
// leader goes past it; at the quarters, bigger pads already in bloom.
function lilyStream(ctx, x0, x1, y, lead, time) {
  ctx.fillStyle = '#c4ecf6';
  roundRect(ctx, x0 - 4, y - 3.4, x1 - x0 + 6, 6.8, 3.4);
  ctx.fill();
  ctx.fillStyle = '#8fd4ec';
  roundRect(ctx, x0 - 4, y - 3.4, Math.max(6.8, (x1 - x0) * lead + 4), 6.8, 3.4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x0, y - 2.6, x1 - x0, 0.8);
  // Ripples drifting downstream.
  for (let k = 0; k < 16; k++) {
    const u = ((k / 16 + time * 0.02) % 1);
    const x = x0 + u * (x1 - x0);
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
    ctx.fillRect(x, y + (k % 2 ? 0.6 : -0.8), 3.4, 0.7);
  }
  ctx.globalAlpha = 1;
  const pad = (px, py, r, flip) => {
    ctx.fillStyle = '#4fa86a';
    ctx.beginPath();
    ctx.ellipse(px, py + 0.5, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6cc47e';
    ctx.beginPath();
    const n = flip ? Math.PI - 0.5 : 0.5;
    ctx.moveTo(px, py);
    ctx.ellipse(px, py, r, r * 0.42, 0, n + 0.32, n + Math.PI * 2 - 0.32);
    ctx.closePath();
    ctx.fill();
  };
  const lotus = (px, py, s, open) => {
    if (open <= 0.05) {
      ctx.fillStyle = '#ff9fbc';
      ctx.beginPath();
      ctx.moveTo(px, py - 4 * s);
      ctx.quadraticCurveTo(px + 2 * s, py - 1.4 * s, px, py);
      ctx.quadraticCurveTo(px - 2 * s, py - 1.4 * s, px, py - 4 * s);
      ctx.fill();
      return;
    }
    for (const [a, c] of [[-1, '#ffd6e4'], [1, '#ffd6e4'], [-0.45, '#ffb8cc'], [0.45, '#ffb8cc'], [0, '#ffe6ef']]) {
      const ang = a * (0.25 + 0.75 * open);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(1.6 * s, -2.4 * s, 0, -4.4 * s);
      ctx.quadraticCurveTo(-1.6 * s, -2.4 * s, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(px, py - 1.6 * s, 0.9 * s, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let k = 0; k < 14; k++) {
    const u = (k + 0.5) / 14;
    if ([0.25, 0.5, 0.75].some((q) => Math.abs(q - u) < 0.03)) continue;
    const x = x0 + u * (x1 - x0) + Math.sin(time * 0.9 + k * 2) * 0.6;
    const py = y + (k % 2 ? 1.6 : -0.6);
    pad(x, py, 3.2, k % 2);
    lotus(x, py, 0.62, Math.max(0, Math.min(1, (lead - u) / 0.06)));
  }
  for (const q of [0.25, 0.5, 0.75]) {
    const x = x0 + (x1 - x0) * q;
    pad(x, y + 0.6, 4.6, 0);
    lotus(x, y + 0.4, 0.95, 1);
  }
}

// A racer's little face on the track: two eyes and a mouth on its hair colour, by how it's doing:
// ^^ and a grin in front, - - and an open pant worn out, a worried wobble at the back.
function trackFace(ctx, x, y, r0, R, r, order) {
  const front = order[0] === r && R.clock > 2;
  const tired = (r.m.tired ?? 0) > 0.7;
  const back = order.indexOf(r) >= order.length - 2 && R.clock > 2;
  const e = r0 * 0.36;
  ctx.strokeStyle = '#3a2838';
  ctx.fillStyle = '#3a2838';
  ctx.lineWidth = Math.max(0.8, r0 * 0.16);
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    const ex = x + sx * e;
    const ey = y - r0 * 0.05;
    ctx.beginPath();
    if (front) ctx.arc(ex, ey + r0 * 0.1, r0 * 0.17, Math.PI * 1.15, Math.PI * 1.85);
    else if (tired) {
      ctx.moveTo(ex - r0 * 0.16, ey);
      ctx.lineTo(ex + r0 * 0.16, ey);
    } else ctx.arc(ex, ey, r0 * 0.12, 0, Math.PI * 2);
    if (front || tired) ctx.stroke();
    else ctx.fill();
  }
  ctx.beginPath();
  if (tired) ctx.ellipse(x, y + r0 * 0.42, r0 * 0.14, r0 * 0.12, 0, 0, Math.PI * 2);
  else if (back) {
    ctx.moveTo(x - r0 * 0.22, y + r0 * 0.46);
    ctx.quadraticCurveTo(x - r0 * 0.1, y + r0 * 0.34, x, y + r0 * 0.46);
    ctx.quadraticCurveTo(x + r0 * 0.1, y + r0 * 0.58, x + r0 * 0.22, y + r0 * 0.46);
  } else ctx.arc(x, y + r0 * 0.28, r0 * (front ? 0.24 : 0.17), Math.PI * 0.15, Math.PI * 0.85);
  if (tired) ctx.fill();
  else ctx.stroke();
  // (Blush.)
  ctx.fillStyle = 'rgba(255,120,150,0.45)';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + sx * r0 * 0.62, y + r0 * 0.3, r0 * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

// How far along a course (0 to 1) world x is, counting the walls climbed before it.
function partFrac(course, x) {
  const up = course.legs.filter((l) => l.kind === 'climb' && l.x < x).reduce((sum, l) => sum + (l.from - l.to), 0);
  return Math.max(0, Math.min(1, (x - course.start + up) / course.total));
}

// ---------- The race's cutscenes ----------
// Black bars top and bottom, sliding in (`k` 0 to 1).
function letterbox(ctx, k) {
  if (k <= 0) return;
  const h = Math.round(26 * k * k * (3 - 2 * k));
  ctx.fillStyle = '#20141e';
  ctx.fillRect(0, 0, VW, h);
  ctx.fillRect(0, VH - h, VW, h);
}
// The opening: the course's name as the camera sweeps along it, then each racer's card in turn.
const STAT_NAME = { run: 'Run', swim: 'Swim', power: 'Power', fly: 'Fly', stamina: 'Stamina' };
function introCards(ctx, R, il, time) {
  const stage = RACE_STAGES[R.stageId];
  if (R.t < INTRO.sweep) {
    const k = Math.min(1, R.t / 0.5, (INTRO.sweep - R.t) / 0.35);
    ctx.save();
    ctx.globalAlpha = Math.max(0, k);
    const y = VH * 0.7 + (1 - k) * 8;
    text(ctx, stage.name, VW / 2 + 1.5, y + 1.5, { size: 22, bold: true, align: 'center', color: 'rgba(60,30,60,0.35)' });
    text(ctx, stage.name, VW / 2, y, { size: 22, bold: true, align: 'center', color: '#ffffff', outline: '#ff6f9a' });
    text(ctx, `${RACE_RANKS[R.rank].name}  ·  ${R.racers.length} racers`, VW / 2, y + 16, { size: 9, bold: true, align: 'center', color: '#ffe0ec' });
    ctx.restore();
  } else lineup(ctx, R, il, time);
  tag(ctx, 'Up: skip', VW - 14, 38, 'rgba(32,20,30,0.55)', { align: 'right', size: 6.5 });
}
// The line-up: every racer's card side by side in one long row, each sliding up in turn (a little
// bounce as it lands), the one the camera is on lifted, with a pink edge and a bobbing arrow; at the
// end they all drop away for the countdown. A card: its gate number, its photo, its name, who it
// is (yours, a friend's, a rival), its grade at the stat this course wants, and its personality.
// What each personality says as the line-up comes to it.
const SAYS = {
  playful: "Tag, you're it!", shy: 'Um... hi...', proud: 'Watch and learn.', sleepy: 'Is it over yet...?', curious: "Ooh, what's that?",
  bossy: 'Out of my way!', gentle: 'Good luck, everyone!', showoff: 'Eyes on me!', clumsy: "Don't trip, don't trip...", brave: 'Bring it on!',
  grumpy: 'Hmph.', dreamy: 'Pretty clouds...', cheeky: 'Catch me if you can!', timid: "I-I'll try...", bubbly: 'This is SO fun!',
  stoic: '...', foodie: 'Snacks at the finish?', sassy: 'Try to keep up.', lazy: 'Five more minutes...', hyper: 'GO GO GO!',
  polite: 'A pleasure to race you.', mischief: 'Hehehe...', clingy: "Don't leave me behind!", loner: 'Leave me be.', artsy: 'Racing is an art.',
  sporty: "Let's go!", nosy: "Who's the fastest here?", dramatic: 'My destiny awaits!', cool: 'Easy.', sweet: "Let's all have fun!",
  chatty: 'Hi hi! Nice day, right?', sneaky: '...shh.',
};
// (Each card leans a little its own way, like photos pinned up by hand.)
const LEANS = [-0.035, 0.025, -0.015, 0.03, -0.028, 0.018];
const TAPES = ['#ffd0e0', '#d8f0c8', '#fff0a8', '#d4e4ff', '#f0d8ff', '#ffe0c8'];
const WHO = { you: ['Your Mochi', '#ff6f9a'], friend: ['Friend', '#9a7ad8'], rival: ['Rival', '#6a8ac8'] };
function lineup(ctx, R, il, time) {
  const stage = RACE_STAGES[R.stageId];
  const n = R.racers.length;
  const gap = 8;
  const cw = Math.min(98, (VW - 36 - (n - 1) * gap) / n);
  const ch = 132;
  const x0 = VW / 2 - (n * cw + (n - 1) * gap) / 2;
  const base = VH - 26 - ch - 10;
  const t = R.t - INTRO.sweep;
  const spot = Math.min(n - 1, Math.floor(t / INTRO.card));
  const out = Math.max(0, Math.min(1, (R.t - (il - 0.35)) / 0.35));
  // The heading: a ribbon with the course and its rank.
  const hk = Math.min(1, t / 0.3);
  ctx.save();
  ctx.globalAlpha = hk * (1 - out);
  const hy = base - 44 - (1 - hk) * 6;
  const words = `${stage.name}  ·  ${RACE_RANKS[R.rank].name}`;
  ctx.font = '800 9px Nunito, "Trebuchet MS", system-ui, sans-serif';
  const hw = ctx.measureText(words).width + 40;
  ctx.fillStyle = '#e05a8a';
  ctx.beginPath();
  ctx.moveTo(VW / 2 - hw / 2 - 12, hy - 6);
  ctx.lineTo(VW / 2 - hw / 2, hy - 6);
  ctx.lineTo(VW / 2 - hw / 2, hy + 8);
  ctx.lineTo(VW / 2 - hw / 2 - 12, hy + 8);
  ctx.lineTo(VW / 2 - hw / 2 - 7, hy + 1);
  ctx.closePath();
  ctx.moveTo(VW / 2 + hw / 2 + 12, hy - 6);
  ctx.lineTo(VW / 2 + hw / 2, hy - 6);
  ctx.lineTo(VW / 2 + hw / 2, hy + 8);
  ctx.lineTo(VW / 2 + hw / 2 + 12, hy + 8);
  ctx.lineTo(VW / 2 + hw / 2 + 7, hy + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff6f9a';
  roundRect(ctx, VW / 2 - hw / 2, hy - 9, hw, 16, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(VW / 2 - hw / 2 + 4, hy - 7, hw - 8, 1.5);
  icon(ctx, 'star', VW / 2 - hw / 2 + 11, hy - 1, 8, '#ffe27a');
  icon(ctx, 'star', VW / 2 + hw / 2 - 11, hy - 1, 8, '#ffe27a');
  text(ctx, words, VW / 2, hy + 2.5, { size: 9, bold: true, align: 'center', color: '#ffffff' });
  ctx.restore();
  const st = stage.stat ?? null;
  R.racers.forEach((r, i) => {
    // In: a slide up with a small overshoot; out: a drop and fade, the last cards first.
    const a = Math.max(0, Math.min(1, (t - i * 0.08) / 0.38));
    if (a <= 0) return;
    const back = 1 + 2.2 * (a - 1) ** 3 + 1.2 * (a - 1) ** 2;
    const o = Math.max(0, Math.min(1, out * 1.6 - ((n - 1 - i) / n) * 0.6));
    const on = i === spot && out === 0;
    const lift = on ? Math.min(1, (t - spot * INTRO.card) / 0.15) : 0;
    const x = x0 + i * (cw + gap);
    const y = base + (1 - back) * 60 - lift * 7 + o * o * 40;
    const who = r.you ? WHO.you : r.owner ? WHO.friend : WHO.rival;
    // (The card the camera's on straightens up and its photo does its signature move.)
    if (on && R.portraitSpot !== i) {
      R.portraitSpot = i;
      kitPortrait(r.rec).action = { name: `sig_${r.rec.personality}`, t0: null };
    }
    ctx.save();
    const lean = LEANS[i % LEANS.length] * (1 - lift) + (1 - back) * 0.12 * (i % 2 ? 1 : -1);
    ctx.translate(x + cw / 2, y + ch / 2);
    ctx.rotate(lean);
    ctx.translate(-x - cw / 2, -y - ch / 2);
    ctx.globalAlpha = Math.min(1, a * 2) * (1 - o) * (on || out > 0 ? 1 : 0.9);
    // The card: a soft shadow, white, a strip of its colour at the top.
    ctx.fillStyle = 'rgba(40,20,40,0.28)';
    roundRect(ctx, x + 2, y + 4, cw, ch, 10);
    ctx.fill();
    ctx.fillStyle = '#fffaf6';
    roundRect(ctx, x, y, cw, ch, 10);
    ctx.fill();
    ctx.save();
    roundRect(ctx, x, y, cw, ch, 10);
    ctx.clip();
    ctx.fillStyle = who[1];
    ctx.fillRect(x, y, cw, 15);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y + 2, cw, 1.5);
    ctx.restore();
    ctx.strokeStyle = on ? '#ff6f9a' : r.you ? '#ffb3cf' : '#e8d8ec';
    ctx.lineWidth = on ? 2.2 : 1.2;
    roundRect(ctx, x, y, cw, ch, 10);
    ctx.stroke();
    // Gate number and who it is.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 11, y + 8, 7.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, String(i + 1), x + 11, y + 11.2, { size: 8.5, bold: true, align: 'center', color: who[1] });
    text(ctx, who[0], x + cw - 7, y + 10.5, { size: 6.5, bold: true, align: 'right', color: '#ffffff' });
    // Its photo.
    portraitCard(ctx, r.rec, x + 5, y + 18, cw - 10, 64, time, { scale: 1.6, edge: r.you ? '#ff8fb8' : '#d8c4ec' });
    // Name, its stat for this course, its personality.
    text(ctx, fit(ctx, nameOf(r), cw - 10, 8.5, true), x + cw / 2, y + 93, { size: 8.5, bold: true, align: 'center', color: COLORS.ink });
    const best = st ?? STAT_ORDER.reduce((b, k) => (r.rec.stats[k].points > r.rec.stats[b].points ? k : b), 'run');
    const sv = r.rec.stats[best];
    const rowW = 46;
    const rx = x + cw / 2 - rowW / 2;
    statIcon(ctx, best, rx + 5, y + 104, 5);
    gradeBadge(ctx, rx + 18, y + 104, sv.grade, 4.6);
    text(ctx, `Lv ${sv.level}`, rx + 26, y + 106.6, { size: 7, bold: true, color: '#8a6a9a' });
    text(ctx, fit(ctx, cap(r.rec.personality), cw - 10, 6.5, false), x + cw / 2, y + 121, { size: 6.5, align: 'center', color: COLORS.muted });
    if (r.you) {
      const hb = Math.abs(Math.sin(time * 4)) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + cw - 6, y + 22 - hb, 6.5, 0, Math.PI * 2);
      ctx.fill();
      icon(ctx, 'heart', x + cw - 6, y + 22 - hb, 8, '#ff6f9a');
    }
    tape(ctx, x + cw / 2, y - 1, 26, 8, -lean * 2, TAPES[i % TAPES.length]);
    ctx.restore();
    // What it says: a speech bubble popping up over its card.
    if (on) {
      const say = SAYS[r.rec.personality];
      const u = Math.min(1, (t - spot * INTRO.card) / 0.22);
      const pop = 1 + 1.7 * (u - 1) ** 3 + 0.7 * (u - 1) ** 2;
      ctx.font = '800 7.5px Nunito, "Trebuchet MS", system-ui, sans-serif';
      const bw = Math.max(40, ctx.measureText(say ?? '').width + 14);
      const bxc = Math.max(bw / 2 + 6, Math.min(VW - bw / 2 - 6, x + cw / 2));
      const byb = y - 8;
      ctx.save();
      ctx.translate(x + cw / 2, byb);
      ctx.scale(pop, pop);
      ctx.translate(-x - cw / 2, -byb);
      ctx.fillStyle = 'rgba(40,20,40,0.22)';
      roundRect(ctx, bxc - bw / 2 + 1, byb - 22, bw, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, bxc - bw / 2, byb - 23, bw, 16, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + cw / 2 - 5, byb - 8);
      ctx.lineTo(x + cw / 2 + 4, byb - 8);
      ctx.lineTo(x + cw / 2 - 1, byb - 1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = who[1];
      ctx.lineWidth = 1.2;
      roundRect(ctx, bxc - bw / 2, byb - 23, bw, 16, 8);
      ctx.stroke();
      text(ctx, say ?? '...', bxc, byb - 12.4, { size: 7.5, bold: true, align: 'center', color: '#6a4a6a' });
      ctx.restore();
    }
  });
}
// The countdown's numbers and GO!: each pops in big and settles (`f`: how far into its beat).
function pop(ctx, s, f, color, burst = false, plate = false) {
  const k = Math.min(1, f * 4);
  const scale = 1 + 0.9 * (1 - k) ** 2;
  const alpha = f > 0.75 ? Math.max(0, (1 - f) / 0.25) : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(VW / 2, VH * 0.38);
  ctx.scale(scale, scale);
  if (burst) {
    ctx.strokeStyle = '#ffd75e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r0 = 26 + f * 20;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.6 - 10);
      ctx.lineTo(Math.cos(a) * (r0 + 10), Math.sin(a) * (r0 + 10) * 0.6 - 10);
      ctx.stroke();
    }
  }
  // (The numbers sit on a round plate: white, a ring of the number's colour, little dots round it.)
  if (plate) {
    ctx.fillStyle = 'rgba(70,40,90,0.2)';
    ctx.beginPath();
    ctx.arc(1.5, -9, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -11, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -11, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, 1 - f));
    ctx.stroke();
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 30.5, -11 + Math.sin(a) * 30.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  text(ctx, s, 2, 2, { size: 34, bold: true, align: 'center', color: 'rgba(80,40,70,0.25)' });
  text(ctx, s, 0, 0, { size: 34, bold: true, align: 'center', color, outline: '#ffffff' });
  ctx.restore();
}
// A ribbon sweeping across the screen with words on it (`k`: 0 to 1 through its time).
function banner(ctx, words, k, color = '#ff6f9a') {
  const inK = Math.min(1, k / 0.15);
  const outK = Math.max(0, (k - 0.8) / 0.2);
  const x = (1 - inK) ** 2 * VW - outK * outK * VW;
  const y = VH * 0.24;
  ctx.save();
  ctx.translate(x, 0);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(VW * 0.18, y - 12);
  ctx.lineTo(VW * 0.84, y - 12);
  ctx.lineTo(VW * 0.82, y + 12);
  ctx.lineTo(VW * 0.16, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd75e';
  ctx.fillRect(VW * 0.18, y - 12, VW * 0.66, 2);
  ctx.fillRect(VW * 0.16, y + 10, VW * 0.66, 2);
  text(ctx, words, VW / 2, y + 5, { size: 15, bold: true, align: 'center', color: '#ffffff' });
  ctx.restore();
}
// The podium's title: who won, and the top three.
function podiumTitle(ctx, R) {
  const k = Math.min(1, Math.max(0, (R.t - 1.6) / 0.4));
  if (k <= 0 || !R.results) return;
  const top = R.results.slice(0, 3);
  ctx.save();
  ctx.globalAlpha = k;
  const y = 52 - (1 - k) * 6;
  const title = `${nameOf(top[0])} wins!`;
  ctx.font = '800 20px Nunito, "Trebuchet MS", system-ui, sans-serif';
  const rw = ctx.measureText(title).width + 60;
  ctx.fillStyle = '#d08a2a';
  for (const side of [-1, 1]) {
    const ex = VW / 2 + side * (rw / 2);
    ctx.beginPath();
    ctx.moveTo(ex, y - 14);
    ctx.lineTo(ex + side * 18, y - 14);
    ctx.lineTo(ex + side * 11, y - 2);
    ctx.lineTo(ex + side * 18, y + 10);
    ctx.lineTo(ex, y + 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffc93a';
  roundRect(ctx, VW / 2 - rw / 2, y - 19, rw, 26, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(VW / 2 - rw / 2 + 5, y - 16, rw - 10, 2);
  icon(ctx, 'star', VW / 2 - rw / 2 + 15, y - 6, 11, '#ffffff');
  icon(ctx, 'star', VW / 2 + rw / 2 - 15, y - 6, 11, '#ffffff');
  text(ctx, title, VW / 2, y, { size: 20, bold: true, align: 'center', color: '#ffffff', outline: '#c06a30' });
  text(ctx, top.map((r, i) => `${NTH[i]} ${nameOf(r)}`).join('   ·   '), VW / 2, y + 22, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: '#8a5a7a' });
  ctx.restore();
}

