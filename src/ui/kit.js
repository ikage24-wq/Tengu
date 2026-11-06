// A tiny immediate-mode UI kit with a candy-pastel look. Each frame: beginUi(), draw widgets, endUi().
// Widgets return true when clicked. Clicks a widget uses are marked so the game ignores them.
//
// Windows come in color themes (pink, peach, lavender, mint, sky, gold) with an icon badge, a
// scalloped title ribbon, a cream body, and a soft shadow. Buttons are glossy candy
// with a lip that presses down; bars are glossy capsules with a shine that sweeps across.

import { sfx } from '../audio/sfx.js';
import { settings, saveSettings } from '../core/settings.js';
import { RARITIES } from '../data/items.js';
import { drawItemIcon } from '../render/icons.js';

// Nunito (Google Fonts, loaded by index.html) has the rounded strokes of the candy look and reads
// well down to 6 px; the system fonts stand in until it arrives or when offline. Regular text is
// weight 500 and bold 800: fallback fonts round those to their own regular and bold.
export const FONT = 'Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';

// A canvas font string in the UI family.
export function font(size, bold = false) {
  return `${bold ? 800 : 500} ${size}px ${FONT}`;
}

// Ask for the web font early, so the first frames that draw text don't each trigger a load.
if (typeof document !== 'undefined' && document.fonts?.load) {
  for (const w of [500, 800]) document.fonts.load(`${w} 10px Nunito`).catch(() => {});
}

export const COLORS = {
  panel: '#fffaf6',
  panelEdge: '#d8a8cc',
  title: '#ffb8dc',
  title2: '#f5b8d0',
  ink: '#5a3f7a',
  muted: '#a88a9e',
  accent: '#ff8fc1',
  good: '#4fbf72',
  bad: '#ff6b8a',
  gold: '#e8a23c',
  cell: '#fbf1f4',
  cellEdge: '#ecd6e4',
  select: '#ffd84f',
  hp: '#ff6b8a',
  mp: '#6fb8ff',
  exp: '#ffd66b',
};

// Window color themes: main tint, a light wash, a dark edge, and a deep ink for outlines.
export const THEMES = {
  pink: { main: '#ff8fc1', light: '#ffd6ea', dark: '#e0659f', ink: '#a8467a' },
  peach: { main: '#ffab7a', light: '#ffe2cf', dark: '#e98450', ink: '#a85a2f' },
  // (Warmed toward orchid and honey: the scrapbook's palette leans warm, with blue kept for MP.)
  lavender: { main: '#cf8ad8', light: '#f4dcf4', dark: '#ad62bb', ink: '#7a3a84' },
  mint: { main: '#5fd3a0', light: '#d2f5e4', dark: '#3fb383', ink: '#2a7f5c' },
  sky: { main: '#f0b45a', light: '#fde8c4', dark: '#d18f32', ink: '#8a5414' },
  gold: { main: '#ffc94f', light: '#fff0c4', dark: '#e0a52f', ink: '#9a6a12' },
  ruby: { main: '#ff4f8a', light: '#ffd3e4', dark: '#d12e68', ink: '#86204a' },
};

// One fixed style per label role, so the same kind of text always looks the same. Pass
// `{ role: 'secondary' }` to text() and wrap(); other options override the role.
export const TEXT = {
  heading: { size: 10, bold: true },
  subheading: { size: 9, bold: true },
  body: { size: 8.5 },
  emphasis: { size: 8.5, bold: true, color: COLORS.accent },
  secondary: { size: 7.5, color: COLORS.muted },
  minor: { size: 6.5, color: COLORS.muted },
  positive: { size: 8, bold: true, color: COLORS.good },
  negative: { size: 8, bold: true, color: COLORS.bad },
  button: { size: 9, bold: true },
  tab: { size: 8, bold: true },
  action: { size: 8, bold: true, color: COLORS.accent },
  value: { size: 8, bold: true },
};

const now = () => performance.now() / 1000;

// Device pixels per UI pixel this frame, so text can sit on whole device pixels and stay crisp.
let px = 1;

// On a phone small text is held to a readable size (7.5 game pixels is about 8 on a phone held
// sideways); the layouts drop their secondary lines there instead of shrinking them.
let minText = 0;
export const touchText = () => minText > 0;

export function beginUi(ctx, input) {
  px = ctx.getTransform?.().a || 1;
  minText = input?.touch ? 7.5 : 0;
  return { ctx, input, mouse: input.mouse, used: false, tooltip: null, dragging: null };
}

const snap = (v) => Math.round(v * px) / px;

export function hover(ui, x, y, w, h) {
  const m = ui.mouse;
  return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h;
}

// True when the mouse was clicked inside the box this frame. Marks the click as used.
export function clicked(ui, x, y, w, h) {
  if (ui.mouse.clicked && hover(ui, x, y, w, h)) {
    ui.used = true;
    ui.mouse.clicked = false;
    sfx('click');
    return true;
  }
  return false;
}

export function text(ctx, str, x, y, opts = {}) {
  const o = opts.role ? { ...TEXT[opts.role], ...opts } : opts;
  const { color = COLORS.ink, align = 'left', bold = false, outline = null } = o;
  const size = Math.max(o.size ?? 9, minText);
  ctx.font = font(size, bold);
  ctx.textAlign = align;
  x = snap(x);
  y = snap(y);
  ctx.textBaseline = 'alphabetic';
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size / 4);
    ctx.strokeStyle = outline;
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

// The font text() draws a label of `size` in (held to the phone's readable size), for measuring
// a label before drawing it, so pills and underlines fit the words they hold.
export function textFont(size, bold = false) {
  return font(Math.max(size, minText), bold);
}

// Shortens text with an ellipsis to fit `w` pixels.
export function fit(ctx, s, w, size, bold = true) {
  ctx.font = font(Math.max(size, minText), bold);
  if (ctx.measureText(s).width <= w) return s;
  while (s.length > 3 && ctx.measureText(`${s}…`).width > w) s = s.slice(0, -1);
  return `${s}…`;
}

// How many lines `wrap` would break text into at `width` (to size a box to its words).
export function wrapCount(ctx, str, width, opts = {}) {
  const size = Math.max(opts.size ?? 9, minText);
  ctx.font = font(size, opts.bold ?? false);
  let line = '';
  let n = 0;
  for (const word of String(str ?? '').split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      n++;
      line = word;
    } else line = test;
  }
  return n + (line ? 1 : 0);
}

