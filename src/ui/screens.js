// Title (world select), character select, and character creator screens.

import { MAPS } from '../data/maps.js';
import { VERSION } from '../version.js';
import { JOBS } from '../data/jobs.js';
import { drawSceneBack } from '../render/scenery.js';
import { drawHero } from '../render/hero.js';
import { COLORS, THEMES, text, box, button, tabs, wrap, bar, hover, clicked, roundRect, font, softShadow, icon, tooltip, lighten, darken, toggle } from './kit.js';
import { paintFan } from '../render/props.js';
import { lookFor } from '../render/townlife.js';
import { groundAt } from '../world/physics.js';
import { createAnim, stepAnim } from '../render/animator.js';
import { stats, wornGear } from '../core/character.js';
import { expToNext } from '../core/exp.js';
import { lookRows, randomLook, LOOK_TABS } from './looks.js';

export { randomLook };


function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function backdrop(ctx, time) {
  const map = MAPS.meadow1;
  const cam = { x: (time * 30) % (map.width - 640), y: map.height - 360 };
  drawSceneBack(ctx, map, cam, 640, 360, time, null);
}

// A silly subtitle under the logo, rolled fresh on every page load.
const oneOf = (list) => list[Math.floor(Math.random() * list.length)];
const JOB_NAMES = ['Paladin', 'Berserker', 'Phantom Trickster', 'Arbalist Engineer', 'Blade Dancer', 'Sky Dancer', 'Starlight Idol', 'Astronomer'];
const QUOTE_MAKERS = [
  () => `${oneOf(JOB_NAMES)}s are perfectly balanced. Probably.`,
  () => `${oneOf(['Mira', 'Marlo', 'Lulu', 'The Crystal King'])} says hi!`,
  () => oneOf([
    'Bring friends. Share the loot. Or don\'t.',
    'Pick a card. Any card.',
    'Paladins hit like a pillow, on purpose.',
    'Engineers: please stop blowing up the bots.',
    'Smug face sold separately.',
    'New hair. Same bad decisions.',
    'Big round glasses: now in the Cash Shop.',
    'Swimwear is not armor. We checked.',
    'Now on Windows. It even updates itself.',
    'Every sound made by hand. Mostly by beeping.',
    'The bots are learning. Be nice to them.',
    'Your bag is full. Of dreams.',
  ]),
];
const quote = oneOf(QUOTE_MAKERS)();

// The login screen's world list; the game itself is single-player.
const WORLDS = [{ name: 'Tengu', color: '#ff9ec0' }];
let world = 0;

// A fixed frame like the in-game windows, without dragging or a close button.
function panel(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(90,63,122,0.18)';
  roundRect(ctx, x + 2, y + 4, w, h, 14);
  ctx.fill();
  box(ctx, x - 2, y - 2, w + 4, h + 4, { fill: null, edge: '#ffe0ef', r: 16, width: 3 });
  box(ctx, x, y, w, h, { fill: 'rgba(255,247,252,0.96)', edge: '#f4bcd8', r: 14, width: 2 });
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, COLORS.title);
  g.addColorStop(1, COLORS.title2);
  ctx.fillStyle = g;
  ctx.save();
  roundRect(ctx, x, y, w, h, 14);
  ctx.clip();
  ctx.fillRect(x, y, w, 18);
  ctx.beginPath();
  for (let sx = x; sx < x + w; sx += 8) ctx.arc(sx + 4, y + 18, 4, 0, Math.PI);
  ctx.fill();
  ctx.restore();
  text(ctx, title, x + w / 2, y + 13, { size: 10, bold: true, align: 'center', color: '#ffffff', outline: '#b87ac9' });
}


function petals(ctx, time) {
  const colors = ['#ffc2dc', '#ffffff', '#ffd9ec'];
  for (let i = 0; i < 18; i++) {
    const r1 = (i * 0.618) % 1;
    const r2 = (i * 0.414 + 0.3) % 1;
    const x = (r1 * 680 + time * (12 + r2 * 14) + Math.sin(time * 1.3 + i) * 18) % 680 - 20;
    const y = (r2 * 380 + time * (18 + r1 * 16)) % 380 - 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * (1 + r1) + i);
    ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.sin(time * 2 + i)));
    ctx.fillStyle = colors[i % 3];
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- Title screen ----------

// The time of day, from the player's own clock: 'dawn', 'day', 'dusk' or 'night'.
function dayPart() {
  const h = new Date().getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
}
// The light over the meadow for that time: a wash over everything, and a glow at the horizon.
const DAY_LIGHT = {
  dawn: { wash: 'rgba(255,190,170,0.16)', glow: 'rgba(255,214,170,0.35)' },
  day: null,
  dusk: { wash: 'rgba(255,140,120,0.2)', glow: 'rgba(255,170,110,0.4)' },
  night: { wash: 'rgba(40,40,110,0.42)', glow: 'rgba(120,120,220,0.25)' },
};
function dayLight(ctx, part, time) {
  const L = DAY_LIGHT[part];
  if (!L) return;
  ctx.fillStyle = L.wash;
  ctx.fillRect(0, 0, 640, 360);
  const g = ctx.createLinearGradient(0, 120, 0, 300);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, L.glow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 120, 640, 180);
  if (part !== 'night') return;
  // Stars twinkling over the hills, and fireflies drifting in the grass.
  for (let i = 0; i < 40; i++) {
    const x = (i * 157.3) % 640;
    const y = (i * 73.7) % 150;
    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.3 + i));
    sparkle(ctx, x, y, 1 + (i % 3) * 0.6, '#ffffff');
  }
  for (let i = 0; i < 14; i++) {
    const x = (i * 89 + Math.sin(time * 0.5 + i) * 30 + 640) % 640;
    const y = 240 + Math.sin(time * 0.7 + i * 2) * 30 + (i % 4) * 14;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 3 + i);
    const f = ctx.createRadialGradient(x, y, 0, x, y, 5);
    f.addColorStop(0, 'rgba(255,250,170,1)');
    f.addColorStop(1, 'rgba(255,250,170,0)');
    ctx.fillStyle = f;
    ctx.fillRect(x - 5, y - 5, 10, 10);
  }
  ctx.globalAlpha = 1;
}

