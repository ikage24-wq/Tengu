// Layered side-scroller scenery: sky, parallax skyline, cranes and poles, brick ground, and platforms.
// Everything is drawn with simple shapes. Layouts are seeded by index, so the scene stays
// put as the camera moves and looks the same on every run.

import { FLOOR_Y } from './game.js';
import { BACKGROUNDS, ready } from './assets.js';

export const THEMES = {
  sunset: {
    skyline: 'city',
    skyTop: '#3d2b5f',
    skyMid: '#a84f7a',
    skyBottom: '#ffb27a',
    sun: 'rgba(255, 243, 196, 0.9)',
    cloud: '#5a3a6e',
    cloudLight: '#f0a0a0',
    far: '#4a3d63',
    mid: '#6b5a7e',
    dark: '#2b2340',
    lit: '#ffd978',
    brick: '#b3673e',
    mortar: '#e2b58f',
    ground: '#7a4a35',
    ledge: '#d59a6a',
    ledgeTop: '#f5c99c',
    curb: '#8d8590',
    posters: ['#ffd978', '#ff9ec0', '#9be8ff'],
  },
  daylight: {
    skyline: 'hills',
    skyTop: '#7ec8ff',
    skyMid: '#bfe6ff',
    skyBottom: '#fff2d6',
    sun: 'rgba(255, 251, 224, 0.95)',
    cloud: '#ffffff',
    cloudLight: '#ffffff',
    far: '#9cd3a8',
    mid: '#6fbf7a',
    dark: '#2f6b3a',
    lit: '#ffffff',
    brick: '#c9a06e',
    mortar: '#e6d0ac',
    ground: '#8a6a48',
    ledge: '#c89b6a',
    ledgeTop: '#dfc08f',
    grass: '#6dbf5a',
    posters: ['#ffe9a8', '#ffc2d6', '#bff0dc'],
  },
  dusk: {
    skyline: 'pines',
    skyTop: '#1d2b4a',
    skyMid: '#3c4f7a',
    skyBottom: '#c98d8d',
    sun: 'rgba(255, 226, 176, 0.7)',
    cloud: '#3b4a6b',
    cloudLight: '#9aa6c6',
    far: '#243a3a',
    mid: '#1f3b33',
    dark: '#0f1d1c',
    lit: '#ffd27a',
    brick: '#5b6470',
    mortar: '#7b8592',
    ground: '#3d4a3a',
    ledge: '#6f7a86',
    ledgeTop: '#9aa6b4',
    grass: '#3f7a4a',
    posters: ['#ffd27a', '#c9b5ff', '#9be8ff'],
  },
};

// Dirt tile from the CC0 Pixel Platformer pack (assets/kenney/LICENSE.txt). The ground uses it once loaded.
let groundTile = null;
const sheet = new Image();
sheet.onload = () => {
  const tile = document.createElement('canvas');
  tile.width = 18;
  tile.height = 18;
  tile.getContext('2d').drawImage(sheet, 18, 126, 18, 18, 0, 0, 18, 18);
  groundTile = tile;
};
sheet.src = 'assets/kenney/tilemap_packed.png';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Repeats `draw(index, x)` across the screen. `factor` sets the parallax speed.
function repeat(cam, factor, spacing, width, extra, draw) {
  const off = cam * factor + extra;
  const first = Math.floor(off / spacing);
  const count = Math.ceil(width / spacing) + 2;
  for (let k = 0; k < count; k++) {
    const i = first + k;
    draw(i, i * spacing - off);
  }
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawSky(ctx, t, width, height) {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0, t.skyTop);
  g.addColorStop(0.6, t.skyMid);
  g.addColorStop(1, t.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const sx = width * 0.72;
  const sy = FLOOR_Y * 0.42;
  const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, 130);
  glow.addColorStop(0, t.sun);
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, FLOOR_Y);
}

// Clouds are stacked ellipses with a lighter top edge.
function drawCloud(ctx, x, y, w, t) {
  ctx.fillStyle = t.cloud;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y, w * 0.5, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.3, y - 4, w * 0.22, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.7, y - 3, w * 0.2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = t.cloudLight;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.4, y - 7, w * 0.16, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx, t, cam, width, time) {
  repeat(cam, 0.08, 150, width, time * 8, (i, x) => {
    if (hash(i) < 0.35) return;
    drawCloud(ctx, x, 30 + hash(i + 7) * 80, 60 + hash(i + 3) * 60, t);
  });
}

