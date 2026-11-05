// Full control over the HUD (the player's ask, 2026-11-05): every piece of it (your card, the menu
// buttons, the hotkeys, your job's gauge, the buff row, the message log, the minimap, the quest
// card) can be moved anywhere, made bigger or smaller, or hidden, in Edit layout mode (F2, or
// Options > Interface). A piece is drawn through `beginPiece`/`endPiece`, which move and scale it
// and move the mouse with it, so its buttons, hovers and drops still land where they're drawn.
// Saved in settings.layout: { [piece]: { dx, dy, s, hide } }.

import { settings, saveSettings } from '../core/settings.js';
import { COLORS, text, button, hover, clicked, roundRect, font, tape, sticker, tooltip } from './kit.js';

export const PIECES = {
  player: 'Your card',
  menus: 'Menu buttons',
  hotkeys: 'Hotkeys',
  gauge: 'Job gauge',
  buffs: 'Buffs',
  log: 'Message log',
  minimap: 'Minimap',
  tracker: 'Quest card',
};
const SIZES = [0.75, 0.85, 1, 1.15, 1.3, 1.5];

// Each piece's box as it was last drawn (before moving), so the editor knows what to outline.
const rects = {};
export const layoutOf = (name) => ({ dx: 0, dy: 0, s: 1, hide: false, ...(settings.layout?.[name] ?? {}) });
function setLayout(name, change) {
  settings.layout = { ...(settings.layout ?? {}), [name]: { ...layoutOf(name), ...change } };
}

// A piece's move and size, kept wholly on the screen (a piece made bigger near an edge grows
// away from it instead of off it).
function fitted(name) {
  const o = layoutOf(name);
  const r = rects[name];
  if (!r) return o;
  const w = r.w * o.s;
  const h = r.h * o.s;
  o.dx = Math.max(-r.x, Math.min(640 - w - r.x, o.dx));
  o.dy = Math.max(-r.y, Math.min(360 - h - r.y, o.dy));
  return o;
}

// Where a point on screen falls in a piece's own (unmoved) coordinates.
export function intoPiece(name, x, y) {
  const r = rects[name];
  if (!r) return [x, y];
  const o = fitted(name);
  return [(x - (r.x + o.dx)) / o.s + r.x, (y - (r.y + o.dy)) / o.s + r.y];
}
// A piece's box on screen, where it's drawn now.
function onScreen(name) {
  const r = rects[name];
  const o = fitted(name);
  return { x: r.x + o.dx, y: r.y + o.dy, w: r.w * o.s, h: r.h * o.s };
}

let editing = false;
export const editingLayout = () => editing;
export function toggleLayoutEditor(on = !editing) {
  editing = on;
  if (!on) saveSettings();
}

// Starts drawing a piece: moved and scaled, the mouse brought along. A hidden piece draws nothing
// (an empty clip), unless the editor is open, where it shows under a veil. Returns a token for
// endPiece.
export function beginPiece(ui, name, rect) {
  rects[name] = rect;
  const o = fitted(name);
  const { ctx } = ui;
  const m = ui.mouse;
  const saved = { x: m.x, y: m.y, clicked: m.clicked, down: m.down, right: m.right, double: m.double, wheel: m.wheel };
  ctx.save();
  ctx.translate(rect.x + o.dx, rect.y + o.dy);
  ctx.scale(o.s, o.s);
  ctx.translate(-rect.x, -rect.y);
  if (o.hide && !editing) {
    ctx.beginPath();
    ctx.rect(0, 0, 0, 0);
    ctx.clip();
  }
  const blind = editing || o.hide;
  if (blind) Object.assign(m, { x: -9999, y: -9999, clicked: false, down: false, right: false, double: false, wheel: 0 });
  else [m.x, m.y] = intoPiece(name, m.x, m.y);
  return { saved, ui, blind };
}

export function endPiece(token) {
  const { ui, saved, blind } = token;
  ui.ctx.restore();
  const m = ui.mouse;
  // A click a piece used stays used; otherwise the mouse goes back as it was. (A piece that
  // couldn't see the mouse used nothing.)
  const used = !blind && saved.clicked && !m.clicked;
  Object.assign(m, saved);
  if (used) m.clicked = false;
}

// A whole piece drawn by one function.
export function piece(ui, name, rect, draw) {
  const t = beginPiece(ui, name, rect);
  try {
    draw();
  } finally {
    endPiece(t);
  }
}

// ---------- The editor ----------

const drag = { name: null, dx: 0, dy: 0 };

