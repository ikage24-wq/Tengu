// The world map (M): Tengu Island drawn in the game's pastel style, with every map as a stop on
// the roads its portals make, the four job towns, a bouncing "you are here" pin, and fast travel
// between towns.

import { MAPS, TOWNS, getMap } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { JOBS } from '../data/jobs.js';
import { travelTo, travelCost } from '../world/world.js';
import { COLORS, windowFrame, text, box, button, hover, clicked, tooltip, roundRect, font } from './kit.js';

const W = 420;
const H = 290;
const MAP_W = 400;
const MAP_H = 240;
const INK = '#5a3f7a';

// Ground colors per region, by map theme.
const LAND = {
  town: '#c4eeb0', meadow: '#c4eeb0', harbor: '#ffe4b8', forest: '#9fd8a2', grove: '#cdb8f2',
  ruins: '#d9cdf7', cave: '#b3a3df', crag: '#f6c793', sky: '#ffffff',
};
// Each job town's banner color.
const JOB_COLORS = { archer: '#6fcf8a', thief: '#9b7cd6', warrior: '#ff8a5c', mage: '#7fa8ff' };

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Roads: one per pair of maps joined by a portal.
const ROADS = (() => {
  const seen = new Set();
  const out = [];
  for (const m of Object.values(MAPS)) {
    for (const p of m.portals) {
      if (!p.to || !MAPS[p.to]) continue;
      const key = [m.id, p.to].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([m.id, p.to]);
    }
  }
  return out;
})();

function levelRange(map) {
  const levels = map.spawns.map((s) => MOBS[s.mob].level);
  if (!levels.length) return null;
  const lo = Math.min(...levels);
  const hi = Math.max(...levels);
  return lo === hi ? `Lv ${lo}` : `Lv ${lo}-${hi}`;
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawSea(ctx, ox, oy, time) {
  const g = ctx.createLinearGradient(0, oy, 0, oy + MAP_H);
  g.addColorStop(0, '#a9dcff');
  g.addColorStop(1, '#c9ecff');
  ctx.fillStyle = g;
  roundRect(ctx, ox, oy, MAP_W, MAP_H, 6);
  ctx.fill();
  // Little waves that shimmer.
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const x = ox + 8 + hash(i) * (MAP_W - 24);
    const y = oy + 8 + hash(i + 50) * (MAP_H - 16);
    const s = Math.sin(time * 2 + i) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 3, y - 2 - s * 0.3, x + 6, y);
    ctx.quadraticCurveTo(x + 9, y + 2, x + 12, y);
    ctx.stroke();
  }
}

// The island: overlapping blobs around every ground-level map, outlined as one shape, then each
// region tinted by its theme.
function drawIsland(ctx, ox, oy) {
  const land = Object.values(MAPS).filter((m) => m.world && m.theme !== 'sky');
  const blobs = land.flatMap((m) => [[m.world.x, m.world.y, m.isTown ? 40 : 34], [m.world.x + 14, m.world.y + 10, 26], [m.world.x - 12, m.world.y + 8, 24]]);
  // Land along every road, so the regions join into one island.
  for (const [a, b] of ROADS) {
    const p = MAPS[a].world;
    const q = MAPS[b].world;
    if (!p || !q || MAPS[a].theme === 'sky' || MAPS[b].theme === 'sky') continue;
    const steps = Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 12);
    for (let k = 1; k < steps; k++) blobs.push([p.x + ((q.x - p.x) * k) / steps, p.y + ((q.y - p.y) * k) / steps, 24]);
  }
  ctx.fillStyle = '#7fb8e8';
  for (const [x, y, r] of blobs) circle(ctx, ox + x, oy + y + 3, r + 2);
  ctx.fillStyle = '#ffeacc';
  for (const [x, y, r] of blobs) circle(ctx, ox + x, oy + y, r + 2);
  ctx.fillStyle = '#8a6fb0';
  for (const [x, y, r] of blobs) circle(ctx, ox + x, oy + y, r - 2.5);
  ctx.fillStyle = '#c4eeb0';
  for (const [x, y, r] of blobs) circle(ctx, ox + x, oy + y, r - 3.5);
  for (const m of land) {
    const c = LAND[m.theme] ?? LAND.meadow;
    const g = ctx.createRadialGradient(ox + m.world.x, oy + m.world.y, 4, ox + m.world.x, oy + m.world.y, 36);
    g.addColorStop(0, c);
    g.addColorStop(0.7, c);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    circle(ctx, ox + m.world.x, oy + m.world.y, 30);
  }
}

