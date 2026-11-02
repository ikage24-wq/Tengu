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
  // Beastmaster: a slow, faint curl of wind and leaves at her feet.
  beastmaster: {
    back: (ctx, x, y, t, s, k) => fxSprite(ctx, 'celwindspin', x, y - 2 * s, { t: t * 0.6, scale: s * 0.5, sy: 0.3, alpha: k * 0.6 }),
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
// Dragon Ball fighter powers up), with only a faint lick of it over him; full (Berserk), the
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
  if (k > 0.5) fxSprite(ctx, 'celragefire', x, y + 4 * s, { t: t + 0.3, scale: s * (0.8 + 0.55 * k), alpha: fire * 0.16 * flicker });
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

// Bond, in Tengu's own effect art: a curl of wind spinning at her feet that widens and quickens
// as it fills, leaves blowing past from halfway, and full (Wild), rings of wind racing out from
// her feet.
function bondAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celwindspin', x, y - 2 * s, { t: t * (1 + k), scale: s * (0.5 + 0.4 * k), sy: 0.3, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celringwind', x, y, { t: t % 0.5, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.5) fxSprite(ctx, 'celleaves', x + Math.sin(t * 1.7) * 6 * s, y - 14 * s, { t: (t * 0.9) % 0.45, flip: Math.floor((t * 0.9) / 0.45) % 2 === 1, scale: s * (0.4 + 0.2 * k), alpha: Math.min(1, (k - 0.5) * 2.5) });
}

// Pressure (the Arbalist Engineer; internally Charge): little puffs of steam escape at her feet as
// it builds, more and quicker the fuller it is; full (Overdrive), steam pours off her in bursts and
// her badge, a brass cog with a crossbow, turns over her head.
function chargeAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.2) for (let i = 0; i < (k >= 1 ? 3 : 1 + Math.floor(k * 2)); i++) {
      const u = (t * (0.8 + k) + i / 3) % 1;
      fxSprite(ctx, 'celaesteam', x + (i - 1) * 9 * s, y - 2 * s, { p: u, scale: s * (0.18 + 0.12 * k), alpha: Math.min(1, (k - 0.2) * 2) * (1 - u * 0.5) });
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

// Momentum: a sky-blue ring at her feet, gold feathers circling her on a ring of wind as it
// builds, and full (Hawkeye), the hawk emblem over her head and gold rings racing out.
function momentumAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celringsky', x, y, { frame: 2, scale: s * (0.35 + 0.25 * k), sy: 0.32, alpha: Math.min(1, (k - 0.15) * 2) });
    if (k >= 1) fxSprite(ctx, 'celringhawk', x, y, { t: t % 0.5, scale: s * 0.8, sy: 0.32 });
    return;
  }
  if (k > 0.4) fxSprite(ctx, 'celmomentum', x, y, { t: t * (0.8 + 0.6 * k), scale: s * (0.55 + 0.25 * k), alpha: Math.min(1, (k - 0.4) * 2.5) });
  if (k >= 1) fxSprite(ctx, 'celembhawk', x, y - 62 * s, { frame: 1, scale: s * 0.32, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Encore (the Wind Dancer; internally the Thief's Shadow): a ring of coral and cream ribbons
// swirls flat round her feet as it builds, spinning faster the fuller it is; full (Standing
// Ovation), the ribbons whirl on and on and her badge, a chakram tied with a bow, shines over her
// head.
function shadowAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15 && k < 1) fxSprite(ctx, 'celwdswirl', x, y, { frame: 4, scale: s * (0.45 + 0.3 * k), sy: 0.3, alpha: Math.min(1, (k - 0.15) * 2), rot: t * (0.5 + k) });
    if (k >= 1) fxSprite(ctx, 'celwdswirl', x, y, { t: (t * 0.6) % 0.3, scale: s * 0.8, sy: 0.3 });
    return;
  }
  if (k >= 1) fxSprite(ctx, 'celembdancer', x, y - 62 * s, { frame: 1, scale: s * 0.32, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Constellation (the Star Witch; internally Spirit): its stars light one by one over her head as it
// builds, seven in all, joined by threads of gold; full, it glows and her badge, a witch's hat with a
// gold star, shines in the middle of it.
function spiritAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back' || k < 0.05) return;
  const lit = Math.min(7, Math.floor(k * 7 + 1e-9));
  fxSprite(ctx, 'celstconst', x, y - 62 * s + Math.sin(t * 1.6) * 1.5 * s, { frame: lit, scale: s * 0.46, alpha: 0.9 });
  if (k >= 1) fxSprite(ctx, 'celembwitch', x, y - 78 * s, { frame: 1, scale: s * 0.28, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
}

// Applause (the Starlight Idol; internally Grace): a pink ring at her feet that fills in as the
// crowd's cheer builds, turning faster the fuller it is; full (Live Show), hearts and notes circle
// her and her badge, a heart with a note on it, shines over her head.
function graceAura(ctx, x, y, t, s, k, layer) {
  if (layer === 'back') {
    if (k > 0.15) fxSprite(ctx, 'celsisong', x, y + 2, { frame: Math.floor(t * (4 + 6 * k)) % 10, scale: s * (0.3 + 0.18 * k), alpha: Math.min(0.85, (k - 0.15) * 2) });
    return;
  }
  if (k >= 1) {
    fxSprite(ctx, 'celsiaura', x, y - 26 * s, { t, scale: s * 0.5, alpha: 0.9 });
    fxSprite(ctx, 'celembidol', x, y - 66 * s, { frame: 1, scale: s * 0.28, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
  }
}

// Orbit (the Astronomer; internally Binding): her moons, one for every fifth of it, riding a flat
// orbit round her middle (the same one world/astro.js sends them out from), the ones behind her
// drawn behind, a faint silver orbit line under them; full (Full Orbit), her badge, a ringed planet
// with a moon, shines over her head.
function bindingAura(ctx, x, y, t, s, k, layer) {
  const n = Math.min(5, Math.floor(k * 5 + 1e-9));
  if (layer === 'back' && k > 0.05) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.3 * k;
    ctx.strokeStyle = '#d4d8ee';
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.ellipse(x, y - 22 * s, 26 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < n; i++) {
    const a = t * 0.9 + (i / n) * Math.PI * 2;
    if ((Math.sin(a) > 0) !== (layer !== 'back')) continue;
    fxSprite(ctx, 'celasmoon', x + Math.cos(a) * 26 * s, y - 22 * s + Math.sin(a) * 7 * s, { t: t + i, scale: s * (0.3 + 0.05 * Math.sin(a)) });
  }
  if (layer !== 'back' && k >= 1) fxSprite(ctx, 'celembastro', x, y - 66 * s, { frame: 1, scale: s * 0.28, alpha: 0.75 + 0.25 * Math.sin(t * 6) });
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
