// Quest moments on screen, so taking, doing and handing in a quest feels like something:
//   - taking one: a card drops in with its name and goal, then tucks itself into the tracker;
//   - an objective filling up: a little cheer rises in the middle of the screen;
//   - a quest ready: a green banner says who to report to, and the guide sets off for them;
//   - handing one in: a reward card. The giver thanks you, a "Complete!" stamp lands, and the
//     EXP, gold and items pop out one by one and fly into your EXP pill, purse and bag.
// The big moments queue up and play one at a time; the cheers stack on their own. Everything is
// eased (no snapping): cards drop with a little overshoot and fly out on a curve.

import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { ITEMS } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { questState, objectiveProgress, objectiveText } from '../core/quests.js';
import { currentLesson } from '../world/tutorial.js';
// (Under the tutorial's hint card while a lesson shows, so the two never sit on each other.)
const topOf = (world, y) => (currentLesson(world.char) ? y + 30 : y);
import { questTarget, setRoute } from '../world/routes.js';
import { settings } from '../core/settings.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, THEMES, text, box, icon, itemSlot, fit, font, sparkle, softShadow, wrap, clicked } from './kit.js';

const W = 640;
// How long each big moment stays.
const LIFE = { accept: 2.6, ready: 2.6, complete: 4.4 };
// Where the EXP pill and the purse sit in the HUD's tray (ui/hud.js).
const EXP_AT = { x: 194, y: 333 };
const GOLD_AT = { x: 178, y: 347 };

const clamp = (v) => Math.max(0, Math.min(1, v));
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeBack = (k) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
const fxOf = (world) => (world.questFx ??= { queue: [], cur: null, cheers: [], flyers: [] });

// What a quest's giver says when you hand it in: its own line, or one of theirs.
const THANKS = [
  'You did it! Thank you so much!',
  'Perfect! I knew I could count on you.',
  "Wonderful! Here, you've more than earned this.",
  "You're a lifesaver! Please, take this.",
  'Ha! Better than I hoped. This is yours.',
  "Thank you! I'll be telling everyone about you.",
  'Already? You must be quick as the wind!',
  "Oh, look at that! You're a real hero, you know.",
];
export function thanksFor(id) {
  const q = QUESTS[id];
  if (q.thanks) return q.thanks;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return THANKS[h % THANKS.length];
}

// ---------- Moments ----------

// Taking one or more quests at once.
export function questAccepted(world, ids) {
  const fx = fxOf(world);
  // From here on the watcher counts from nothing, so a quest ready the moment it's taken (the
  // items already in your bag) still gets its banner.
  const seen = (world.questSeen ??= new Map());
  for (const id of ids) seen.set(id, { have: QUESTS[id].objectives.map(() => 0), ready: false });
  fx.queue.push({ kind: 'accept', ids });
}

// Handing one in: `r` is what completeQuest paid out.
export function questCompleted(world, id, r) {
  const fx = fxOf(world);
  world.questSeen?.delete(id);
  // A finished quest's "ready" banner, still waiting its turn, has nothing left to say.
  fx.queue = fx.queue.filter((m) => !(m.kind === 'ready' && m.id === id));
  fx.queue.push({ kind: 'complete', id, r });
}