// Little landmarks around each region: mesas, trees, flowers, crystals, and pillars.
function drawDecor(ctx, ox, oy, time) {
  for (const m of Object.values(MAPS)) {
    if (!m.world || m.theme === 'sky' || m.id === 'bossroom') continue;
    for (let k = 0; k < 6; k++) {
      const a = hash(k + m.world.x) * Math.PI * 2;
      const d = 14 + hash(k * 3 + m.world.y) * 14;
      const x = ox + m.world.x + Math.cos(a) * d;
      const y = oy + m.world.y + Math.sin(a) * d * 0.7;
      ctx.lineWidth = 1;
      switch (m.theme) {
        case 'crag':
          ctx.fillStyle = '#e8a86b';
          ctx.strokeStyle = '#a8673e';
          roundRect(ctx, x - 5, y - 6, 10, 7, 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f7d2a6';
          ctx.fillRect(Math.round(x - 4), Math.round(y - 6), 8, 2);
          break;
        case 'forest':
        case 'grove':
          ctx.fillStyle = '#9f7a57';
          ctx.fillRect(Math.round(x - 0.5), Math.round(y - 2), 1.5, 4);
          ctx.fillStyle = m.theme === 'grove' ? '#a68be0' : '#5fb878';
          ctx.strokeStyle = m.theme === 'grove' ? '#6a52a8' : '#3f8a58';
          ctx.beginPath();
          ctx.arc(x, y - 4, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'ruins':
          ctx.fillStyle = '#f3edff';
          ctx.strokeStyle = '#8f7cd0';
          ctx.fillRect(Math.round(x - 1.5), Math.round(y - 6), 3, 6);
          ctx.strokeRect(Math.round(x - 1.5) + 0.5, Math.round(y - 6) + 0.5, 3, 6);
          break;
        case 'cave':
          ctx.fillStyle = k % 2 ? '#a8e8ff' : '#e0b8ff';
          ctx.beginPath();
          ctx.moveTo(x - 2.5, y);
          ctx.lineTo(x, y - 7);
          ctx.lineTo(x + 2.5, y);
          ctx.fill();
          break;
        case 'harbor':
          if (k < 3) break;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(x), Math.round(y - 5), 1, 5);
          ctx.fillStyle = '#ff9ec0';
          ctx.beginPath();
          ctx.moveTo(x + 1, y - 5);
          ctx.lineTo(x + 5, y - 1);
          ctx.lineTo(x + 1, y - 1);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = ['#ff9ec0', '#ffe36b', '#ffffff', '#c9a6ff'][k % 4];
          circle(ctx, x, y, 1.4);
      }
    }
  }
  // A sailboat drifting around the coast.
  const t = time * 0.05;
  const bx = ox + 200 + Math.cos(t) * 190;
  const by = oy + 120 + Math.sin(t) * 112;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(bx - 5, by);
  ctx.lineTo(bx + 5, by);
  ctx.lineTo(bx + 3, by + 2.5);
  ctx.lineTo(bx - 3, by + 2.5);
  ctx.fill();
  ctx.fillStyle = '#ff9ec0';
  ctx.beginPath();
  ctx.moveTo(bx, by - 8);
  ctx.lineTo(bx + 4, by - 1);
  ctx.lineTo(bx, by - 1);
  ctx.fill();
}

// The floating Sky Garden, with a cloud underneath it.
function drawSkyIsland(ctx, ox, oy, time) {
  const m = MAPS.sky;
  const x = ox + m.world.x;
  const y = oy + m.world.y + Math.sin(time * 1.2) * 1.5;
  ctx.fillStyle = '#ffffff';
  for (const [dx, dy, r] of [[-12, 8, 8], [0, 10, 10], [12, 8, 8]]) circle(ctx, x + dx, y + dy, r);
  ctx.fillStyle = '#d9c6ff';
  ctx.strokeStyle = '#8a6fb0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x + 16, y);
  ctx.lineTo(x + 2, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9fe0b0';
  ctx.beginPath();
  ctx.ellipse(x, y, 17, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawRoads(ctx, ox, oy) {
  for (const [a, b] of ROADS) {
    const p = MAPS[a].world;
    const q = MAPS[b].world;
    if (!p || !q) continue;
    const sky = MAPS[a].theme === 'sky' || MAPS[b].theme === 'sky' || a === 'bossroom' || b === 'bossroom';
    // A gentle curve between the two stops.
    const mx = (p.x + q.x) / 2 + (q.y - p.y) * 0.12;
    const my = (p.y + q.y) / 2 - (q.x - p.x) * 0.12;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(ox + p.x, oy + p.y);
      ctx.quadraticCurveTo(ox + mx, oy + my, ox + q.x, oy + q.y);
    };
    ctx.setLineDash(sky ? [3, 3] : []);
    if (!sky) {
      ctx.strokeStyle = '#b08a6a';
      ctx.lineWidth = 5;
      path();
      ctx.stroke();
    }
    ctx.strokeStyle = sky ? '#ffffff' : '#fff4e0';
    ctx.lineWidth = sky ? 1.5 : 3;
    path();
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// A tiny cottage with a roof and a flag in the job's color.
function drawTown(ctx, x, y, color, big) {
  const s = big ? 1.25 : 1;
  ctx.lineWidth = 1;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#fff6ec';
  ctx.fillRect(Math.round(x - 6 * s), Math.round(y - 6 * s), Math.round(12 * s), Math.round(8 * s));
  ctx.strokeRect(Math.round(x - 6 * s) + 0.5, Math.round(y - 6 * s) + 0.5, Math.round(12 * s), Math.round(8 * s));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y - 5.5 * s);
  ctx.lineTo(x, y - 12 * s);
  ctx.lineTo(x + 8 * s, y - 5.5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d39a6a';
  ctx.fillRect(Math.round(x - 1.5), Math.round(y - 3 * s), 3, Math.round(5 * s));
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(x + 6 * s), Math.round(y - 18 * s), 1, Math.round(10 * s));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 7 * s, y - 18 * s);
  ctx.lineTo(x + 13 * s, y - 16 * s);
  ctx.lineTo(x + 7 * s, y - 14 * s);
  ctx.fill();
}

export function worldMapWindow(ui, state, world) {
  const win = state.windows.worldmap;
  if (!windowFrame(ui, win, W, H, 'World Map')) return;
  const { ctx } = ui;
  const time = world.now;
  const ox = win.x + 10;
  const oy = win.y + 22;
  ctx.save();
  drawSea(ctx, ox, oy, time);
  ctx.save();
  roundRect(ctx, ox, oy, MAP_W, MAP_H, 6);
  ctx.clip();
  drawIsland(ctx, ox, oy);
  drawDecor(ctx, ox, oy, time);
  drawRoads(ctx, ox, oy);
  drawSkyIsland(ctx, ox, oy, time);
  ctx.restore();

  // A ribbon with the island's name.
  box(ctx, ox + 6, oy + 6, 78, 16, { fill: '#fff6ec', edge: '#c99a6b', r: 4 });
  text(ctx, 'Tengu Island', ox + 45, oy + 17, { size: 9, bold: true, align: 'center', color: '#8a5a3c' });

  // Stops: fields are dots, towns are cottages with name tags. Hovering shows details.
  const here = world.map.id;
  let hovered = null;
  for (const m of Object.values(MAPS)) {
    if (!m.world) continue;
    const x = ox + m.world.x;
    const y = oy + m.world.y;
    if (m.isTown) {
      drawTown(ctx, x, y, JOB_COLORS[m.job] ?? COLORS.accent, state.travelPick === m.id);
      ctx.font = font(7, true);
      const w = ctx.measureText(m.name).width + 8;
      box(ctx, x - w / 2, y + 4, w, 10, { fill: JOB_COLORS[m.job], edge: '#ffffff', r: 4, width: 1 });
      text(ctx, m.name, x, y + 11.5, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: INK });
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, m.id === 'bossroom' ? 3.5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (m.id === 'bossroom') {
        ctx.fillStyle = '#ff6b8a';
        circle(ctx, x, y, 1.6);
      }
    }
    const r = m.isTown ? 12 : 6;
    if (hover(ui, x - r, y - r - (m.isTown ? 6 : 0), r * 2, r * 2 + (m.isTown ? 10 : 0))) hovered = m;
    if (m.isTown && clicked(ui, x - r, y - r - 6, r * 2, r * 2 + 10)) state.travelPick = m.id;
  }

  // You are here: a pin that bounces over your map.
  const cur = getMap(here).world;
  if (cur) {
    const bob = Math.abs(Math.sin(time * 4)) * 4;
    const px = ox + cur.x;
    const py = oy + cur.y - (getMap(here).isTown ? 20 : 6) - bob;
    ctx.fillStyle = '#ff6b9a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py - 6, 5, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineTo(px, py + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    circle(ctx, px, py - 6, 2);
  }
  ctx.restore();

  if (hovered) {
    const lines = [{ text: hovered.name, bold: true }];
    if (hovered.isTown) lines.push({ text: `${JOBS[hovered.job]?.name ?? ''} town`, color: COLORS.accent, size: 8 });
    const lv = levelRange(hovered);
    if (lv) lines.push({ text: lv, color: COLORS.muted, size: 8 });
    if (hovered.id === here) lines.push({ text: 'You are here', color: '#ff6b9a', size: 8 });
    else if (hovered.isTown) lines.push({ text: 'Click to plan a trip', color: COLORS.muted, size: 8 });
    tooltip(ui, lines);
  }

  // Fast travel bar.
  const by = win.y + H - 26;
  const pick = state.travelPick && TOWNS.includes(state.travelPick) ? getMap(state.travelPick) : null;
  if (!pick) {
    text(ctx, 'Click a town to fly there. Flights leave from any town.', win.x + 12, by + 12, { size: 8, color: COLORS.muted });
    return;
  }
  const cost = travelCost(here, pick.id);
  const label = pick.id === here ? `You are in ${pick.name}.` : `Fly to ${pick.name} for ${cost}g`;
  text(ctx, label, win.x + 12, by + 12, { size: 9, bold: true });
  if (!world.map.isTown && pick.id !== here) text(ctx, 'Head to a town to take a flight.', win.x + 12, by + 22, { size: 7, color: COLORS.muted });
  const can = world.map.isTown && pick.id !== here && world.char.gold >= cost;
  if (button(ui, win.x + W - 92, by + 2, 80, 16, 'Fly!', { primary: true, enabled: can })) {
    const reason = travelTo(world, pick.id);
    if (reason) world.log(reason, '#ffb3c6');
    else {
      state.travelPick = null;
      win.open = false;
    }
  }
}
