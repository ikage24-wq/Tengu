// The warrior paths' effects (and the skill power-ups and buff casts every class shares), in
// Tengu's own effect art (tools/fx-art.js, the `cel*` strips): soft pastel shapes matched to the
// sprites' pixel size and outlines, each a short run of key drawings that pops in, holds, then
// breaks up into beads and sparkles (docs/art/README.md). The Warrior is steel blue and white, the
// Paladin gold, the Berserker rose red (and the Archer's buffs warm gold and sky blue).
//
// Drawn from progress `p` (0-1) and a seed; (x, y) is a monster's feet for per-target effects and
// the hero's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { drawTideFx } from './tide-fx.js';
import { drawMothFx } from './moth-fx.js';
import { drawStormFx } from './storm-fx.js';
import { rockBurst } from './blade-fx.js';

const SCHOOLS = new Set(['holy', 'rage', 'ice', 'storm']);
const tint = (school) => (SCHOOLS.has(school) ? school : school === 'gold' ? 'holy' : '');
// The schools drawn as real light, fire and motion (no outlined cartoon dust): the Warrior's steel,
// the Paladin's light, the Berserker's fire.
const REAL = new Set(['steel', 'holy', 'rage']);
// A ring of force and a pillar of light in a school's colour (steel is the plain one).
export const ringOf = (school) => `celring${tint(school)}`;
export const pillarSprite = (school) => `celpillar${tint(school)}`;
// A Warrior effect in a path's own colour: steel for the Warrior, gold for the Paladin, blood red
// for the Berserker (they share the Warrior's skills).
export const pathTint = (school, steel, gold, red) => (school === 'holy' ? gold : school === 'rage' ? red : steel);
// The emblem rising in a path's pillar.
const EMBLEMS = { holy: 'celembholy', rage: 'celembrage', steel: 'celembsteel', storm: 'celembstorm' };

// Pixel art keeps its pixel size: effects that play large have big versions drawn large (`*big`
// strips), so scales stay near 1.
const BIG = new Set(['celshockred', 'celringstorm', 'celring', 'celringholy', 'celringrage', 'celringmint']);


// A ring of force racing out flat along the ground to radius `r`.
export function groundRing(ctx, name, x, y, p, r, { sy = 0.32, alpha = 1 } = {}) {
  if (r > 60 && BIG.has(name)) fxSprite(ctx, `${name}big`, x, y, { p, scale: r / (38 * 2.6), sy, alpha });
  else fxSprite(ctx, name, x, y, { p, scale: r / 38, sy, alpha });
}

// A path's wave racing out along the ground to radius `r`: a smooth ring in the school's colour,
// but the Berserker's is a ring of jagged teeth (his shapes are torn, never smooth or lit).
export function groundWave(ctx, school, x, y, p, r) {
  groundRing(ctx, school === 'rage' ? 'celshockred' : ringOf(school), x, y, p, r);
}

// A pillar of light bursting up out of the ground at (x, y), about `h` tall.
export function lightPillar(ctx, name, x, y, p, h = 100) {
  fxSprite(ctx, name, x, y, { p, scale: h / 103 });
}

// A buff or power going up, as MapleStory draws it: a pillar of the school's light from the feet,
// a ring racing out along the ground, the path's emblem rising inside.
// The Berserker's power has no pillar of light (that's the Paladin's): fire flares up at his feet,
// a jagged shockwave rips out, embers climb round him and his emblem rises through them.
export function pillarOf(ctx, school, x, y, p, { h = 90 } = {}) {
  if (school === 'rage') {
    rageFlare(ctx, x, y, p, h);
    return;
  }
  groundRing(ctx, ringOf(school), x, y, Math.min(1, p * 1.3), 40);
  lightPillar(ctx, pillarSprite(school), x, y, p, h);
  const emblem = EMBLEMS[school];
  if (emblem && p > 0.15) fxSprite(ctx, emblem, x, y - 44 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.55 });
}