// Watches quests in progress for an objective filling up or a quest becoming ready. Quests seen
// for the first time (a loaded game) are noted quietly.
function watch(world) {
  const char = world.char;
  const seen = (world.questSeen ??= new Map());
  const fx = fxOf(world);
  for (const id of Object.keys(char.quests)) {
    if (!QUESTS[id]) continue;
    const st = questState(char, id);
    if (st !== 'active' && st !== 'ready') {
      seen.delete(id);
      continue;
    }
    const objs = objectiveProgress(char, id);
    const prev = seen.get(id);
    const now = { have: objs.map((o) => o.have), ready: st === 'ready' };
    seen.set(id, now);
    if (!prev) continue;
    // Each objective that just filled gets a cheer, unless it's the one that finished the quest
    // (the banner says it then).
    if (st !== 'ready') {
      objs.forEach((o, i) => {
        if (o.have < o.count || (prev.have[i] ?? 0) >= o.count) return;
        const { name } = objectiveText(o);
        fx.cheers.push({ at: world.now, label: o.count > 1 ? `${name} ${o.have}/${o.count}` : name });
        sfx('tier', { n: 1 });
      });
    }
    if (st === 'ready' && !prev.ready) {
      fx.queue.push({ kind: 'ready', id });
      // The guide sets off for whoever gave it, unless it's already leading you somewhere.
      const to = questTarget(char, id);
      if (to && to !== world.map.id && !world.route) setRoute(world, to);
    }
  }
}

// ---------- Drawing ----------

export function drawQuestFx(ui, state, world) {
  watch(world);
  const fx = fxOf(world);
  const { ctx } = ui;
  const t = world.now;
  // The next big moment starts once the last has gone; a long queue moves faster.
  if (fx.cur && t - fx.cur.at > fx.cur.life) fx.cur = null;
  if (!fx.cur && fx.queue.length) {
    const m = fx.queue.shift();
    m.at = t;
    m.life = LIFE[m.kind] * (fx.queue.length > 1 ? 0.7 : 1);
    m.shown = 0;
    if (m.kind === 'ready') sfx('itemGet');
    fx.cur = m;
  }
  const m = fx.cur;
  if (m?.kind === 'accept') drawAccept(ctx, world, m, t - m.at);
  else if (m?.kind === 'ready') drawReady(ctx, world, m, t - m.at);
  else if (m?.kind === 'complete') drawComplete(ui, state, world, m, t - m.at);
  drawCheers(ctx, fx, t);
  drawFlyers(ctx, state, fx, t);
}

// A card drops in under the top of the screen, holds, then shrinks off toward the tracker.
function drawAccept(ctx, world, m, age) {
  const story = m.ids.some((id) => QUESTS[id].story);
  const th = story ? THEMES.gold ?? THEMES.peach : THEMES.mint;
  const cw = 210;
  const lines = m.ids.length === 1 ? goalLines(world, m.ids[0]) : m.ids.slice(0, 3).map((id) => QUESTS[id].name);
  if (m.ids.length > 3) lines[2] = `${QUESTS[m.ids[2]].name} and ${m.ids.length - 3} more`;
  const ch = m.ids.length === 1 ? 34 + lines.length * 10 : 16 + lines.length * 12;
  const inK = easeBack(clamp(age / 0.35));
  const outK = clamp((age - (m.life - 0.5)) / 0.5);
  // On the way out it curves up into the tracker's corner.
  const trackerX = settings.trackerPos ? settings.trackerPos.x + 69 : W - 75;
  const trackerY = settings.trackerPos ? settings.trackerPos.y + 8 : 14;
  const e = outK * outK;
  const cx = (1 - e) * W / 2 + e * trackerX;
  const cy = (1 - e) * (topOf(world, 54) + (1 - inK) * -26) + e * trackerY;
  const s = (0.9 + 0.1 * inK) * (1 - 0.82 * e);
  ctx.save();
  ctx.globalAlpha = clamp(age / 0.18) * (1 - outK * outK);
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  softShadow(ctx, -cw / 2, 0, cw, ch, 10, 4);
  box(ctx, -cw / 2, 0, cw, ch, { fill: '#fffaf6', edge: th.main, r: 10, width: 2 });
  // The ribbon on top.
  const label = m.ids.length > 1 ? `${m.ids.length} NEW QUESTS` : story ? '★ STORY' : 'NEW QUEST';
  ctx.font = font(7, true);
  const rw = ctx.measureText(label).width + 22;
  box(ctx, -rw / 2, -6, rw, 13, { fill: th.main, edge: th.dark, r: 6.5, width: 1.2 });
  text(ctx, label, 0, 3.5, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: th.ink });
  if (m.ids.length === 1) {
    text(ctx, fit(ctx, QUESTS[m.ids[0]].name, cw - 24, 10.5), 0, 22, { size: 10.5, bold: true, align: 'center', color: th.ink });
    lines.forEach((l, i) => text(ctx, fit(ctx, l, cw - 30, 7, false), 0, 35 + i * 10, { size: 7, align: 'center', color: COLORS.ink }));
  } else {
    lines.forEach((l, i) => {
      icon(ctx, 'scroll', -cw / 2 + 20, 18 + i * 12, 7, th.dark);
      text(ctx, fit(ctx, l, cw - 50, 8), -cw / 2 + 28, 21 + i * 12, { size: 8, bold: true, color: th.ink });
    });
  }
  // Sparkles twinkling at its corners while it's fresh.
  const tw = clamp(1 - age / 1.4);
  if (tw > 0) {
    for (let i = 0; i < 4; i++) {
      const a = age * 3 + i * 1.6;
      sparkle(ctx, (i % 2 ? 1 : -1) * (cw / 2 - 4 + Math.sin(a) * 3), (i < 2 ? 2 : ch - 2) + Math.cos(a) * 2, 3.5 * tw * (0.6 + 0.4 * Math.sin(a * 2)), i % 2 ? '#ffe36b' : '#ffffff');
    }
  }
  ctx.restore();
}

