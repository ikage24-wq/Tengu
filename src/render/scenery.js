// Map scenery: themed skies, parallax layers, ground, ledges, ropes, portals, and props.
// World-to-screen is (wx - cam.x, wy - cam.y). Layouts are seeded so nothing jitters as you move.

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const THEMES = {
  town: {
    sky: ['#ffb3e0', '#d9c4ff', '#fff0fa'], sun: '#fff6c9', far: '#e2d4ff', mid: '#f3e6ff', midTrim: '#c9b6ff',
    ground: '#f5c7a8', groundDeep: '#e8ad8c', trim: '#ffffff', ledge: '#ffd9e8', ledgeTrim: '#ffffff', ledgeShade: '#f0b6cf',
    skyline: 'houses', props: ['lamp', 'flower', 'bench', 'flower'],
  },
  meadow: {
    sky: ['#8fdcff', '#c9efff', '#fff6dc'], sun: '#fffbe0', far: '#bdeec9', mid: '#9fe0b0', midTrim: '#7fd19a',
    ground: '#e8c08f', groundDeep: '#d6a874', trim: '#7ee081', ledge: '#ffe0b0', ledgeTrim: '#8fe39a', ledgeShade: '#e6bf8a',
    skyline: 'hills', props: ['flower', 'flower', 'bush', 'fence', 'flower'],
  },
  harbor: {
    sky: ['#9fd8ff', '#ffd6ec', '#fff3e0'], sun: '#fff1c9', far: '#a8dcff', mid: '#ffffff', midTrim: '#8fd3ff',
    ground: '#ffe2b8', groundDeep: '#f5c995', trim: '#ffffff', ledge: '#cfeaff', ledgeTrim: '#ffffff', ledgeShade: '#a8cde8',
    skyline: 'sea', props: ['lamp', 'crate', 'flower', 'buoy'],
  },
  forest: {
    sky: ['#b8f0d0', '#e0f8e8', '#fff8e0'], sun: '#fffde0', far: '#8fd3a8', mid: '#6fbf8a', midTrim: '#4fa070',
    ground: '#c9a27a', groundDeep: '#b08860', trim: '#7ed38f', ledge: '#d9b88f', ledgeTrim: '#8fe39a', ledgeShade: '#b8946b',
    skyline: 'trees', props: ['mushroom', 'bush', 'flower', 'stump'],
  },
  ruins: {
    sky: ['#7b6be6', '#c39cff', '#ffc2e0'], sun: '#ffe6ff', far: '#9d8ae8', mid: '#b8a6f0', midTrim: '#8f7cd0',
    ground: '#c3b4e8', groundDeep: '#a898d6', trim: '#e6dcff', ledge: '#d6cbf5', ledgeTrim: '#f3edff', ledgeShade: '#ad9fd9',
    skyline: 'columns', props: ['column', 'candle', 'flower', 'stone'],
  },
  cave: {
    sky: ['#3f3380', '#6b52b8', '#8f72d0'], sun: '#c9b6ff', far: '#5a48a0', mid: '#7a62c4', midTrim: '#9f8ae0',
    ground: '#7a68b8', groundDeep: '#62509e', trim: '#a8e8ff', ledge: '#8f7cd0', ledgeTrim: '#b8f0ff', ledgeShade: '#6b58a8',
    skyline: 'crystals', props: ['crystal', 'crystal', 'stone', 'glow'],
  },
  sky: {
    sky: ['#ffc2e6', '#c9d8ff', '#e8f6ff'], sun: '#fffbe6', far: '#ffffff', mid: '#f3f8ff', midTrim: '#d6e6ff',
    ground: '#ffffff', groundDeep: '#e8f0ff', trim: '#fff0fa', ledge: '#ffffff', ledgeTrim: '#ffe6f3', ledgeShade: '#dce8ff',
    skyline: 'islands', props: ['star', 'flower', 'cloudpuff'],
  },
};

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Calls draw(i, x) for repeating elements across the screen at a parallax factor.
function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 1;
  const count = Math.ceil(width / spacing) + 3;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}

function cloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 10 * s, 0, Math.PI * 2);
  ctx.arc(x + 12 * s, y - 6 * s, 13 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y - 2 * s, 11 * s, 0, Math.PI * 2);
  ctx.arc(x + 14 * s, y + 4 * s, 10 * s, 0, Math.PI * 2);
  ctx.fill();
}

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

// ---------- Background ----------

