// The guild's bounty board (world/bounties.js), in Guildmaster Halvard's dialog: your rank and how
// far to the next, and three cards: the elite (its own monster, drawn small), where it prowls, the
// pay, and Take / Hand in.

import { MOBS } from '../data/mobs.js';
import { MAPS } from '../data/maps.js';
import { RANKS } from '../data/bounties.js';
import { drawMonster } from '../render/monsters.js';
import { bountyBoard, bountyName, takeBounty, turnIn, guildOf, rankOf, joinGuild } from '../world/bounties.js';
import { COLORS, text, box, button, wrap, fit, bar } from './kit.js';

const STATE = { open: ['Wanted', '#e08a5a'], active: ['On the hunt', '#8fb8ff'], slain: ['Slain!', '#7fd1a0'], done: ['Done', '#b8b0c8'] };

// Returns true when it closed.
export function bountyPage(ui, state, world, area) {
  const { ctx } = ui;
  const { x: tx, w: tw, theme: th } = area;
  const char = world.char;
  joinGuild(world);
  const g = guildOf(char);
  const rank = rankOf(char);
  const next = RANKS[(g.rank ?? 0) + 1];
  text(ctx, `Bounty Board · ${rank.name} rank`, tx, area.y, { size: 9, bold: true, color: rank.color === '#c8d0e0' ? '#7a8aa8' : th.ink });
  if (next) {
    text(ctx, `${g.done ?? 0}/${next.need} to ${next.name}`, tx + tw, area.y, { size: 6.5, align: 'right', color: COLORS.muted });
    bar(ctx, tx + tw - 90, area.y + 3, 90, 3, Math.min(1, (g.done ?? 0) / next.need), next.color, null);
  } else text(ctx, 'The highest rank there is!', tx + tw, area.y, { size: 6.5, align: 'right', color: COLORS.muted });
  const y = area.y + 10;
  const list = bountyBoard(world);
  const cardW = (tw - 8) / 3;
  list.slice(0, 3).forEach((b, i) => {
    const cx = tx + i * (cardW + 4);
    const [label, col] = STATE[b.state];
    const def = MOBS[b.mob];
    box(ctx, cx, y, cardW, 120, { fill: b.state === 'slain' ? '#f4fff8' : '#fffaf0', edge: b.state === 'open' ? th.light : col, r: 8, width: b.state === 'open' ? 1.2 : 2 });
    box(ctx, cx + 3, y + 3, cardW - 6, 12, { fill: col, edge: null, r: 6 });
    text(ctx, label, cx + cardW / 2, y + 12, { size: 6.5, bold: true, align: 'center', color: '#ffffff', outline: 'rgba(58,45,79,0.45)' });
    // The elite itself, standing in its little frame.
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 4, y + 17, cardW - 8, 44);
    ctx.clip();
    const k = Math.min(0.75, 34 / def.h, 50 / def.w);
    ctx.translate(cx + cardW / 2, y + 58);
    ctx.scale(k, k);
    if (b.state === 'done') ctx.filter = 'grayscale(1) opacity(0.5)';
    drawMonster(ctx, { def, x: 0, y: 0, hp: def.hp, dir: -1, state: 'idle', flash: 0, stagger: 0, phase: performance.now() / 1000, age: 9, dying: 0, uid: 8800 + i, aggroUntil: 0, attackAt: -9, gloatAt: -9 }, 0, 0, performance.now() / 1000);
    ctx.restore();
    wrap(ctx, bountyName(b), cx + 5, y + 70, cardW - 10, { size: 6.6, lineHeight: 7.8, bold: true, color: COLORS.ink });
    text(ctx, fit(ctx, `Lv ${b.level} · ${MAPS[b.map].name}`, cardW - 10, 5.8, false), cx + 5, y + 92, { size: 5.8, color: COLORS.muted });
    text(ctx, `${b.gold.toLocaleString()} gold · EXP · a rare drop`, cx + 5, y + 100, { size: 5.6, bold: true, color: COLORS.gold });
    if (b.state === 'open' && button(ui, cx + cardW / 2 - 24, y + 104, 48, 13, 'Take it', { primary: true, size: 6.5 })) {
      const why = takeBounty(world, b.id);
      if (why) world.log(why, '#ffb3c6');
    }
    if (b.state === 'slain' && button(ui, cx + cardW / 2 - 26, y + 104, 52, 13, 'Hand in', { primary: true, size: 6.5 })) {
      const why = turnIn(world, b.id);
      if (why) world.log(why, '#ffb3c6');
    }
    if (b.state === 'active') text(ctx, 'Find it there!', cx + cardW / 2, y + 113, { size: 6.5, bold: true, align: 'center', color: col });
  });
  text(ctx, 'New bounties every day. Elites hit hard: bring potions, or friends.', tx, y + 130, { size: 6.2, color: COLORS.muted });
  return button(ui, tx + tw - 60, area.bottom - 16, 60, 17, 'Back') || ui.input?.pressed?.has('Backspace');
}
