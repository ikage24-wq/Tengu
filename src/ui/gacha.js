// The capsule machine's window, opened at a town's machine (data/outfits-gacha.js): the set it
// holds (each piece's rarity, a check on the ones you have), your Capsule Tickets, and the crank.
// A pull spends a ticket and plays out: the crank turns and the capsules jostle, one clunks down
// the chute and rolls out, wobbles (longer for a rarer one), and pops open in its rarity's colour
// to show you wearing what was inside, ready to put on. The machine never gives you a piece you
// already have, so every ticket brings something new until the set is complete.

import { GACHA_LOOKS, GACHA_MACHINES } from '../data/outfits-gacha.js';
import { countItem, removeItem, addItem } from '../core/inventory.js';
import { makeCash } from '../core/items.js';
import { wornGear, wearOutfit } from '../core/character.js';
import { drawHero } from '../render/hero.js';
import { drawItemIcon } from '../render/icons.js';
import { drawMachine, drawCapsule, drawBurst, rarityOf } from '../render/gacha.js';
import { groundAt } from '../world/physics.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, windowFrame, text, box, button, hover, tooltip, well, sparkle, fit } from './kit.js';
import { itemTooltip } from './tooltips.js';

const W = 340;
const H = 236;
// How likely each rarity is, among the pieces you don't have yet.
export const WEIGHT = { common: 6, rare: 3, star: 1 };
const LABEL_COLOR = { common: '#4a8ac8', rare: '#8a5ad8', star: '#d4a020' };
// The pull's beats (seconds): the crank turns, the capsule drops and rolls out, wobbles, pops.
const CRANK = 0.75;
const ROLL = 1.35;
const WOBBLE = { common: 1.8, rare: 2.2, star: 2.8 };

const cashId = (e) => `cash_gacha_${e.key}`;
export const machineLooks = (machine) => GACHA_LOOKS.filter((e) => e.machine === machine);
export const ownsLook = (char, e) => char.inventory.cash.some((i) => i.id === cashId(e)) || Object.values(char.outfit ?? {}).some((i) => i?.id === cashId(e));

// Picks a piece for a pull from the ones `char` doesn't have, weighted by rarity, or null when
// the set is complete.
export function pickLook(char, machine, rng = Math.random) {
  const left = machineLooks(machine).filter((e) => !ownsLook(char, e));
  const total = left.reduce((n, e) => n + WEIGHT[e.rarity], 0);
  let r = rng() * total;
  for (const e of left) if ((r -= WEIGHT[e.rarity]) < 0) return e;
  return left.at(-1) ?? null;
}

// A pull: spends a ticket and puts the piece in the Cash tab. Returns the entry, or a reason.
export function pull(char, machine, rng = Math.random) {
  const e = pickLook(char, machine, rng);
  if (!e) return { why: 'You have the whole set!' };
  if (countItem(char.inventory, 'gacha_ticket') < 1) return { why: 'You need a Capsule Ticket.' };
  if (!addItem(char.inventory, makeCash(cashId(e)))) return { why: 'Your Cash tab is full.' };
  removeItem(char.inventory, 'gacha_ticket', 1);
  return { look: e };
}

const ease = (u) => u * u * (3 - 2 * u);

