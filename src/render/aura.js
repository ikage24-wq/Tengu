// Idle auras for advanced jobs: a quiet touch around a hero who stands still, layered behind
// ('back') and in front of ('front') the sprite. They stay small, soft, and slow: a glow at the
// feet, a few motes drifting up, and for third jobs a signature: a rune ring with crackling
// lightning or dancing flames, or a halo and angel wings. Warrior paths: a ring of light diamonds
// for the Paladin, red flames and rising embers for the Berserker. Archer paths: a band of wind and
// drifting leaves for the Ranger, a slow sight ring for the Sniper.
// Nothing flashes, and nothing covers the face. Everything is drawn from time alone.
// (x, y) is the hero's feet in screen space, s the draw scale, k the fade (0-1).

import { fxSprite } from './fx-sprites.js';
import { lightPillar, songRing } from './warrior-fx.js';

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
  // Phantom Trickster: a faint drift of silver sparkles and cards round her.
  beastmaster: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celptaura', x, y - 22 * s, { t: t * 0.6, scale: s * 0.35, alpha: k * 0.35 }),
    front: () => {},
  },
  // Stormcaller: faint arcs of lightning crackling round her feet.
  stormcaller: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celringstorm', x, y, { frame: 2, scale: s * 0.4, sy: 0.32, alpha: k * 0.5 }),
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

