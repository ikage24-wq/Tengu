// A festival stall's window (world/garden-festival.js; the stall stands on the Mochi Market's terrace
// on festival days). Two tabs:
//   the game     the festival's own (Moon Viewing: Dango Stack, world/dango-stack.js; Snow Lanterns:
//                Snowball Toss, world/snowball-toss.js): 100 gold a go, Space, Up or a click to play;
//                at the end, the festival's tokens for the score
//   Prizes       the festival's own garden pieces, swapped for its tokens (kept after the festival)
// Walk away, or the festival ends, and the window closes (a game going on is finished first).

import { FURNITURE } from '../data/furniture.js';
import { addItem } from '../core/inventory.js';
import { drawPieceIcon } from '../render/furniture.js';
import { STACK, newStack, tickStack, dropDango, tokensFor } from '../world/dango-stack.js';
import { FEST, FESTIVALS } from '../world/garden-festival.js';
import { TOSS, newToss, tickToss, throwToss, tossTokens } from '../world/snowball-toss.js';
import { drawTossGame, drawPetalGame, drawRingGame } from './festival-games.js';
import { PETAL, newCatch, tickCatch, petalTokens } from '../world/petal-catch.js';
import { RING, newRings, tickRings, throwRing, ringTokens } from '../world/ring-toss.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, windowFrame, text, button, box, clicked, hover, tabs, fit } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 300;
const H = 254;
const TAU = Math.PI * 2;
// Each festival's game: how it starts, steps, takes a press, scores, and what's said under it.
const GAMES = {
  dango: {
    name: 'Dango Stack', cost: STACK.cost, create: newStack, tick: tickStack, press: dropDango, tokens: tokensFor, draw: (ctx, x, y, w, h, g, time) => drawGame(ctx, x, y, w, h, g, time),
    going: (g) => `Stacked ${g.n}   Score ${g.score}`, lives: (g) => [g.lives, STACK.lives], how: ['Drop each dango onto the stack. Off-centre, it leans;', "miss three, or let it lean too far, and it's over."],
    result: (g, got) => (g.last === 'full' ? `A full skewer! ${g.score} points, +${got} tokens` : `${g.n} high, ${g.score} points: +${got} token${got === 1 ? '' : 's'}`),
    sounds: { perfect: 'coin', miss: 'hit' },
  },
  snowball: {
    name: 'Snowball Toss', cost: TOSS.cost, create: newToss, tick: tickToss, press: throwToss, tokens: tossTokens, draw: drawTossGame,
    going: (g) => `Hits ${g.hits}   Score ${g.score}   ${Math.max(0, Math.ceil(TOSS.time - g.t))}s`, lives: null, how: ['Throw at the snow-Mochi as they pop up - a golden one', 'is worth two. Thirty seconds!'],
    result: (g, got) => `${g.hits} hits, ${g.score} points: +${got} token${got === 1 ? '' : 's'}`,
    sounds: { hit: 'coin', gold: 'itemGet', miss: 'click' },
  },
  petal: {
    name: 'Petal Catch', cost: PETAL.cost, create: newCatch, tick: (g, dt, win) => tickCatch(g, dt, { left: win.left, right: win.right, aim: win.aim }), press: () => false, tokens: petalTokens, draw: drawPetalGame,
    going: (g) => `Caught ${g.caught}   Score ${g.score}   ${Math.max(0, Math.ceil(PETAL.time - g.t))}s`, lives: null, how: ['Catch the petals in the basket: Left and Right, or the', 'mouse. A golden petal is worth two. Thirty seconds!'],
    result: (g, got) => `${g.caught} petals, ${g.score} points: +${got} token${got === 1 ? '' : 's'}`,
    sounds: { catch: 'pickup', gold: 'itemGet' }, keys: 'arrows',
  },
  ring: {
    name: 'Ring Toss', cost: RING.cost, create: newRings, tick: tickRings, press: throwRing, tokens: ringTokens, draw: drawRingGame,
    going: (g) => `Rings ${RING.rings - g.n}   Score ${g.score}`, lives: null, how: ['Throw as the meter says: near peg 1, middle 2, far 3.', 'Ten rings - the meter speeds up as you go.'],
    result: (g, got) => `${g.on.length} ringers, ${g.score} points: +${got} token${got === 1 ? '' : 's'}`,
    sounds: { ringer: 'coin', clink: 'click', miss: 'cancel' },
  },
};
const festOf = () => FEST.now?.id ?? 'moon';
const prizes = (id) => FURNITURE.filter((f) => f.festival === id);
export const tokensOf = (char, id = festOf()) => char.festTokens?.[id] ?? 0;

