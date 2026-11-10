// The Mochi album (data/mochi-album.js): a book, a page for each kind of thing a Mochi can be. Down
// the left, its pages, each with how full it is; on the right, the page: every entry as a little
// card, the ones you've raised drawn as a Mochi that is it (a form, a coat, a hairstyle, eyes) or
// named (a personality, a voice: click a voice to hear it), the rest a soft "?"; underneath, the
// page's two rewards (half full, complete) and Claim. Opened from Kinako or a Mochi's page.

import { ALBUM_PAGES, PAGE_ORDER, seenOn, milestones, claimAlbum } from '../data/mochi-album.js';
import { rollMochi } from '../data/mochi-genes.js';
import { newRecord } from '../data/mochi-raise.js';
import { drawMochiAnim } from '../render/mochi-anim.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, windowFrame, text, button, hover, clicked, roundRect, icon, tooltip, fit } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 372;
const H = 270;
const COLS = 6;
const ROWS = 4;
// (A model Mochi for the drawn entries: the same one each time, wearing the entry.)
const base = newRecord(rollMochi(77, { coat: null }));
base.stage = 'amamochi';
const models = new Map();
function modelOf(page, key) {
  const id = `${page}|${key}`;
  if (models.has(id)) return models.get(id);
  const g = { ...base };
  if (page === 'hairs') g.hair = key;
  if (page === 'eyes') g.eyes = key;
  if (page === 'coats') Object.assign(g, { coat: key, rarity: 'rare' });
  if (page === 'forms') {
    const [path, form] = key.split('|');
    Object.assign(g, { path, form, stage: form === 'moon' ? 'tsukimochi' : path === 'angel' ? 'amamochi' : 'karamochi' });
  }
  const m = { genes: g, dir: 1, speed: 0, dist: 0, size: 'grown', noIdle: true };
  models.set(id, m);
  return m;
}
const DRAWN = new Set(['forms', 'coats', 'hairs', 'eyes']);

