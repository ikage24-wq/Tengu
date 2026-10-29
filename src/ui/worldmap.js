// The world map (M): Tengu Island as a round island with one ring road running round it. The
// towns sit on the ring like stops on a roundabout, the fields between them; Ember Crag is the
// mountain in the middle, up the canyon road; the Sky Garden floats off the north shore. Kept
// sparse on purpose: soft colour under each stop says what kind of place it is, and the names of
// the fields show on hover. Click a town to fly there.

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

// The island and its ring road: an ellipse round the middle of the map.
const CX = 200;
const CY = 132;
const RX = 150;
const RY = 82;
const deg = (d) => (d * Math.PI) / 180;
const onRing = (a, k = 1) => ({ x: CX + Math.cos(deg(a)) * RX * k, y: CY + Math.sin(deg(a)) * RY * k, a });
// Where each map sits. The ring runs clockwise from Sprout Village in the west: the meadows, the
// harbor in the south, the woods, the grove in the east, the ruins and the cave in the north. The
// canyon road climbs from the meadow to the crag in the middle (the Hollow's gate off it); the
// throne room is a spur off the cave, and the Sky Garden floats above it.
const SPOT = {
  sprout: onRing(180), meadow1: onRing(142), meadow2: onRing(108), harbor: onRing(75), woods: onRing(35), grove: onRing(355),
  ruins: onRing(315), cave: onRing(272),
  canyon: { x: CX - 62, y: CY + 8 }, crag: { x: CX + 2, y: CY - 6 }, hollow_gate: { x: CX - 78, y: CY - 30 },
  bossroom: onRing(235, 0.72), sky: { x: 352, y: 26 },
  // The far regions, off the ring: the glade inside the woods, the shrine path past the ruins, the
  // ridge above the crag, and the climb from the cave through the springs and the peak to the sky.
  glade: { x: 280, y: 160 }, shrine: { x: 372, y: 86 }, ridge: { x: 244, y: 104 },
  springs: { x: 258, y: 42 }, peak: { x: 306, y: 18 }, starfall: { x: 384, y: 12 },
};
const spot = (m) => SPOT[m.id] ?? m.world;
// The roads round the ring (each a real portal link between neighbours on it; the last stop joins
// back to the first, closing it).
const RING = ['sprout', 'meadow1', 'meadow2', 'harbor', 'woods', 'grove', 'ruins', 'cave'];
// Each region's colour, under its stop.
const TINT = {
  town: '#bfeaa8', meadow: '#c4eeb0', harbor: '#ffe0b0', forest: '#9fd8a2', grove: '#d3c0f6',
  ruins: '#dccff7', cave: '#beb0ea', crag: '#f7c996', sky: '#ffffff',
  shrine: '#ffd0e0', ridge: '#b8c0ec', springs: '#bfeae0', snow: '#eef4ff',
};
// Each job town's colour.
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

// The sea: a soft blue and a handful of slow ripples.
function drawSea(ctx, ox, oy, time) {
  const g = ctx.createLinearGradient(0, oy, 0, oy + MAP_H);
  g.addColorStop(0, '#a9dcff');
  g.addColorStop(1, '#c9ecff');
  ctx.fillStyle = g;
  roundRect(ctx, ox, oy, MAP_W, MAP_H, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const x = ox + CX + Math.cos(a) * (RX + 26 + hash(i) * 10) - 6;
    const y = oy + CY + Math.sin(a) * (RY + 20 + hash(i + 9) * 8);
    if (y < oy + 6 || y > oy + MAP_H - 6) continue;
    const s = Math.sin(time * 1.5 + i) * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 3, y - 2 - s * 0.3, x + 6, y);
    ctx.quadraticCurveTo(x + 9, y + 2, x + 12, y);
    ctx.stroke();
  }
}