export function rageFlare(ctx, x, y, p, h = 90, time = p) {
  const fade = p < 0.75 ? 1 : (1 - p) / 0.25;
  groundWave(ctx, 'rage', x, y, Math.min(1, p * 1.4), 46);
  fxSprite(ctx, 'celragefire', x, y, { t: time, scale: 0.45 + 0.25 * Math.min(1, p * 4), alpha: fade });
  fxSprite(ctx, 'celembers', x, y, { t: p * 1.2, scale: h / 85, alpha: fade });
  if (p > 0.15) fxSprite(ctx, EMBLEMS.rage, x, y - 44 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.55 });
}

// Torn ground where a heavy blow lands, about `w` wide: dust and rock thrust up (gold for a
// Paladin's blow), but a Berserker's tears the earth open in three glowing claw gashes.
export function debris(ctx, x, y, p, w, school = null) {
  if (school === 'rage') {
    if (w > 120) fxSprite(ctx, 'celgashbig', x, y, { p, scale: w / (95 * 1.7) });
    else fxSprite(ctx, 'celgash', x, y, { p, scale: w / 95 });
    return;
  }
  const name = pathTint(school, 'celquake', 'celquakegold', 'celquakered');
  if (w > 120) fxSprite(ctx, `${name}big`, x, y, { p, scale: w / (88 * 1.8) });
  else fxSprite(ctx, name, x, y, { p, scale: w / 88 });
}

// A hit landing on a monster in a path's colour: the Warrior's cross of blades, the Paladin's
// star of light, the Berserker's claw marks, a burst for anyone else.
export function hitMark(ctx, school, x, y, p, { big = false, seed = 0.5, dir = 1 } = {}) {
  const k = big ? 1.15 : 0.85;
  // (The Paladin's star is drawn smaller than the others' marks: its rays reach far, and full size
  // on a monster beside her it swallowed her.)
  if (school === 'holy') fxSprite(ctx, 'celholyhit', x, y, { p, scale: k * 0.6 });
  // (The Berserker's claw marks a size smaller and each torn at its own angle, the all-class pass:
  // the same big red X on every blow read as spam.)
  else if (school === 'rage') fxSprite(ctx, 'celclaw', x, y, { p, scale: k * 0.62, rot: (seed - 0.5) * 0.9, flip: dir < 0 });
  else fxSprite(ctx, 'celcross', x, y, { p, scale: k, rot: (seed - 0.5) * 0.8 });
}

