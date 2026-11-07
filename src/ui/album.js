// The capsule album (in the Collection, under Capsules): a page for each machine, a slot for every
// look and skin it holds. A slot shows its prize once it's come out (with the pull it came on), a
// shadow until then; the bundle keeps a tally. Fill a page and you seal it for its album-only skin.

import { GACHA_MACHINES, GACHA_ALBUM, GACHA_PRIZES } from '../data/outfits-gacha.js';
import { SKIN_KINDS, SKIN_LABEL } from '../data/cosmetics.js';
import { albumOf, albumSlots, albumFound, albumFull, sealAlbum, drawPrize, prizeName } from './gacha.js';
import { rarityOf } from '../render/gacha.js';
import { drawSkinTag } from '../render/cosmetics.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, text, box, button, hover, tooltip, sparkle, fit } from './kit.js';
import { sfx } from '../audio/sfx.js';

const LABEL_COLOR = { common: '#4a8ac8', rare: '#8a5ad8', star: '#d4a020' };
const MACHINES = Object.keys(GACHA_MACHINES);

export function albumPage(ui, win, world, x, y, th) {
  const { ctx } = ui;
  const char = world.char;
  const now = world.now;
  win.page = Math.max(0, Math.min(win.page ?? 0, MACHINES.length - 1));
  const machine = MACHINES[win.page];
  const info = GACHA_MACHINES[machine];
  const a = albumOf(char, machine);
  const slots = albumSlots(machine);
  const found = slots.filter((e) => albumFound(char, machine, e)).length;

  // The page's heading, and the arrows to turn to another machine's.
  text(ctx, info.name, x, y + 7, { size: 8, bold: true, color: th.dark });
  text(ctx, `The ${info.set} set`, x, y + 15, { size: 6, color: COLORS.muted });
  // (The Album / Style switch sits at the right of this heading: ui/collection.js.)
  text(ctx, `${found} / ${slots.length} found  ·  ${a.pulls} pull${a.pulls === 1 ? '' : 's'}`, x + 222, y + 11, { size: 6.5, bold: true, align: 'right', color: found === slots.length ? '#c8962a' : th.dark });
  if (MACHINES.length > 1) {
    if (button(ui, x + 116, y + 2, 12, 12, '<', { size: 6, enabled: win.page > 0 })) win.page--;
    text(ctx, `${win.page + 1}/${MACHINES.length}`, x + 136, y + 11, { size: 5.8, align: 'center', color: COLORS.muted });
    if (button(ui, x + 144, y + 2, 12, 12, '>', { size: 6, enabled: win.page < MACHINES.length - 1 })) win.page++;
  }

  // The slots: five to a row, the bundle's tally last.
  const cw = 63.6;
  const ch = 62;
  const bundle = (GACHA_PRIZES[machine] ?? []).find((z) => z.kind === 'bundle');
  const cells = [...slots, ...(bundle ? [{ bundle }] : [])];
  cells.forEach((e, i) => {
    const cx = x + (i % 5) * cw;
    const cy = y + 22 + Math.floor(i / 5) * ch;
    const item = e.look ?? e.prize ?? e.bundle;
    const r = rarityOf(item.rarity);
    const have = e.bundle ? a.bundles > 0 : albumFound(char, machine, e);
    const hot = hover(ui, cx, cy, cw - 4, ch - 4);
    // A capsule-tinted card: the rarity's colour across its top half once it's yours.
    box(ctx, cx, cy, cw - 4, ch - 4, { fill: have ? '#ffffff' : '#f2ecf8', edge: have && item.rarity === 'star' ? '#f2d27a' : have ? r.capsule : '#e2d8ee', r: 9, width: have && item.rarity !== 'common' ? 2 : 1.2 });
    if (have) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = r.capsule;
      ctx.beginPath();
      ctx.roundRect(cx + 2, cy + 2, cw - 8, 20, [7, 7, 2, 2]);
      ctx.fill();
      ctx.restore();
    }
    // The prize itself, bobbing gently (a shadow, and a question mark, until it comes out).
    const bob = have ? Math.sin(now * 2 + i * 0.9) * 1.2 : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 1, cy + 1, cw - 6, 38);
    ctx.clip();
    if (!have) ctx.filter = 'brightness(0) opacity(0.22)';
    if (e.look) drawItemIcon(ctx, `cash_gacha_${e.look.key}`, cx + (cw - 4) / 2 - 12, cy + 6 + bob, 1.5);
    else {
      ctx.translate(cx + (cw - 4) / 2, cy + 33 + bob);
      ctx.scale(0.72, 0.72);
      drawPrize(ctx, e.prize ?? e.bundle, 0, 0, now + i, char);
    }
    ctx.restore();
    if (!have) text(ctx, '?', cx + (cw - 4) / 2, cy + 26, { size: 12, bold: true, align: 'center', color: '#c8b8dc' });
    if (have && item.rarity === 'star') sparkle(ctx, cx + cw - 14, cy + 8, 2 + Math.sin(now * 4) * 0.8, '#ffe36b');
    text(ctx, fit(ctx, e.bundle ? prizeName(e.bundle) : e.look ? e.look.name : prizeName(e.prize), cw - 8, 6.2, true), cx + (cw - 4) / 2, cy + 46, { size: 6.2, bold: true, align: 'center', color: have ? COLORS.ink : COLORS.muted });
    const under = e.bundle ? (a.bundles ? `Opened ×${a.bundles}` : 'Not opened yet') : have ? (a.got[key(e)] ? `Pull #${a.got[key(e)]}` : 'Found') : r.label;
    text(ctx, under, cx + (cw - 4) / 2, cy + 54, { size: 5.6, bold: true, align: 'center', color: have && !e.bundle ? LABEL_COLOR[item.rarity] : COLORS.muted });
    if (hot) {
      const kind = e.look ? `${r.label} look` : e.bundle ? 'Materials, any number of times' : `${r.label} · ${SKIN_LABEL[e.prize.kind]}`;
      tooltip(ui, [{ text: e.bundle ? prizeName(e.bundle) : e.look ? e.look.name : prizeName(e.prize), bold: true }, { text: kind, size: 7, color: COLORS.muted }, { text: have ? 'In your album.' : 'Still in the machine.', size: 7, color: COLORS.muted }]);
    }
  });

  // The page's seal: its album-only skin, waiting until every slot is filled.
  const z = GACHA_ALBUM[machine];
  if (!z) return;
  const by = y + 22 + Math.ceil(cells.length / 5) * ch + 2;
  const full = albumFull(char, machine);
  box(ctx, x, by, 314, 30, { fill: a.sealed ? '#fff6d6' : '#fffaf6', edge: a.sealed ? '#f0c64a' : '#e6dcef', r: 8, width: a.sealed ? 2 : 1 });
  const skin = SKIN_KINDS[z.kind][z.key];
  ctx.save();
  ctx.font = '800 7px Nunito, "Trebuchet MS", system-ui, sans-serif';
  if (!a.sealed && !full) ctx.globalAlpha = 0.55;
  drawSkinTag(ctx, skin, x + 40, by + 10, char.name, now);
  ctx.restore();
  text(ctx, a.sealed ? `Page sealed! ${skin.name} is yours.` : `Fill the page: ${skin.name}`, x + 80, by + 13, { size: 7, bold: true, color: a.sealed ? '#c8962a' : th.dark });
  text(ctx, a.sealed ? 'Put it on in Style.' : full ? 'Every slot filled! Seal it.' : `Album only: never in a machine. ${slots.length - found} to go.`, x + 80, by + 22, { size: 5.8, color: COLORS.muted });
  if (!a.sealed && button(ui, x + 248, by + 7, 60, 16, 'Seal page', { primary: full, enabled: full, size: 7 }) && sealAlbum(char, machine)) {
    world.log(`${info.name}: page sealed! ${skin.name} is yours.`, '#d4a020');
    sfx('rareDrop');
  }
}

const key = (e) => (e.look ? `look:${e.look.key}` : `${e.prize.kind}:${e.prize.key}`);
