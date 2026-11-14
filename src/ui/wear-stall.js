// The clothes stall on your Mochi Garden's square (world/garden-life.js): four models standing on
// the counter, one at each tier, every one of them dressed from its hat down to its shoes on the
// same little figures the stall itself stands out front (render/shopmodel.js), so the card and the
// counter agree. Pick a model and every piece of its look is there to buy on its own: the whole
// outfit, or just the boots. A beginner's piece is pocket money out of one race, an elite one is a
// season of them. Buy one and it's yours for good - every Mochi of yours can wear it. Walk away
// and this closes.

import { TIER_NAMES, SLOT_NAMES } from '../data/mochi-wardrobe.js';
import { drawShopModel } from '../render/shopmodel.js';
import { stallClothes, ownsWear, buyStallWear } from '../world/garden-life.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, windowFrame, text, fit, button, hover, clicked, tooltip, roundRect, icon } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 366;
const H = 228;
// Each tier's colour, and the light its model stands in. They run plainest on the left to the
// elite one on the right, so the ladder reads straight across without a word of explanation.
const PILL = { beginner: '#a8d8b0', mid: '#8fcfe8', end: '#c8a8f0', elite: '#ffcf5c' };
const SKY = {
  beginner: ['#eefaf0', '#fbfffc'],
  mid: ['#eaf6fb', '#f9fdff'],
  end: ['#f6eeff', '#fdfaff'],
  elite: ['#fff4e0', '#fffdf4'],
};

export function wearStallWindow(ui, state, world) {
  const win = state.windows.wears;
  const at = world.map.wearStall;
  if (at == null || world.gardenVisit || !world.char.garden || Math.abs(world.body.x - at) > 80) {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Clothes Stall', { icon: 'hanger' })) return;
  const { ctx } = ui;
  const char = world.char;
  const x = win.x + 10;
  const y = win.y + 28;
  const iw = W - 20;
  heading(ctx, "Today's four", x, y, iw);
  text(ctx, 'New four tomorrow', x + iw, y + 4, { size: 6, align: 'right', color: COLORS.muted });
  const models = stallClothes(char);
  const pick = Math.min(win.pick ?? 0, models.length - 1);

  // ---------- The four on the counter ----------
  const mw = (iw - 18) / 4;
  const my = y + 14;
  const mh = 104;
  models.forEach((model, i) => {
    const cx = x + i * (mw + 6);
    const on = i === pick;
    const over = hover(ui, cx, my, mw, mh);
    const top = my - (on ? 3 : over ? 1 : 0);
    const c = PILL[model.tier] ?? '#d8c8e0';
    ctx.fillStyle = 'rgba(70,40,90,0.13)';
    roundRect(ctx, cx + 1.5, my + 2.5, mw, mh, 9);
    ctx.fill();
    if (on) {
      ctx.fillStyle = c;
      roundRect(ctx, cx - 1.5, top - 1.5, mw + 3, mh + 3, 10);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx, top, mw, mh, 9);
    ctx.fill();
    const [a, b] = SKY[model.tier] ?? SKY.beginner;
    const g = ctx.createLinearGradient(0, top + 4, 0, top + 80);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    roundRect(ctx, cx + 4, top + 4, mw - 8, 76, 6);
    ctx.fill();
    // The model itself, standing on the card's floor with the whole look on.
    ctx.save();
    roundRect(ctx, cx + 4, top + 4, mw - 8, 76, 6);
    ctx.clip();
    ctx.fillStyle = 'rgba(120,80,110,0.1)';
    ctx.beginPath();
    ctx.ellipse(cx + mw / 2, top + 75, 15, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    drawShopModel(ctx, cx + mw / 2, top + 76, model.wear, 1.25);
    ctx.restore();
    // What it is dressed at, as a pill under it - and under that, what a piece off it costs,
    // which is the same for every piece on one model, so it is said once here and not eight times.
    const word = TIER_NAMES[model.tier] ?? model.tier;
    ctx.font = '700 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
    const pw = Math.max(32, ctx.measureText(word).width + 12);
    ctx.fillStyle = c;
    roundRect(ctx, cx + (mw - pw) / 2, top + 82, pw, 11, 5.5);
    ctx.fill();
    text(ctx, word, cx + mw / 2, top + 90, { size: 6, bold: true, align: 'center', color: '#4a3a52' });
    const cost = model.pieces[0]?.price ?? 0;
    icon(ctx, 'coin', cx + mw / 2 - 20, top + 97.5, 6.5, '#e0a82a');
    text(ctx, `${cost.toLocaleString()} each`, cx + mw / 2 + 3, top + 100, { size: 6, bold: true, align: 'center', color: '#8a6a3a' });
    if (clicked(ui, cx, my, mw, mh)) {
      win.pick = i;
      sfx('tab');
    }
  });

  // ---------- Every piece of the one you picked ----------
  const look = models[pick];
  const tw = (iw - 15) / 4;
  const ty = my + mh + 9;
  look.pieces.forEach((piece, i) => {
    const px = x + (i % 4) * (tw + 5);
    const py = ty + Math.floor(i / 4) * 33;
    const mine = ownsWear(char, piece.id);
    const poor = char.gold < piece.price;
    if (mine) {
      ctx.fillStyle = '#f2f0ee';
      roundRect(ctx, px, py, tw, 28, 7);
      ctx.fill();
      text(ctx, fit(ctx, piece.name, tw - 10, 6.5), px + tw / 2, py + 12, { size: 6.5, bold: true, align: 'center', color: '#a89ca4' });
      text(ctx, 'Yours', px + tw / 2, py + 22, { size: 6, bold: true, align: 'center', color: '#8fbf7a' });
    } else {
      if (button(ui, px, py, tw, 28, '', { enabled: !poor })) {
        const why = buyStallWear(world, pick, piece.kind);
        if (why) world.log(why, '#ffd2a0');
        else sfx('buy');
      }
      text(ctx, fit(ctx, piece.name, tw - 10, 7), px + tw / 2, py + 17, { size: 7, bold: true, align: 'center', color: poor ? '#b09aa4' : '#5a4a62' });
    }
    // (Which slot it goes in is the one thing a name does not always say: a Lace Veil is a hat.)
    if (hover(ui, px, py, tw, 28)) tooltip(ui, poor && !mine ? [SLOT_NAMES[piece.kind], 'Not enough gold yet.'] : [SLOT_NAMES[piece.kind]]);
  });
}
