// Portals: a little gateway in each region's own style, standing on the ground with a soft swirl
// of the region's colour turning inside it. A flowery trellis in the meadows, a lantern gate in
// towns, a mossy root arch in the woods, a cracked stone arch in the ruins, crystal in the cave, a
// cloud ring in the sky, a small torii on the shrine path, an icy arch on the peak, and so on.
// Drawn like the rest of the scenery (outlined pastel shapes lit from the upper left). The swirl is
// a glassy vortex: rings toward a bright heart, bright arms and shadowed ones turning inward, a
// loop of drawings fine enough to turn smoothly; round it a soft glow, and little motes of the
// place (bubbles, petals, leaves, stars...) drifting in along its arms.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, bark, stones, crystal, foliage, band } from './propkit.js';
import { art, place } from './scenery.js';

const W = 60;
const H = 82;
// The doorway the swirl fills: centered at (30, 48), 34 wide and 52 tall.
const SW = 34;
const SH = 52;
// The swirl's three arms repeat every third of a turn: SPIN drawings cover that third, shown
// SPIN_FPS a second (a whole turn every 4.8 s, a few degrees a drawing: it turns, never ticks).
const SPIN = 48;
const SPIN_FPS = 30;
const SPIN_RATE = ((Math.PI * 2) / 3) * (SPIN_FPS / SPIN);

// Each style: the gateway's art, and the swirl's colours (outer, middle, inner).
export const PORTAL_STYLES = {
  meadow: { swirl: ['#ffb3cf', '#ffd6e6', '#fff4f9'], arch: flowerArch },
  town: { swirl: ['#c9a6ff', '#e2d4ff', '#fbf6ff'], arch: lanternGate },
  forest: { swirl: ['#7fd6a8', '#c4f2d6', '#f4fff8'], arch: rootArch },
  grove: { swirl: ['#9a8ae8', '#c9bcff', '#f2eeff'], arch: (v) => rootArch(v, true) },
  hollow: { swirl: ['#7fe6d6', '#c4f6ee', '#f4fffd'], arch: rootArch },
  ruins: { swirl: ['#b48cff', '#dccaff', '#f8f2ff'], arch: stoneArch },
  cave: { swirl: ['#7fd0ff', '#c4ecff', '#f2fbff'], arch: crystalArch },
  sky: { swirl: ['#ffc6e8', '#e2eaff', '#ffffff'], arch: cloudRing },
  crag: { swirl: ['#ffb07a', '#ffd9b8', '#fff6ec'], arch: bannerGate },
  harbor: { swirl: ['#8fb8ff', '#cddcff', '#f4f8ff'], arch: dockGate },
  shrine: { swirl: ['#ff9a8a', '#ffd0c4', '#fff4ef'], arch: toriiGate },
  ridge: { swirl: ['#8fa6ff', '#cdd6ff', '#f4f6ff'], arch: logArch },
  springs: { swirl: ['#7fdcd0', '#c4f2ec', '#f2fffd'], arch: bambooGate },
  tea: { swirl: ['#9fd88a', '#d8f0c0', '#f6fff0'], arch: bambooGate },
  snow: { swirl: ['#a8d4ff', '#dcefff', '#ffffff'], arch: iceArch },
  mochi: { swirl: ['#ffb3cf', '#ffe2ee', '#fff8fb'], arch: mochiGate },
  // Every area its own (2026-11-22, the player: "let these gates match every map"): the dungeons'
  // and their gate maps', the Dream Theatre's sets each a door of their own, and a real door
  // indoors (a room has no garden arch in it).
  candy: { swirl: ['#ff9ec8', '#ffd6ea', '#fff4fa'], arch: candyGate },
  carnival: { swirl: ['#ffcf5a', '#ffe9b0', '#fffaee'], arch: carnivalGate },
  manor: { swirl: ['#9a7cff', '#cdbfff', '#f4f0ff'], arch: manorGate },
  observatory: { swirl: ['#6f8cff', '#bcc8ff', '#f2f4ff'], arch: observatoryGate },
  aquarium: { swirl: ['#5fd6e6', '#bff0f6', '#f2feff'], arch: coralGate },
  skywhale: { swirl: ['#7fc4ff', '#cde8ff', '#f4faff'], arch: skyHarborGate },
  theatre: { swirl: ['#ff8fb8', '#ffd0e2', '#fff4f8'], arch: stageGate },
  door: { swirl: ['#ffc6a8', '#ffe6d6', '#fff8f2'], arch: () => doorGate(DOORS.door) },
  door_crag: { swirl: ['#ffb07a', '#ffd9b8', '#fff6ec'], arch: () => doorGate(DOORS.crag) },
  door_grove: { swirl: ['#9a8ae8', '#c9bcff', '#f2eeff'], arch: () => doorGate(DOORS.grove) },
  door_town: { swirl: ['#c9a6ff', '#e2d4ff', '#fbf6ff'], arch: () => doorGate(DOORS.town) },
  cabindoor: { swirl: ['#8fb8ff', '#cddcff', '#f4f8ff'], arch: cabinDoor },
  palacedoor: { swirl: ['#ffd36b', '#ffeab0', '#fffaf0'], arch: palaceDoor },
  traindoor: { swirl: ['#ffd28a', '#ffeccc', '#fffaf2'], arch: trainDoor },
  officedoor: { swirl: ['#8fd0ff', '#cdeaff', '#f4fbff'], arch: officeDoor },
  storedoor: { swirl: ['#7fdcb0', '#c8f4de', '#f4fff9'], arch: storeDoor },
  flatdoor: { swirl: ['#c9a6ff', '#e6d8ff', '#fbf8ff'], arch: flatDoor },
  manordoor: { swirl: ['#9a7cff', '#cdbfff', '#f4f0ff'], arch: manorDoor },
};

// Which gate each dungeon's rooms take, each Dream Theatre set's door, and the door a room indoors
// has by its town's look.
const DUNGEON_GATES = { hollow: 'hollow', manor: 'manor', aquarium: 'aquarium', carnival: 'carnival', observatory: 'observatory', volcano: 'candy', theatre: 'theatre', skywhale: 'skywhale' };
const SET_DOORS = { dreamtrain: 'traindoor', dreamoffice: 'officedoor', dreamovertime: 'officedoor', dreamstore: 'storedoor', dreamflat: 'flatdoor', dawnpalace: 'palacedoor' };
const INDOOR_DOORS = { harbor: 'cabindoor', crag: 'door_crag', grove: 'door_grove', town: 'door_town', meadow: 'palacedoor' };

// Which style a map's portals take: its own (`look.portal`), its theme's, or the meadow's.
// Rooms that aren't marked indoor by their theme but are: the manor's halls, her flat in the prologue.
const MAP_GATES = { manor2: 'manordoor', manor3: 'manordoor', manor4: 'manordoor', manor5: 'manordoor', pr_flat: 'flatdoor' };
export function portalStyleOf(map) {
  const own = map.look?.portal ?? MAP_GATES[map.id];
  if (own && PORTAL_STYLES[own]) return own;
  const set = SET_DOORS[map.look?.painted];
  if (set) return set;
  if (map.indoor) return INDOOR_DOORS[map.theme] ?? 'door';
  if (map.dungeon) return DUNGEON_GATES[map.dungeon] ?? 'hollow';
  return PORTAL_STYLES[map.theme] ? map.theme : 'meadow';
}

