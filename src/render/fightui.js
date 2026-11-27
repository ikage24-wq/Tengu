// The fight UI in the soft remake's look (2026-11-27), to sit beside the remade monsters and bosses:
// pastel, rounded, every edge outlined in a deeper shade of its own colour (never near-black ink),
// and everything eased with one small, springy bounce.
//   - the boss plaque (scene.js): a crown badge with its level, its name over a jelly-pill health
//     bar whose lost chunk trails after it, the cast bar sliding out under it (the cast's name on
//     the bar, filling as it goes, flashing as it lands); a pair (the Ballroom's dames, the Morays,
//     the Eclipse twins) shares one plaque, two half bars and a heart between them that beats when
//     a blow is shared;
//   - the small bars over hurt monsters, fading in on the first hit and out when they fall;
//   - the boss's name card as a fight begins, and the callouts (ui/hud.js, render/trial.js): a
//     move's hint pinned under its cast bar, anything else called out big mid-screen;
//   - the damage numbers (effects.js drawNumbers): each digit a cached glyph popping in a beat
//     after the last, a ripple along the number; crits bigger and warmer with a soft glow; heals
//     drifting up mint, your own hurts hopping then falling rose, misses wobbling lilac.
// All text is painted once into small cached canvases (keyed by the words, the style and the
// screen's pixel scale, never by time) and placed each frame; motion comes from the clock given.

import { font, roundRect, sparkle, lighten, darken } from '../ui/kit.js';
import { gfx, mix } from './pixel.js';
import { usingSkin } from '../data/cosmetics.js';
import { numberDeco } from './cosmetics.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (u) => {
  u = clamp01(u);
  return u * u * (3 - 2 * u);
};
const easeOut = (u) => 1 - (1 - clamp01(u)) ** 3;
const easeIn = (u) => clamp01(u) ** 2;
// A soft spring's step response, 0 to 1: one small overshoot (about 10%), a 1% dip, then still
// (settled by 0.7 s). Every pop in the fight UI rides it.
export function spring(t) {
  if (t <= 0) return 0;
  if (t >= 0.7) return 1;
  return 1 - Math.exp(-t * 13) * Math.cos(t * 18);
}

// ---------- Cached labels ----------
// A word painted once (outline, a soft drop in the outline's colour, a top-to-bottom fill) at the
// screen's pixel scale; drawn after that with one drawImage. At most LABEL_MAX kept (oldest out).
const LABEL_MAX = 260;
const labels = new Map();
// (Until the web font has loaded, labels are keyed apart, so the real font replaces them.)
let fontSeen = false;
function fontReady() {
  if (fontSeen) return true;
  const f = typeof document !== 'undefined' ? document.fonts : null;
  if (!f?.check) return (fontSeen = true);
  try {
    fontSeen = f.check('800 10px Nunito');
  } catch {
    fontSeen = true;
  }
  return fontSeen;
}
export const labelCount = () => labels.size;

// st: { top, bottom, edge, weight (outline as a share of the size), spacing (px), plain (no drop) }
function labelOf(str, size, st) {
  const scale = Math.max(1, Math.min(4, gfx.hd ? gfx.scale || 1 : 1));
  const key = `${str}|${size}|${st.top}|${st.bottom}|${st.edge}|${st.weight ?? ''}|${st.spacing ?? ''}|${st.bold === false ? 0 : 1}|${scale}|${fontReady() ? 1 : 0}`;
  let l = labels.get(key);
  if (l) return l;
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const bold = st.bold !== false;
  g.font = font(size, bold);
  if (st.spacing && 'letterSpacing' in g) g.letterSpacing = `${st.spacing}px`;
  const w = Math.max(1, g.measureText(str).width);
  const line = st.edge ? size * (st.weight ?? 0.24) : 0;
  const pad = Math.ceil(line + 2);
  const asc = size * 0.82;
  const desc = size * 0.26;
  const cw = Math.ceil(w + pad * 2);
  const ch = Math.ceil(asc + desc + pad * 2 + (st.plain ? 0 : size * 0.08));
  c.width = Math.ceil(cw * scale);
  c.height = Math.ceil(ch * scale);
  g.scale(scale, scale);
  g.font = font(size, bold);
  if (st.spacing && 'letterSpacing' in g) g.letterSpacing = `${st.spacing}px`;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.lineJoin = 'round';
  const x = pad;
  const y = pad + asc;
  if (st.edge) {
    // A soft drop under it in the outline's own colour, then the outline itself.
    if (!st.plain) {
      g.globalAlpha = 0.35;
      g.strokeStyle = st.edge;
      g.lineWidth = line;
      g.strokeText(str, x, y + size * 0.08);
      g.globalAlpha = 1;
    }
    g.strokeStyle = st.edge;
    g.lineWidth = line;
    g.strokeText(str, x, y);
  }
  if (st.top !== st.bottom) {
    const grad = g.createLinearGradient(0, y - asc, 0, y);
    grad.addColorStop(0, st.top);
    grad.addColorStop(1, st.bottom);
    g.fillStyle = grad;
  } else g.fillStyle = st.top;
  g.fillText(str, x, y);
  l = { c, w, cw, ch, ox: pad, oy: y };
  labels.set(key, l);
  if (labels.size > LABEL_MAX) labels.delete(labels.keys().next().value);
  return l;
}

// Draws a label with its baseline at y; align 'center' | 'left' | 'right'; `k` scales it about
// its middle (for pops). Returns its width.
function label(ctx, str, x, y, size, st, align = 'center', k = 1) {
  const l = labelOf(str, size, st);
  const ax = align === 'center' ? l.ox + l.w / 2 : align === 'right' ? l.ox + l.w : l.ox;
  const ay = l.oy - size * 0.35;
  const mx = x;
  const my = y - size * 0.35;
  ctx.drawImage(l.c, mx - ax * k, my - ay * k, l.cw * k, l.ch * k);
  return l.w;
}
const widthOf = (str, size, st) => labelOf(str, size, st).w;