// What a quest asks, a line each ("Defeat 15 Mandrake").
function goalLines(world, id) {
  const objs = objectiveProgress(world.char, id);
  if (!objs.length) return ['Talk to them again to finish'];
  return objs.slice(0, 3).map((o) => {
    const { verb, name } = objectiveText(o);
    return o.count > 1 ? `${verb} ${o.count} ${name}` : `${verb} ${name}`;
  });
}

// Green and bright: the quest is done, here's who to tell.
function drawReady(ctx, world, m, age) {
  const q = QUESTS[m.id];
  const giver = NPCS[q.giver];
  const to = questTarget(world.char, m.id);
  const where = to && to !== world.map.id ? ` in ${MAPS[to]?.name ?? ''}` : '';
  const pop = age < 0.3 ? 1.35 - 0.35 * easeOut(age / 0.3) : 1;
  const a = clamp(age / 0.15) * clamp((m.life - age) / 0.5);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(W / 2, 74);
  ctx.scale(pop, pop);
  // A burst of sparkles as it lands.
  const b = clamp(age / 0.9);
  if (b < 1) {
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + 0.3;
      const r = 20 + easeOut(b) * 70;
      sparkle(ctx, Math.cos(ang) * r, Math.sin(ang) * r * 0.45 - 4, 3.5 * (1 - b), i % 2 ? '#7ee081' : '#fff4a6');
    }
  }
  icon(ctx, 'check', -64, -5, 12, COLORS.good);
  text(ctx, 'Quest ready!', 6, 0, { size: 15, bold: true, align: 'center', color: '#ffffff', outline: '#2f8f52' });
  text(ctx, fit(ctx, `${q.name}: report to ${giver?.name ?? 'them'}${where}`, 300, 8), 0, 15, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: 'rgba(40,90,60,0.85)' });
  ctx.restore();
}

