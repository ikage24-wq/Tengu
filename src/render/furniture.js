// Furniture (data/furniture.js), placed on your island and in your hut (world/decor.js). Drawn
// like the rest of the scenery: outlined pastel shapes lit from the upper left, in each set's own
// colours and shapes: driftwood, rope and shells (Seaside Cottage), icing, cream and strawberry
// pink (Sweet Bakery), midnight blue, gold stars and silver moons (Starry Night), brass, velvet
// and gold (Trophies). Every piece has a little life of its own: lamps glow at night, the
// hammock sways, string lights twinkle, the telescope turns, the globe spins, the clock keeps the
// island's time; trophies show what you've really done. Phases come from the piece's place in
// the world, never the screen. A piece is drawn with its base centred at (x, y).

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks } from './propkit.js';
import { art, place } from './scenery.js';
import { FURNITURE_BY_ID } from '../data/furniture.js';
import { drawItemIcon } from './icons.js';
import { drawMount } from './mounts.js';
import { FISH_BY_ID } from '../data/fishing.js';
import { gameHour } from '../world/daytime.js';

const TAU = Math.PI * 2;
const WOOD = '#c89a6a';
const DRIFT = '#d8c0a0';
const SKY = '#5fb8d8';
const NIGHT = '#4a4a8a';
const GOLD = '#ffd36b';

function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
const star = (cx, cy, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return T(pts, c);
};