// Draws the editor over the HUD: every piece outlined in pencil with its name on tape, dragged to
// move, with stickers to shrink, grow and hide it; Done and Reset at the bottom of the screen.
export function drawLayoutEditor(ui) {
  if (!editing) return;
  const { ctx } = ui;
  const m = ui.mouse;
  const t = performance.now() / 1000;
  ctx.fillStyle = 'rgba(40,20,60,0.35)';
  ctx.fillRect(0, 0, 640, 360);
  if (drag.name) {
    if (m.down) {
      const r = rects[drag.name];
      const o = layoutOf(drag.name);
      const w = r.w * o.s;
      const h = r.h * o.s;
      const nx = Math.max(-w + 20, Math.min(640 - 20, m.x - drag.dx));
      const ny = Math.max(0, Math.min(360 - 14, m.y - drag.dy));
      setLayout(drag.name, { dx: Math.round(nx - r.x), dy: Math.round(ny - r.y) });
    } else drag.name = null;
  }
  const bx = 320 - 150;
  const by = 150;
  const onBar = hover(ui, bx, by, 300, 58);
  let over = null;
  for (const name of Object.keys(PIECES)) {
    if (!rects[name]) continue;
    const b = onScreen(name);
    const o = layoutOf(name);
    const hot = !onBar && hover(ui, b.x, b.y, b.w, b.h);
    if (hot) over = name;
    if (o.hide) {
      ctx.fillStyle = 'rgba(40,20,60,0.55)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = -t * 8;
    ctx.strokeStyle = hot || drag.name === name ? '#ffe36b' : '#ffffff';
    ctx.lineWidth = 1.5;
    roundRect(ctx, b.x - 1.5, b.y - 1.5, b.w + 3, b.h + 3, 5);
    ctx.stroke();
    ctx.restore();
    // The name on a strip of tape, and the stickers: smaller, bigger, hide/show.
    ctx.font = font(7.5, true);
    const label = `${PIECES[name]}${o.hide ? ' (hidden)' : ''}`;
    const lw = ctx.measureText(label).width + 16;
    // (Over the piece; one at the very top of the screen has its label beside it instead.)
    const top = b.y <= 14;
    const lx = Math.max(2, Math.min(640 - lw - 52, top ? (b.x + b.w + lw + 56 < 640 ? b.x + b.w + 6 : b.x - lw - 52) : b.x));
    const ly = top ? b.y + 10 : b.y - 8;
    tape(ctx, lx + lw / 2, ly, lw, 11, -0.01, o.hide ? '#9a8ab0' : '#ff8fc1', { pattern: 'stripes', alpha: 0.95 });
    text(ctx, label, lx + 8, ly + 3, { size: 7.5, bold: true, color: '#ffffff', outline: '#5a3f7a' });
    const stickers = [['-', 'Smaller'], ['+', 'Bigger'], [o.hide ? 'show' : 'hide', o.hide ? 'Show it' : 'Hide it']];
    stickers.forEach(([sym, tip], i) => {
      const sx = lx + lw + 4 + i * 15;
      const sh = hover(ui, sx - 6, ly - 6, 12, 12);
      sticker(ctx, sx, ly, 5.5, sh ? '#ffffff' : '#ffe0ef', { edge: '#a8467a' });
      if (sym === '-' || sym === '+') text(ctx, sym, sx, ly + 3, { size: 9, bold: true, align: 'center', color: '#a8467a' });
      else {
        // An eye, open or shut.
        ctx.strokeStyle = '#a8467a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx - 3.5, ly);
        ctx.quadraticCurveTo(sx, ly - (o.hide ? 0 : 3.5), sx + 3.5, ly);
        ctx.quadraticCurveTo(sx, ly + 3.5, sx - 3.5, ly);
        ctx.stroke();
        if (!o.hide) {
          ctx.fillStyle = '#a8467a';
          ctx.beginPath();
          ctx.arc(sx, ly, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (sh) tooltip(ui, [{ text: tip, bold: true }, ...(sym === '-' || sym === '+' ? [{ text: `Now ${Math.round(o.s * 100)}%`, size: 7, color: COLORS.muted }] : [])]);
      if (clicked(ui, sx - 6, ly - 6, 12, 12)) {
        if (sym === '-' || sym === '+') {
          const k = SIZES.indexOf(SIZES.reduce((p, q) => (Math.abs(q - o.s) < Math.abs(p - o.s) ? q : p)));
          setLayout(name, { s: SIZES[Math.max(0, Math.min(SIZES.length - 1, k + (sym === '+' ? 1 : -1)))] });
        } else setLayout(name, { hide: !o.hide });
      }
    });
  }
  // Grabbing a piece (anywhere inside its outline) starts moving it; the wheel resizes it.
  if (over && m.clicked) {
    const b = onScreen(over);
    drag.name = over;
    drag.dx = m.x - b.x;
    drag.dy = m.y - b.y;
    m.clicked = false;
  }
  if (over && m.wheel) {
    const o = layoutOf(over);
    setLayout(over, { s: Math.max(SIZES[0], Math.min(SIZES.at(-1), Math.round((o.s - Math.sign(m.wheel) * 0.05) * 100) / 100)) });
    m.wheel = 0;
  }
  // The editor's own bar.
  ctx.fillStyle = 'rgba(255,251,242,0.97)';
  roundRect(ctx, bx, by, 300, 58, 8);
  ctx.fill();
  ctx.strokeStyle = '#5a3f7a';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  tape(ctx, 320, by, 120, 13, -0.01, '#ff8fc1', { pattern: 'stripes', alpha: 0.95 });
  text(ctx, 'Edit layout', 320, by + 4, { size: 9, bold: true, align: 'center', color: '#ffffff', outline: '#a8467a' });
  text(ctx, 'Drag anything to move it. Wheel or -/+ to resize. The eye hides it.', 320, by + 22, { size: 7.5, align: 'center', color: COLORS.ink });
  if (button(ui, bx + 14, by + 32, 130, 20, 'Done (F2)', { primary: true, size: 9 }) || ui.input.pressed?.has('Escape')) toggleLayoutEditor(false);
  if (button(ui, bx + 156, by + 32, 130, 20, 'Reset everything', { size: 9 })) {
    settings.layout = {};
    Object.assign(settings, { minimapPos: null, minimapMin: false, minimapSize: 'normal', trackerPos: null });
    saveSettings();
  }
  if (onBar) m.clicked = false;
}
