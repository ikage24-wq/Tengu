// Tilly's card table (world/cards.js), in her dialog: the card face up, the one before it, a peek
// when she fumbles, the pot and the ladder, and the buttons: a stake to deal, Higher / Lower, and
// Cash out. Her running commentary along the top.

import { STAKES, STEPS, SUITS, RANK_NAMES, deal, guess, cashOut, pot, roundsLeft } from '../world/cards.js';
import { COLORS, text, box, button } from './kit.js';

const FELT = '#3f8a5a';

// A playing card: cream face, its rank in the corners, a big suit picture in the middle.
function drawCard(ctx, x, y, w, h, card, { faded = false, back = false } = {}) {
  ctx.save();
  if (faded) ctx.globalAlpha = 0.55;
  box(ctx, x, y, w, h, { fill: back ? '#7a4a8a' : '#fffaf0', edge: back ? '#5a3a6a' : '#c8b8a0', r: 4, width: 1.2 });
  if (back) {
    ctx.fillStyle = '#ffd36b';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) ctx.fillRect(Math.round(x + 6 + i * (w - 12) / 2.5), Math.round(y + 6 + j * (h - 12) / 3.5), 2, 2);
    ctx.restore();
    return;
  }
  const s = SUITS[card.suit];
  text(ctx, RANK_NAMES[card.rank], x + 4, y + 9, { size: 8, bold: true, color: s.color });
  text(ctx, RANK_NAMES[card.rank], x + w - 4, y + h - 3, { size: 8, bold: true, align: 'right', color: s.color });
  suit(ctx, s.key, x + w / 2, y + h / 2 + 1, Math.min(w, h) * 0.22, s.color);
  ctx.restore();
}
// The four suits, drawn simply: a kettle, a coin, a lantern, a crescent moon.
function suit(ctx, kind, x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  if (kind === 'kettle') {
    ctx.ellipse(x, y + r * 0.2, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + r * 0.6, y - r * 0.2, r * 0.8, r * 0.3);
    ctx.fillRect(x - r * 0.25, y - r * 0.9, r * 0.5, r * 0.3);
  } else if (kind === 'coin') {
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x - r * 0.12, y - r * 0.55, r * 0.24, r * 1.1);
  } else if (kind === 'lantern') {
    ctx.ellipse(x, y + r * 0.1, r * 0.75, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x - r * 0.2, y - r * 0.4, r * 0.4, r);
    ctx.fillStyle = c;
    ctx.fillRect(x - r * 0.4, y - r * 1.2, r * 0.8, r * 0.3);
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.arc(x + r * 0.45, y - r * 0.2, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Returns true when it closed.
export function cardsPage(ui, state, world, area) {
  const { ctx } = ui;
  const { x: tx, w: tw } = area;
  const char = world.char;
  const g = world.cardGame;
  text(ctx, "Tilly's Higher or Lower", tx, area.y, { size: 9, bold: true, color: FELT });
  text(ctx, `${roundsLeft(world)} rounds left today · Gold: ${char.gold.toLocaleString()}`, tx + tw, area.y, { size: 6.5, align: 'right', color: COLORS.muted });
  // The table.
  const y = area.y + 6;
  box(ctx, tx, y, tw, 104, { fill: FELT, edge: '#2f6a4a', r: 10, width: 2 });
  text(ctx, g?.say ?? "Wanna play? Pick your stake! I'm REALLY good.", tx + tw / 2, y + 11, { size: 6.8, bold: true, align: 'center', color: '#fff6dc' });
  // The cards: the one before (faded), the one face up, the deck (with a peek on top).
  if (g) {
    if (g.last) drawCard(ctx, tx + tw / 2 - 74, y + 26, 34, 48, g.last, { faded: true });
    drawCard(ctx, tx + tw / 2 - 24, y + 20, 48, 66, g.card);
  } else drawCard(ctx, tx + tw / 2 - 24, y + 20, 48, 66, null, { back: true });
  drawCard(ctx, tx + tw / 2 + 40, y + 26, 34, 48, null, { back: true });
  if (g?.live && g.peek) {
    drawCard(ctx, tx + tw / 2 + 50, y + 18, 34, 48, g.peek, { faded: true });
    text(ctx, 'peek!', tx + tw / 2 + 67, y + 80, { size: 6, bold: true, align: 'center', color: '#ffe36b' });
  }
  // The ladder.
  STEPS.forEach((m, i) => {
    const on = g && g.steps > i;
    box(ctx, tx + 8, y + 22 + i * 15, 46, 12, { fill: on ? '#ffd36b' : 'rgba(255,255,255,0.15)', edge: null, r: 5 });
    text(ctx, `×${m}`, tx + 31, y + 30.5 + i * 15, { size: 6.2, bold: true, align: 'center', color: on ? '#5a4a2a' : '#e0f0e0' });
  });
  if (g) text(ctx, g.result ? (g.result.won ? `You won ${g.result.won.toLocaleString()} gold!` : `You lost ${g.stake.toLocaleString()} gold.`) : `Pot: ${pot(g).toLocaleString()} gold`, tx + tw - 10, y + 52, { size: 8, bold: true, align: 'right', color: g.result?.won ? '#ffe36b' : '#fff6dc' });
  // The buttons.
  const by = y + 112;
  if (g?.live) {
    if (button(ui, tx, by, 70, 16, '▲ Higher', { primary: true, size: 7.5 })) guess(world, 'higher');
    if (button(ui, tx + 76, by, 70, 16, '▼ Lower', { primary: true, size: 7.5 })) guess(world, 'lower');
    if (button(ui, tx + 152, by, 90, 16, `Cash out ${pot(g).toLocaleString()} g`, { size: 7, enabled: g.steps > 0 })) cashOut(world);
  } else {
    text(ctx, 'Stake:', tx, by + 10, { size: 7.5, bold: true, color: COLORS.ink });
    STAKES.forEach((s, i) => {
      if (button(ui, tx + 34 + i * 54, by, 50, 16, `${s} g`, { primary: true, size: 7, enabled: char.gold >= s && roundsLeft(world) > 0 })) {
        const why = deal(world, s);
        if (why) (world.cardGame ??= { live: false, stake: 0, steps: 0, deck: [], card: { rank: 1, suit: 0 } }).say = why;
      }
    });
  }
  text(ctx, 'Guess if the next card is higher or lower. Same card is a draw. Cash out any time!', tx, by + 28, { size: 5.8, color: COLORS.muted });
  return button(ui, tx + tw - 60, area.bottom - 16, 60, 17, 'Back') || ui.input?.pressed?.has('Backspace');
}
