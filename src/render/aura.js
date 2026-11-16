// Idle auras for advanced jobs: a quiet touch around a hero who stands still, layered behind
// ('back') and in front of ('front') the sprite. They stay small, soft, and slow: a glow at the
// feet, a few motes drifting up, and for third jobs a signature: a rune ring with crackling
// lightning or dancing flames, or a halo and angel wings. Warrior paths: a ring of light diamonds
// for the Paladin, red flames and rising embers for the Berserker. Archer paths: a band of wind and
// drifting leaves for the Ranger, a slow sight ring for the Sniper.
// Nothing flashes, and nothing covers the face. Everything is drawn from time alone.
// (x, y) is the hero's feet in screen space, s the draw scale, k the fade (0-1).

import { fxSprite } from './fx-sprites.js';
import { lightPillar } from './warrior-fx.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// A soft oval of light on the ground.
function footGlow(ctx, x, y, s, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.scale(1, 0.28);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * s);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 16 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// A thin ring on the ground with tick marks turning slowly, split into a back and a front half
// so the hero stands inside it.
function runeRing(ctx, x, y, t, s, color, a, front) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, 0.8 * s);
  const rx = 15 * s;
  const ry = 4 * s;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU + t * 0.4;
    const sin = Math.sin(ang);
    if (front !== sin > 0) continue;
    ctx.fillRect(x + Math.cos(ang) * rx - 0.5 * s, y + sin * ry - 1.2 * s, s, 1.6 * s);
  }
  ctx.restore();
}

// A few small motes drifting up around the hero and fading. `draw(ctx, x, y, r, i)` paints one.
// `inner` keeps them that far out to either side, clear of the face.
function motes(ctx, x, y, t, s, a, { n = 4, spread = 14, height = 34, speed = 0.35, size = 1.3, inner = 0, draw }) {
  for (let i = 0; i < n; i++) {
    const cyc = t * speed + i / n;
    const u = cyc % 1;
    const seed = Math.floor(cyc) * 7 + i;
    const h = hash(seed) - 0.5;
    const off = inner ? Math.sign(h || 1) * (inner + Math.abs(h) * 2 * (spread - inner)) : h * spread * 2;
    const mx = x + off * s + Math.sin(t * 1.5 + i) * 2 * s;
    const my = y - (4 + u * height) * s;
    ctx.save();
    ctx.globalAlpha = a * Math.sin(u * Math.PI);
    draw(ctx, mx, my, size * s, i, t);
    ctx.restore();
  }
}

const sparkle = (color) => (ctx, x, y, r) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.8);
  ctx.quadraticCurveTo(x, y, x + r * 1.8, y);
  ctx.quadraticCurveTo(x, y, x, y + r * 1.8);
  ctx.quadraticCurveTo(x, y, x - r * 1.8, y);
  ctx.quadraticCurveTo(x, y, x, y - r * 1.8);
  ctx.fill();
};

// Each job: its glow color and what it does on each layer.
const JOBS = {
  // Paladin: a few diamonds of light drifting up round her, faintly.
  paladin: {
    back: () => {},
    front: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celmotes', x, y, { t: t * 0.6, scale: s * 0.5, alpha: k * 0.5 }),
  },
  // Berserker: a few embers drifting up round him, faintly.
  berserker: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celembers', x, y, { t: t * 0.5, scale: s * 0.45, alpha: k * 0.45 }),
    front: () => {},
  },
  // The Game Master: a faint ring and a few stars in every color.
  gamemaster: {
    back: (ctx, x, y, t, s, k) => {
      footGlow(ctx, x, y, s, '#d2b8ff', k * 0.8);
      runeRing(ctx, x, y, t, s, '#d2b8ff', k * 0.75, false);
    },
    front: (ctx, x, y, t, s, k) => {
      runeRing(ctx, x, y, t, s, '#d2b8ff', k * 0.75, true);
      motes(ctx, x, y, t, s, k, { n: 4, draw: (c, mx, my, r, i) => sparkle(['#ff9ec0', '#8fe3ff', '#ffe36b', '#9fe0b0'][i % 4])(c, mx, my, r) });
    },
  },
};

// Jobs that have an idle aura.
export const AURA_JOBS = new Set(Object.keys(JOBS));

