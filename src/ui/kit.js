// A tiny immediate-mode UI kit with a candy-pastel look. Each frame: beginUi(), draw widgets, endUi().
// Widgets return true when clicked. Clicks a widget uses are marked so the game ignores them.
//
// Windows come in color themes (pink, peach, lavender, mint, sky, gold) with an icon badge, a
// scalloped title ribbon, a cream body, and a soft shadow. Buttons are glossy candy
// with a lip that presses down; bars are glossy capsules with a shine that sweeps across.

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

export const COLORS = {
  panel: '#fffaf6',
  panelEdge: '#c9a6e8',
  title: '#ffb8dc',
  title2: '#c9b6ff',
  ink: '#5a3f7a',
  muted: '#9c86b8',
  accent: '#ff8fc1',
  good: '#4fbf72',
  bad: '#ff6b8a',
  gold: '#e8a23c',
  cell: '#f6eefb',
  cellEdge: '#e2d3f0',
  select: '#ffd84f',
  hp: '#ff6b8a',
  mp: '#6fb8ff',
  exp: '#ffd66b',
};

// Window color themes: main tint, a light wash, a dark edge, and a deep ink for outlines.
export const THEMES = {
  pink: { main: '#ff8fc1', light: '#ffd6ea', dark: '#e0659f', ink: '#a8467a' },
  peach: { main: '#ffab7a', light: '#ffe2cf', dark: '#e98450', ink: '#a85a2f' },
  lavender: { main: '#b48cff', light: '#e8dcff', dark: '#9068e0', ink: '#6a48ad' },
  mint: { main: '#5fd3a0', light: '#d2f5e4', dark: '#3fb383', ink: '#2a7f5c' },
  sky: { main: '#6fb8ff', light: '#d6ebff', dark: '#4f95e0', ink: '#336aa8' },
  gold: { main: '#ffc94f', light: '#fff0c4', dark: '#e0a52f', ink: '#9a6a12' },
};

const now = () => performance.now() / 1000;

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

// Wraps text to `width`; returns the y after the last line. `chars` limits how many characters
// show, for typewriter text.
export function wrap(ctx, str, x, y, width, { size = 9, color = COLORS.ink, lineHeight = size + 3, bold = false, chars = Infinity } = {}) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
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

// An inset well for grouping content inside a window.
export function well(ctx, x, y, w, h, theme = THEMES.pink, r = 7) {
  box(ctx, x, y, w, h, { fill: '#ffffff', edge: theme.light, r, width: 1.5 });
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.fillStyle = theme.light;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x, y, w, 3);
  ctx.restore();
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

