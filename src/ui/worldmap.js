// The world map (M): Tengu Island as a round island with one ring road running round it. The
// towns sit on the ring like stops on a roundabout, the fields between them; Ember Crag is the
// mountain in the middle, up the canyon road; the far regions branch off the places they lead
// from, and the Sky Garden floats off the north shore. Every place shows its name and level range.
// Tap any place for its monsters and how far it is, then "Show the way" to have the guide arrow
// lead you there (world/routes.js), or fly to a town from any town.

import { MAPS, TOWNS, getMap } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { JOBS } from '../data/jobs.js';
import { travelTo, travelCost } from '../world/world.js';
import { levelRange, routeBetween, setRoute } from '../world/routes.js';
import { COLORS, windowFrame, text, box, button, roundRect, font, tooltip } from './kit.js';
import { online } from '../net/online.js';
import { inParty } from '../net/together.js';

// The map is drawn in its own 400x240 frame, shown K times larger.
const K = 1.2;
const W = 500;
const H = 340;
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
  ruins: onRing(315), cave: onRing(262),
  canyon: { x: CX - 70, y: CY + 6 }, crag: { x: CX + 4, y: CY - 4 }, hollow_gate: { x: CX - 86, y: CY - 30 },
  bossroom: onRing(238, 0.74),
  // The far regions, each just off the place it leads from: the glade inside the woods, the shrine
  // path out past the ruins, the ridge up the mountain from the crag, and the climb from the cave
  // through the springs and the peak to the Sky Garden, with Starfall above it.
  glade: { x: 282, y: 170 }, shrine: { x: 372, y: 64 }, ridge: { x: 258, y: 112 },
  springs: { x: 150, y: 34 }, peak: { x: 196, y: 14 }, sky: { x: 262, y: 20 }, starfall: { x: 322, y: 14 },
};
// Where each place's name sits from its stop (the default is just under it).
const LABEL = {
  sprout: [0, 13], meadow1: [-6, 9], meadow2: [0, 9], harbor: [0, 13], woods: [6, 9], grove: [0, 13], ruins: [18, -12], cave: [26, 6],
  canyon: [0, 9], crag: [0, 13], hollow_gate: [-28, -2], bossroom: [0, 9], glade: [0, 9], shrine: [-4, 9], ridge: [0, 9],
  springs: [-14, 9], peak: [0, -10], sky: [0, 10], starfall: [0, 9],
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
// Each region's colour for its name pill's edge.
const EDGE = {
  meadow: '#7fc98a', forest: '#5fae7a', ruins: '#9a82d8', cave: '#7a6ad0', crag: '#e88a4c', sky: '#8fb8ff',
  shrine: '#e8708a', ridge: '#6a7ad0', springs: '#4fb8a4', snow: '#8fb8e8', harbor: '#d9a060', grove: '#8a72d8',
};
// The places on the map (not the queens' trial arenas, which belong to their regions).
const onMap = (m) => m.world && !m.trial;
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
    if (!onMap(m)) continue;
    for (const p of m.portals) {
      if (!p.to || !MAPS[p.to] || !onMap(MAPS[p.to])) continue;
      const key = [m.id, p.to].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([m.id, p.to]);
    }
  }
  return out;
})();


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
    const p = onMap(m) && spot(m);
    if (!p || ['sky', 'starfall', 'peak', 'springs', 'shrine'].includes(m.id)) continue;
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
function drawRoads(ctx, ox, oy, time, lit = new Set()) {
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
    // Roads up into the air (the Sky Garden and Starfall) are dotted.
    if (['sky', 'starfall'].includes(ida) || ['sky', 'starfall'].includes(idb)) {
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

// The planned route over the roads: a pink band that shimmers along toward where you're going.
function drawRoute(ctx, ox, oy, time, path) {
  if (!path || path.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ff6b9a';
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.85;
  // Neighbours on the ring follow its curve; every other step is straight, like its road.
  ctx.beginPath();
  path.forEach((id, i) => {
    const p = spot(MAPS[id]);
    if (!i) {
      ctx.moveTo(ox + p.x, oy + p.y);
      return;
    }
    const prev = path[i - 1];
    const ra = RING.indexOf(prev);
    const rb = RING.indexOf(id);
    const n = RING.length;
    if (ra >= 0 && rb >= 0 && ((ra + 1) % n === rb || (rb + 1) % n === ra)) {
      const a0 = deg(SPOT[prev].a);
      let a1 = deg(SPOT[id].a);
      const cw = (ra + 1) % n === rb;
      if (cw && a1 > a0) a1 -= Math.PI * 2;
      if (!cw && a1 < a0) a1 += Math.PI * 2;
      ctx.ellipse(ox + CX, oy + CY, RX, RY, 0, a0, a1, cw);
    } else ctx.lineTo(ox + p.x, oy + p.y);
  });
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 5]);
  ctx.lineDashOffset = -time * 14;
  ctx.stroke();
  ctx.restore();
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

// A place's name and level range on a little pill, in its region's colour.
function drawLabel(ctx, x, y, m, picked) {
  const [dx, dy] = LABEL[m.id] ?? [0, 9];
  const lv = levelRange(m);
  const name = m.id === 'bossroom' ? 'Throne' : m.id === 'hollow_gate' ? 'Hollow Gate' : m.name;
  ctx.font = font(5.6, true);
  const nw = ctx.measureText(name).width;
  ctx.font = font(5, false);
  const lw = lv ? ctx.measureText(lv.replace('Lv ', '')).width + 4 : 0;
  const w = nw + lw + 7;
  const lx = x + dx - w / 2;
  const ly = y + dy - (dy < 0 ? 8 : 0);
  const edge = EDGE[m.theme] ?? '#8c76b8';
  box(ctx, lx, ly, w, 8, { fill: picked ? '#ff6b9a' : 'rgba(255,255,255,0.94)', edge: picked ? '#ffffff' : edge, r: 4, width: 1 });
  text(ctx, name, lx + 3.5, ly + 6, { size: 5.6, bold: true, color: picked ? '#ffffff' : INK });
  if (lv) text(ctx, lv.replace('Lv ', ''), lx + 3.5 + nw + 3, ly + 6, { size: 5, color: picked ? '#ffe9f2' : COLORS.muted });
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
  const here = world.map.id;
  const pick = state.travelPick && MAPS[state.travelPick] && onMap(MAPS[state.travelPick]) ? MAPS[state.travelPick] : null;
  const path = pick ? routeBetween(here, pick.id) : null;
  const pathIds = path ? [here, ...path.map((p) => p.to)] : null;
  // The map, drawn in its 400x240 frame, K times larger; the mouse is brought into that frame.
  const fx = win.x + 10;
  const fy = win.y + 22;
  const m = { x: (ui.mouse.x - fx) / K, y: (ui.mouse.y - fy) / K };
  const over = (x, y, r) => Math.abs(m.x - x) <= r && Math.abs(m.y - y) <= r;
  ctx.save();
  ctx.translate(fx, fy);
  ctx.scale(K, K);
  drawSea(ctx, 0, 0, time);
  ctx.save();
  roundRect(ctx, 0, 0, MAP_W, MAP_H, 10);
  ctx.clip();
  drawIsland(ctx, 0, 0);
  drawRoads(ctx, 0, 0, time);
  drawRoute(ctx, 0, 0, time, pathIds?.filter((id) => onMap(MAPS[id])));
  drawSky(ctx, 0, 0, time);
  ctx.restore();
  box(ctx, 8, 8, 74, 15, { fill: '#ffffff', edge: '#f4bcd8', r: 7.5, width: 1.5 });
  text(ctx, 'Tengu Island', 45, 18.5, { size: 8.5, bold: true, align: 'center', color: INK });

  // The stops (fields first, then towns over them), then every name on top.
  let hovered = null;
  let tapped = null;
  const stops = Object.values(MAPS).filter(onMap).sort((a, b) => Number(Boolean(a.isTown)) - Number(Boolean(b.isTown)));
  for (const mp of stops) {
    const p = spot(mp);
    const r = mp.isTown ? 12 : 8;
    if (over(p.x, p.y, r)) hovered = mp;
    if (mp.isTown) drawTown(ctx, p.x, p.y, mp, pick?.id === mp.id, time);
    else drawField(ctx, p.x, p.y, mp, hovered === mp || pick?.id === mp.id);
  }
  for (const mp of stops) if (!mp.isTown) drawLabel(ctx, spot(mp).x, spot(mp).y, mp, pick?.id === mp.id);
  if (hovered && ui.mouse.clicked && !ui.used) {
    tapped = hovered;
    ui.mouse.clicked = false;
    ui.used = true;
  }

  // You are here: a pin bouncing over your stop.
  const cur = getMap(here);
  const curOn = onMap(cur) ? cur : cur.trial ? MAPS[cur.portals[0]?.to] : null;
  if (curOn) {
    const p = spot(curOn);
    const bob = Math.abs(Math.sin(time * 4)) * 3;
    const px = p.x;
    const py = p.y - (curOn.isTown ? 14 : 7) - bob;
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
  // Friends online: a little badge with their initial by the stop they're at (rose for your party).
  const friendHover = drawFriends(ctx, m, time, here);
  ctx.restore();
  if (friendHover) tooltip(ui, [{ text: friendHover.name, bold: true, color: inParty(friendHover.id) ? '#e0659f' : '#4f95e0' }, { text: `Lv${friendHover.level ?? 1} ${JOBS[friendHover.job]?.name ?? ''}`, size: 8, color: COLORS.muted }, { text: `In ${getMap(friendHover.map)?.name ?? '...'}${inParty(friendHover.id) ? ' · your party' : ''}`, size: 8 }]);
  if (tapped) state.travelPick = tapped.id === state.travelPick ? null : tapped.id;

  // The bar under the map: the picked place (its level, monsters, how far), the way there, and a
  // flight if it's a town.
  const by = win.y + 22 + MAP_H * K + 4;
  if (!pick) {
    text(ctx, 'Tap any place to see what lives there and how to get there.', win.x + 12, by + 13, { size: 8, color: COLORS.muted });
    if (world.route) {
      text(ctx, `Guiding you to ${MAPS[world.route.to].name}.`, win.x + 12, by + 24, { size: 7, bold: true, color: '#ff6b9a' });
      if (button(ui, win.x + W - 92, by + 4, 80, 16, 'Stop guide', { size: 8 })) setRoute(world, null);
    }
    return;
  }
  const mobs = [...new Set((pick.spawns ?? []).filter((s) => !s.after && !MOBS[s.mob].boss).map((s) => MOBS[s.mob].name))];
  const lv = levelRange(pick);
  const far = pick.id === here ? 'You are here' : path ? `${path.length} map${path.length === 1 ? '' : 's'} away` : 'No road from here yet';
  text(ctx, `${pick.name}${lv ? `  ·  ${lv}` : ''}${pick.isTown ? `  ·  ${JOBS[pick.job]?.name ?? ''} town` : ''}`, win.x + 12, by + 10, { size: 8.5, bold: true });
  text(ctx, mobs.length ? `${mobs.join(', ')}  ·  ${far}` : far, win.x + 12, by + 21, { size: 7, color: COLORS.muted });
  let bx = win.x + W - 12;
  if (pick.isTown && TOWNS.includes(pick.id) && pick.id !== here) {
    const cost = travelCost(here, pick.id);
    const can = world.map.isTown && world.char.gold >= cost;
    bx -= 76;
    if (button(ui, bx, by + 4, 74, 16, world.map.isTown ? `Fly ${cost}g` : 'Fly (from town)', { primary: true, enabled: can, size: 7.5 })) {
      const reason = travelTo(world, pick.id);
      if (reason) world.log(reason, '#ffb3c6');
      else {
        state.travelPick = null;
        win.open = false;
      }
    }
  }
  if (pick.id !== here && path) {
    bx -= 82;
    const guiding = world.route?.to === pick.id;
    if (button(ui, bx, by + 4, 80, 16, guiding ? 'Stop guide' : 'Show the way', { primary: !guiding, theme: 'pink', size: 7.5 })) {
      setRoute(world, guiding ? null : pick.id);
      if (!guiding) win.open = false;
    }
  }
}

// Friends in your online room, by the stop each is at; returns the one under the pointer.
function drawFriends(ctx, m, time, here) {
  if (online.status !== 'on') return null;
  const at = new Map();
  for (const g of online.ghosts.values()) {
    const mp = g.map && getMap(g.map);
    if (!mp) continue;
    const stop = onMap(mp) ? mp : MAPS[mp.portals[0]?.to];
    if (!stop || !onMap(stop)) continue;
    if (!at.has(stop.id)) at.set(stop.id, []);
    at.get(stop.id).push(g);
  }
  let hot = null;
  for (const [id, list] of at) {
    const mp = MAPS[id];
    const p = spot(mp);
    // Beside the stop (and beside your own pin there), side by side.
    const base = p.x + (mp.isTown ? 13 : 9) + (id === here ? 4 : 0);
    list.forEach((g, i) => {
      const gx = base + 2 + i * 12;
      const gy = p.y - (mp.isTown ? 10 : 6) - Math.abs(Math.sin(time * 3 + i)) * 1.5;
      const mate = inParty(g.id);
      ctx.fillStyle = '#ffffff';
      circle(ctx, gx, gy, 6.5);
      ctx.fillStyle = mate ? '#ff6b9a' : '#4f95e0';
      circle(ctx, gx, gy, 5.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = font(6.5, true);
      ctx.textAlign = 'center';
      ctx.fillText((g.name ?? '?')[0].toUpperCase(), gx, gy + 2.3);
      ctx.textAlign = 'left';
      if (Math.abs(m.x - gx) <= 7 && Math.abs(m.y - gy) <= 7) hot = g;
    });
  }
  return hot;
}