// The island: a cream shore round a green disc, a little lighter towards the middle, each stop's
// region a soft pool of its colour, and the mountain in the middle.
function drawIsland(ctx, ox, oy) {
  const x = ox + CX;
  const y = oy + CY;
  ctx.fillStyle = 'rgba(90,63,122,0.12)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 5, RX + 30, RY + 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3dc';
  ctx.beginPath();
  ctx.ellipse(x, y, RX + 30, RY + 30, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x, y, 10, x, y, RX + 24);
  g.addColorStop(0, '#dff6cf');
  g.addColorStop(1, '#bfe8ad');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, RX + 24, RY + 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, RX + 30, RY + 30, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Each region's pool of colour.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, RX + 24, RY + 24, 0, 0, Math.PI * 2);
  ctx.clip();
  for (const m of Object.values(MAPS)) {
    const p = m.world && spot(m);
    if (!p || m.id === 'sky') continue;
    const tint = TINT[m.isTown ? 'town' : m.theme] ?? TINT.meadow;
    const rg = ctx.createRadialGradient(ox + p.x, oy + p.y, 2, ox + p.x, oy + p.y, m.isTown ? 34 : 28);
    rg.addColorStop(0, tint);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(ox + p.x - 36, oy + p.y - 36, 72, 72);
  }
  ctx.restore();
  // The mountain in the middle: a soft orange peak with a snowy cap, behind the crag's stop.
  const mx = ox + SPOT.crag.x;
  const my = oy + SPOT.crag.y + 6;
  ctx.fillStyle = '#f2b27a';
  ctx.beginPath();
  ctx.moveTo(mx - 34, my);
  ctx.quadraticCurveTo(mx - 10, my - 34, mx, my - 38);
  ctx.quadraticCurveTo(mx + 10, my - 34, mx + 34, my);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff6ec';
  ctx.beginPath();
  ctx.moveTo(mx - 9, my - 27);
  ctx.quadraticCurveTo(mx, my - 40, mx + 9, my - 27);
  ctx.lineTo(mx + 4, my - 24);
  ctx.lineTo(mx, my - 28);
  ctx.lineTo(mx - 4, my - 24);
  ctx.closePath();
  ctx.fill();
}

// A road: a tan band with a cream centre.
function stroke(ctx, path) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#c99a6b';
  ctx.lineWidth = 5;
  path();
  ctx.stroke();
  ctx.strokeStyle = '#fff6e6';
  ctx.lineWidth = 2.5;
  path();
  ctx.stroke();
}

// The ring road between neighbours on it, then the spurs (straight), then the sky's dotted line.
function drawRoads(ctx, ox, oy, time) {
  const linked = new Set(ROADS.map(([a, b]) => [a, b].sort().join('|')));
  for (let i = 0; i < RING.length; i++) {
    const next = RING[(i + 1) % RING.length];
    const a = SPOT[RING[i]];
    const b = SPOT[next];
    if (!linked.has([RING[i], next].sort().join('|'))) continue;
    // Clockwise along the ellipse, from one stop's angle to the next.
    let a0 = deg(a.a);
    let a1 = deg(b.a);
    if (a1 > a0) a1 -= Math.PI * 2;
    stroke(ctx, () => {
      ctx.beginPath();
      ctx.ellipse(ox + CX, oy + CY, RX, RY, 0, a0, a1, true);
    });
  }
  for (const [ida, idb] of ROADS) {
    const ra = RING.indexOf(ida);
    const rb = RING.indexOf(idb);
    if (ra >= 0 && rb >= 0 && (Math.abs(ra - rb) === 1 || Math.abs(ra - rb) === RING.length - 1)) continue;
    const ma = MAPS[ida];
    const mb = MAPS[idb];
    if (!ma.world || !mb.world) continue;
    const a = spot(ma);
    const b = spot(mb);
    if (ida === 'sky' || idb === 'sky') {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.lineDashOffset = -time * 8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox + a.x, oy + a.y);
      ctx.lineTo(ox + b.x, oy + b.y);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    stroke(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(ox + a.x, oy + a.y);
      ctx.lineTo(ox + b.x, oy + b.y);
    });
  }
}