// Wraps text to `width`; returns the y after the last line. `chars` limits how many characters
// show, for typewriter text.
export function wrap(ctx, str, x, y, width, opts = {}) {
  const o = opts.role ? { ...TEXT[opts.role], ...opts } : opts;
  const { color = COLORS.ink, bold = false, chars = Infinity } = o;
  const size = Math.max(o.size ?? 9, minText);
  const lineHeight = Math.max(o.lineHeight ?? size + 3, size + 1.5);
  ctx.font = font(size, bold);
  let line = '';
  let shown = 0;
  const lines = [];
  for (const word of str.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  for (const l of lines) {
    const visible = l.slice(0, Math.max(0, chars - shown));
    shown += l.length + 1;
    if (visible) text(ctx, visible, x, y, { size, color, bold });
    y += lineHeight;
  }
  return y;
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function box(ctx, x, y, w, h, { fill = COLORS.panel, edge = COLORS.panelEdge, r = 6, width = 1.5, plain = false } = {}) {
  // (Scrapbook: anything card-sized is cut from paper by hand, a slight wobble and gentler
  // corners; thin pills and bars stay smooth so they read cleanly. The wobble comes from the
  // card's own size, so it never shimmers or changes as a window is dragged.)
  if (!plain && h >= 14 && w >= 20) roughRect(ctx, x, y, w, h, Math.min(r, 6), Math.round(w * 3 + h * 7) % 61, Math.min(0.6, h / 30));
  else roundRect(ctx, x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

// A cheap soft shadow: two translucent rounded rects offset below the shape (canvas blur is
// slow).
export function softShadow(ctx, x, y, w, h, r, dy = 4) {
  ctx.fillStyle = 'rgba(90,50,120,0.12)';
  roundRect(ctx, x - 1, y + dy - 1, w + 2, h + 2, r + 1);
  ctx.fill();
  ctx.fillStyle = 'rgba(90,50,120,0.14)';
  roundRect(ctx, x + 1, y + dy, w - 2, h, r);
  ctx.fill();
}


// ---------- The scrapbook look (the player's pick for the whole UI, 2026-11-05) ----------
// Windows are pages of a hero's scrapbook: cream paper with a hand-drawn rim, held on by washi
// tape, with pencil doodles in the margins and stickers for badges and buttons. Every wobble is
// fixed by the shape's own size and place (never random per frame), so nothing shimmers.

// A rounded rectangle traced by hand: each edge bows and wobbles a little.
export function roughRect(ctx, x, y, w, h, r = 6, seed = 0, amp = 0.7) {
  const wob = (k) => Math.sin(seed * 1.7 + k * 2.3) * amp + Math.sin(seed * 0.9 + k * 5.1) * amp * 0.5;
  const pts = [];
  const side = (x0, y0, x1, y1, n, k0) => {
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const nx = -(y1 - y0);
      const ny = x1 - x0;
      const len = Math.hypot(nx, ny) || 1;
      const d = wob(k0 + i) * Math.sin(u * Math.PI);
      pts.push([x0 + (x1 - x0) * u + (nx / len) * d, y0 + (y1 - y0) * u + (ny / len) * d]);
    }
  };
  const n = (len) => Math.max(2, Math.round(len / 18));
  ctx.beginPath();
  side(x + r, y, x + w - r, y, n(w), 0);
  pts.push([x + w - r * 0.3, y + r * 0.3]);
  side(x + w, y + r, x + w, y + h - r, n(h), 20);
  pts.push([x + w - r * 0.3, y + h - r * 0.3]);
  side(x + w - r, y + h, x + r, y + h, n(w), 40);
  pts.push([x + r * 0.3, y + h - r * 0.3]);
  side(x, y + h - r, x, y + r, n(h), 60);
  pts.push([x + r * 0.3, y + r * 0.3]);
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i % pts.length];
    ctx.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2);
  }
  ctx.closePath();
}

