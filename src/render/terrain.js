// Terrain: the ground as thick, textured land that follows the map's terrain line (slopes,
// plateaus, and cliff walls), with a grassy (or mossy, sandy, frosted...) lip along the top, cliff
// faces where it drops away, and vines or roots hanging over the edges. Ledges are floating
// islands of the same land, thick in the middle and tapering underneath. Each map theme has its
// own material. Textures are small tiles baked once per theme and laid down as a pattern that
// scrolls with the world.

import { shade, mix, gfx } from './pixel.js';
import { surfacesOf } from '../world/physics.js';

const INK = '#3a2d4f';
const edge = (c) => mix(shade(c, -38), INK, 0.35);
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// What each theme's land is made of. `lip` is the top layer (grass, moss, curb, sand, cloud),
// `body` and `deep` the land below it, `stone` its texture's highlight, `style` which texture,
// `blades` grass blades along the lip, and `drip` what hangs over edges.
export const MATERIALS = {
  // (The map redraw: the meadow's soft warm earth instead of stamped cobble.)
  meadow: { lip: '#8ee08a', body: '#e4bb8c', deep: '#c99868', stone: '#f6dfbd', style: 'meadowsoil', blades: true, drip: 'vine' },
  // (The map redraw: the woods' own mossy earth, strata, roots and stones, under a thick moss lip.)
  forest: { lip: '#7fd38f', body: '#b58a64', deep: '#8a6044', stone: '#d8c0a0', style: 'mossloam', blades: true, drip: 'root', moss: true },
  // (The map redraw: the village street is laid in garden flagstones with moss in the joints.)
  town: { lip: '#ffffff', body: '#e8c8b4', deep: '#d6a890', stone: '#fbe6d8', style: 'flagstone', blades: false, drip: null, joint: '#a8d8a0' },
  harbor: { lip: '#e2bf96', body: '#a4a9cf', deep: '#7b80ad', stone: '#c3c8e6', style: 'brick', blades: false, drip: 'weed' },
  crag: { lip: '#ffe0ad', body: '#e2a66c', deep: '#b97a46', stone: '#f6cf9a', style: 'slab', blades: false, drip: null },
  grove: { lip: '#9fe0b0', body: '#8a76c4', deep: '#5e4c9e', stone: '#a897de', style: 'loam', blades: true, drip: 'vine', glow: '#bfe6ff' },
  ruins: { lip: '#d9f0c8', body: '#bfb0e6', deep: '#9182c8', stone: '#ddd3f8', style: 'brick', blades: true, drip: 'vine' },
  cave: { lip: '#a8e8ff', body: '#7563b6', deep: '#4f3f8e', stone: '#9482d6', style: 'rock', blades: false, drip: 'crystal', glow: '#a8e8ff' },
  hollow: { lip: '#a6dca2', body: '#b48a74', deep: '#8a6656', stone: '#cda48c', style: 'loam', blades: true, drip: 'root' },
  sky: { lip: '#ffffff', body: '#f6f8ff', deep: '#d6e0ff', stone: '#ffffff', style: 'cloud', blades: false, drip: null },
  // The far regions: a petal-strewn stone path, blue night rock, warm spring stone, packed snow.
  shrine: { lip: '#ffc6de', body: '#d8c4b6', deep: '#b49a8e', stone: '#efe2d8', style: 'slab', blades: true, drip: 'vine' },
  ridge: { lip: '#a8d8c8', body: '#7a80b8', deep: '#545a96', stone: '#9aa0d6', style: 'rock', blades: true, drip: 'root' },
  springs: { lip: '#9fe0c0', body: '#c4a6a0', deep: '#a08486', stone: '#e4cec6', style: 'slab', blades: true, drip: 'weed' },
  snow: { lip: '#ffffff', body: '#dfe8fa', deep: '#b6c4e8', stone: '#f4f8ff', style: 'slab', blades: false, drip: 'crystal', glow: '#e6f4ff' },
  // Map-specific materials (a map's `look.material`).
  // Starfall Heights: cloud tinted lavender by the night sky.
  starcloud: { lip: '#f2ecff', body: '#d8d0f6', deep: '#b0a4e0', stone: '#ffffff', style: 'cloud', blades: false, drip: null },
  farm: { lip: '#72d672', body: '#b5845a', deep: '#875c3a', stone: '#d6a878', style: 'farm', blades: true, drip: 'vine' },
  // Dawnlight Beach (the tutorial island): pale sand over warm sandstone.
  beach: { lip: '#fff0cc', body: '#f2d29c', deep: '#d9ad72', stone: '#fbe6bf', style: 'slab', blades: false, drip: 'weed' },
  // Moonlit Manor: violet brick and moonlit stone inside; clipped lawn over garden flagstones out.
  manor: { lip: '#e6d6ff', body: '#7a5aa8', deep: '#54407e', stone: '#a88ad8', style: 'brick', blades: false, drip: 'vine' },
  manorgarden: { lip: '#8ee08a', body: '#9a84c8', deep: '#6a5498', stone: '#c4b4e6', style: 'flagstone', blades: true, drip: 'vine', joint: '#8ee08a' },
  // The Sunken Aquarium Palace: pale sea sand over pink coral stone.
  reef: { lip: '#fff0d6', body: '#e8b8c8', deep: '#c08aa8', stone: '#ffd8e2', style: 'slab', blades: false, drip: 'weed' },
  // The Clockwork Carnival: painted boards over a sawdust-and-brick base.
  carnival: { lip: '#ff9ab8', body: '#c8906a', deep: '#a06a4a', stone: '#e8b88a', style: 'brick', blades: false, drip: null },
  // The Star Observatory: moonstone flags with brass inlay.
  starstone: { lip: '#fff3a6', body: '#8a8ac0', deep: '#5a5a90', stone: '#c4c4ec', style: 'flagstone', blades: false, drip: null, joint: '#ffd36b' },
  // The Candy Volcano: biscuit ground under a pink icing lip.
  candy: { lip: '#ff9ab8', body: '#e0a878', deep: '#b8805a', stone: '#f6d0a8', style: 'slab', blades: false, drip: 'vine' },
  // The Sky Whale's Back: the whale's own blue-grey hide in broad plates, a pale lip like its belly.
  whaleskin: { lip: '#eaf6ff', body: '#6a8ac0', deep: '#4a6a9a', stone: '#9ab8e0', style: 'slab', blades: false, drip: null },
  // The Dream Theatre: honey stage boards over a velvet-dark understage.
  stage: { lip: '#ffd36b', body: '#c88a5a', deep: '#8a5a3a', stone: '#e8b080', style: 'boards', blades: false, drip: null },
  throne: { lip: '#d9ccff', body: '#5d4ba6', deep: '#382c78', stone: '#9b88e0', style: 'brick', blades: false, drip: 'crystal', glow: '#c9b6ff' },
  // Interior floors (the interior rule: a room's floor is its own material, never grass or soil).
  // Polished parquet over a timber understage, for halls, kitchens and workshops.
  parquet: { lip: '#f0c48a', body: '#b07a5a', deep: '#7a4a3a', stone: '#d8a070', style: 'boards', blades: false, drip: null },
  // Sea-glass marble for the palace's inner halls.
  marble: { lip: '#f4f2ff', body: '#8ab0d4', deep: '#5a7eaa', stone: '#d6e6f6', style: 'slab', blades: false, drip: null },
  // The big top's ring: a sawdust floor over painted boards.
  sawdust: { lip: '#f6dcae', body: '#b8805a', deep: '#8a5a3a', stone: '#e0b07e', style: 'boards', blades: false, drip: null },
};

// One breeze for the whole scene: a steady push with gusts every several seconds. Grass, flowers,
// vines, drifting petals, and foreground leaves all lean with it, so weather reads as one thing.
// `windAt` lets a gust roll across the world from left to right; `windTravel` is how far the air
// has carried something (the wind's running total), for things that drift with it.
export const wind = (time) => 0.6 + 0.4 * Math.sin(time * 0.8) + 0.25 * Math.sin(time * 1.9 + 1.3);
export const windAt = (time, wx) => wind(time - wx / 320);
export const windTravel = (time) => 0.6 * time - 0.5 * Math.cos(time * 0.8) - 0.13 * Math.cos(time * 1.9 + 1.3);

const TILE = 64;
// Textures bake as a block of 3 x 2 tiles, each laid out on its own, so the land doesn't show a
// grid of one repeated square.
const TW = TILE * 3;
const TH = TILE * 2;
const AREA = (TW * TH) / (TILE * TILE);

// Drawing happens in screen space; anything that animates or varies along the land keys off the
// world position (screen x + camX) instead, so it doesn't change as the camera moves.
let camX = 0;

// ---------- Textures ----------

