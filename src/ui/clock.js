// The clock on the HUD (2026-11-24, the player: "an actual in-game clock"): the game's time of day
// with the sun or the moon, and the date of the game's calendar (world/calendar.js: 30-day seasons,
// four a year). Click it for the season's calendar: today, the festivals on their days, and the Mochi
// Garden's festival days.
import { dateOf, dateText, timeText, SEASONS, HOLIDAYS, DAYS_PER_SEASON, startOf, holidayOn } from '../world/calendar.js';
import { DAY_MS } from '../world/daytime.js';
import { EVERY, FESTIVALS as GARDEN } from '../world/garden-festival.js';
import { monthOf } from '../world/calendar.js';
import { COLORS, text, box, hover, clicked, tooltip, icon } from './kit.js';

export const CLOCK_BOX = { x: 256, y: 4, w: 128, h: 17 };

// A little sun: a disc and eight short rays.
function sun(ctx, x, y, r, c) {
  ctx.save();
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8);
    ctx.lineTo(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
// The season's own little mark: a blossom, a sun, a leaf, a snowflake.
function seasonMark(ctx, season, x, y, r) {
  const c = SEASONS[season].color;
  if (season === 1) return sun(ctx, x, y, r, c);
  if (season === 2) return icon(ctx, 'leaf', x, y, r * 2.2, c);
  ctx.save();
  if (season === 0) {
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.stroke();
    }
  }
  ctx.restore();
}

const nowOf = (world) => (world.dayClock ?? (() => new Date()))().getTime();
// A garden festival day: every EVERY game days, in a season that has one (world/garden-festival.js).
const gardenFestivalOn = (ms) => {
  const day = Math.floor(ms / DAY_MS);
  if (((day % EVERY) + EVERY) % EVERY !== 1) return null;
  const m = monthOf(ms);
  return Object.values(GARDEN).find((f) => f.months.includes(m)) ?? null;
};

// The clock pill. Returns nothing; click toggles state.calendar.
export function drawClock(ui, state, world) {
  const { ctx } = ui;
  const ms = nowOf(world);
  const d = dateOf(ms);
  const { x, y, w, h } = CLOCK_BOX;
  const night = (world.night ?? 0) >= 0.5;
  const hot = hover(ui, x, y, w, h);
  box(ctx, x, y, w, h, { fill: hot ? '#ffffff' : '#fffbf2', edge: SEASONS[d.season].color, r: 8, width: 1.4 });
  if (night) icon(ctx, 'moon', x + 9, y + h / 2, 9, '#8a7ad8');
  else sun(ctx, x + 9, y + h / 2, 4.4, '#ffb020');
  text(ctx, timeText(d), x + 17, y + 11.6, { size: 7.5, bold: true, color: COLORS.ink });
  seasonMark(ctx, d.season, x + 62, y + h / 2, 3.4);
  text(ctx, `${d.seasonName} ${d.day}`, x + 68, y + 11.6, { size: 7.5, bold: true, color: COLORS.ink });
  if (hot) {
    const hol = holidayOn(d);
    tooltip(ui, [{ text: dateText(d), bold: true, color: COLORS.ink }, { text: hol ? `Today: ${hol.name}!` : 'Click for the calendar', size: 8, color: hol ? '#c0782a' : COLORS.muted }]);
  }
  if (clicked(ui, x, y, w, h)) state.calendar = !state.calendar;
  if (state.calendar) drawCalendar(ui, state, world, d);
}

// The season's page: six days a row, five rows, today ringed, festivals filled in their colour, the
// garden's festival days starred; hover a day for what's on.
function drawCalendar(ui, state, world, d) {
  const { ctx } = ui;
  const W = 196;
  const H = 154;
  const x = CLOCK_BOX.x + CLOCK_BOX.w / 2 - W / 2;
  const y = CLOCK_BOX.y + CLOCK_BOX.h + 4;
  const s = SEASONS[d.season];
  box(ctx, x, y, W, H, { fill: '#fffbf2', edge: s.color, r: 9 });
  seasonMark(ctx, d.season, x + 14, y + 13, 4.4);
  text(ctx, `${s.name}, Year ${d.year}`, x + 24, y + 16.5, { size: 9.5, bold: true, color: COLORS.ink });
  text(ctx, '×', x + W - 12, y + 16, { size: 10, bold: true, color: COLORS.muted });
  if (clicked(ui, x + W - 18, y + 4, 16, 16)) state.calendar = false;
  const cw = 30;
  const ch = 22;
  const gx = x + (W - cw * 6) / 2;
  const gy = y + 26;
  let tip = null;
  for (let i = 0; i < DAYS_PER_SEASON; i++) {
    const day = i + 1;
    const cx = gx + (i % 6) * cw;
    const cy = gy + Math.floor(i / 6) * ch;
    const at = startOf(d.season, day, d.year) + DAY_MS / 2;
    const hol = HOLIDAYS.find((hd) => hd.season === d.season && day >= hd.from && day <= hd.to);
    const gf = gardenFestivalOn(at);
    const today = day === d.day;
    const past = day < d.day;
    box(ctx, cx + 1, cy + 1, cw - 2, ch - 2, { fill: hol ? '#fff0d8' : today ? '#ffffff' : '#fffdf8', edge: today ? s.color : hol ? '#f0c080' : '#eee4f4', r: 5, width: today ? 2 : 1, plain: true });
    text(ctx, `${day}`, cx + 5, cy + 10, { size: 7, bold: today, color: past ? COLORS.muted : COLORS.ink });
    if (hol) text(ctx, '♪', cx + cw - 9, cy + 18, { size: 7, bold: true, color: '#c0782a' });
    if (gf) icon(ctx, 'star', cx + 8, cy + 15, 6, '#ff9ec4');
    if (hover(ui, cx, cy, cw, ch)) tip = [{ text: `${s.name} ${day}`, bold: true, color: COLORS.ink }, ...(hol ? [{ text: hol.name, size: 8, color: '#c0782a' }] : []), ...(gf ? [{ text: `${gf.name} in the Mochi Garden`, size: 8, color: '#d0609a' }] : []), ...(today ? [{ text: 'Today', size: 8, color: COLORS.muted }] : [])];
  }
  // (what's next: the next festival this year)
  const next = HOLIDAYS.map((hd) => ({ hd, in: (hd.season * DAYS_PER_SEASON + hd.from - 1) - d.dayOfYear })).filter((n) => n.in > 0).sort((a, b) => a.in - b.in)[0];
  text(ctx, next ? `Next: ${next.hd.name} in ${next.in} day${next.in > 1 ? 's' : ''}` : 'The New Year Festival opens the next year', x + 10, y + H - 9, { size: 7, color: COLORS.muted });
  if (tip) tooltip(ui, tip);
}
