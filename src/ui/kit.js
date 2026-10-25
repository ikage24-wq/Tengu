// A tiny immediate-mode UI kit with a pastel look. Each frame: beginUi(), draw widgets, endUi().
// Widgets return true when clicked. Clicks a widget uses are marked so the game ignores them.

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

export const COLORS = {
  panel: '#fff7fc',
  panelEdge: '#c9a6e8',
  title: '#ffb8dc',
  title2: '#c9b6ff',
  ink: '#5a3f7a',
  muted: '#9c86b8',
  accent: '#ff8fc1',
  good: '#6fcf8a',
  bad: '#ff6b8a',
  gold: '#e8a23c',
  cell: '#f3e8fb',
  cellEdge: '#dccbee',
  select: '#ffe36b',
  hp: '#ff6b8a',
  mp: '#6fb8ff',
  exp: '#ffd66b',
};

export function beginUi(ctx, input) {
  return { ctx, input, mouse: input.mouse, used: false, tooltip: null, dragging: null };
}

export function hover(ui, x, y, w, h) {
  const m = ui.mouse;
  return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h;
}

// True when the mouse was clicked inside the box this frame. Marks the click as used.
export function clicked(ui, x, y, w, h) {
  if (ui.mouse.clicked && hover(ui, x, y, w, h)) {
    ui.used = true;
    ui.mouse.clicked = false;
    return true;
  }
  return false;
}

export function text(ctx, str, x, y, { size = 9, color = COLORS.ink, align = 'left', bold = false, outline = null } = {}) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.textAlign = align;
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

// Wraps text to `width`; returns the y after the last line.
export function wrap(ctx, str, x, y, width, { size = 9, color = COLORS.ink, lineHeight = size + 3, bold = false } = {}) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  let line = '';
  for (const word of str.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      text(ctx, line, x, y, { size, color, bold });
      y += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    text(ctx, line, x, y, { size, color, bold });
    y += lineHeight;
  }
  return y;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function box(ctx, x, y, w, h, { fill = COLORS.panel, edge = COLORS.panelEdge, r = 6, width = 1.5 } = {}) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

// A window with a title bar you can drag. `win` keeps { x, y, open }. Returns false if closed.
export function windowFrame(ui, win, w, h, title) {
  const { ctx } = ui;
  const m = ui.mouse;
  if (win.drag) {
    if (m.down) {
      win.x = Math.round(Math.max(0, Math.min(640 - w, m.x - win.drag.dx)));
      win.y = Math.round(Math.max(0, Math.min(360 - 20, m.y - win.drag.dy)));
    } else {
      win.drag = null;
    }
  }
  const { x, y } = win;
  ctx.save();
  ctx.fillStyle = 'rgba(90,63,122,0.18)';
  roundRect(ctx, x + 3, y + 4, w, h, 8);
  ctx.fill();
  ctx.restore();
  box(ctx, x, y, w, h, { r: 8 });
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, COLORS.title);
  g.addColorStop(1, COLORS.title2);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, 18, 8);
  ctx.fill();
  ctx.fillRect(x, y + 10, w, 8);
  text(ctx, title, x + 9, y + 13, { size: 10, bold: true, color: '#ffffff', outline: '#b87ac9' });
  // Close button
  const cx = x + w - 16;
  const hot = hover(ui, cx, y + 3, 12, 12);
  box(ctx, cx, y + 3, 12, 12, { fill: hot ? '#ffffff' : '#ffe6f3', edge: '#ffffff', r: 6 });
  text(ctx, 'x', cx + 6, y + 12, { size: 9, bold: true, align: 'center', color: COLORS.accent });
  if (clicked(ui, cx, y + 3, 12, 12)) {
    win.open = false;
    return false;
  }
  if (m.clicked && hover(ui, x, y, w - 18, 18)) {
    win.drag = { dx: m.x - x, dy: m.y - y };
    ui.used = true;
    m.clicked = false;
  }
  // Clicks inside the body are left for the window's own widgets, which are drawn after this.
  return true;
}

export function button(ui, x, y, w, h, label, { enabled = true, primary = false, size = 9 } = {}) {
  const { ctx } = ui;
  const hot = enabled && hover(ui, x, y, w, h);
  const fill = !enabled ? '#ece4f3' : primary ? (hot ? '#ffa8d2' : COLORS.accent) : hot ? '#ffffff' : '#fdeffa';
  box(ctx, x, y, w, h, { fill, edge: enabled ? (primary ? '#e06fa8' : COLORS.panelEdge) : '#ddd2e8', r: Math.min(6, h / 2) });
  text(ctx, label, x + w / 2, y + h / 2 + size / 2.8, { size, bold: true, align: 'center', color: !enabled ? '#b8a8c8' : primary ? '#ffffff' : COLORS.ink });
  return enabled && clicked(ui, x, y, w, h);
}

export function tabs(ui, x, y, labels, current, { w = 46, h = 14 } = {}) {
  let picked = current;
  labels.forEach((label, i) => {
    const tx = x + i * (w + 2);
    const on = i === current;
    box(ui.ctx, tx, y, w, h, { fill: on ? COLORS.accent : hover(ui, tx, y, w, h) ? '#ffffff' : '#f6e8f8', edge: on ? '#e06fa8' : COLORS.cellEdge, r: 5 });
    text(ui.ctx, label, tx + w / 2, y + h - 4, { size: 8, bold: true, align: 'center', color: on ? '#ffffff' : COLORS.ink });
    if (clicked(ui, tx, y, w, h)) picked = i;
  });
  return picked;
}

export function bar(ctx, x, y, w, h, ratio, color, label, { textColor = '#ffffff', size = 7 } = {}) {
  box(ctx, x, y, w, h, { fill: 'rgba(90,63,122,0.25)', edge: null, r: h / 2 });
  const fw = Math.max(0, Math.min(1, ratio)) * w;
  if (fw > 0) {
    box(ctx, x, y, Math.max(h, fw), h, { fill: color, edge: null, r: h / 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x + h / 2, y + 1, Math.max(0, fw - h), Math.max(1, h / 4));
  }
  if (label) text(ctx, label, x + w / 2, y + h / 2 + size / 2.8, { size, bold: true, align: 'center', color: textColor, outline: '#5a3f7a' });
}

// Queue a tooltip; endUi draws it on top of everything.
export function tooltip(ui, lines) {
  ui.tooltip = lines;
}

export function endUi(ui) {
  if (!ui.tooltip) return;
  const { ctx } = ui;
  const lines = ui.tooltip;
  ctx.font = `9px ${FONT}`;
  const w = Math.max(...lines.map((l) => {
    ctx.font = `${l.bold ? 'bold ' : ''}${l.size ?? 9}px ${FONT}`;
    return ctx.measureText(l.text).width;
  })) + 14;
  const h = lines.reduce((n, l) => n + (l.size ?? 9) + 3, 8);
  let x = ui.mouse.x + 12;
  let y = ui.mouse.y + 10;
  if (x + w > 636) x = ui.mouse.x - w - 8;
  if (y + h > 356) y = 356 - h;
  box(ctx, x, y, w, h, { fill: 'rgba(255,250,253,0.97)', edge: COLORS.accent, r: 6 });
  let ty = y + 4;
  for (const l of lines) {
    ty += (l.size ?? 9) + 3;
    text(ctx, l.text, x + 7, ty - 3, { size: l.size ?? 9, bold: l.bold, color: l.color ?? COLORS.ink });
  }
}
