// Phone and tablet controls. They appear the first time the screen is touched: a thumb stick on
// the left (walk, climb, Up to talk and take portals, Down to crouch and drop), and on the right a
// big Attack button with Jump, Loot and the first four hotkey skills around it. The hotkey bar's
// own bubbles can be tapped too. Taps anywhere else work as mouse clicks (menus, windows, NPCs),
// and a drag works as a mouse drag. Typing (a name, chat) brings up the phone's keyboard.

import { VW, VH } from '../input.js';
import { HOTKEYS } from '../core/character.js';
import { SKILLS, skillAt } from '../data/skills.js';
import { drawSkillIcon, drawItemIcon } from '../render/icons.js';
import { text, icon } from './kit.js';
import { settings } from '../core/settings.js';

const BASE = {
  STICK: { x: 66, y: 260, r: 34, grab: 70 },
  ATTACK: { x: 594, y: 268, r: 23, code: 'KeyZ', label: null, color: '#ff8fc1', dark: '#c8467f' },
  JUMP: { x: 551, y: 296, r: 16, code: 'Space', label: 'Jump', color: '#8fd3ff', dark: '#3f8fd0' },
  LOOT: { x: 512, y: 304, r: 11, code: 'KeyX', label: 'Loot', color: '#ffe08a', dark: '#c99a1f' },
  CHAT: { x: 622, y: 136, r: 11, code: null, label: 'Chat', color: '#c9b6ff', dark: '#7a5cc8' },
  EMOTE: { x: 622, y: 164, r: 11, code: 'KeyT', label: 'Emote', color: '#ffc6e0', dark: '#e0659f' },
  PING: { x: 622, y: 192, r: 11, code: 'KeyV', label: 'Ping', color: '#bfe6ff', dark: '#3f8fd0' },
  RIDE: { x: 622, y: 220, r: 11, code: 'KeyH', label: 'Ride', color: '#c8f0d8', dark: '#3fa878' },
};
const DEAD = 11;
let STICK, ATTACK, JUMP, LOOT, CHAT, EMOTE, PING, RIDE, ARC;
const FADE = 1;
// Lays the controls out from the settings: left-handed play mirrors the whole set.
function relayout() {
  const k = 1;
  const flip = settings.touchLeft;
  const place = (b, cx, cy) => {
    const x = cx + (b.x - cx) * k;
    return { ...b, x: flip ? VW - x : x, y: cy + (b.y - cy) * k, r: b.r * k, k, ...(b.grab ? { grab: b.grab * k } : {}) };
  };
  STICK = place(BASE.STICK, 0, VH);
  ATTACK = place(BASE.ATTACK, VW, VH);
  JUMP = place(BASE.JUMP, VW, VH);
  LOOT = place(BASE.LOOT, VW, VH);
  CHAT = place(BASE.CHAT, VW, 150);
  EMOTE = place(BASE.EMOTE, VW, 150);
  PING = place(BASE.PING, VW, 150);
  RIDE = place(BASE.RIDE, VW, 150);
  // Skill buttons in an arc above the Attack button (mirrored with it).
  ARC = [195, 230, 265, 300].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { x: ATTACK.x + (flip ? -1 : 1) * Math.cos(a) * 52 * k, y: ATTACK.y + Math.sin(a) * 52 * k, r: 13.5 * k, k };
  });
}
relayout();

// Where the controls sit now (for the preview in Options).
export function touchLayout() {
  relayout();
  return { fade: FADE, parts: [STICK, ATTACK, JUMP, LOOT, CHAT, EMOTE, PING, RIDE, ...ARC] };
}
// The HUD's hotkey bubbles (see ui/hud.js).
const HK = { x: 380, step: 21, y: 329.5, d: 19 };