export function drawJobAura(ctx, job, layer, x, y, time, scale, k) {
  const def = JOBS[job];
  if (!def?.[layer] || k <= 0) return;
  ctx.save();
  def[layer](ctx, x, y, time, scale, k);
  ctx.restore();
}


// ---------- Combat auras: power that builds as the fight goes on ----------
// A Berserker's Rage and a Paladin's Faith show on the hero in stages (0-1, `k`), in a fight as well
// as at rest. Rage: a red heat glow, then flames licking up around the body, then flames climbing
// to the shoulders with embers streaming off; full (Berserk) adds a pulsing ring. Faith: a warm
// glow, then a turning ring of light diamonds, then a halo and slow rays behind; full (Sanctified)
// adds wings of light.


// Rage, in Tengu's own effect art (fx-sprites.js), demonic and meant to frighten, in three stages:
// as it builds, black smoke curls up round his feet and embers climb; from halfway, a flame
// aura burns up round his whole body, behind him and see-through so he shows inside it (the way a
// Dragon Ball fighter powers up), never over him; full (Berserk), the
// ground splits open in cracks of ember light round him, and a jagged shockwave rips out with every heartbeat
// (the screen's edges thump in time; ui/hud.js).
function rageAura(ctx, x, y, t, s, k, layer) {
  const fire = Math.min(1, (k - 0.5) * 2.5);
  // The flame aura flickers a little as it burns.
  const flicker = 0.9 + 0.1 * Math.sin(t * 17) * Math.sin(t * 7.3);
  if (layer === 'back') {
    if (k >= 1) {
      fxSprite(ctx, 'celragecracks', x, y, { t, scale: s * 0.9, sy: 0.6, alpha: 0.95 });
    }
    if (k > 0.1) fxSprite(ctx, 'celembers', x, y, { t, scale: s * (0.4 + 0.3 * k), alpha: Math.min(1, (k - 0.1) * 2) });
    if (k >= 1 && heartbeat(t) < 1) fxSprite(ctx, 'celshockred', x, y, { p: heartbeat(t), scale: s * 0.9, sy: 0.32 });
    if (k > 0.5) fxSprite(ctx, 'celragefire', x, y + 4 * s, { t, scale: s * (0.8 + 0.55 * k), alpha: fire * 0.62 * flicker });
    return;
  }
  // (No lick of flame over him any more, the all-class pass: even faint, it burned across his
  // face. The fire burns behind him only.)
}

// Where a heart's beat is (0-1 through each thump), lub-dub about 70 beats a minute: two quick
// pulses close together, then a rest. Shared with the screen's Berserk edges (ui/hud.js).
export function heartbeat(t) {
  const c = t % 0.86;
  return c < 0.18 ? c / 0.18 : c < 0.34 ? (c - 0.18) / 0.16 : 1;
}

// Faith: a golden ring at her feet, diamonds of light rising round her as Faith builds, and full
// (Sanctified), the golden magic circle under her and a pillar of light rising through her again
// and again.
function faithAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.25) fxSprite(ctx, 'celringholy', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.25) * 2) });
    if (k >= 1) {
      fxSprite(ctx, 'celcircle', x, y, { frame: 0, scale: s * 0.5, sy: 0.3, alpha: 0.85 });
      lightPillar(ctx, 'celpillarholy', x, y, (t % 1.1) / 1.1, 70 * s);
    }
    return;
  }
  if (k > 0.4) fxSprite(ctx, 'celmotes', x, y, { t, scale: s * 0.6, alpha: Math.min(1, (k - 0.4) * 2.5) });
}

// Tide (the Tide Mage): a whirlpool turns flat round her feet as it builds, wider and faster the
// fuller it is; full (High Tide), it runs at full size and bubbles rise round her.
function tideAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celtmwhirlbig', x, y + 2 * s, { frame: Math.floor(t * (5 + 6 * k)) % 8 > 5 ? 3 : 2 + (Math.floor(t * (5 + 6 * k)) % 4), scale: s * (0.12 + 0.12 * k), alpha: Math.min(0.85, (k - 0.15) * 2) });
    return;
  }
  if (k >= 1) for (let i = 0; i < 3; i++) {
    const u = (t * 0.7 + i / 3) % 1;
    fxSprite(ctx, 'celtmbubble', x + (i - 1) * 12 * s + Math.sin(t * 3 + i) * 3 * s, y - (8 + 46 * u) * s, { frame: i, scale: s * 0.28, alpha: 1 - u });
  }
}

