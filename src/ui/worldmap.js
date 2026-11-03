// The world map (M): Tengu Island as a round island with one ring road running round it. The
// towns sit on the ring like stops on a roundabout, the fields between them; Ember Crag is the
// mountain in the middle, up the canyon road; the far regions branch off the places they lead
// from, and the Sky Garden floats off the north shore. Every place shows its name and level range.
// Your party and your friends show as little faces by the place each is at (tap one to warp to
// them or ask to join their party), and a bubble by your pin counts the players around you.
// Tap any place for its monsters and how far it is, then "Show the way" to have the guide arrow
// lead you there (world/routes.js), or fly to a town from any town.

import { MAPS, TOWNS, getMap } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { shade } from '../render/pixel.js';
import { JOBS } from '../data/jobs.js';
import { travelTo } from '../world/world.js';
import { levelRange, routeBetween, setRoute } from '../world/routes.js';
import { COLORS, windowFrame, text, box, button, roundRect, font, tooltip } from './kit.js';
import { online, othersHere } from '../net/online.js';
import { inParty, warpTo, warpBlocker, askParty, partyBlocker, askJoinParty, joinPartyBlocker, leaderOf } from '../net/together.js';
import { partyMembers } from '../world/party.js';
import { askToJoin, joinBlocker, PINGS } from '../world/grouping.js';
import { callBuddy } from '../world/buddies.js';

// The map is drawn in its own 400x240 frame, shown K times larger.
const K = 1.2;
const W = 500;
const H = 340;
const MAP_W = 400;
const MAP_H = 240;
const INK = '#5a3f7a';