// The logo: "Tengu" in fat letters with a deep outline, a pink inner rim and a cream-to-pink
// face, a crimson tengu's fan and a black feather tucked behind it, bobbing gently, a glint
// sweeping across now and then.
function logo(ctx, time) {
  const bob = Math.sin(time * 2) * 2;
  const cx = 320;
  const cy = 72 + bob;
  // The fan behind the letters, opening and closing a little, and a feather crossed under it.
  ctx.save();
  ctx.translate(cx + 96, cy - 22);
  ctx.rotate(-1.1 + Math.sin(time * 1.2) * 0.06);
  paintFan(ctx, 4.2, 0.85 + 0.1 * Math.sin(time * 1.6));
  ctx.restore();
  ctx.save();
  ctx.translate(cx - 118, cy - 6);
  ctx.rotate(-0.5 + Math.sin(time * 1.4 + 1) * 0.08);
  feather(ctx, 46);
  ctx.restore();
  ctx.save();
  ctx.font = font(60, true);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  // A soft drop shadow, the deep outline, then the pink rim.
  ctx.fillStyle = 'rgba(90,40,110,0.35)';
  ctx.fillText('Tengu', cx + 3, cy + 5);
  ctx.strokeStyle = '#7a3f9e';
  ctx.lineWidth = 12;
  ctx.strokeText('Tengu', cx, cy);
  ctx.strokeStyle = '#ff8fc1';
  ctx.lineWidth = 6;
  ctx.strokeText('Tengu', cx, cy);
  const g = ctx.createLinearGradient(0, cy - 44, 0, cy + 4);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#fff3fa');
  g.addColorStop(1, '#ffc2df');
  ctx.fillStyle = g;
  ctx.fillText('Tengu', cx, cy);
  // The glint: a bright slash sweeping across the letters every few seconds.
  const k = (time % 4) / 0.8;
  if (k < 1) {
    ctx.globalCompositeOperation = 'source-atop';
    const gx = cx - 110 + k * 220;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(gx, cy + 6);
    ctx.lineTo(gx + 14, cy - 50);
    ctx.lineTo(gx + 24, cy - 50);
    ctx.lineTo(gx + 10, cy + 6);
    ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const a = time * 1.5 + i;
    sparkle(ctx, cx + Math.cos(a) * 120, cy - 18 + Math.sin(a * 1.3) * 26, 2.5 + (i % 3), i % 2 ? '#ffffff' : '#ffe36b');
  }
  text(ctx, quote, cx, cy + 22, { size: 11, bold: true, align: 'center', color: '#ffffff', outline: '#b062c8' });
}
// A crow-black tengu feather along +x, `len` px: a quill and two vanes with a blue sheen.
function feather(ctx, len) {
  ctx.fillStyle = '#2a2440';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.22, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.22, 0, 0);
  ctx.fill();
  ctx.strokeStyle = '#5a6fb8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(len * 0.2, -len * 0.06);
  ctx.quadraticCurveTo(len * 0.55, -len * 0.14, len * 0.9, -len * 0.02);
  ctx.stroke();
  ctx.strokeStyle = '#d8cfe8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-len * 0.12, 0);
  ctx.lineTo(len * 0.95, 0);
  ctx.stroke();
}

// The title's own stage: Petal Meadow's look, but a long open field of gentle rolling hills
// with no floating platforms or ladders, and a few garden pieces along the way. The camera drifts
// slowly along it like an opening shot.
const TITLE_W = 9000;
const TITLE_G = 322;
const TITLE_MAP = (() => {
  const terrain = [[0, TITLE_G]];
  for (let x = 400; x < TITLE_W; x += 400) terrain.push([x, TITLE_G - Math.round(10 + 10 * Math.sin(x * 0.0021) + 6 * Math.sin(x * 0.0057))]);
  terrain.push([TITLE_W, TITLE_G]);
  const kinds = ['flowerarch', 'beehive', 'picnic', 'signpost'];
  const deco = [];
  for (let x = 300, i = 0; x < TITLE_W; x += 520 + (i * 137) % 260, i++) deco.push([kinds[i % kinds.length], x]);
  return { ...MAPS.meadow1, id: 'title', width: TITLE_W, height: 360, groundY: TITLE_G, terrain, platforms: [], ropes: [], portals: [], spawns: [], npcs: [], deco };
})();
const CAM_SPEED = 12;

// Who's out in the meadow: a few heroes of different jobs strolling across, each doing their
// weapon's idle bits when they stop for a breather.
const CAST = [
  { look: 71, weapon: 'sword_30', speed: 26, start: 0, dir: 1 },
  { look: 12, weapon: 'bow_30', speed: 22, start: 230, dir: 1 },
  { look: 33, weapon: 'staff_30', speed: 18, start: 520, dir: -1 },
  { look: 5, weapon: 'dagger_30', speed: 30, start: 400, dir: -1 },
];
const castLooks = CAST.map((c) => lookFor(c.look));
// Each one's walk cycle runs on the ground they cover (render/animator.js), so their feet plant.
const castAnims = CAST.map(() => createAnim());
let castT = null;
function cast(ctx, time, cam) {
  const map = TITLE_MAP;
  const feet = (x) => groundAt(map, x + cam.x) - cam.y;
  const span = 760;
  const dt = castT == null ? 0 : Math.max(0, Math.min(0.1, time - castT));
  castT = time;
  const onScreen = (wx) => ((((wx - cam.x) + 60) % span) + span) % span - 60;
  CAST.forEach((c, i) => {
    // Walk for a while, stop for a breather, walk on; wrapping round the screen.
    const cycle = 14;
    const ph = (time + i * 3.1) % cycle;
    const walking = ph < 9;
    const walked = Math.floor((time + i * 3.1) / cycle) * 9 + Math.min(ph, 9);
    const x = onScreen(c.start + c.dir * walked * c.speed);
    const a = castAnims[i];
    stepAnim(a, { vx: walking ? c.dir * c.speed : 0, vy: 0, onGround: true, rope: false, facing: c.dir, y: 0 }, dt);
    drawHero(ctx, castLooks[i], { weapon: { id: c.weapon } }, Math.round(x), Math.round(feet(x)), { pose: walking ? 'walk' : 'idle', time: time + i * 7, seed: i * 11, facing: c.dir, urgent: false }, a);
  });
}