function drawSky(ctx, t, width, height, time, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, t.sky[0]);
  g.addColorStop(0.55, t.sky[1]);
  g.addColorStop(1, t.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.75, 70, 4, width * 0.75, 70, 120);
  glow.addColorStop(0, t.sun);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  // Twinkles in dark themes, drifting clouds in bright ones.
  if (theme === 'cave' || theme === 'ruins') {
    for (let i = 0; i < 26; i++) {
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + i * 1.7);
      ctx.globalAlpha = 0.3 + 0.6 * tw;
      sparkle(ctx, hash(i) * width, hash(i + 40) * height * 0.6, 1.5 + tw * 1.5, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
}

function drawFar(ctx, t, cam, width, y0, time) {
  if (t.skyline !== 'crystals') {
    repeat(cam.x + time * 6, 0.06, 170, width, (i, x) => {
      if (hash(i) < 0.35) return;
      cloud(ctx, x, 40 + hash(i + 3) * 70 - cam.y * 0.05, 0.8 + hash(i + 9) * 0.6, 'rgba(255,255,255,0.85)');
    });
  }
  ctx.fillStyle = t.far;
  switch (t.skyline) {
    case 'houses':
      repeat(cam.x, 0.2, 54, width, (i, x) => {
        const h = 40 + hash(i) * 50;
        ctx.fillRect(x, y0 - h, 46, h + 200);
        ctx.beginPath();
        ctx.moveTo(x - 4, y0 - h);
        ctx.lineTo(x + 23, y0 - h - 18);
        ctx.lineTo(x + 50, y0 - h);
        ctx.fill();
      });
      break;
    case 'sea':
      ctx.fillRect(0, y0 - 30, width, 300);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      repeat(cam.x + time * 10, 0.2, 40, width, (i, x) => ctx.fillRect(x, y0 - 22 + (i % 3) * 8, 18, 2));
      break;
    case 'columns':
      repeat(cam.x, 0.2, 90, width, (i, x) => {
        const h = 60 + hash(i) * 70;
        ctx.fillRect(x, y0 - h, 22, h + 200);
        ctx.fillRect(x - 5, y0 - h, 32, 7);
      });
      break;
    case 'crystals':
      repeat(cam.x, 0.2, 46, width, (i, x) => {
        const h = 50 + hash(i) * 90;
        ctx.beginPath();
        ctx.moveTo(x, y0 + 200);
        ctx.lineTo(x + 10, y0 - h);
        ctx.lineTo(x + 24, y0 + 200);
        ctx.fill();
      });
      break;
    case 'islands':
      repeat(cam.x, 0.18, 160, width, (i, x) => {
        if (hash(i) < 0.4) return;
        const y = y0 - 70 - hash(i + 2) * 60;
        cloud(ctx, x, y, 1.4, '#ffffff');
        ctx.fillStyle = t.midTrim;
        ctx.fillRect(x + 6, y + 8, 28, 4);
        ctx.fillStyle = t.far;
      });
      break;
    default: // hills, trees
      repeat(cam.x, 0.2, 220, width, (i, x) => {
        ctx.beginPath();
        ctx.arc(x + 110, y0 + 30, 130, Math.PI, 0);
        ctx.fill();
      });
  }
}

function drawMid(ctx, t, cam, width, y0) {
  ctx.fillStyle = t.mid;
  switch (t.skyline) {
    case 'trees':
      repeat(cam.x, 0.45, 70, width, (i, x) => {
        const h = 50 + hash(i + 7) * 40;
        ctx.fillStyle = t.midTrim;
        ctx.fillRect(x + 32, y0 - h + 20, 6, h);
        ctx.fillStyle = t.mid;
        ctx.beginPath();
        ctx.arc(x + 35, y0 - h, 22 + hash(i) * 8, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    case 'houses':
      repeat(cam.x, 0.45, 120, width, (i, x) => {
        if (hash(i + 5) < 0.3) return;
        const h = 46 + hash(i) * 30;
        ctx.fillStyle = t.mid;
        ctx.fillRect(x, y0 - h, 70, h + 200);
        ctx.fillStyle = t.midTrim;
        ctx.beginPath();
        ctx.moveTo(x - 6, y0 - h);
        ctx.lineTo(x + 35, y0 - h - 24);
        ctx.lineTo(x + 76, y0 - h);
        ctx.fill();
        ctx.fillStyle = '#fff3a6';
        ctx.fillRect(x + 12, y0 - h + 12, 10, 10);
        ctx.fillRect(x + 46, y0 - h + 12, 10, 10);
      });
      break;
    case 'sea':
      repeat(cam.x, 0.45, 260, width, (i, x) => {
        if (hash(i) < 0.5) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y0 - 20, 36, 8);
        ctx.fillStyle = '#ff9ec0';
        ctx.beginPath();
        ctx.moveTo(x + 18, y0 - 20);
        ctx.lineTo(x + 18, y0 - 52);
        ctx.lineTo(x + 36, y0 - 24);
        ctx.fill();
      });
      break;
    default:
      repeat(cam.x, 0.45, 150, width, (i, x) => {
        ctx.fillStyle = t.mid;
        ctx.beginPath();
        ctx.arc(x + 75, y0 + 20, 70 + hash(i) * 20, Math.PI, 0);
        ctx.fill();
      });
  }
}

// ---------- Foreground ----------

function drawGround(ctx, t, map, cam, width, height) {
  const y = map.groundY - cam.y;
  if (y > height) return;
  rect(ctx, 0, y, width, height - y, t.ground);
  // A soft checker of darker patches.
  ctx.fillStyle = t.groundDeep;
  const off = cam.x % 32;
  for (let gy = y + 14; gy < height; gy += 16) {
    for (let gx = -off - 32 + ((gy - y) % 32 ? 16 : 0); gx < width; gx += 32) ctx.fillRect(Math.round(gx), Math.round(gy), 10, 4);
  }
  rect(ctx, 0, y, width, 5, t.trim);
  ctx.fillStyle = t.trim;
  for (let gx = -(cam.x % 10); gx < width; gx += 10) ctx.fillRect(Math.round(gx), Math.round(y + 4), 5, 2);
}

function drawLedges(ctx, t, map, cam, width, height) {
  for (const p of map.platforms) {
    const x = p.x - cam.x;
    const y = p.y - cam.y;
    if (x + p.w < -10 || x > width + 10 || y > height + 10 || y < -30) continue;
    ctx.fillStyle = 'rgba(58,45,79,0.12)';
    ctx.fillRect(Math.round(x + 4), Math.round(y + 14), Math.round(p.w - 8), 4);
    ctx.fillStyle = t.ledgeShade;
    roundRect(ctx, x, y + 2, p.w, 12, 5);
    ctx.fillStyle = t.ledge;
    roundRect(ctx, x, y, p.w, 11, 5);
    ctx.fillStyle = t.ledgeTrim;
    roundRect(ctx, x, y - 1, p.w, 4, 2);
    for (let dx = 8; dx < p.w - 6; dx += 14) rect(ctx, x + dx, y + 6, 6, 2, t.ledgeShade);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawRopes(ctx, map, cam) {
  for (const r of map.ropes) {
    const x = Math.round(r.x - cam.x);
    const top = r.top - cam.y;
    const bottom = r.bottom - cam.y;
    rect(ctx, x - 2, top, 4, bottom - top, '#c9a27a');
    rect(ctx, x - 1, top, 1, bottom - top, '#e8c9a0');
    for (let y = top + 6; y < bottom; y += 10) rect(ctx, x - 2, y, 4, 2, '#a07e58');
    rect(ctx, x - 4, top - 2, 8, 4, '#a07e58');
  }
}

function drawPortals(ctx, map, cam, time, nearId) {
  for (const p of map.portals) {
    if (p.hidden) continue;
    const x = p.x - cam.x;
    const y = p.y - cam.y;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    const g = ctx.createRadialGradient(x, y - 26, 2, x, y - 26, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, `rgba(190,170,255,${0.6 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(190,170,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y - 26, 18, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = time * 2 + (i * Math.PI * 2) / 5;
      sparkle(ctx, x + Math.cos(a) * 14, y - 26 + Math.sin(a) * 22, 2, '#ffffff');
    }
    if (p.id === nearId) {
      const bob = Math.sin(time * 6) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, y - 66 + bob);
      ctx.lineTo(x - 6, y - 58 + bob);
      ctx.lineTo(x + 6, y - 58 + bob);
      ctx.fill();
    }
  }
}

function prop(ctx, kind, x, y, seed, t, time) {
  switch (kind) {
    case 'flower': {
      const colors = ['#ff9ec0', '#ffe36b', '#c9a6ff', '#ffffff', '#8fd3ff'];
      const c = colors[Math.floor(seed * colors.length)];
      rect(ctx, x, y - 6, 1, 6, '#5fb050');
      rect(ctx, x - 2, y - 9, 5, 3, c);
      rect(ctx, x - 1, y - 10, 3, 5, c);
      rect(ctx, x, y - 8, 1, 1, '#fff6c9');
      break;
    }
    case 'bush':
      ctx.fillStyle = '#7fd19a';
      ctx.beginPath();
      ctx.arc(x, y - 6, 8, Math.PI, 0);
      ctx.arc(x + 9, y - 8, 9, Math.PI, 0);
      ctx.fill();
      break;
    case 'lamp':
      rect(ctx, x, y - 34, 2, 34, '#8f7cc4');
      rect(ctx, x - 3, y - 40, 8, 7, '#fff3a6');
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(time * 2 + seed * 9);
      ctx.fillStyle = '#fff3a6';
      ctx.beginPath();
      ctx.arc(x + 1, y - 36, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    case 'bench':
      rect(ctx, x - 10, y - 8, 22, 3, '#c99a6b');
      rect(ctx, x - 8, y - 5, 2, 5, '#a07e58');
      rect(ctx, x + 8, y - 5, 2, 5, '#a07e58');
      break;
    case 'fence':
      for (let i = 0; i < 3; i++) rect(ctx, x + i * 8, y - 12, 3, 12, '#fff4e0');
      rect(ctx, x - 2, y - 9, 22, 2, '#fff4e0');
      break;
    case 'crate':
      rect(ctx, x - 7, y - 14, 14, 14, '#e6b98a');
      rect(ctx, x - 7, y - 8, 14, 2, '#c99a6b');
      break;
    case 'buoy':
      rect(ctx, x - 4, y - 10, 8, 10, '#ff9ec0');
      rect(ctx, x - 4, y - 6, 8, 2, '#ffffff');
      break;
    case 'mushroom':
      rect(ctx, x - 1, y - 5, 3, 5, '#fff1dc');
      ctx.fillStyle = seed > 0.5 ? '#ff9ec0' : '#ffb38a';
      ctx.beginPath();
      ctx.arc(x + 0.5, y - 5, 5, Math.PI, 0);
      ctx.fill();
      break;
    case 'stump':
      rect(ctx, x - 6, y - 8, 12, 8, '#b08860');
      rect(ctx, x - 6, y - 9, 12, 2, '#e6c9a0');
      break;
    case 'column':
      rect(ctx, x - 5, y - 30 - seed * 14, 10, 30 + seed * 14, '#e6dcff');
      rect(ctx, x - 7, y - 32 - seed * 14, 14, 4, '#f3edff');
      break;
    case 'candle':
      rect(ctx, x, y - 8, 3, 8, '#fff4e0');
      ctx.fillStyle = '#ffd66b';
      ctx.beginPath();
      ctx.ellipse(x + 1.5, y - 11 + Math.sin(time * 8 + seed * 5), 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'stone':
      ctx.fillStyle = t.groundDeep;
      ctx.beginPath();
      ctx.ellipse(x, y - 3, 7, 4, 0, Math.PI, 0);
      ctx.fill();
      break;
    case 'crystal': {
      const c = seed > 0.5 ? '#a8e8ff' : '#e0b8ff';
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x - 2, y - 16 - seed * 10);
      ctx.lineTo(x + 2, y - 18 - seed * 10);
      ctx.lineTo(x + 5, y);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(Math.round(x - 1), Math.round(y - 14 - seed * 8), 1, 8);
      break;
    }
    case 'glow':
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(time * 2 + seed * 10);
      sparkle(ctx, x, y - 20 - seed * 30, 3, '#b8f0ff');
      ctx.globalAlpha = 1;
      break;
    case 'star':
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 3 + seed * 10);
      sparkle(ctx, x, y - 10 - seed * 20, 3, '#ffe36b');
      ctx.globalAlpha = 1;
      break;
    case 'cloudpuff':
      cloud(ctx, x - 10, y - 4, 0.5, '#ffffff');
      break;
    default:
  }
}

function drawProps(ctx, t, map, cam, width, time) {
  const surfaces = [{ x: 0, y: map.groundY, w: map.width, ground: true }, ...map.platforms];
  surfaces.forEach((s, si) => {
    const step = s.ground ? 46 : 38;
    for (let wx = s.x + 12; wx < s.x + s.w - 8; wx += step) {
      const seed = hash(wx * 0.37 + si * 13 + map.width);
      if (seed < 0.45) continue;
      // Keep doorways clear around portals and NPCs.
      if (s.ground && map.portals.some((p) => Math.abs(p.x - wx) < 40)) continue;
      if (s.ground && map.npcs.some((n) => Math.abs(n.x - wx) < 30)) continue;
      const x = wx - cam.x;
      if (x < -40 || x > width + 40) continue;
      const kind = t.props[Math.floor(hash(wx + si) * t.props.length)];
      prop(ctx, kind, Math.round(x), Math.round(s.y - cam.y), seed, t, time);
    }
  });
}

// Everything behind the characters.
export function drawSceneBack(ctx, map, cam, width, height, time, nearPortalId) {
  const t = THEMES[map.theme] ?? THEMES.meadow;
  drawSky(ctx, t, width, height, time, map.theme);
  // Layers sit just above the ground when the camera is at the bottom of the map, and scroll
  // vertically at a fraction of the camera so taller maps still feel deep.
  const camBottom = Math.max(0, map.height - height);
  const layerY = (lift, factor) => map.groundY - lift - camBottom - (cam.y - camBottom) * factor;
  drawFar(ctx, t, cam, width, layerY(50, 0.2), time);
  drawMid(ctx, t, cam, width, layerY(10, 0.45));
  drawGround(ctx, t, map, cam, width, height);
  drawProps(ctx, t, map, cam, width, time);
  drawLedges(ctx, t, map, cam, width, height);
  drawRopes(ctx, map, cam);
  drawPortals(ctx, map, cam, time, nearPortalId);
}