// A sheet of paper lying on the scene: a soft offset shadow, the cream sheet, a hand-drawn rim.
export function paper(ctx, x, y, w, h, { fill = '#fffbf2', edge = '#8a6a9a', r = 6, seed = 0, shadow = true, width = 1.6 } = {}) {
  if (shadow) {
    ctx.fillStyle = 'rgba(70,40,90,0.22)';
    roughRect(ctx, x + 2.5, y + 3.5, w, h, r, seed + 3, 0.6);
    ctx.fill();
  }
  ctx.fillStyle = fill;
  roughRect(ctx, x, y, w, h, r, seed, 0.6);
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

// A strip of washi tape: translucent, its two ends torn in a zigzag, striped or dotted.
export function tape(ctx, cx, cy, w, h, angle, color, { pattern = 'stripes', alpha = 0.85 } = {}) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const half = w / 2;
  const zig = 2.2;
  ctx.beginPath();
  ctx.moveTo(-half, -h / 2);
  ctx.lineTo(half, -h / 2);
  for (let k = 0; k <= 4; k++) ctx.lineTo(half + (k % 2 ? -zig : 0), -h / 2 + (h * k) / 4);
  ctx.lineTo(-half, h / 2);
  for (let k = 4; k >= 0; k--) ctx.lineTo(-half + (k % 2 ? zig : 0), -h / 2 + (h * k) / 4);
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  if (pattern === 'stripes') {
    for (let sx = -half - h; sx < half; sx += 7) {
      ctx.beginPath();
      ctx.moveTo(sx, h / 2);
      ctx.lineTo(sx + 3, h / 2);
      ctx.lineTo(sx + 3 + h, -h / 2);
      ctx.lineTo(sx + h, -h / 2);
      ctx.fill();
    }
  } else {
    for (let sx = -half + 3; sx < half; sx += 6) for (let sy = -h / 2 + 3; sy < h / 2; sy += 5) {
      ctx.beginPath();
      ctx.arc(sx + ((sy * 7) % 3), sy, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// A pencil doodle in a margin: a star, a heart, a swirl or a little sparkle burst.
export function doodle(ctx, kind, x, y, s, color, t = 0) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 1.6 + x * 0.1) * 0.6);
  ctx.rotate(Math.sin(t * 1.1 + y * 0.1) * 0.08);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'star') {
    for (let k = 0; k <= 10; k++) {
      const r = k % 2 ? s * 0.42 : s;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  } else if (kind === 'heart') {
    ctx.moveTo(0, s * 0.8);
    ctx.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.6, -s, 0, -s * 0.35);
    ctx.bezierCurveTo(s * 0.6, -s, s * 1.3, -s * 0.1, 0, s * 0.8);
  } else if (kind === 'swirl') {
    for (let k = 0; k < 28; k++) {
      const a = k * 0.42;
      const r = (k / 28) * s;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  } else {
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 4;
      ctx.moveTo(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35);
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.moveTo(-Math.cos(a) * s * 0.35, -Math.sin(a) * s * 0.35);
      ctx.lineTo(-Math.cos(a) * s, -Math.sin(a) * s);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// A round sticker: a white die-cut border round a coloured disc, lying a little lifted.
export function sticker(ctx, x, y, r, fill, { edge = null, lift = 1.2 } = {}) {
  ctx.fillStyle = 'rgba(70,40,90,0.25)';
  ctx.beginPath();
  ctx.arc(x + 0.6, y + lift, r + 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r + 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Photo corners: four little paper triangles holding a picture (or an item cell) in place.
export function photoCorners(ctx, x, y, w, h, color, k = 4) {
  ctx.fillStyle = color;
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx * k, cy - dy);
    ctx.lineTo(cx - dx, cy + dy * k);
    ctx.closePath();
    ctx.fill();
  }
}

// An inset well for grouping content inside a window.
// (Scrapbook: a card pasted onto the page, white with a pencil rim in the theme's colour.)
export function well(ctx, x, y, w, h, theme = THEMES.pink, r = 10) {
  const seed = Math.round(w * 2 + h) % 37;
  ctx.fillStyle = 'rgba(70,40,90,0.1)';
  roughRect(ctx, x + 1, y + 1.5, w, h, Math.min(r, 6), seed + 1, 0.5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roughRect(ctx, x, y, w, h, Math.min(r, 6), seed, 0.5);
  ctx.fill();
  ctx.strokeStyle = theme.dark;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// The plate behind a skill icon, centered on (x, y) with radius r. Its shape says what kind of
// skill it is: a circle for passives, a square with cut corners for buffs, and a rounded square
// for skills you cast.
export function skillPlate(ctx, x, y, r, kind, fill, edge) {
  ctx.beginPath();
  if (kind === 'passive') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (kind === 'buff') {
    const c = r * 0.42;
    ctx.moveTo(x - r + c, y - r);
    ctx.lineTo(x + r - c, y - r);
    ctx.lineTo(x + r, y - r + c);
    ctx.lineTo(x + r, y + r - c);
    ctx.lineTo(x + r - c, y + r);
    ctx.lineTo(x - r + c, y + r);
    ctx.lineTo(x - r, y + r - c);
    ctx.lineTo(x - r, y - r + c);
    ctx.closePath();
  } else roundRect(ctx, x - r, y - r, r * 2, r * 2, r * 0.45);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // A top-left inner highlight, like the candy buttons.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x - r, y - r, r * 2, r * 0.6);
  ctx.restore();
}

// A slot's depth as 1 px edge lines: a white lip along the top and a soft shade along the bottom,
// so an item cell reads as a little recess without any blur.
export function slotEdges(ctx, x, y, w, h, r = 4) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(x, y + 1, w, 1);
  ctx.fillStyle = 'rgba(110,70,140,0.13)';
  ctx.fillRect(x, y + h - 2, w, 1.5);
  ctx.restore();
}

// The little ground shadow an item sits on in the bag (centered at x, on the line y).
export function itemShadow(ctx, x, y) {
  ctx.fillStyle = 'rgba(90,50,120,0.16)';
  ctx.beginPath();
  ctx.ellipse(x, y, 5.5, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Rarity on an item cell, drawn over the icon: a tint washing in from the corners for Epic and
// up, and a shine that sweeps across Legendary items every couple of seconds.
export function rarityCell(ctx, x, y, w, h, color, tier, r = 4) {
  if (!color || tier < 1) return;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  // (The icon redraw: rare items glow too, softly; Epic and up glow more, and breathe.)
  const breathe = tier >= 2 ? 0.85 + 0.15 * Math.sin(now() * 2 + x * 0.05) : 1;
  for (const [cx, cy] of [[x, y], [x + w, y + h]]) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = (tier >= 2 ? 0.4 : 0.22) * breathe;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  if (tier >= 3) {
    const k = (now() * 0.45 + x * 0.003) % 1.3;
    if (k < 1) {
      const sx = x - h + k * (w + h * 2);
      ctx.globalAlpha = 0.7 * Math.sin(k * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + h, y);
      ctx.lineTo(sx + h + 3, y);
      ctx.lineTo(sx + 3, y + h);
      ctx.fill();
    }
  }
  ctx.restore();
}

// One item cell, drawn the same everywhere items show (bag, equipment, shops, rewards): a cream
// cell with a lit top edge, the item on its little ground shadow (lifted a pixel when hovered),
// rarity as an inner ring in its color (Epic and up also glow from the corners, Legendary
// shines), and the stack count and upgrade level in the corners. An empty cell can show a
// greyed `ghost` of what goes there. `state`: null, 'hot', 'selected', or 'target' (a drop spot).
export function itemSlot(ctx, x, y, s, item, { state = null, edge = '#eadcf3', fill = '#fffdfb', ghost = null, r = 7, scale = 1, shadow = true, count = true } = {}) {
  const sel = state === 'selected' || state === 'target';
  box(ctx, x, y, s, s, { fill: state === 'target' ? '#fff6d0' : sel ? '#fff3c4' : state === 'hot' && item ? '#ffffff' : fill, edge: sel ? COLORS.select : edge, r, width: sel ? 2 : 1 });
  slotEdges(ctx, x, y, s, s, r);
  // (Scrapbook: an item picked or under the mouse is held in by photo corners.)
  if (item && (sel || state === 'hot')) photoCorners(ctx, x + 0.5, y + 0.5, s - 1, s - 1, sel ? '#c89a3a' : '#b89ad0', Math.max(3, s * 0.2));
  const isz = 16 * scale;
  const ix = Math.round(x + (s - isz) / 2);
  const iy = Math.round(y + (s - isz) / 2);
  if (!item) {
    if (ghost) {
      // A greyed outline of what belongs here.
      ctx.save();
      ctx.globalAlpha = 0.2;
      if ('filter' in ctx) ctx.filter = 'grayscale(1) brightness(1.1)';
      drawItemIcon(ctx, ghost, ix, iy, scale);
      ctx.restore();
    }
    return;
  }
  const tier = item.rarity ?? 0;
  const rc = RARITIES[tier]?.color;
  if (shadow) itemShadow(ctx, x + s / 2, iy + isz - 1);
  // (The UI redraw: a hovered item hops up on a little spring instead of a one-pixel lift.)
  const hop = state === 'hot' ? 1 + Math.abs(Math.sin(now() * 7)) * 1.4 : 0;
  drawItemIcon(ctx, item.id, ix, iy - hop, scale, item.variant ?? null);
  if (rc) {
    rarityCell(ctx, x, y, s, s, rc, tier, r);
    ctx.save();
    ctx.globalAlpha = 0.9;
    roundRect(ctx, x + 1.75, y + 1.75, s - 3.5, s - 3.5, Math.max(1, r - 1.5));
    ctx.strokeStyle = rc;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // Rare and better items twinkle in their top corner now and then.
    if (tier >= 1) {
      const k = Math.sin(now() * 2.2 + x * 0.07 + y * 0.05);
      if (k > 0.6) {
        ctx.globalAlpha = (k - 0.6) / 0.4;
        sparkle(ctx, x + s - 4.5, y + 4.5, 1.6 + (k - 0.6) * 4, '#ffffff');
        ctx.globalAlpha = 1;
      }
    }
  }
  if (count && item.qty > 1) text(ctx, `${item.qty}`, x + s - 2.5, y + s - 2.5, { size: 7, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
}

// A four-pointed twinkle.
export function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// ---------- Icons ----------
// Little vector icons for window badges and menu buttons, drawn centered on (x, y) in a box `s`
// wide.

// The colour of an icon's cut-out details (a gift's ribbon, a shop's door): white on an inked
// icon, and a soft violet shade when the icon itself is drawn in white (a lit menu bubble), so the
// detail never vanishes into the shape around it.
let iconInk = '#000000';
function cutout() {
  return /^#fff(fff)?$/i.test(String(iconInk)) ? 'rgba(90,63,122,0.45)' : '#ffffff';
}

const ICONS = {
  bag(ctx, s) {
    roundRect(ctx, -s * 0.38, -s * 0.18, s * 0.76, s * 0.6, s * 0.14);
    ctx.fill();
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.arc(0, -s * 0.18, s * 0.18, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = cutout();
    ctx.fillRect(-s * 0.1, -s * 0.02, s * 0.2, s * 0.12);
  },
  star(ctx, s) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = (i % 2 ? 0.2 : 0.46) * s;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  },
  book(ctx, s) {
    roundRect(ctx, -s * 0.4, -s * 0.34, s * 0.8, s * 0.68, s * 0.08);
    ctx.fill();
    ctx.fillStyle = cutout();
    ctx.fillRect(-s * 0.03, -s * 0.28, s * 0.06, s * 0.56);
    ctx.fillRect(-s * 0.3, -s * 0.16, s * 0.2, s * 0.05);
    ctx.fillRect(-s * 0.3, -s * 0.04, s * 0.2, s * 0.05);
    ctx.fillRect(s * 0.1, -s * 0.16, s * 0.2, s * 0.05);
  },
  scroll(ctx, s) {
    roundRect(ctx, -s * 0.3, -s * 0.38, s * 0.6, s * 0.76, s * 0.08);
    ctx.fill();
    ctx.fillRect(-s * 0.4, -s * 0.42, s * 0.8, s * 0.14);
    ctx.fillRect(-s * 0.4, s * 0.28, s * 0.8, s * 0.14);
    ctx.fillStyle = cutout();
    for (let i = 0; i < 3; i++) ctx.fillRect(-s * 0.18, -s * 0.18 + i * s * 0.14, s * 0.36, s * 0.05);
  },
  map(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.3);
    ctx.lineTo(-s * 0.14, -s * 0.4);
    ctx.lineTo(s * 0.14, -s * 0.3);
    ctx.lineTo(s * 0.42, -s * 0.4);
    ctx.lineTo(s * 0.42, s * 0.3);
    ctx.lineTo(s * 0.14, s * 0.4);
    ctx.lineTo(-s * 0.14, s * 0.3);
    ctx.lineTo(-s * 0.42, s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cutout();
    ctx.beginPath();
    ctx.arc(s * 0.02, -s * 0.04, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
  },
  heart(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.38);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.02, -s * 0.28, -s * 0.5, 0, -s * 0.18);
    ctx.bezierCurveTo(s * 0.28, -s * 0.5, s * 0.6, -s * 0.02, 0, s * 0.38);
    ctx.fill();
  },
  drop(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.44);
    ctx.quadraticCurveTo(s * 0.4, s * 0.02, s * 0.3, s * 0.2);
    ctx.arc(0, s * 0.14, s * 0.3, 0.2, Math.PI - 0.2);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.02, 0, -s * 0.44);
    ctx.fill();
  },
  // A sprouting leaf (life skills): a plump leaf on a curled stem, its vein cut out.
  leaf(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, s * 0.4);
    ctx.bezierCurveTo(-s * 0.46, -s * 0.12, -s * 0.02, -s * 0.46, s * 0.42, -s * 0.42);
    ctx.bezierCurveTo(s * 0.44, s * 0.02, s * 0.1, s * 0.34, -s * 0.34, s * 0.4);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = s * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, s * 0.26);
    ctx.quadraticCurveTo(0, -s * 0.06, s * 0.3, -s * 0.3);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  },
  flame(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.46);
    ctx.quadraticCurveTo(s * 0.12, -s * 0.12, s * 0.3, -s * 0.06);
    ctx.quadraticCurveTo(s * 0.44, s * 0.18, s * 0.26, s * 0.36);
    ctx.quadraticCurveTo(0, s * 0.5, -s * 0.26, s * 0.36);
    ctx.quadraticCurveTo(-s * 0.44, s * 0.14, -s * 0.18, -s * 0.12);
    ctx.quadraticCurveTo(-s * 0.08, -s * 0.24, 0, -s * 0.46);
    ctx.fill();
  },
  // A paw print (the Beastmaster's Bond): a broad pad and four toes.
  paw(ctx, s) {
    ctx.beginPath();
    ctx.ellipse(0, s * 0.16, s * 0.24, s * 0.2, 0, 0, Math.PI * 2);
    for (const [x, y] of [[-0.3, -0.12], [-0.11, -0.32], [0.11, -0.32], [0.3, -0.12]]) {
      ctx.moveTo(x * s + s * 0.1, y * s);
      ctx.ellipse(x * s, y * s, s * 0.1, s * 0.12, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  },
  // A curl of wind.
  gust(ctx, s) {
    ctx.lineWidth = s * 0.13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.14);
    ctx.lineTo(s * 0.12, -s * 0.14);
    ctx.arc(s * 0.12, -s * 0.28, s * 0.14, Math.PI / 2, -Math.PI * 0.9, true);
    ctx.moveTo(-s * 0.42, s * 0.06);
    ctx.lineTo(s * 0.26, s * 0.06);
    ctx.arc(s * 0.26, s * 0.2, s * 0.14, -Math.PI / 2, Math.PI * 0.9);
    ctx.moveTo(-s * 0.3, s * 0.26);
    ctx.lineTo(-s * 0.02, s * 0.26);
    ctx.stroke();
  },
  // A kite shield with a cross cut into it (the Warrior's Valor).
  shield(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, -s * 0.38);
    ctx.lineTo(s * 0.36, -s * 0.38);
    ctx.lineTo(s * 0.34, s * 0.04);
    ctx.quadraticCurveTo(s * 0.22, s * 0.32, 0, s * 0.46);
    ctx.quadraticCurveTo(-s * 0.22, s * 0.32, -s * 0.34, s * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cutout();
    ctx.fillRect(-s * 0.06, -s * 0.28, s * 0.12, s * 0.56);
    ctx.fillRect(-s * 0.24, -s * 0.1, s * 0.48, s * 0.12);
  },
  // A torii gate: two posts, a crossbeam, and the top lintel curving up at the ends (the Shrine
  // Maiden's Grace).
  torii(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.48, -s * 0.4);
    ctx.quadraticCurveTo(0, -s * 0.28, s * 0.48, -s * 0.4);
    ctx.lineTo(s * 0.42, -s * 0.24);
    ctx.quadraticCurveTo(0, -s * 0.16, -s * 0.42, -s * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-s * 0.36, -s * 0.08, s * 0.72, s * 0.1);
    ctx.fillRect(-s * 0.3, -s * 0.22, s * 0.11, s * 0.68);
    ctx.fillRect(s * 0.19, -s * 0.22, s * 0.11, s * 0.68);
  },
  // The seiman, onmyodo's five-pointed star, in a ring (the Onmyoji's Binding).
  seiman(ctx, s) {
    ctx.save();
    ctx.lineWidth = s * 0.1;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = ((-90 + k * 144) * Math.PI) / 180;
      if (k) ctx.lineTo(Math.cos(a) * s * 0.38, Math.sin(a) * s * 0.38);
      else ctx.moveTo(Math.cos(a) * s * 0.38, Math.sin(a) * s * 0.38);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
  // A top hat (the Phantom Trickster's Illusion).
  tophat(ctx, s) {
    ctx.fillRect(-s * 0.48, s * 0.18, s * 0.96, s * 0.14);
    ctx.fillRect(-s * 0.28, -s * 0.42, s * 0.56, s * 0.62);
  },
  // A ringed planet (the Astronomer's Orbit).
  planet(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.lineWidth = s * 0.09;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.15, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
  // A music note, two beamed together (the Starlight Idol's Applause).
  note(ctx, s) {
    for (const [hx, hy] of [[-s * 0.24, s * 0.3], [s * 0.3, s * 0.22]]) {
      ctx.beginPath();
      ctx.ellipse(hx, hy, s * 0.17, s * 0.13, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(hx + s * 0.1, hy - s * 0.62, s * 0.08, s * 0.62);
    }
    ctx.beginPath();
    ctx.moveTo(-s * 0.06, -s * 0.36);
    ctx.lineTo(s * 0.48, -s * 0.46);
    ctx.lineTo(s * 0.48, -s * 0.3);
    ctx.lineTo(-s * 0.06, -s * 0.2);
    ctx.closePath();
    ctx.fill();
  },
  // A five-point star (the Star Witch's Constellation).
  star5(ctx, s) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? s * 0.22 : s * 0.5;
      if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  },
  // A cog (the Arbalist Engineer's Pressure).
  // A crafting hammer (the craft bench): a tilted handle and a chunky head.
  hammer(ctx, s) {
    ctx.save();
    ctx.rotate(-0.6);
    roundRect(ctx, -s * 0.07, -s * 0.12, s * 0.14, s * 0.62, s * 0.06);
    ctx.fill();
    roundRect(ctx, -s * 0.34, -s * 0.42, s * 0.68, s * 0.3, s * 0.08);
    ctx.fill();
    ctx.restore();
  },
  cog(ctx, s) {
    ctx.beginPath();
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r = Math.floor(i / 2) % 2 === 0 ? s * 0.5 : s * 0.38;
      if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.moveTo(s * 0.16, 0);
    ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
  },
  // A chakram: a ring with blade points round it (the Blade Dancer's Ricochet).
  chakram(ctx, s) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.moveTo(Math.cos(a - 0.2) * s * 0.3, Math.sin(a - 0.2) * s * 0.3);
      ctx.lineTo(Math.cos(a + 0.15) * s * 0.5, Math.sin(a + 0.15) * s * 0.5);
      ctx.lineTo(Math.cos(a + 0.3) * s * 0.3, Math.sin(a + 0.3) * s * 0.3);
    }
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.36, 0, Math.PI * 2);
    ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2, true);
    ctx.fill();
  },
  // A wing, three feathers swept up and back (the Sky Dancer's Tailwind).
  wing(ctx, s) {
    for (const [len, a, w] of [[0.9, -0.9, 0.2], [0.78, -0.45, 0.18], [0.62, -0.05, 0.16]]) {
      ctx.save();
      ctx.translate(-s * 0.28, s * 0.3);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(s * len * 0.5, 0, s * len * 0.5, s * w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  // A crescent moon (the Thief's Shadow).
  moon(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.arc(s * 0.2, -s * 0.12, s * 0.34, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
  },
  // A lightning bolt (the Stormcaller's Charge).
  bolt(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(s * 0.12, -s * 0.5);
    ctx.lineTo(-s * 0.26, s * 0.06);
    ctx.lineTo(-s * 0.02, s * 0.06);
    ctx.lineTo(-s * 0.14, s * 0.5);
    ctx.lineTo(s * 0.28, -s * 0.08);
    ctx.lineTo(s * 0.03, -s * 0.08);
    ctx.closePath();
    ctx.fill();
  },
  // A feather (the Archer's Momentum).
  feather(ctx, s) {
    ctx.save();
    ctx.rotate(0.6);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.quadraticCurveTo(s * 0.28, -s * 0.1, s * 0.06, s * 0.36);
    ctx.lineTo(-s * 0.06, s * 0.36);
    ctx.quadraticCurveTo(-s * 0.28, -s * 0.1, 0, -s * 0.5);
    ctx.fill();
    ctx.strokeStyle = cutout();
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.36);
    ctx.lineTo(0, s * 0.5);
    ctx.stroke();
    ctx.restore();
  },
  // A sight: a ring with four ticks and a dot (the Sniper's Focus).
  sight(ctx, s) {
    ctx.lineWidth = s * 0.11;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * s * 0.16, Math.sin(a) * s * 0.16);
      ctx.lineTo(Math.cos(a) * s * 0.46, Math.sin(a) * s * 0.46);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  },
  coin(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-s * 0.06, -s * 0.24, s * 0.12, s * 0.48);
  },
  chat(ctx, s) {
    roundRect(ctx, -s * 0.42, -s * 0.34, s * 0.84, s * 0.56, s * 0.2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, s * 0.18);
    ctx.lineTo(-s * 0.26, s * 0.42);
    ctx.lineTo(s * 0.02, s * 0.2);
    ctx.fill();
  },
  gift(ctx, s) {
    ctx.fillRect(-s * 0.38, -s * 0.12, s * 0.76, s * 0.5);
    ctx.fillRect(-s * 0.44, -s * 0.26, s * 0.88, s * 0.16);
    ctx.lineWidth = s * 0.09;
    ctx.beginPath();
    ctx.ellipse(-s * 0.14, -s * 0.34, s * 0.14, s * 0.08, -0.4, 0, Math.PI * 2);
    ctx.ellipse(s * 0.14, -s * 0.34, s * 0.14, s * 0.08, 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = cutout();
    ctx.fillRect(-s * 0.05, -s * 0.26, s * 0.1, s * 0.64);
  },
  shop(ctx, s) {
    ctx.fillRect(-s * 0.36, -s * 0.05, s * 0.72, s * 0.42);
    ctx.beginPath();
    ctx.moveTo(-s * 0.46, -s * 0.05);
    ctx.lineTo(-s * 0.34, -s * 0.38);
    ctx.lineTo(s * 0.34, -s * 0.38);
    ctx.lineTo(s * 0.46, -s * 0.05);
    ctx.fill();
    ctx.fillStyle = cutout();
    ctx.fillRect(-s * 0.1, s * 0.1, s * 0.2, s * 0.27);
  },
  wand(ctx, s) {
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-s * 0.05, -s * 0.1, s * 0.1, s * 0.55);
    ctx.restore();
    ICONS.star(ctx, s * 0.6);
  },
  crown(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s * 0.3);
    ctx.lineTo(-s * 0.42, -s * 0.25);
    ctx.lineTo(-s * 0.18, 0);
    ctx.lineTo(0, -s * 0.38);
    ctx.lineTo(s * 0.18, 0);
    ctx.lineTo(s * 0.42, -s * 0.25);
    ctx.lineTo(s * 0.4, s * 0.3);
    ctx.closePath();
    ctx.fill();
  },
  gear(ctx, s) {
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = (i % 2 ? 0.34 : 0.46) * s;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = cutout();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
  },
  // Two friends side by side (the Online window).
  friends(ctx, s) {
    for (const [dx, k] of [[-0.2, 0.85], [0.2, 1]]) {
      ctx.beginPath();
      ctx.arc(s * dx, -s * 0.16 * k, s * 0.16 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * dx, s * 0.3, s * 0.26 * k, s * 0.2 * k, 0, Math.PI, 0);
      ctx.fill();
    }
  },
  user(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, -s * 0.14, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, s * 0.32, s * 0.34, s * 0.2, 0, Math.PI, 0);
    ctx.fill();
  },
  door(ctx, s) {
    roundRect(ctx, -s * 0.3, -s * 0.42, s * 0.6, s * 0.84, s * 0.1);
    ctx.fill();
    ctx.fillStyle = cutout();
    ctx.beginPath();
    ctx.arc(s * 0.14, s * 0.04, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  },
  check(ctx, s) {
    ctx.lineWidth = s * 0.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, 0);
    ctx.lineTo(-s * 0.08, s * 0.24);
    ctx.lineTo(s * 0.34, -s * 0.24);
    ctx.stroke();
  },
  lock(ctx, s) {
    roundRect(ctx, -s * 0.32, -s * 0.06, s * 0.64, s * 0.46, s * 0.1);
    ctx.fill();
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.arc(0, -s * 0.08, s * 0.2, Math.PI, 0);
    ctx.stroke();
  },
  pin(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, -s * 0.14, s * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = s * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.08);
    ctx.lineTo(0, s * 0.44);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(-s * 0.08, -s * 0.22, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  },
  trash(ctx, s) {
    // A little bin: lid with a handle, and a tapered can with two grooves.
    ctx.fillRect(-s * 0.36, -s * 0.3, s * 0.72, s * 0.1);
    ctx.fillRect(-s * 0.1, -s * 0.38, s * 0.2, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.16);
    ctx.lineTo(s * 0.3, -s * 0.16);
    ctx.lineTo(s * 0.24, s * 0.4);
    ctx.lineTo(-s * 0.24, s * 0.4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(-s * 0.1, -s * 0.06, s * 0.05, s * 0.36);
    ctx.fillRect(s * 0.06, -s * 0.06, s * 0.05, s * 0.36);
  },
  copy(ctx, s) {
    // Two sheets, one behind the other.
    ctx.globalAlpha *= 0.55;
    roundRect(ctx, -s * 0.36, -s * 0.4, s * 0.5, s * 0.6, s * 0.08);
    ctx.fill();
    ctx.globalAlpha /= 0.55;
    roundRect(ctx, -s * 0.14, -s * 0.2, s * 0.5, s * 0.6, s * 0.08);
    ctx.fill();
  },
  hanger(ctx, s) {
    // A clothes hanger: a hook and a triangle.
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(0, -s * 0.28, s * 0.12, Math.PI, Math.PI * 2.4);
    ctx.moveTo(0, -s * 0.14);
    ctx.lineTo(-s * 0.44, s * 0.28);
    ctx.lineTo(s * 0.44, s * 0.28);
    ctx.closePath();
    ctx.stroke();
  },
  dice(ctx, s) {
    // A die showing five: a rounded cube face with pips.
    roundRect(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, s * 0.16);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [px, py] of [[-0.2, -0.2], [0.2, -0.2], [0, 0], [-0.2, 0.2], [0.2, 0.2]]) {
      ctx.beginPath();
      ctx.arc(px * s, py * s, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  ground(ctx, s) {
    // An arrow down onto the ground line: drop it here.
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.38);
    ctx.lineTo(0, s * 0.12);
    ctx.moveTo(-s * 0.22, -s * 0.08);
    ctx.lineTo(0, s * 0.14);
    ctx.lineTo(s * 0.22, -s * 0.08);
    ctx.moveTo(-s * 0.36, s * 0.36);
    ctx.lineTo(s * 0.36, s * 0.36);
    ctx.stroke();
  },
  skull(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, -s * 0.06, s * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-s * 0.2, s * 0.14, s * 0.4, s * 0.24);
    ctx.fillStyle = cutout();
    ctx.beginPath();
    ctx.arc(-s * 0.14, -s * 0.04, s * 0.09, 0, Math.PI * 2);
    ctx.arc(s * 0.14, -s * 0.04, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  },
};

export function icon(ctx, name, x, y, s, color) {
  const draw = ICONS[name];
  if (!draw) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  iconInk = color;
  draw(ctx, s);
  ctx.restore();
}

// ---------- Windows ----------

const HEADER = 17;

// A window with a title ribbon you can drag. `win` keeps { x, y, open }. Returns false if closed.
// Options: `theme` (a key of THEMES) and `icon` (a key of the icon set) for the badge.
// Remembers where a window was left (and whether it's folded), across sessions.
function remember(win) {
  if (!win.key) return;
  settings.windowPos = { ...(settings.windowPos ?? {}), [win.key]: { x: win.x, y: win.y, min: Boolean(win.min) } };
  saveSettings();
}
function fold(win, on) {
  win.min = on;
  win.moved = true;
  remember(win);
}
// The minimize sticker: a dash (or, folded, a little window to unfold). Returns true when clicked.
function minimizeSticker(ui, win, bx, by, theme, folded) {
  const { ctx } = ui;
  const hot = hover(ui, bx, by, 13, 13);
  sticker(ctx, bx + 6.5, by + 6.5, 5.6, hot ? '#ffffff' : theme.light, { edge: theme.dark });
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (folded) {
    ctx.rect(bx + 3.8, by + 3.8, 5.4, 5);
  } else {
    ctx.moveTo(bx + 3.8, by + 7.5);
    ctx.lineTo(bx + 9.2, by + 7.5);
  }
  ctx.stroke();
  if (hot) tooltip(ui, [{ text: folded ? 'Unfold' : 'Fold away', bold: true }, { text: 'Or double-click the title', size: 7, color: COLORS.muted }]);
  if (clicked(ui, bx, by, 13, 13)) {
    fold(win, !folded);
    return true;
  }
  return false;
}
// A folded window: just its title on washi tape, with its icon, unfold and close stickers. It can
// still be dragged by the tape. Returns false (nothing inside to draw).
function folded(ui, win, w, title, theme, iconName, t) {
  const { ctx } = ui;
  const m = ui.mouse;
  ctx.font = font(10, true);
  const fw = Math.min(w, ctx.measureText(title).width + 84);
  win.w = fw;
  win.h = 19;
  const { x, y } = win;
  tape(ctx, x + fw / 2, y + 9, fw, 17, -0.01, theme.main, { pattern: 'stripes', alpha: 0.95 });
  sticker(ctx, x + 11, y + 9, 7.5, '#ffffff', { edge: theme.dark });
  icon(ctx, iconName, x + 11, y + 9.5, 10, theme.dark);
  text(ctx, title, x + 23, y + 13, { size: 9.5, bold: true, color: '#ffffff', outline: theme.ink });
  doodle(ctx, 'spark', x + fw - 40, y + 4, 2.5, '#ffffff', t);
  if (minimizeSticker(ui, win, x + fw - 31, y + 2.5, theme, true)) return false;
  const cx = x + fw - 16;
  const hot = hover(ui, cx, y + 2.5, 13, 13);
  sticker(ctx, cx + 6.5, y + 9, 5.6, hot ? '#ff6b8a' : theme.light, { edge: hot ? '#e04a6c' : theme.dark });
  ctx.strokeStyle = hot ? '#ffffff' : theme.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx + 4.2, y + 6.7);
  ctx.lineTo(cx + 8.8, y + 11.3);
  ctx.moveTo(cx + 8.8, y + 6.7);
  ctx.lineTo(cx + 4.2, y + 11.3);
  ctx.stroke();
  if (clicked(ui, cx, y + 2.5, 13, 13)) {
    win.open = false;
    return false;
  }
  if (m.double && hover(ui, x, y, fw - 36, 19)) {
    fold(win, false);
    m.double = false;
    m.clicked = false;
    return false;
  }
  if (m.clicked && hover(ui, x, y, fw - 36, 19)) {
    win.drag = { dx: m.x - x, dy: m.y - y, x0: win.x, y0: win.y };
    ui.used = true;
    m.clicked = false;
  }
  return false;
}