// The wooden sign World Select hangs on: two ropes from the top of the screen, a plank board with
// a cream face, swinging gently. It drops in on its ropes after the first key press.
function hangingSign(ctx, x, y, w, h, swing) {
  ctx.save();
  ctx.translate(x + w / 2, y - 24);
  ctx.rotate(swing);
  ctx.translate(-(x + w / 2), -(y - 24));
  // A leafy twig across above it (so the ropes don't run over the logo).
  const ty = y - 24;
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, ty + 2);
  ctx.quadraticCurveTo(x + w / 2, ty - 5, x + w + 12, ty + 1);
  ctx.stroke();
  for (const [lx, ly, rot] of [[x - 14, ty - 2, -0.6], [x - 6, ty + 6, 0.5], [x + w + 14, ty - 3, 0.6], [x + w + 6, ty + 5, -0.4], [x + w / 2 + 10, ty - 6, 0.2]]) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = '#8fd18a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.lineWidth = 2;
  for (const rx of [x + 22, x + w - 22]) {
    ctx.beginPath();
    ctx.moveTo(rx, ty - 1);
    ctx.lineTo(rx, y + 4);
    ctx.stroke();
  }
  softShadow(ctx, x, y, w, h, 12, 4);
  box(ctx, x, y, w, h, { fill: '#d9a46c', edge: '#8a5a3a', r: 12, width: 2 });
  ctx.strokeStyle = 'rgba(138,90,58,0.35)';
  ctx.lineWidth = 1;
  for (let py = y + 9; py < y + h - 4; py += 9) {
    ctx.beginPath();
    ctx.moveTo(x + 6, py);
    ctx.lineTo(x + w - 6, py);
    ctx.stroke();
  }
  for (const rx of [x + 22, x + w - 22]) {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(rx, y + 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  box(ctx, x + 7, y + 12, w - 14, h - 19, { fill: '#fff8f2', edge: '#f4bcd8', r: 9, width: 1.5 });
  ctx.restore();
}

let awake = false;
let awakeAt = 0;
// MMO-style login: logo, world select, and a status bar. Returns true on Enter World.
export function titleScreen(ui, time) {
  const { ctx } = ui;
  const map = TITLE_MAP;
  const part = dayPart();
  const cam = { x: (time * CAM_SPEED) % (TITLE_W - 700), y: 0 };
  drawSceneBack(ctx, map, cam, 640, 360, time, null);
  cast(ctx, time, cam);
  petals(ctx, time);
  dayLight(ctx, part, time);
  logo(ctx, time);

  // The first key or click wakes the screen; then World Select drops in on its sign.
  let pick = false;
  if (!awake) {
    const k = 0.55 + 0.45 * Math.sin(time * 3);
    ctx.globalAlpha = k;
    ctx.font = font(11, true);
    const tw = ctx.measureText('Press any key').width + 30;
    box(ctx, 320 - tw / 2, 196, tw, 22, { fill: 'rgba(255,247,252,0.92)', edge: '#f4bcd8', r: 11, width: 2 });
    text(ctx, 'Press any key', 320, 211, { size: 11, bold: true, align: 'center', color: '#b062c8' });
    ctx.globalAlpha = 1;
    if (ui.input.pressed.size || ui.mouse.clicked) {
      awake = true;
      awakeAt = time;
      ui.mouse.clicked = false;
    }
  } else {
    // Dropping in with a bounce, then a slow swing.
    const u = Math.min(1, (time - awakeAt) / 0.6);
    const drop = 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2;
    const px = 230, pw = 180, ph = 84 + WORLDS.length * 22;
    const py = 134 - (1 - drop) * 240;
    const swing = Math.sin(time * 1.4) * 0.012 + (1 - u) * 0.05 * Math.sin(time * 9);
    hangingSign(ctx, px, py, pw, ph, swing);
    ctx.save();
    ctx.translate(px + pw / 2, py - 24);
    ctx.rotate(swing);
    ctx.translate(-(px + pw / 2), -(py - 24));
    text(ctx, 'World Select', px + pw / 2, py + 27, { size: 10, bold: true, align: 'center', color: '#ffffff', outline: '#8a5a3a' });
    WORLDS.forEach((w, i) => {
      const ry = py + 34 + i * 22;
      const on = i === world;
      box(ctx, px + 14, ry, pw - 28, 19, { fill: on ? '#ffe9f4' : hover(ui, px + 14, ry, pw - 28, 19) ? '#ffffff' : COLORS.cell, edge: on ? COLORS.accent : COLORS.cellEdge, r: 9.5 });
      ctx.fillStyle = w.color;
      ctx.beginPath();
      ctx.arc(px + 25, ry + 9.5, 4, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, w.name, px + 34, ry + 13, { size: 9, bold: true });
      if (u >= 1 && clicked(ui, px + 14, ry, pw - 28, 19)) world = i;
    });
    const by = py + 34 + WORLDS.length * 22 + 5;
    const enter = button(ui, px + 16, by, pw - 32, 22, 'Enter World', { primary: true, size: 10 });
    pick = u >= 1 && (enter || ui.input.pressed.has('Enter'));
    text(ctx, `${WORLDS[world].name} · Channel 1`, px + pw / 2, by + 34, { size: 7.5, align: 'center', color: COLORS.muted });
    ctx.restore();
  }

  // Status bar: a soft pill along the bottom.
  box(ctx, 6, 340, 628, 16, { fill: 'rgba(255,247,252,0.85)', edge: '#f4bcd8', r: 8, width: 1.5 });
  ctx.fillStyle = COLORS.good;
  ctx.beginPath();
  ctx.arc(17, 348, 3, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, `Server online · ${WORLDS[world].name}`, 25, 351, { size: 7.5, bold: true, color: COLORS.ink });
  text(ctx, ui.input?.touch ? 'Stick moves · Jump · Attack · Loot · push up to talk' : 'Arrows move · Space jumps · Z attacks · X loots · Up talks', 320, 351, { size: 7.5, align: 'center', color: COLORS.muted });
  text(ctx, `v${VERSION}`, 626, 351, { size: 7.5, bold: true, align: 'right', color: COLORS.ink });
  return pick;
}

// --- Character select: a big tree with two rings of character slots, like a classic MMO lobby.

const SLOT_X = [88, 172, 288, 372];
const TIER_Y = [168, 300];
const slotPos = (i) => [SLOT_X[i % 4], TIER_Y[Math.floor(i / 4)]];
// Each job family's colour, for the card's accents and the glow under a hero's spot.
const FAMILY_COLOR = { beginner: '#6fb8ff', warrior: '#ff8a5c', archer: '#5fd3a0', thief: '#9b7bd8', mage: '#ff8fc1', gm: '#ffc94f' };
const familyColor = (c) => FAMILY_COLOR[JOBS[c?.job]?.family] ?? '#b48cff';

function leaves(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A paper lantern hanging from a ring, glowing and swaying.
function lantern(ctx, x, y, time, i) {
  const sw = Math.sin(time * 1.6 + i) * 2;
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + sw, y + 8);
  ctx.stroke();
  const lx = x + sw;
  const g = ctx.createRadialGradient(lx, y + 14, 0, lx, y + 14, 16);
  g.addColorStop(0, `rgba(255,220,150,${0.45 + 0.1 * Math.sin(time * 3 + i)})`);
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(lx - 16, y - 2, 32, 32);
  ctx.fillStyle = i % 2 ? '#ff9ec0' : '#ffb86b';
  ctx.beginPath();
  ctx.ellipse(lx, y + 14, 5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(lx - 1.5, y + 9, 1.5, 9);
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(lx - 3, y + 7, 6, 1.5);
  ctx.fillRect(lx - 3, y + 20, 6, 1.5);
}

function ring(ctx, y, time, tier) {
  // Underside, face, and a mossy top edge with a few flowers.
  box(ctx, 44, y + 2, 372, 18, { fill: '#b98a5c', edge: null, r: 9 });
  box(ctx, 44, y - 6, 372, 18, { fill: '#f3d6a6', edge: '#d4a574', r: 9 });
  ctx.fillStyle = '#8fd18a';
  for (let x = 54; x < 410; x += 14) ctx.fillRect(x, y - 7, 8, 3);
  const flowers = ['#ffb8dc', '#ffffff', '#ffe36b'];
  for (let i = 0; i < 9; i++) leaves(ctx, 64 + i * 41 + (i % 2) * 9, y - 6, 2.5, flowers[i % 3]);
  ctx.strokeStyle = '#7cc47a';
  ctx.lineWidth = 2;
  for (const vx of [70, 150, 330, 398]) {
    ctx.beginPath();
    ctx.moveTo(vx, y + 18);
    ctx.quadraticCurveTo(vx + 6, y + 28, vx - 2, y + 36);
    ctx.stroke();
  }
  // Lanterns between the spots.
  [130, 230, 330].forEach((lx, i) => lantern(ctx, lx, y + 18, time, i + tier * 3));
}

// Sky and soft hills, so nothing from a real map pokes through the tree; clouds drifting by.
function lobbySky(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, 360);
  g.addColorStop(0, '#9edcff');
  g.addColorStop(1, '#e6f6ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++) {
    const x = ((i * 190 + time * (6 + i * 2)) % 760) - 80;
    const y = 30 + i * 22;
    for (const [dx, dy, r] of [[0, 0, 12], [14, -5, 15], [30, 0, 11], [14, 4, 12]]) leaves(ctx, x + dx, y + dy, r, 'rgba(255,255,255,0.85)');
  }
  [[60, 330, 130], [300, 350, 150], [560, 320, 140]].forEach(([x, y, r]) => leaves(ctx, x, y, r, '#c4ebc0'));
  [[180, 380, 140], [470, 390, 150]].forEach(([x, y, r]) => leaves(ctx, x, y, r, '#a8e09a'));
}

function tree(ctx, time) {
  // Trunk with a flared base and soft grain.
  ctx.fillStyle = '#c89b6d';
  ctx.beginPath();
  ctx.moveTo(186, 20);
  ctx.lineTo(274, 20);
  ctx.quadraticCurveTo(270, 260, 300, 340);
  ctx.lineTo(160, 340);
  ctx.quadraticCurveTo(190, 260, 186, 20);
  ctx.fill();
  ctx.fillStyle = '#ddb487';
  ctx.fillRect(196, 20, 10, 300);
  ctx.strokeStyle = '#a87a52';
  ctx.lineWidth = 2;
  for (const gx of [222, 242, 258]) {
    ctx.beginPath();
    ctx.moveTo(gx, 40);
    ctx.quadraticCurveTo(gx + 8, 180, gx - 4, 330);
    ctx.stroke();
  }
  // Treehouse windows in the trunk, lit warm, and a little round door at the foot.
  for (const [wx, wy] of [[228, 112], [216, 236]]) {
    box(ctx, wx - 9, wy - 11, 18, 22, { fill: '#ffe6a8', edge: '#8a5a3a', r: 9, width: 2 });
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(wx - 0.75, wy - 10, 1.5, 20);
    ctx.fillRect(wx - 8, wy, 16, 1.5);
  }
  box(ctx, 216, 318, 26, 26, { fill: '#a8714a', edge: '#6e4a30', r: 13, width: 2 });
  leaves(ctx, 236, 332, 1.6, '#f2c94c');
  // Canopy.
  const greens = ['#7cc47a', '#8fd18a', '#a8e09a'];
  [[90, 30, 50], [170, 10, 60], [260, 0, 66], [350, 22, 56], [420, 50, 40], [40, 60, 34], [220, 60, 40], [310, 70, 34], [130, 72, 36]]
    .forEach(([x, y, r], i) => leaves(ctx, x + Math.sin(time + i) * 1.5, y, r, greens[i % 3]));
  for (let i = 0; i < 14; i++) leaves(ctx, 40 + i * 28, 70 + (i % 3) * 10, 12, greens[(i + 1) % 3]);
  // Bunting strung across under the canopy.
  const flags = ['#ff9ec0', '#ffe36b', '#9edcff', '#b8f0c8', '#c9a6ff'];
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, 96);
  ctx.quadraticCurveTo(230, 122, 404, 96);
  ctx.stroke();
  for (let i = 0; i < 15; i++) {
    const u = (i + 0.5) / 15;
    const fx = 56 + u * 348;
    const fy = 96 + 2 * u * (1 - u) * 26 * 2 * 0.5 + Math.sin(time * 2 + i) * 0.6;
    ctx.fillStyle = flags[i % flags.length];
    ctx.beginPath();
    ctx.moveTo(fx - 5, fy);
    ctx.lineTo(fx + 5, fy);
    ctx.lineTo(fx, fy + 8);
    ctx.fill();
  }
  // Sunbeams through the leaves.
  ctx.save();
  ctx.globalAlpha = 0.12 + Math.sin(time * 0.8) * 0.03;
  ctx.fillStyle = '#ffffff';
  for (const bx of [250, 330, 400]) {
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx + 24, 0);
    ctx.lineTo(bx - 70, 340);
    ctx.lineTo(bx - 120, 340);
    ctx.fill();
  }
  ctx.restore();
  ring(ctx, TIER_Y[0], time, 0);
  ring(ctx, TIER_Y[1], time, 1);
}