export function festivalStallWindow(ui, state, world) {
  const win = state.windows.feststall;
  const at = world.map.festStall;
  const playing = Boolean(win.game) && win.game.phase !== 'done';
  if (at == null || world.gardenVisit || !world.char.garden || Math.abs(world.body.x - at) > 90 || (!FEST.now && !playing)) {
    win.open = false;
    win.game = null;
    return;
  }
  // (The festival it was opened for, kept while a game's going even if the day turns over.)
  if (!playing) {
    // (A finished game of another festival's put away.)
    if (win.fest !== festOf()) win.game = null;
    win.fest = festOf();
  }
  const id = win.fest ?? festOf();
  const F = FESTIVALS[id];
  const G = GAMES[F.game];
  if (!windowFrame(ui, win, W, H, F.stall, { icon: 'star' })) return;
  const { ctx } = ui;
  const char = world.char;
  const x = win.x + 10;
  let y = win.y + 28;
  win.tab = tabs(ui, x, y, [G.name, `Prizes (${tokensOf(char, id)} tokens)`], win.tab ?? 0, { total: W - 20, h: 14 });
  y += 20;
  if (win.tab === 1) return prizesTab(ui, win, world, x, y, id);
  // ---- The game.
  const aw = W - 20;
  const ah = 150;
  const dt = Math.min(0.05, Math.max(0, world.now - (win.at ?? world.now)));
  win.at = world.now;
  const g = win.game;
  if (g) {
    // (A press - Space or Up, kept from the world by ui/manager.js routeInput - or a click on the play area.)
    if (win.drop || clicked(ui, x, y, aw, ah)) G.press(g);
    win.drop = false;
    // (Petal Catch: the mouse over the play area steers the basket.)
    win.aim = G.keys === 'arrows' && hover(ui, x, y, aw, ah) ? ((ui.mouse.x - (x + aw / 2)) / (aw / 2)) * PETAL.half : null;
    const out = G.tick(g, dt, win);
    if (G.sounds[out]) sfx(G.sounds[out]);
    if (g.phase === 'done' && !g.paid) {
      g.paid = true;
      const got = G.tokens(g.score);
      char.festTokens ??= {};
      char.festTokens[id] = tokensOf(char, id) + got;
      char.festBest ??= {};
      char.festBest[id] = Math.max(char.festBest[id] ?? 0, g.score);
      g.got = got;
      world.log(`${G.name}: ${g.score} points. ${got ? `+${got} ${F.token}${got > 1 ? 's' : ''}!` : 'Four points for a token!'}`, '#ffe08a');
    }
  }
  G.draw(ctx, x, y, aw, ah, g, world.now);
  y += ah + 6;
  // Under it: how it's going, or how to play and a go.
  if (g && g.phase !== 'done') {
    text(ctx, G.going(g), x, y + 8, { size: 7.5, bold: true, color: '#2e3a7a' });
    const lv = G.lives?.(g);
    if (lv) for (let i = 0; i < lv[1]; i++) heart(ctx, x + aw - 8 - i * 11, y + 5, i < lv[0]);
    text(ctx, G.keys === 'arrows' ? 'Left and Right, or the mouse' : 'Space, Up or click', x, y + 20, { size: 6.5, color: COLORS.muted });
    return;
  }
  if (g?.phase === 'done') text(ctx, G.result(g, g.got), x, y + 8, { size: 7.5, bold: true, color: '#2e3a7a' });
  else text(ctx, G.how[0], x, y + 7, { size: 6.5, color: COLORS.muted });
  if (g?.phase !== 'done') text(ctx, G.how[1], x, y + 16, { size: 6.5, color: COLORS.muted });
  else text(ctx, `Best: ${char.festBest?.[id] ?? 0}  ·  One token for every four points`, x, y + 18, { size: 6.5, color: COLORS.muted });
  const can = char.gold >= G.cost;
  if (button(ui, x + aw - 110, y + 24, 110, 16, `${g ? 'Again' : 'Play'} · ${G.cost}g`, { size: 7.5, primary: can, enabled: can, iconName: 'star' })) {
    char.gold -= G.cost;
    win.game = G.create();
    sfx('buy');
  }
}

function prizesTab(ui, win, world, x, y, id) {
  const { ctx } = ui;
  const char = world.char;
  heading(ctx, `${FESTIVALS[id].token}s: ${tokensOf(char, id)}`, x, y, W - 20);
  const list = prizes(id);
  list.forEach((f, i) => {
    const cy = y + 12 + i * 58;
    box(ctx, x, cy, W - 20, 52, { fill: '#fffaf2', edge: '#f0dcc0', r: 8 });
    drawPieceIcon(ctx, f.id, x + 4, cy + 4, 44, world.now);
    text(ctx, f.name, x + 54, cy + 13, { size: 8, bold: true, color: '#2e3a7a' });
    text(ctx, fit(ctx, f.desc, W - 20 - 60, 6.2, false), x + 54, cy + 25, { size: 6.2, color: COLORS.muted });
    const can = tokensOf(char, id) >= f.tokens;
    if (button(ui, x + W - 20 - 92, cy + 32, 86, 15, `Swap · ${f.tokens} tokens`, { size: 7, primary: can, enabled: can, iconName: 'gift' })) {
      char.festTokens[id] -= f.tokens;
      addItem(char.inventory, f.id, 1);
      sfx('buy');
      world.log(`${f.name}: in your bag. Set it out in your garden (Decorate, Y).`, '#ffe08a');
    }
  });
}