function drawCity(ctx, t, cam, width) {
  repeat(cam, 0.22, 38, width, 0, (i, x) => {
    const h = 50 + hash(i) * 110;
    rect(ctx, x, FLOOR_Y - h, 38, h, t.far);
    if (hash(i + 9) > 0.6) rect(ctx, x + 17, FLOOR_Y - h - 14, 2, 14, t.far);
  });
  repeat(cam, 0.5, 72, width, 0, (i, x) => {
    const h = 70 + hash(i + 2) * 90;
    rect(ctx, x + 6, FLOOR_Y - h, 52, h, t.mid);
    rect(ctx, x + 4, FLOOR_Y - h, 56, 4, t.dark);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const y = FLOOR_Y - h + 10 + r * 12;
        if (y > FLOOR_Y - 12) continue;
        if (hash(i * 13 + r * 4 + c) > 0.5) rect(ctx, x + 12 + c * 10, y, 4, 6, t.lit);
      }
    }
  });
  // Cranes, like the ones on a building site.
  repeat(cam, 0.7, 260, width, 0, (i, x) => {
    if (hash(i) < 0.4) return;
    rect(ctx, x + 20, FLOOR_Y - 150, 6, 150, t.dark);
    for (let y = FLOOR_Y - 150; y < FLOOR_Y; y += 8) rect(ctx, x + 18, y, 10, 1, t.dark);
    rect(ctx, x, FLOOR_Y - 150, 116, 4, t.dark);
    rect(ctx, x + 98, FLOOR_Y - 146, 1, 44, t.dark);
    rect(ctx, x + 94, FLOOR_Y - 102, 9, 6, t.ledge);
  });
}

function drawHills(ctx, t, cam, width) {
  repeat(cam, 0.25, 260, width, 0, (i, x) => {
    ctx.fillStyle = t.far;
    ctx.beginPath();
    ctx.arc(x + 130, FLOOR_Y + 20, 150, Math.PI, 0);
    ctx.fill();
  });
  repeat(cam, 0.5, 64, width, 0, (i, x) => {
    const r = 10 + hash(i) * 8;
    rect(ctx, x + 28, FLOOR_Y - 22, 4, 22, t.dark);
    ctx.fillStyle = t.mid;
    ctx.beginPath();
    ctx.arc(x + 30, FLOOR_Y - 28, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPines(ctx, t, cam, width) {
  const pine = (x, base, h, w, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, base - h);
    ctx.lineTo(x + w / 2, base);
    ctx.lineTo(x - w / 2, base);
    ctx.closePath();
    ctx.fill();
  };
  repeat(cam, 0.25, 34, width, 0, (i, x) => {
    pine(x + 17, FLOOR_Y, 90 + hash(i) * 60, 26, t.far);
  });
  repeat(cam, 0.5, 58, width, 0, (i, x) => {
    pine(x + 29, FLOOR_Y, 60 + hash(i + 5) * 40, 22, t.mid);
  });
}

// Power poles with sagging wires between them, drawn in front of the ground's far edge.
function drawPoles(ctx, t, cam, width) {
  repeat(cam, 1, 120, width, 0, (i, x) => {
    rect(ctx, x, FLOOR_Y - 70, 3, 70, t.dark);
    rect(ctx, x - 4, FLOOR_Y - 66, 11, 2, t.dark);
    if (t.lit && hash(i) > 0.5) rect(ctx, x - 1, FLOOR_Y - 74, 5, 4, t.lit);
    ctx.strokeStyle = t.dark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 1, FLOOR_Y - 62);
    ctx.quadraticCurveTo(x + 60, FLOOR_Y - 48, x + 121, FLOOR_Y - 62);
    ctx.stroke();
  });
}

// Brick ground with a grass or curb top edge, and hazard stripes on the sidewalk.
function drawGround(ctx, t, cam, width, height, hasCurb) {
  if (groundTile) {
    ctx.save();
    ctx.fillStyle = ctx.createPattern(groundTile, 'repeat');
    ctx.translate(-(cam % 18), FLOOR_Y + 10);
    ctx.fillRect(-18, 0, width + 36, height);
    ctx.restore();
  } else {
    rect(ctx, 0, FLOOR_Y, width, height - FLOOR_Y, t.brick);
    const mortarY = (row) => FLOOR_Y + 10 + row * 8;
    for (let row = 0; mortarY(row) < height; row++) {
      const y = mortarY(row);
      rect(ctx, 0, y, width, 1, t.ground);
      const offset = row % 2 ? 8 : 0;
      for (let x = -((cam + offset) % 16); x < width; x += 16) {
        rect(ctx, x, y + 1, 1, 7, t.ground);
      }
    }
  }
  if (t.grass) {
    rect(ctx, 0, FLOOR_Y, width, 6, t.grass);
    ctx.fillStyle = t.grass;
    for (let x = -((cam * 1) % 12); x < width; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x + 3, FLOOR_Y - 3);
      ctx.lineTo(x + 6, FLOOR_Y);
      ctx.fill();
    }
  } else {
    rect(ctx, 0, FLOOR_Y, width, 4, t.curb);
  }
  if (hasCurb) {
    for (let x = -((cam * 1) % 12); x < width; x += 12) {
      rect(ctx, x, FLOOR_Y + 4, 6, 3, '#ffd23f');
      rect(ctx, x + 6, FLOOR_Y + 4, 6, 3, '#2d2a33');
    }
  }
}

// Draws everything behind the platforms: sky, skyline, poles, and the ground.
// Which CC0 parallax set a theme uses, if any.
function imageLayersFor(themeName) {
  if (themeName === 'sunset') return BACKGROUNDS.ocean.night;
  if (themeName === 'daylight') return BACKGROUNDS.ocean.noon;
  if (themeName === 'dusk') return BACKGROUNDS.forest;
  return null;
}

// Tiles each layer horizontally at its own scroll speed. Layers sit on the ground line.
function drawImageLayers(ctx, layers, cam, width) {
  for (const { img, factor } of layers) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const x0 = -((cam * factor) % w);
    for (let x = x0; x < width; x += w) {
      ctx.drawImage(img, Math.round(x), FLOOR_Y + 40 - h);
    }
  }
}