export function mochiAlbumWindow(ui, state, world) {
  const win = state.windows.album;
  if (!windowFrame(ui, win, W, H, 'Mochi Album', { icon: 'book' })) return;
  const { ctx } = ui;
  const char = world.char;
  win.page = PAGE_ORDER.includes(win.page) ? win.page : PAGE_ORDER[0];
  const x = win.x + 10;
  const y = win.y + 28;
  // ---- The pages.
  const lw = 96;
  PAGE_ORDER.forEach((id, i) => {
    const p = ALBUM_PAGES[id];
    const py = y + i * 30;
    const on = win.page === id;
    const have = seenOn(char, id).length;
    const k = have / p.keys.length;
    const ready = milestones(char, id).some((m) => m.reached && !m.claimed);
    ctx.fillStyle = on ? '#ffe8f0' : hover(ui, x, py, lw, 26) ? '#fff6fa' : '#ffffff';
    roundRect(ctx, x, py, lw, 26, 8);
    ctx.fill();
    ctx.strokeStyle = on ? '#ff8fb8' : '#f0dce6';
    ctx.lineWidth = on ? 1.3 : 1;
    ctx.stroke();
    icon(ctx, p.icon, x + 10, py + 10, 8, on ? '#e0659f' : '#c8a0b8');
    text(ctx, p.name, x + 19, py + 12, { size: 7, bold: true, color: on ? '#a8467a' : COLORS.ink });
    ctx.fillStyle = '#f4e6ee';
    roundRect(ctx, x + 6, py + 17, lw - 32, 4, 2);
    ctx.fill();
    ctx.fillStyle = k >= 1 ? '#f0b53a' : '#ff8fb8';
    roundRect(ctx, x + 6, py + 17, Math.max(3, (lw - 32) * k), 4, 2);
    ctx.fill();
    text(ctx, `${have}/${p.keys.length}`, x + lw - 6, py + 21.5, { size: 5.8, bold: true, align: 'right', color: COLORS.muted });
    if (ready) {
      ctx.fillStyle = '#ff6f9a';
      ctx.beginPath();
      ctx.arc(x + lw - 5, py + 5, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (clicked(ui, x, py, lw, 26)) {
      win.page = id;
      win.scroll = 0;
    }
  });
  // ---- The page.
  const page = ALBUM_PAGES[win.page];
  const seen = new Set(seenOn(char, win.page));
  const rx = x + lw + 10;
  const rw = W - 20 - lw - 10;
  heading(ctx, `${page.name} · ${seen.size} of ${page.keys.length}`, rx, y, rw);
  const per = COLS * ROWS;
  const pages = Math.ceil(page.keys.length / per);
  win.scroll = Math.max(0, Math.min(pages - 1, win.scroll ?? 0));
  const cw = (rw - (COLS - 1) * 4) / COLS;
  const ch = 38;
  page.keys.slice(win.scroll * per, win.scroll * per + per).forEach((key, i) => {
    const cx = rx + (i % COLS) * (cw + 4);
    const cy = y + 12 + Math.floor(i / COLS) * (ch + 4);
    const got = seen.has(key);
    ctx.fillStyle = got ? '#fffaf6' : '#f8f2f6';
    roundRect(ctx, cx, cy, cw, ch, 7);
    ctx.fill();
    ctx.strokeStyle = got ? '#f6c8d8' : '#ece0ea';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (!got) {
      text(ctx, '?', cx + cw / 2, cy + 22, { size: 13, bold: true, align: 'center', color: '#dccbd8' });
    } else if (DRAWN.has(win.page)) {
      ctx.save();
      roundRect(ctx, cx + 1, cy + 1, cw - 2, ch - 2, 6);
      ctx.clip();
      // (The whole Mochi, standing in its card.)
      ctx.translate(cx + cw / 2, cy + ch - 3);
      ctx.scale(1.45, 1.45);
      drawMochiAnim(ctx, modelOf(win.page, key), 0, 0, world.now);
      ctx.restore();
    } else {
      icon(ctx, page.icon, cx + cw / 2, cy + 13, 10, '#ff8fb8');
      text(ctx, fit(ctx, page.label(key), cw - 4, 6, true), cx + cw / 2, cy + 30, { size: 6, bold: true, align: 'center' });
    }
    if (hover(ui, cx, cy, cw, ch)) tooltip(ui, [{ text: got ? page.label(key) : 'Not raised yet', bold: true }, ...(got && win.page === 'voices' ? [{ text: 'Click to hear it', color: COLORS.muted }] : [])]);
    if (got && win.page === 'voices' && clicked(ui, cx, cy, cw, ch)) sfx('mochiVoice', { style: key, mood: 'happy' });
  });
  if (pages > 1) {
    const py = y + 12 + ROWS * (ch + 4) + 1;
    if (button(ui, rx, py, 22, 13, '<', { size: 7, enabled: win.scroll > 0 })) win.scroll -= 1;
    text(ctx, `${win.scroll + 1} / ${pages}`, rx + rw / 2, py + 9.5, { size: 6.5, align: 'center', color: COLORS.muted });
    if (button(ui, rx + rw - 22, py, 22, 13, '>', { size: 7, enabled: win.scroll < pages - 1 })) win.scroll += 1;
  }
  // ---- Its rewards.
  const by = win.y + H - 30;
  milestones(char, win.page).forEach((m, i) => {
    const bx = rx + i * (rw / 2 + 2);
    const bw = rw / 2 - 2;
    const words = `${i ? 'Complete' : 'Half full'}: ${m.reward.gold.toLocaleString()} gold${m.reward.item ? ' + Star Egg' : ''}`;
    if (m.claimed) {
      ctx.fillStyle = '#eef8ea';
      roundRect(ctx, bx, by, bw, 20, 7);
      ctx.fill();
      icon(ctx, 'check', bx + 9, by + 10, 8, '#62c072');
      text(ctx, fit(ctx, words, bw - 20, 6, true), bx + 17, by + 12.6, { size: 6, bold: true, color: '#4a9a5a' });
    } else if (button(ui, bx, by, bw, 20, m.reached ? 'Claim!' : `${m.need - seen.size} to go`, { primary: m.reached, enabled: m.reached, size: 7, iconName: 'gift' })) {
      const r = claimAlbum(char, win.page);
      if (r) {
        world.log(`Album reward: ${r.gold.toLocaleString()} gold${r.item ? ' and a Star Egg' : ''}!`, '#ffd75e');
        sfx('buy');
      }
    }
    if (!m.claimed && hover(ui, bx, by, bw, 20)) tooltip(ui, [{ text: words, bold: true }]);
  });
}