// ---------- Each piece's art (its own box, base at the bottom centre) ----------
const ART = {
  sea_table(w, h) {
    const wd = ramp(DRIFT, 0.8);
    return [...planks(0, 0, w, 5, wd, 4, 1), R(4, 5, 4, h - 5, wd.sh), R(w - 8, 5, 4, h - 5, wd.sh), F(R(4, 5, 1.4, h - 5, wd.base)), F(R(w - 8, 5, 1.4, h - 5, wd.base)), R(6, h - 9, w - 12, 2, wd.sh)];
  },
  sea_chair(w, h) {
    const wd = ramp(DRIFT, 0.8);
    return [R(2, 0, 3, h, wd.sh), R(2, 0, w - 4, 3, wd.base), R(2, 6, 3, 3, wd.base), R(2, 14, w - 2, 3, wd.base), R(w - 4, 14, 3, h - 14, wd.sh), R(3, 14, 3, h - 14, wd.sh),
      R(2, 11, w - 2, 4, '#ffffff'), F(R(4, 11, 3, 4, SKY)), F(R(10, 11, 3, 4, SKY)), F(R(16, 11, 2, 4, SKY))];
  },
  sea_bed(w, h) {
    const wd = ramp(DRIFT, 0.8);
    const q = ramp('#9fd8f0', 0.75);
    const out = [R(0, 6, 5, h - 6, wd.base), R(w - 4, 14, 4, h - 14, wd.base), R(0, h - 8, w, 6, wd.sh), F(R(0, h - 8, w, 1.4, wd.base))];
    out.push(E(12, 14, 9, 5, '#ffffff'), F(E(10, 13, 5, 2.4, '#f4f0ff')));
    out.push(T([[8, h - 8], [8, 16], [w - 2, 18], [w - 2, h - 8]], q.base));
    for (let x = 12; x < w - 4; x += 10) out.push(F(T([[x, 22], [x + 5, 19], [x + 10, 22], [x + 5, 24]], '#ffffff')));
    out.push(F(R(8, h - 11, w - 10, 3, q.sh)));
    return out;
  },
  sea_lamp(w, h) {
    return [R(4, h - 3, 4, 3, DRIFT), R(5.4, 8, 1.2, h - 10, '#a8805a'),
      T([[0, 9], [6, 0], [12, 9]], '#ffd2e0'), ...[2.5, 4.5, 6, 7.5, 9.5].map((x) => F(R(x, 2, 0.6, 7, '#e8a0b8'))), F(E(6, 8, 3, 1.4, '#fff3c4'))];
  },
  sea_hammock(w, h) {
    const wd = ramp(WOOD, 0.8);
    return [R(2, 0, 4, h, wd.sh), R(w - 6, 0, 4, h, wd.sh), F(R(2, 0, 1.4, h, wd.base)), F(R(w - 6, 0, 1.4, h, wd.base)), E(4, 0, 3, 2, wd.base), E(w - 4, 0, 3, 2, wd.base)];
  },
  sea_net(w, h) {
    const net = '#e8dcc8';
    const out = [R(0, 0, w, 2, WOOD)];
    for (let k = 0; k < 6; k++) out.push(F(T([[3 + k * 7, 2], [4 + k * 7, 2], [2 + k * 6.6, h], [1 + k * 6.6, h]], net)));
    for (let k = 0; k < 4; k++) out.push(F(R(1, 6 + k * 7, w - 2, 0.8, net)));
    out.push(E(9, 12, 3, 3, '#ff8a6a'), E(30, 20, 3, 3, GOLD), star(22, 10, 5, '#ffb08a'));
    return out;
  },
  bake_table(w, h) {
    const icing = ramp('#fff4ea', 0.6);
    return [T([[2, 0], [w - 2, 0], [w, 6], [0, 6]], icing.base), ...[4, 12, 20, 28, 36].map((x) => E(x, 6, 4, 3, '#ffc2d4')), R(w / 2 - 3, 6, 6, h - 10, '#ffd2e0'), F(R(w / 2 - 3, 6, 2, h - 10, '#ffe8ef')),
      E(w / 2, h - 2, 12, 3, '#ffc2d4'), F(E(w / 2, h - 3, 10, 1.6, '#ffe0ea')), ...[8, 18, 26, 33].map((x, i) => F(R(x, 2, 2, 1, ['#ff8a8a', '#9fe0a0', '#8fd8ff', GOLD][i])))];
  },
  bake_stool(w, h) {
    return [E(w / 2, 5, 8, 4, '#c8e8b8'), F(E(w / 2, 3.6, 6.5, 2.2, '#e0f4d8')), R(1, 7, w - 2, 3, '#fff4ea'), E(w / 2, 11.5, 8, 3.6, '#c8e8b8'), R(w / 2 - 1.5, 13, 3, h - 13, '#ffd2e0'), E(w / 2, h - 1, 5, 1.6, '#ffc2d4')];
  },
  bake_lamp(w, h) {
    return [T([[1, 9], [11, 9], [9, h], [3, h]], '#ffc2d4'), ...[3, 5.5, 8].map((x) => F(R(x, 10, 1, h - 11, '#ff9ec0'))), E(6, 8, 6, 3.6, '#fff4ea'), E(3.5, 6.5, 2.5, 2, '#fff4ea'), E(8.5, 6.5, 2.5, 2, '#fff4ea'), E(6, 3, 3, 3, '#ff6b8a'), F(E(5, 2, 1, 1, '#ffd2dc'))];
  },
  bake_rug(w, h) {
    return [E(w / 2, h / 2, w / 2, h / 2, '#ff8a9a'), E(w / 2, h / 2 - 0.6, w / 2 - 4, h / 2 - 1, '#ffb3bf'), ...Array.from({ length: 9 }, (_, i) => F(E(10 + i * 6.2, h / 2 + (i % 2 ? -0.8 : 0.8), 1, 0.6, '#ffe36b'))), T([[w / 2 - 10, 0], [w / 2, 2], [w / 2 + 10, 0], [w / 2, -2]], '#7fd08a')];
  },
  bake_shelf(w, h) {
    const wd = ramp('#e8c8a8', 0.75);
    const out = [R(0, 0, w, 4, wd.base), F(R(0, 0, w, 1.2, wd.hi))];
    for (let x = 0; x < w; x += 6) out.push(E(x + 3, 4, 3, 2.4, '#ffffff'));
    out.push(T([[6, 4], [10, 4], [8, h]], wd.sh), T([[w - 10, 4], [w - 6, 4], [w - 8, h]], wd.sh));
    return out;
  },
  bake_cake(w, h) {
    return [E(w / 2, h - 1, 9, 2, '#e8e0f0'), R(3, h - 7, 12, 6, '#fff4ea'), R(5, h - 12, 8, 5, '#ffd2e0'), R(6.5, h - 16, 5, 4, '#fff4ea'), E(9, h - 17, 1.6, 1.6, '#ff6b8a'),
      ...[4, 7, 10, 13].map((x) => F(E(x + 0.5, h - 7, 1.4, 1.2, '#ffc2d4')))];
  },
  star_bed(w, h) {
    const moon = ramp('#fff3b0', 0.7);
    const out = [];
    // The crescent: a big moon curving up behind the head of the bed.
    const cres = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * 0.55 + (i / 14) * Math.PI * 1.25;
      cres.push([15 + Math.cos(a) * 15, h - 15 + Math.sin(a) * 15]);
    }
    for (let i = 14; i >= 0; i--) {
      const a = Math.PI * 0.62 + (i / 14) * Math.PI * 1.1;
      cres.push([20 + Math.cos(a) * 11, h - 18 + Math.sin(a) * 11]);
    }
    out.push(T(cres, moon.base), F(E(5, h - 16, 2.4, 5, moon.hi)));
    out.push(R(6, h - 10, w - 6, 8, '#3f3f80'), F(R(6, h - 10, w - 6, 2, '#5f5fa8')), E(16, h - 12, 7, 3.5, '#e8e8ff'));
    for (let x = 28; x < w - 4; x += 9) out.push(F(star(x, h - 6, 1.8, GOLD)));
    out.push(R(w - 4, h - 16, 4, 16, moon.sh), R(6, h - 2, w - 6, 2, '#2f2f68'));
    return out;
  },
  star_lights(w, h) {
    return [];
  },
  star_scope(w, h) {
    const br = ramp('#e0b060', 0.8);
    return [T([[w / 2, 16], [2, h], [5, h]], '#8a6a4a'), T([[w / 2, 16], [w - 2, h], [w - 5, h]], '#8a6a4a'), T([[w / 2 - 1, 16], [w / 2 + 1, 16], [w / 2 + 1, h], [w / 2 - 1, h]], '#a8805a'), E(w / 2, 16, 3, 3, br.sh)];
  },
  star_globe(w, h) {
    return [E(w / 2, h - 1, 5, 1.6, '#c8a060'), R(w / 2 - 0.6, h - 8, 1.2, 7, '#a8805a')];
  },
  star_lamp(w, h) {
    return [E(w / 2, h - 1, 7, 2, '#5f5fa8'), R(w / 2 - 1, 14, 2, h - 15, '#8f8fc8'), F(R(w / 2 - 1, 14, 0.6, h - 15, '#c8c8ff')), T([[w / 2, 13], [w / 2 + 8, 6], [w / 2 + 6, 2], [w / 2 + 2, 6]], '#8f8fc8')];
  },
  star_clock(w, h) {
    const out = [E(w / 2, h / 2, w / 2, h / 2, '#4a4a8a'), E(w / 2, h / 2, w / 2 - 2, h / 2 - 2, '#2f2f68')];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      out.push(star(w / 2 + Math.cos(a) * (w / 2 - 4.5), h / 2 + Math.sin(a) * (h / 2 - 4.5), i % 3 ? 1.2 : 2, i % 3 ? '#c8c8ff' : GOLD));
    }
    return out;
  },
  trophy_plaque(w, h) {
    const wd = ramp(WOOD, 0.8);
    return [T([[2, 0], [w - 2, 0], [w, h / 2], [w - 2, h], [2, h], [0, h / 2]], wd.base), F(T([[4, 2], [w - 4, 2], [w - 2, h / 2], [w - 4, h - 2], [4, h - 2], [2, h / 2]], wd.hi)), R(8, h - 6, w - 16, 4, '#ffe08a')];
  },
  trophy_figure(w, h) {
    return [E(w / 2, h - 2, 8, 2.6, '#a8805a'), F(E(w / 2, h - 3, 6.5, 1.4, '#c89a6a'))];
  },
  trophy_cup(w, h) {
    const g = ramp(GOLD, 0.7);
    return [R(3, h - 4, 10, 4, '#7a5a8a'), R(6.5, h - 8, 3, 4, g.sh), T([[1, 2], [15, 2], [12, 12], [4, 12]], g.base), F(T([[3, 3], [7, 3], [6, 11], [5, 11]], g.hi)), T([[1, 3], [-2, 6], [3, 9]], g.sh), T([[15, 3], [18, 6], [13, 9]], g.sh)];
  },
  trophy_crown(w, h) {
    return [E(w / 2, h - 4, 9, 4, '#a04a7a'), F(E(w / 2, h - 5.4, 7, 2, '#d070a0')), ...[[1, h - 1], [w - 1, h - 1]].map(([x, y]) => E(x, y, 1.6, 2, GOLD))];
  },
  trophy_ribbon(w, h) {
    return [T([[w / 2 - 6, 12], [w / 2 - 2, 12], [w / 2 - 5, h], [w / 2 - 8, h - 3]], '#5fb8d8'), T([[w / 2 + 2, 12], [w / 2 + 6, 12], [w / 2 + 8, h - 3], [w / 2 + 5, h]], '#5fb8d8'),
      ...Array.from({ length: 12 }, (_, i) => E(w / 2 + Math.cos((i / 12) * TAU) * 7, 9 + Math.sin((i / 12) * TAU) * 7, 3, 3, '#ffe36b')), E(w / 2, 9, 6, 6, '#ffb03a'), E(w / 2, 9, 4.6, 4.6, '#fff3c4')];
  },
};

