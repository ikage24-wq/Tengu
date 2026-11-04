// Decorate mode (Y, or the Decorate button, on your own island): your furniture along a bar at the
// bottom; pick a piece and a see-through ghost of it follows the pointer, snapped to where it would
// go, soft green where it fits and soft red with a one-line reason where it doesn't. Click to set
// it down (it settles with a little hop and a knock); click a placed piece to pick it up and move
// it; F or right-click flips it; Delete puts it away (back in the bag, free); Ctrl+Z / Ctrl+Y undo
// and redo; hold Shift to place off the grid; Esc drops what you're holding, then leaves. You can
// still walk about while decorating, so the whole island is in reach. (research home-mounts.md:
// The Sims ghost and reason, FFXIV settings kept, Unpacking's settle.)

import { FURNITURE_BY_ID, FURN_SETS } from '../data/furniture.js';
import { placeAt, placePiece, pickUpPiece, putAway, pieceAt, furnitureInBag } from '../world/decor.js';
import { addItem, removeItem } from '../core/inventory.js';
import { drawPiece, drawPieceIcon } from '../render/furniture.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, box, text, button, hover, tooltip, tabs } from './kit.js';
import { VW, VH } from '../input.js';

const BAR_H = 54;
const TABS = ['All', ...Object.values(FURN_SETS).map((s) => s.name.split(' ')[0])];
const SET_KEYS = [null, ...Object.keys(FURN_SETS)];

export const decorating = (state) => Boolean(state.decor?.on);
export const canDecorate = (world) => Boolean(world.map.home && !world.map.guestOf && world.char.home);

export function toggleDecorate(state, world) {
  state.decor ??= { on: false, carry: null, undo: [], redo: [], tab: 0, scroll: 0, msg: null };
  const d = state.decor;
  if (d.on) return stopDecorate(state, world);
  if (!canDecorate(world)) return false;
  d.on = true;
  world.decorating = true;
  sfx('open');
  return true;
}
export function stopDecorate(state, world) {
  const d = state.decor;
  if (!d?.on) return false;
  dropCarry(d, world);
  d.on = false;
  world.decorating = false;
  sfx('close');
  return true;
}

// Let go of what you hold: a piece taken from the room goes back where it was.
function dropCarry(d, world) {
  const c = d.carry;
  if (!c) return;
  if (c.from) {
    world.char.home.placed.push(c.from);
    d.undo.pop();
  }
  d.carry = null;
}

function apply(world, rec, back) {
  const placed = world.char.home.placed;
  if (rec.kind === 'add') {
    if (back) {
      placed.splice(placed.indexOf(rec.p), 1);
      addItem(world.char.inventory, rec.p.id, 1);
    } else if (removeItem(world.char.inventory, rec.p.id, 1)) placed.push(rec.p);
  } else if (rec.kind === 'move') {
    Object.assign(rec.p, back ? rec.from : rec.to);
  } else if (rec.kind === 'remove') {
    if (back) {
      if (removeItem(world.char.inventory, rec.p.id, 1)) placed.push(rec.p);
    } else {
      placed.splice(placed.indexOf(rec.p), 1);
      addItem(world.char.inventory, rec.p.id, 1);
    }
  }
}