export function windowFrame(ui, win, w, h, title, { theme: themeKey = win.theme ?? 'pink', icon: iconName = win.icon ?? 'star' } = {}) {
  const { ctx } = ui;
  const m = ui.mouse;
  const theme = THEMES[themeKey] ?? THEMES.pink;
  win.w = w;
  win.h = h;
  if (win.drag) {
    if (m.down) {
      win.x = Math.round(Math.max(0, Math.min(640 - w, m.x - win.drag.dx)));
      win.y = Math.round(Math.max(8, Math.min(360 - 20, m.y - win.drag.dy)));
      // (A window you've placed yourself stays where you put it from then on.)
      if (win.x !== win.drag.x0 || win.y !== win.drag.y0) win.moved = true;
    } else {
      win.drag = null;
      remember(win);
    }
  }
  const { x, y } = win;
  const t = now();
  // Folded down to its title strip (the minimize sticker, or a double-click on the title).
  if (win.min && win.key) return folded(ui, win, w, title, theme, iconName, t);

  // A scrapbook page: lifted cream paper with a hand-drawn rim in the theme's ink, faint ruled
  // lines (a margin line down the left), the title on a strip of washi tape across the top, a
  // sticker for its icon, tape holding a corner down, and pencil doodles in the margins.
  const seed = (w * 7 + h * 13) % 97;
  paper(ctx, x, y, w, h, { fill: '#fffbf2', edge: theme.ink, r: 7, seed, width: 1.8 });
  ctx.save();
  roughRect(ctx, x, y, w, h, 7, seed, 0.6);
  ctx.clip();
  ctx.strokeStyle = theme.light;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 0.8;
  for (let ly = y + HEADER + 14; ly < y + h - 6; ly += 12) {
    ctx.beginPath();
    ctx.moveTo(x + 4, ly);
    ctx.lineTo(x + w - 4, ly);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#ff8fa8';
  ctx.beginPath();
  ctx.moveTo(x + 6, y + HEADER + 2);
  ctx.lineTo(x + 6, y + h - 4);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
  // The title tape: a long strip across the top, tilted a hair, its ends torn.
  ctx.font = font(10, true);
  const tw = Math.min(w - 50, ctx.measureText(title).width + 46);
  tape(ctx, x + 8 + tw / 2, y + 8.5, tw, 15, -0.012, theme.main, { pattern: 'stripes', alpha: 0.92 });
  // A scrap of tape on the bottom corner holding the page down.
  tape(ctx, x + w - 8, y + h - 5, 22, 8, -0.7, theme.light, { pattern: 'dots', alpha: 0.9 });
  // Doodles in the margin, pencilled in the theme's colour.
  doodle(ctx, ['star', 'heart', 'swirl', 'spark'][seed % 4], x + 13, y + h - 11, 3.4, theme.main, t);
  doodle(ctx, 'spark', x + w - 46, y + 8, 3, '#ffffff', t + 1);

  // The icon sticker, overlapping the tape's start.
  sticker(ctx, x + 13, y + 8.5, 8.5, '#ffffff', { edge: theme.dark });
  icon(ctx, iconName, x + 13, y + 9, 11, theme.dark);

  text(ctx, title, x + 27, y + 12.5, { size: 10, bold: true, color: '#ffffff', outline: theme.ink });

  // Close: a little round sticker with a hand-drawn cross, blushing red under the mouse.
  const cx = x + w - 17;
  const cy = y + 2;
  const hot = hover(ui, cx, cy, 13, 13);
  sticker(ctx, cx + 6.5, cy + 6.5, 5.6, hot ? '#ff6b8a' : theme.light, { edge: hot ? '#e04a6c' : theme.dark });
  ctx.save();
  ctx.translate(cx + 6.5, cy + 6.5);
  if (hot) ctx.rotate(Math.PI / 4 * 0.5);
  ctx.strokeStyle = hot ? '#ffffff' : theme.ink;
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2.4, -2.6);
  ctx.quadraticCurveTo(0.2, -0.2, 2.6, 2.4);
  ctx.moveTo(2.5, -2.5);
  ctx.quadraticCurveTo(-0.1, 0.3, -2.5, 2.6);
  ctx.stroke();
  ctx.restore();
  if (clicked(ui, cx, cy, 13, 13)) {
    win.open = false;
    return false;
  }
  // Minimize: a sticker with a dash beside the close one (not on talk boxes and shops).
  if (win.key && minimizeSticker(ui, win, x + w - 33, y + 2, theme, false)) return false;
  if (win.key && m.double && hover(ui, x, y, w - 36, HEADER)) {
    fold(win, true);
    m.double = false;
    m.clicked = false;
    return false;
  }
  if (m.clicked && hover(ui, x, y, w - 20, HEADER)) {
    win.drag = { dx: m.x - x, dy: m.y - y, x0: win.x, y0: win.y };
    ui.used = true;
    m.clicked = false;
  }
  ui.theme = theme;
  // Clicks inside the body are left for the window's own widgets, which are drawn after this.
  return true;
}