// Illusion (the Phantom Trickster; internally Bond): silver sparkles drift up round her as it
// builds (her copies are drawn by render/scene.js); full, two cards turn round her and her badge, a
// top hat with a card, shines over her head.
function bondAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') return;
  if (k > 0.2 && k < 1) fxSprite(ctx, 'celptaura', x, y - 22 * s, { frame: Math.floor(t * 6) % 8, scale: s * 0.4, alpha: Math.min(0.6, (k - 0.2) * 1.5) });
  if (k >= 1) {
    fxSprite(ctx, 'celptaura', x, y - 22 * s, { t, scale: s * 0.55 });
    fxSprite(ctx, 'celembphantom', x, y - 62 * s, { frame: 1, scale: s * 0.28, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
  }
}

// Pressure (the Arbalist Engineer; internally Charge): little puffs of steam escape at her feet as
// it builds, more and quicker the fuller it is; full (Overdrive), steam pours off her in bursts and
// her badge, a brass cog with a crossbow, turns over her head.
function chargeAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.2) for (let i = 0; i < (k >= 1 ? 3 : 1 + Math.floor(k * 2)); i++) {
      const u = (t * (0.8 + k) + i / 3) % 1;
      fxSprite(ctx, 'celaesteam', x + (i - 1) * 9 * s, y - 2 * s, { p: u, scale: s * (0.075 + 0.05 * k), alpha: Math.min(1, (k - 0.2) * 2) * (1 - u * 0.5) });
    }
    return;
  }
  if (k >= 1) fxSprite(ctx, 'celembgear', x, y - 62 * s, { frame: 1, scale: s * 0.3, rot: t * 1.5, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Valor: a steel ring at his feet widening as it builds, steel chevrons and diamonds rising round
// him from halfway, and full (Unbroken), the steel emblem over his head and rings racing out
// again and again.
function valorAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celring', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celring', x, y, { t: t % 0.6, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.5) fxSprite(ctx, 'celvalor', x, y, { t, scale: s * (0.6 + 0.3 * k), alpha: Math.min(1, (k - 0.5) * 2.5) });
  if (k >= 1) fxSprite(ctx, 'celembsteel', x, y - 62 * s, { frame: 1, scale: s * 0.32, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Combo (the Acrobat Archer; internally Momentum): a mint ribbon swirling flat round her feet as it
// builds, faster the fuller it is; full (Showtime), gold stars and the ribbon twirl round her and her
// badge, a gold star with a ribbon and an arrow, shines over her head.
function momentumAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15 && k < 1) fxSprite(ctx, 'celacaura', x, y, { frame: Math.floor(t * (4 + 8 * k)) % 8, scale: s * (0.4 + 0.25 * k), alpha: Math.min(0.8, (k - 0.15) * 2) });
    return;
  }
  if (k >= 1) {
    fxSprite(ctx, 'celacaura', x, y - 22 * s, { t: t * 1.4, scale: s * 0.6 });
    fxSprite(ctx, 'celembacro', x, y - 62 * s, { frame: 1, scale: s * 0.3, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
  }
}

// Encore (the Wind Dancer; internally the Thief's Shadow): a ring of coral and cream ribbons
// swirls flat round her feet as it builds, spinning faster the fuller it is; full (Standing
// Ovation), the ribbons whirl on and on and her badge, a chakram tied with a bow, shines over her
// head.
function shadowAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15 && k < 1) fxSprite(ctx, 'celwdswirl', x, y, { frame: 4, scale: s * (0.28 + 0.19 * k), sy: 0.3, alpha: Math.min(1, (k - 0.15) * 2), rot: t * (0.5 + k) });
    if (k >= 1) fxSprite(ctx, 'celwdswirl', x, y, { t: (t * 0.6) % 0.3, scale: s * 0.5, sy: 0.3 });
    return;
  }
  if (k >= 1) fxSprite(ctx, 'celembdancer', x, y - 62 * s, { frame: 1, scale: s * 0.32, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Mayhem (the Mage; internally Spirit, docs/design/mage-line.md): sparks of her three elements
// fizz up off her as it builds, more and faster the fuller it is (kept out to her sides, off her
// face); full (Meltdown), her three element sigils whirl round her feet and the sparks pour up.
const MAYHEM_SPARKS = ['#ffb43c', '#9ae2ff', '#ffe04a'];
function spiritAura(ctx, x, y, t, s, k, layer) {
  if (k < 0.05) return;
  const full = k >= 1;
  if (full) {
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + (i * Math.PI * 2) / 3;
      const front = Math.sin(a) > 0;
      if ((layer === 'back') === front) continue;
      fxSprite(ctx, `celrm${['fire', 'ice', 'bolt'][i]}`, x + Math.cos(a) * 16 * s, y - 3 * s + Math.sin(a) * 4 * s, { t: t + i, scale: s * 0.3, alpha: 0.9 });
    }
  }
  if (layer === 'back') return;
  motes(ctx, x, y, t, s, 0.45 + 0.55 * k, { n: 1 + Math.round(5 * k), spread: 16, inner: 9, height: 22 + 16 * k, speed: 0.5 + 0.8 * k, size: 1 + 0.5 * k, draw: (c, mx, my, r, i) => { c.fillStyle = MAYHEM_SPARKS[i % 3]; c.fillRect(mx - r / 2, my - r / 2, r, r); } });
}

// Devotion (the Cleric; internally Grace, docs/design/mage-line.md): little red and green plus-
// crosses drifting up beside her as it builds, more of them the fuller it is (out at her sides, off
// her face); full, a soft red glow at her feet and the crosses pour up.
function graceAura(ctx, x, y, t, s, k, layer) {
  if (k < 0.05) return;
  if (layer === 'back') {
    if (k >= 1) footGlow(ctx, x, y, s * 1.2, '#ff6a74', 0.45 + 0.15 * Math.sin(t * 4));
    return;
  }
  motes(ctx, x, y, t, s, 0.5 + 0.5 * k, { n: 1 + Math.round(4 * k), spread: 17, inner: 11, height: 26 + 14 * k, speed: 0.35 + 0.4 * k, size: 1.4 + 0.4 * k, draw: (c, mx, my, r, i) => {
    c.fillStyle = i % 2 ? '#ff6a74' : '#5ae08a';
    const w = Math.max(1, r * 0.45);
    c.fillRect(mx - r / 2, my - w / 2, r, w);
    c.fillRect(mx - w / 2, my - r / 2, w, r);
  } });
}

// Spellstorm (the Sorcerer; internally Binding): a violet shadow pooling round her feet, darker the
// fuller it is, with embers rising off it, more and faster as it builds; full (Spellstorm), an ember
// ring turns at her feet and the embers stream up round her (kept out to her sides, off her face).
function bindingAura(ctx, x, y, t, s, k, layer) {
  if (k < 0.05) return;
  const full = k >= 1;
  if (layer === 'back') {
    footGlow(ctx, x, y, s * (1 + 0.4 * k), '#7a4ad8', 0.35 + 0.45 * k);
    if (full) runeRing(ctx, x, y, t * 2, s * 1.2, '#ff8a3a', 0.85, false);
    return;
  }
  if (full) runeRing(ctx, x, y, t * 2, s * 1.2, '#ff8a3a', 0.85, true);
  motes(ctx, x, y, t, s, 0.5 + 0.5 * k, { n: 2 + Math.round(4 * k), spread: 16, inner: 9, height: 30 + 14 * k, speed: 0.4 + 0.5 * k, size: 1.1 + 0.4 * k, draw: (c, mx, my, r, i) => { c.fillStyle = i % 2 ? '#ffd27a' : '#ff8a3a'; c.fillRect(mx - r / 2, my - r / 2, r, r); } });
}

// Ricochet (the Blade Dancer; internally Ki): a small ring skims round her feet as it builds,
// faster the fuller it is; full (Carousel), two rings orbit her waist, passing in front of her and
// behind, and her badge, two linked rings, shines over her head.
function kiAura(ctx, x, y, t, s, k, layer) {
  const full = k >= 1;
  const n = full ? 2 : k > 0.15 ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const a = t * (full ? 5 : 2 + 2 * k) + i * Math.PI;
    if (Math.sin(a) > 0 !== (layer === 'front')) continue;
    const rx = (full ? 26 : 16) * s;
    const ry = (full ? 7 : 4) * s;
    fxSprite(ctx, 'celbdring', x + Math.cos(a) * rx, y - (full ? 20 : 3) * s + Math.sin(a) * ry, { t: t + i * 0.1, flip: Math.sin(a) > 0, scale: s * (full ? 0.7 : 0.45), alpha: full ? 1 : Math.min(1, (k - 0.15) * 2) });
  }
  if (full && layer === 'front') fxSprite(ctx, 'celembblade', x, y - 62 * s, { frame: 1, scale: s * 0.3, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Tailwind (the Sky Dancer; internally Tails): a whirlwind of wind rings gathers under her feet as
// it builds, turning faster the fuller it is; full, it grows into the whirlwind she rides through
// the air, and her badge, a wing over a cloud, shines over her head.
function tailsAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15 && k < 1) fxSprite(ctx, 'celskywhirl', x, y + 4 * s, { t: t * (0.6 + 0.8 * k), scale: s * (0.22 + 0.16 * k), alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celskywhirl', x, y + 6 * s, { t: t * 1.6, scale: s * 0.46 });
    return;
  }
  if (k >= 1) fxSprite(ctx, 'celembsky', x, y - 62 * s, { frame: 1, scale: s * 0.3, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Draws a combat aura: `kind` a job's gauge ('ki', 'tails', 'valor', 'momentum', 'shadow', 'rage', 'faith' or
// 'bond' or 'charge'), `k` how full (0-1).
const COMBAT = { grace: graceAura, binding: bindingAura, spirit: spiritAura, ki: kiAura, tails: tailsAura, valor: valorAura, momentum: momentumAura, shadow: shadowAura, rage: rageAura, faith: faithAura, bond: bondAura, charge: chargeAura };
export function drawCombatAura(ctx, kind, layer, x, y, time, scale, k, dir = 1) {
  if (k <= 0.02 || !COMBAT[kind]) return;
  ctx.save();
  COMBAT[kind](ctx, x, y, time, scale, Math.min(1, k), layer, dir);
  ctx.restore();
}
