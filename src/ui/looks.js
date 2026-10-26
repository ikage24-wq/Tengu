// The look picker shared by the character creator and Lulu's salon. Looks are grouped in tabs
// (Hair, Face, Outfit); each row is either a grid of live thumbnails (every hairstyle drawn on
// your own head in your own colours, every eye style and expression on your own face, every
// outfit on your own body) or a row of colour swatches. Picking one is a single click.

import { drawHero, HAIR_STYLES, PICKABLE_EYE_STYLES, FACE_STYLES, OUTFIT_STYLES, BROW_STYLES, EAR_STYLES } from '../render/hero.js';
import { COLORS, THEMES, text, box, hover, clicked, roundRect, tooltip } from './kit.js';

// Palettes: soft pastels first, then naturals and deeper tones, so every skin and hair pairing
// has a good match. Saves hold the hex itself, so adding tones never breaks an old save.
export const HAIR_COLORS = ['#e9ebfa', '#fff1c2', '#f5c95c', '#ffb38a', '#ff9ec0', '#ff7a8a', '#b9a7ff', '#8fd3ff', '#7fd8c4', '#9be08f', '#c97a4a', '#7a5238', '#3b3650', '#1f1b2b'];
export const SKIN_TONES = ['#fff4ee', '#fff0e6', '#fbd9bf', '#f0c4a0', '#e7b48f', '#c98e66', '#a8704a', '#8a5a3c', '#5c3a28'];
export const EYE_COLORS = ['#4fcfb8', '#3f9f5f', '#5aa8ff', '#2f5fbf', '#9b6cff', '#d06cff', '#ff6b8a', '#e8a23c', '#7a4a2b', '#8a8aa8'];
export const OUTFIT_COLORS = ['#ffc2d6', '#ff9a9a', '#ffd0a8', '#fff3a6', '#bff0dc', '#a8e0a0', '#bfe0ff', '#8fb8ff', '#e0cfff', '#ffffff', '#5d5285', '#3a3448'];

export const LOOK_OPTIONS = [
  { key: 'hairStyle', label: 'Hair', options: HAIR_STYLES },
  { key: 'hairColor', label: 'Hair color', options: HAIR_COLORS, color: true },
  { key: 'eyeStyle', label: 'Eyes', options: PICKABLE_EYE_STYLES },
  { key: 'browStyle', label: 'Brows', options: BROW_STYLES },
  { key: 'face', label: 'Expression', options: FACE_STYLES },
  { key: 'eyeColor', label: 'Eye color', options: EYE_COLORS, color: true },
  { key: 'earStyle', label: 'Ears', options: EAR_STYLES },
  { key: 'skinTone', label: 'Skin', options: SKIN_TONES, color: true },
  { key: 'outfit', label: 'Outfit', options: OUTFIT_STYLES },
  { key: 'outfitColor', label: 'Outfit color', options: OUTFIT_COLORS, color: true },
];
const OPTION = Object.fromEntries(LOOK_OPTIONS.map((o) => [o.key, o]));

// What each tab holds. `thumb` says how a style is previewed: the head, the face close up, or
// the whole body.
export const LOOK_TABS = [
  { label: 'Hair', rows: [{ key: 'hairStyle', label: 'Style', thumb: 'head' }, { key: 'hairColor', label: 'Color' }] },
  { label: 'Eyes', rows: [{ key: 'eyeStyle', label: 'Eyes', thumb: 'face' }, { key: 'browStyle', label: 'Brows', thumb: 'brow' }, { key: 'eyeColor', label: 'Eye color' }] },
  { label: 'Face', rows: [{ key: 'face', label: 'Expression', thumb: 'face' }, { key: 'earStyle', label: 'Ears', thumb: 'ears' }, { key: 'skinTone', label: 'Skin' }] },
  { label: 'Outfit', rows: [{ key: 'outfit', label: 'Style', thumb: 'body' }, { key: 'outfitColor', label: 'Color' }] },
];

export const sameLook = (a, b) => LOOK_OPTIONS.every((o) => a?.[o.key] === b?.[o.key]);

export function randomLook(rng = Math.random) {
  const look = {};
  for (const opt of LOOK_OPTIONS) look[opt.key] = opt.options[Math.floor(rng() * opt.options.length)];
  return look;
}

// Display names for the styles whose ids aren't plain words.
const NAMES = { elf: 'Elf', long: 'Long elf', pointed: 'Pointed', droopy: 'Droopy elf', none: 'Hidden', soft: 'Soft', round: 'Round', thick: 'Thick', thin: 'Thin', arched: 'Arched', sharp: 'Sharp', eyecover: 'Covered eye', ahoge: 'Ahoge', hime: 'Hime cut', odango: 'Odango buns', drills: 'Drill curls', curtain: 'Curtain bangs', quiff: 'Quiff', wolf: 'Wolf cut', sweep: 'Side sweep', pixie: 'Pixie cut', fluffy: 'Fluffy', halfup: 'Half-up', lowtails: 'Low twintails' };
export const styleName = (id) => NAMES[id] ?? String(id).charAt(0).toUpperCase() + String(id).slice(1);