export function createTouch(canvas, input) {
  const t = { on: false, input, canvas, fingers: new Map(), stick: null, mouseId: null, screen: null, world: null, ui: null, lastTap: 0, keys: null };
  const toGame = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VW, y: ((e.clientY - r.top) / r.height) * VH };
  };
  const field = hiddenField(t);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // Phones play best full screen (where the browser allows it).
    if (!t.on) document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
    t.on = true;
    input.touch = true;
    for (const touch of e.changedTouches) start(t, touch.identifier, toGame(touch), field);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) move(t, touch.identifier, toGame(touch));
  }, { passive: false });
  const end = (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) finish(t, touch.identifier);
  };
  canvas.addEventListener('touchend', end, { passive: false });
  canvas.addEventListener('touchcancel', end, { passive: false });
  return t;
}

// An off-screen text box: focusing it brings up the phone's keyboard, and what's typed goes to
// the game as if from a keyboard.
function hiddenField(t) {
  const el = document.createElement('input');
  el.type = 'text';
  el.autocapitalize = 'off';
  el.autocomplete = 'off';
  el.spellcheck = false;
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, { position: 'fixed', left: '0', top: '0', width: '1px', height: '1px', opacity: '0', border: '0', padding: '0', fontSize: '16px' });
  document.body.appendChild(el);
  // A single space sits in it, so deleting shows up even with nothing typed.
  const reset = () => {
    el.value = ' ';
    el.setSelectionRange?.(1, 1);
  };
  reset();
  el.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      t.input.pressed.add('Enter');
      // Sent: the keyboard goes away (without that counting as closing the chat).
      t.chatOpen = false;
      el.blur();
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      t.input.typed.push('\b');
      e.preventDefault();
    }
  });
  el.addEventListener('input', () => {
    const v = el.value;
    if (v.length < 1) t.input.typed.push('\b');
    else for (const ch of v.slice(1)) t.input.typed.push(ch);
    reset();
  });
  el.addEventListener('blur', () => {
    // Closing the keyboard mid-chat sends nothing: the chat closes.
    if (t.chatOpen && t.screen === 'game') t.input.pressed.add('Escape');
    t.chatOpen = false;
  });
  t.focus = () => {
    reset();
    el.focus({ preventScroll: true });
  };
  return el;
}

const near = (p, c, extra = 4) => Math.hypot(p.x - c.x, p.y - c.y) <= c.r + extra;

// The skills on the four arc buttons: the first four bound hotkeys.
function arcKeys(world) {
  const out = [];
  for (const code of HOTKEYS) {
    const b = world?.char.hotkeys[code];
    if (b && out.length < ARC.length) out.push({ code, binding: b });
  }
  return out;
}

// Whether the controls are up: in the game, with no dialog or chat taking over.
function controlsUp(t) {
  return t.on && t.screen === 'game' && t.world && t.ui && !t.ui.npc && !t.ui.death;
}

function overWindow(t, p) {
  if (!t.ui) return false;
  return Object.values(t.ui.windows).some((w) => w.open && w.w && p.x >= w.x && p.x < w.x + w.w && p.y >= w.y && p.y < w.y + w.h) || Boolean(t.ui.menu) || inRect(t.ui.menuGrid && t.ui.menuGridRect, p.x, p.y, 0);
}

function inRect(r, x, y, pad) {
  return Boolean(r) && x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
}