// Draws one portal with its base centered on (x, y), the ground line (`own`: a portal's own style,
// over its map's).
export function drawPortalGate(ctx, map, x, y, time, seed = 0, own = null) {
  const key = own && PORTAL_STYLES[own] ? own : portalStyleOf(map);
  const style = PORTAL_STYLES[key];
  const cy = y - (H - 48);
  aura(ctx, style, x, cy, time, seed);
  place(ctx, swirlArt(key, style.swirl, spinFrame(time, seed)), x, cy + SH / 2);
  motes(ctx, key, x, cy, time, seed);
  place(ctx, archArt(key, style), x, y + 2);
}

// Only the swirl, for a portal that is a mouth in the scenery itself (a cave in a cliff, the door in
// the great tree's roots: `mouth` on the portal): the opening is drawn by the map, the swirl turns
// inside it, `lift` px up off the ground.
export function drawPortalSwirl(ctx, map, x, y, time, seed = 0, own = null, lift = 40) {
  const key = own && PORTAL_STYLES[own] ? own : portalStyleOf(map);
  const style = PORTAL_STYLES[key];
  const cy = y - lift;
  aura(ctx, style, x, cy, time, seed);
  place(ctx, swirlArt(key, style.swirl, spinFrame(time, seed)), x, cy + SH / 2);
  motes(ctx, key, x, cy, time, seed);
}

// (Each portal turns in its own phase, from where it stands.)
const spinFrame = (time, seed) => (((Math.floor(time * SPIN_FPS + seed * 7) % SPIN) + SPIN) % SPIN);

function archArt(key, style) {
  return art(`portal|${key}`, W, H, () => style.arch(key).filter(Boolean));
}

// The swirl: a rim of glass round rings of the region's colour toward a bright heart; three bright
// arms and three shadowed ones between them spiral in, turning (drawing `f` of SPIN, a third of a
// turn); a glint of light on the glass that stays put while the vortex turns under it.
function swirlArt(key, [c0, c1, c2], f) {
  return art(`portalswirl|${key}|${f}`, SW, SH, () => {
    const cx = SW / 2;
    const cy = SH / 2;
    const rx = SW / 2 - 0.5;
    const ry = SH / 2 - 0.5;
    const ink = '#3a2d6a';
    const at = (a, r) => [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
    const out = [E(cx, cy, rx, ry, mix(c0, ink, 0.32)), F(E(cx, cy, rx - 0.9, ry - 0.9, c0))];
    for (const [k, c] of [[0.8, mix(c0, c1, 0.45)], [0.62, c1], [0.45, mix(c1, c2, 0.5)], [0.3, c2]]) out.push(F(E(cx, cy, rx * k, ry * k, c)));
    const rot = (f / SPIN) * ((Math.PI * 2) / 3);
    // An arm from near the heart out to the rim, turning `turn` as it goes, `w(u)` half wide.
    const arm = (a0, turn, r0, r1, w, c) => {
      const path = Array.from({ length: 19 }, (_, i) => {
        const u = i / 18;
        return at(a0 + u * turn, r0 + (r1 - r0) * u);
      });
      return F(band(path, w, c));
    };
    const TURN = 4.6;
    for (let k = 0; k < 3; k++) {
      const a0 = rot + (k * Math.PI * 2) / 3;
      // A shadowed lane, a faint streak, then the bright arm with its white core.
      out.push(arm(a0 + Math.PI / 3 + 0.35, TURN, 0.14, 0.97, (u) => 0.25 + 0.75 * Math.sin(Math.PI * Math.pow(u, 0.8)), mix(c0, ink, 0.1)));
      out.push(arm(a0 + Math.PI / 3 - 0.3, TURN, 0.16, 0.92, (u) => 0.2 + 0.6 * Math.sin(Math.PI * Math.pow(u, 0.8)), mix(c2, '#ffffff', 0.3)));
      out.push(arm(a0, TURN, 0.08, 0.97, (u) => 0.3 + 1.45 * Math.sin(Math.PI * Math.pow(u, 0.7)) * (1 - u * 0.3), mix(c1, '#ffffff', 0.55)));
      out.push(arm(a0 + 0.1, TURN, 0.1, 0.8, (u) => 0.15 + 0.55 * Math.sin(Math.PI * Math.pow(u, 0.8)), '#ffffff'));
    }
    out.push(F(E(cx, cy, 6.4, 8, mix(c2, '#ffffff', 0.25))), F(E(cx, cy, 4, 5, mix(c2, '#ffffff', 0.7))), F(E(cx, cy, 2.2, 2.8, '#ffffff')));
    out.push(F(T([[cx, cy - 4.4], [cx + 0.7, cy - 0.7], [cx + 3.4, cy], [cx + 0.7, cy + 0.7], [cx, cy + 4.4], [cx - 0.7, cy + 0.7], [cx - 3.4, cy], [cx - 0.7, cy - 0.7]], '#ffffff')));
    // The glass: a lit sweep on the upper left of the rim, a soft shade low on the right.
    const arc = (a0, a1, r) => Array.from({ length: 9 }, (_, i) => at(a0 + ((a1 - a0) * i) / 8, r));
    out.push(F(band(arc(0.25, 1.25, 0.9), (u) => 0.9 * Math.sin(Math.PI * u), mix(c0, ink, 0.18))));
    out.push(F(band(arc(3.55, 4.35, 0.86), (u) => 0.85 * Math.sin(Math.PI * u), '#ffffff')), F(E(...at(4.55, 0.86), 0.75, 0.75, '#ffffff')));
    return out;
  }, false);
}

// A soft light round the portal, breathing slowly (under the gate, so it shows as a halo round it).
function aura(ctx, style, x, cy, time, seed) {
  const a = 0.2 + 0.07 * Math.sin(time * 1.7 + seed * 0.37);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, cy);
  ctx.scale(1, 1.4);
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 30);
  g.addColorStop(0, style.swirl[1]);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-30, -30, 60, 60);
  ctx.restore();
}