// Where a thumbnail looks, in hero units from the feet: the point to centre and how much of the
// hero fits across the cell.
const FRAMES = {
  head: { y: -27.5, span: 30 },
  face: { y: -22, span: 18 },
  // Brows sit up under the bangs, so their thumbnail looks higher and closer.
  brow: { y: -26, span: 14 },
  // Ears: the whole head, wide enough for long elf ears.
  ears: { y: -24.5, span: 36 },
  body: { y: -10.5, span: 25 },
};

function thumb(ctx, look, kind, x, y, s, time) {
  const f = FRAMES[kind];
  const k = s / f.span;
  ctx.save();
  roundRect(ctx, x + 1, y + 1, s - 2, s - 2, 5);
  ctx.clip();
  // A soft floor of light behind the head, so pale hair still reads on the white cell.
  const g = ctx.createRadialGradient(x + s / 2, y + s * 0.4, 1, x + s / 2, y + s * 0.4, s * 0.7);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#f1e6fb');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, s, s);
  drawHero(ctx, look, null, x + s / 2, y + s / 2 - f.y * k, { pose: 'idle', time, scale: k, seed: 0 });
  ctx.restore();
}

// Draws the rows of one tab inside (x, y, w) and returns { look, h }: the look after any pick,
// and the height used. `cell` sizes the thumbnails (swatches are about 60% of it).
export function lookRows(ui, look, tab, x, y, w, { cell = 30, time = 0, gap = 3 } = {}) {
  const { ctx } = ui;
  const th = ui.theme ?? THEMES.pink;
  let out = look;
  let cy = y;
  for (const row of LOOK_TABS[tab].rows) {
    const opt = OPTION[row.key];
    const value = out[row.key];
    text(ctx, row.label, x + 2, cy + 8, { size: 8, bold: true, color: th.ink });
    if (!opt.color) text(ctx, styleName(value), x + w - 2, cy + 8, { size: 8, align: 'right', color: COLORS.muted });
    cy += 12;
    const s = opt.color ? Math.min(19, Math.round(cell * 0.6)) : cell;
    const step = s + gap;
    const per = Math.max(1, Math.floor((w + gap) / step));
    opt.options.forEach((o, i) => {
      const cx = x + (i % per) * step;
      const ry = cy + Math.floor(i / per) * step;
      const on = o === value;
      const hot = hover(ui, cx, ry, s, s);
      if (opt.color) {
        // A round swatch; the chosen one gets a ring in the window's colour.
        const r = s / 2;
        if (on || hot) {
          ctx.fillStyle = on ? th.main : th.light;
          ctx.beginPath();
          ctx.arc(cx + r, ry + r, r + (on ? 1.5 : 1), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + r, ry + r, r - 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = o;
        ctx.beginPath();
        ctx.arc(cx + r, ry + r, r - 2, 0, Math.PI * 2);
        ctx.fill();
        // A little gloss so pale swatches don't vanish into the white.
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(cx + r - r * 0.25, ry + r - r * 0.3, r * 0.35, r * 0.22, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(90,63,122,0.25)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.arc(cx + r, ry + r, r - 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        box(ctx, cx, ry, s, s, { fill: '#ffffff', edge: on ? th.main : hot ? th.light : COLORS.cellEdge, r: 6, width: on ? 2 : 1 });
        // Thumbnails show your look with just this one thing swapped in.
        // Expressions play out live; the rest hold still (at a moment clear of a blink).
        // Eye styles are shown on a plain smile, since some expressions close the eyes.
        thumb(ctx, { ...out, ...(row.key === 'eyeStyle' ? { face: 'smile' } : null), [row.key]: o }, row.thumb, cx, ry, s, row.key === 'face' ? time : 1);
        if (on) {
          box(ctx, cx, ry, s, s, { fill: null, edge: th.main, r: 6, width: 2 });
          ctx.fillStyle = th.main;
          ctx.beginPath();
          ctx.arc(cx + s - 4, ry + 4, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx + s - 5.6, ry + 4);
          ctx.lineTo(cx + s - 4.4, ry + 5.2);
          ctx.lineTo(cx + s - 2.4, ry + 2.8);
          ctx.stroke();
        }
        if (hot) tooltip(ui, [{ text: styleName(o), bold: true }]);
      }
      if (clicked(ui, cx, ry, s, s)) out = { ...out, [row.key]: o };
    });
    cy += Math.ceil(opt.options.length / per) * step + 5;
  }
  return { look: out, h: cy - y };
}