function pieceSprite(def) {
  const pad = 4;
  return art(`furn|${def.id}`, def.w + pad * 2, def.h + pad, () => ART[def.id](def.w, def.h).map((s) => {
    const o = { ...s };
    if (o.t === 'p') o.pts = o.pts.map(([x, y]) => [x + pad, y + pad]);
    else { o.x += pad; o.y += pad; }
    return o;
  }), false);
}

// What a trophy shows, from its owner's record (`char`, yours or a friend's when visiting).
export function trophyNote(def, char) {
  if (def.show === 'fish') {
    const best = Object.entries(char?.fishBook ?? {}).filter(([id, r]) => r.best && FISH_BY_ID[id]).sort((a, b) => b[1].best - a[1].best)[0];
    return best ? { fish: best[0], text: `${FISH_BY_ID[best[0]].name} ${best[1].best} cm` } : { text: 'Catch something!' };
  }
  if (def.show === 'grade') {
    const order = ['C', 'B', 'A', 'S'];
    const best = Object.values(char?.dungeons ?? {}).map((r) => r.best).filter(Boolean).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
    return { text: best ?? '-' };
  }
  if (def.show === 'crown') return { on: Object.values(char?.dungeons ?? {}).some((r) => (r.hardClears ?? 0) > 0) };
  if (def.show === 'mount') return { mount: char?.mount ?? null };
  if (def.show === 'derby') return { text: String(char?.derbyWins ?? 0) };
  return null;
}