// ---------- Widgets ----------

// A glossy candy button with a lip underneath that it presses into under the mouse.
export function button(ui, x, y, w, h, label, { enabled = true, primary = false, size = 9, theme = null, iconName = null } = {}) {
  const { ctx } = ui;
  const th = theme ? THEMES[theme] : primary ? (ui.theme ?? THEMES.pink) : null;
  const hot = enabled && hover(ui, x, y, w, h);
  const down = hot && ui.mouse.down;
  const r = (h - 2) / 2;
  const lip = 2;
  const face = !enabled ? '#f1ebf4' : th ? th.main : '#fffbf2';
  const dy = down ? lip : hot ? -0.5 : 0;
  // A sticker label: a shadow it lifts off (pressing it flat), a white die-cut border, the
  // coloured face with a hand-drawn rim and a soft shine.
  // (Its wobble comes from its own size and label, so a button in a dragged window keeps its shape.)
  const seed = Math.round(w * 3 + h * 5 + String(label).length * 7) % 53;
  const rr = Math.min(r, 6);
  if (enabled && !down) {
    ctx.fillStyle = 'rgba(70,40,90,0.24)';
    roughRect(ctx, x + 0.5, y + lip + 0.5, w, h - lip, rr, seed + 5, 0.5);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  roughRect(ctx, x - 1.3, y + dy - 1.3, w + 2.6, h - lip + 2.6, rr + 1, seed, 0.5);
  ctx.fill();
  ctx.fillStyle = face;
  roughRect(ctx, x, y + dy, w, h - lip, rr, seed, 0.5);
  ctx.fill();
  if (enabled) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y + dy, w, (h - lip) * 0.4);
    if (hot) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x, y + dy, w, h);
    }
    ctx.restore();
  }
  roughRect(ctx, x, y + dy, w, h - lip, rr, seed, 0.5);
  ctx.strokeStyle = !enabled ? '#ddd2e8' : th ? th.ink : '#8a6a9a';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  const color = !enabled ? '#b8a8c8' : th ? '#ffffff' : COLORS.ink;
  const ty = y + dy + (h - lip) / 2 + size / 2.8;
  if (iconName) {
    ctx.font = font(size, true);
    const tw = ctx.measureText(label).width;
    const ix = x + w / 2 - (tw + size + 3) / 2 + size / 2;
    icon(ctx, iconName, ix, y + dy + (h - lip) / 2, size * 1.1, color);
    text(ctx, label, ix + size / 2 + 3, ty, { size, bold: true, color, outline: th && enabled ? th.ink : null });
  } else {
    text(ctx, label, x + w / 2, ty, { size, bold: true, align: 'center', color, outline: th && enabled ? th.ink : null });
  }
  return enabled && clicked(ui, x, y, w, h);
}