export function drawWarriorFx(ctx, f, x, y, p, cam, time) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const seed = f.seed ?? 0.5;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  if ((f.kind.startsWith('tm') || f.kind.startsWith('ms') || f.kind.startsWith('tc')) && drawTideFx(ctx, f, x, y, p)) return true;
  // The Moon Moth's moths (render/moth-fx.js).
  if (f.kind.startsWith('mm') && drawMothFx(ctx, f, x, y, p)) return true;
  // The Thunderguard's lightning (render/storm-fx.js).
  if ((f.kind.startsWith('tg') || f.kind.startsWith('tp') || f.kind.startsWith('bw')) && drawStormFx(ctx, f, x, y, p, cam)) return true;
  switch (f.kind) {
    // The Wind Dancer's (coral and cream): her mark on each monster hit, the swirl of ribbons, the
    // crescent gust down the line, and Grand Finale's spotlight and rose of ribbons.
    case 'shock':
      // A finisher's shockwave racing out to the edge of its reach (world/melee.js), capped so it
      // never draws a thin line right across the screen (the player found those ugly).
      return fxSprite(ctx, f.name, x, y + 2, { p, scale: Math.min(f.r, 150) / 99 }) || true;
    case 'rxjump': {
      if (f.t < 0) return true;
      const tx = f.tx - cam.x;
      const ty = f.ty - cam.y;
      const n = 6;
      const fade = Math.min(1, (1 - p) * 3);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const j = i && i < n ? Math.sin(i * 12.9 + Math.floor(f.t * 30)) * 7 : 0;
        const px = x + (tx - x) * u;
        const py = y + (ty - y) * u - Math.sin(u * Math.PI) * 18 + j;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.strokeStyle = '#7a4a2a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = '#ffe04a';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      return true;
    }
    // On a monster, her cloud; as a blow's burst all round her (`f.r`), clouds bursting at both edges
    // of its reach, clear of her face (the wind ring out to its reach comes from world/melee.js).
    case 'powerup': {
      // Power bursting out as a skill begins: a pillar of the path's light with its emblem, and a
      // ring of fire for rage.
      pillarOf(ctx, f.school, x, y, p, { h: f.big ? 110 : 85 });
      if (f.school === 'rage') fxSprite(ctx, 'celragefire', x, y, { t: time, scale: f.big ? 0.8 : 0.6, alpha: p < 0.8 ? 1 : (1 - p) / 0.2 });
      return true;
    }
    case 'chargetrail': {
      // A dash: speed streaks along the path, dust kicked up behind, a burst where it ends.
      const tx = f.tx - cam.x;
      const len = Math.abs(tx - x);
      fxSprite(ctx, f.school === 'rage' ? 'celstreakred' : f.school === 'holy' ? 'celstreakgold' : 'celstreak', (x + tx) / 2, y - 18, { p, flip, sx: len / 100 });
      if (REAL.has(f.school)) fxSprite(ctx, 'celquake', x, y + 8, { p, flip: !flip, scale: 0.4 });
      else fxSprite(ctx, 'celdust', x, y, { p, flip: !flip, scale: 0.8 });
      fxSprite(ctx, f.school === 'rage' ? 'celhitred' : f.school === 'holy' ? 'celholyhit' : 'celhit', tx + dir * 10, y - 22, { p, scale: 0.8 });
      return true;
    }
    case 'vortex': {
      // A whirlwind of blades over the area: spin slashes turning through it, stacked up.
      if (!box) return true;
      const cx = box.x + box.w / 2;
      const name = pathTint(f.school, 'celspinbig', 'celspingoldbig', 'celspinredbig');
      for (let i = 0; i < 3; i++) fxSprite(ctx, name, cx, box.y + box.h - 10 - i * 20, { t: time * (1 + i * 0.3) + i * 0.2, scale: (box.w / 164) * (1 - i * 0.12), sy: 0.35, flip: i % 2 === 1 });
      return true;
    }
    case 'pillar': {
      // A pillar of light on the monster, a star of light bursting in it.
      lightPillar(ctx, 'celpillarholy', x, y, p, 120);
      fxSprite(ctx, 'celholyhit', x, y - 26, { p: Math.min(1, p * 1.4), scale: 0.5 });
      return true;
    }
    case 'aegis': {
      // A shield of light snapping up in front of the shove, then shattering into hexes.
      fxSprite(ctx, 'celshield', x + dir * 20, y - 30, { p, scale: 0.95, sx: 0.7 });
      return true;
    }
    case 'shieldwall': {
      // Shield Rush: a wall of golden light held up before the Paladin as she marches (it travels
      // with her), shimmering, with a soft column of light behind it; it shatters as she plants.
      const pp = p < 0.12 ? (p / 0.12) * 0.36 : p < 0.86 ? 0.4 + 0.04 * Math.sin(time * 14) : 0.57 + ((p - 0.86) / 0.14) * 0.43;
      const a = p < 0.86 ? 1 : 1 - (p - 0.86) / 0.14;
      lightPillar(ctx, 'celpillarholy', x + dir * 2, y, Math.min(0.5, 0.25 + p * 0.3), 80);
      const up = Math.min(1, p / 0.12);
      if (p < 0.86) fxSprite(ctx, 'cellightwall', x, y + 2, { t: time, scale: 0.78 * up, sx: 0.85, flip, alpha: up });
      else fxSprite(ctx, 'celshield', x, y - 34, { p: pp, scale: 1.3, sx: 0.6, flip, alpha: Math.max(0.3, a) });
      return true;
    }
    case 'shieldslam': {
      // The Paladin's shield slam: a great honeycomb shield of light drops out of the air flat onto
      // them and slams into the ground, a star of light bursts where it lands, a golden ring races
      // out and diamonds of light rise, then the shield shatters.
      const r = f.r ?? 92;
      const fall = Math.min(1, p / 0.14);
      fxSprite(ctx, 'celshield', x, y - 30 - 60 * (1 - fall * fall), { p: Math.min(1, p * 1.1), scale: 1.15, sx: 0.85 });
      if (p > 0.12) {
        groundWave(ctx, 'holy', x, y, (p - 0.12) / 0.88, r * 1.2);
        fxSprite(ctx, 'celholyhit', x, y - 16, { p: (p - 0.12) / 0.88, scale: 1.3 });
        fxSprite(ctx, 'celmotes', x, y, { t: time, scale: r / 60, alpha: 1 - p });
      }
      return true;
    }
    case 'consecrate': {
      // Hallowed ground: the golden magic circle on the floor, a ring racing out, pillars of light
      // at its edges and diamonds of light rising.
      const r = f.r ?? 110;
      const a = (p < 0.1 ? p / 0.1 : 1) * (p > 0.75 ? (1 - p) / 0.25 : 1);
      // (Softer and behind her, the all-class pass: the full-strength circle, ring and pillars
      // washed her out in gold.)
      fxSprite(ctx, 'celcirclebig', x, y, { frame: 0, scale: r / 105, sy: 0.3, alpha: a * 0.55 });
      groundRing(ctx, 'celringholy', x, y, p, Math.min(r, 130), { alpha: 0.7 * (1 - p * 0.5) });
      for (const sd of [-1, 1]) lightPillar(ctx, 'celpillarholy', x + sd * r * 0.7, y, Math.min(1, p * 1.2), 70);
      fxSprite(ctx, 'celmotes', x, y, { t: time, scale: r / 70, alpha: a * 0.8 });
      return true;
    }
    case 'verdict': {
      // Grand Verdict: a great sword of light drives down out of the sky into the ground and
      // shatters, a cross of light bursts where it lands, over the blazing magic circle, with
      // pillars of light in a wide ring and a ring racing out.
      const r = f.r ?? 170;
      const a = (p < 0.08 ? p / 0.08 : 1) * (p > 0.75 ? (1 - p) / 0.25 : 1);
      // (Behind her, softer, two pillars instead of four, the all-class pass: she vanished in it.)
      fxSprite(ctx, 'celcirclebig', x, y, { frame: 0, scale: r / 105, sy: 0.3, alpha: a * 0.55 });
      groundRing(ctx, 'celringholy', x, y, p, Math.min(r, 150), { alpha: 0.7 * (1 - p * 0.5) });
      for (const sd of [-1, 1]) lightPillar(ctx, 'celpillarholy', x + sd * r * 0.75, y, Math.min(1, p * 1.1), 100);
      const fall = Math.min(1, p / 0.12);
      fxSprite(ctx, 'celsword', x, y + 4 - 160 * (1 - fall * fall), { p: p < 0.3 ? 0 : (p - 0.3) / 0.7, scale: 1.1 });
      if (p > 0.1) fxSprite(ctx, 'cellightcross', x, y - 40, { p: (p - 0.1) / 0.9, scale: 0.8 });
      return true;
    }
    case 'verdicthalo': {
      // Grand Verdict's sun: a great halo of light rising and opening over the kneeling Paladin.
      fxSprite(ctx, 'celhalo', x, y - 80 - 14 * Math.min(1, p * 2), { p, scale: 0.75 });
      return true;
    }
    case 'axethrow': {
      // Crimson Eclipse's throw: the axe spinning out in front and right round him in a great
      // circle (dragging them in), then back to his hand.
      const th = Math.PI * 2 * (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2);
      const R = 95 * Math.min(1, Math.sin(Math.PI * p) * 1.8);
      fxSprite(ctx, 'celaxewheel', x + dir * Math.cos(th) * R, y - 30 + Math.sin(th) * R * 0.3, { t: time, scale: 0.9, flip });
      return true;
    }
    case 'bloodmoon': {
      // The Berserker's moon: a crimson eclipse swelling in the sky behind the axe, and a giant axe
      // of fire flying together out of embers over him, held until he smashes it down ('eclipse').
      const s = Math.min(1, p * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      fxSprite(ctx, 'celeclipse', x - dir * 8, y - 130, { t: time, scale: 1.1 * s, alpha: s });
      if (p < 0.48) fxSprite(ctx, 'celrageaxeform', x + dir * 40, y - 70, { p: Math.min(1, p / 0.3), scale: 0.62, flip, alpha: p > 0.42 ? (0.48 - p) / 0.06 : 1 });
      return true;
    }
    case 'eclipse': {
      // The crash under the moon: the giant axe of fire driven head-first into the ground and
      // shattering, claw marks torn huge across the ground, the ground gashed open, fire bursting
      // and a jagged shockwave ripping out.
      const r = f.r ?? 175;
      const fall = Math.min(1, p / 0.1);
      fxSprite(ctx, 'celrageaxe', x, y + 6 - 110 * (1 - fall * fall), { p: p < 0.25 ? 0 : (p - 0.25) / 0.75, scale: 1, flip });
      // (The claw gashes torn out ahead of him, not across him; and no shockwave ring of its own:
      // the aftershock's one follows, the all-class pass: two huge red rings stacked buried him.)
      fxSprite(ctx, 'celclawbig', x + dir * 60, y - 40, { p, scale: 0.9, flip });
      debris(ctx, x, y, p, r * 0.9, 'rage');
      fxSprite(ctx, 'celragefire', x, y, { t: time, scale: 0.8, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      return true;
    }
    case 'gather': {
      // Power gathering at the weapon hand before a big blow: lines of the path's light rushing
      // in to a swelling diamond.
      const name = f.school === 'holy' ? 'celchargegold' : f.school === 'rage' ? 'celchargered' : 'celcharge';
      fxSprite(ctx, name, x + dir * 12, y - 20, { t: time, scale: f.big ? 0.9 : 0.7, alpha: p < 0.15 ? p / 0.15 : 1 });
      return true;
    }
    case 'ragehit': {
      // A Berserker's blow: a fiery cut across the target, sparks flying on the heavy ones.
      const cy = y - (f.h ?? 24) / 2;
      hitMark(ctx, 'rage', x, cy, p, { big: f.big, seed, dir });
      if (f.big) fxSprite(ctx, 'celblood', x + dir * 6, cy, { p, scale: 0.55, flip });
      return true;
    }
    case 'holyhit': {
      // A Paladin's blow: a star of light bursting on the target.
      hitMark(ctx, 'holy', x, y - (f.h ?? 24) / 2, p, { big: f.big, seed, dir });
      return true;
    }
    case 'formburst': {
      // A form's overflow: power bursting out at the end of a swing, a flash inside a jagged ring of
      // force (blood red in Demon Form, gold in Judgment).
      fxSprite(ctx, pathTint(f.school, 'celhit', 'celholyhit', 'celhitred'), x, y, { p, scale: 1.35, rot: (seed - 0.5) * 0.8, flip });
      fxSprite(ctx, pathTint(f.school, 'celshout', 'celshoutgold', 'celshoutred'), x, y, { p: Math.min(1, p * 1.3), scale: 0.45 });
      return true;
    }
    case 'rageburst': {
      // Rage breaks out of the blow: the ground torn open, fire bursting up out of it, embers
      // flying and a jagged shockwave ripping out.
      const r = Math.min(150, Math.max(70, f.r ?? 90));
      debris(ctx, x, y, p, r * 0.9, 'rage');
      fxSprite(ctx, 'celragefire', x, y, { t: time, scale: r / 90, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      fxSprite(ctx, 'celembers', x, y, { t: p, scale: r / 80, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      groundRing(ctx, 'celshockred', x, y, p, r * 0.85, { alpha: 0.75 * (1 - p * 0.5) });
      return true;
    }
    case 'quake': {
      // The ground ruptures: rock thrust up along the area (or under the monster) with dust.
      if (box) {
        const n = Math.max(1, Math.round(box.w / 90));
        for (let i = 0; i < n; i++) debris(ctx, box.x + ((i + 0.5) / n) * box.w, box.y + box.h, Math.min(1, p * 1.1 + i * 0.04), Math.min(110, box.w / n));
        return true;
      }
      debris(ctx, x, y, p, 70);
      return true;
    }
    default:
      return false;
  }
}