const riders = new Map();
// Draws one placed piece (p: { id, x, y, flip }) at screen (x, y); `ghost` draws it see-through and
// tinted (green fits, red doesn't), for Decorate mode.
export function drawPiece(ctx, p, x, y, time, { night = 0, char = null, ghost = null, alpha = 1 } = {}) {
  const def = FURNITURE_BY_ID[p.id];
  if (!def) return;
  const s = pieceSprite(def);
  const wx = p.x;
  // Just set down: a little hop and settle (never a squash).
  if (p.at != null) {
    const k = (performance.now() / 1000 - p.at) / 0.4;
    if (k >= 0 && k < 1) y -= Math.abs(Math.sin(k * Math.PI * 2)) * 3 * (1 - k);
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (ghost) ctx.globalAlpha *= 0.62;
  // The hammock's sling and sway, behind its posts' fronts.
  if (def.id === 'sea_hammock') {
    const sw = Math.sin(time * 1.2 + wx * 0.01) * 2.4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - def.w / 2 + 4, y - def.h + 4);
    ctx.quadraticCurveTo(x + sw, y - def.h + 30, x + def.w / 2 - 4, y - def.h + 4);
    ctx.stroke();
    ctx.strokeStyle = SKY;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - def.w / 2 + 12, y - def.h + 12);
    ctx.quadraticCurveTo(x + sw, y - def.h + 30, x + def.w / 2 - 12, y - def.h + 12);
    ctx.stroke();
  }
  // String lights: a sagging string of little stars, twinkling.
  if (def.id === 'star_lights') {
    const top = y - def.h;
    ctx.strokeStyle = '#6a6aa8';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const px = x - def.w / 2 + u * def.w;
      const py = top + 2 + Math.sin(Math.PI * u) * 9;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    for (let i = 1; i < 9; i++) {
      const u = i / 9;
      const px = x - def.w / 2 + u * def.w;
      const py = top + 4 + Math.sin(Math.PI * u) * 9;
      const tw = 0.6 + 0.4 * Math.sin(time * 3 + i * 1.7 + wx);
      glow(ctx, px, py, 7, '#fff3a6', (0.25 + night * 0.6) * tw);
      ctx.fillStyle = i % 2 ? GOLD : '#ffc2e6';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? 1.1 : 2.6;
        ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
      }
      ctx.fill();
    }
  }
  ctx.save();
  if (p.flip) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }
  place(ctx, s, Math.round(x), Math.round(y));
  ctx.restore();
  const top = y - def.h;
  // ----- Each piece's moving parts -----
  if (def.id === 'sea_lamp' || def.id === 'bake_lamp') glow(ctx, x, top + 6, 18, '#ffe08a', 0.2 + night * 0.6);
  if (def.id === 'bake_cake') {
    // Its glass dome, see-through, with a shine.
    ctx.save();
    ctx.globalAlpha *= 0.3;
    ctx.fillStyle = '#e6f6ff';
    ctx.beginPath();
    ctx.ellipse(x, y - 10, 8.6, 10, 0, Math.PI, 0);
    ctx.lineTo(x + 8.6, y - 1);
    ctx.lineTo(x - 8.6, y - 1);
    ctx.fill();
    ctx.globalAlpha /= 0.3;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x - 3, y - 13, 4, Math.PI * 1.1, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }
  if (def.id === 'star_lamp') {
    const fx = x + (p.flip ? -1 : 1) * 5;
    glow(ctx, fx, top + 6, 22, '#e8e8ff', 0.2 + night * 0.65);
  }
  if (def.id === 'star_scope') {
    // The tube, turning slowly to follow the stars.
    const a = -0.6 + Math.sin(time * 0.15 + wx) * 0.35;
    ctx.save();
    ctx.translate(x, top + 16);
    ctx.rotate(p.flip ? -a + Math.PI : a);
    ctx.fillStyle = '#e0b060';
    ctx.fillRect(-12, -3, 24, 6);
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(-12, -3, 24, 1.6);
    ctx.fillStyle = '#a8805a';
    ctx.fillRect(10, -4, 4, 8);
    ctx.restore();
  }
  if (def.id === 'star_globe') {
    // The planet, spinning: bands drift across it under its tilted ring.
    const cx = x;
    const cy = top + 7;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, TAU);
    ctx.fillStyle = '#b48cff';
    ctx.fill();
    ctx.clip();
    for (let k = -1; k < 3; k++) {
      ctx.fillStyle = k % 2 ? '#d8c4ff' : '#8f6fe0';
      ctx.fillRect(cx - 6 + (((time * 4 + k * 5) % 12) + 12) % 12 - 6, cy - 6, 2.2, 12);
    }
    ctx.restore();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 9, 2.6, -0.3, 0, TAU);
    ctx.stroke();
  }
  if (def.id === 'star_clock') {
    // Its hands keep the island's own time (world/daytime.js).
    const hr = gameHour(new Date());
    const cx = x;
    const cy = top + def.h / 2 + 4;
    for (const [a, len, wdt] of [[(hr / 12) * TAU, 5, 1.6], [((hr % 1) * TAU), 8, 1]]) {
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = wdt;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len);
      ctx.stroke();
    }
  }
  // ----- Trophies: what you've really done -----
  if (def.show && !ghost) {
    const n = trophyNote(def, char);
    if (def.show === 'fish') {
      if (n.fish) drawItemIcon(ctx, n.fish, x - 8, top + 1, 1);
      ctx.fillStyle = '#5a3a2a';
      ctx.font = 'bold 3.6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, x, y - 2.4, def.w - 8);
    } else if (def.show === 'grade') {
      ctx.fillStyle = '#8a5a1a';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, x, top + 12);
    } else if (def.show === 'derby') {
      ctx.fillStyle = '#8a5a1a';
      ctx.font = 'bold 5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, x, top + 15);
    } else if (def.show === 'crown' && n.on) {
      const bob = Math.sin(time * 1.6 + wx) * 0.6;
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(x - 7, top + 10 + bob);
      for (const [dx, dy] of [[-7, 2], [-4, 6], [0, 0], [4, 6], [7, 2], [7, 10], [-7, 10]]) ctx.lineTo(x + dx, top + dy + 4 + bob);
      ctx.fill();
      ctx.fillStyle = '#ff6b8a';
      ctx.fillRect(x - 1, top + 9 + bob, 2, 2);
      glow(ctx, x, top + 9, 10, '#fff3a6', 0.3 + 0.15 * Math.sin(time * 2 + wx));
    } else if (def.show === 'mount' && n.mount) {
      let st = riders.get(p);
      if (!st) riders.set(p, (st = {}));
      ctx.save();
      ctx.translate(x, y - 3);
      ctx.scale(0.32 * (p.flip ? -1 : 1), 0.32);
      drawMount(ctx, st, n.mount, 0, 0, time, { facing: 1 });
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }
  if (ghost) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = ghost === 'ok' ? '#7fe0a0' : '#ff8aa0';
    ctx.fillRect(x - def.w / 2 - 6, y - def.h - 8, def.w + 12, def.h + 10);
  }
  ctx.restore();
}