// A button whose circle reaches into an open window (or the phone's menu grid) fades away, so the
// window under it reads and takes the taps; it eases back when the window closes.
function covering(t, b, r) {
  const ui = t.ui;
  const rects = Object.values(ui.windows).filter((w) => w.open && w.w);
  if (ui.menuGrid && ui.menuGridRect) rects.push(ui.menuGridRect);
  return rects.some((w) => {
    const cx = Math.max(w.x, Math.min(b.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(b.y, w.y + w.h));
    return Math.hypot(b.x - cx, b.y - cy) < r;
  });
}
function fadeFor(t, name, b, r) {
  const f = (t.fade ??= {});
  const want = covering(t, b, r) ? 0 : 1;
  f[name] = (f[name] ?? want) + (want - (f[name] ?? want)) * 0.25;
  if (Math.abs(f[name] - want) < 0.02) f[name] = want;
  return f[name];
}

function start(t, id, p, field) {
  const { input } = t;
  relayout();
  if (controlsUp(t) && !overWindow(t, p)) {
    if (!t.stick && (t.fade?.stick ?? 1) > 0.5 && Math.hypot(p.x - STICK.x, p.y - STICK.y) < STICK.grab && p.y < 326) {
      t.stick = { id, x: p.x, y: p.y, dirs: new Set() };
      t.fingers.set(id, { kind: 'stick' });
      steer(t, p);
      return;
    }
    const buttons = [ATTACK, JUMP, LOOT, EMOTE, PING, ...(t.world?.char?.mounts?.length ? [RIDE] : []), ...arcKeys(t.world).map((k, i) => ({ ...ARC[i], code: k.code }))];
    const hit = buttons.find((b) => near(p, b));
    if (hit) {
      press(input, hit.code);
      t.fingers.set(id, { kind: 'key', code: hit.code, at: performance.now() });
      return;
    }
    if (near(p, CHAT)) {
      t.chatOpen = true;
      input.pressed.add('Enter');
      t.focus();
      t.fingers.set(id, { kind: 'none' });
      return;
    }
    // A hotkey bubble on the HUD.
    if (p.y >= HK.y - 2 && p.y <= HK.y + HK.d + 2 && p.x >= HK.x - 2) {
      const i = Math.floor((p.x - HK.x + 1) / HK.step);
      if (i >= 0 && i < HOTKEYS.length && t.world.char.hotkeys[HOTKEYS[i]]) {
        press(input, HOTKEYS[i]);
        t.fingers.set(id, { kind: 'key', code: HOTKEYS[i], at: performance.now() });
        return;
      }
    }
  }
  // A window's own chat box (the trade window's).
  const f = t.screen === 'game' && t.ui?.typeField;
  if (f && p.x >= f.x && p.x <= f.x + f.w && p.y >= f.y && p.y <= f.y + f.h) {
    t.chatOpen = true;
    if (t.ui.chat?.typing == null) input.pressed.add('Enter');
    t.focus();
    t.fingers.set(id, { kind: 'none' });
    return;
  }
  // Typing a name on the creator screen.
  if (t.screen === 'creator' && p.x >= 338 && p.x <= 604 && p.y >= 266 && p.y <= 295) t.focus();
  // Everything else is the mouse (one finger at a time).
  if (t.mouseId != null) return;
  t.mouseId = id;
  t.fingers.set(id, { kind: 'mouse' });
  const m = input.mouse;
  m.x = p.x;
  m.y = p.y;
  m.down = true;
  m.clicked = true;
  const now = performance.now();
  if (now - t.lastTap < 350 && Math.hypot(p.x - (t.lastTapX ?? -99), p.y - (t.lastTapY ?? -99)) < 14) m.double = true;
  t.lastTap = now;
  t.lastTapX = p.x;
  t.lastTapY = p.y;
}

function move(t, id, p) {
  const f = t.fingers.get(id);
  if (!f) return;
  if (f.kind === 'stick') steer(t, p);
  else if (f.kind === 'mouse') {
    t.input.mouse.x = p.x;
    t.input.mouse.y = p.y;
  }
}

function finish(t, id) {
  const f = t.fingers.get(id);
  t.fingers.delete(id);
  if (!f) return;
  const { input } = t;
  if (f.kind === 'stick') {
    for (const d of t.stick.dirs) input.held.delete(d);
    t.stick = null;
  } else if (f.kind === 'key') {
    // Another finger may still hold the same key (two taps of one button).
    if (![...t.fingers.values()].some((o) => o.kind === 'key' && o.code === f.code)) input.held.delete(f.code);
  } else if (f.kind === 'mouse') {
    t.mouseId = null;
    input.mouse.released = true;
    input.mouse.down = false;
    // Lift the "mouse" off the screen so nothing stays hovered.
    setTimeout(() => {
      if (t.mouseId == null) {
        input.mouse.x = -1;
        input.mouse.y = -1;
      }
    }, 60);
  }
}

function press(input, code) {
  if (!input.held.has(code)) {
    input.pressed.add(code);
    // A little buzz under the thumb.
  }
  input.held.add(code);
}

// The stick: past the dead zone it holds the arrow keys it points toward (diagonals hold two).
function steer(t, p) {
  const s = t.stick;
  let dx = p.x - STICK.x;
  let dy = p.y - STICK.y;
  const len = Math.hypot(dx, dy);
  if (len > STICK.r) {
    dx = (dx / len) * STICK.r;
    dy = (dy / len) * STICK.r;
  }
  s.dx = dx;
  s.dy = dy;
  const want = new Set();
  const a = Math.atan2(dy, dx);
  if (len > DEAD) {
    // Mostly sideways walks; mostly up or down climbs (with a little sideways allowed).
    if (Math.abs(Math.cos(a)) > 0.42) want.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    if (Math.abs(Math.sin(a)) > 0.62) want.add(dy > 0 ? 'ArrowDown' : 'ArrowUp');
  }
  for (const d of s.dirs) if (!want.has(d)) t.input.held.delete(d);
  for (const d of want) if (!s.dirs.has(d)) press(t.input, d);
  s.dirs = want;
}

// ---------- Drawing ----------

export function touchFrame(t, ctx, screen, world, ui) {
  t.screen = screen;
  t.world = world;
  t.ui = ui;
  if (!controlsUp(t)) {
    // Nothing held over from the game.
    if (t.stick) {
      for (const d of t.stick.dirs) t.input.held.delete(d);
      t.stick = null;
    }
    return;
  }
  if (ui.chat?.typing == null) t.chatOpen = false;
  relayout();
  const time = performance.now() / 1000;
  ctx.save();
  STICK.alpha = fadeFor(t, 'stick', STICK, STICK.r + 6);
  for (const [name, b] of Object.entries({ ATTACK, JUMP, LOOT, CHAT, EMOTE, PING, RIDE })) b.alpha = fadeFor(t, name, b, b.r + 2);
  ARC.forEach((b, i) => (b.alpha = fadeFor(t, `arc${i}`, b, b.r + 2)));
  if (STICK.alpha > 0) drawStick(ctx, t);
  drawButton(ctx, t, ATTACK, time, () => icon(ctx, 'star', ATTACK.x, ATTACK.y - 2, 18, '#ffffff'));
  drawButton(ctx, t, JUMP, time, () => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(JUMP.x, JUMP.y - 8);
    ctx.lineTo(JUMP.x + 7, JUMP.y + 1);
    ctx.lineTo(JUMP.x + 2.5, JUMP.y + 1);
    ctx.lineTo(JUMP.x + 2.5, JUMP.y + 6);
    ctx.lineTo(JUMP.x - 2.5, JUMP.y + 6);
    ctx.lineTo(JUMP.x - 2.5, JUMP.y + 1);
    ctx.lineTo(JUMP.x - 7, JUMP.y + 1);
    ctx.closePath();
    ctx.fill();
  });
  drawButton(ctx, t, LOOT, time, () => icon(ctx, 'bag', LOOT.x, LOOT.y, 11, '#ffffff'));
  drawButton(ctx, t, CHAT, time, () => icon(ctx, 'chat', CHAT.x, CHAT.y, 11, '#ffffff'));
  drawButton(ctx, t, EMOTE, time, () => icon(ctx, 'heart', EMOTE.x, EMOTE.y, 10, '#ffffff'));
  drawButton(ctx, t, PING, time, () => icon(ctx, 'pin', PING.x, PING.y, 10, '#ffffff'));
  // Ride (once you have a mount): on and off your mount.
  if (world?.char?.mounts?.length) drawButton(ctx, t, RIDE, time, () => icon(ctx, 'paw', RIDE.x, RIDE.y, 10, '#ffffff'));
  arcKeys(world).forEach((k, i) => {
    const b = { ...ARC[i], code: k.code, color: '#fffaf8', dark: '#9a7cc8' };
    drawButton(ctx, t, b, time, () => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.beginPath();
      ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
      ctx.clip();
      ctx.scale(1.35, 1.35);
      if (k.binding.skill) drawSkillIcon(ctx, k.binding.skill, -8, -8);
      else if (k.binding.item) drawItemIcon(ctx, k.binding.item, -8, -8);
      ctx.restore();
      // Grey while there isn't the MP for it.
      const lv = k.binding.skill ? world.char.skills[k.binding.skill] ?? 0 : 0;
      if (lv && SKILLS[k.binding.skill].type !== 'passive' && world.char.mp < skillAt(k.binding.skill, lv).mp) {
        ctx.fillStyle = 'rgba(70,110,190,0.45)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 11.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  });
  ctx.restore();
}

function drawStick(ctx, t) {
  const s = t.stick;
  const fade = STICK.alpha ?? 1;
  ctx.globalAlpha = Math.min(1, (s ? 0.62 : 0.4) * FADE) * fade;
  ctx.fillStyle = '#fffaf8';
  ctx.beginPath();
  ctx.arc(STICK.x, STICK.y, STICK.r + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b6ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Little arrows round the rim.
  ctx.fillStyle = '#9a7cc8';
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const cx = STICK.x + Math.cos(a) * (STICK.r - 4 * STICK.k);
    const cy = STICK.y + Math.sin(a) * (STICK.r - 4 * STICK.k);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.scale(STICK.k, STICK.k);
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-2.5, -4);
    ctx.lineTo(-2.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // The knob, which leans with your thumb.
  const kx = STICK.x + (s?.dx ?? 0);
  const ky = STICK.y + (s?.dy ?? 0);
  ctx.globalAlpha = Math.min(1, (s ? 0.92 : 0.6) * FADE) * fade;
  ctx.save();
  ctx.translate(kx, ky);
  ctx.scale(STICK.k, STICK.k);
  ctx.translate(-kx, -ky);
  ctx.fillStyle = '#c9b6ff';
  ctx.beginPath();
  ctx.arc(kx, ky + 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(kx, ky, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9a7cc8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(201,182,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(kx - 4, ky - 6, 6, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

// A round candy button that sinks while held.
function drawButton(ctx, t, b, time, face) {
  const fade = b.alpha ?? 1;
  if (fade <= 0) return;
  const held = b.code ? t.input.held.has(b.code) : false;
  const sink = held ? 2 : 0;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (held ? 0.95 : 0.72) * FADE) * fade;
  ctx.fillStyle = b.dark;
  ctx.beginPath();
  ctx.arc(b.x, b.y + 2, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.arc(b.x, b.y + sink, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(b.x - b.r * 0.25, b.y + sink - b.r * 0.5, b.r * 0.45, b.r * 0.22, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = b.dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b.x, b.y + sink, b.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = fade;
  ctx.save();
  ctx.translate(0, sink);
  // The face is drawn at the normal size, scaled with the button.
  const k = b.k ?? 1;
  ctx.translate(b.x, b.y);
  ctx.scale(k, k);
  ctx.translate(-b.x, -b.y);
  face();
  ctx.restore();
  if (b.label && b.r >= 16) text(ctx, b.label, b.x, b.y + b.r + 9 + sink, { size: 6.5, bold: true, align: 'center', color: '#ffffff', outline: b.dark });
  ctx.restore();
}