// Moondust (the Moon Moth): wing dust drifting slowly down round her as it builds, more the fuller
// it runs; full (Full Moon), three moths circle her, passing behind her and in front.
function mothAura(ctx, x, y, t, s, k, layer) {
  if (k >= 1) for (let i = 0; i < 3; i++) {
    const a = t * 1.6 + (i / 3) * Math.PI * 2;
    const front = Math.sin(a) >= 0;
    if (front !== (layer === 'front')) continue;
    fxSprite(ctx, 'celmmmoth', x + Math.cos(a) * 20 * s, y - (30 + 6 * Math.sin(t * 2.4 + i * 2)) * s + Math.sin(a) * 5 * s, { t: t + i * 0.13, flip: Math.sin(a) > 0, scale: s * 0.3 });
  }
  if (layer !== 'front' || k <= 0.2) return;
  for (let i = 0; i < 2 + Math.floor(k * 3); i++) {
    const u = (t * 0.35 + i / 5) % 1;
    fxSprite(ctx, 'celmmdustfleck', x + (i - 2) * 9 * s + Math.sin(t * 1.4 + i) * 4 * s, y - (54 - 48 * u) * s, { t: t + i * 0.3, scale: s * 0.5, alpha: Math.min(1, (k - 0.2) * 2) * Math.min(1, u * 5) * (1 - u) });
  }
}

// Melody (the Songbird): notes drifting up round her as it builds, a bluebird circling her from
// halfway; full (Chorus), a little ring of notes turns behind her head.
function melodyAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celsbhalo', x - 4 * s, y - 62 * s, { t, scale: s * 0.55 });
    return;
  }
  if (k > 0.5) {
    const a = t * 1.6;
    fxSprite(ctx, 'celsbbirdloop', x + Math.cos(a) * 20 * s, y - (36 + 5 * Math.sin(t * 2.3)) * s + Math.sin(a) * 4 * s, { t, flip: Math.sin(a) > 0, scale: s * 0.3, alpha: Math.min(1, (k - 0.5) * 3) });
  }
  if (k <= 0.2) return;
  for (let i = 0; i < 1 + Math.floor(k * 3); i++) {
    const u = (t * 0.35 + i / 4) % 1;
    fxSprite(ctx, 'celsbnotefloat', x + (i - 1.5) * 11 * s + Math.sin(t * 1.4 + i) * 5 * s, y - (10 + 50 * u) * s, { t: t + i * 0.4, scale: s * 0.45, alpha: Math.min(1, (k - 0.2) * 2) * Math.min(1, u * 5) * (1 - u) });
  }
}

// Kindling (the Phoenix): embers rising round her as it builds, a little fire bird circling her from
// halfway; full (Blaze), a flame burns behind her head.
function kindlingAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celphhalo', x - 4 * s, y - 58 * s, { t, scale: s * 0.55 });
    return;
  }
  if (k > 0.5) {
    const a = t * 1.7;
    fxSprite(ctx, 'celphbirdloop', x + Math.cos(a) * 20 * s, y - (36 + 5 * Math.sin(t * 2.3)) * s + Math.sin(a) * 4 * s, { t, flip: Math.sin(a) > 0, scale: s * 0.3, alpha: Math.min(1, (k - 0.5) * 3) });
  }
  if (k <= 0.2) return;
  for (let i = 0; i < 2 + Math.floor(k * 3); i++) {
    const u = (t * 0.45 + i / 5) % 1;
    fxSprite(ctx, 'celphember', x + (i - 2) * 9 * s + Math.sin(t * 1.6 + i) * 4 * s, y - (8 + 50 * u) * s, { t: t + i * 0.3, scale: s * 0.5, alpha: Math.min(1, (k - 0.2) * 2) * Math.min(1, u * 5) * (1 - u) });
  }
}