// Leaves drifting down past the tree.
function fallingLeaves(ctx, time) {
  for (let i = 0; i < 10; i++) {
    const r1 = (i * 0.618) % 1;
    const x = (r1 * 460 + Math.sin(time * 1.1 + i) * 20 + time * 6) % 460;
    const y = ((i * 0.37) % 1 * 360 + time * (14 + r1 * 10)) % 380 - 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 2 + i) * 0.8);
    ctx.fillStyle = i % 3 ? '#8fd18a' : '#ffb8dc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// An empty spot: a flower bud on a short stem, glowing, with a "+" on it. Hovered it parts a
// little; chosen, it blooms open.
function bud(ctx, x, y, time, open) {
  ctx.strokeStyle = '#6fbf6a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 1);
  ctx.quadraticCurveTo(x + 3, y - 10, x, y - 18);
  ctx.stroke();
  leaves(ctx, x - 5, y - 8, 3, '#8fd18a');
  const g = ctx.createRadialGradient(x, y - 26, 0, x, y - 26, 20);
  g.addColorStop(0, `rgba(255,220,240,${0.5 + 0.2 * Math.sin(time * 2.5 + x)})`);
  g.addColorStop(1, 'rgba(255,220,240,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 20, y - 46, 40, 40);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i - (n - 1) / 2) / n) * (0.9 + 2.2 * open);
    ctx.save();
    ctx.translate(x, y - 18);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = i % 2 ? '#ffb8dc' : '#ff9ec0';
    ctx.beginPath();
    ctx.ellipse(0, -8, 4.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  leaves(ctx, x, y - 22, 5.5 * (0.6 + 0.4 * open), '#fff3fa');
  text(ctx, '+', x, y - 18.5, { size: 10, bold: true, align: 'center', color: '#ff6fa8' });
}

// The chosen hero's card: a big round portrait in their job's colour, the level and name, their
// place and gold, stats as pills, EXP, and Start (or Create) with Delete beside it as a trash can.
function infoCard(ui, c, x, y, w, live, time) {
  const { ctx } = ui;
  const H = 288;
  const col = familyColor(c);
  box(ctx, x - 2, y - 2, w + 4, H + 4, { fill: null, edge: '#ffe0ef', r: 16, width: 3 });
  box(ctx, x, y, w, H, { fill: 'rgba(255,247,252,0.96)', edge: '#f4bcd8', r: 14, width: 2 });
  const cx = x + w / 2;
  if (!c) {
    bud(ctx, cx, y + 92, time, 0.6 + 0.4 * Math.sin(time * 1.5));
    text(ctx, 'An empty spot', cx, y + 124, { size: 13, bold: true, align: 'center', color: COLORS.ink });
    text(ctx, 'Nobody lives here yet.', cx, y + 144, { size: 8, align: 'center', color: COLORS.muted });
    text(ctx, 'Plant a new hero on the tree.', cx, y + 156, { size: 8, align: 'center', color: COLORS.muted });
    return button(ui, x + 12, y + H - 44, w - 24, 32, 'Create', { primary: true, size: 14, enabled: live }) ? 'create' : null;
  }
  // The portrait.
  const py = y + 48;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, py, 36, 0, Math.PI * 2);
  ctx.clip();
  const bg = ctx.createRadialGradient(cx, py - 10, 4, cx, py, 36);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, lighten(col, 0.45));
  ctx.fillStyle = bg;
  ctx.fillRect(cx - 36, py - 36, 72, 72);
  drawHero(ctx, c.appearance, wornGear(c), cx, py + 58, { pose: 'idle', time, scale: 2, facing: 1 });
  ctx.restore();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, py, 36, 0, Math.PI * 2);
  ctx.stroke();
  box(ctx, cx - 22, py + 28, 44, 15, { fill: COLORS.gold, edge: '#ffffff', r: 7.5, width: 1.5 });
  text(ctx, `Lv ${c.level}`, cx, py + 39, { size: 9, bold: true, align: 'center', color: '#ffffff', outline: '#a8661a' });
  // Name and job.
  text(ctx, c.name, cx, y + 110, { size: 12, bold: true, align: 'center', color: COLORS.ink });
  const job = JOBS[c.job]?.name ?? '';
  ctx.font = font(8, true);
  const jw = ctx.measureText(job).width + 18;
  box(ctx, cx - jw / 2, y + 115, jw, 14, { fill: col, edge: '#ffffff', r: 7, width: 1.2 });
  text(ctx, job, cx, y + 125, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: darken(col, 0.3) });
  // Where and how rich.
  [['map', MAPS[c.mapId]?.name ?? ''], ['coin', c.gold.toLocaleString()]].forEach(([ic, v], i) => {
    const ry = y + 136 + i * 17;
    box(ctx, x + 12, ry, w - 24, 14, { fill: COLORS.cell, edge: null, r: 7 });
    icon(ctx, ic, x + 22, ry + 7, 8, i ? '#f0b53a' : '#6fb8ff');
    text(ctx, v, x + w - 18, ry + 10, { size: 8, bold: true, align: 'right' });
  });
  const s = stats(c);
  ['str', 'dex', 'int', 'luk'].forEach((k, i) => {
    const sx = x + 12 + (i % 2) * ((w - 24) / 2 + 2);
    const sy = y + 172 + Math.floor(i / 2) * 17;
    box(ctx, sx, sy, (w - 24) / 2 - 2, 14, { fill: COLORS.cell, edge: null, r: 7 });
    text(ctx, k.toUpperCase(), sx + 7, sy + 10, { size: 7.5, bold: true, color: COLORS.muted });
    text(ctx, `${s[k]}`, sx + (w - 24) / 2 - 9, sy + 10, { size: 8, bold: true, align: 'right' });
  });
  const need = expToNext(c.level);
  const maxed = !Number.isFinite(need);
  text(ctx, 'EXP', x + 14, y + 218, { size: 7.5, bold: true, color: COLORS.muted });
  bar(ctx, x + 36, y + 210, w - 48, 10, maxed ? 1 : c.exp / need, COLORS.exp, maxed ? 'MAX' : `${((c.exp / need) * 100).toFixed(1)}%`);
  const start = button(ui, x + 12, y + H - 44, w - 56, 32, 'Start', { primary: true, size: 14, enabled: live });
  // Delete: a little trash-can button that blushes red under the mouse.
  const tx = x + w - 40;
  const ty = y + H - 44;
  const hot = live && hover(ui, tx, ty, 28, 30);
  box(ctx, tx, ty + 2, 28, 28, { fill: hot ? '#ffd3dc' : '#f3e8fb', edge: hot ? COLORS.bad : COLORS.cellEdge, r: 14, width: 1.5 });
  icon(ctx, 'trash', tx + 14, ty + 16, 12, hot ? COLORS.bad : COLORS.muted);
  if (hot) tooltip(ui, [{ text: 'Delete this hero', bold: true, color: COLORS.bad }]);
  if (live && clicked(ui, tx, ty, 28, 30)) return 'delete?';
  return start ? 'start' : null;
}