// Pill tabs in a soft track; the current one pops out in the window's color.
// `total` fits the row to that width instead: each tab as wide as its name plus an even share of
// what's left, so a long name ("Character") never runs past the window.
export function tabs(ui, x, y, labels, current, { w = 46, h = 15, total = null } = {}) {
  const { ctx } = ui;
  const th = ui.theme ?? THEMES.pink;
  let picked = current;
  let widths = labels.map(() => w);
  if (total) {
    ctx.font = font(Math.max(TEXT.tab.size, minText), TEXT.tab.bold);
    const need = labels.map((l) => ctx.measureText(l).width);
    const pad = (total - (labels.length - 1) * 2 - need.reduce((a, b) => a + b, 0)) / labels.length;
    widths = need.map((n) => n + pad);
  }
  const lefts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b + 2, 0));
  // Index tabs on a page divider: paper tabs with rounded tops along a pencilled line; the open one
  // stands a little taller in the window's colour.
  const all = widths.reduce((a, b) => a + b + 2, 0) - 2;
  ctx.strokeStyle = th.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + h + 0.5);
  ctx.lineTo(x + all + 3, y + h + 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  labels.forEach((label, i) => {
    const tx = x + lefts[i];
    w = widths[i];
    const on = i === current;
    const hot = hover(ui, tx, y, w, h);
    // A pressed tab sinks a pixel straight away.
    const dy = hot && ui.mouse.down ? 1 : 0;
    const up = on ? 1.5 : hot ? 0.8 : 0;
    const top = y + dy - up;
    const r = Math.min(5, h / 2.5);
    ctx.beginPath();
    ctx.moveTo(tx, y + h);
    ctx.lineTo(tx, top + r);
    ctx.quadraticCurveTo(tx, top, tx + r, top);
    ctx.lineTo(tx + w - r, top);
    ctx.quadraticCurveTo(tx + w, top, tx + w, top + r);
    ctx.lineTo(tx + w, y + h);
    ctx.closePath();
    ctx.fillStyle = on ? th.main : hot ? '#ffffff' : th.light;
    ctx.fill();
    ctx.strokeStyle = on ? th.ink : th.dark;
    ctx.lineWidth = on ? 1.3 : 0.9;
    ctx.stroke();
    if (on) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(tx + 2, top + 2, w - 4, h * 0.3);
    }
    text(ctx, label, tx + w / 2, y + h - 4.5 + dy - (on ? 1 : 0), { role: 'tab', align: 'center', color: on ? '#ffffff' : th.ink, outline: on ? th.ink : null });
    if (clicked(ui, tx, y, w, h)) picked = i;
  });
  return picked;
}