export function gachaWindow(ui, state, world) {
  const win = state.windows.gacha;
  // Walk away from the machine and the window closes.
  const at = world.map.gacha;
  if (at == null || Math.abs(at - world.body.x) > 60 || Math.abs(groundAt(world.map, at) - world.body.y) > 10) {
    win.open = false;
    win.pull = null;
    return;
  }
  const machine = world.map.town ?? world.map.id;
  const info = GACHA_MACHINES[machine];
  if (!info || !windowFrame(ui, win, W, H, info.name)) {
    win.pull = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const th = ui.theme;
  const now = world.now;

  // The machine, and the pull playing out in front of it.
  const lx = win.x + 8;
  const ly = win.y + 24;
  well(ctx, lx, ly, 120, 172, th);
  const fx = lx + 60;
  const fy = ly + 150;
  ctx.save();
  ctx.fillStyle = 'rgba(122,190,120,0.18)';
  ctx.beginPath();
  ctx.ellipse(fx + 8, fy + 1, 46, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const p = win.pull;
  const t = p ? now - p.at : 0;
  const wob = p ? WOBBLE[p.look.rarity] : 0;
  const cranking = p && t < CRANK;
  // (Once the capsule pops, the machine fades back so the piece stands out in front of it.)
  const back = p && t >= wob ? 1 - 0.75 * ease(Math.min(1, (t - wob) / 0.4)) : 1;
  ctx.save();
  ctx.globalAlpha = back;
  drawMachine(ctx, fx - 8, fy, { crank: cranking ? Math.floor(t * 10) : 0, shake: cranking && Math.floor(t * 14) % 2 === 0 });
  ctx.restore();
  // Idle life: a glint sliding over the globe now and then.
  const gl = (now / 3.4) % 1;
  if (!p && gl < 0.3) sparkle(ctx, fx - 22 + gl * 60, fy - 80 + gl * 10, 2.6 * Math.sin((Math.PI * gl) / 0.3), '#ffffff');
  if (p) {
    const r = p.look.rarity;
    if (t >= CRANK && t < wob) {
      // Out of the chute and rolling right, then a wobble that grows more eager the rarer it is.
      const u = ease(Math.min(1, (t - CRANK) / (ROLL - CRANK)));
      const w = t > ROLL ? Math.sin((t - ROLL) * (r === 'star' ? 26 : 18)) * Math.min(1, (t - ROLL) * 2) * (r === 'common' ? 1.5 : 2.6) : 0;
      ctx.save();
      ctx.translate(fx - 2 + u * 34, fy - Math.abs(Math.sin(u * Math.PI * 2)) * 4 * (1 - u));
      ctx.rotate(u * Math.PI * 4 + w * 0.12);
      drawCapsule(ctx, w, 8, { rarity: r, open: 0 });
      ctx.restore();
      // The rarity shows as a glow when it lands.
      if (t > ROLL && r !== 'common') sparkle(ctx, fx + 40 + Math.sin(t * 9) * 8, fy - 22, 2 + (t - ROLL) * 1.5, rarityOf(r).glow);
    } else if (t >= wob) {
      // Pop! The look inside, on you, in a burst of the rarity's colour.
      const v = t - wob;
      drawBurst(ctx, fx, fy - 40, Math.min(1.6, v), r);
      if (v < 0.4) drawCapsule(ctx, fx + 32, fy, { rarity: r, open: Math.min(1, v * 4) });
      const rise = ease(Math.min(1, v / 0.5));
      ctx.save();
      ctx.globalAlpha = rise;
      drawHero(ctx, char.appearance, wornGear(char, { [p.look.slot]: { id: cashId(p.look) } }), fx, fy - (1 - rise) * 10, { pose: 'idle', time: now, scale: 2, facing: 1, job: char.job });
      ctx.restore();
      if (!p.heard) {
        p.heard = true;
        sfx('poof');
        sfx(r === 'common' ? 'tier' : 'rareDrop');
        world.log(`Out of the capsule: ${p.look.name} (${rarityOf(r).label})!`, LABEL_COLOR[r]);
      }
    }
  }

  // The set: each piece, its rarity, and whether you have it.
  const rx = win.x + 136;
  text(ctx, `The ${info.set} set`, rx, win.y + 33, { size: 7, bold: true, color: th.ink });
  const looks = machineLooks(machine);
  const cw = 64;
  const ch = 50;
  looks.forEach((e, i) => {
    const x = rx + (i % 3) * cw;
    const y = win.y + 40 + Math.floor(i / 3) * ch;
    const have = ownsLook(char, e);
    const lit = p && t >= wob && p.look.key === e.key;
    box(ctx, x, y, cw - 4, ch - 4, { fill: lit ? '#fffbe6' : have ? '#f4fff2' : '#fffaf6', edge: lit ? '#ffd23f' : e.rarity === 'star' ? '#f2d27a' : '#e6dcef', r: 7, width: lit || e.rarity === 'star' ? 2 : 1 });
    ctx.save();
    if (!have) ctx.globalAlpha = 0.45;
    drawItemIcon(ctx, cashId(e), x + (cw - 4) / 2 - 12, y + 3, 1.5);
    ctx.restore();
    text(ctx, fit(ctx, e.name, cw - 8, 6.5, true), x + (cw - 4) / 2, y + 35, { size: 6.5, bold: true, align: 'center' });
    text(ctx, rarityOf(e.rarity).label, x + (cw - 4) / 2, y + 43, { size: 6, bold: true, align: 'center', color: LABEL_COLOR[e.rarity] });
    if (have) {
      box(ctx, x + 2, y + 2, 13, 8, { fill: '#7ee0a8', edge: null, r: 4 });
      text(ctx, '✓', x + 8.5, y + 8.5, { size: 6, bold: true, align: 'center', color: '#ffffff' });
    }
    if (hover(ui, x, y, cw - 4, ch - 4)) tooltip(ui, [...itemTooltip(char, cashId(e)), { text: have ? 'You have this one.' : 'Still in the machine.', size: 7, color: COLORS.muted }]);
  });
  const all = looks.every((e) => ownsLook(char, e));
  text(ctx, all ? 'Whole set: a spring bloom, a butterfly, and light at your feet.' : 'Wear all six for the set bonus. Never a repeat.', rx, win.y + 148, { size: 6.5, color: COLORS.muted });

  // Tickets and the crank, or the piece just won.
  const by = win.y + H - 40;
  box(ctx, rx, by, 3 * cw - 4, 32, { fill: '#fffaf6', edge: '#e6dcef', r: 8, width: 1 });
  const tickets = countItem(char.inventory, 'gacha_ticket');
  drawItemIcon(ctx, 'gacha_ticket', rx + 4, by + 8);
  text(ctx, `${tickets} Ticket${tickets === 1 ? '' : 's'}`, rx + 24, by + 14, { size: 8, bold: true, color: tickets ? th.ink : COLORS.bad });
  text(ctx, 'Dailies, bosses, dungeons', rx + 24, by + 24, { size: 6, color: COLORS.muted });
  if (hover(ui, rx + 4, by + 4, 70, 24)) tooltip(ui, itemTooltip(char, 'gacha_ticket'));
  const bx = rx + 3 * cw - 82;
  if (p && t < wob + 0.5) {
    text(ctx, t < CRANK ? 'Cranking...' : t < ROLL ? 'Clunk!' : 'Here it comes...', bx + 38, by + 19, { size: 8, bold: true, align: 'center', color: th.ink });
    return;
  }
  if (p && !p.worn) {
    const r = p.look.rarity;
    text(ctx, fit(ctx, p.look.name, 120, 8, true), lx + 60, ly + 14, { size: 8, bold: true, align: 'center', color: LABEL_COLOR[r] });
    text(ctx, rarityOf(r).label, lx + 60, ly + 24, { size: 6.5, bold: true, align: 'center', color: LABEL_COLOR[r] });
    if (button(ui, bx, by + 2, 74, 13, 'Wear it', { primary: true, size: 7 })) {
      const i = char.inventory.cash.findIndex((e) => e.id === cashId(p.look));
      if (i >= 0) wearOutfit(char, i);
      p.worn = true;
      world.log(`You're wearing the ${p.look.name}!`, '#ff8fc1');
    }
    if (button(ui, bx, by + 17, 74, 13, all ? 'Done' : 'Again', { size: 7, enabled: all || tickets > 0 })) win.pull = null;
    if (win.pull === null && !all) startPull(win, world);
    return;
  }
  if (all) {
    text(ctx, 'Set complete!', bx + 38, by + 19, { size: 8, bold: true, align: 'center', color: '#d4a020' });
    return;
  }
  if (button(ui, bx, by + 6, 74, 20, 'Turn the crank', { primary: true, enabled: tickets > 0, size: 7.5 })) startPull(win, world);
}

function startPull(win, world) {
  const got = pull(world.char, world.map.town ?? world.map.id);
  if (got.why) {
    win.pull = null;
    world.log(got.why, '#ffb3c6');
    return;
  }
  win.pull = { look: got.look, at: world.now };
  // The machine in the plaza turns its crank too, for anyone watching.
  world.map.gachaTurn = performance.now() / 1000;
  sfx('coin');
  sfx('click');
}