// The Sky Garden: a little floating island on a cloud.
function drawSky(ctx, ox, oy, time) {
  const p = SPOT.sky;
  const x = ox + p.x;
  const y = oy + p.y + Math.sin(time * 1.2) * 1.5;
  ctx.fillStyle = '#ffffff';
  for (const [dx, dy, r] of [[-12, 4, 7], [-4, 1, 9], [7, 3, 8], [14, 5, 6]]) circle(ctx, x + dx, y + dy, r);
  ctx.fillStyle = '#c4eeb0';
  ctx.beginPath();
  ctx.ellipse(x, y - 3, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

// A town's stop: a round badge in its colour with a little roof on it, and its name on a pill.
function drawTown(ctx, x, y, m, picked, time) {
  const color = JOB_COLORS[m.job] ?? COLORS.accent;
  const r = picked ? 11.5 + Math.sin(time * 5) * 0.8 : 10;
  ctx.fillStyle = 'rgba(90,63,122,0.2)';
  circle(ctx, x + 1, y + 2, r);
  ctx.fillStyle = color;
  circle(ctx, x, y, r);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  // The roof and the door.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 5.5, y);
  ctx.lineTo(x, y - 5);
  ctx.lineTo(x + 5.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 4, y, 8, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x - 1.2, y + 1.5, 2.4, 3.5);
  ctx.font = font(7.5, true);
  const w = ctx.measureText(m.name).width + 10;
  box(ctx, x - w / 2, y + r + 2, w, 11, { fill: '#ffffff', edge: color, r: 5.5, width: 1.5 });
  text(ctx, m.name, x, y + r + 10.5, { size: 7.5, bold: true, align: 'center', color: INK });
}

// A field's stop: a small white dot ringed in its region's colour (the throne room's in red).
function drawField(ctx, x, y, m, hot) {
  const edge = m.id === 'bossroom' ? '#ff6b8a' : m.id === 'crag' ? '#e88a4c' : '#8c76b8';
  ctx.fillStyle = '#ffffff';
  circle(ctx, x, y, hot ? 5 : 4);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, hot ? 5 : 4, 0, Math.PI * 2);
  ctx.stroke();
  if (m.id === 'bossroom') {
    ctx.fillStyle = '#ff6b8a';
    circle(ctx, x, y, 1.8);
  }
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
  roundRect(ctx, ox, oy, MAP_W, MAP_H, 10);
  ctx.clip();
  drawIsland(ctx, ox, oy);
  drawRoads(ctx, ox, oy, time);
  drawSky(ctx, ox, oy, time);
  ctx.restore();

  // The island's name, on a pill.
  box(ctx, ox + 8, oy + 8, 74, 15, { fill: '#ffffff', edge: '#f4bcd8', r: 7.5, width: 1.5 });
  text(ctx, 'Tengu Island', ox + 45, oy + 18.5, { size: 8.5, bold: true, align: 'center', color: INK });

  // The stops: fields first, then the towns over them. Hover for details.
  const here = world.map.id;
  let hovered = null;
  const stops = Object.values(MAPS).filter((m) => m.world).sort((a, b) => Number(Boolean(a.isTown)) - Number(Boolean(b.isTown)));
  for (const m of stops) {
    const p = spot(m);
    const x = ox + p.x;
    const y = oy + p.y;
    const r = m.isTown ? 12 : 7;
    const hot = hover(ui, x - r, y - r, r * 2, r * 2 + (m.isTown ? 12 : 0));
    if (hot) hovered = m;
    if (m.isTown) drawTown(ctx, x, y, m, state.travelPick === m.id, time);
    else drawField(ctx, x, y, m, hot);
    if (m.isTown && clicked(ui, x - r, y - r, r * 2, r * 2 + 12)) state.travelPick = m.id;
  }

  // You are here: a pin bouncing over your stop, with the place's name if it's a field.
  const curMap = getMap(here);
  if (curMap.world) {
    const p = spot(curMap);
    const bob = Math.abs(Math.sin(time * 4)) * 3;
    const px = ox + p.x;
    const py = oy + p.y - (curMap.isTown ? 14 : 6) - bob;
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
    if (!curMap.isTown) {
      ctx.font = font(7, true);
      const w = ctx.measureText(curMap.name).width + 10;
      // Under the dot, out of the way of the town names above the ring.
      const ly = oy + p.y + 8;
      box(ctx, px - w / 2, ly, w, 10, { fill: '#ff6b9a', edge: '#ffffff', r: 5, width: 1.2 });
      text(ctx, curMap.name, px, ly + 7.5, { size: 7, bold: true, align: 'center', color: '#ffffff' });
    }
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