// The reward card: thanks, the stamp, and the rewards popping out one by one.
function drawComplete(ui, state, world, m, age) {
  const { ctx } = ui;
  const q = QUESTS[m.id];
  const r = m.r;
  const th = q.story ? THEMES.gold ?? THEMES.peach : THEMES.pink;
  const rewards = [
    { kind: 'exp', label: `+${r.exp.toLocaleString()} EXP` },
    { kind: 'gold', label: `+${r.gold.toLocaleString()} gold` },
    ...r.items.map((it) => ({ kind: 'item', it })),
  ];
  const cw = 250;
  const ch = 82;
  const x0 = W / 2 - cw / 2;
  const y0 = topOf(world, 46);
  const inK = easeBack(clamp(age / 0.3));
  const outK = clamp((age - (m.life - 0.5)) / 0.5);
  ctx.save();
  ctx.globalAlpha = clamp(age / 0.2) * (1 - outK);
  ctx.translate(W / 2, y0 + ch / 2 - outK * 10);
  const s = 0.85 + 0.15 * inK;
  ctx.scale(s, s);
  ctx.translate(-W / 2, -(y0 + ch / 2));
  softShadow(ctx, x0, y0, cw, ch, 12, 5);
  box(ctx, x0, y0, cw, ch, { fill: '#fffaf6', edge: th.main, r: 12, width: 2 });
  box(ctx, x0 + 4, y0 + 4, cw - 8, 15, { fill: th.light, edge: null, r: 8 });
  text(ctx, fit(ctx, q.name, cw - 90, 9.5), x0 + 12, y0 + 15, { size: 9.5, bold: true, color: th.ink });
  // The giver's thanks, typing out.
  const giver = NPCS[q.giver]?.name ?? '';
  const words = `${giver}: "${thanksFor(m.id)}"`;
  const typed = Math.floor(clamp((age - 0.15) / 0.9) * words.length);
  wrap(ctx, words, x0 + 12, y0 + 33, cw - 24, { size: 8.5, chars: typed, lineHeight: 10.5, color: COLORS.ink });

  // The rewards along the bottom, each popping out in turn and sending a copy flying home.
  let rx = x0 + 12;
  const ry = y0 + ch - 27;
  rewards.forEach((rw, i) => {
    const at = 0.75 + i * 0.22;
    const k = clamp((age - at) / 0.25);
    if (k <= 0) return;
    if (m.shown <= i) {
      m.shown = i + 1;
      launch(state, world, rw, rx + 8, ry + 9);
    }
    const sc = easeBack(k);
    ctx.save();
    ctx.translate(rx + 9, ry + 9);
    ctx.scale(sc, sc);
    ctx.translate(-(rx + 9), -(ry + 9));
    if (rw.kind === 'item') {
      itemSlot(ctx, rx, ry, 18, { id: rw.it.id, qty: rw.it.qty, variant: rw.it.variant === 'roll' ? null : rw.it.variant ?? null }, { shadow: false });
      rx += 22;
    } else {
      ctx.font = font(7.5, true);
      const lw = ctx.measureText(rw.label).width + 22;
      box(ctx, rx, ry + 1, lw, 16, { fill: rw.kind === 'exp' ? '#fff4d6' : '#fff1dc', edge: rw.kind === 'exp' ? '#f2d17a' : '#f0c27a', r: 8, width: 1 });
      icon(ctx, rw.kind === 'exp' ? 'star' : 'coin', rx + 9, ry + 9, 8, rw.kind === 'exp' ? COLORS.exp : '#f0b53a');
      text(ctx, rw.label, rx + 16, ry + 12, { size: 7.5, bold: true, color: rw.kind === 'exp' ? '#b8860b' : COLORS.gold });
      rx += lw + 4;
    }
    ctx.restore();
  });

  // The stamp lands: big and tilted, then it settles with a little bump.
  const sk = clamp((age - 0.3) / 0.3);
  if (sk > 0) {
    const scale = 2.2 - 1.2 * easeBack(sk);
    ctx.save();
    ctx.translate(x0 + cw - 44, y0 + 18);
    ctx.rotate(-0.18);
    ctx.scale(scale, scale);
    ctx.globalAlpha *= clamp(sk * 3) * 0.92;
    const red = '#ff5b7f';
    box(ctx, -36, -10, 72, 20, { fill: 'rgba(255,240,245,0.85)', edge: red, r: 5, width: 2 });
    box(ctx, -33, -7, 66, 14, { fill: null, edge: red, r: 3.5, width: 0.8 });
    text(ctx, 'COMPLETE!', 0, 3.5, { size: 9, bold: true, align: 'center', color: red });
    ctx.restore();
    // The thump: a ring of sparkles where it hits.
    const hit = clamp((age - 0.6) / 0.5);
    if (hit > 0 && hit < 1) {
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const rr = 26 + easeOut(hit) * 22;
        sparkle(ctx, x0 + cw - 44 + Math.cos(ang) * rr, y0 + 18 + Math.sin(ang) * rr * 0.6, 3 * (1 - hit), '#ffb3c6');
      }
    }
  }
  ctx.restore();
  // A click on the card hurries it along.
  if (age > 1 && clicked(ui, x0, y0, cw, ch)) m.life = Math.min(m.life, age + 0.5);
}