// ---------- Palettes ----------
// Each bar: its fill (top, middle, bottom), its outline (a deeper shade of the fill), the chunk
// just lost (a warm cream trailing after it) and its track.
const BOSS = { top: '#ffc6de', mid: '#f68cba', bottom: '#dc6a9e', ink: '#a8467a', trail: '#ffd49a', track: 'rgba(168,70,122,0.26)', frame: '#fffaf6', badge: '#ffd6ea' };
const ELITE = { top: '#fff1b8', mid: '#ffcd5c', bottom: '#e8a23c', ink: '#9a6a12', trail: '#fff4dc', track: 'rgba(154,106,18,0.24)', frame: '#fffaf2', badge: '#fff0c4' };
const ENRAGED = { top: '#ffc2c2', mid: '#ff7f86', bottom: '#e0505e', ink: '#a8323f', trail: '#ffe4c8', track: 'rgba(168,50,63,0.26)', frame: '#fff8f6', badge: '#ffd8dc' };
const DOWN = { top: '#ece4f2', mid: '#dccfe8', bottom: '#c9b9da', ink: '#a090b4', trail: '#efe6f4', track: 'rgba(160,144,180,0.24)', frame: '#faf7fc', badge: '#ece4f2' };
const MOB = { top: '#ffb6d0', mid: '#ff8db6', bottom: '#ec6c9c', ink: '#c0558a', trail: '#ffcb88', track: 'rgba(192,85,138,0.24)', frame: '#fffaf6' };
const CAST = { top: '#fff2bc', mid: '#ffd56e', bottom: '#f0ad3c', ink: '#b0702a', trail: '#ffffff', track: 'rgba(176,112,42,0.16)', frame: '#fffaf0' };