// What drifts into each portal along its arms (sparkles where nothing else fits).
const MOTES = {
  meadow: 'petal', town: 'petal', mochi: 'petal', shrine: 'petal', tea: 'petal', palacedoor: 'petal', door_town: 'petal', door: 'petal', theatre: 'petal',
  forest: 'leaf', hollow: 'leaf', grove: 'leaf', door_grove: 'leaf',
  harbor: 'bubble', springs: 'bubble', aquarium: 'bubble', cabindoor: 'bubble',
  snow: 'snow', sky: 'snow', skywhale: 'snow',
  observatory: 'star', ridge: 'star', manor: 'star', manordoor: 'star', flatdoor: 'star',
  candy: 'heart', carnival: 'heart',
};
const MOTE_COLOR = { petal: '#ff9ec8', leaf: '#6fcf98', heart: '#ff6f9a', star: '#ffd84a' };
// Five motes, each drifting in from the rim along an arm (riding the vortex's own turn) and fading
// as it reaches the heart.
function motes(ctx, key, x, cy, time, seed) {
  const kind = MOTES[key] ?? 'sparkle';
  const rx = SW / 2 - 2;
  const ry = SH / 2 - 2;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const u = (((time * 0.32 + i / 5 + seed * 0.0137) % 1) + 1) % 1;
    const r = 1 - u * 0.92;
    const a = time * SPIN_RATE + (i * Math.PI * 2) / 5 + seed * 0.21 + r * 4.6 + 0.4;
    const mx = x + Math.cos(a) * rx * r;
    const my = cy + Math.sin(a) * ry * r;
    const s = 0.9 + 1.1 * r;
    ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, u * 1.15)) * 0.95;
    drawMote(ctx, kind, mx, my, s, a, MOTE_COLOR[kind] ?? '#ffffff');
  }
  ctx.restore();
}
function drawMote(ctx, kind, x, y, s, a, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  if (kind === 'bubble') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.6;
    ctx.arc(x, y, s * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - s * 0.45, y - s * 0.45, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (kind === 'petal' || kind === 'leaf') {
    ctx.ellipse(x, y, s * 1.5, s * 0.75, a + 1.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (kind === 'snow') {
    ctx.arc(x, y, s * 0.9, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (kind === 'heart') {
    const k = s * 0.9;
    ctx.moveTo(x, y + k);
    ctx.bezierCurveTo(x - k * 1.6, y - k * 0.1, x - k * 0.8, y - k * 1.4, x, y - k * 0.45);
    ctx.bezierCurveTo(x + k * 0.8, y - k * 1.4, x + k * 1.6, y - k * 0.1, x, y + k);
    ctx.fill();
    return;
  }
  // A twinkle (four points), or a little five-pointed star.
  const n = kind === 'star' ? 5 : 4;
  const r = s * (kind === 'star' ? 1.5 : 1.7);
  for (let i = 0; i < n * 2; i++) {
    const t = (i * Math.PI) / n - Math.PI / 2;
    const rr = i % 2 ? r * (kind === 'star' ? 0.45 : 0.3) : r;
    ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------- The gateways (60 x 82, the doorway open in the middle) ----------

const bloom = (x, y, r, c) => [...[0, 1, 2, 3, 4].map((k) => F(E(x + Math.cos(k * 1.26) * r, y + Math.sin(k * 1.26) * r, r * 0.8, r * 0.8, c))), F(E(x, y, r * 0.55, r * 0.55, c === '#ffe36b' ? '#ff9f5a' : '#ffe36b'))];
// Points along the arch's curve (from the left post's top over to the right's), `r` out from the
// doorway's middle.
const archPts = (r, n = 10, top = 22) => Array.from({ length: n + 1 }, (_, i) => {
  const a = Math.PI + (i / n) * Math.PI;
  return [30 + Math.cos(a) * r, top + Math.sin(a) * r * 0.75];
});

// Meadow: a white trellis wound with vines and flowers.
function flowerArch() {
  const wood = ramp('#fff4ea', 0.7);
  const leaf = ramp('#8fdc9a');
  const out = [R(7, 22, 6, 60, wood.base), F(R(11, 22, 2, 60, wood.sh)), R(47, 22, 6, 60, wood.base), F(R(51, 22, 2, 60, wood.sh))];
  out.push(...bark(archPts(22), () => 2.6, wood, 1, 0));
  for (const [x, y, k] of [[10, 30, 0], [50, 40, 1], [10, 56, 2], [50, 66, 3]]) out.push(...foliage(x, y, 5, 4, leaf, k, { flat: true }));
  archPts(23, 8).forEach(([x, y], i) => {
    out.push(...foliage(x, y, 4.4, 3.4, leaf, i, { flat: true }));
    if (i % 2 === 0) out.push(...bloom(x, y - 1, 1.6, ['#ff9ec0', '#ffffff', '#ffe36b', '#c9a6ff'][i % 4]));
  });
  out.push(...bloom(9, 44, 1.5, '#ff9ec0'), ...bloom(51, 54, 1.5, '#ffffff'), ...bloom(9, 72, 1.3, '#ffe36b'));
  out.push(E(10, 81, 7, 1.6, '#8fdc9a'), E(50, 81, 7, 1.6, '#8fdc9a'));
  return out;
}

// Town: a little wooden gate with a pink tiled roof and a paper lantern on each post.
function lanternGate() {
  const wood = ramp('#c99a6a', 0.8);
  const roof = ramp('#ff9ec0', 0.8);
  const out = [R(6, 18, 6, 64, wood.base), F(R(10, 18, 2, 64, wood.sh)), R(48, 18, 6, 64, wood.base), F(R(52, 18, 2, 64, wood.sh)), R(4, 20, 52, 4, wood.base), F(R(4, 23, 52, 1, wood.sh))];
  out.push(T([[0, 18], [30, 4], [60, 18], [56, 20], [30, 8], [4, 20]], roof.base), F(T([[30, 4], [60, 18], [56, 20], [30, 8]], roof.sh)), F(T([[6, 16], [30, 5.6], [22, 10]], roof.hi)));
  out.push(E(30, 10, 3, 3, '#fff3a6'), F(E(30, 10, 1.6, 1.6, '#ffffff')));
  for (const x of [9, 51]) out.push(R(x - 0.4, 28, 0.8, 4, '#7a6a8a'), E(x, 36, 4, 5, '#ffd6a0'), F(E(x + 1.2, 37, 2.4, 3.8, '#ffc07a')), F(R(x - 3.6, 31.4, 7.2, 1, '#ff8fb0')), F(R(x - 3.6, 40, 7.2, 1, '#ff8fb0')));
  return out;
}

// The Mochi Garden's (and every way into it): a ring of hanami dango round the doorway, pink, white and
// matcha green, standing on two little stones; and a round mochi sat on top of it, smiling, rosy,
// its sprout up.
const DANGO = ['#b8e09c', '#fff6ee', '#ffb7cf'];
function mochiGate() {
  const out = [];
  const bead = (x, y, c, r = 6.4) => out.push(E(x, y, r, r * 0.94, c), F(E(x - r * 0.32, y - r * 0.4, r * 0.32, r * 0.2, '#ffffff')));
  // The two stones it stands on.
  for (const x of [9.5, 50.5]) out.push(E(x, 79, 7.5, 3.6, '#e4d8d2'), F(E(x - 2, 77.6, 3, 1, '#f6eeea')));
  // Up each side and round the top, the colours mirrored either side.
  const side = [[9.5, 70], [9.5, 59], [9.5, 48], [12.4, 37.4], [19.8, 29.4]];
  side.forEach(([x, y], i) => {
    bead(x, y, DANGO[i % 3]);
    bead(60 - x, y, DANGO[i % 3]);
  });
  // The mochi on top.
  out.push(E(30, 19, 11.5, 9.8, '#fff8f2'), F(E(26.4, 14.6, 4.4, 2, '#ffffff')));
  out.push(F(E(25.8, 19.4, 1.2, 1.7, '#4a3040')), F(E(34.2, 19.4, 1.2, 1.7, '#4a3040')), F(E(25.4, 18.6, 0.5, 0.6, '#ffffff')), F(E(33.8, 18.6, 0.5, 0.6, '#ffffff')));
  out.push(F(E(22.6, 22, 2.4, 1.3, '#ffbccb')), F(E(37.4, 22, 2.4, 1.3, '#ffbccb')));
  out.push(F(E(29.1, 22.4, 1, 0.7, '#d0507a')), F(E(30.9, 22.4, 1, 0.7, '#d0507a')));
  // Its sprout.
  out.push(F(R(29.5, 5.6, 1.1, 4.4, '#6fae52')), E(26.6, 6.2, 3.4, 1.8, '#8fd16f'), E(33.4, 5.4, 3.4, 1.8, '#8fd16f'));
  return out;
}

// Woods, grove and the Hollow: two roots twisting up into an arch, mossy, with a glowcap or two
// (and moonlit lanterns in the grove).
function rootArch(key, grove = false) {
  const wood = ramp(grove ? '#9a7ec0' : '#b98e78', 0.85);
  const moss = ramp(grove ? '#9fe0b0' : '#a6dca2');
  const out = [];
  out.push(...bark([[10, 82], [8, 60], [11, 40], [14, 26], [22, 14], [30, 11]], (u) => 5 - u * 1.6, wood, 2));
  out.push(...bark([[50, 82], [52, 62], [49, 42], [46, 26], [38, 14], [30, 11]], (u) => 5 - u * 1.6, wood, 3));
  out.push(...foliage(16, 20, 6, 4, moss, 1, { flat: true }), ...foliage(44, 24, 6, 4, moss, 2, { flat: true }), ...foliage(30, 10, 7, 4, moss, 3, { flat: true }));
  const cap = grove ? '#c9b6ff' : '#7fe6d6';
  for (const [x, y] of [[6, 66], [54, 50]]) out.push(R(x - 1, y, 2, 6, '#fff1dc'), E(x, y, 4, 2.6, cap), F(E(x - 1, y - 0.6, 1.4, 0.8, '#ffffff')));
  if (grove) out.push(R(29.6, 12, 0.8, 6, '#7a6a8a'), E(30, 21, 3.4, 4, '#ffe9a6'), F(E(31, 22, 1.8, 3, '#ffd27a')));
  return out;
}

// Ruins: an arch of old stone blocks, one cracked, ivy trailing down.
function stoneArch() {
  const st = ramp('#d6cbf5', 0.75);
  const out = [...stones(4, 26, 12, 56, st, 2, { rowH: 8, blockW: 12 }), ...stones(44, 26, 12, 56, st, 5, { rowH: 8, blockW: 12 })];
  const pts = archPts(22, 6);
  pts.slice(0, -1).forEach(([x, y], i) => {
    const [x2, y2] = pts[i + 1];
    out.push(T([[x - 1, y - 4], [x2 + 1, y2 - 4], [x2 + 1, y2 + 5], [x - 1, y + 5]], i % 2 ? st.base : mix(st.base, st.hi, 0.4)), F(T([[x - 1, y + 3], [x2 + 1, y2 + 3], [x2 + 1, y2 + 5], [x - 1, y + 5]], st.sh)));
  });
  out.push(R(26, 2, 8, 8, st.base), F(R(31, 2, 3, 8, st.sh)), F(E(30, 6, 1.6, 1.6, '#b48cff')));
  out.push(F(T([[46, 40], [49, 46], [47, 52]], st.deep)));
  const ivy = ramp('#9be08f');
  for (const [x, y] of [[8, 30], [8, 38], [52, 30], [10, 46]]) out.push(...foliage(x, y, 3, 2.4, ivy, x + y, { flat: true }));
  return out;
}

// Crystal Cave: two crystal clusters for posts, an arch of shards over the top.
function crystalArch() {
  const c = ramp('#9fdcff');
  const p = ramp('#d4b4ff');
  const out = [];
  out.push(...crystal(10, 9, 40, 22, 82, c, -1), ...crystal(5, 6, 66, 56, 82, p, -2), ...crystal(15, 5, 70, 62, 82, c, 1));
  out.push(...crystal(50, 9, 40, 22, 82, c, 1), ...crystal(55, 6, 64, 54, 82, p, 2), ...crystal(45, 5, 72, 64, 82, p, -1));
  archPts(21, 6).forEach(([x, y], i) => out.push(...crystal(x, 6, y - 2, y - 10, y + 6, i % 2 ? p : c, (x - 30) * 0.15)));
  out.push(E(10, 82, 9, 2, '#7563b6'), E(50, 82, 9, 2, '#7563b6'));
  return out;
}

// Sky: a ring of puffy clouds round the doorway, little wings at the sides.
function cloudRing() {
  const cl = ramp('#ffffff', 0.6);
  const out = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = 30 + Math.cos(a) * 21;
    const y = 50 + Math.sin(a) * 30;
    out.push(E(x, y, 7, 6, cl.sh), F(E(x - 1, y - 1, 6, 5, cl.base)), F(E(x - 2.4, y - 2.4, 2.4, 1.6, cl.hi)));
  }
  for (const s of [-1, 1]) {
    const bx = 30 + s * 28;
    out.push(T([[bx, 44], [bx + s * 10, 36], [bx + s * 6, 46], [bx + s * 10, 50], [bx, 52]], '#fffaf0'), F(T([[bx, 50], [bx + s * 10, 50], [bx, 52]], '#e6dcff')));
  }
  return out;
}

// Ember Crag: sandstone posts with a striped cloth banner strung between them.
function bannerGate() {
  const st = ramp('#f2c48d', 0.8);
  const cloth = ramp('#ff8a5c', 0.85);
  const out = [...stones(5, 18, 10, 64, st, 1, { rowH: 10, blockW: 10 }), ...stones(45, 18, 10, 64, st, 4, { rowH: 10, blockW: 10 })];
  out.push(R(3, 14, 14, 5, st.base), F(R(3, 17, 14, 2, st.sh)), R(43, 14, 14, 5, st.base), F(R(43, 17, 14, 2, st.sh)));
  out.push(T([[15, 18], [45, 18], [42, 28], [30, 32], [18, 28]], cloth.base), F(T([[30, 18], [45, 18], [42, 28], [30, 32]], cloth.sh)));
  for (const x of [20, 26, 32, 38]) out.push(F(R(x, 19, 2, 9, '#ffd66b')));
  for (const x of [10, 50]) out.push(R(x - 0.6, 4, 1.2, 10, '#7a5238'), T([[x, 4], [x + 6, 6], [x, 8]], '#ffd66b'));
  return out;
}

// Pastel Harbor: two dock posts with rope coiled round them and a lantern hung on a crossbeam.
function dockGate() {
  const wood = ramp('#a88a6a', 0.85);
  const rope = '#e8d29a';
  const out = [R(7, 14, 7, 68, wood.base), F(R(11, 14, 3, 68, wood.sh)), R(46, 14, 7, 68, wood.base), F(R(50, 14, 3, 68, wood.sh)), R(3, 14, 54, 5, wood.base), F(R(3, 17, 54, 2, wood.sh))];
  for (const x of [7, 46]) for (const y of [30, 34, 60, 64]) out.push(F(R(x, y, 7, 2, rope)));
  out.push(R(29.6, 19, 0.8, 5, '#3a2d4f'), E(30, 28, 4, 5, '#fff3a6'), F(E(31, 29, 2.4, 3.6, '#ffe08a')), F(R(26, 23, 8, 1.4, '#5a4a6a')), F(R(26, 32.4, 8, 1.4, '#5a4a6a')));
  out.push(T([[3, 14], [0, 10], [8, 10]], wood.base), T([[57, 14], [60, 10], [52, 10]], wood.base));
  return out;
}

// Fox Shrine Path: a small vermilion torii.
function toriiGate() {
  const r = ramp('#ff6f61', 0.85);
  const ink = ramp('#4a3a5c', 0.8);
  const out = [];
  for (const x of [9, 45]) out.push(T([[x, 82], [x + 1, 20], [x + 6, 20], [x + 7, 82]], r.base), F(T([[x + 4.6, 82], [x + 5, 20], [x + 6, 20], [x + 7, 82]], r.sh)), R(x - 1.5, 76, 9, 6, ink.base));
  out.push(R(3, 26, 54, 4, r.base), F(R(3, 29, 54, 1, r.sh)), R(5, 15, 50, 5, r.base), F(R(5, 19, 50, 1, r.sh)));
  out.push(T([[0, 6], [6, 10], [30, 11], [54, 10], [60, 6], [58, 15], [30, 16], [2, 15]], ink.base), F(T([[2, 13], [30, 14.4], [58, 13], [58, 15], [30, 16], [2, 15]], ink.deep)));
  out.push(R(26, 18, 8, 9, '#3a2d4f'), F(R(27.4, 19.4, 5.2, 6.2, '#ffe9a6')));
  for (const x of [16, 24, 34, 42]) out.push(T([[x, 31], [x + 3, 31], [x + 1.5, 35], [x + 3.4, 38], [x + 0.4, 38]], '#ffffff'));
  return out;
}

// Moonlit Ridge: an arch lashed together from pine logs.
function logArch() {
  const wood = ramp('#8a7a9a', 0.85);
  const out = [];
  out.push(...bark([[10, 82], [10, 16]], () => 4, wood, 1), ...bark([[50, 82], [50, 16]], () => 4, wood, 2), ...bark([[2, 18], [58, 14]], () => 3.4, wood, 3), ...bark([[6, 26], [54, 24]], () => 2.4, wood, 4));
  for (const x of [10, 50]) out.push(F(R(x - 4, 22, 8, 2, '#e8d29a')), F(R(x - 4, 26, 8, 1.4, '#e8d29a')));
  out.push(T([[26, 12], [30, 4], [34, 12]], '#5f9e98'), T([[24, 14], [30, 8], [36, 14]], '#4f8f8a'));
  return out;
}

// Serpent Springs: a bamboo frame with a paper charm hanging in the middle.
function bambooGate() {
  const g = ramp('#7fcf9a', 0.85);
  const out = [];
  for (const x of [8, 13, 47, 52]) {
    out.push(R(x - 2, 14, 4, 68, g.base), F(R(x + 0.6, 14, 1.4, 68, g.sh)));
    for (let y = 24; y < 80; y += 14) out.push(F(R(x - 2, y, 4, 1.2, g.deep)));
  }
  out.push(R(2, 16, 56, 4, g.base), F(R(2, 19, 56, 1, g.sh)), R(4, 26, 52, 3, g.base), F(R(4, 28, 52, 1, g.sh)));
  out.push(R(29.6, 20, 0.8, 4, '#e8d29a'), R(26, 24, 8, 12, '#fffaf0'), F(R(27.4, 26, 5.2, 1.2, '#ff8a8a')), F(R(27.4, 29, 5.2, 0.8, '#ff8a8a')), F(R(27.4, 31.4, 5.2, 0.8, '#ff8a8a')));
  return out;
}

// Frozen Peak: blocks of ice in an arch, a cap of snow and icicles hanging from it.
function iceArch() {
  const ice = ramp('#cfe8ff', 0.7);
  const out = [];
  for (const x0 of [3, 45]) for (let y = 26; y < 82; y += 11) out.push(R(x0, y, 12, 10, ice.base), F(R(x0 + 8, y, 4, 10, ice.sh)), F(R(x0 + 1, y + 1, 3, 1, '#ffffff')));
  const pts = archPts(22, 6);
  pts.slice(0, -1).forEach(([x, y], i) => {
    const [x2, y2] = pts[i + 1];
    out.push(T([[x - 1, y - 4], [x2 + 1, y2 - 4], [x2 + 1, y2 + 5], [x - 1, y + 5]], ice.base), F(T([[x - 1, y + 3], [x2 + 1, y2 + 3], [x2 + 1, y2 + 5], [x - 1, y + 5]], ice.sh)));
  });
  out.push(...archPts(23, 8).map(([x, y]) => E(x, y - 5, 5, 3, '#fbfdff')));
  for (const [x, y, l] of [[14, 22, 6], [22, 12, 5], [38, 12, 7], [46, 22, 5]]) out.push(T([[x - 1.4, y], [x + 1.4, y], [x, y + l]], '#e6f4ff'));
  return out;
}

// ---------- The new gates (2026-11-22) ----------

// A star (five points) or a twinkle (four), centred on (x, y).
const starPts = (x, y, r, n = 5, k = 0.45) => Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
});
const ovalArcAt = (x, y, rx, ry, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
});
// A spiral of `turns` from the middle out to radius r (a lollipop's swirl, an iron curl).
const spiralPts = (x, y, r, turns = 2.4, s = 1, n = 28) => Array.from({ length: n + 1 }, (_, i) => {
  const u = i / n;
  const a = s * u * turns * Math.PI * 2;
  return [x + Math.cos(a) * r * (0.12 + u * 0.88), y + Math.sin(a) * r * (0.12 + u * 0.88)];
});
// The swirl sits in an oval; a square doorway is filled dark in its four corners round that oval,
// so the swirl glows inside a real door-shaped opening.
const SWX = 30;
const SWY = 46;
function doorOpening(x0, y0, x1, y1, c) {
  const P = Math.PI;
  const arc = (a0, a1) => ovalArcAt(SWX, SWY, SW / 2, SH / 2, a0, a1, 8);
  return [
    T([[x0, y0], [SWX, y0], ...arc(-P / 2, -P), [x0, SWY]], c),
    T([[SWX, y0], [x1, y0], [x1, SWY], ...arc(0, -P / 2)], c),
    T([[x0, SWY], ...arc(P, P / 2), [SWX, y1], [x0, y1]], c),
    T([...arc(P / 2, 0), [x1, SWY], [x1, y1], [SWX, y1]], c),
  ];
}
// Blocks along the arch over the doorway, alternating two colours, shaded underneath.
function archBand(r, n, c0, c1, sh, thick = 4.5) {
  const out = [];
  const pts = archPts(r, n);
  pts.slice(0, -1).forEach(([x, y], i) => {
    const [x2, y2] = pts[i + 1];
    out.push(T([[x - 0.6, y - thick], [x2 + 0.6, y2 - thick], [x2 + 0.6, y2 + thick], [x - 0.6, y + thick]], i % 2 ? c1 : c0));
    out.push(F(T([[x - 0.6, y + thick - 1.6], [x2 + 0.6, y2 + thick - 1.6], [x2 + 0.6, y2 + thick], [x - 0.6, y + thick]], sh)));
  });
  return out;
}

// Sugar Trail and the Candy Volcano: candy-cane posts striped on a slant, an arch of gumdrops dusted
// with sugar, a swirled lollipop on top, a puddle of icing at each foot.
function candyGate() {
  const out = [];
  const white = '#fffaf6';
  for (const x0 of [6, 47]) {
    out.push(E(x0 + 3.5, 81, 7, 2.2, '#ffd6ea'));
    out.push(R(x0, 30, 7, 51, white), F(R(x0 + 5, 30, 2, 51, '#efe2ec')));
    for (let y = 31; y < 78; y += 7) out.push(F(T([[x0, y + 3], [x0 + 7, y], [x0 + 7, y + 3], [x0, y + 6]], '#ff6f8a')), F(T([[x0 + 5, y + 0.86], [x0 + 7, y], [x0 + 7, y + 3], [x0 + 5, y + 3.86]], '#e0506e')));
    out.push(E(x0 + 3.5, 30, 3.5, 1.8, white));
  }
  const cols = ['#ff9ec8', '#8fe6c8', '#ffe27a', '#c9a6ff'];
  archPts(23, 8).forEach(([x, y], i) => {
    const r = ramp(cols[i % 4], 0.8);
    out.push(E(x, y, 5, 4.4, r.base), F(E(x + 1.3, y + 1.5, 3.6, 2.8, r.sh)), F(E(x - 1, y - 1.2, 3.4, 2.8, r.base)), F(E(x - 2, y - 2, 1.1, 0.8, '#ffffff')));
    for (let k = 0; k < 3; k++) out.push(F(E(x - 2.4 + k * 2.2, y + (k % 2 ? 0.6 : -0.8), 0.45, 0.45, '#ffffff')));
  });
  out.push(R(29.3, 6, 1.4, 10, white), E(30, 6, 5.6, 5.6, '#ff9ec8'), F(E(31.4, 7.4, 3.6, 3.2, '#f07aa8')), F(band(spiralPts(30, 6, 5, 2.2), () => 0.7, '#ffffff')));
  return out;
}

// The Clockwork Carnival: posts striped red and cream with gold caps, a big-top arch of the same
// stripes studded with bulbs, a gold star on top and a pennant flying from each post.
function carnivalGate() {
  const red = ramp('#ff6f7a', 0.8);
  const gold = ramp('#ffd36b', 0.8);
  const cream = '#fff6e8';
  const out = [];
  for (const x0 of [5, 47]) {
    for (let k = 0; k < 4; k++) out.push(R(x0 + k * 2, 26, 2, 53, k % 2 ? cream : red.base));
    out.push(F(R(x0 + 6, 26, 2, 53, red.sh)));
    out.push(R(x0 - 1, 22, 10, 4, gold.base), F(R(x0 - 1, 25, 10, 1, gold.sh)), R(x0 - 1, 78, 10, 4, gold.base), F(R(x0 - 1, 81, 10, 1, gold.sh)));
  }
  out.push(...archBand(22, 8, red.base, cream, red.sh));
  archPts(22, 12).forEach(([x, y]) => out.push(F(E(x, y, 1.4, 1.4, '#fff3a6')), F(E(x - 0.4, y - 0.4, 0.6, 0.6, '#ffffff'))));
  out.push(T(starPts(30, 4.6, 4.6), gold.base), F(T(starPts(30.5, 5.1, 2.3), gold.hi)));
  for (const [x, s, c] of [[9, 1, '#7fd0ff'], [51, -1, '#8fe6c8']]) out.push(R(x - 0.5, 10, 1, 12, '#7a5a6a'), T([[x, 10], [x + s * 8, 12.5], [x, 15]], c));
  return out;
}

// Moonlit Manor: two dark stone posts with peaked caps, a pointed arch of wrought iron with a curl
// in each shoulder, a lit candle on each post and a crescent moon over the point.
function manorGate() {
  const st = ramp('#8a7aa8', 0.8);
  const iron = '#3a3050';
  const out = [...stones(4, 30, 10, 52, st, 3, { rowH: 9, blockW: 10 }), ...stones(46, 30, 10, 52, st, 6, { rowH: 9, blockW: 10 })];
  for (const x0 of [4, 46]) out.push(T([[x0 - 1, 27], [x0 + 5, 21], [x0 + 11, 27]], st.deep), R(x0 - 1, 27, 12, 4, st.base), F(R(x0 - 1, 30, 12, 1, st.sh)));
  out.push(band([[14, 31], [14.6, 20], [20, 13], [30, 9]], () => 1, iron), band([[46, 31], [45.4, 20], [40, 13], [30, 9]], () => 1, iron));
  out.push(F(band(spiralPts(19.4, 22, 3, 1.15, 1, 18), () => 0.5, iron)), F(band(spiralPts(40.6, 22, 3, 1.15, -1, 18), () => 0.5, iron)));
  out.push(F(T([[30, 9], [28.6, 11.4], [30, 14.4], [31.4, 11.4]], iron)));
  for (const x of [9, 51]) out.push(R(x - 1.3, 14, 2.6, 7, '#fff4e0'), F(R(x + 0.4, 14, 0.9, 7, '#e8dcc8')), F(E(x, 11.6, 1.2, 2, '#ffd36b')), F(E(x, 12.4, 0.5, 0.9, '#ffffff')));
  const P = Math.PI;
  out.push(T([...ovalArcAt(30, 4.4, 3.6, 3.6, 1.2, P * 2 - 1.2), ...ovalArcAt(31.8, 4.4, 3.1, 3.1, P * 2 - 1.28, 1.28)], '#fff3c4'));
  return out;
}

// The Star Observatory: a brass astrolabe ring round the doorway, ticked like a dial, three little
// planets riding it, on slim columns and a stone plinth, a twinkle on top.
function observatoryGate() {
  const brass = ramp('#e8b85a', 0.85);
  const st = ramp('#c8c0e0', 0.75);
  const out = [...stones(3, 74, 54, 8, st, 2, { rowH: 4, blockW: 9 })];
  for (const x0 of [7, 47]) out.push(R(x0, 40, 6, 34, st.base), F(R(x0 + 4, 40, 2, 34, st.sh)), F(R(x0 + 1.4, 42, 1, 30, st.hi)));
  const P = Math.PI;
  const n = 18;
  const at = (a, rx, ry) => [SWX + Math.cos(a) * rx, SWY + Math.sin(a) * ry];
  for (let i = 0; i < n; i++) {
    const a0 = P * 0.78 + (P * 1.44 * i) / n;
    const a1 = P * 0.78 + (P * 1.44 * (i + 1)) / n;
    out.push(T([at(a0, 22.5, 31.5), at(a1, 22.5, 31.5), at(a1, 18.6, 27.6), at(a0, 18.6, 27.6)], brass.base));
    out.push(F(T([at(a0, 19.8, 28.8), at(a1, 19.8, 28.8), at(a1, 18.6, 27.6), at(a0, 18.6, 27.6)], brass.sh)));
    if (i % 2 === 0) out.push(F(T([at(a0, 22.5, 31.5), at(a0 + 0.045, 22.5, 31.5), at(a0 + 0.045, 21, 30), at(a0, 21, 30)], brass.deep)));
  }
  for (const [a, c, r] of [[P * 1.18, '#7fb0ff', 2.6], [P * 1.5, '#ffb07a', 3.2], [P * 1.82, '#c9a6ff', 2.4]]) {
    const [x, y] = at(a, 20.6, 29.6);
    out.push(E(x, y, r, r, c), F(E(x + r * 0.3, y + r * 0.3, r * 0.6, r * 0.6, mix(c, '#3a2d6a', 0.25))), F(E(x - r * 0.35, y - r * 0.35, r * 0.35, r * 0.35, '#ffffff')));
  }
  out.push(T(starPts(30, 9.4, 4.6, 4, 0.32), '#fff3a6'), F(E(30, 9.4, 1, 1, '#ffffff')));
  return out;
}

// The Sunken Aquarium Palace: two branches of coral curling up to meet over the doorway, budding
// side branches, a scallop shell and a few pearls at each foot, a starfish at the top.
function coralGate() {
  const coral = ramp('#ff8fa8', 0.85);
  const coral2 = ramp('#ffb07a', 0.85);
  const out = [];
  out.push(...bark([[10, 82], [9, 64], [11, 44], [15, 30], [22, 19], [30, 15]], (u) => 4.6 - u * 1.8, coral, 2, 0), ...bark([[50, 82], [51, 64], [49, 44], [45, 30], [38, 19], [30, 15]], (u) => 4.6 - u * 1.8, coral, 3, 0));
  for (const [path, r] of [[[[9, 58], [4, 52], [3, 44]], coral2], [[[11, 42], [6, 36], [6, 29]], coral], [[[51, 54], [56, 48], [57, 40]], coral], [[[47, 34], [53, 28], [54, 21]], coral2]]) {
    out.push(...bark(path, (u) => 2.4 - u * 0.8, r, 1, 0));
    const [tx, ty] = path[path.length - 1];
    out.push(E(tx, ty, 1.7, 1.7, r.base), F(E(tx - 0.4, ty - 0.4, 0.7, 0.7, r.hi)));
  }
  for (const [x, s] of [[5, 1], [55, -1]]) {
    out.push(T([[x, 82], ...ovalArcAt(x, 82, 5, 5, Math.PI, Math.PI * 2, 8)], '#ffe6d6'));
    for (let k = 1; k < 5; k++) {
      const a = Math.PI + (k * Math.PI) / 5;
      out.push(F(band([[x, 81.5], [x + Math.cos(a) * 4.2, 82 + Math.sin(a) * 4.2]], () => 0.4, '#f0c0b0')));
    }
    for (const [dx, dy] of [[s * 7.4, -1.3], [s * 9.8, -1.3], [s * 8.6, -3.4]]) out.push(E(x + dx, 82 + dy, 1.3, 1.3, '#fbf6ff'), F(E(x + dx - 0.4, 82 + dy - 0.4, 0.5, 0.5, '#ffffff')));
  }
  out.push(T(starPts(30, 10, 5.4, 5, 0.5), '#ffd36b'), F(T(starPts(30.5, 10.5, 2.8, 5, 0.5), '#ffe9a6')));
  return out;
}

// Cloudcatch Pier and the Sky Whale: two masts standing on puffs of cloud, a sail furled and sagging
// between them with its ties, a pennant on each masthead.
function skyHarborGate() {
  const wood = ramp('#b48a6a', 0.85);
  const sail = ramp('#fff8ec', 0.6);
  const cl = ramp('#ffffff', 0.6);
  const out = [];
  out.push(R(7, 10, 5, 70, wood.base), F(R(10, 10, 2, 70, wood.sh)), R(48, 10, 5, 70, wood.base), F(R(51, 10, 2, 70, wood.sh)));
  const sag = [[8, 15], [18, 19.4], [30, 21.4], [42, 19.4], [52, 15]];
  out.push(band(sag, () => 5, sail.base), F(band(sag.map(([x, y]) => [x, y + 2]), () => 1.6, sail.sh)));
  for (const [x, y] of [[18, 19.4], [30, 21.4], [42, 19.4]]) out.push(F(R(x - 0.6, y - 5, 1.2, 10, '#c9a06a')));
  out.push(T([[9.5, 9], [18, 11.4], [9.5, 14]], '#7fc4ff'), T([[50.5, 9], [42, 11.4], [50.5, 14]], '#ff9ec8'), E(9.5, 9, 1.4, 1.2, wood.base), E(50.5, 9, 1.4, 1.2, wood.base));
  for (const [x, y] of [[5, 79], [12.5, 80.5], [47.5, 80.5], [55, 79]]) out.push(E(x, y, 5.4, 3.6, cl.sh), F(E(x - 0.6, y - 0.6, 4.4, 2.8, cl.base)), F(E(x - 1.6, y - 1.4, 1.8, 1, cl.hi)));
  return out;
}

// Theatre Row, the Dream Theatre's lobby and its stage: gilded columns, a gilded arch studded with
// marquee bulbs, red velvet curtains swagged back to each side with gold tassels, a star on top.
function stageGate() {
  const gold = ramp('#f2c14e', 0.8);
  const velvet = ramp('#c8304e', 0.85);
  const out = [];
  for (const x0 of [5, 47]) out.push(R(x0, 20, 8, 60, gold.base), F(R(x0 + 6, 20, 2, 60, gold.sh)), F(R(x0 + 2, 22, 1, 56, gold.hi)), F(R(x0 + 4, 22, 1, 56, gold.sh)), R(x0 - 1, 78, 10, 4, gold.base), F(R(x0 - 1, 81, 10, 1, gold.sh)), R(x0 - 1, 18, 10, 3, gold.base));
  out.push(...archBand(22, 8, gold.base, mix(gold.base, gold.hi, 0.45), gold.sh, 4));
  archPts(22, 12).forEach(([x, y]) => out.push(F(E(x, y, 1.3, 1.3, '#fff3a6')), F(E(x - 0.4, y - 0.4, 0.55, 0.55, '#ffffff'))));
  for (const s of [1, -1]) {
    const X = (v) => 30 + s * (v - 30);
    out.push(T([[X(13), 20], [X(23), 18.6], [X(17), 32], [X(14), 46], [X(13), 50]], velvet.base), F(T([[X(17), 32], [X(14), 46], [X(13), 50], [X(13), 34]], velvet.sh)));
    out.push(F(band([[X(13.4), 44], [X(17), 45.4]], () => 1.2, gold.base)), E(X(14.6), 50, 1.4, 2, gold.base));
  }
  out.push(T(starPts(30, 4.6, 4.6), gold.base), F(T(starPts(30.5, 5.1, 2.3), gold.hi)));
  return out;
}

// Doors, for rooms: the door swung open against the wall, a frame with a lintel, the opening dark
// round the swirl, a mat at the foot. Each town's rooms in its own wood and paint.
const DOORS = {
  door: { frame: '#c99a6a', door: '#e8b48a', knob: '#ffd36b', mat: '#d8a8b8' },
  crag: { frame: '#e6bd8c', door: '#c47a52', knob: '#ffd36b', mat: '#ff9a6a', stone: true },
  grove: { frame: '#9a8ac8', door: '#c9b6ff', knob: '#fff3c4', mat: '#b8a8e8', vines: true },
  town: { frame: '#c99a6a', door: '#ffb3cf', knob: '#ffd36b', mat: '#c9a6ff' },
};
function doorGate(o, extra = null) {
  const fr = ramp(o.frame, 0.8);
  const dr = ramp(o.door, 0.8);
  const out = [];
  out.push(T([[9, 18], [2, 22], [2, 80], [9, 82]], dr.base), F(T([[2, 22], [3.6, 21.2], [3.6, 80.4], [2, 80]], dr.sh)));
  out.push(F(R(4.6, 30, 2.4, 18, dr.sh)), F(R(4.6, 54, 2.4, 18, dr.sh)), F(R(4.6, 30, 2.4, 1, dr.hi)), F(R(4.6, 54, 2.4, 1, dr.hi)), E(7.4, 52, 1, 1.2, o.knob));
  out.push(...doorOpening(13, 18, 47, 80, mix(o.frame, '#2a2040', 0.62)));
  if (o.stone) out.push(...stones(9, 18, 5, 64, fr, 2, { rowH: 8, blockW: 5 }), ...stones(46, 18, 5, 64, fr, 5, { rowH: 8, blockW: 5 }));
  else out.push(R(9, 18, 5, 64, fr.base), F(R(12, 18, 2, 64, fr.sh)), R(46, 18, 5, 64, fr.base), F(R(49, 18, 2, 64, fr.sh)));
  out.push(R(6, 12, 48, 7, fr.base), F(R(6, 17, 48, 2, fr.sh)), F(R(6, 12, 48, 1.2, fr.hi)), R(8, 9, 44, 3, fr.base));
  if (o.vines) for (const [x, y, k] of [[10, 14, 1], [22, 11, 2], [40, 11, 3], [50, 16, 4], [11, 30, 5]]) out.push(...foliage(x, y, 4, 3, ramp('#9fe0b0'), k, { flat: true }));
  out.push(R(14, 80, 32, 2, o.mat), F(R(14, 81, 32, 1, mix(o.mat, '#3a2d4f', 0.2))));
  if (extra) out.push(...extra);
  return out;
}
// Harbour rooms: a blue cabin door with a porthole, rope wound round the frame.
function cabinDoor() {
  const extra = [E(5.4, 36, 2.6, 3.4, '#7a6a5a'), F(E(5.4, 36, 1.8, 2.6, '#bfe6ff')), F(E(4.8, 35.2, 0.6, 0.8, '#ffffff'))];
  for (const y of [26, 30, 62, 66]) extra.push(F(R(9, y, 5, 1.6, '#e8d29a')), F(R(46, y, 5, 1.6, '#e8d29a')));
  return doorGate({ frame: '#a88a6a', door: '#7fa8e0', knob: '#ffd36b', mat: '#8fb8ff' }, extra);
}
// The Queen's rooms and the Palace at Dawn: a cream door picked out in gold, a little crown over it
// and its curtains tied back.
function palaceDoor() {
  const gold = ramp('#f2c14e', 0.8);
  const extra = [
    T([[24, 9], [26, 3], [28, 7], [30, 2], [32, 7], [34, 3], [36, 9]], gold.base), F(R(24, 7.6, 12, 1.4, gold.sh)), F(E(30, 5.4, 0.9, 0.9, '#ff9ec8')),
    F(R(6, 12, 48, 1, gold.base)), F(R(6, 18, 48, 1, gold.base)), F(R(9, 22, 1, 58, gold.base)), F(R(50, 22, 1, 58, gold.base)),
  ];
  for (const s of [1, -1]) {
    const X = (v) => 30 + s * (v - 30);
    extra.push(T([[X(13), 19], [X(20), 19], [X(14.4), 34], [X(13), 40]], '#ffb3cf'), F(T([[X(14.4), 34], [X(13), 40], [X(13), 30]], '#f08ab0')), E(X(14), 36, 1.2, 1.6, gold.base));
  }
  return doorGate({ frame: '#fff4e6', door: '#ffe6f0', knob: '#f2c14e', mat: '#ffd36b' }, extra);
}

// The Dream Theatre's sets, each a door from her old life.
// The morning train: the car's doors slid back into its walls (their windows showing), a yellow
// safety strip at the threshold, green handrails, the amber door lamp above.
function trainDoor() {
  const steel = ramp('#d8dde8', 0.7);
  const panel = ramp('#c4ccdc', 0.7);
  const out = [R(0, 12, 13, 70, steel.base), R(47, 12, 13, 70, steel.base), F(R(11, 12, 2, 70, steel.sh)), F(R(58, 12, 2, 70, steel.sh))];
  for (const x0 of [2, 48]) out.push(R(x0, 18, 10, 62, panel.base), F(R(x0 + 8, 18, 2, 62, panel.sh)), R(x0 + 2, 24, 6, 20, '#bfe6ff'), F(T([[x0 + 2, 30], [x0 + 6, 24], [x0 + 8, 24], [x0 + 2, 34]], '#e8f8ff')));
  out.push(...doorOpening(13, 16, 47, 80, '#3a3a52'));
  out.push(R(10, 10, 40, 6, steel.base), F(R(10, 14, 40, 2, steel.sh)), E(30, 7.6, 2.6, 2, '#ffb84a'), F(E(29.4, 7, 1, 0.8, '#fff3c4')));
  out.push(R(13, 79, 34, 3, '#ffd34a'));
  for (let x = 14; x < 46; x += 5) out.push(F(T([[x, 82], [x + 2, 79], [x + 3.4, 79], [x + 1.4, 82]], '#4a4a5e')));
  out.push(R(14.4, 24, 1.6, 44, '#7fd8a0'), F(R(15.4, 24, 0.6, 44, '#5fb880')), R(44, 24, 1.6, 44, '#7fd8a0'), F(R(45, 24, 0.6, 44, '#5fb880')));
  return out;
}
// The office: a grey metal frame, the door swung open, a green EXIT sign lit above it and a light
// switch beside it.
function officeDoor() {
  const extra = [R(21, 1.6, 18, 7.4, '#4ac07a'), F(R(22, 2.6, 16, 5.4, '#7fe0a0')), F(R(24, 4, 2, 2.6, '#ffffff')), F(R(27, 4, 2, 2.6, '#ffffff')), F(R(30, 4, 2, 2.6, '#ffffff')), F(R(33, 4, 3.4, 2.6, '#ffffff')), R(53, 44, 4, 6, '#e8eaf0'), F(R(54.4, 45.4, 1.2, 3.2, '#b8bcc8'))];
  return doorGate({ frame: '#9aa0b4', door: '#d8b48a', knob: '#e8eaf0', mat: '#8a90a4' }, extra);
}
// The convenience store, two in the morning: its glass doors slid open to the sides, the shop's own
// stripes over them and a lit OPEN 24 sign.
function storeDoor() {
  const out = [R(0, 14, 13, 68, '#e8eef4'), R(47, 14, 13, 68, '#e8eef4')];
  for (const x0 of [1.5, 47.5]) out.push(R(x0, 18, 10, 62, '#ffffff'), R(x0 + 1.4, 20, 7.2, 58, '#cfeefc'), F(T([[x0 + 1.4, 34], [x0 + 7, 22], [x0 + 8.6, 22], [x0 + 1.4, 40]], '#effaff')), F(R(x0 + 4, 46, 2, 6, '#9fb8c8')));
  out.push(...doorOpening(13, 16, 47, 80, '#2e3a4a'));
  out.push(R(4, 6, 52, 10, '#f4f6fa'), F(R(4, 11, 52, 3, '#7fd0a8')), F(R(4, 14, 52, 2, '#ff9a4a')));
  out.push(R(18, 1, 24, 7, '#ff6f7a'), F(R(19, 2, 22, 5, '#ff8f98')));
  for (const [x, w] of [[20.4, 2.4], [23.6, 2.4], [26.8, 2.4], [30, 2.4], [33.8, 1.6], [36.2, 2.4]]) out.push(F(R(x, 3.2, w, 2.6, '#ffffff')));
  out.push(R(14, 80, 32, 2, '#7fd0a8'));
  return out;
}
// Her flat: a lilac front door with a peephole, a key on a hook, her slippers left at the mat and a
// little cactus in a pot on the frame over the door.
function flatDoor() {
  const extra = [
    F(E(5.4, 34, 0.8, 0.8, '#3a2d4f')),
    R(52, 40, 4, 1.4, '#c9a06a'), F(R(53.6, 41.4, 0.8, 3, '#c9a06a')), E(54, 45.6, 1.4, 1.4, '#ffd36b'), F(E(54, 45.6, 0.6, 0.6, '#c9a06a')),
    E(18, 80.6, 3.2, 1.5, '#ff9ec8'), F(E(19, 80, 1.6, 0.7, '#ffffff')), E(24.4, 80.8, 3.2, 1.5, '#ff9ec8'), F(E(25.4, 80.2, 1.6, 0.7, '#ffffff')),
    E(30, 3.4, 2.8, 3.6, '#8fd0a0'), F(E(31.2, 4.2, 1.3, 2.2, '#6fb080')), F(E(29.4, 0.9, 0.7, 0.6, '#ff9ec8')), R(26.5, 5.6, 7, 3.6, '#e8a07a'), F(R(26.5, 8.2, 7, 1, '#c8805a')),
  ];
  return doorGate({ frame: '#f4eefc', door: '#b8a6e0', knob: '#ffd36b', mat: '#ffd6ea' }, extra);
}
// Moonlit Manor's halls: a tall door of dark wood under a pointed stone gable, a candle burning in a
// sconce on each side.
function manorDoor() {
  const extra = [T([[6, 12], [30, 1], [54, 12]], '#6a5a88'), F(T([[12, 11], [30, 3.4], [48, 11]], '#8a7aa8')), F(E(30, 8, 2.4, 2.4, '#3a3050')), F(E(30, 8, 1.4, 1.4, '#fff3c4'))];
  for (const x of [11.5, 48.5]) extra.push(R(x - 2.4, 40, 4.8, 1.6, '#3a3050'), R(x - 1, 33, 2, 7, '#fff4e0'), F(E(x, 31, 1, 1.8, '#ffd36b')), F(E(x, 31.8, 0.45, 0.8, '#ffffff')));
  return doorGate({ frame: '#7a6a98', door: '#8a5a6a', knob: '#ffd36b', mat: '#9a5a7a' }, extra);
}