const ICONS = {
  bag(ctx, s) {
    roundRect(ctx, -s * 0.38, -s * 0.18, s * 0.76, s * 0.6, s * 0.14);
    ctx.fill();
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.arc(0, -s * 0.18, s * 0.18, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
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
    ctx.fillStyle = '#ffffff';
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
    ctx.fillStyle = '#ffffff';
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
    ctx.fillStyle = '#ffffff';
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
    ctx.fillStyle = '#ffffff';
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
    ctx.fillStyle = '#ffffff';
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
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.14, s * 0.04, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  },
  skull(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, -s * 0.06, s * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-s * 0.2, s * 0.14, s * 0.4, s * 0.24);
    ctx.fillStyle = '#ffffff';
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
  draw(ctx, s);
  ctx.restore();
}

// ---------- Windows ----------

const HEADER = 17;

// A window with a title ribbon you can drag. `win` keeps { x, y, open }. Returns false if closed.
// Options: `theme` (a key of THEMES) and `icon` (a key of the icon set) for the badge.
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
    } else {
      win.drag = null;
    }
  }
  const { x, y } = win;
  const t = now();

  // Soft shadow, then the cream body with a two-tone border.
  softShadow(ctx, x, y, w, h, 10, 4);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#fffaf6';
  ctx.fill();
  // A faint wash of the theme color toward the bottom.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = theme.light;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x, y + h - 14, w, 14);
  ctx.restore();
  roundRect(ctx, x, y, w, h, 10);
  ctx.strokeStyle = theme.dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // The title ribbon with a scalloped lower edge.
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + HEADER);
  g.addColorStop(0, theme.light);
  g.addColorStop(0.5, theme.main);
  g.addColorStop(1, theme.main);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, HEADER);
  ctx.beginPath();
  for (let sx = x; sx < x + w; sx += 6) ctx.arc(sx + 3, y + HEADER, 3, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y + 2, w, 4);
  ctx.restore();

  // Twinkles on the ribbon.
  for (let i = 0; i < 2; i++) {
    const k = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 2);
    ctx.globalAlpha = 0.5 + 0.5 * k;
    sparkle(ctx, x + w - 40 - i * 14, y + 7 + i * 4, 1.5 + k * 1.5, '#ffffff');
  }
  ctx.globalAlpha = 1;

  // The icon badge, sitting over the ribbon's corner.
  const bx = x + 13;
  const by = y + 8.5;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(bx, by, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = theme.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx, by, 9.5, 0, Math.PI * 2);
  ctx.stroke();
  icon(ctx, iconName, bx, by + 0.5, 12, theme.dark);

  text(ctx, title, x + 27, y + 12.5, { size: 10, bold: true, color: '#ffffff', outline: theme.ink });

  // Close button: a round candy button that blushes red under the mouse.
  const cx = x + w - 17;
  const cy = y + 2;
  const hot = hover(ui, cx, cy, 13, 13);
  ctx.fillStyle = hot ? '#ff6b8a' : '#ffffff';
  ctx.beginPath();
  ctx.arc(cx + 6.5, cy + 6.5, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hot ? '#e04a6c' : theme.dark;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.translate(cx + 6.5, cy + 6.5);
  if (hot) ctx.rotate(Math.PI / 4 * 0.5);
  ctx.strokeStyle = hot ? '#ffffff' : theme.dark;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2.5, -2.5);
  ctx.lineTo(2.5, 2.5);
  ctx.moveTo(2.5, -2.5);
  ctx.lineTo(-2.5, 2.5);
  ctx.stroke();
  ctx.restore();
  if (clicked(ui, cx, cy, 13, 13)) {
    win.open = false;
    return false;
  }
  if (m.clicked && hover(ui, x, y, w - 20, HEADER)) {
    win.drag = { dx: m.x - x, dy: m.y - y };
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
  const r = Math.min(7, h / 2);
  const lip = 2;
  const face = !enabled ? '#efe8f4' : th ? th.main : '#ffffff';
  const lipColor = !enabled ? '#ddd2e8' : th ? th.dark : '#dccbee';
  const dy = down ? lip : hot ? -0.5 : 0;
  box(ctx, x, y + lip, w, h - lip, { fill: lipColor, edge: null, r });
  box(ctx, x, y + dy, w, h - lip, { fill: face, edge: null, r });
  if (enabled) {
    ctx.save();
    roundRect(ctx, x, y + dy, w, h - lip, r);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x, y + dy, w, (h - lip) * 0.42);
    if (hot) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x, y + dy, w, h);
    }
    ctx.restore();
  }
  roundRect(ctx, x, y + dy, w, h - lip, r);
  ctx.strokeStyle = !enabled ? '#ddd2e8' : th ? th.dark : COLORS.cellEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  const color = !enabled ? '#b8a8c8' : th ? '#ffffff' : COLORS.ink;
  const ty = y + dy + (h - lip) / 2 + size / 2.8;
  if (iconName) {
    ctx.font = `bold ${size}px ${FONT}`;
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
export function tabs(ui, x, y, labels, current, { w = 46, h = 15 } = {}) {
  const { ctx } = ui;
  const th = ui.theme ?? THEMES.pink;
  let picked = current;
  box(ctx, x - 2, y - 2, labels.length * (w + 2) + 2, h + 4, { fill: th.light, edge: null, r: (h + 4) / 2 });
  labels.forEach((label, i) => {
    const tx = x + i * (w + 2);
    const on = i === current;
    const hot = hover(ui, tx, y, w, h);
    if (on) {
      box(ctx, tx, y, w, h, { fill: th.main, edge: th.dark, r: h / 2, width: 1 });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      roundRect(ctx, tx + 2, y + 1, w - 4, h * 0.38, h / 4);
      ctx.fill();
    } else if (hot) {
      box(ctx, tx, y, w, h, { fill: 'rgba(255,255,255,0.75)', edge: null, r: h / 2 });
    }
    text(ctx, label, tx + w / 2, y + h - 4.5, { size: 8, bold: true, align: 'center', color: on ? '#ffffff' : th.ink, outline: on ? th.ink : null });
    if (clicked(ui, tx, y, w, h)) picked = i;
  });
  return picked;
}

// A glossy capsule meter with a shine that sweeps across now and then.
export function bar(ctx, x, y, w, h, ratio, color, label, { textColor = '#ffffff', size = 7, trail = null } = {}) {
  const r = h / 2;
  box(ctx, x, y, w, h, { fill: 'rgba(74,53,96,0.32)', edge: null, r });
  const fw = Math.max(0, Math.min(1, ratio)) * w;
  // A pale trail shows what was just lost, draining after the bar.
  if (trail != null && trail > ratio) box(ctx, x, y, Math.max(h, Math.min(1, trail) * w), h, { fill: '#ffffff', edge: null, r });
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
    const k = (now() * 0.4) % 1.6;
    if (k < 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      const sx = x + k * (w + 20) - 10;
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + 6, y);
      ctx.lineTo(sx + 10, y);
      ctx.lineTo(sx + 4, y + h);
      ctx.fill();
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

// Queue a tooltip; endUi draws it on top of everything.
export function tooltip(ui, lines) {
  ui.tooltip = lines;
}

export function endUi(ui) {
  if (!ui.tooltip) return;
  const { ctx } = ui;
  const lines = ui.tooltip;
  const w = Math.max(...lines.map((l) => {
    ctx.font = `${l.bold ? 'bold ' : ''}${l.size ?? 9}px ${FONT}`;
    return ctx.measureText(l.text).width;
  })) + 18;
  const h = lines.reduce((n, l) => n + (l.size ?? 9) + 3, 10);
  let x = ui.mouse.x + 12;
  let y = ui.mouse.y + 10;
  if (x + w > 636) x = ui.mouse.x - w - 8;
  if (y + h > 356) y = 356 - h;
  const accent = lines[0]?.color ?? COLORS.accent;
  softShadow(ctx, x, y, w, h, 8, 3);
  box(ctx, x, y, w, h, { fill: 'rgba(255,251,253,0.98)', edge: null, r: 8 });
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.clip();
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 4, h);
  ctx.restore();
  roundRect(ctx, x, y, w, h, 8);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  let ty = y + 5;
  for (const l of lines) {
    ty += (l.size ?? 9) + 3;
    text(ctx, l.text, x + 10, ty - 3, { size: l.size ?? 9, bold: l.bold, color: l.color ?? COLORS.ink });
  }
}