// Daybreak (the Sunfeather): feathers of light drifting down round her as it builds, a sunbird
// fluttering round her from halfway; full (Sunrise), a small sun glows behind her head.
function daybreakAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celsfhalo', x - 4 * s, y - 62 * s, { t, scale: s * 0.55 });
    return;
  }
  if (k > 0.5) {
    const a = t * 1.6;
    fxSprite(ctx, 'celsfbirdloop', x + Math.cos(a) * 20 * s, y - (36 + 5 * Math.sin(t * 2.3)) * s + Math.sin(a) * 4 * s, { t, flip: Math.sin(a) > 0, scale: s * 0.3, alpha: Math.min(1, (k - 0.5) * 3) });
  }
  if (k <= 0.2) return;
  for (let i = 0; i < 1 + Math.floor(k * 3); i++) {
    const u = (t * 0.3 + i / 4) % 1;
    fxSprite(ctx, 'celsffeather', x + (i - 1.5) * 11 * s + Math.sin(t * 1.3 + i) * 5 * s, y - (58 - 52 * u) * s, { t: t + i * 0.4, scale: s * 0.45, alpha: Math.min(1, (k - 0.2) * 2) * Math.min(1, u * 5) * (1 - u) });
  }
}

// Spool (the Silkweaver): a pearl thread winding round her in a slow loop as it builds, a pearl moth
// circling her from halfway; full (Full Spool), a little pearl moon like a spool glows behind her head.
function spoolAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celsvhalo', x - 4 * s, y - 62 * s, { t, scale: s * 0.55 });
    return;
  }
  if (k > 0.5) {
    const a = t * 1.5;
    fxSprite(ctx, 'celsvmoth', x + Math.cos(a) * 18 * s, y - (34 + 5 * Math.sin(t * 2.2)) * s + Math.sin(a) * 4 * s, { t, flip: Math.sin(a) > 0, scale: s * 0.28, alpha: Math.min(1, (k - 0.5) * 3) });
  }
  if (k <= 0.2) return;
  fxSprite(ctx, 'celsvloop', x, y - 28 * s, { t, scale: s * 0.5, alpha: Math.min(1, (k - 0.2) * 2) });
}

// Umbra (the Eclipse): gold flecks sinking round her as it builds, a dark moth with gold crescents
// circling her from halfway; full (Totality), a small eclipse burns behind her head.
function umbraAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celechalo', x - 4 * s, y - 62 * s, { t, scale: s * 0.55 });
    return;
  }
  if (k > 0.5) {
    const a = t * 1.7;
    fxSprite(ctx, 'celecmoth', x + Math.cos(a) * 18 * s, y - (32 + 5 * Math.sin(t * 2.2)) * s + Math.sin(a) * 4 * s, { t, flip: Math.sin(a) > 0, scale: s * 0.28, alpha: Math.min(1, (k - 0.5) * 3) });
  }
  if (k <= 0.2) return;
  for (let i = 0; i < 2 + Math.floor(k * 3); i++) {
    const u = (t * 0.35 + i / 5) % 1;
    fxSprite(ctx, 'celecdust', x + (i - 2) * 9 * s + Math.sin(t * 1.4 + i) * 4 * s, y - (54 - 48 * u) * s, { t: t + i * 0.3, scale: s * 0.5, alpha: Math.min(1, (k - 0.2) * 2) * Math.min(1, u * 5) * (1 - u) });
  }
}

// Depth (the Maelstrom): glowing motes of the deep rise round her as it builds, more the deeper it
// runs; full (the Abyss), a small vortex turns at her feet.
function depthAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celmsvortexsmall', x, y + 2 * s, { frame: 8 + (Math.floor(t * 20) % 12), scale: s * 0.55, alpha: 0.8 });
    return;
  }
  if (k > 0.2) for (let i = 0; i < 2 + Math.floor(k * 3); i++) {
    const u = (t * 0.6 + i / 5) % 1;
    fxSprite(ctx, 'celmsglow', x + (i - 2) * 9 * s + Math.sin(t * 2 + i) * 3 * s, y - (6 + 44 * u) * s, { frame: i * 4, scale: s * 0.18, alpha: Math.min(1, (k - 0.2) * 2) * (1 - u) });
  }
}