// Paints one tileable square of a material (shapes that cross an edge are drawn again on the
// other side so the tile wraps seamlessly).
function paintTile(g, m, theme) {
  g.fillStyle = m.body;
  g.fillRect(0, 0, TW, TH);
  const wrap = (draw) => {
    for (const dx of [-TW, 0, TW]) for (const dy of [-TH, 0, TH]) draw(dx, dy);
  };
  const seed = theme.length * 7.3;
  const line = edge(m.body);
  if (m.style === 'cobble') {
    // Rounded stones in staggered rows, each lit on top and shaded below.
    for (let row = 0; row < TH / 16; row++) {
      for (let col = 0; col < TW / 16; col++) {
        const k = seed + row * 16 + col;
        const w = 12 + hash(k) * 4;
        const h = 9 + hash(k + 1) * 3;
        const x = col * 16 + (row % 2) * 8 + hash(k + 2) * 2;
        const y = row * 16 + 3 + hash(k + 3) * 2;
        wrap((dx, dy) => {
          g.fillStyle = m.deep;
          rounded(g, x + dx, y + dy + 1.5, w, h, 4);
          g.fill();
          g.fillStyle = hash(k + 4) > 0.5 ? m.stone : mix(m.stone, m.body, 0.4);
          rounded(g, x + dx, y + dy, w, h, 4);
          g.fill();
          g.strokeStyle = line;
          g.lineWidth = 0.6;
          g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.45)';
          rounded(g, x + dx + 2, y + dy + 1.2, w * 0.5, 1.6, 0.8);
          g.fill();
        });
      }
    }
  } else if (m.style === 'flagstone') {
    // Garden flagstones (the map redraw): big flat stones of uneven sizes in staggered rows, each
    // its own tint, lit on its upper left edge, with moss and the odd tiny flower in the joints.
    g.fillStyle = mix(m.body, m.joint, 0.35);
    g.fillRect(0, 0, TW, TH);
    let y = 0;
    for (let row = 0; y < TH; row++) {
      const h = row % 2 ? 15 : 17;
      let x = (row * 13) % 24 - 24;
      for (let col = 0; x < TW; col++) {
        const k = seed + row * 31 + col * 7;
        const w = 20 + hash(k) * 18;
        const sx = x;
        const tint = hash(k + 1);
        // Each stone sits a little high or low and is its own height, so the rows wander.
        const sy = y + (hash(k + 6) - 0.5) * 2.4;
        const sh = h - hash(k + 7) * 3;
        wrap((dx, dy) => {
          g.fillStyle = mix(m.deep, INK, 0.12);
          rounded(g, sx + dx + 1.2, sy + dy + 1.6, w - 2, sh - 2, 6);
          g.fill();
          g.fillStyle = mix(m.stone, tint > 0.5 ? m.body : '#e6dcf0', 0.15 + tint * 0.35);
          rounded(g, sx + dx + 1, sy + dy + 1, w - 2.4, sh - 2.6, 6);
          g.fill();
          g.strokeStyle = edge(m.body);
          g.lineWidth = 0.6;
          g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.45)';
          rounded(g, sx + dx + 3, sy + dy + 2.2, (w - 6) * 0.6, 1.4, 0.7);
          g.fill();
          if (hash(k + 2) > 2) {
            // A hairline crack.
            g.strokeStyle = mix(m.deep, INK, 0.2);
            g.lineWidth = 0.5;
            g.beginPath();
            g.moveTo(sx + dx + w * 0.3, sy + dy + 3);
            g.lineTo(sx + dx + w * 0.45, sy + dy + h * 0.5);
            g.lineTo(sx + dx + w * 0.38, sy + dy + h - 3);
            g.stroke();
          }
        });
        // Moss tufts in the joint after this stone, and now and then a tiny flower.
        const jx = sx + w - 1;
        wrap((dx, dy) => {
          g.fillStyle = shade(m.joint, -6);
          g.beginPath();
          g.ellipse(jx + dx, sy + dy + h * (0.3 + hash(k + 3) * 0.4), 1.6, 2.4, 0, 0, Math.PI * 2);
          g.fill();
          if (hash(k + 4) > 0.8) {
            g.fillStyle = hash(k + 5) > 0.5 ? '#ffc6de' : '#fff3a6';
            g.beginPath();
            g.arc(jx + dx, sy + dy + h * 0.5, 1.2, 0, Math.PI * 2);
            g.fill();
          }
        });
        x += w;
      }
      y += h;
    }
  } else if (m.style === 'brick') {
    // Big stone blocks with soft corners, a few cracked or mossy, the odd one chipped at a corner
    // or sunk back into the wall (a dark gap), so the wall never reads as one stamped block.
    for (let row = 0; row < TH / 16; row++) {
      for (let col = 0; col < TW / 32; col++) {
        const k = seed + row * 16 + col;
        const x = col * 32 + (row % 2) * 16 + 1;
        const y = row * 16 + 1;
        const kind = hash(k + 6);
        wrap((dx, dy) => {
          g.fillStyle = m.deep;
          rounded(g, x + dx, y + dy + 1, 30, 14, 3);
          g.fill();
          if (kind > 0.93) {
            // A sunken block: a shadowed hollow lit only along its bottom lip.
            g.fillStyle = mix(m.deep, INK, 0.25);
            rounded(g, x + dx, y + dy, 30, 13, 3);
            g.fill();
            g.fillStyle = hexA(m.stone, 0.5);
            g.fillRect(x + dx + 3, y + dy + 10.5, 24, 1.2);
            return;
          }
          g.fillStyle = mix(m.stone, m.body, 0.25 + hash(k) * 0.4);
          rounded(g, x + dx, y + dy, 30, 13, 3);
          g.fill();
          g.strokeStyle = line;
          g.lineWidth = 0.6;
          g.stroke();
          g.fillStyle = 'rgba(255,255,255,0.35)';
          g.fillRect(x + dx + 3, y + dy + 1.5, 16, 1.2);
          if (hash(k + 5) > 0.7) {
            g.strokeStyle = m.deep;
            g.lineWidth = 0.8;
            g.beginPath();
            g.moveTo(x + dx + 18, y + dy + 2);
            g.lineTo(x + dx + 15, y + dy + 7);
            g.lineTo(x + dx + 19, y + dy + 11);
            g.stroke();
          }
          if (kind > 0.84) {
            // A chipped corner.
            const right = hash(k + 7) > 0.5;
            const cx = right ? x + dx + 30 : x + dx;
            const sx = right ? -1 : 1;
            g.fillStyle = m.deep;
            poly(g, [[cx, y + dy + 4], [cx, y + dy], [cx + sx * 6, y + dy]]);
            g.fill();
          } else if (kind > 0.72) {
            // Moss (or, in crystal halls, a sprinkle of crystal) along the top.
            g.fillStyle = m.glow ? hexA(m.glow, 0.85) : '#a6d9a0';
            const n = m.glow ? 2 : 4;
            for (let j = 0; j < n; j++) {
              g.beginPath();
              g.ellipse(x + dx + 6 + j * 6 + hash(k + j) * 3, y + dy + 1, m.glow ? 1.4 : 3.4, m.glow ? 1.4 : 2, 0, 0, Math.PI * 2);
              g.fill();
            }
          }
        });
      }
    }
  } else if (m.style === 'farm') {
    // Tilled farmland: rows of furrows, with pebbles and the odd buried carrot.
    for (let row = 0; row < TH / 8; row++) {
      const y0 = row * 8 + 5;
      g.strokeStyle = row % 2 ? m.deep : mix(m.deep, m.body, 0.4);
      g.lineWidth = 1.6;
      g.beginPath();
      for (let x = 0; x <= TW; x += 4) g.lineTo(x, y0 + Math.sin((x / TILE) * Math.PI * 4 + row) * 0.8);
      g.stroke();
    }
    for (let i = 0; i < 8 * AREA; i++) {
      const k = seed + i * 5.9;
      wrap((dx, dy) => {
        g.fillStyle = m.stone;
        g.beginPath();
        g.ellipse(hash(k) * TW + dx, hash(k + 1) * TH + dy, 2 + hash(k + 2), 1.3, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
    for (let i = 0; i < 2 * AREA; i++) {
      const k = seed + i * 17.3 + 50;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      wrap((dx, dy) => {
        g.fillStyle = '#ff9d4a';
        poly(g, [[x + dx - 2, y + dy], [x + dx + 2, y + dy], [x + dx, y + dy + 7]]);
        g.fill();
        g.fillStyle = '#6cc070';
        g.fillRect(x + dx - 1.5, y + dy - 3, 1, 3);
        g.fillRect(x + dx + 0.5, y + dy - 3.5, 1, 3.5);
      });
    }
  } else if (m.style === 'slab') {
    // Big sandstone slabs, stacked a little unevenly: lit tops, shaded bottoms, chips and cracks.
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 9; col++) {
        const k = seed + row * 16 + col;
        const w = 19 + hash(k) * 4;
        const h = 18 + hash(k + 1) * 3;
        const x = col * (TW / 9) + (row % 2) * (TW / 18) + hash(k + 2) * 2 - 1;
        const y = row * (TH / 6) + 1 + hash(k + 3) * 2;
        wrap((dx, dy) => {
          g.fillStyle = m.deep;
          rounded(g, x + dx, y + dy + 2, w, h, 5);
          g.fill();
          g.fillStyle = mix(m.stone, m.body, 0.2 + hash(k + 4) * 0.5);
          rounded(g, x + dx, y + dy, w, h, 5);
          g.fill();
          g.strokeStyle = line;
          g.lineWidth = 0.7;
          g.stroke();
          g.fillStyle = 'rgba(255,248,230,0.55)';
          rounded(g, x + dx + 3, y + dy + 1.5, w - 7, 2.2, 1.1);
          g.fill();
          g.fillStyle = hexA(m.deep, 0.5);
          rounded(g, x + dx + 2, y + dy + h - 4, w - 4, 2.4, 1.2);
          g.fill();
          if (hash(k + 5) > 0.55) {
            g.strokeStyle = m.deep;
            g.lineWidth = 0.8;
            g.beginPath();
            g.moveTo(x + dx + w * 0.6, y + dy + 3);
            g.lineTo(x + dx + w * 0.5, y + dy + h * 0.5);
            g.lineTo(x + dx + w * 0.62, y + dy + h - 3);
            g.stroke();
          }
        });
      }
    }
  } else if (m.style === 'boards') {
    // Long stage boards, staggered, with grain lines, nail heads and the odd tape mark.
    for (let row = 0; row < 8; row++) {
      let x = -hash(seed + row) * 30;
      while (x < TW) {
        const k = seed + row * 31 + Math.floor(x);
        const w = 34 + hash(k) * 26;
        const y = row * (TH / 8);
        const h = TH / 8 - 1;
        const x0 = x;
        wrap((dx, dy) => {
          g.fillStyle = mix(m.stone, m.body, 0.25 + hash(k + 1) * 0.5);
          g.fillRect(x0 + dx, y + dy, w - 1, h);
          g.fillStyle = 'rgba(255,240,210,0.4)';
          g.fillRect(x0 + dx + 1, y + dy + 1, w - 3, 1.4);
          g.fillStyle = hexA(m.deep, 0.55);
          g.fillRect(x0 + dx, y + dy + h - 1.4, w - 1, 1.4);
          g.strokeStyle = hexA(m.deep, 0.35);
          g.lineWidth = 0.6;
          g.beginPath();
          g.moveTo(x0 + dx + 3, y + dy + h * 0.5);
          g.quadraticCurveTo(x0 + dx + w * 0.5, y + dy + h * (0.3 + hash(k + 2) * 0.4), x0 + dx + w - 4, y + dy + h * 0.55);
          g.stroke();
          g.fillStyle = m.deep;
          g.fillRect(x0 + dx + 2, y + dy + h * 0.5 - 0.6, 1.2, 1.2);
          g.fillRect(x0 + dx + w - 4, y + dy + h * 0.5 - 0.6, 1.2, 1.2);
          if (hash(k + 3) > 0.9) {
            g.fillStyle = hash(k + 4) > 0.5 ? '#ff7aa8' : '#7fd8ff';
            g.fillRect(x0 + dx + w * 0.4, y + dy + 1, 5, h - 2);
          }
        });
        x += w;
      }
    }
  } else if (m.style === 'strata') {
    // Layered sandstone: wavy bands, cracks, and flecks of grit.
    for (let band = 0; band < TH / 16; band++) {
      const y0 = band * 16;
      g.fillStyle = band % 2 ? m.deep : mix(m.body, m.stone, 0.35);
      g.beginPath();
      g.moveTo(0, y0 + 10);
      for (let x = 0; x <= TW; x += 8) g.lineTo(x, y0 + 10 + Math.sin((x / TILE) * Math.PI * 2 + band) * 2);
      g.lineTo(TW, y0 + 16);
      g.lineTo(0, y0 + 16);
      g.closePath();
      g.globalAlpha = 0.55;
      g.fill();
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 14 * AREA; i++) {
      const k = seed + i * 3.1;
      wrap((dx, dy) => {
        g.fillStyle = hash(k) > 0.5 ? m.stone : m.deep;
        g.fillRect(hash(k + 1) * TW + dx, hash(k + 2) * TH + dy, 1.5, 1.5);
      });
    }
    for (let i = 0; i < 3 * AREA; i++) {
      const k = seed + i * 9.7;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      wrap((dx, dy) => {
        g.strokeStyle = m.deep;
        g.lineWidth = 0.9;
        g.beginPath();
        g.moveTo(x + dx, y + dy);
        g.lineTo(x + dx + 4, y + dy + 5);
        g.lineTo(x + dx + 2, y + dy + 10);
        g.stroke();
      });
    }
  } else if (m.style === 'rock') {
    // Faceted rock with a lit face on each chunk, and specks of crystal.
    for (let i = 0; i < 7 * AREA; i++) {
      const k = seed + i * 5.3;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      const r = 8 + hash(k + 2) * 6;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        poly(g, [[x + dx - r, y + dy], [x + dx - r * 0.3, y + dy - r * 0.8], [x + dx + r, y + dy - r * 0.4], [x + dx + r * 0.7, y + dy + r * 0.6], [x + dx - r * 0.5, y + dy + r * 0.7]]);
        g.fill();
        g.fillStyle = m.stone;
        poly(g, [[x + dx - r * 0.7, y + dy - 0.5], [x + dx - r * 0.25, y + dy - r * 0.6], [x + dx + r * 0.6, y + dy - r * 0.3], [x + dx, y + dy + 0.5]]);
        g.fill();
      });
    }
    for (let i = 0; i < 5 * AREA; i++) {
      const k = seed + i * 2.9 + 40;
      wrap((dx, dy) => {
        g.fillStyle = hash(k) > 0.5 ? '#bff0ff' : '#e6c8ff';
        poly(g, [[hash(k + 1) * TW + dx, hash(k + 2) * TH + dy], [hash(k + 1) * TW + dx + 1.5, hash(k + 2) * TH + dy - 4], [hash(k + 1) * TW + dx + 3, hash(k + 2) * TH + dy]]);
        g.fill();
      });
    }
  } else if (m.style === 'cloud') {
    // Soft cloud puffs, lighter on top.
    for (let i = 0; i < 9 * AREA; i++) {
      const k = seed + i * 3.7;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      const r = 7 + hash(k + 2) * 7;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        g.globalAlpha = 0.45;
        g.beginPath();
        g.arc(x + dx, y + dy + 2, r, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(x + dx, y + dy, r * 0.8, 0, Math.PI * 2);
        g.fill();
      });
    }
  } else if (m.style === 'mossloam' || m.style === 'meadowsoil') {
    // Mossy earth (the map redraw): soft bands of soil, winding roots with rootlets, a few big
    // rounded stones lit from the upper left, and small pebbles and specks between them.
    const per = (n) => (Math.PI * 2 * n) / TW;
    for (const [y0, amp, n, c, a] of [[22, 4, 2, m.deep, 0.32], [58, 5, 3, shade(m.body, 7), 0.5], [96, 4, 2, m.deep, 0.38]]) {
      g.fillStyle = c;
      g.globalAlpha = a;
      for (const dy of [-TH, 0, TH]) {
        g.beginPath();
        g.moveTo(0, y0 + dy);
        for (let x = 0; x <= TW; x += 4) g.lineTo(x, y0 + dy + Math.sin(x * per(n) + y0) * amp);
        for (let x = TW; x >= 0; x -= 4) g.lineTo(x, y0 + dy + 9 + Math.sin(x * per(n) + y0 + 1.3) * amp * 0.7);
        g.closePath();
        g.fill();
      }
      g.globalAlpha = 1;
    }
    // Roots: lighter strands winding across with a dark underside, and rootlets off them.
    const rootC = mix(m.stone, m.body, 0.45);
    for (let i = 0; i < 1; i++) {
      const k = seed + i * 9.7 + 40;
      const x = hash(k) * TW;
      const y = 10 + hash(k + 1) * (TH - 20);
      const len = 50 + hash(k + 2) * 50;
      wrap((dx, dy) => {
        const path = () => {
          g.beginPath();
          g.moveTo(x + dx, y + dy);
          g.bezierCurveTo(x + dx + len * 0.3, y + dy - 8, x + dx + len * 0.6, y + dy + 9, x + dx + len, y + dy + 2);
        };
        g.lineCap = 'round';
        g.strokeStyle = mix(m.deep, INK, 0.2);
        g.lineWidth = 3.4;
        g.save();
        g.translate(0, 1);
        path();
        g.stroke();
        g.restore();
        g.strokeStyle = rootC;
        g.lineWidth = 2.6;
        path();
        g.stroke();
        g.strokeStyle = shade(rootC, 10);
        g.lineWidth = 0.9;
        g.save();
        g.translate(-0.4, -0.7);
        path();
        g.stroke();
        g.restore();
        g.strokeStyle = rootC;
        g.lineWidth = 1;
        for (const u of [0.3, 0.7]) {
          const rx = x + dx + len * u;
          const ry = y + dy + (u < 0.5 ? -2 : 3);
          g.beginPath();
          g.moveTo(rx, ry);
          g.quadraticCurveTo(rx + 3, ry + 5, rx + 1, ry + 9);
          g.stroke();
        }
      });
    }
    // Big stones: rounded, lit top left, shadowed bottom right, outlined in their own dark.
    for (let i = 0; i < 0; i++) {
      const k = seed + i * 7.9 + 90;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      const rx = 3 + hash(k + 2) ** 2 * 8;
      const ry = rx * (0.6 + hash(k + 3) * 0.2);
      wrap((dx, dy) => {
        g.fillStyle = mix(m.deep, INK, 0.15);
        g.beginPath();
        g.ellipse(x + dx + 1, y + dy + 1.5, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = mix(mix(m.stone, m.body, 0.3), '#a8a0b8', 0.15 + hash(k + 6) * 0.15);
        g.beginPath();
        g.ellipse(x + dx, y + dy, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = edge(m.body);
        g.lineWidth = 0.6;
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.4)';
        g.beginPath();
        g.ellipse(x + dx - rx * 0.3, y + dy - ry * 0.35, rx * 0.45, ry * 0.3, -0.3, 0, Math.PI * 2);
        g.fill();
        if (hash(k + 5) > 0.5) {
          // A cap of moss on top.
          g.fillStyle = shade(m.lip, -10);
          g.beginPath();
          g.ellipse(x + dx + rx * 0.1, y + dy - ry * 0.75, rx * 0.65, ry * 0.32, 0, 0, Math.PI * 2);
          g.fill();
        }
      });
    }
    // Pebbles and specks.
    for (let i = 0; i < 5 * AREA; i++) {
      const k = seed + i * 5.3 + 130;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      const r = 0.8 + hash(k + 2) * 1.4;
      wrap((dx, dy) => {
        g.fillStyle = hash(k + 3) > 0.5 ? m.stone : mix(m.deep, INK, 0.1);
        g.beginPath();
        g.ellipse(x + dx, y + dy, r * 1.3, r, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
  } else {
    // Loam: soft dark clumps, pebbles, and thin roots.
    for (let i = 0; i < 10 * AREA; i++) {
      const k = seed + i * 4.1;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        g.globalAlpha = 0.5;
        g.beginPath();
        g.ellipse(x + dx, y + dy, 6 + hash(k + 2) * 6, 3 + hash(k + 3) * 2, 0, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      });
    }
    for (let i = 0; i < 9 * AREA; i++) {
      const k = seed + i * 6.7 + 20;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      const r = 1.6 + hash(k + 2) * 2;
      wrap((dx, dy) => {
        g.fillStyle = m.deep;
        g.beginPath();
        g.ellipse(x + dx, y + dy + 0.8, r * 1.3, r, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = m.stone;
        g.beginPath();
        g.ellipse(x + dx, y + dy, r * 1.3, r * 0.9, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
    for (let i = 0; i < 2 * AREA; i++) {
      const k = seed + i * 11.3 + 60;
      const x = hash(k) * TW;
      const y = hash(k + 1) * TH;
      wrap((dx, dy) => {
        g.strokeStyle = m.deep;
        g.lineWidth = 1.1;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x + dx, y + dy);
        g.bezierCurveTo(x + dx + 8, y + dy - 4, x + dx + 14, y + dy + 5, x + dx + 22, y + dy + 1);
        g.stroke();
      });
    }
    if (m.glow) {
      for (let i = 0; i < 3 * AREA; i++) {
        const k = seed + i * 13.1 + 80;
        wrap((dx, dy) => {
          g.fillStyle = m.glow;
          g.beginPath();
          g.arc(hash(k) * TW + dx, hash(k + 1) * TH + dy, 1.1, 0, Math.PI * 2);
          g.fill();
        });
      }
    }
  }
}

function rounded(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function poly(g, pts) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}

// A material's texture as a pattern, baked at the screen's pixel density so it stays sharp.
const patterns = new Map();
function patternFor(ctx, theme, m) {
  const res = Math.max(1, Math.round(gfx.scale || 1));
  const key = `${theme}|${res}`;
  let entry = patterns.get(key);
  if (!entry) {
    const c = document.createElement('canvas');
    c.width = TW * res;
    c.height = TH * res;
    const g = c.getContext('2d');
    g.scale(res, res);
    paintTile(g, m, theme);
    entry = { canvas: c, res };
    patterns.set(key, entry);
  }
  const p = ctx.createPattern(entry.canvas, 'repeat');
  return { p, res: entry.res };
}

// Fills the current path with the material, anchored to the world so it scrolls with it.
function fillLand(ctx, theme, m, cam) {
  const { p, res } = patternFor(ctx, theme, m);
  p.setTransform(new DOMMatrix().translate(-cam.x % TW, -cam.y % TH).scale(1 / res));
  ctx.fillStyle = p;
  ctx.fill();
}

// ---------- The ground ----------

// Screen-space runs of the ground: each piece's points, plus where the walls between them are.
function groundRuns(map, cam) {
  return surfacesOf(map).filter((s) => s.ground).map((s) => s.pts.map(([x, y]) => [x - cam.x, y - cam.y]));
}

export function drawTerrain(ctx, theme, map, cam, width, height, time) {
  theme = map.look?.material ?? theme;
  const m = MATERIALS[theme] ?? MATERIALS.meadow;
  const deco = map.look?.edges ?? null;
  camX = cam.x;
  const runs = groundRuns(map, cam);
  const bottom = height + 40;
  // The land itself: everything under the line.
  ctx.save();
  ctx.beginPath();
  runs.forEach((pts) => {
    ctx.moveTo(pts[0][0], bottom);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(pts[pts.length - 1][0], bottom);
  });
  ctx.closePath();
  fillLand(ctx, theme, m, cam);
  // The land darkens and cools with depth below its own surface: lightest just under the lip,
  // then deeper and inkier, so it reads as a solid mass instead of a flat slab. Laid in narrow
  // strips that each follow the surface above them, so slopes and plateaus shade alike.
  ctx.clip();
  const deepest = mix(m.deep, INK, 0.22);
  const STRIP = 16;
  const depthBand = (x, w, top) => {
    const g = ctx.createLinearGradient(0, top + 14, 0, top + 190);
    g.addColorStop(0, hexA(m.deep, 0));
    g.addColorStop(0.4, hexA(m.deep, 0.38));
    g.addColorStop(1, hexA(deepest, 0.82));
    ctx.fillStyle = g;
    ctx.fillRect(x, top - 40, w, bottom - top + 40);
  };
  for (const pts of runs) {
    for (let i = 1; i < pts.length; i++) {
      const x0 = Math.max(-STRIP, pts[i - 1][0]);
      const x1 = Math.min(width + STRIP, pts[i][0]);
      if (x1 <= x0) continue;
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const at = (x) => ay + ((by - ay) * (x - ax)) / (bx - ax || 1);
      // Flat stretches take one band; slopes take narrow strips that step down with them.
      if (Math.abs(by - ay) < 1) {
        if (ay < height) depthBand(x0, x1 - x0, ay);
        continue;
      }
      for (let sx = x0; sx < x1; sx += STRIP) {
        const w = Math.min(STRIP, x1 - sx);
        const top = at(sx + w / 2);
        if (top < height) depthBand(sx, w, top);
      }
    }
  }
  if (m.style === 'mossloam' || m.style === 'meadowsoil') earthDecals(ctx, m, runs, cam, width, height);
  ctx.restore();

  // Cliff faces: where the ground drops at a wall, the high side shows a shaded face.
  for (let i = 1; i < runs.length; i++) {
    const a = runs[i - 1][runs[i - 1].length - 1];
    const b = runs[i][0];
    if (a[0] < -20 || a[0] > width + 20) continue;
    const highLeft = a[1] < b[1];
    const yTop = Math.min(a[1], b[1]);
    const yBot = Math.max(a[1], b[1]);
    cliffFace(ctx, m, a[0], yTop, yBot, highLeft ? -1 : 1, time, i);
  }
  // The lip along the top of every run.
  // The lip casts a soft shadow onto the dirt just under it.
  for (const pts of runs) strokeAlong(ctx, pts, m.moss ? 15 : 12, hexA(INK, 0.16), 6);
  runs.forEach((pts, ri) => lip(ctx, m, pts, time, ri, width, m.moss ? 12 : 10, deco));
  if (map.look?.ceiling) drawCeiling(ctx, m, map, cam, width, time);
}

const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// Things set in the earth by where they are in the world, not by the texture's tile, so nothing
// repeats: big stones (some capped with moss), roots looping down from the surface, and buried
// pebbles, each in its own spot under the lip.
const pickC = (list, h) => list[Math.floor(h * list.length) % list.length];
function earthDecals(ctx, m, runs, cam, width, height) {
  const CELL = 70;
  const topAt = (sx) => {
    for (const pts of runs) {
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        if (sx >= ax && sx <= bx) return ay + ((by - ay) * (sx - ax)) / (bx - ax || 1);
      }
    }
    return null;
  };
  const rootC = mix(m.stone, m.body, 0.45);
  const first = Math.floor((cam.x - 40) / CELL);
  for (let c = first; c * CELL < cam.x + width + 40; c++) {
    const k = c * 3.17 + 0.5;
    const wx = c * CELL + hash(k) * CELL;
    const sx = wx - cam.x;
    const top = topAt(sx);
    if (top == null || top > height) continue;
    const kind = hash(k + 1);
    const y = top + 24 + hash(k + 2) * 90;
    if (kind < 0.42) {
      // A stone.
      const rx = 4 + hash(k + 3) ** 2 * 11;
      const ry = rx * (0.55 + hash(k + 4) * 0.25);
      ctx.fillStyle = mix(m.deep, INK, 0.2);
      ctx.beginPath();
      ctx.ellipse(sx + 1, y + 1.6, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mix(mix(m.stone, m.body, 0.3), '#a8a0b8', 0.12 + hash(k + 5) * 0.18);
      ctx.beginPath();
      ctx.ellipse(sx, y, rx, ry, (hash(k + 6) - 0.5) * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = edge(m.body);
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.beginPath();
      ctx.ellipse(sx - rx * 0.3, y - ry * 0.38, rx * 0.42, ry * 0.26, -0.3, 0, Math.PI * 2);
      ctx.fill();
      if (rx > 7 && hash(k + 7) > 0.4) {
        ctx.fillStyle = shade(m.lip, -12);
        ctx.beginPath();
        ctx.ellipse(sx + rx * 0.1, y - ry * 0.78, rx * 0.6, ry * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind < 0.62) {
      // A root looping down from the surface and back.
      const len = 30 + hash(k + 3) * 40;
      const dip = 5 + hash(k + 4) * 10;
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(sx, top + 10);
        ctx.bezierCurveTo(sx + len * 0.1, top + 10 + dip, sx + len * 0.8, top + 10 + dip * 1.1, sx + len, top + 18 + dip * 0.4);
      };
      ctx.lineCap = 'round';
      ctx.strokeStyle = mix(m.deep, INK, 0.25);
      ctx.lineWidth = 3.6;
      ctx.save();
      ctx.translate(0.6, 1.2);
      path();
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = rootC;
      ctx.lineWidth = 2.6;
      path();
      ctx.stroke();
      ctx.strokeStyle = shade(rootC, 10);
      ctx.lineWidth = 0.9;
      ctx.save();
      ctx.translate(-0.5, -0.7);
      path();
      ctx.stroke();
      ctx.restore();
    } else if (m.style === 'meadowsoil' && kind < 0.74) {
      // A flower bulb asleep in the earth, a shoot rising and roots trailing below.
      const by = top + 18 + hash(k + 3) * 20;
      ctx.strokeStyle = '#e8d6b8';
      ctx.lineWidth = 0.8;
      for (const dx of [-2, 0, 2]) {
        ctx.beginPath();
        ctx.moveTo(sx + dx * 0.5, by + 3);
        ctx.quadraticCurveTo(sx + dx * 1.5, by + 7, sx + dx * 1.2, by + 10);
        ctx.stroke();
      }
      ctx.strokeStyle = '#8fd08a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx, by - 3);
      ctx.lineTo(sx + 0.5, by - 9);
      ctx.stroke();
      ctx.fillStyle = '#f4e2c8';
      ctx.beginPath();
      ctx.moveTo(sx, by - 4.5);
      ctx.quadraticCurveTo(sx + 4.2, by - 1, sx + 2.6, by + 3);
      ctx.lineTo(sx - 2.6, by + 3);
      ctx.quadraticCurveTo(sx - 4.2, by - 1, sx, by - 4.5);
      ctx.fill();
      ctx.strokeStyle = edge(m.body);
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(sx - 1, by - 1.5, 0.9, 1.6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (m.style === 'meadowsoil' && kind < 0.78) {
      // A buried treasure: a little gem or an old coin catching a glint.
      const gem = hash(k + 3) > 0.5;
      ctx.fillStyle = gem ? pickC(['#ff9ec0', '#9fd8ff', '#c9a6ff'], hash(k + 4)) : '#ffd66b';
      ctx.strokeStyle = gem ? 'rgba(80,50,90,0.5)' : '#c8902a';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      if (gem) {
        ctx.moveTo(sx, y - 3);
        ctx.lineTo(sx + 2.6, y - 0.6);
        ctx.lineTo(sx, y + 3);
        ctx.lineTo(sx - 2.6, y - 0.6);
        ctx.closePath();
      } else ctx.ellipse(sx, y, 3, 2.4, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx - 0.8, y - 1, 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.style === 'meadowsoil' && kind < 0.86) {
      // Seeds scattered in the soil.
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#f0dcc0' : '#a87a58';
        ctx.beginPath();
        ctx.ellipse(sx + (hash(k + 30 + i) - 0.5) * 12, y + (hash(k + 40 + i) - 0.5) * 8, 1.4, 0.8, hash(k + 50 + i) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind < 0.8) {
      // A little nest of pebbles.
      for (let i = 0; i < 3; i++) {
        const r = 1.4 + hash(k + 10 + i) * 1.8;
        ctx.fillStyle = hash(k + 20 + i) > 0.5 ? m.stone : mix(m.stone, m.body, 0.5);
        ctx.beginPath();
        ctx.ellipse(sx + i * 4 - 4, y + (i % 2) * 2, r * 1.3, r, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// The top layer along a line of points: a thick band with a soft scalloped (or bladed) lower edge,
// a bright top, and an outline.
function lip(ctx, m, pts, time, seed, width, depth = 7, deco = null) {
  const line = edge(m.lip);
  const deep = shade(m.lip, -16);
  // The band.
  ctx.fillStyle = m.lip;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - 1) : ctx.moveTo(x, y - 1)));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + depth);
  ctx.closePath();
  ctx.fill();
  // The lower edge: scallops (or hanging grass) that follow the slope.
  forAlong(pts, 9, (x, y, k) => {
    if (x < -12 || x > width + 12) return;
    ctx.fillStyle = m.lip;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    if (m.moss) {
      // Moss hangs over the edge in soft tongues of every length.
      // Mostly short, now and then a long one; uneven widths, the odd gap.
      const h = hash(k * 1.9 + seed * 13);
      if (h < 0.22) return;
      const len = 1.5 + h * h * 9;
      const wd = 2.4 + hash(k * 2.3 + seed) * 3.2;
      const ox = (hash(k * 4.1 + seed) - 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(x + ox - wd, y + depth - 1.5);
      ctx.quadraticCurveTo(x + ox - wd * 0.8, y + depth + len, x + ox + 0.4, y + depth + len);
      ctx.quadraticCurveTo(x + ox + wd * 0.9, y + depth + len * 0.8, x + ox + wd, y + depth - 1.5);
      ctx.fill();
      if (len > 4) {
        ctx.stroke();
        ctx.fillStyle = shade(m.lip, -14);
        ctx.beginPath();
        ctx.ellipse(x + ox + 0.6, y + depth + len - 1.8, wd * 0.45, 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (m.blades && hash(k + seed * 31) > 0.55) {
      const len = 4 + hash(k + 7) * 4;
      ctx.beginPath();
      ctx.moveTo(x - 3, y + depth - 1);
      ctx.lineTo(x, y + depth + len);
      ctx.lineTo(x + 3, y + depth - 1);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y + depth - 1, 3.4 + hash(k * 1.3 + seed * 17) * 1.6, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  });
  // On moss: soft lumps of lighter moss along the top, so the lip isn't one smooth band.
  if (m.moss) {
    forAlong(pts, 13, (x, y, k) => {
      if (x < -10 || x > width + 10 || hash(k * 3.1 + seed) < 0.4) return;
      ctx.fillStyle = shade(m.lip, 9);
      ctx.beginPath();
      ctx.ellipse(x, y + 2.5, 4 + hash(k + 2) * 3, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // A darker underside line inside the band and a bright top.
  strokeAlong(ctx, pts, depth - 2.5, deep, 1.4);
  strokeAlong(ctx, pts, 0.6, shade(m.lip, 18), 1.6);
  strokeAlong(ctx, pts, -1.5, line, 1);
  // Grass blades standing up along the top.
  if (m.blades) {
    ctx.strokeStyle = shade(m.lip, -8);
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    forAlong(pts, 6, (x, y, k) => {
      if (x < -6 || x > width + 6 || hash(k * 1.7 + seed) < 0.5) return;
      const w = windAt(time, x + camX);
      const sway = Math.sin(time * 2 + (x + camX) * 0.05) * 0.5 * (0.5 + w) + w * 1.1;
      const h = 2.5 + hash(k + 3) * 3;
      ctx.beginPath();
      ctx.moveTo(x, y - 1);
      ctx.lineTo(x + sway - 1, y - 1 - h);
      ctx.moveTo(x + 1.5, y - 1);
      ctx.lineTo(x + 2 + sway, y - 1 - h * 0.7);
      ctx.stroke();
    });
    ctx.lineCap = 'butt';
  }
  if (deco) edgeDeco(ctx, deco, pts, time, seed, width);
}

// Little things dotted along the top of the land: flowers, clovers, or glowing mushrooms.
const BLOOMS = ['#ff9ec0', '#ffe36b', '#ffffff', '#c9a6ff', '#ffb38a'];
function edgeDeco(ctx, kind, pts, time, seed, width) {
  forAlong(pts, 11, (x, y, k) => {
    const h = hash(k * 2.3 + seed * 7);
    if (x < -6 || x > width + 6 || h < 0.45) return;
    const w = windAt(time, x + camX);
    const sway = Math.sin(time * 2 + (x + camX) * 0.07) * 0.45 * (0.5 + w) + w * 0.9;
    if (kind === 'flowers') {
      const stem = 3 + h * 4;
      ctx.strokeStyle = '#5fb878';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + sway, y - stem);
      ctx.stroke();
      ctx.fillStyle = BLOOMS[Math.floor(hash(k + seed) * BLOOMS.length)];
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.arc(x + sway + Math.cos(j * 1.57) * 1.3, y - stem + Math.sin(j * 1.57) * 1.3, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(x + sway - 0.5, y - stem - 0.5, 1, 1);
    } else if (kind === 'clover') {
      const lucky = h > 0.93;
      ctx.fillStyle = lucky ? '#3fbf5f' : '#58c866';
      for (let j = 0; j < (lucky ? 4 : 3); j++) {
        const a = (j / (lucky ? 4 : 3)) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 1.4 + sway * 0.4, y - 3 + Math.sin(a) * 1.4, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (lucky) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 4 + x + camX);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y - 6, 1, 1);
        ctx.globalAlpha = 1;
      }
    } else if (kind === 'glowcaps') {
      if (h < 0.75) return;
      const c = BLOOMS[Math.floor(hash(k) * 3) + 1];
      // Each cap glows on its own beat, keyed to where it is in the world (not on screen, or the
      // glow strobes as the camera scrolls).
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 2 + x + camX);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f6efff';
      ctx.fillRect(x - 0.6, y - 3, 1.2, 3);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y - 3.5, 2.4, 1.6, 0, Math.PI, 0);
      ctx.fill();
    }
  });
}

// A cave's rock ceiling across the top of the map: a jagged underside and stalactites (some
// tipped with glowing crystal), so it feels underground.
// The manor's ceiling: a painted plaster band with a gilded moulding, drapery swags between the
// beams, and little lamps hanging on chains, swaying from their own place in the room.
function drawManorCeiling(ctx, m, map, cam, width, time) {
  const base = 16 - Math.min(10, Math.max(0, (map.height - 360 - cam.y) * 0.03));
  // A room can tint it (`look.ceilingTint`: band, trim, swag, lamp).
  const tint = map.look.ceilingTint ?? {};
  const gold = tint.trim ?? '#ffd36b';
  const swag = tint.swag ?? '#b05a8a';
  const lamp = tint.lamp ?? '#ffe2a0';
  ctx.save();
  ctx.fillStyle = tint.band ?? m.deep;
  ctx.fillRect(-2, -2, width + 4, base + 2);
  ctx.fillStyle = gold;
  ctx.fillRect(-2, base, width + 4, 2);
  ctx.fillStyle = m.stone;
  ctx.fillRect(-2, base - 3, width + 4, 1);
  const step = 120;
  for (let i = Math.floor(cam.x / step) - 1; i * step - cam.x < width + step; i++) {
    const x = i * step - cam.x;
    // A beam end, then a swag of curtain hanging between this beam and the next.
    ctx.fillStyle = shade(tint.band ?? m.deep, -8);
    ctx.fillRect(x - 5, base, 10, 8);
    ctx.fillStyle = gold;
    ctx.fillRect(x - 5, base + 7, 10, 1.5);
    const sway = Math.sin(time * 0.8 + i) * 1.5;
    ctx.fillStyle = swag;
    ctx.beginPath();
    ctx.moveTo(x + 6, base + 2);
    ctx.quadraticCurveTo(x + step / 2, base + 26 + sway, x + step - 6, base + 2);
    ctx.quadraticCurveTo(x + step / 2, base + 14 + sway, x + 6, base + 2);
    ctx.fill();
    ctx.fillStyle = mix(swag, '#ffffff', 0.3);
    ctx.fillRect(x + step / 2 - 14, base + 17 + sway, 28, 1.5);
    // A lamp on a chain every other beam.
    if (i % 2 === 0) {
      const lx = x + Math.sin(time * 1.1 + i * 0.7) * 1.2;
      ctx.fillStyle = '#c8902a';
      ctx.fillRect(lx - 0.5, base + 8, 1, 14);
      ctx.fillStyle = lamp;
      ctx.beginPath();
      ctx.ellipse(lx, base + 26, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lx - 1, base + 23, 1.5, 4);
    }
  }
  ctx.restore();
}

// The big top's ceiling: striped canvas sloping up out of view, its scalloped valance edge
// stirring a little, a rope of pennants, and spotlights hung on the king pole's rigging.
function drawTentCeiling(ctx, m, map, cam, width, time) {
  const base = 20 - Math.min(10, Math.max(0, (map.height - 360 - cam.y) * 0.03));
  const tint = map.look.ceilingTint ?? {};
  const a = tint.band ?? '#e0405a';
  const b = tint.trim ?? '#fff4e8';
  ctx.save();
  const stripe = 22;
  for (let i = Math.floor(cam.x * 0.9 / stripe) - 1; i * stripe - cam.x * 0.9 < width + stripe; i++) {
    const x = i * stripe - cam.x * 0.9;
    ctx.fillStyle = i % 2 ? a : b;
    ctx.beginPath();
    ctx.moveTo(x - 6, -4);
    ctx.lineTo(x + stripe - 6, -4);
    ctx.lineTo(x + stripe, base);
    ctx.lineTo(x, base);
    ctx.closePath();
    ctx.fill();
  }
  // The scalloped valance.
  for (let i = Math.floor(cam.x / 16) - 1; i * 16 - cam.x < width + 16; i++) {
    const x = i * 16 - cam.x;
    const s = Math.sin(time * 1.2 + i * 0.7) * 0.8;
    ctx.fillStyle = i % 2 ? a : b;
    ctx.beginPath();
    ctx.ellipse(x + 8, base + 1 + s, 8, 5, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = tint.fringe ?? '#ffd36b';
    ctx.beginPath();
    ctx.arc(x + 8, base + 6 + s, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = shade(a, -30);
  ctx.fillRect(-2, base - 1, width + 4, 1.4);
  // A rope of pennants sagging between rigging points.
  const step = 160;
  for (let i = Math.floor(cam.x / step) - 1; i * step - cam.x < width + step; i++) {
    const x0 = i * step - cam.x;
    ctx.strokeStyle = '#8a6a5a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x0, base + 6);
    ctx.quadraticCurveTo(x0 + step / 2, base + 28, x0 + step, base + 6);
    ctx.stroke();
    for (let k = 1; k < 8; k++) {
      const u = k / 8;
      const px = x0 + u * step;
      const py = base + 6 + 4 * u * (1 - u) * 22;
      ctx.fillStyle = ['#ffd36b', '#7fd8ff', '#ff9ab8', '#9fe0a8'][(i + k) % 4];
      ctx.beginPath();
      ctx.moveTo(px - 3, py);
      ctx.lineTo(px + 3, py);
      ctx.lineTo(px, py + 6 + Math.sin(time * 2 + k) * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

// Timber beams across the top of the room (kitchens, workshops, forges, backstage): a dark ceiling
// band, beam ends every so often, and lamps hanging on long cords, swaying from their own place.
function drawBeamCeiling(ctx, m, map, cam, width, time) {
  const base = 14 - Math.min(8, Math.max(0, (map.height - 360 - cam.y) * 0.03));
  const tint = map.look.ceilingTint ?? {};
  const wood = tint.band ?? '#8a5a44';
  const lamp = tint.lamp ?? '#ffe2a0';
  ctx.save();
  ctx.fillStyle = shade(wood, -22);
  ctx.fillRect(-2, -2, width + 4, base + 2);
  ctx.fillStyle = wood;
  ctx.fillRect(-2, base - 4, width + 4, 6);
  ctx.fillStyle = shade(wood, 16);
  ctx.fillRect(-2, base - 4, width + 4, 1.2);
  const step = 96;
  for (let i = Math.floor(cam.x / step) - 1; i * step - cam.x < width + step; i++) {
    const x = i * step - cam.x;
    ctx.fillStyle = wood;
    ctx.fillRect(x - 6, base, 12, 10);
    ctx.fillStyle = shade(wood, -16);
    ctx.fillRect(x + 3, base, 3, 10);
    ctx.fillStyle = shade(wood, 22);
    ctx.beginPath();
    ctx.ellipse(x, base + 10, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (hash(i * 3.1) > 0.45) {
      const len = 26 + hash(i * 5.3) * 30;
      const sw = Math.sin(time * 1.1 + i) * 1.5;
      const lx = x + step / 2 + sw;
      ctx.strokeStyle = '#4a3a4a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + step / 2, base);
      ctx.lineTo(lx, base + len);
      ctx.stroke();
      ctx.fillStyle = shade(wood, -10);
      ctx.beginPath();
      ctx.moveTo(lx - 6, base + len + 4);
      ctx.lineTo(lx, base + len - 1);
      ctx.lineTo(lx + 6, base + len + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = lamp;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(lx, base + len + 7, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(lx, base + len + 6, 3, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The theatre's ceiling: a deep red velvet valance in pleats with a gold fringe and tasselled
// tie-backs, and a gilded proscenium moulding above it.
function drawCurtainCeiling(ctx, m, map, cam, width, time) {
  const base = 18 - Math.min(8, Math.max(0, (map.height - 360 - cam.y) * 0.03));
  const tint = map.look.ceilingTint ?? {};
  const red = tint.band ?? '#c0304a';
  const gold = tint.trim ?? '#ffd36b';
  ctx.save();
  ctx.fillStyle = shade(red, -40);
  ctx.fillRect(-2, -2, width + 4, base);
  ctx.fillStyle = gold;
  ctx.fillRect(-2, base - 6, width + 4, 3);
  ctx.fillStyle = shade(gold, -30);
  for (let i = Math.floor(cam.x / 10) - 1; i * 10 - cam.x < width + 10; i++) ctx.fillRect(i * 10 - cam.x, base - 5, 4, 1.4);
  const pleat = 12;
  for (let i = Math.floor(cam.x / pleat) - 1; i * pleat - cam.x < width + pleat; i++) {
    const x = i * pleat - cam.x;
    const drop = 12 + Math.sin(i * 0.9) * 2 + Math.sin(time * 0.9 + i * 0.5) * 0.6;
    const g = ctx.createLinearGradient(x, 0, x + pleat, 0);
    g.addColorStop(0, shade(red, -18));
    g.addColorStop(0.45, shade(red, 14));
    g.addColorStop(1, shade(red, -22));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, base - 3);
    ctx.lineTo(x + pleat, base - 3);
    ctx.lineTo(x + pleat, base + drop);
    ctx.quadraticCurveTo(x + pleat / 2, base + drop + 4, x, base + drop);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = gold;
    ctx.fillRect(x, base + drop + 1, pleat, 1.6);
    ctx.fillStyle = shade(gold, -20);
    for (let k = 1; k < pleat; k += 3) ctx.fillRect(x + k, base + drop + 2.6, 1, 2.4);
  }
  // Tasselled tie-backs.
  for (let i = Math.floor(cam.x / 140) - 1; i * 140 - cam.x < width + 140; i++) {
    const x = i * 140 - cam.x + 40;
    const sw = Math.sin(time * 1.3 + i) * 1;
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, base + 14);
    ctx.lineTo(x + sw, base + 26);
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(x + sw, base + 26, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + sw - 2, base + 27, 4, 5);
  }
  ctx.restore();
}

function drawCeiling(ctx, m, map, cam, width, time) {
  if (map.look.ceiling === 'manor') return drawManorCeiling(ctx, m, map, cam, width, time);
  if (map.look.ceiling === 'tent') return drawTentCeiling(ctx, m, map, cam, width, time);
  if (map.look.ceiling === 'beams') return drawBeamCeiling(ctx, m, map, cam, width, time);
  if (map.look.ceiling === 'curtain') return drawCurtainCeiling(ctx, m, map, cam, width, time);
  // It hangs at the top of the view (the cave's roof is always just overhead), rising a little
  // as you climb.
  const base = 12 - Math.min(10, Math.max(0, (map.height - 360 - cam.y) * 0.03));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  const step = 18;
  const first = Math.floor(cam.x / step) - 1;
  for (let i = first; i * step - cam.x < width + step; i++) {
    const x = i * step - cam.x;
    ctx.lineTo(x, base + hash(i * 1.3) * 14);
  }
  ctx.lineTo(width + 10, -10);
  ctx.closePath();
  fillLand(ctx, map.look.material ?? map.theme, m, cam);
  ctx.fillStyle = hexA(m.deep, 0.55);
  ctx.fill();
  ctx.strokeStyle = edge(m.body);
  ctx.lineWidth = 1;
  ctx.stroke();
  // Stalactites.
  const sstep = 54;
  for (let i = Math.floor(cam.x / sstep) - 1; i * sstep - cam.x < width + sstep; i++) {
    const k = hash(i * 7.7 + 3);
    if (k < 0.35) continue;
    const x = i * sstep - cam.x + k * 20;
    const top = base + hash(i * 1.1) * 8;
    const len = 18 + k * 46;
    const w = 7 + k * 8;
    ctx.fillStyle = shade(m.body, -10);
    ctx.strokeStyle = edge(m.body);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, top);
    ctx.quadraticCurveTo(x - w * 0.2, top + len * 0.6, x, top + len);
    ctx.quadraticCurveTo(x + w * 0.2, top + len * 0.6, x + w / 2, top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x - w * 0.25, top + 2, 1.5, len * 0.5);
    if (k > 0.7) {
      const c = k > 0.85 ? '#e6c8ff' : '#bff0ff';
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(time * 2 + i);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, top + len - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, top + len - 7);
      ctx.lineTo(x, top + len + 3);
      ctx.lineTo(x + 2.5, top + len - 7);
      ctx.fill();
    }
    // A drip falls now and then.
    const u = (time * 0.4 + k * 5) % 1;
    if (k > 0.55 && u < 0.6) {
      ctx.fillStyle = 'rgba(191,240,255,0.8)';
      ctx.fillRect(x - 0.6, top + len + u * 160, 1.2, 2.5);
    }
  }
  ctx.restore();
}

// Calls fn(x, y, k) every `step` pixels along a line of points.
function forAlong(pts, step, fn) {
  let k = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.floor(len / step));
    for (let j = 0; j < n; j++) {
      const u = (j + 0.5) / n;
      fn(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, k++);
    }
  }
}

function strokeAlong(ctx, pts, dy, color, w) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy)));
  ctx.stroke();
}

// The exposed face of a cliff at x, from its top down to the lower ground, on the `side` (-1
// left, 1 right) that drops away: shaded rock, a rounded lip over the corner, and vines.
function cliffFace(ctx, m, x, yTop, yBot, side, time, seed) {
  const line = edge(m.body);
  const face = shade(m.body, -14);
  const w = 8;
  const fx = side < 0 ? x - w : x;
  // The face strip, darker at the bottom.
  const g = ctx.createLinearGradient(0, yTop, 0, yBot);
  g.addColorStop(0, face);
  g.addColorStop(1, m.deep);
  ctx.fillStyle = g;
  ctx.fillRect(fx, yTop + 4, w, yBot - yTop - 4);
  // Vertical cracks.
  ctx.strokeStyle = shade(m.deep, -8);
  ctx.lineWidth = 1;
  for (let y = yTop + 12; y < yBot - 6; y += 14) {
    const k = hash(seed * 7 + (y - yTop));
    if (k < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(fx + 2 + k * 4, y);
    ctx.lineTo(fx + 3 + k * 3, y + 6);
    ctx.stroke();
  }
  // The outline down the open side.
  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(x + 0.5 * side, yTop + 3);
  ctx.lineTo(x + 0.5 * side, yBot);
  ctx.stroke();
  // Things hanging down the face, never past its foot, then the lip curling over the corner.
  drip(ctx, m, x + side * 2.5, yTop + 6, Math.min(46, yBot - yTop - 16), time, seed);
  ctx.fillStyle = m.lip;
  ctx.strokeStyle = edge(m.lip);
  ctx.beginPath();
  ctx.ellipse(x + side * 1, yTop + 3, 5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Vines, roots, seaweed, or crystals hanging from an edge at (x, y). Each starts a few pixels
// above y, so whatever it hangs from (drawn over it) hides where it's rooted.
function drip(ctx, m, x, y, maxLen, time, seed) {
  if (!m.drip || maxLen < 6) return;
  const k = hash(seed * 3.3 + (x + camX) * 0.01);
  const len = Math.max(6, maxLen * (0.5 + k * 0.5));
  const sway = Math.sin(time * 1.4 + seed + (x + camX) * 0.02) * 1.2 + windAt(time, x + camX) * 1.2;
  const top = y - 5;
  // A point along the hanging curve, u from 0 (root) to 1 (tip).
  const at = (u) => {
    const cx = x + sway * 0.6;
    const cy = top + (len + 5) * 0.6;
    const ex = x + sway * 1.6;
    const ey = y + len;
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    return [a * x + b * cx + c * ex, a * top + b * cy + c * ey];
  };
  const curve = (w0, w1, color) => {
    // Drawn in short pieces so it can taper.
    for (let i = 0; i < 6; i++) {
      const [x0, y0] = at(i / 6);
      const [x1, y1] = at((i + 1) / 6);
      ctx.strokeStyle = color;
      ctx.lineWidth = w0 + ((w1 - w0) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  };
  ctx.save();
  ctx.lineCap = 'round';
  if (m.drip === 'crystal') {
    const h = Math.min(len, 10 + k * 8);
    ctx.fillStyle = k > 0.5 ? '#bff0ff' : '#e6c8ff';
    ctx.strokeStyle = edge('#a8e8ff');
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 3.5, top);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + 3.5, top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x - 1.2, y, 1, h * 0.5);
  } else if (m.drip === 'root') {
    // A root that tapers to a curled tip, with a little side rootlet.
    const dark = shade(m.deep, -14);
    curve(3.2, 1.2, dark);
    curve(1.6, 0.4, shade(m.deep, 10));
    const [tx, ty] = at(1);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(tx + 2, ty, 2, Math.PI, Math.PI * 0.2, true);
    ctx.stroke();
    const [rx, ry] = at(0.5);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.quadraticCurveTo(rx + 4, ry + 2, rx + 5, ry + 6);
    ctx.stroke();
  } else if (m.drip === 'weed') {
    curve(2, 1.2, '#4f9a7a');
    ctx.fillStyle = '#6fc79a';
    for (const u of [0.45, 0.8]) {
      const [lx, ly] = at(u);
      ctx.beginPath();
      ctx.ellipse(lx + 1.5, ly, 2.2, 1, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // A vine: a green stem with leaves along it and, now and then, a flower at the tip.
    curve(2, 1.4, '#4f9a62');
    const leaf = mix(m.lip, '#8fdc9a', 0.6);
    for (const [i, u] of [0.3, 0.55, 0.8].entries()) {
      if (u * len < 4) continue;
      const [lx, ly] = at(u);
      const s = i % 2 ? -1 : 1;
      ctx.fillStyle = leaf;
      ctx.strokeStyle = '#4f9a62';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(lx + s * 2.6, ly, 2.8, 1.5, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (k > 0.7) {
      const [fx, fy] = at(1);
      ctx.fillStyle = '#ff9ec0';
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.arc(fx + Math.cos(j * 1.57) * 1.6, fy + 1.5 + Math.sin(j * 1.57) * 1.6, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe36b';
      ctx.beginPath();
      ctx.arc(fx, fy + 1.5, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- Floating islands (the ledges) ----------

// A ledge drawn as a chunk of floating land: flat top, thick in the middle, tapering to a
// rounded point underneath, with the lip on top and things dangling below.
export function drawIsland(ctx, theme, p, cam, time, pi, look = null, map = null) {
  theme = look?.material ?? theme;
  const m = MATERIALS[theme] ?? MATERIALS.meadow;
  camX = cam.x;
  const x = p.x - cam.x;
  const y = p.y - cam.y;
  const w = p.w;
  const style = p.style ?? look?.islands ?? 'earth';
  if (style === 'gallery' || style === 'catwalk') {
    // Hangers first (behind the ledge): up to the underside of the ledge above, or the ceiling.
    const hangs = [x + Math.min(18, w * 0.2), x + w - Math.min(18, w * 0.2)];
    for (const hx of hangs) {
      const top = hangTop(map, p, hx + cam.x) - cam.y;
      hanger(ctx, style, hx, top, y + 2, look?.trim ?? '#ffd36b', time, pi);
    }
    if (style === 'gallery') drawGallery(ctx, m, x, y, w, look?.trim ?? '#ffd36b', pi);
    else drawCatwalk(ctx, m, x, y, w, look?.metal ?? '#8a7aa8', pi);
    return;
  }
  if (style !== 'earth') {
    if (style === 'planks') drawPlanks(ctx, m, x, y, w, time, pi, look?.edges);
    else if (style === 'branch') drawBranch(ctx, m, x, y, w, time, pi, look?.edges);
    else if (style === 'bridge') drawBridge(ctx, x, y, w, time, pi);
    else if (style === 'leaf') drawLeafPad(ctx, x, y, w, time, pi);
    else if (style === 'stone') drawStone(ctx, theme, m, x, y, w, p.thick ?? 26, cam, time, pi, look?.edges);
    return;
  }
  const d = p.thick ?? Math.min(48, 22 + w * 0.1);
  // Things hanging under the island, rooted in its underside (drawn first, so the island
  // covers where they're rooted).
  const under = islandShape(x, y, w, d, pi);
  for (let dx = 14; dx < w - 12; dx += 22) {
    const k = hash(pi * 13.1 + dx);
    if (k < 0.45) continue;
    drip(ctx, m, x + dx, undersideAt(under, x + dx) - 1, 18, time, pi * 5 + dx);
  }
  ctx.save();
  island(ctx, x, y, w, d, pi);
  fillLand(ctx, theme, m, cam);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y + 4, 0, y + d);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, hexA(m.deep, m.style === 'cloud' ? 0.4 : 0.85));
  ctx.fillStyle = g;
  ctx.fillRect(x - 2, y, w + 4, d + 4);
  ctx.restore();
  island(ctx, x, y, w, d, pi);
  ctx.strokeStyle = edge(m.body);
  ctx.lineWidth = 1;
  ctx.stroke();
  lip(ctx, m, [[x + 2, y], [x + w - 2, y]], time, pi + 50, Infinity, 6, look?.edges);
  // Rounded caps at both ends of the lip.
  ctx.fillStyle = m.lip;
  ctx.strokeStyle = edge(m.lip);
  for (const ex of [x + 3, x + w - 3]) {
    ctx.beginPath();
    ctx.ellipse(ex, y + 2.5, 4, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

// The island's outline: a flat top, then the underside curving from the right end down to a
// rounded point and back up, as points (so things can hang from exactly its underside).

const WOOD = '#d9a86c';

// A wooden deck, Ellinia style: planks on a log beam with round sawn ends, braces underneath,
// and vines trailing down.
// A giant leaf to ride (Rootwood Hollow's canopy): broad and green with a pale midrib and veins,
// its tip curling up, rocking gently as it drifts. Its flat top is the ledge.
function drawLeafPad(ctx, x, y, w, time, seed) {
  const rock = Math.sin(time * 1.3 + seed) * 0.025;
  const cx = x + w / 2;
  ctx.save();
  ctx.translate(cx, y + 2);
  ctx.rotate(rock);
  const h = 13;
  const half = w / 2 + 10;
  const outline = (grow) => {
    ctx.beginPath();
    ctx.moveTo(-half - grow, -1);
    ctx.bezierCurveTo(-half * 0.6, -4 - grow, half * 0.5, -4 - grow, half + 6 + grow, -9 - grow);
    ctx.bezierCurveTo(half * 0.6, h + grow, -half * 0.5, h + grow, -half - grow, -1);
    ctx.closePath();
  };
  ctx.fillStyle = '#3f8a5c';
  outline(1.2);
  ctx.fill();
  const g = ctx.createLinearGradient(0, -4, 0, h);
  g.addColorStop(0, '#9fe08a');
  g.addColorStop(0.5, '#6cc47a');
  g.addColorStop(1, '#4fa46a');
  ctx.fillStyle = g;
  outline(0);
  ctx.fill();
  // The midrib and veins.
  ctx.strokeStyle = 'rgba(236,255,214,0.85)';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-half + 2, 0);
  ctx.quadraticCurveTo(0, 2, half + 2, -6);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  for (let k = -3; k <= 3; k++) {
    const vx = (k / 3.6) * half;
    ctx.beginPath();
    ctx.moveTo(vx, 1.4 - k * 0.6);
    ctx.lineTo(vx + 7, 6.4 - k * 0.6);
    ctx.stroke();
  }
  // The stem trailing behind.
  ctx.strokeStyle = '#5e8a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-half, -1);
  ctx.quadraticCurveTo(-half - 8, -2, -half - 12, -8);
  ctx.stroke();
  ctx.restore();
}

function drawPlanks(ctx, m, x, y, w, time, seed, deco) {
  const line = edge(WOOD);
  const vine = { ...m, drip: m.drip === 'crystal' ? 'crystal' : 'vine' };
  for (let dx = 18; dx < w - 14; dx += 26) {
    if (hash(seed * 9.1 + dx) < 0.4) continue;
    drip(ctx, vine, x + dx, y + 15, 22, time, seed * 3 + dx);
  }
  // Braces from the beam down to a post.
  ctx.strokeStyle = shade(WOOD, -22);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const bx of [x + w * 0.25, x + w * 0.75]) {
    ctx.beginPath();
    ctx.moveTo(bx - 14, y + 12);
    ctx.lineTo(bx, y + 26);
    ctx.lineTo(bx + 14, y + 12);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // The log beam, with ring-marked ends.
  ctx.fillStyle = shade(WOOD, -14);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.fillRect(x + 2, y + 7, w - 4, 8);
  ctx.strokeRect(x + 2.5, y + 7.5, w - 5, 7);
  for (const ex of [x + 1, x + w - 1]) {
    ctx.fillStyle = '#f0cf9a';
    ctx.beginPath();
    ctx.ellipse(ex, y + 11, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = shade(WOOD, -10);
    ctx.beginPath();
    ctx.ellipse(ex, y + 11, 2, 2.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = line;
  }
  // The planks.
  for (let px = x; px < x + w - 0.5; px += 10) {
    const pw = Math.min(10, x + w - px);
    ctx.fillStyle = hash(seed * 3.7 + (px - x) * 0.13) > 0.5 ? WOOD : shade(WOOD, -6);
    ctx.fillRect(px, y - 1, pw, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(px + 1, y, pw - 2, 1.2);
    ctx.fillStyle = shade(WOOD, -24);
    ctx.fillRect(px + 2, y + 3, 1, 1);
  }
  ctx.strokeStyle = line;
  ctx.strokeRect(x + 0.5, y - 0.5, w - 1, 8);
  for (let px = x + 10; px < x + w - 2; px += 10) {
    ctx.beginPath();
    ctx.moveTo(px + 0.5, y);
    ctx.lineTo(px + 0.5, y + 7);
    ctx.stroke();
  }
  // Moss creeping over the edge here and there.
  ctx.fillStyle = mix(m.lip, '#8fdc9a', 0.5);
  for (let dx = 6; dx < w - 6; dx += 16) {
    if (hash(seed * 5.3 + dx) < 0.6) continue;
    ctx.beginPath();
    ctx.ellipse(x + dx, y - 0.5, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (deco) edgeDeco(ctx, deco, [[x + 3, y - 1], [x + w - 3, y - 1]], time, seed, Infinity);
}

// A great mossy branch (the map redraw, the woods' platforms): a bark log under a cap of moss
// that hangs over its edges, a sawn ring at one end and a leafy twig at the other that sways in
// the wind, little twigs with leaves and vines hanging beneath, and knots and bark along it.
const BARK = '#9a7356';
function drawBranch(ctx, m, x, y, w, time, seed, deco) {
  const line = edge(BARK);
  const sway = Math.sin(time * 1.1 + seed * 2.7) * 1.6 + windAt(time, x + camX) * 0.8;
  // Hanging below: vines and little leafy twigs.
  for (let dx = 16; dx < w - 12; dx += 24) {
    if (hash(seed * 9.1 + dx) < 0.35) continue;
    drip(ctx, { ...m, drip: 'vine' }, x + dx, y + 15, 22, time, seed * 3 + dx);
  }
  // The leafy twig curling up off the far end.
  const tx = x + w - 2;
  ctx.strokeStyle = shade(BARK, -10);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tx - 6, y + 7);
  ctx.quadraticCurveTo(tx + 8, y + 4, tx + 14 + sway, y - 8);
  ctx.stroke();
  for (const [lx, ly, a] of [[tx + 8, y - 1, -0.5], [tx + 14 + sway, y - 10, -1.1], [tx + 4, y + 1, 0.4]]) {
    ctx.fillStyle = m.lip;
    ctx.strokeStyle = edge(m.lip);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(lx + sway * 0.5, ly, 4.6, 2.2, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // The log: a rounded tube, lit on top, shadowed under, outlined.
  ctx.fillStyle = BARK;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y - 1, w, 16, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(BARK, 12);
  ctx.fillRect(x + 4, y + 2, w - 8, 3);
  ctx.fillStyle = shade(BARK, -16);
  ctx.fillRect(x + 4, y + 10, w - 8, 3);
  // Bark: short curved grooves and the odd knot.
  ctx.strokeStyle = shade(BARK, -24);
  ctx.lineWidth = 0.9;
  for (let dx = 10; dx < w - 10; dx += 9) {
    const k = hash(seed * 4.3 + dx);
    const by = y + 5 + k * 6;
    ctx.beginPath();
    ctx.moveTo(x + dx, by);
    ctx.quadraticCurveTo(x + dx + 4, by - 1.5, x + dx + 7 + k * 3, by + 0.5);
    ctx.stroke();
    if (k > 0.86) {
      ctx.fillStyle = shade(BARK, -20);
      ctx.beginPath();
      ctx.ellipse(x + dx + 3, by + 1, 2.4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade(BARK, 14);
      ctx.beginPath();
      ctx.ellipse(x + dx + 2.6, by + 0.6, 1, 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The sawn ring at the near end.
  ctx.fillStyle = '#f0d4a6';
  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 7, 4.6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#c99a6a';
  for (const r of [2, 4.5]) {
    ctx.beginPath();
    ctx.ellipse(x + 1, y + 7, r * 0.55, r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // The moss cap, lumpy on top and hanging over the front edge in tongues.
  lip(ctx, { ...m, blades: true }, [[x + 3, y], [x + w - 3, y]], time, seed + 70, Infinity, 6, deco);
}

// A rope bridge: posts at both ends, sagging rope rails, and planks with gaps between them.
function drawBridge(ctx, x, y, w, time, seed) {
  const rope = '#c9a06b';
  const line = edge(WOOD);
  const sag = Math.min(8, w * 0.05);
  const railY = (u) => y - 14 + Math.sin(u * Math.PI) * sag + Math.sin(time * 1.5 + seed) * 0.6 * Math.sin(u * Math.PI);
  // Hangers from the rails down to the planks.
  ctx.strokeStyle = rope;
  ctx.lineWidth = 1;
  for (let px = x + 8; px < x + w - 6; px += 12) {
    const u = (px - x) / w;
    ctx.beginPath();
    ctx.moveTo(px, railY(u));
    ctx.lineTo(px, y + 1);
    ctx.stroke();
  }
  // The planks, on a rope underneath.
  ctx.strokeStyle = shade(rope, -20);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x + w, y + 4);
  ctx.stroke();
  for (let px = x + 2; px < x + w - 4; px += 11) {
    ctx.fillStyle = hash(seed + (px - x) * 0.31) > 0.5 ? WOOD : shade(WOOD, -8);
    ctx.fillRect(px, y - 1, 8, 5);
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(px + 0.4, y - 0.6, 7.2, 4.2);
  }
  // The rails.
  ctx.strokeStyle = rope;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    if (i) ctx.lineTo(x + u * w, railY(u));
    else ctx.moveTo(x + u * w, railY(u));
  }
  ctx.stroke();
  // Posts with knobs at both ends.
  for (const px of [x - 1, x + w - 3]) {
    ctx.fillStyle = shade(WOOD, -12);
    ctx.fillRect(px, y - 18, 4, 26);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, y - 17.5, 3, 25);
    ctx.fillStyle = WOOD;
    ctx.beginPath();
    ctx.arc(px + 2, y - 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

// A floating block of stone: a squared-off slab with a broken, jagged underside and pebbles
// drifting beneath it.
function drawStone(ctx, theme, m, x, y, w, d, cam, time, seed, deco) {
  const pts = [[x, y], [x + w, y], [x + w, y + d * 0.55]];
  for (let px = x + w - 10; px > x + 6; px -= 12) pts.push([px, y + d * (0.6 + hash(seed * 4.1 + px) * 0.4)]);
  pts.push([x, y + d * 0.55]);
  for (let i = 0; i < 3; i++) {
    const k = hash(seed * 2.2 + i);
    const px = x + w * (0.2 + k * 0.6);
    const py = y + d + 8 + i * 6 + Math.sin(time * 1.5 + i + seed) * 2;
    ctx.fillStyle = shade(m.body, -6);
    ctx.strokeStyle = edge(m.body);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(px, py, 3 + k * 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.save();
  poly(ctx, pts);
  fillLand(ctx, theme, m, cam);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + d);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, hexA(m.deep, 0.75));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, d + 2);
  ctx.restore();
  poly(ctx, pts);
  ctx.strokeStyle = edge(m.body);
  ctx.lineWidth = 1;
  ctx.stroke();
  lip(ctx, m, [[x + 1, y], [x + w - 1, y]], time, seed + 70, Infinity, 6, deco);
}

// ---------- Interior ledges (the interior rule: ledges indoors are part of the building) ----------

// Where a hanger above a ledge ends, in world y: the underside of the nearest ledge above it at
// that x, or the room's ceiling (the top of the map).
function hangTop(map, p, wx) {
  let top = -40;
  for (const q of map?.platforms ?? []) {
    if (q === p || q.y >= p.y || wx < q.x || wx > q.x + q.w) continue;
    top = Math.max(top, q.y + 16);
  }
  return top;
}

// A chain (gallery) or a pair of iron rods with a turnbuckle (catwalk) from `top` down to the ledge.
function hanger(ctx, style, x, top, bottom, trim, time, seed) {
  if (bottom - top < 6) return;
  ctx.save();
  if (style === 'gallery') {
    // Chain links, alternating face-on and edge-on, in the trim's metal.
    const dark = shade(trim, -34);
    for (let yy = Math.max(top, -20); yy < bottom - 2; yy += 5) {
      const k = Math.round((yy - top) / 5) % 2;
      ctx.fillStyle = dark;
      if (k) ctx.fillRect(x - 0.7, yy, 1.4, 5);
      else {
        ctx.strokeStyle = dark;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(x, yy + 2.5, 1.6, 2.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = hexA(trim, 0.8);
        ctx.fillRect(x - 1.4, yy + 1, 0.8, 1.6);
      }
    }
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.ellipse(x, bottom - 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#6a6080';
    ctx.fillRect(x - 3, Math.max(top, -20), 1.6, bottom - Math.max(top, -20));
    ctx.fillRect(x + 1.4, Math.max(top, -20), 1.6, bottom - Math.max(top, -20));
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - 2.6, Math.max(top, -20), 0.6, bottom - Math.max(top, -20));
    const ty = bottom - 22;
    if (ty > top + 6) {
      ctx.fillStyle = '#8a809e';
      ctx.fillRect(x - 3.6, ty, 7.2, 6);
      ctx.fillStyle = '#b8b0c8';
      ctx.fillRect(x - 3.6, ty, 7.2, 1.2);
    }
  }
  ctx.restore();
}

// A gallery: a mezzanine slab with a floor of the room's material on top, a moulded fascia with
// a gilded rail and dentils, and a soft shadow under it. Ends finished with a corbel each.
function drawGallery(ctx, m, x, y, w, trim, seed) {
  const fascia = mix(m.body, m.deep, 0.25);
  const line = edge(fascia);
  ctx.save();
  // The shadow it casts on the wall behind.
  ctx.fillStyle = 'rgba(30,20,50,0.16)';
  ctx.fillRect(x + 4, y + 18, w - 8, 6);
  // The fascia and its mouldings.
  ctx.fillStyle = fascia;
  ctx.fillRect(x, y + 4, w, 14);
  ctx.fillStyle = shade(fascia, -14);
  ctx.fillRect(x, y + 15, w, 3);
  ctx.fillStyle = trim;
  ctx.fillRect(x - 1, y + 4, w + 2, 1.6);
  ctx.fillRect(x, y + 13, w, 1.2);
  ctx.fillStyle = shade(trim, -26);
  for (let dx = 4; dx < w - 3; dx += 7) ctx.fillRect(x + dx, y + 7, 3, 3);
  // Panels between the dentils and the lower rail, every so often a rosette.
  ctx.fillStyle = hexA(trim, 0.85);
  for (let dx = 24; dx < w - 20; dx += 48) {
    ctx.beginPath();
    ctx.arc(x + dx, y + 11.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 4.5, w - 1, 13);
  // The floor on top: the room's own floor, a lit edge, a thin dark seam under it.
  ctx.fillStyle = m.lip;
  ctx.fillRect(x - 2, y - 1, w + 4, 5.5);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(x - 1, y - 0.5, w + 2, 1.2);
  ctx.fillStyle = shade(m.lip, -24);
  for (let dx = 12; dx < w; dx += 22 + hash(seed + dx) * 8) ctx.fillRect(x + dx, y + 0.8, 0.8, 3.6);
  ctx.strokeStyle = edge(m.lip);
  ctx.strokeRect(x - 1.5, y - 0.5, w + 3, 5);
  // Corbels under each end.
  for (const [cx, dir] of [[x + 3, 1], [x + w - 3, -1]]) {
    ctx.fillStyle = fascia;
    ctx.beginPath();
    ctx.moveTo(cx - 3 * dir, y + 18);
    ctx.lineTo(cx + 7 * dir, y + 18);
    ctx.quadraticCurveTo(cx + 2 * dir, y + 22, cx - 1 * dir, y + 30);
    ctx.lineTo(cx - 3 * dir, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.stroke();
    ctx.fillStyle = trim;
    ctx.fillRect(cx - 4, y + 29, 3 + 2, 1.4);
  }
  ctx.restore();
}

// A catwalk: a grated deck on a light truss, a toe-board along the front, and the truss's zigzag
// underneath, in painted iron (or timber, in the mine).
function drawCatwalk(ctx, m, x, y, w, metal, seed) {
  const dark = shade(metal, -26);
  const line = edge(metal);
  ctx.save();
  // The truss: top and bottom chords and a zigzag web.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 15);
  ctx.lineTo(x + w - 2, y + 15);
  for (let dx = 4; dx < w - 4; dx += 12) {
    ctx.moveTo(x + dx, y + 6);
    ctx.lineTo(x + dx + 6, y + 15);
    ctx.lineTo(x + dx + 12, y + 6);
  }
  ctx.stroke();
  // The deck: a grate with its slots, a lit edge and the toe-board.
  ctx.fillStyle = metal;
  ctx.fillRect(x, y - 1, w, 7);
  ctx.fillStyle = shade(metal, 14);
  ctx.fillRect(x, y - 1, w, 1.4);
  ctx.fillStyle = dark;
  for (let dx = 3; dx < w - 2; dx += 4) ctx.fillRect(x + dx, y + 1.6, 1.6, 2.6);
  ctx.fillStyle = shade(metal, -12);
  ctx.fillRect(x, y + 4.5, w, 1.8);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y - 0.5, w - 1, 7);
  // Rivets on the toe-board.
  ctx.fillStyle = shade(metal, 22);
  for (let dx = 6; dx < w - 4; dx += 16) ctx.fillRect(x + dx, y + 4.8, 1.2, 1.2);
  ctx.restore();
}

function islandShape(x, y, w, d, seed) {
  const lumpy = (u) => 1 + (hash(seed * 3 + u * 10) - 0.5) * 0.18;
  const curves = [
    [[x + w, y], [x + w + 1, y + d * 0.45], [x + w * 0.82, y + d * 0.7 * lumpy(1)]],
    [[x + w * 0.82, y + d * 0.7 * lumpy(1)], [x + w * 0.62, y + d * 0.95 * lumpy(2)], [x + w * 0.5, y + d]],
    [[x + w * 0.5, y + d], [x + w * 0.38, y + d * 0.95 * lumpy(3)], [x + w * 0.18, y + d * 0.7 * lumpy(4)]],
    [[x + w * 0.18, y + d * 0.7 * lumpy(4)], [x - 1, y + d * 0.45], [x, y]],
  ];
  const under = [];
  for (const [a, c, b] of curves) {
    for (let i = 0; i < 8; i++) {
      const u = i / 8;
      under.push([(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]]);
    }
  }
  under.push([x, y]);
  return under;
}

// How far down the underside reaches at screen x.
function undersideAt(under, px) {
  for (let i = 1; i < under.length; i++) {
    const [x0, y0] = under[i - 1];
    const [x1, y1] = under[i];
    if ((px <= x0 && px >= x1) || (px >= x0 && px <= x1)) return x0 === x1 ? Math.max(y0, y1) : y0 + ((y1 - y0) * (px - x0)) / (x1 - x0);
  }
  return under[0][1];
}

function island(ctx, x, y, w, d, seed) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (const [px, py] of islandShape(x, y, w, d, seed)) ctx.lineTo(px, py);
  ctx.closePath();
}

// ---------- Ladders ----------

export function drawLadder(ctx, r, cam) {
  const x = r.x - cam.x;
  const top = r.top - cam.y;
  const bottom = r.bottom - cam.y;
  const wood = '#d9a86c';
  const line = edge(wood);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (let y = top + 6; y < bottom - 2; y += 8) {
    ctx.fillStyle = shade(wood, 8);
    ctx.fillRect(x - 6, y, 12, 2.4);
    ctx.strokeRect(x - 6 + 0.5, y + 0.5, 11, 1.6);
  }
  for (const sx of [-7, 5]) {
    ctx.fillStyle = wood;
    ctx.fillRect(x + sx, top - 4, 2.5, bottom - top + 4);
    ctx.strokeRect(x + sx - 0.25, top - 4, 3, bottom - top + 4);
  }
}