// A piece's icon for the Decorate bar and the craft list: the piece fitted into a box.
export function drawPieceIcon(ctx, id, x, y, size, time) {
  const def = FURNITURE_BY_ID[id];
  if (!def) return;
  const k = Math.min(1.4, (size - 4) / Math.max(def.w, def.h + 4));
  ctx.save();
  ctx.translate(x + size / 2, y + size - 3);
  ctx.scale(k, k);
  drawPiece(ctx, { id, x: 0, y: 0 }, 0, 0, time, { night: 0 });
  ctx.restore();
}

// Every piece placed on this map, back to front: rugs, wall hangings, hanging things, things on
// the floor, then things on top of them. `char` is whose home it is (for the trophies).
export function drawFurniture(ctx, map, placed, cam, width, time, char) {
  if (!placed?.length) return;
  const order = { rug: 0, wall: 1, hang: 2, floor: 3, surface: 4 };
  const list = placed.filter((p) => p.map === map.id && FURNITURE_BY_ID[p.id]).sort((a, b) => order[FURNITURE_BY_ID[a.id].layer] - order[FURNITURE_BY_ID[b.id].layer]);
  for (const p of list) {
    const x = p.x - cam.x;
    if (x < -80 || x > width + 80) continue;
    drawPiece(ctx, p, x, p.y - cam.y, time, { night: map.night ?? 0, char });
  }
}

// (Kept for the hammock posts and the like: mixing a colour toward white.)
export const lighten = (c, k) => mix(c, '#ffffff', k);