// Moonsong (the Tidecaller): pearls of moonlit water rising round her as it builds, and full
// (Spring Tide), a ring of moonlight turning at her feet.
function moonAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celtcring', x, y + 2 * s, { frame: Math.floor(t * 24) % 24, scale: s * 0.5, alpha: 0.85 });
    return;
  }
  if (k > 0.2) for (let i = 0; i < 2 + Math.floor(k * 3); i++) {
    const u = (t * 0.5 + i / 5) % 1;
    fxSprite(ctx, 'celtcmote', x + (i - 2) * 9 * s + Math.sin(t * 1.6 + i) * 4 * s, y - (6 + 46 * u) * s, { frame: i * 5, scale: s * 0.2, alpha: Math.min(1, (k - 0.2) * 2) * (1 - u) });
  }
}

// Valor: a steel ring at his feet widening as it builds, steel chevrons and diamonds rising round
// him from halfway, and full (Unbroken), the steel emblem over his head and rings racing out
// again and again.
function bulwarkAura(ctx, x, y, t, s, k, layer) {
  // Thunderhead (the Stormwall; internally Bulwark): a storm cloud gathering over his head as it
  // builds, growing and darkening, lit from inside; full (Eye of the Storm), lightning ringing his feet.
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celbwring', x, y + 2 * s, { frame: Math.floor(t * 24) % 24, scale: s * 0.55, alpha: 0.85 });
    return;
  }
  if (k > 0.3) fxSprite(ctx, 'celbwcloud', x, y - 82 * s, { frame: Math.floor(t * 20) % 24, scale: s * (0.42 + 0.22 * k), alpha: Math.min(1, (k - 0.3) * 2.2) });
}

function galeAura(ctx, x, y, t, s, k, layer) {
  // Velocity (the Tempest; internally Gale): red sparks streaming back off him as it builds, quicker
  // the fuller it runs; full (Lightspeed), red static crackling over him.
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celtpshell', x, y + 2 * s, { frame: Math.floor(t * 24) % 24, scale: s * 0.6, alpha: 0.85 });
    return;
  }
  if (k > 0.2) for (let i = 0; i < 1 + Math.floor(k * 4); i++) {
    const u = (t * (1 + 1.5 * k) + i / 5) % 1;
    fxSprite(ctx, 'celtpmote', x + (i - 2) * 7 * s - u * 16 * s, y - (10 + 30 * u + i * 5) * s, { frame: (i * 5 + Math.floor(t * 24)) % 24, scale: s * 0.18, alpha: Math.min(1, (k - 0.2) * 2) * (1 - u) });
  }
}

function voltAura(ctx, x, y, t, s, k, layer) {
  // Charge (the Thunderguard; internally Volt): static sparks crackling up round him as it builds,
  // more and quicker the fuller it runs; full (Overcharge), a shell of static crackling round him.
  if (layer === 'back') {
    if (k >= 1) fxSprite(ctx, 'celtgshell', x, y + 2 * s, { frame: Math.floor(t * 24) % 24, scale: s * 0.62, alpha: 0.9 });
    return;
  }
  if (k > 0.2) for (let i = 0; i < 1 + Math.floor(k * 4); i++) {
    const u = (t * (0.8 + k) + i / 5) % 1;
    fxSprite(ctx, 'celtgmote', x + (i - 2) * 8 * s + Math.sin(t * 3 + i * 2) * 4 * s, y - (8 + 44 * u) * s, { frame: (i * 5 + Math.floor(t * 24)) % 24, scale: s * 0.2, alpha: Math.min(1, (k - 0.2) * 2) * (1 - u) });
  }
}

// Draws a combat aura: `kind` a job's gauge (see COMBAT), `k` how full (0-1).
const COMBAT = { volt: voltAura, gale: galeAura, bulwark: bulwarkAura, rage: rageAura, faith: faithAura, tide: tideAura, moon: moonAura, depth: depthAura, moondust: mothAura, umbra: umbraAura, spool: spoolAura, daybreak: daybreakAura, kindling: kindlingAura, melody: melodyAura };
export function drawCombatAura(ctx, kind, layer, x, y, time, scale, k, dir = 1) {
  if (k <= 0.02 || !COMBAT[kind]) return;
  ctx.save();
  COMBAT[kind](ctx, x, y, time, scale, Math.min(1, k), layer, dir);
  ctx.restore();
}