export function drawBackdrop(ctx, themeName, cam, width, height, time) {
  const t = THEMES[themeName] ?? THEMES.sunset;
  drawSky(ctx, t, width, height);
  const layers = imageLayersFor(themeName);
  if (layers && layers.every((l) => ready(l.img))) {
    drawImageLayers(ctx, layers, cam, width);
  } else {
    drawClouds(ctx, t, cam, width, time);
    if (t.skyline === 'city') drawCity(ctx, t, cam, width);
    else if (t.skyline === 'hills') drawHills(ctx, t, cam, width);
    else drawPines(ctx, t, cam, width);
  }
  drawGround(ctx, t, cam, width, height, t.skyline === 'city');
  drawPoles(ctx, t, cam, width);
}

// Ledges with brick pillars underneath, so they read as stacked terraces.
export function drawPlatforms(ctx, platforms, cam, width, themeName) {
  const t = THEMES[themeName] ?? THEMES.sunset;
  for (const p of platforms) {
    const x = Math.round(p.x - cam);
    if (x + p.w < 0 || x > width) continue;

    const pillarTop = p.y + 12;
    const pillarXs = p.w >= 120 ? [4, Math.floor(p.w / 2) - 5, p.w - 14] : [4, p.w - 14];
    for (const px of pillarXs) {
      rect(ctx, x + px, pillarTop, 10, FLOOR_Y - pillarTop, t.brick);
      for (let y = pillarTop + 4; y < FLOOR_Y; y += 6) rect(ctx, x + px, y, 10, 1, t.ground);
    }

    rect(ctx, x, p.y, p.w, 12, t.ledge);
    rect(ctx, x, p.y, p.w, 2, t.ledgeTop);
    rect(ctx, x, p.y + 11, p.w, 1, t.ground);
    for (let bx = 12; bx < p.w; bx += 12) rect(ctx, x + bx, p.y + 4, 1, 7, t.mortar);

    // A poster on some ledges, for a bit of street life.
    if (hash(p.x) > 0.5) {
      const color = t.posters[Math.floor(hash(p.x + 1) * t.posters.length)];
      rect(ctx, x + p.w / 2 - 8, p.y + 14, 16, 7, color);
      rect(ctx, x + p.w / 2 - 8, p.y + 14, 16, 1, t.dark ?? '#2d2a33');
    }
  }
}