// Each frame while decorating (drawn under the windows). Returns true when it used the pointer.
export function drawDecorate(ui, state, world) {
  const d = state.decor;
  if (!d?.on) return false;
  if (!canDecorate(world)) {
    stopDecorate(state, world);
    return false;
  }
  const { ctx } = ui;
  const m = ui.mouse;
  const keys = ui.input.pressed;
  const cam = state.cam ?? { x: 0, y: 0 };
  const char = world.char;
  const t = performance.now() / 1000;
  const overBar = m.y > VH - BAR_H - 16;
  const wx = m.x + cam.x;
  const wy = m.y + cam.y;
  const free = ui.input.held.has('ShiftLeft') || ui.input.held.has('ShiftRight');
  const ctrl = ui.input.held.has('ControlLeft') || ui.input.held.has('ControlRight') || ui.input.held.has('MetaLeft');
  let used = false;

  // ----- Undo, redo, flip, put away -----
  if (ctrl && keys.has('KeyZ') && !d.carry && d.undo.length) {
    const rec = d.undo.pop();
    apply(world, rec, true);
    d.redo.push(rec);
    sfx('cancel');
  } else if (ctrl && (keys.has('KeyY') || (keys.has('KeyZ') && ui.input.held.has('ShiftLeft'))) && !d.carry && d.redo.length) {
    const rec = d.redo.pop();
    apply(world, rec, false);
    d.undo.push(rec);
    sfx('click');
  }
  if (d.carry && (keys.has('KeyF') || (m.right && !overBar))) {
    d.carry.flip = !d.carry.flip;
    m.right = false;
    sfx('cursor');
  }
  if (keys.has('Delete') || keys.has('Backspace')) {
    if (d.carry?.from) {
      const p = d.carry.from;
      addItem(char.inventory, p.id, 1);
      d.undo.pop();
      d.undo.push({ kind: 'remove', p });
      d.redo = [];
      d.carry = null;
      d.msg = `${FURNITURE_BY_ID[p.id].name} put away.`;
      sfx('openBag');
    } else if (d.carry) d.carry = null;
    else {
      const p = pieceAt(char, world.map.id, wx, wy);
      if (p && putAway(char, p)) {
        d.undo.push({ kind: 'remove', p });
        d.redo = [];
        d.msg = `${FURNITURE_BY_ID[p.id].name} put away.`;
        sfx('openBag');
      } else if (p) d.msg = 'Take the things off it first.';
    }
  }
  if (keys.has('Escape')) {
    if (d.carry) dropCarry(d, world);
    else stopDecorate(state, world);
    keys.delete('Escape');
    if (!d.on) return true;
  }

  // ----- The ghost, and setting it down -----
  if (d.carry && !overBar) {
    const spot = placeAt(world.map, char, d.carry.id, wx, wy, { free });
    const ok = !spot.why;
    if (spot.blocker) {
      ctx.save();
      ctx.strokeStyle = '#ff8aa0';
      ctx.lineWidth = 1;
      const b = FURNITURE_BY_ID[spot.blocker.id];
      ctx.strokeRect(spot.blocker.x - b.w / 2 - cam.x - 2, spot.blocker.y - b.h - cam.y - 2, b.w + 4, b.h + 4);
      ctx.restore();
    }
    drawPiece(ctx, { id: d.carry.id, x: spot.x, y: spot.y, flip: d.carry.flip }, spot.x - cam.x, spot.y - cam.y, t, { ghost: ok ? 'ok' : 'no', char });
    d.msg = spot.why ?? (d.carry.from ? 'Click to set it down here · F flip · Delete put away' : 'Click to place · F flip · Shift free placement');
    if (m.clicked) {
      m.clicked = false;
      used = true;
      if (ok) {
        const c = d.carry;
        const p = placePiece(world.map, char, c.id, wx, wy, { flip: c.flip, free, carried: Boolean(c.from) });
        if (typeof p === 'object') {
          p.at = t;
          if (c.from) {
            // A move: keep the same piece (its place in the undo history).
            const placed = char.home.placed;
            placed.splice(placed.indexOf(p), 1);
            const to = { x: p.x, y: p.y, flip: p.flip };
            Object.assign(c.from, to, { at: t });
            placed.push(c.from);
            d.undo[d.undo.length - 1] = { kind: 'move', p: c.from, from: c.was, to };
          } else d.undo.push({ kind: 'add', p });
          d.redo = [];
          sfx('furnPlace');
          // Keep placing more of the same while you have them (and it came from the bag).
          d.carry = !c.from && furnitureInBag(char).some((e) => e.id === c.id) ? { id: c.id, flip: c.flip } : null;
        }
      } else sfx('denied');
    }
  } else if (!d.carry && !overBar) {
    // Hover a placed piece: outline it; click to pick it up.
    const p = pieceAt(char, world.map.id, wx, wy);
    if (p) {
      const def = FURNITURE_BY_ID[p.id];
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([2, 2]);
      ctx.lineDashOffset = -t * 8;
      ctx.strokeRect(p.x - def.w / 2 - cam.x - 3, p.y - def.h - cam.y - 3, def.w + 6, def.h + 6);
      ctx.restore();
      d.msg = `${def.name} · click to move · Delete to put away`;
      if (m.clicked) {
        m.clicked = false;
        used = true;
        const r = pickUpPiece(char, p);
        if (r === p) {
          d.carry = { id: p.id, flip: p.flip, from: p, was: { x: p.x, y: p.y, flip: p.flip } };
          d.undo.push({ kind: 'move', p, from: { x: p.x, y: p.y, flip: p.flip }, to: { x: p.x, y: p.y, flip: p.flip } });
          sfx('pickup');
        } else {
          d.msg = r;
          sfx('denied');
        }
      }
    } else d.msg = d.msg && d.msg.endsWith('put away.') ? d.msg : 'Pick something from the bar, or click a piece to move it.';
  }

  // ----- The bar of your furniture -----
  const bx = 8;
  const by = VH - BAR_H - 8;
  const bw = VW - 16;
  box(ctx, bx, by, bw, BAR_H, { fill: 'rgba(255,250,252,0.95)', edge: '#f4bcd8', r: 10, width: 1.5 });
  const tab = tabs(ui, bx + 8, by - 13, TABS, d.tab, { w: 52, h: 13 });
  if (tab !== d.tab) Object.assign(d, { tab, scroll: 0 });
  const list = furnitureInBag(char).filter((e) => !SET_KEYS[d.tab] || FURNITURE_BY_ID[e.id].set === SET_KEYS[d.tab]);
  const size = 34;
  const per = Math.floor((bw - 120) / (size + 4));
  if (hover(ui, bx, by, bw, BAR_H)) d.scroll = Math.max(0, Math.min(Math.max(0, list.length - per), d.scroll + Math.sign(m.wheel || 0)));
  list.slice(d.scroll, d.scroll + per).forEach((e, i) => {
    const x = bx + 8 + i * (size + 4);
    const y = by + 6;
    const sel = d.carry && !d.carry.from && d.carry.id === e.id;
    box(ctx, x, y, size, size, { fill: sel ? '#fff3c4' : '#ffffff', edge: sel ? COLORS.select : '#eadcf3', r: 7, width: sel ? 2 : 1 });
    drawPieceIcon(ctx, e.id, x, y, size, t);
    text(ctx, `${e.n}`, x + size - 3, y + size - 3, { size: 6.5, bold: true, align: 'right', color: COLORS.ink });
    if (hover(ui, x, y, size, size)) {
      const def = FURNITURE_BY_ID[e.id];
      tooltip(ui, [{ text: def.name, bold: true }, { text: FURN_SETS[def.set].name, size: 7, color: FURN_SETS[def.set].color }, { text: def.desc, size: 7 }]);
      if (m.clicked) {
        m.clicked = false;
        used = true;
        if (d.carry?.from) dropCarry(d, world);
        d.carry = { id: e.id, flip: false };
        sfx('click');
      }
    }
  });
  if (!list.length) text(ctx, d.tab ? 'None of this set yet.' : 'No furniture yet: craft some at a bench (Home tab).', bx + 12, by + 26, { size: 8, color: COLORS.muted });
  if (button(ui, bx + bw - 104, by + 8, 44, 16, 'Undo', { size: 7, enabled: d.undo.length > 0 && !d.carry })) {
    const rec = d.undo.pop();
    apply(world, rec, true);
    d.redo.push(rec);
    used = true;
  }
  if (button(ui, bx + bw - 54, by + 8, 46, 16, 'Done', { size: 7.5, primary: true })) {
    stopDecorate(state, world);
    used = true;
  }
  text(ctx, d.msg ?? '', bx + bw - 106, by + 40, { size: 6.5, bold: true, align: 'right', color: d.carry && placeAt(world.map, char, d.carry.id, wx, wy, { free }).why ? '#e0507a' : COLORS.ink });
  if (overBar && m.clicked) {
    m.clicked = false;
    used = true;
  }
  if (used) ui.used = true;
  return used;
}