// The island and its ring road: an ellipse round the middle of the map.
// (The world map redraw, 2026-11-02: laid out again so no two roads cross. The ring road runs round
// the coast; the canyon, the crag, the ridge, the Hollow's gate and the glade sit inside it; the
// springs and the frozen peak have a little isle to the north, the Sky Garden and Starfall float
// above it, and the grove's long roads north fan out one above another.)
const CX = 200;
const CY = 150;
const RX = 150;
const RY = 66;
const deg = (d) => (d * Math.PI) / 180;
const onRing = (a, k = 1) => ({ x: CX + Math.cos(deg(a)) * RX * k, y: CY + Math.sin(deg(a)) * RY * k, a });
// Where each map sits. The ring runs clockwise from Sprout Village in the west: the meadows, the
// harbor in the south, the woods, the grove in the east, the ruins and the cave in the north. The
// canyon road climbs from the meadow to the crag in the middle (the Hollow's gate off it); the
// throne room is a spur off the cave, and the Sky Garden floats above it.
const SPOT = {
  sprout: onRing(180), meadow1: onRing(140), meadow2: onRing(108), harbor: onRing(75), woods: onRing(35), grove: onRing(350),
  ruins: onRing(300), cave: onRing(245),
  canyon: { x: 116, y: 160 }, crag: { x: 196, y: 168 }, hollow_gate: { x: 104, y: 126 }, ridge: { x: 252, y: 150 },
  glade: { x: 290, y: 186 }, shrine: { x: 306, y: 112 }, bossroom: { x: 84, y: 76 },
  springs: { x: 150, y: 50 }, peak: { x: 205, y: 34 }, sky: { x: 262, y: 18 }, starfall: { x: 332, y: 26 },
};
// Where a road bends (its control point), for the roads that must curve round others to stay clear.
const CTRL = { 'cave|sky': { x: 175, y: -30 }, 'grove|springs': { x: 262, y: 58 }, 'grove|peak': { x: 272, y: 30 } };
// Where each place's name sits from its stop (the default is just under it).
const LABEL = {
  sprout: [0, 13], meadow1: [-8, 9], meadow2: [0, 9], harbor: [0, 13], woods: [8, 9], grove: [0, 13], ruins: [-10, -12], cave: [-24, 6],
  canyon: [0, 9], crag: [0, 13], hollow_gate: [-6, -12], bossroom: [0, 9], glade: [-36, 2], shrine: [14, -12], ridge: [0, 9],
  springs: [-26, 0], peak: [0, -10], sky: [0, 11], starfall: [0, 9],
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

// Roads drawn on the map: one per pair of maps joined by a portal, except the long ones that would
// cross or crowd the others (the journeys they make are already shown by other roads; the guide's
// route still follows every real road).
const HIDDEN = new Set(['grove|springs', 'grove|peak', 'grove|sky', 'cave|sky', 'cave|grove']);
const ROADS = (() => {
  const seen = new Set();
  const out = [];
  for (const m of Object.values(MAPS)) {
    if (!onMap(m)) continue;
    for (const p of m.portals) {
      if (!p.to || !MAPS[p.to] || !onMap(MAPS[p.to])) continue;
      const key = [m.id, p.to].sort().join('|');
      if (seen.has(key) || HIDDEN.has(key)) continue;
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

// The sea (the world map redraw: a storybook island): deeper toward the edges, rows of little wave
// crests drifting by, sparkles on the water, and a sailboat going round the island.
function drawSea(ctx, ox, oy, time) {
  const g = ctx.createRadialGradient(ox + CX, oy + CY, 60, ox + CX, oy + CY, 260);
  g.addColorStop(0, '#bfe9ff');
  g.addColorStop(1, '#7ec4f0');
  ctx.fillStyle = g;
  roundRect(ctx, ox, oy, MAP_W, MAP_H, 10);
  ctx.fill();
  ctx.save();
  roundRect(ctx, ox, oy, MAP_W, MAP_H, 10);
  ctx.clip();
  // Wave crests: little white arcs in loose rows, drifting slowly.
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 46; i++) {
    const x = ox + ((hash(i) * MAP_W + time * (3 + hash(i + 5) * 3)) % (MAP_W + 20)) - 10;
    const y = oy + hash(i + 9) * MAP_H;
    const dx = (x - ox - CX) / (RX + 34);
    const dy = (y - oy - CY) / (RY + 34);
    if (dx * dx + dy * dy < 1) continue;
    const s = 0.6 + 0.4 * Math.sin(time * 1.6 + i);
    ctx.globalAlpha = 0.4 + 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.quadraticCurveTo(x - 2, y - 2 * s, x, y);
    ctx.quadraticCurveTo(x + 2, y - 2 * s, x + 4, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Sparkles on the water.
  for (let i = 0; i < 10; i++) {
    const k = Math.sin(time * 2.2 + i * 1.7);
    if (k < 0.5) continue;
    ctx.globalAlpha = (k - 0.5) * 2;
    sparkleAt(ctx, ox + hash(i + 40) * MAP_W, oy + hash(i + 41) * MAP_H, 1.2 + (k - 0.5) * 3);
  }
  ctx.globalAlpha = 1;
  // A sailboat sailing round the island, bobbing.
  const a = time * 0.05;
  const bx = ox + CX + Math.cos(a) * (RX + 48);
  const by = oy + CY + Math.sin(a) * (RY + 44) + Math.sin(time * 2) * 0.8;
  const dir = Math.sin(a) > 0 ? -1 : 1;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(bx - dir * 6, by + 2, 6, 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a5a';
  ctx.beginPath();
  ctx.moveTo(bx - 5, by - 1);
  ctx.lineTo(bx + 5, by - 1);
  ctx.lineTo(bx + 3, by + 2);
  ctx.lineTo(bx - 3, by + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(bx, by - 10);
  ctx.lineTo(bx + 4 * dir, by - 2);
  ctx.lineTo(bx, by - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff9fb8';
  ctx.fillRect(bx - 0.4, by - 12, 3 * dir || 3, 1.6);
  ctx.restore();
}

function sparkleAt(ctx, x, y, r) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.3, y - r * 0.3);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.3, y + r * 0.3);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.3, y + r * 0.3);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.3, y - r * 0.3);
  ctx.closePath();
  ctx.fill();
}

// The island's coastline: an ellipse with a gently wobbling edge, so it reads as a real island.
function coast(ctx, x, y, grow, time = 0, breathe = 0) {
  ctx.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const k = 1 + 0.07 * Math.sin(a * 3 + 1.2) + 0.04 * Math.sin(a * 7 + 0.4) + 0.02 * Math.sin(a * 13 + 2) + breathe * Math.sin(time * 1.4 + a * 2);
    const px = x + Math.cos(a) * (RX + grow) * k;
    const py = y + Math.sin(a) * (RY + grow) * k;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

// The island: surf breathing round a sandy beach, the land in soft greens, each region a pool of
// its own colour, and every place drawn as a little picture of itself (drawPlaces).
function drawIsland(ctx, ox, oy, time = 0) {
  const x = ox + CX;
  const y = oy + CY;
  ctx.fillStyle = 'rgba(40,90,140,0.18)';
  coast(ctx, x + 2, y + 5, 30);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  coast(ctx, x, y, 34, time, 0.006);
  ctx.fill();
  ctx.fillStyle = '#ffe9c4';
  coast(ctx, x, y, 30);
  ctx.fill();
  const g = ctx.createRadialGradient(x, y - 10, 10, x, y, RX + 24);
  g.addColorStop(0, '#d8f2c4');
  g.addColorStop(1, '#a8dc96');
  ctx.fillStyle = g;
  coast(ctx, x, y, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,63,122,0.28)';
  ctx.lineWidth = 1.2;
  coast(ctx, x, y, 30);
  ctx.stroke();
  // The northern isle, where the springs steam under the frozen peak.
  const nx = ox + 180;
  const ny = oy + 44;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(nx, ny, 52 + Math.sin(time * 1.4) * 0.6, 24, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9c4';
  ctx.beginPath();
  ctx.ellipse(nx, ny, 48, 21, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d6eef0';
  ctx.beginPath();
  ctx.ellipse(nx, ny, 43, 17, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Each region's pool of colour.
  ctx.save();
  coast(ctx, x, y, 24);
  ctx.clip();
  for (const m of Object.values(MAPS)) {
    const p = onMap(m) && spot(m);
    if (!p || ['sky', 'starfall', 'peak', 'springs', 'shrine'].includes(m.id)) continue;
    const tint = TINT[m.isTown ? 'town' : m.theme] ?? TINT.meadow;
    const rg = ctx.createRadialGradient(ox + p.x, oy + p.y, 2, ox + p.x, oy + p.y, m.isTown ? 34 : 30);
    rg.addColorStop(0, tint);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(ox + p.x - 36, oy + p.y - 36, 72, 72);
  }
  ctx.restore();
}

// ---------- The places, drawn as little pictures ----------

function tree(ctx, x, y, r, c, time, seed) {
  const sw = Math.sin(time * 1.2 + seed) * 0.3;
  ctx.fillStyle = 'rgba(60,90,60,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 0.6, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9a7356';
  ctx.fillRect(x - 0.6, y - r * 0.6, 1.2, r * 0.6);
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x + sw, y - r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - r * 0.35 + sw, y - r * 1.35, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
}
function grove(ctx, x, y, c, time, n = 7, spread = 18) {
  for (let i = 0; i < n; i++) tree(ctx, x + (hash(i * 3 + x) - 0.5) * spread * 2, y + (hash(i * 5 + y) - 0.5) * spread * 0.9, 3 + hash(i + x) * 2, c, time, i);
}
function peak(ctx, x, y, w, h, c, snow) {
  ctx.fillStyle = shade(c, -14);
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w * 0.15, y);
  ctx.closePath();
  ctx.fill();
  if (snow) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.32, y - h * 0.68);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + w * 0.32, y - h * 0.68);
    ctx.lineTo(x + w * 0.12, y - h * 0.6);
    ctx.lineTo(x, y - h * 0.7);
    ctx.lineTo(x - w * 0.14, y - h * 0.6);
    ctx.closePath();
    ctx.fill();
  }
}
function house(ctx, x, y, s, roof) {
  ctx.fillStyle = '#fff6ec';
  ctx.fillRect(x - 3 * s, y - 4 * s, 6 * s, 4 * s);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y - 3.6 * s);
  ctx.lineTo(x, y - 7 * s);
  ctx.lineTo(x + 4 * s, y - 3.6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe36b';
  ctx.fillRect(x + 0.8 * s, y - 2.8 * s, 1.4 * s, 1.4 * s);
}

// Each place's little picture, sitting just behind its stop.
function drawPlaces(ctx, ox, oy, time) {
  const at = (id, dx = 0, dy = 0) => {
    const p = SPOT[id];
    return [ox + p.x + dx, oy + p.y + dy];
  };
  // The mountains in the middle: the crag's warm peaks, the ridge's blue ones by moonlight.
  {
    const [x, y] = at('crag', 0, 8);
    peak(ctx, x - 20, y, 16, 26, '#f2b27a', false);
    peak(ctx, x + 18, y + 2, 14, 22, '#f6c08a', false);
    peak(ctx, x, y, 22, 40, '#eea36a', true);
  }
  {
    const [x, y] = at('ridge', 4, 4);
    peak(ctx, x - 8, y, 10, 18, '#a8b0e6', true);
    peak(ctx, x + 6, y + 1, 9, 14, '#b8c0ee', false);
  }
  // The frozen peak in the far north.
  {
    const [x, y] = at('peak', 0, 6);
    peak(ctx, x - 9, y, 9, 14, '#dfe8fa', true);
    peak(ctx, x + 5, y, 11, 20, '#e8f0ff', true);
  }
  // Woods, glade and grove: clusters of round trees in their own greens (the grove's violet).
  grove(ctx, ...at('woods', -6, -10), '#5fb878', time);
  grove(ctx, ...at('glade', 6, -8), '#7fd0a0', time, 5, 12);
  grove(ctx, ...at('grove', 0, -14), '#a98ae0', time);
  grove(ctx, ...at('hollow_gate', 0, -6), '#c088b8', time, 4, 10);
  // Meadows: flowers dotted over the grass.
  for (const id of ['meadow1', 'meadow2']) {
    const [x, y] = at(id);
    for (let i = 0; i < 14; i++) {
      const fx = x + (hash(i * 7 + x) - 0.5) * 36;
      const fy = y - 4 + (hash(i * 11 + y) - 0.5) * 14;
      ctx.fillStyle = ['#ffb3cf', '#fff3a6', '#ffffff', '#c9b6ff'][i % 4];
      ctx.beginPath();
      ctx.arc(fx, fy + Math.sin(time * 2 + i) * 0.3, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Sprout Village: a huddle of cottages and its cherry tree.
  {
    const [x, y] = at('sprout', 0, -6);
    house(ctx, x - 10, y + 2, 1, '#f29ab4');
    house(ctx, x + 10, y + 3, 1, '#9fb8f2');
    tree(ctx, x, y - 4, 4, '#ffc0d8', time, 3);
  }
  // Pastel Harbor: a pier into the sea and a lighthouse whose light turns.
  {
    const [x, y] = at('harbor', 0, 10);
    ctx.fillStyle = '#c99a6b';
    ctx.fillRect(x + 8, y + 4, 3, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 18, y - 12, 5, 13);
    ctx.fillStyle = '#ff8fa8';
    ctx.fillRect(x - 18, y - 8, 5, 2.4);
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(x - 17.5, y - 15, 4, 3);
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time * 2);
    ctx.beginPath();
    ctx.moveTo(x - 15.5, y - 13.5);
    ctx.lineTo(x - 15.5 + Math.cos(time) * 22, y - 18);
    ctx.lineTo(x - 15.5 + Math.cos(time) * 22, y - 9);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // The ruins: broken columns.
  {
    const [x, y] = at('ruins', 0, -4);
    ctx.fillStyle = '#e6dcff';
    for (const [dx, h] of [[-8, 9], [-2, 6], [5, 11], [10, 4]]) ctx.fillRect(x + dx, y - h, 3, h);
  }
  // The crystal cave: a dark mouth in the rock with a crystal glinting.
  {
    const [x, y] = at('cave', 0, -6);
    ctx.fillStyle = '#9a8ac8';
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 8, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#3f3380';
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#a8e8ff';
    ctx.beginPath();
    ctx.moveTo(x + 7, y);
    ctx.lineTo(x + 9, y - 6);
    ctx.lineTo(x + 11, y);
    ctx.fill();
  }
  // The springs: steaming pools.
  {
    const [x, y] = at('springs', 0, -2);
    ctx.fillStyle = '#7fe0d0';
    ctx.beginPath();
    ctx.ellipse(x - 5, y, 6, 2.6, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 6, y + 2, 5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 3; i++) {
      const u = (time * 0.4 + i / 3) % 1;
      ctx.globalAlpha = 0.6 * (1 - u);
      ctx.beginPath();
      ctx.arc(x - 4 + i * 4, y - 2 - u * 10, 1.5 + u * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // The fox shrine: a red gate.
  {
    const [x, y] = at('shrine', 0, -3);
    ctx.fillStyle = '#e0303e';
    ctx.fillRect(x - 6, y - 9, 1.6, 9);
    ctx.fillRect(x + 4.4, y - 9, 1.6, 9);
    ctx.fillRect(x - 8, y - 10, 16, 1.8);
    ctx.fillRect(x - 6.5, y - 7.2, 13, 1.2);
  }
  // The throne: a dark castle tower.
  {
    const [x, y] = at('bossroom', 0, -4);
    ctx.fillStyle = '#6a5aa8';
    ctx.fillRect(x - 4, y - 9, 8, 9);
    for (const dx of [-4, -1, 2]) ctx.fillRect(x + dx, y - 11, 2, 2);
  }
}

// Clouds drifting slowly over the island, their shadows on the land below.
function drawClouds(ctx, ox, oy, time) {
  for (let i = 0; i < 4; i++) {
    const x = ox + ((hash(i + 60) * MAP_W + time * (2 + i)) % (MAP_W + 80)) - 40;
    const y = oy + 30 + hash(i + 61) * 160;
    const s = 0.8 + hash(i + 62) * 0.6;
    const puffs = [[-10, 2, 7], [-2, -1, 9], [8, 1, 8], [15, 3, 6]];
    ctx.fillStyle = 'rgba(60,80,120,0.07)';
    for (const [dx, dy, r] of puffs) circle(ctx, x + dx * s + 6, y + dy * s + 14, r * s);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const [dx, dy, r] of puffs) circle(ctx, x + dx * s, y + dy * s, r * s);
  }
}

// A road: a winding trail, a soft worn band with a dotted line of footsteps along it.
function stroke(ctx, path) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(201,154,107,0.45)';
  ctx.lineWidth = 4.5;
  path();
  ctx.stroke();
  ctx.strokeStyle = '#a8764a';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([1.6, 3.2]);
  path();
  ctx.stroke();
  ctx.restore();
}

// A spur road's bend: its middle pushed outward, away from the island's middle, so trails curve
// round the mountains instead of cutting straight across.
function bend(a, b, ida = null, idb = null) {
  const set = ida && CTRL[[ida, idb].sort().join('|')];
  if (set) return set;
  if (ida) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let nx = -(b.y - a.y) / len;
  let ny = (b.x - a.x) / len;
  if (nx * (mx - CX) + ny * (my - CY) < 0) {
    nx = -nx;
    ny = -ny;
  }
  const k = Math.min(28, len * 0.22);
  return { x: mx + nx * k, y: my + ny * k };
}

// The ring road between neighbours on it, then the spurs (curving), then the sky's dotted line.
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
    const c = bend(a, b, ida, idb);
    // Roads up into the air (the Sky Garden and Starfall) are dotted.
    if (['sky', 'starfall'].includes(ida) || ['sky', 'starfall'].includes(idb)) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.lineDashOffset = -time * 8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox + a.x, oy + a.y);
      ctx.quadraticCurveTo(ox + c.x, oy + c.y, ox + b.x, oy + b.y);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    stroke(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(ox + a.x, oy + a.y);
      ctx.quadraticCurveTo(ox + c.x, oy + c.y, ox + b.x, oy + b.y);
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
    } else {
      const q = spot(MAPS[prev]);
      const c = bend(q, p, prev, id);
      ctx.quadraticCurveTo(ox + c.x, oy + c.y, ox + p.x, oy + p.y);
    }
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
  drawIsland(ctx, 0, 0, time);
  drawPlaces(ctx, 0, 0, time);
  drawRoads(ctx, 0, 0, time);
  drawRoute(ctx, 0, 0, time, pathIds?.filter((id) => onMap(MAPS[id])));
  drawSky(ctx, 0, 0, time);
  drawClouds(ctx, 0, 0, time);
  ctx.restore();
  box(ctx, 8, 8, 74, 15, { fill: '#ffffff', edge: '#f4bcd8', r: 7.5, width: 1.5 });
  text(ctx, 'Tengu Island', 45, 18.5, { size: 8.5, bold: true, align: 'center', color: INK });

  // The stops (fields first, then towns over them), then every name on top.
  let hovered = null;
  let tapped = null;
  // The people on the map, so a tap on a face goes to them, not the place under it.
  const people = peopleSpots(world, here, time);
  const personHot = people.find((q) => Math.abs(m.x - q.x) <= 7 && Math.abs(m.y - q.y) <= 7) ?? null;
  if (personHot && ui.mouse.clicked && !ui.used) {
    state.mapFriend = { kind: personHot.kind, id: personHot.id };
    state.travelPick = null;
    ui.mouse.clicked = false;
    ui.used = true;
  }
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
    state.mapFriend = null;
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
  // Pings from your party elsewhere: rings going out from that place.
  for (const p of world.pings ?? []) {
    const mp = getMap(p.map);
    const stop = mp && (onMap(mp) ? mp : MAPS[mp.portals[0]?.to]);
    if (!stop || !onMap(stop) || p.map === here) continue;
    const sp = spot(stop);
    const u = ((time - p.at) * 1.1) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - u) * Math.max(0, Math.min(1, (p.until - time) / 0.8));
    ctx.strokeStyle = PINGS[p.kind].color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 5 + u * 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Your party and friends: little faces by the place each is at; the players around you as a
  // count by your pin.
  drawPeople(ctx, people, personHot, time);
  const crowd = crowdHere(world);
  let crowdHot = false;
  if (curOn && crowd.length) {
    const p = spot(curOn);
    const cx = p.x - (curOn.isTown ? 17 : 13);
    const cy = p.y - (curOn.isTown ? 17 : 11);
    const pulse = 1 + Math.sin(time * 2.4) * 0.04;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    box(ctx, -8, -5.5, 16, 11, { fill: '#fff6d8', edge: '#e0b84a', r: 5.5, width: 1 });
    ctx.fillStyle = '#c99a1f';
    circle(ctx, -4, -0.6, 1.5);
    ctx.beginPath();
    ctx.arc(-4, 3.2, 2.4, Math.PI, Math.PI * 2);
    ctx.fill();
    text(ctx, `${crowd.length}`, 2.5, 2.6, { size: 6.5, bold: true, align: 'center', color: '#8a6a1a' });
    ctx.restore();
    crowdHot = Math.abs(m.x - cx) <= 8 && Math.abs(m.y - cy) <= 6;
  }
  ctx.restore();
  if (personHot) {
    const r = personHot.ref;
    tooltip(ui, [{ text: r.name, bold: true, color: personHot.party ? '#e0659f' : '#4f95e0' }, { text: `Lv${r.char?.level ?? r.level ?? 1} ${JOBS[r.char?.job ?? r.job]?.name ?? ''}`, size: 8, color: COLORS.muted }, { text: `In ${getMap(r.map)?.name ?? '...'}${personHot.party ? ' · your party' : personHot.kind === 'bot' ? ' · friend' : ' · online'}`, size: 8 }, { text: 'Click to warp or party up', size: 7, color: COLORS.muted }]);
  } else if (crowdHot) tooltip(ui, [{ text: `${crowd.length} player${crowd.length === 1 ? '' : 's'} here with you`, bold: true }, { text: crowd.slice(0, 6).map((b) => b.name).join(', ') + (crowd.length > 6 ? '...' : ''), size: 7.5, color: COLORS.muted }]);
  if (tapped) state.travelPick = tapped.id === state.travelPick ? null : tapped.id;

  // The bar under the map: the picked place (its level, monsters, how far), the way there, and a
  // flight if it's a town.
  const by = win.y + 22 + MAP_H * K + 4;
  if (state.mapFriend && personBar(ui, state, world, win, by)) return;
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
    const can = world.map.isTown;
    bx -= 76;
    if (button(ui, bx, by + 4, 74, 16, world.map.isTown ? 'Fly' : 'Fly (from town)', { primary: true, enabled: can, size: 7.5 })) {
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

// Your party, your friends (online in your room, or on the friends list), and where each is:
// one spot per face, side by side by the place they're at.
function peopleSpots(world, here, time) {
  const at = new Map();
  const add = (mapId, entry) => {
    const mp = mapId && getMap(mapId);
    if (!mp) return;
    const stop = onMap(mp) ? mp : MAPS[mp.portals[0]?.to];
    if (!stop || !onMap(stop)) return;
    if (!at.has(stop.id)) at.set(stop.id, []);
    at.get(stop.id).push(entry);
  };
  if (online.status === 'on') for (const g of online.ghosts.values()) add(g.map, { kind: 'ghost', id: g.id, ref: g, party: inParty(g.id), look: g.look });
  for (const b of partyMembers(world.bots)) add(b.away ? null : world.map.id, { kind: 'bot', id: b.id, ref: b, party: true, look: b.char?.appearance });
  for (const b of world.bots?.list ?? []) if (b.buddy && !b.gone && !b.party && b.map) add(b.map, { kind: 'bot', id: b.id, ref: b, party: false, look: b.char?.appearance });
  const out = [];
  for (const [id, list] of at) {
    const mp = MAPS[id];
    const p = spot(mp);
    // Beside the stop (and beside your own pin there), side by side, party first.
    list.sort((a, b) => Number(b.party) - Number(a.party));
    const base = p.x + (mp.isTown ? 13 : 9) + (id === here ? 4 : 0);
    list.slice(0, 5).forEach((e, i) => {
      const seed = hash([...String(e.ref.name ?? e.id)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 100000, 7)) * 1000;
      out.push({ ...e, x: base + 2 + i * 11, y: p.y - (mp.isTown ? 10 : 6) - Math.abs(Math.sin(time * 3 + i)) * 1.5, seed });
    });
  }
  return out;
}

// Everyone around you on your map who isn't in your party.
function crowdHere(world) {
  const id = world.map.id;
  const bots = (world.bots?.list ?? []).filter((b) => b.map === id && b.body && !b.party && !b.gone);
  return [...bots, ...othersHere(world).filter((g) => !inParty(g.id))];
}

// A tiny chibi face: their own skin and hair colour, blinking on their own beat, in a ring (rose
// for your party, sky blue for friends).
function face(ctx, x, y, look, ringColor, time, seed, hot) {
  const r = hot ? 6.6 : 6;
  ctx.fillStyle = '#ffffff';
  circle(ctx, x, y, r + 1.2);
  ctx.fillStyle = ringColor;
  circle(ctx, x, y, r);
  const skin = look?.skinTone ?? '#fbd9bf';
  const hair = look?.hairColor ?? '#7a5238';
  ctx.fillStyle = skin;
  circle(ctx, x, y + 0.6, r - 1.6);
  // Hair: a cap with a swept fringe.
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x, y + 0.4, r - 1.3, Math.PI * 1.02, Math.PI * 1.98);
  ctx.quadraticCurveTo(x + 1.5, y - 0.6, x, y - 1.2);
  ctx.quadraticCurveTo(x - 1.5, y - 0.4, x - (r - 1.3), y + 0.3);
  ctx.closePath();
  ctx.fill();
  const blink = ((time + (seed % 97) / 23) % 3.4) < 0.12;
  ctx.fillStyle = '#4a3560';
  for (const sx of [-1.6, 1.6]) {
    if (blink) ctx.fillRect(x + sx - 0.7, y + 1.3, 1.4, 0.45);
    else {
      ctx.beginPath();
      ctx.ellipse(x + sx, y + 1.4, 0.6, 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(255,120,150,0.55)';
  circle(ctx, x - 2.6, y + 2.6, 0.7);
  circle(ctx, x + 2.6, y + 2.6, 0.7);
}

function drawPeople(ctx, people, hot, time) {
  for (const q of people) face(ctx, q.x, q.y, q.look, q.party ? '#ff6b9a' : '#4f95e0', time, q.seed, q === hot);
}

// The bar under the map for the person you tapped: where they are, and Warp, Join or Invite.
// Returns false (so the place bar shows) once they're gone.
function personBar(ui, state, world, win, by) {
  const f = state.mapFriend;
  const g = f.kind === 'ghost' ? online.ghosts.get(f.id) : world.bots?.list.find((b) => b.id === f.id && !b.gone);
  if (!g || (f.kind === 'bot' && !g.party && !g.buddy)) {
    state.mapFriend = null;
    return false;
  }
  const { ctx } = ui;
  const party = f.kind === 'ghost' ? inParty(g.id) : g.party;
  const job = JOBS[g.char?.job ?? g.job];
  const where = g.away ? 'in town' : g.map === world.map.id ? 'here with you' : `in ${getMap(g.map)?.name ?? '...'}`;
  text(ctx, `${g.name}  ·  Lv${g.char?.level ?? g.level ?? 1} ${job?.name ?? ''}`, win.x + 12, by + 10, { size: 8.5, bold: true, color: party ? '#e0659f' : '#4f95e0' });
  text(ctx, `${party ? 'Your party' : f.kind === 'ghost' ? 'Online with you' : 'Friend'}  ·  ${where}`, win.x + 12, by + 21, { size: 7, color: COLORS.muted });
  let bx = win.x + W - 12;
  const btn = (label, why, run, opts = {}) => {
    bx -= 58;
    if (button(ui, bx, by + 4, 56, 16, label, { size: 7.5, enabled: !why, ...opts })) {
      const no = run();
      if (no) world.log(no, '#ffb3c6');
    }
    if (why && ui.mouse.x >= bx && ui.mouse.x < bx + 56 && ui.mouse.y >= by + 4 && ui.mouse.y < by + 20) tooltip(ui, [{ text: why, size: 8 }]);
  };
  if (!party) {
    if (f.kind === 'ghost') {
      const theirs = leaderOf(g.id) !== g.id || online.rosters?.has(g.id);
      if (theirs && !online.party) btn('Join', joinPartyBlocker(g), () => askJoinParty(world, g.id), { theme: 'pink', primary: true });
      else btn('Invite', partyBlocker(g), () => askParty(world, g.id), { theme: 'pink', primary: true });
    } else {
      btn('Join', joinBlocker(world, g), () => askToJoin(world, g), { theme: 'pink', primary: true });
      btn('Invite', null, () => callBuddy(world.bots, world, g), { theme: 'pink' });
    }
  }
  if (g.map !== world.map.id) {
    btn('Warp', warpBlocker(world, g), () => {
      const no = warpTo(world, g);
      if (!no) {
        win.open = false;
        state.mapFriend = null;
      }
      return no;
    }, { theme: 'sky', primary: true });
  }
  return true;
}