// The play area: a night sky with the moon, the skewer stood on a little tray, the stack (leaning
// as it leans, wobbling as it topples), the dango swinging above it or falling, and a miss rolling
// away.
function drawGame(ctx, x, y, w, h, g, time) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#22285a');
  sky.addColorStop(1, '#4a4a8a');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 18; i++) {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.3 + i * 2.1));
    ctx.fillStyle = `rgba(255,255,240,${0.6 * tw})`;
    ctx.fillRect(x + ((i * 53) % w), y + ((i * 29) % (h * 0.6)), 1, 1);
  }
  // The moon.
  ctx.fillStyle = '#ffe49a';
  ctx.beginPath();
  ctx.arc(x + w - 30, y + 26, 14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(232,176,96,0.35)';
  ctx.beginPath();
  ctx.ellipse(x + w - 34, y + 22, 4, 3, 0.3, 0, TAU);
  ctx.fill();
  // The ground and the tray.
  const cx = x + w / 2;
  const base = y + h - 14;
  ctx.fillStyle = '#3a6a4a';
  ctx.fillRect(x, base + 6, w, h);
  ctx.fillStyle = '#c8945a';
  ctx.fillRect(cx - 16, base, 32, 6);
  ctx.fillStyle = '#e2c08a';
  ctx.fillRect(cx - 18, base - 1, 36, 2);
  const R = STACK.R;
  const gap = R * 1.7;
  const n = g?.tower.length ?? 0;
  // (The stack scrolls down as it grows, so its top stays in view.)
  const scroll = Math.max(0, (n - 6) * gap);
  const tip = !g ? 0 : g.phase === 'topple' ? Math.sign(g.lean || 1) * Math.min(1.4, ((g.t - g.toppleAt) / 1.2) ** 2 * 1.4) : (g.lean / STACK.lean) * 0.22 + Math.sin(time * 3) * 0.01 * Math.abs(g.lean);
  ctx.save();
  ctx.translate(cx, base + scroll);
  ctx.rotate(tip);
  // The skewer.
  ctx.strokeStyle = '#d8b07a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -(STACK.max + 0.6) * gap);
  ctx.stroke();
  for (const [i, d] of (g?.tower ?? []).entries()) dango(ctx, d.dx, -R - i * gap, R, d.gold, time);
  ctx.restore();
  if (g) {
    const topY = base + scroll - R - n * gap;
    // The one swinging above, or falling.
    if (g.phase === 'swing') dango(ctx, cx + g.x, Math.min(topY - gap * 2.2, y + 22), R, (g.n + 1) % 5 === 0, time);
    if (g.phase === 'fall' && g.falling) {
      const k = g.falling.t / STACK.fall;
      const from = Math.min(topY - gap * 2.2, y + 22);
      dango(ctx, cx + g.falling.x, from + (topY - from) * k * k, R, g.falling.gold, time);
    }
    // A miss, rolling off and away.
    for (const m of g.misses) {
      const a = g.t - m.t;
      if (a > 1.2) continue;
      dango(ctx, cx + m.x + m.dir * a * 70, Math.min(base - R, topY + a * a * 200), R, false, time, a * 6 * m.dir);
    }
    // A word for the last one.
    const words = { perfect: 'Perfect!', miss: 'Oops!', topple: 'Toppled!', full: 'Full skewer!' }[g.last];
    if (words && g.t - (g.lastAt ?? 0) >= 0) {
      ctx.font = '900 11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2e3a7a';
      ctx.fillStyle = g.last === 'perfect' || g.last === 'full' ? '#ffe08a' : '#ffffff';
      ctx.strokeText(words, cx, y + 16);
      ctx.fillText(words, cx, y + 16);
      ctx.textAlign = 'left';
    }
  } else {
    // (Its name on a little banner, clear of the skewer behind it.)
    ctx.fillStyle = 'rgba(46,58,122,0.92)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - 46, y + h / 2 - 26, 92, 22, 8);
    else ctx.rect(cx - 46, y + h / 2 - 26, 92, 22);
    ctx.fill();
    ctx.font = '900 12px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe08a';
    ctx.fillText('Dango Stack', cx, y + h / 2 - 10);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}
function dango(ctx, x, y, r, gold, time, spin = 0) {
  ctx.fillStyle = gold ? '#e8b84a' : '#e4dccc';
  ctx.beginPath();
  ctx.arc(x + 0.6, y + 0.6, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = gold ? '#ffd86a' : '#fffaf0';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.95, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(x - r * 0.5 + Math.sin(spin) * 2, y - r * 0.5, r * 0.3, r * 0.22);
  if (gold) {
    const tw = (Math.sin(time * 5) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * tw})`;
    ctx.fillRect(x + r * 0.3, y - r * 0.9, 1.2, 1.2);
  }
}
function heart(ctx, x, y, full) {
  ctx.fillStyle = full ? '#ff6f9a' : '#e8d8e0';
  ctx.beginPath();
  ctx.arc(x - 2, y, 2.4, 0, TAU);
  ctx.arc(x + 2, y, 2.4, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 4.3, y + 0.8);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x + 4.3, y + 0.8);
  ctx.closePath();
  ctx.fill();
}