// A reward copy flying home: EXP to the EXP pill, gold to the purse, items into the bag (the
// HUD's own pickup flight).
function launch(state, world, rw, sx, sy) {
  const fx = fxOf(world);
  if (rw.kind === 'item') {
    const cam = state.cam;
    if (cam && ITEMS[rw.it.id]) (world.pickups ??= []).push({ id: rw.it.id, variant: rw.it.variant === 'roll' ? null : rw.it.variant ?? null, x: sx + cam.x, y: sy + cam.y, at: world.now });
    sfx('pickup');
    return;
  }
  const to = rw.kind === 'exp' ? EXP_AT : GOLD_AT;
  for (let i = 0; i < 5; i++) fx.flyers.push({ kind: rw.kind, sx: sx + (i - 2) * 3, sy, ex: to.x, ey: to.y, at: world.now + i * 0.06, hud: state.hud });
  sfx(rw.kind === 'gold' ? 'coin' : 'pickup');
}

function drawFlyers(ctx, state, fx, t) {
  const FLY = 0.55;
  fx.flyers = fx.flyers.filter((f) => {
    const age = t - f.at;
    if (age < 0) return true;
    if (age >= FLY) {
      if (f.kind === 'gold' && f.hud) f.hud.goldAt = t;
      return false;
    }
    const k = age / FLY;
    const e = k * k;
    const cx = (f.sx + f.ex) / 2;
    const cy = Math.min(f.sy, f.ey) - 60;
    const x = (1 - e) * (1 - e) * f.sx + 2 * (1 - e) * e * cx + e * e * f.ex;
    const y = (1 - e) * (1 - e) * f.sy + 2 * (1 - e) * e * cy + e * e * f.ey;
    ctx.globalAlpha = k < 0.8 ? 1 : (1 - k) / 0.2;
    if (f.kind === 'gold') icon(ctx, 'coin', x, y, 6 * (1 - 0.3 * k), '#f0b53a');
    else sparkle(ctx, x, y, 3.2 * (1 - 0.4 * k), '#ffd66b');
    ctx.globalAlpha = 1;
    return true;
  });
}

// The cheers: a small pill each, rising and fading in the middle of the screen.
function drawCheers(ctx, fx, t) {
  fx.cheers = fx.cheers.filter((c) => t - c.at < 1.8);
  fx.cheers.forEach((c, i) => {
    const age = t - c.at;
    const k = age / 1.8;
    const rise = easeOut(clamp(age / 0.4)) * 10 + k * 8;
    const a = clamp(age / 0.15) * (k < 0.7 ? 1 : (1 - k) / 0.3);
    const y = 128 + i * 16 - rise;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = font(7.5, true);
    const w = ctx.measureText(c.label).width + 26;
    const pop = age < 0.2 ? 1.25 - 0.25 * (age / 0.2) : 1;
    ctx.translate(W / 2, y);
    ctx.scale(pop, pop);
    box(ctx, -w / 2, -8, w, 15, { fill: 'rgba(239,252,243,0.95)', edge: COLORS.good, r: 7.5, width: 1.2 });
    icon(ctx, 'check', -w / 2 + 9, -0.5, 7, COLORS.good);
    text(ctx, c.label, -w / 2 + 16, 2.5, { size: 7.5, bold: true, color: '#2f8f52' });
    ctx.restore();
  });
}
