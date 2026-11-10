// The capsule machine's window, opened at a town's machine (data/outfits-gacha.js): the set it
// holds (each piece's rarity, a check on the ones you have), your Capsule Tickets, and the crank.
// A pull spends a ticket and plays out: the crank turns and the capsules jostle, one clunks down
// the chute and rolls out, wobbles (longer for a rarer one), and pops open in its rarity's colour
// to show you wearing what was inside, ready to put on. The machine never gives you a piece you
// already have, so every ticket brings something new until the set is complete.

import { GACHA_LOOKS, GACHA_MACHINES, GACHA_PRIZES, GACHA_ALBUM, GACHA_SETS, COLOURWAYS, SHINY_CHANCE } from '../data/outfits-gacha.js';
import { SKIN_KINDS, SKIN_LABEL, ownsSkin, giveSkin } from '../data/cosmetics.js';
import { drawSkinTag, bubbleDeco, numberDeco } from '../render/cosmetics.js';
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

// What a pull can bring: the outfit pieces you don't have yet, the machine's skins you don't have,
// and its bundle of materials (always there, so a ticket never comes up empty). Each weighted by
// its rarity. Returns { look } or { prize }.
const BUNDLE_WEIGHT = 5;
export const prizeName = (z) => z.name ?? SKIN_KINDS[z.kind]?.[z.key]?.name ?? z.key;
export function pickPrize(char, machine, rng = Math.random) {
  const pool = [
    ...machineLooks(machine).filter((e) => !ownsLook(char, e)).map((e) => ({ look: e, w: WEIGHT[e.rarity] })),
    ...(GACHA_PRIZES[machine] ?? []).filter((z) => z.kind === 'bundle' || !ownsSkin(char, z.kind, z.key)).map((z) => ({ prize: z, w: z.kind === 'bundle' ? BUNDLE_WEIGHT : WEIGHT[z.rarity] })),
  ];
  let r = rng() * pool.reduce((n, e) => n + e.w, 0);
  for (const e of pool) if ((r -= e.w) < 0) return e;
  return pool.at(-1) ?? null;
}
// (Kept for the outfit pieces alone.)
export function pickLook(char, machine, rng = Math.random) {
  const left = machineLooks(machine).filter((e) => !ownsLook(char, e));
  const total = left.reduce((n, e) => n + WEIGHT[e.rarity], 0);
  let r = rng() * total;
  for (const e of left) if ((r -= WEIGHT[e.rarity]) < 0) return e;
  return left.at(-1) ?? null;
}

// A pull: spends a ticket and gives what came out (the piece to the Cash tab, a skin to your
// style, a bundle to your bag). Returns { look } or { prize }, or a reason.
export function pull(char, machine, rng = Math.random) {
  const got = pickPrize(char, machine, rng);
  if (!got) return { why: 'The machine is empty.' };
  if (countItem(char.inventory, 'gacha_ticket') < 1) return { why: 'You need a Capsule Ticket.' };
  // (Now and then a piece comes out shiny, in its set's colourway.)
  const shiny = Boolean(got.look) && Boolean(COLOURWAYS[machine]) && rng() < SHINY_CHANCE;
  if (got.look) {
    if (!addItem(char.inventory, makeCash(cashId(got.look), shiny ? 'shiny' : null))) return { why: 'Your Cash tab is full.' };
  } else if (got.prize.kind === 'bundle') {
    const z = got.prize;
    if (!z.items.every(([id, n]) => addItem(char.inventory, id, n))) return { why: 'Your bag is full.' };
  } else giveSkin(char, got.prize.kind, got.prize.key);
  removeItem(char.inventory, 'gacha_ticket', 1);
  // Into the album: which pull each one came out on (kept even if the piece is sold later).
  const a = albumOf(char, machine);
  a.pulls++;
  if (got.prize?.kind === 'bundle') a.bundles++;
  else a.got[slotKey(got)] ??= a.pulls;
  return got.look ? { look: got.look, ...(shiny ? { shiny: COLOURWAYS[machine].name } : {}) } : { prize: got.prize };
}