// `chars` has one entry (a character or null) per slot; `state` keeps { slot, confirm }.
// Returns 'start', 'create', 'delete', 'back', or null.
export function selectScreen(ui, time, chars, state) {
  const { ctx } = ui;
  const keys = ui.input.pressed;
  const live = !state.confirm;
  lobbySky(ctx, time);
  tree(ctx, time);

  // The chosen hero steps forward and waves for a moment.
  if (state.slot !== state.shown) {
    state.shown = state.slot;
    state.pickedAt = time;
  }
  const since = time - (state.pickedAt ?? -9);

  let pick = null;
  chars.forEach((c, i) => {
    const [x, y] = slotPos(i);
    const on = i === state.slot;
    const hot = live && hover(ui, x - 18, y - 56, 36, 58);
    // A soft glow on the branch under a hero, in their job's colour; brighter when chosen.
    const g = ctx.createRadialGradient(x, y - 1, 0, x, y - 1, 22);
    const glow = c ? familyColor(c) : '#ffd6ea';
    g.addColorStop(0, on ? '#fff6c0' : glow);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = on ? 0.9 : 0.55;
    ctx.fillStyle = g;
    ctx.fillRect(x - 22, y - 10, 44, 16);
    ctx.globalAlpha = 1;
    if (on) {
      const sg = ctx.createLinearGradient(0, y - 80, 0, y);
      sg.addColorStop(0, 'rgba(255,248,200,0)');
      sg.addColorStop(1, `rgba(255,248,200,${0.45 + 0.1 * Math.sin(time * 3)})`);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 80);
      ctx.lineTo(x + 8, y - 80);
      ctx.lineTo(x + 20, y);
      ctx.lineTo(x - 20, y);
      ctx.fill();
    }
    if (c) {
      // Chosen: a hop and a cheer, then back to their idle bits.
      const hop = on && since < 0.9 ? Math.max(0, Math.sin((since / 0.45) * Math.PI)) * 6 * (since < 0.45 ? 1 : 0) : 0;
      const cheer = on && since < 1.1;
      drawHero(ctx, c.appearance, wornGear(c), x, y - hop, { pose: cheer ? 'cheer' : 'idle', progress: Math.min(1, since / 1.1), dur: 1.1, time: time + i * 3.7, seed: i, facing: 1 });
      ctx.font = font(8, true);
      const tw = ctx.measureText(c.name).width + 12;
      box(ctx, x - tw / 2, y + 3, tw, 12, { fill: on ? familyColor(c) : 'rgba(70,50,95,0.8)', edge: on ? '#ffffff' : null, r: 6, width: 1.2 });
      text(ctx, c.name, x, y + 12, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: on ? darken(familyColor(c), 0.35) : null });
    } else {
      bud(ctx, x, y, time, on ? Math.min(1, since / 0.5) : hot ? 0.3 : 0);
    }
    if (on) {
      const ay = y - 66 + Math.sin(time * 5) * 2;
      ctx.fillStyle = COLORS.select;
      ctx.beginPath();
      ctx.moveTo(x - 6, ay);
      ctx.lineTo(x + 6, ay);
      ctx.lineTo(x, ay + 7);
      ctx.fill();
    }
    if (live && clicked(ui, x - 18, y - 56, 36, 58)) {
      if (on) pick = c ? 'start' : 'create';
      state.slot = i;
    }
  });
  fallingLeaves(ctx, time);

  const c = chars[state.slot];
  if (live) {
    if (keys.has('ArrowLeft')) state.slot = (state.slot + chars.length - 1) % chars.length;
    if (keys.has('ArrowRight')) state.slot = (state.slot + 1) % chars.length;
    if (keys.has('ArrowUp') || keys.has('ArrowDown')) state.slot = (state.slot + 4) % chars.length;
    if (keys.has('Enter')) pick = c ? 'start' : 'create';
    if (keys.has('Escape')) pick = 'back';
    if (keys.has('Delete') && c) state.confirm = true;
  }

  if (button(ui, 8, 8, 86, 18, '< World Select', { size: 8, enabled: live })) pick = 'back';

  // World badge: a pill with ribbon tails, the world's gem, the channel and a server light.
  const px = 446, pw = 182;
  const wd = WORLDS[world];
  ctx.fillStyle = '#e0659f';
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? px + 6 : px + pw - 6;
    ctx.beginPath();
    ctx.moveTo(ex, 22);
    ctx.lineTo(ex + sd * 14, 22);
    ctx.lineTo(ex + sd * 9, 30);
    ctx.lineTo(ex + sd * 14, 38);
    ctx.lineTo(ex, 38);
    ctx.fill();
  }
  box(ctx, px - 2, 8, pw + 4, 44, { fill: null, edge: '#ffe0ef', r: 22, width: 3 });
  box(ctx, px, 10, pw, 40, { fill: 'rgba(255,247,252,0.97)', edge: '#f4bcd8', r: 20, width: 2 });
  ctx.fillStyle = wd.color;
  ctx.beginPath();
  ctx.arc(px + 22, 30, 12, 0, Math.PI * 2);
  ctx.fill();
  sparkle(ctx, px + 22, 30, 6 + Math.sin(time * 3), '#ffffff');
  text(ctx, wd.name, px + 42, 29, { size: 14, bold: true });
  ctx.fillStyle = COLORS.good;
  ctx.beginPath();
  ctx.arc(px + 45, 39, 2.5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'Channel 1 · online', px + 51, 42, { size: 7, bold: true, color: COLORS.muted });
  text(ctx, `${chars.filter(Boolean).length} / ${chars.length}`, px + pw - 14, 34, { size: 9, bold: true, align: 'right', color: COLORS.muted });
  const card = infoCard(ui, c, px, 60, pw, live, time);
  if (card === 'delete?') state.confirm = true;
  else pick = card ?? pick;

  if (state.confirm) {
    ctx.fillStyle = 'rgba(60,40,80,0.45)';
    ctx.fillRect(0, 0, 640, 360);
    panel(ctx, 220, 130, 200, 92, 'Delete Character');
    text(ctx, `Delete ${c?.name ?? ''} for good?`, 320, 164, { size: 10, bold: true, align: 'center' });
    text(ctx, 'This cannot be undone.', 320, 178, { size: 8, align: 'center', color: COLORS.muted });
    if (button(ui, 236, 190, 80, 20, 'Delete', { primary: true }) || keys.has('Enter')) {
      state.confirm = false;
      pick = 'delete';
    }
    if (button(ui, 324, 190, 80, 20, 'Cancel') || keys.has('Escape')) state.confirm = false;
  }
  return pick;
}