// A jelly pill: a cream rim in the bar's ink, the track, the lost chunk trailing, the fill with a
// glossy highlight. `flash` whitens the fill (a hit), `shimmer` 0..1 sweeps a glint across it.
function pill(ctx, x, y, w, h, ratio, trail, pal, { flash = 0, shimmer = -1, rim = 1.25 } = {}) {
  const r = h / 2;
  ctx.fillStyle = pal.frame;
  roundRect(ctx, x - rim - 0.5, y - rim - 0.5, w + rim * 2 + 1, h + rim * 2 + 1, r + rim + 0.5);
  ctx.fill();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = rim;
  ctx.stroke();
  ctx.fillStyle = pal.track;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  const fw = clamp01(ratio) * w;
  const tw = clamp01(trail) * w;
  if (tw > fw + 0.25) {
    ctx.fillStyle = pal.trail;
    roundRect(ctx, x, y, tw, h, r);
    ctx.fill();
  }
  if (fw > 0.25) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, pal.top);
    g.addColorStop(0.45, pal.mid);
    g.addColorStop(1, pal.bottom);
    ctx.fillStyle = g;
    roundRect(ctx, x, y, fw, h, r);
    ctx.fill();
    // The jelly's gloss: a soft band along its top.
    if (fw > 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      roundRect(ctx, x + Math.min(r, 2), y + h * 0.14, Math.max(0, fw - Math.min(r, 2) * 2), Math.max(1, h * 0.26), h * 0.13);
      ctx.fill();
    }
    if (shimmer >= 0 && shimmer <= 1) {
      const sx = x - 14 + shimmer * (fw + 28);
      const sg = ctx.createLinearGradient(sx - 10, 0, sx + 10, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.75)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sx - 10, y, 20, h);
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.7 * flash})`;
      roundRect(ctx, x, y, fw, h, r);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- Health, eased ----------
// Each monster's shown health: the fill chases the real value on a quick soft spring, the lost
// chunk holds a beat and then drains after it; a heal lifts both.
const meters = new WeakMap();
function meterOf(m, time) {
  const r = Math.max(0, m.hp) / (m.def.hp || 1);
  let s = meters.get(m);
  if (!s) {
    s = { v: r, vel: 0, goal: r, trail: r, hold: 0, at: time, hitAt: -9, born: time, deadAt: null, fullAt: null };
    meters.set(m, s);
  }
  let dt = Math.max(0, Math.min(0.1, time - s.at));
  s.at = time;
  if (r < s.goal - 1e-5) {
    if (s.trail <= s.v + 0.002) s.hold = time + 0.45;
    s.trail = Math.max(s.trail, s.v);
    s.hitAt = time;
  }
  s.goal = r;
  // (Stepped in small slices so the spring stays steady at any frame rate.)
  while (dt > 0) {
    const h = Math.min(dt, 1 / 120);
    s.vel += ((r - s.v) * 520 - s.vel * 38) * h;
    s.v += s.vel * h;
    dt -= h;
  }
  if (Math.abs(s.v - r) < 1e-4 && Math.abs(s.vel) < 1e-3) s.v = r;
  if (time > s.hold) s.trail = r + (s.trail - r) * Math.exp(-Math.min(0.1, time - (s.trailAt ?? time)) * 3.2);
  s.trailAt = time;
  if (s.trail < Math.max(r, s.v)) s.trail = Math.max(r, s.v);
  if (r <= 0 && s.deadAt == null) s.deadAt = time;
  if (r > 0) s.deadAt = null;
  if (r >= 1 && s.fullAt == null) s.fullAt = time;
  if (r < 1) s.fullAt = null;
  return s;
}

// The small bar over a hurt monster (not bosses or elites: they have the plaque). `y` is the
// bar's top. It fades in on the first hit, and out once the monster falls or heals to full.
export function drawMobBar(ctx, m, x, y, time) {
  const hurt = m.hp < m.def.hp;
  if (!hurt && !meters.has(m)) return;
  const s = meterOf(m, time);
  if (!hurt && s.fullAt != null && time - s.fullAt > 0.4) {
    meters.delete(m);
    return;
  }
  let a = smooth((time - s.born) / 0.18);
  if (s.deadAt != null) a *= 1 - smooth((time - s.deadAt - 0.2) / 0.25);
  if (s.fullAt != null) a *= 1 - smooth((time - s.fullAt) / 0.4);
  if (a <= 0.01) return;
  const w = Math.max(24, Math.min(46, m.def.w));
  // (It settles down into place as it appears.)
  const drop = (1 - spring(time - s.born)) * -3;
  const hit = time - s.hitAt;
  ctx.save();
  ctx.globalAlpha *= a;
  pill(ctx, x - w / 2, y + drop, w, 4, s.v, s.trail, MOB, { flash: hit < 0.14 ? 1 - hit / 0.14 : 0, rim: 1 });
  ctx.restore();
}

// ---------- The boss plaque ----------
const VIEW = 640;
const CX = 320;
const BAR_Y = 64;
const BAR_H = 9;
const SOLO = { x: 192, w: 256 };
const DUO = [{ x: 192, w: 116 }, { x: 332, w: 116 }];
const CAST_Y = 80;
const CAST_W = 192;
const CAST_H = 13;
const plaque = { list: [], inAt: -9, outAt: null, wasShown: false, cast: null };
const paletteOf = (m) => (m.def.elite ? (m.enraged ? ENRAGED : ELITE) : BOSS);
const splitName = (name) => {
  const i = name.indexOf(', ');
  return i < 0 ? [name, ''] : [name.slice(0, i), name.slice(i + 2)];
};

// Which bosses the plaque shows: those alive on (or near) screen, and any boss already in the
// fight wherever it has run off to (Leonie cartwheeling across the ring keeps her bar and cast
// bar); a pair keeps its fallen sister as an empty half till the fight is done, so the layout
// never jumps.
function bossesFor(world, cam, hidden) {
  if (hidden) return [];
  const live = world.mobs.filter((m) => (m.def.boss || (m.def.elite && m.hp > 0)) && m.hp > 0 && (m.engaged || Math.abs(m.x - cam.x - VIEW / 2) < VIEW / 2 + 240));
  if (!live.length) return [];
  // (Whoever's already on it stays while the fight goes on: a sister wandering off the screen, or
  // fallen.)
  const keep = plaque.list.filter((m) => !live.includes(m) && (m.hp <= 0 ? m.def.boss : world.mobs.includes(m)));
  const all = [...live, ...keep];
  // (Never more than two: the biggest, in a steady order.)
  all.sort((a, b) => b.def.hp - a.def.hp || a.uid - b.uid);
  return all.slice(0, 2).sort((a, b) => (a.uid ?? 0) - (b.uid ?? 0));
}

// The boss plaque, on the screen (scene.js draws it over the world, held still through shakes).
export function drawBossPlaque(ctx, world, cam, time) {
  const list = bossesFor(world, cam, Boolean(world.scene));
  if (list.length) {
    if (!plaque.wasShown) {
      plaque.inAt = time;
      plaque.wasShown = true;
    }
    plaque.outAt = null;
    plaque.list = list;
  } else if (plaque.wasShown) {
    plaque.wasShown = false;
    plaque.outAt = time;
  }
  const shown = plaque.list;
  if (!shown.length) return;
  const out = plaque.outAt != null ? time - plaque.outAt : -1;
  if (out > 0.45) {
    plaque.list = [];
    plaque.cast = null;
    return;
  }
  // Slides down into place with a little bounce; lifts and fades away when the fight is done.
  const age = time - plaque.inAt;
  const a = smooth(age / 0.22) * (out >= 0 ? 1 - smooth(out / 0.45) : 1);
  const dy = (1 - spring(age)) * -10 - (out >= 0 ? easeIn(out / 0.45) * 6 : 0);
  if (a <= 0.01) return;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha *= a;
  ctx.translate(0, dy);
  if (shown.length === 1) soloBar(ctx, world, shown[0], time);
  else duoBar(ctx, world, shown, time);
  castBar(ctx, world, shown, time);
  ctx.restore();
}

const NAME_ST = (pal) => ({ top: '#ffffff', bottom: '#fff2f8', edge: pal.ink, weight: 0.26 });
const SUB_ST = (pal) => ({ top: '#fffaf6', bottom: '#ffeef6', edge: pal.ink, weight: 0.3 });

function soloBar(ctx, world, m, time) {
  const pal = paletteOf(m);
  const s = meterOf(m, time);
  const [main, epithet] = splitName(m.def.name);
  // The name over the bar: the name itself, then its title a size smaller.
  const nst = NAME_ST(pal);
  const est = SUB_ST(pal);
  const w1 = widthOf(main, 9.5, nst);
  const w2 = epithet ? widthOf(epithet, 7, est) + 4 : 0;
  const nx = CX - (w1 + w2) / 2;
  label(ctx, main, nx, BAR_Y - 4, 9.5, nst, 'left');
  if (epithet) label(ctx, epithet, nx + w1 + 4, BAR_Y - 4, 7, est, 'left');
  const hit = time - s.hitAt;
  const phase = m.phaseAt != null ? world.now - m.phaseAt : 9;
  pill(ctx, SOLO.x, BAR_Y, SOLO.w, BAR_H, s.v, s.trail, pal, { flash: hit < 0.12 ? (1 - hit / 0.12) * 0.6 : 0, shimmer: phase < 0.9 ? phase / 0.9 : -1 });
  // How much is left, to a tenth.
  const pct = Math.max(0, (m.hp / m.def.hp) * 100);
  const txt = pct >= 100 ? '100%' : pct <= 0 ? '0%' : `${pct < 0.1 ? '0.1' : pct.toFixed(1)}%`;
  numberRun(ctx, txt, SOLO.x + SOLO.w + 6, BAR_Y + BAR_H - 1, 8, styleOf('pct', pal), 'left');
  badge(ctx, SOLO.x - 7, BAR_Y + BAR_H / 2, m, pal, time, phase);
}

function duoBar(ctx, world, list, time) {
  // The heart between them, beating when a blow is shared hand in hand (world/manor.js).
  const shared = Math.min(...list.map((m) => (m.sharedAt != null ? world.now - m.sharedAt : 9)));
  list.forEach((m, i) => {
    const pal = paletteOf(m);
    const s = meterOf(m, time);
    const slot = DUO[i];
    // (Once her half has drained, it softens into lilac-grey: the grey half laid over her own, so
    // the two blend without either showing through.)
    const down = m.hp <= 0 ? smooth((time - (s.deadAt ?? time) - 0.35) / 0.5) : 0;
    const [main] = splitName(m.def.name);
    const hit = time - s.hitAt;
    const phase = m.phaseAt != null ? world.now - m.phaseAt : 9;
    const pct = Math.max(0, (m.hp / m.def.hp) * 100);
    const half = (p, a) => {
      if (a <= 0.01) return;
      ctx.save();
      ctx.globalAlpha *= a;
      label(ctx, fitName(main, slot.w + 6, 8.5, NAME_ST(p)), slot.x + slot.w / 2, BAR_Y - 4, 8.5, NAME_ST(p));
      pill(ctx, slot.x, BAR_Y, slot.w, BAR_H, s.v, s.trail, p, { flash: hit < 0.12 ? (1 - hit / 0.12) * 0.6 : 0, shimmer: phase < 0.9 ? phase / 0.9 : -1 });
      numberRun(ctx, `${pct > 0 && pct < 1 ? 1 : Math.round(pct)}%`, slot.x + slot.w / 2, BAR_Y + BAR_H - 1.5, 7, styleOf('pct', p));
      badge(ctx, i === 0 ? slot.x - 7 : slot.x + slot.w + 7, BAR_Y + BAR_H / 2, m, p, time, phase);
      ctx.restore();
    };
    if (down < 1) half(pal, 1);
    half(DOWN, down);
  });
  const beat = shared < 0.5 ? 1 + 0.35 * (1 - spring(shared)) * (shared < 0.08 ? shared / 0.08 : 1) : 1;
  const idle = 1 + 0.05 * Math.sin(time * 2.4);
  heart(ctx, CX, BAR_Y + BAR_H / 2 + 0.5, 6.5 * beat * idle, '#ff9ec5', '#a8467a');
  if (shared < 0.5) {
    ctx.save();
    ctx.globalAlpha *= 1 - shared / 0.5;
    sparkle(ctx, CX - 9 - shared * 10, BAR_Y - 1 - shared * 8, 2.6, '#fff3c4');
    sparkle(ctx, CX + 9 + shared * 10, BAR_Y - 1 - shared * 8, 2.6, '#fff3c4');
    ctx.restore();
  }
}

const fitName = (s, w, size, st) => {
  if (widthOf(s, size, st) <= w) return s;
  while (s.length > 3 && widthOf(`${s}…`, size, st) > w) s = s.slice(0, -1);
  return `${s}…`;
};

// The round badge at the bar's end: its level, a little crown on top (a star for a guild
// bounty's elite); it gives a bounce as a new phase begins.
function badge(ctx, x, y, m, pal, time, phase) {
  const k = phase < 0.7 ? 1 + 0.28 * (1 - spring(phase)) * Math.min(1, phase / 0.05) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = pal.frame;
  ctx.beginPath();
  ctx.arc(0, 0, 8.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = pal.badge;
  ctx.beginPath();
  ctx.arc(0, 0, 6.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(-1.6, -3.2, 3.2, 1.6, -0.4, 0, TAU);
  ctx.fill();
  numberRun(ctx, `${m.def.level}`, 0, 3, `${m.def.level}`.length > 2 ? 7 : 8, { top: pal.ink, bottom: pal.ink, edge: null }, 'center');
  // The crown (or star), sitting on the badge's rim, swaying a touch.
  ctx.rotate(Math.sin(time * 1.7 + (m.uid ?? 0)) * 0.06);
  if (m.def.elite) {
    ctx.fillStyle = pal.mid;
    star(ctx, 0, -10, 4.2);
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else crown(ctx, 0, -8.6, pal);
  ctx.restore();
}

function crown(ctx, x, y, pal) {
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x - 5.4, y - 4.6);
  ctx.quadraticCurveTo(x - 4, y - 2.4, x - 2.4, y - 3.4);
  ctx.lineTo(x, y - 6.2);
  ctx.lineTo(x + 2.4, y - 3.4);
  ctx.quadraticCurveTo(x + 4, y - 2.4, x + 5.4, y - 4.6);
  ctx.lineTo(x + 5, y);
  ctx.quadraticCurveTo(x, y + 1.2, x - 5, y);
  ctx.closePath();
  ctx.fillStyle = '#ffd76e';
  ctx.fill();
  ctx.strokeStyle = '#b07a2a';
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = pal.mid;
  ctx.beginPath();
  ctx.arc(x, y - 1.6, 1.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff8dc';
  for (const dx of [-5.4, 0, 5.4]) {
    ctx.beginPath();
    ctx.arc(x + dx, y - (dx ? 4.9 : 6.5), 0.9, 0, TAU);
    ctx.fill();
  }
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.5 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function heart(ctx, x, y, s, fill, ink) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 7, s / 7);
  ctx.beginPath();
  ctx.moveTo(0, 5.5);
  ctx.bezierCurveTo(-7.5, 0.5, -6.2, -6.4, -2.2, -5.6);
  ctx.bezierCurveTo(-0.9, -5.3, -0.2, -4.3, 0, -3.4);
  ctx.bezierCurveTo(0.2, -4.3, 0.9, -5.3, 2.2, -5.6);
  ctx.bezierCurveTo(6.2, -6.4, 7.5, 0.5, 0, 5.5);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(-2.6, -3, 1.5, 0.9, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// The cast bar: slides out from under the health bar as a cast begins, the cast's name on it,
// filling steadily over the cast (a loading bar: steady is honest), a twinkle riding its edge and a
// warm glow rising round it as it nears the end; at the end it flashes white, gives a little
// pop and lifts away.
function castBar(ctx, world, list, time) {
  const caster = list.find((m) => m.cast && m.hp > 0) ?? world.mobs.find((o) => o.cast && o.hp > 0 && o.def.boss);
  const c = caster?.cast;
  let rec = plaque.cast;
  if (c) {
    const key = `${caster.uid}|${c.t0}|${c.name}`;
    if (!rec || rec.key !== key) {
      const pair = list.length > 1 || caster !== list[0];
      rec = plaque.cast = { key, name: c.name, who: pair ? splitName(caster.def.name)[0] : '', inAt: time, endAt: null, u: 0 };
    }
    rec.u = clamp01((world.now - c.t0) / (c.dur || 1));
  } else if (rec && rec.endAt == null) {
    rec.endAt = time;
    // (Cast out to its end: shown full as it lands; cut short, it fades where it stopped.)
    rec.landed = rec.u > 0.85;
    if (rec.landed) rec.u = 1;
  }
  if (!rec) return;
  const end = rec.endAt != null ? time - rec.endAt : -1;
  if (end > 0.45) {
    plaque.cast = null;
    return;
  }
  const age = time - rec.inAt;
  const a = smooth(age / 0.16) * (end >= 0 ? 1 - smooth((end - 0.12) / 0.33) : 1);
  if (a <= 0.01) return;
  const slide = (1 - spring(age)) * -9 - (end >= 0 ? easeIn((end - 0.1) / 0.35) * 5 : 0);
  const grow = 0.86 + 0.14 * spring(age);
  const pop = end >= 0 && rec.landed ? 1 + 0.06 * Math.sin(Math.PI * clamp01(end / 0.22)) : 1;
  const x = CX - CAST_W / 2;
  const y = CAST_Y + slide;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(CX, y + CAST_H / 2);
  ctx.scale(grow * pop, pop);
  ctx.translate(-CX, -(y + CAST_H / 2));
  // Nearly there: a warm glow gathers round it (rising steadily, never blinking).
  const near = end >= 0 ? (rec.landed ? 1 - clamp01(end / 0.3) : 0) : smooth((rec.u - 0.7) / 0.3);
  if (near > 0) {
    ctx.fillStyle = `rgba(255,190,90,${0.35 * near})`;
    roundRect(ctx, x - 5, y - 4, CAST_W + 10, CAST_H + 8, CAST_H / 2 + 4);
    ctx.fill();
  }
  const flash = end >= 0 && rec.landed ? 1 - clamp01(end / 0.2) : 0;
  pill(ctx, x, y, CAST_W, CAST_H, rec.u, 0, CAST, { flash, rim: 1.4 });
  // The twinkle on the filling edge.
  if (rec.u > 0.02 && rec.u < 1 && end < 0) {
    const tx = x + rec.u * CAST_W;
    const tw = 2.6 + 0.7 * Math.sin(time * 9);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(tx - 1, y + CAST_H / 2, 3.2, 0, TAU);
    ctx.fill();
    sparkle(ctx, tx - 1, y + CAST_H / 2, tw + 1.4, '#ffffff');
  }
  // The cast's name across it (who's casting first, for a pair).
  const st = { top: '#fffdf6', bottom: '#fff1cf', edge: '#9a5a1a', weight: 0.28, plain: true };
  if (rec.who) {
    const wst = { top: '#fff6e6', bottom: '#ffe9c6', edge: '#9a5a1a', weight: 0.3, plain: true };
    const w1 = widthOf(`${rec.who} ·`, 6.5, wst);
    const w2 = widthOf(rec.name, 8.5, st);
    const nx = CX - (w1 + 3 + w2) / 2;
    label(ctx, `${rec.who} ·`, nx, y + CAST_H - 3.6, 6.5, wst, 'left');
    label(ctx, rec.name, nx + w1 + 3, y + CAST_H - 3.4, 8.5, st, 'left');
  } else label(ctx, fitName(rec.name, CAST_W - 14, 8.5, st), CX, y + CAST_H - 3.4, 8.5, st);
  ctx.restore();
}

// ---------- Callouts and the boss's name card ----------
// One callout at a time from each source (ui/hud.js for a dungeon, render/trial.js for the field
// and the trials). Which kind it is is settled on its first frame, so it never changes halfway:
//   'card'  a boss's name as its fight begins: the name card, its line in a speech bubble under it;
//   'move'  a cast's own name (the cast bar already says it): only its hint, pinned under the bar;
//   'call'  anything else: big across the upper middle of the screen, its line under it.
// c: the callout ({ title, sub }); o: { age, life, color }.
export function drawAnnounce(ctx, world, c, o) {
  if (!c.kind) {
    const boss = world.mobs?.find((m) => m.def.boss && m.def.name === c.title);
    const casting = world.mobs?.some((m) => m.cast && m.cast.name === c.title);
    c.kind = boss ? 'card' : casting ? 'move' : 'call';
    c.boss = boss?.def ?? null;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  if (c.kind === 'card') nameCard(ctx, c, o);
  else if (c.kind === 'move') moveHint(ctx, c, o);
  else bigCall(ctx, c, o);
  ctx.restore();
}

// Fades for a callout's whole life: in quickly, out over the last `tail` seconds.
const lifeAlpha = (age, life, tail = 0.45) => smooth(age / 0.14) * (1 - smooth((age - (life - tail)) / tail));
const outLift = (age, life, tail = 0.45) => easeIn((age - (life - tail)) / tail) * 6;

function bigCall(ctx, c, { age, life, color = '#ff8fc1' }) {
  const a = lifeAlpha(age, life);
  if (a <= 0.01) return;
  const ink = mix(darken(color, 0.45), '#5a3f7a', 0.3);
  const y = 118 - outLift(age, life);
  ctx.globalAlpha *= a;
  const k = 0.72 + 0.28 * spring(age);
  label(ctx, c.title, CX, y, 16, { top: '#ffffff', bottom: lighten(color, 0.72), edge: ink, weight: 0.24 }, 'center', k);
  if (c.sub) subPill(ctx, c.sub, CX, y + 15, age - 0.1, color, ink);
}

// A soft cream pill holding a line of text (readable over any map), popping in on the spring.
function subPill(ctx, str, x, y, age, color, ink, size = 8) {
  if (age <= 0) return;
  const st = { top: ink, bottom: ink, edge: null };
  const tw = Math.min(widthOf(str, size, st), 420);
  const txt = tw >= 420 ? fitName(str, 420, size, st) : str;
  const w = widthOf(txt, size, st) + 16;
  const h = size + 7;
  const k = 0.7 + 0.3 * spring(age);
  ctx.save();
  ctx.globalAlpha *= smooth(age / 0.12);
  ctx.translate(x, y);
  ctx.scale(k, k);
  // (Painted once as one picture, so it fades as one piece.)
  place(ctx, picture(`pill|${txt}|${size}|${color}|${ink}`, w + 4, h + 6, (g) => {
    g.translate(0, -1);
    g.fillStyle = 'rgba(90,50,120,0.14)';
    roundRect(g, -w / 2, -h / 2 + 1.5, w, h, h / 2);
    g.fill();
    g.fillStyle = 'rgba(255,250,246,0.96)';
    roundRect(g, -w / 2, -h / 2, w, h, h / 2);
    g.fill();
    g.strokeStyle = lighten(color, 0.15);
    g.lineWidth = 1.2;
    g.stroke();
    label(g, txt, 0, size * 0.36, size, st);
  }));
  ctx.restore();
}

function moveHint(ctx, c, { age, life }) {
  if (!c.sub) return;
  const a = lifeAlpha(age, life, 0.4);
  if (a <= 0.01) return;
  ctx.globalAlpha *= a;
  subPill(ctx, c.sub, CX, CAST_Y + CAST_H + 11 - outLift(age, life, 0.4) * 0.5, age - 0.08, '#f0ad3c', '#8a5414', 7.5);
}

// A picture painted once (centred on its origin, `w` x `h` round it) at the screen's pixel scale,
// so a fading card fades as one piece instead of its layers showing through each other. A few kept.
const pictures = new Map();
function picture(key, w, h, paint) {
  const scale = Math.max(1, Math.min(4, gfx.hd ? gfx.scale || 1 : 1));
  const k = `${key}|${scale}|${fontReady() ? 1 : 0}`;
  let pic = pictures.get(k);
  if (pic) return pic;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * scale);
  c.height = Math.ceil(h * scale);
  const g = c.getContext('2d');
  g.scale(scale, scale);
  g.translate(w / 2, h / 2);
  g.imageSmoothingEnabled = true;
  paint(g);
  pic = { c, w, h };
  pictures.set(k, pic);
  if (pictures.size > 12) pictures.delete(pictures.keys().next().value);
  return pic;
}
const place = (ctx, pic) => ctx.drawImage(pic.c, -pic.w / 2, -pic.h / 2, pic.w, pic.h);

// The boss's name card as its fight begins: a cream ribbon card in the boss's pink, its tails
// unfurling from behind it, a crown popping on top, its title over its name, then its first words
// in a speech bubble under it. Painted once (render/fightui.js picture), then popped and faded.
const TAIL = 18;
function nameCard(ctx, c, { age, life }) {
  const a = lifeAlpha(age, life, 0.4);
  if (a <= 0.01) return;
  const def = c.boss;
  const pal = BOSS;
  const [main, epithet] = splitName(c.title);
  const top = (epithet ? epithet : `Level ${def?.level ?? ''}`).toUpperCase() + (epithet && def ? '  ·  LV ' + def.level : '');
  const nameSt = { top: '#b0548a', bottom: '#8a3f78', edge: null };
  const topSt = { top: '#d77aa8', bottom: '#c4689a', edge: null, spacing: 1 };
  const w = Math.max(widthOf(main, 17, nameSt), widthOf(top, 6.5, topSt)) + 44;
  const h = 38;
  const W = w + TAIL * 2 + 4;
  const H = h + 10;
  const card = picture(`card|${c.title}`, W, H, (g) => {
    // The ribbon's tails behind the card.
    g.fillStyle = pal.bottom;
    g.strokeStyle = pal.ink;
    g.lineWidth = 1.2;
    g.lineJoin = 'round';
    for (const sd of [-1, 1]) {
      const ex = (sd * w) / 2 - sd * 4;
      g.beginPath();
      g.moveTo(ex, -8);
      g.lineTo(ex + sd * TAIL, -8);
      g.lineTo(ex + sd * (TAIL - 6), 1);
      g.lineTo(ex + sd * TAIL, 10);
      g.lineTo(ex, 10);
      g.closePath();
      g.fill();
      g.stroke();
    }
    g.fillStyle = 'rgba(90,50,120,0.16)';
    roundRect(g, -w / 2, -h / 2 + 3, w, h, h / 2);
    g.fill();
    g.fillStyle = pal.frame;
    roundRect(g, -w / 2, -h / 2, w, h, h / 2);
    g.fill();
    g.strokeStyle = pal.mid;
    g.lineWidth = 2.2;
    g.stroke();
    g.strokeStyle = 'rgba(246,140,186,0.4)';
    g.lineWidth = 1;
    g.setLineDash([2.5, 2.5]);
    roundRect(g, -w / 2 + 3.5, -h / 2 + 3.5, w - 7, h - 7, h / 2 - 3.5);
    g.stroke();
    g.setLineDash([]);
    label(g, top, 0, -5, 6.5, topSt);
    label(g, main, 0, 12, 17, nameSt);
  });
  const cy = 120 - outLift(age, life, 0.4);
  const k = 0.55 + 0.45 * spring(age);
  ctx.globalAlpha *= a;
  ctx.save();
  ctx.translate(CX, cy);
  ctx.scale(k, k);
  // (The tails unfurl: the picture shown out from the card's middle as they slide out.)
  const unfurl = easeOut((age - 0.08) / 0.3);
  const half = w / 2 + (TAIL + 2) * unfurl;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-half, -H, half * 2, H * 2);
  ctx.clip();
  place(ctx, card);
  ctx.restore();
  // Two sparkles at the card's ends, twinkling; the crown popping on last. (They leave a beat
  // before the card does, so nothing layered shows through as it fades.)
  const early = 1 - smooth((age - (life - 0.65)) / 0.25);
  ctx.globalAlpha *= early;
  for (const sd of [-1, 1]) {
    const tw = 0.6 + 0.4 * Math.sin(age * 5 + sd);
    sparkle(ctx, sd * (w / 2 - 14), -h / 2 + 8, 2.6 * tw * smooth((age - 0.2) / 0.2), sd < 0 ? '#ffd76e' : '#ff9ec5');
  }
  const ck = spring(age - 0.16);
  if (ck > 0) {
    ctx.save();
    ctx.translate(0, -h / 2 - 1);
    ctx.scale(ck * 1.5, ck * 1.5);
    crown(ctx, 0, 0, pal);
    ctx.restore();
  }
  ctx.restore();
  // Its first words, in a speech bubble under the card.
  const b = age - 0.32;
  if (!c.sub || b <= 0) return;
  const st = { top: '#6a3f72', bottom: '#6a3f72', edge: null };
  const txt = fitName(c.sub, 380, 8, st);
  const bw = widthOf(txt, 8, st) + 18;
  const bh = 16;
  const bubble = picture(`bubble|${txt}`, bw + 4, bh + 14, (g) => {
    g.fillStyle = 'rgba(90,50,120,0.14)';
    roundRect(g, -bw / 2, -bh / 2 + 2 + 2, bw, bh, bh / 2);
    g.fill();
    g.translate(0, 2);
    g.fillStyle = '#fffaf6';
    g.strokeStyle = '#f2b4d2';
    g.lineWidth = 1.2;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(-5, -bh / 2 + 0.5);
    g.lineTo(0, -bh / 2 - 5);
    g.lineTo(5, -bh / 2 + 0.5);
    g.fill();
    g.stroke();
    roundRect(g, -bw / 2, -bh / 2, bw, bh, bh / 2);
    g.fill();
    g.stroke();
    // (The tail's join, covered so it reads as one shape.)
    g.fillRect(-4.2, -bh / 2 - 0.4, 8.4, 2);
    label(g, txt, 0, 3, 8, st);
  });
  const bk = 0.6 + 0.4 * spring(b);
  ctx.save();
  ctx.globalAlpha *= smooth(b / 0.12);
  ctx.translate(CX, cy + h / 2 + 12);
  ctx.scale(bk, bk);
  place(ctx, bubble);
  ctx.restore();
}

// ---------- Damage numbers ----------
// Each digit a cached glyph (painted big once per style, placed scaled), so a busy fight paints
// nothing new; whole words (MISS, LINK!) are one cached label each.
const G = 28;
const STYLES = {
  hit: { top: '#ffffff', bottom: '#ffe0ef', edge: '#86508a' },
  crit: { top: '#fff1b0', bottom: '#ff9f45', edge: '#a8502e' },
  critFlash: { top: '#ffffff', bottom: '#fff6e0', edge: '#a8502e' },
  party: { top: '#f8f4ff', bottom: '#e4d9f4', edge: '#8a78a8' },
  hurt: { top: '#ffc0d0', bottom: '#ff6b8a', edge: '#9e3456' },
  hurtAlly: { top: '#ffd0dc', bottom: '#ff8fa8', edge: '#a8466a' },
  miss: { top: '#f8f4ff', bottom: '#d2c6ec', edge: '#7a6c9e' },
  total: { top: '#fff7c8', bottom: '#ffcf52', edge: '#a06a22' },
};
const styleCache = new Map();
function styleOf(kind, extra) {
  if (kind === 'pct') return { top: '#ffffff', bottom: '#fff2f8', edge: extra.ink, weight: 0.26 };
  if (STYLES[kind]) return STYLES[kind];
  // Any other colour: lighter at the top, itself at the bottom, a deeper shade of it round it.
  let st = styleCache.get(extra);
  if (!st) {
    st = { top: lighten(extra, 0.62), bottom: extra, edge: mix(darken(extra, 0.5), '#5a3f7a', 0.3) };
    styleCache.set(extra, st);
    if (styleCache.size > 40) styleCache.delete(styleCache.keys().next().value);
  }
  return st;
}
const DIGITS = /^[0-9+\-()%.,]+$/;

// Draws `str` with its baseline at y, each character its own glyph; `pop(i)` gives character i's
// [scale, lift] (a ripple), or none for a plain run. Returns its width.
function numberRun(ctx, str, x, y, size, st, align = 'center', pop = null) {
  if (!DIGITS.test(str)) {
    const [k, lift, fade = 1] = pop ? pop(0) : [1, 0];
    if (k > 0 && fade > 0.01) {
      const a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * fade;
      label(ctx, str, x, y - lift, size, st, align, k);
      ctx.globalAlpha = a0;
    }
    return widthOf(str, size, st);
  }
  const kz = size / G;
  // (Snug, a touch overlapping; drawn right to left so each glyph's fill sits over the outline of
  // the one after it, never the other way round.)
  const track = -G * 0.035;
  let total = 0;
  const gl = [];
  for (const ch of str) {
    const l = labelOf(ch, G, st);
    gl.push(l);
    total += l.w;
  }
  total = (total + track * (gl.length - 1)) * kz;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const midY = y - size * 0.36;
  const at = [];
  for (const l of gl) {
    at.push(cx);
    cx += l.w * kz + track * kz;
  }
  for (let i = gl.length - 1; i >= 0; i--) {
    const l = gl[i];
    const [s, lift, fade = 1] = pop ? pop(i) : [1, 0];
    if (s <= 0.01 || fade <= 0.01) continue;
    const w = l.w * kz;
    const k = kz * s;
    const ax = l.ox + l.w / 2;
    const ay = l.oy - G * 0.36;
    const a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * fade;
    ctx.drawImage(l.c, at[i] + w / 2 - ax * k, midY - lift - ay * k, l.cw * k, l.ch * k);
    ctx.globalAlpha = a0;
  }
  return total;
}

function kindOf(n) {
  if (n.text === 'MISS') return 'miss';
  if (n.color === '#ff6b8a') return 'hurt';
  if (n.color === '#ff8fa8') return 'hurtAlly';
  if (/^\d+$/.test(n.text)) return n.crit ? 'crit' : n.party ? 'party' : 'hit';
  return 'word';
}
const isDamage = (n) => /^\d+$/.test(n.text) && !n.small && n.color !== '#ff6b8a';
const DELAY = 2 / 60;
let side = 0;

// The numbers (effects.js drawNumbers stacks each monster's into a column first: n.lift).
export function drawDamageNumbers(ctx, world, cam) {
  const skin = usingSkin(world.char, 'dmg');
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const totals = new Map();
  for (const n of world.numbers) {
    if (n.t < DELAY) continue;
    n.side ??= side = -side || 1;
    const age = n.t - DELAY;
    const kind = kindOf(n);
    // A hit's size follows how much of the monster's HP it took; party members' are smaller.
    const wgt = n.weight ?? 0.05;
    const tier = (wgt >= 0.25 ? 1.25 : wgt >= 0.1 ? 1.1 : wgt < 0.02 ? 0.88 : 1) * (n.party ? 0.72 : 1);
    const base = (n.crit ? 17 : kind === 'miss' ? 11.5 : n.small ? 10.5 : kind === 'hurt' ? 13 : 14) * tier;
    const size = Math.max(9, base);
    const mine = skin && isDamage(n) && !n.party;
    let st;
    if (mine) {
      const fill = n.crit ? skin.crit : skin.fill;
      st = n.crit && age < 0.035 ? { top: '#ffffff', bottom: lighten(fill, 0.6), edge: skin.edge } : { top: lighten(fill, 0.45), bottom: fill, edge: skin.edge };
    } else if (kind === 'crit' && age < 0.035) st = STYLES.critFlash;
    else st = kind === 'word' ? styleOf('word', n.color) : n.text[0] === '+' || n.text[0] === '(' ? styleOf('word', n.color) : STYLES[kind];
    // Where it goes: hits rise on a little arc (fanning out, every other one leaning the other
    // way), heals drift up slow and sway, your own hurts hop and then fall away.
    let x = n.x - cam.x;
    let y;
    const hurt = kind === 'hurt' || kind === 'hurtAlly';
    if (hurt) {
      x += n.side * 6 * easeOut(age / 0.7);
      y = n.y - cam.y - 12 * easeOut(age / 0.22) + 24 * easeIn((age - 0.22) / 0.85);
    } else if (n.text[0] === '+') {
      x += Math.sin(age * 5 + n.x * 0.13) * 1.4;
      y = n.y - cam.y - easeOut(age / 0.9) * 20 - (n.lift ?? 0);
    } else {
      x += n.side * (n.small ? 4 : 9) * easeOut(age / 0.5);
      y = n.y - cam.y - (easeOut(age / 0.6) * 24 + Math.max(0, age - 0.6) * 6) - (n.lift ?? 0);
    }
    const fade = n.t > 0.78 ? clamp01((1.1 - n.t) / 0.32) : 1;
    ctx.globalAlpha = fade * smooth(age / 0.05) * (n.party ? 0.62 : tier < 1 ? 0.88 : 1);
    // A crit: a soft warm glow blooming behind it as it lands.
    if (n.crit && age < 0.32) {
      const r = size * (0.7 + 0.5 * spring(age));
      const g = ctx.createRadialGradient(x, y - size * 0.36, 0, x, y - size * 0.36, r);
      g.addColorStop(0, `rgba(255,236,170,${0.7 * (1 - age / 0.32)})`);
      g.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - size * 0.36 - r, r * 2, r * 2);
    }
    // Each character pops in a beat after the one before it (a ripple along the number), from a
    // touch big to its size, with one small bounce.
    const amp = n.crit ? 0.75 : hurt ? 0.3 : 0.42;
    const pop = (i) => {
      const t = age - i * 0.028;
      if (t <= 0) return [0, 0];
      const sp = spring(t);
      // (Each fades in at its big size and settles, never growing out of a speck.)
      return [1 + amp * (1 - sp), (1 - sp) * -2.5, smooth(t / 0.045)];
    };
    let w;
    if (kind === 'miss') {
      // A miss: a whiff, wobbling side to side and settling.
      ctx.save();
      ctx.translate(x, y - size * 0.36);
      ctx.rotate(Math.sin(age * 15) * 0.2 * (1 - easeOut(age / 0.55)));
      w = numberRun(ctx, n.text, 0, size * 0.36, size, st, 'center', (i) => pop(i * 0.6));
      ctx.restore();
    } else w = numberRun(ctx, n.text, x, y, size, st, 'center', pop);
    // A crit's two twinkles, either side.
    if (n.crit) {
      const tk = spring(age - 0.06);
      if (tk > 0) {
        const tw = 0.75 + 0.25 * Math.sin(age * 14);
        sparkle(ctx, x - w / 2 - 6, y - size * 0.62, 4.2 * tk * tw, '#ffe07a');
        sparkle(ctx, x + w / 2 + 5, y - size * 0.18, 3 * tk * (1.75 - tw), '#fff6d0');
      }
    }
    if (mine && skin.deco) {
      ctx.font = font(size, true);
      ctx.textAlign = 'center';
      numberDeco(ctx, skin.deco, x, y, size, age);
      ctx.textAlign = 'left';
    }
    if (isDamage(n)) {
      const key = Math.round(n.x / 14);
      const g = totals.get(key) ?? { sum: 0, count: 0, top: Infinity, x: n.x, oldest: 0, youngest: 9 };
      g.sum += Number(n.text);
      g.count++;
      g.top = Math.min(g.top, n.y - (n.lift ?? 0));
      g.oldest = Math.max(g.oldest, n.t);
      g.youngest = Math.min(g.youngest, n.t);
      totals.set(key, g);
    }
  }
  // Three or more hits landing on one monster together: their total rises over them, in honey.
  for (const g of totals.values()) {
    if (g.count < 3 || g.oldest - g.youngest > 0.65 || g.youngest < 0.12) continue;
    const age = g.youngest - 0.12;
    const x = g.x - cam.x;
    const y = g.top - cam.y - 34 - easeOut(age / 0.5) * 10;
    ctx.globalAlpha = (g.oldest > 0.8 ? clamp01((1.1 - g.oldest) / 0.3) : 1) * smooth(age / 0.06);
    const k = 1 + 0.35 * (1 - spring(age));
    numberRun(ctx, g.sum.toLocaleString('en-US'), x, y, 13, STYLES.total, 'center', () => [k, 0]);
  }
  ctx.restore();
}