// The capsule album's records for a machine, and its page: every look and skin, in order.
export const albumOf = (char, machine) => ((char.album ??= {})[machine] ??= { pulls: 0, bundles: 0, got: {} });
const slotKey = (e) => (e.look ? `look:${e.look.key}` : `${e.prize.kind}:${e.prize.key}`);
export const albumSlots = (machine) => [...machineLooks(machine).map((look) => ({ look })), ...(GACHA_PRIZES[machine] ?? []).filter((z) => z.kind !== 'bundle').map((prize) => ({ prize }))];
// (Anything you have counts, for pieces won before the album came.)
export const albumFound = (char, machine, e) => albumOf(char, machine).got[slotKey(e)] != null || (e.look ? ownsLook(char, e.look) : ownsSkin(char, e.prize.kind, e.prize.key));
export const albumFull = (char, machine) => albumSlots(machine).every((e) => albumFound(char, machine, e));
// Seal a full page: its album-only skin.
export function sealAlbum(char, machine) {
  const a = albumOf(char, machine);
  const z = GACHA_ALBUM[machine];
  if (a.sealed || !z || !albumFull(char, machine)) return false;
  a.sealed = true;
  giveSkin(char, z.kind, z.key);
  return true;
}

// A prize shown in the reveal at (x, y): a sample of the skin, or the bundle's finds fanned out.
export function drawPrize(ctx, z, x, y, time, char) {
  if (z.kind === 'bundle') {
    z.items.forEach(([id], i) => drawItemIcon(ctx, id, x - 34 + i * 18, y - 10 - Math.abs(Math.sin(time * 3 + i)) * 2, 1));
    return;
  }
  const skin = SKIN_KINDS[z.kind][z.key];
  ctx.save();
  ctx.font = '800 7px Nunito, "Trebuchet MS", system-ui, sans-serif';
  if (z.kind === 'tag') drawSkinTag(ctx, skin, x, y - 6, char.name, time);
  else if (z.kind === 'bubble') {
    const w = 58;
    ctx.fillStyle = skin.fill;
    ctx.strokeStyle = skin.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 24, w, 16, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = skin.text;
    ctx.textAlign = 'center';
    ctx.fillText('Hello!', x, y - 13.4);
    bubbleDeco(ctx, skin.deco, x - w / 2, y - 24, w, 16, time);
  } else {
    const age = (time % 1.2) * 0.6;
    ctx.font = '900 16px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = skin.edge;
    ctx.strokeText('1,234', x, y - 8);
    ctx.fillStyle = skin.fill;
    ctx.fillText('1,234', x, y - 8);
    numberDeco(ctx, skin.deco, x, y - 8, 16, age);
  }
  ctx.restore();
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
  const item = p ? p.look ?? p.prize : null;
  const wob = p ? WOBBLE[item.rarity] : 0;
  const cranking = p && t < CRANK;
  // (Once the capsule pops, the machine fades back so the piece stands out in front of it.)
  const back = p && t >= wob ? 1 - 0.75 * ease(Math.min(1, (t - wob) / 0.4)) : 1;
  ctx.save();
  ctx.globalAlpha = back;
  // (The grand machine is drawn a little smaller in the window, to fit beside the lineup.)
  ctx.translate(fx - 8, fy);
  ctx.scale(0.74, 0.74);
  drawMachine(ctx, 0, 0, { crank: cranking ? Math.floor(t * 10) : 0, shake: cranking && Math.floor(t * 14) % 2 === 0, time: now, theme: machine });
  ctx.restore();
  // Idle life: a glint sliding over the globe now and then.
  const gl = (now / 3.4) % 1;
  if (!p && gl < 0.3) sparkle(ctx, fx - 22 + gl * 60, fy - 80 + gl * 10, 2.6 * Math.sin((Math.PI * gl) / 0.3), '#ffffff');
  if (p) {
    const r = item.rarity;
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
      if (p.look) drawHero(ctx, char.appearance, wornGear(char, { [p.look.slot]: { id: cashId(p.look), ...(p.shiny ? { variant: 'shiny' } : {}) } }), fx, fy - (1 - rise) * 10, { pose: 'idle', time: now, scale: 2, facing: 1, job: char.job });
      else drawPrize(ctx, p.prize, fx, fy - 40 - (1 - rise) * 10, now, char);
      ctx.restore();
      if (!p.heard) {
        p.heard = true;
        sfx('poof');
        sfx(r === 'common' ? 'tier' : 'rareDrop');
        world.log(`Out of the capsule: ${p.look ? `${p.shiny ? `${p.shiny} ` : ''}${p.look.name}` : prizeName(p.prize)} (${rarityOf(r).label})!`, LABEL_COLOR[r]);
        if (p.shiny) world.log(`✦ SHINY! It came out in the ${p.shiny} colourway!`, '#ffe36b');
      }
      // A shiny one: a ring of colour-changing sparkles turning round it.
      if (p.shiny) {
        for (let k = 0; k < 8; k++) {
          const a = now * 1.6 + (k * Math.PI * 2) / 8;
          sparkle(ctx, fx + Math.cos(a) * 34, fy - 40 + Math.sin(a) * 26, 2.2 + Math.sin(now * 5 + k) * 0.8, `hsl(${(now * 120 + k * 45) % 360}, 90%, 72%)`);
        }
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
    const lit = p && t >= wob && p.look?.key === e.key;
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
  text(ctx, all ? `Whole set: ${GACHA_SETS[machine]?.bonus ?? 'its own bonus effect'}.` : 'Wear all six for the set bonus. Never a repeat.', rx, win.y + 146, { size: 6.5, color: COLORS.muted });
  // The rest of what's inside: the skins (ticked once you have them) and the bundle.
  const prizes = GACHA_PRIZES[machine] ?? [];
  const also = prizes.map((z) => `${z.kind === 'bundle' ? prizeName(z) : `${prizeName(z)}${ownsSkin(char, z.kind, z.key) ? ' ✓' : ''}`}`).join(' · ');
  if (also) text(ctx, fit(ctx, `Also inside: ${also}`, 3 * cw - 4, 6, false), rx, win.y + 156, { size: 6, color: '#8a6ab8' });

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
    const r = item.rarity;
    text(ctx, fit(ctx, p.look ? `${p.shiny ? `${p.shiny} ` : ''}${p.look.name}` : prizeName(p.prize), 120, 8, true), lx + 60, ly + 14, { size: 8, bold: true, align: 'center', color: LABEL_COLOR[r] });
    text(ctx, p.look ? (p.shiny ? `✦ Shiny · ${rarityOf(r).label}` : rarityOf(r).label) : p.prize.kind === 'bundle' ? 'Into your bag' : `${SKIN_LABEL[p.prize.kind]} · on now`, lx + 60, ly + 24, { size: 6.5, bold: true, align: 'center', color: LABEL_COLOR[r] });
    if (!p.look) {
      // (A skin goes on at once; a bundle is in the bag.)
      if (button(ui, bx, by + 6, 74, 20, tickets > 0 ? 'Again' : 'Done', { primary: true, size: 7.5 })) {
        win.pull = null;
        if (tickets > 0) startPull(win, world);
      }
      return;
    }
    if (button(ui, bx, by + 2, 74, 13, 'Wear it', { primary: true, size: 7 })) {
      const i = char.inventory.cash.findIndex((e) => e.id === cashId(p.look) && (e.variant === 'shiny') === Boolean(p.shiny));
      if (i >= 0) wearOutfit(char, i);
      p.worn = true;
      world.log(`You're wearing the ${p.look.name}!`, '#ff8fc1');
    }
    if (button(ui, bx, by + 17, 74, 13, tickets > 0 ? 'Again' : 'Done', { size: 7 })) {
      win.pull = null;
      if (tickets > 0) startPull(win, world);
    }
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
  win.pull = { look: got.look ?? null, prize: got.prize ?? null, shiny: got.shiny ?? null, at: world.now };
  // The machine in the plaza turns its crank too, for anyone watching.
  world.map.gachaTurn = performance.now() / 1000;
  sfx('coin');
  sfx('click');
}