// A glossy capsule meter with a shine that sweeps across now and then. Options for feedback:
// `trail` (a lagging ratio drawn as a chunk in `trailColor`, what was just lost), `flash` (0..1, a
// white flash over the fill, for heals), `pulse` (0..1, a red glow on the rim, for danger), and
// `shine` (0..1, the progress of one bright sweep, for refills).
export function bar(ctx, x, y, w, h, ratio, color, label, { textColor = '#ffffff', size = 7, trail = null, trailColor = '#ffffff', flash = 0, pulse = 0, shine = null, rim = false, ticks = false, stripes = 0 } = {}) {
  const r = h / 2;
  if (pulse > 0) {
    ctx.globalAlpha = pulse;
    box(ctx, x - 1.5, y - 1.5, w + 3, h + 3, { fill: '#ff4f6b', edge: null, r: r + 1.5 });
    ctx.globalAlpha = 1;
  }
  // (The HUD redraw: a soft frame in the bar's own deep shade with a white rim inside it.)
  if (rim) box(ctx, x - 1.5, y - 1.5, w + 3, h + 3, { fill: '#ffffff', edge: darken(color, 0.25), r: r + 1.5, width: 1 });
  box(ctx, x, y, w, h, { fill: 'rgba(74,53,96,0.32)', edge: null, r });
  const fw = Math.max(0, Math.min(1, ratio)) * w;
  // The chunk just lost, draining after the bar.
  if (trail != null && trail > ratio) box(ctx, x, y, Math.max(h, Math.min(1, trail) * w), h, { fill: trailColor, edge: null, r });
  if (fw > 0) {
    ctx.save();
    roundRect(ctx, x, y, Math.max(h, fw), h, r);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, lighten(color, 0.35));
    g.addColorStop(0.55, color);
    g.addColorStop(1, darken(color, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, fw, h);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x, y + 1, fw, Math.max(1, h / 4));
    // The idle sweep, or the bright one a refill asks for.
    const k = shine ?? (now() * 0.4) % 1.6;
    if (k < 1) {
      ctx.fillStyle = shine != null ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      const sw = shine != null ? 7 : 4;
      const sx = x + k * (w + 20) - 10;
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + 6, y);
      ctx.lineTo(sx + 6 + sw, y);
      ctx.lineTo(sx + sw, y + h);
      ctx.fill();
    }
    // Fine ticks every tenth, so how much is left reads at a glance.
    if (ticks) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      for (let i = 1; i < 10; i++) ctx.fillRect(Math.round(x + (w * i) / 10), y + h * 0.45, 0.8, h * 0.55);
    }
    // While refilling, soft diagonal stripes drift along the fill.
    if (stripes > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.22 * stripes})`;
      const off = (now() * 10) % 8;
      for (let sx = x - 8 + off; sx < x + fw; sx += 8) {
        ctx.beginPath();
        ctx.moveTo(sx, y + h);
        ctx.lineTo(sx + 4, y);
        ctx.lineTo(sx + 7, y);
        ctx.lineTo(sx + 3, y + h);
        ctx.fill();
      }
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.75 * flash})`;
      ctx.fillRect(x, y, fw, h);
    }
    ctx.restore();
  }
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (label) text(ctx, label, x + w / 2, y + h / 2 + size / 2.8, { size, bold: true, align: 'center', color: textColor, outline: '#5a3f7a' });
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(c) {
  return `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}
export function lighten(hex, k) {
  return toHex(rgb(hex).map((v) => v + (255 - v) * k));
}
export function darken(hex, k) {
  return toHex(rgb(hex).map((v) => v * (1 - k)));
}

// An on/off switch: a pill with a knob that slides over. Returns the (possibly flipped) value.
export function toggle(ui, x, y, on) {
  const { ctx } = ui;
  const th = ui.theme ?? THEMES.pink;
  const w = 26;
  const h = 13;
  const hot = hover(ui, x, y, w, h);
  box(ctx, x, y, w, h, { fill: on ? th.main : '#e6dcef', edge: on ? th.dark : '#d2c4e2', r: h / 2, width: 1 });
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(on ? x + w - h / 2 : x + h / 2, y + h / 2, h / 2 - 1.5 + (hot ? 0.5 : 0), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = on ? th.dark : '#c4b4d8';
  ctx.lineWidth = 1;
  ctx.stroke();
  return clicked(ui, x - 2, y - 2, w + 4, h + 4) ? !on : on;
}

// The widest a tooltip line runs before it wraps (px).
const TIP_W = 230;

// Queue a tooltip; endUi draws it on top of everything.
export function tooltip(ui, lines) {
  ui.tooltip = lines;
}

export function endUi(ui) {
  if (!ui.tooltip) return;
  const { ctx } = ui;
  // Long lines (a skill's description) wrap at TIP_W, so the box never runs off the screen.
  const lines = ui.tooltip.flatMap((l) => {
    ctx.font = font(l.size ?? 9, l.bold);
    const out = [];
    let cur = '';
    for (const word of String(l.text).split(' ')) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && ctx.measureText(next).width > TIP_W) {
        out.push(cur);
        cur = word;
      } else cur = next;
    }
    out.push(cur);
    return out.map((t) => ({ ...l, text: t }));
  });
  const w = Math.max(...lines.map((l) => {
    ctx.font = font(l.size ?? 9, l.bold);
    return ctx.measureText(l.text).width;
  })) + 18;
  const h = lines.reduce((n, l) => n + (l.size ?? 9) + 3, 10);
  let x = ui.mouse.x + 12;
  let y = ui.mouse.y + 10;
  if (x + w > 636) x = ui.mouse.x - w - 8;
  if (y + h > 356) y = 356 - h;
  x = Math.max(4, Math.min(636 - w, x));
  y = Math.max(4, y);
  const accent = lines[0]?.color ?? COLORS.accent;
  // A sticky note: pale yellow paper with a highlighter stripe down the side, taped on at the top.
  paper(ctx, x, y, w, h, { fill: '#fffbe2', edge: '#c8b070', r: 4, seed: Math.round(w + h) % 31, width: 1.2 });
  ctx.save();
  roughRect(ctx, x, y, w, h, 4, Math.round(w + h) % 31, 0.6);
  ctx.clip();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 4, h);
  ctx.restore();
  tape(ctx, x + w / 2, y + 1, Math.min(34, w * 0.4), 7, 0.04, '#ffd6ea', { pattern: 'dots', alpha: 0.8 });
  let ty = y + 5;
  for (const l of lines) {
    ty += (l.size ?? 9) + 3;
    text(ctx, l.text, x + 10, ty - 3, { size: l.size ?? 9, bold: l.bold, color: l.color ?? COLORS.ink });
  }
}