// ---------- Character creator ----------

// The stage poses: stand, walk in place, a cheer, and a turn to show the back of the hair.
const POSES = ['Idle', 'Walk', 'Cheer', 'Back'];
const POSE_DUR = 1.1;

function stage(ctx, x, y, w, h, time) {
  // A soft sky card with a spotlight falling on a round pedestal.
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#fbe9ff');
  sky.addColorStop(0.65, '#ffeef6');
  sky.addColorStop(1, '#ffe2ee');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const cx = x + w / 2;
  const fy = y + h - 62;
  const beam = ctx.createLinearGradient(0, y, 0, fy);
  beam.addColorStop(0, 'rgba(255,255,255,0)');
  beam.addColorStop(1, 'rgba(255,255,255,0.75)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(cx - 22, y);
  ctx.lineTo(cx + 22, y);
  ctx.lineTo(cx + 62, fy);
  ctx.lineTo(cx - 62, fy);
  ctx.fill();
  // Drifting motes in the light.
  for (let i = 0; i < 9; i++) {
    const k = (time * 0.12 + i * 0.137) % 1;
    const mx = cx + Math.sin(i * 2.3 + time * 0.8) * (20 + (i % 3) * 14);
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
    sparkle(ctx, mx, fy - k * (h - 80), 1.6 + (i % 2), i % 2 ? '#ffffff' : '#ffd6ea');
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // The pedestal: a pastel stone drum with a lit top and a flower trim.
  ctx.fillStyle = '#d9b8ea';
  ctx.beginPath();
  ctx.ellipse(cx, fy + 7, 58, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 58, fy, 116, 7);
  ctx.fillStyle = '#f6e6ff';
  ctx.beginPath();
  ctx.ellipse(cx, fy, 58, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - 6, fy - 3, 40, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.08 + (i / 8) * 0.84);
    const px = cx - Math.cos(a) * 56;
    const py = fy + Math.sin(a) * 12 + 5;
    ctx.fillStyle = ['#ffb3d1', '#ffe36b', '#b9e8ff'][i % 3];
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  box(ctx, x, y, w, h, { fill: null, edge: '#f4bcd8', r: 14, width: 2 });
  return [cx, fy + 2];
}

// Edits `draft` ({ name, look, tab, pose, facing, history }) in place. Returns 'start', 'back',
// or null.
export function creatorScreen(ui, time, draft) {
  const { ctx } = ui;
  ui.theme = THEMES.pink;
  draft.tab ??= 0;
  draft.pose ??= 0;
  draft.facing ??= 1;
  draft.history ??= [];
  const remember = (look) => {
    if (look === draft.look) return;
    draft.history.push(draft.look);
    if (draft.history.length > 40) draft.history.shift();
    draft.look = look;
  };
  backdrop(ctx, time * 0.3);
  ctx.fillStyle = 'rgba(255,240,250,0.45)';
  ctx.fillRect(0, 0, 640, 360);
  petals(ctx, time);
  text(ctx, 'Create your hero', 320, 30, { size: 18, bold: true, align: 'center', color: '#ffffff', outline: '#c97ad9' });

  // The stage: your hero on a pedestal, the name on a plate at their feet.
  const SX = 22;
  const SY = 44;
  const SW = 250;
  const SH = 290;
  softShadow(ctx, SX, SY, SW, SH, 12, 4);
  const [cx, fy] = stage(ctx, SX, SY, SW, SH, time);
  const pose = POSES[draft.pose];
  const cheer = pose === 'Cheer' ? (time % (POSE_DUR + 0.6)) / POSE_DUR : 2;
  const state = pose === 'Walk' ? { pose: 'walk' } : pose === 'Back' ? { pose: 'climb' } : cheer <= 1 ? { pose: 'cheer', progress: cheer, dur: POSE_DUR } : { pose: 'idle' };
  drawHero(ctx, draft.look, null, cx, fy, { ...state, time, facing: draft.facing, scale: 3, seed: 1 });
  const shown = draft.name || 'Your name';
  ctx.font = font(10, true);
  const nw = Math.max(70, ctx.measureText(shown).width + 20);
  box(ctx, cx - nw / 2, fy + 14, nw, 16, { fill: 'rgba(90,63,122,0.82)', edge: '#ffffff', r: 8, width: 1.5 });
  text(ctx, shown, cx, fy + 26, { size: 10, bold: true, align: 'center', color: draft.name ? '#ffffff' : 'rgba(255,255,255,0.55)' });
  // Pose chips and a turn button along the bottom of the stage.
  draft.pose = tabs(ui, SX + 14, SY + SH - 22, POSES, draft.pose, { w: 44, h: 15 });
  if (button(ui, SX + SW - 46, SY + SH - 24, 34, 17, 'Turn', { size: 8 })) draft.facing = -draft.facing;

  // The wardrobe: tabs over the look picker, then the name, then the buttons.
  const PX = 286;
  const PY = 44;
  const PW = 332;
  const PH = 290;
  softShadow(ctx, PX, PY, PW, PH, 12, 4);
  box(ctx, PX - 2, PY - 2, PW + 4, PH + 4, { fill: null, edge: '#ffe0ef', r: 16, width: 3 });
  box(ctx, PX, PY, PW, PH, { fill: 'rgba(255,250,253,0.97)', edge: '#f4bcd8', r: 14, width: 2 });
  const tabNames = LOOK_TABS.map((t) => t.label);
  draft.tab = tabs(ui, PX + (PW - tabNames.length * 60) / 2, PY + 10, tabNames, draft.tab, { w: 58, h: 17 });
  const cell = [21, 30, 27, 24, 40][draft.tab];
  const picked = lookRows(ui, draft.look, draft.tab, PX + 14, PY + 36, PW - 28, { cell, time });
  remember(picked.look);

  // Name entry: a field with a blinking caret and a placeholder.
  const NY = PY + PH - 62;
  // The tip only shows when the rows leave room for it (the Hair tab is full).
  if (PY + 36 + picked.h < NY - 26) wrap(ctx, 'Gear you equip covers your outfit. Restyle any time at Lulu\'s salon in Sprout Village.', PX + 16, NY - 24, PW - 32, { size: 7, color: COLORS.muted });
  ctx.strokeStyle = COLORS.cellEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PX + 14, NY - 6);
  ctx.lineTo(PX + PW - 14, NY - 6);
  ctx.stroke();
  for (const ch of ui.input.typed) {
    if (ch === '\b') draft.name = draft.name.slice(0, -1);
    else if (/^[\w '-]$/.test(ch) && draft.name.length < 12 && !(ch === ' ' && !draft.name)) draft.name += ch;
  }
  text(ctx, 'Name', PX + 16, NY + 11, { size: 9, bold: true });
  box(ctx, PX + 52, NY, PW - 66, 17, { fill: '#ffffff', edge: COLORS.accent, r: 8.5 });
  const caret = Math.floor(time * 2) % 2 ? '|' : '';
  if (draft.name) text(ctx, `${draft.name}${caret}`, PX + 58, NY + 12, { size: 9, bold: true });
  else text(ctx, `${caret}Type a name`, PX + 58, NY + 12, { size: 9, color: COLORS.muted });
  text(ctx, `${draft.name.length}/12`, PX + PW - 20, NY + 12, { size: 7, align: 'right', color: COLORS.muted });

  const BY = PY + PH - 34;
  if (button(ui, PX + 14, BY, 82, 22, 'Randomize', { size: 9, iconName: 'star' })) remember(randomLook());
  if (button(ui, PX + 102, BY, 56, 22, 'Undo', { size: 9, enabled: draft.history.length > 0 })) draft.look = draft.history.pop();
  const ok = draft.name.trim().length > 0;
  // Start on Dawnlight Isle (the tutorial) or skip straight to Sprout Village.
  draft.tutorial ??= true;
  text(ctx, 'Tutorial', PX + 166, BY + 14.5, { size: 8, bold: true, color: draft.tutorial ? COLORS.ink : COLORS.muted });
  draft.tutorial = toggle(ui, PX + 206, BY + 4.5, draft.tutorial);
  if (hover(ui, PX + 162, BY, 72, 22)) tooltip(ui, [{ text: draft.tutorial ? 'Start on Dawnlight Isle' : 'Skip the tutorial', bold: true }, { text: draft.tutorial ? 'A short island that shows you the ropes, then a boat to Sprout Village.' : 'Start right in Sprout Village.', size: 8, color: COLORS.muted }]);
  if (button(ui, 8, 8, 86, 18, '< Characters', { size: 8 }) || ui.input.pressed.has('Escape')) return 'back';
  return button(ui, PX + PW - 94, BY, 80, 22, 'Start!', { primary: true, enabled: ok, size: 11 }) || (ok && ui.input.pressed.has('Enter')) ? 'start' : null;
}
