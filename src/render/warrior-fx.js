// The warrior paths' effects (and the skill power-ups and buff casts every class shares), in
// Tengu's own effect art (tools/fx-art.js, the `cel*` strips): soft pastel shapes matched to the
// sprites' pixel size and outlines, each a short run of key drawings that pops in, holds, then
// breaks up into beads and sparkles (docs/art/README.md). The Warrior is steel blue and white, the
// Paladin gold, the Berserker rose red (and the Archer's buffs warm gold and sky blue).
//
// Drawn from progress `p` (0-1) and a seed; (x, y) is a monster's feet for per-target effects and
// the hero's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { drawArbalistFx } from './arbalist-fx.js';
import { rockBurst } from './blade-fx.js';
import { dancerHit, cloudRing, springTrail } from './dancer-fx.js';

const SCHOOLS = new Set(['holy', 'rage', 'ice', 'wind', 'shadow', 'hawk', 'storm', 'ink', 'fox', 'spirit']);
const tint = (school) => (SCHOOLS.has(school) ? school : school === 'gold' ? 'holy' : school === 'focus' ? 'ice' : '');
// The schools drawn as real light, fire and motion (no outlined cartoon dust): the Warrior's steel,
// the Paladin's light, the Berserker's fire.
const REAL = new Set(['steel', 'holy', 'rage']);
// A ring of force and a pillar of light in a school's colour (steel is the plain one).
export const ringOf = (school) => `celring${tint(school)}`;
export const pillarSprite = (school) => `celpillar${tint(school)}`;
// A Warrior effect in a path's own colour: steel for the Warrior, gold for the Paladin, blood red
// for the Berserker (they share the Warrior's skills).
export const pathTint = (school, steel, gold, red) => (school === 'holy' || school === 'hawk' ? gold : school === 'rage' ? red : steel);
// The emblem rising in a path's pillar.
const EMBLEMS = { phantom: 'celembphantom', acro: 'celembacro', brass: 'celembgear', aerial: 'celembsky', rosegold: 'celembblade', coral: 'celembdancer', holy: 'celembholy', rage: 'celembrage', steel: 'celembsteel', hawk: 'celembhawk', wind: 'celembwind', storm: 'celembstorm', shadow: 'celembshadow', ink: 'celembink', fox: 'celembfox' };

// Pixel art keeps its pixel size: effects that play large have big versions drawn large (`*big`
// strips), so scales stay near 1.
const BIG = new Set(['celshockred', 'celringstorm', 'celring', 'celringholy', 'celringrage', 'celringwind', 'celringhawk', 'celringshadow', 'celringmint', 'celringink', 'celringfox']);


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
  // The Phantom Trickster's: no pillar, a puff of stage smoke with her badge rising out of it.
  if (school === 'phantom') {
    fxSprite(ctx, 'celptsmoke', x, y + 4, { p, scale: 0.4 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.phantom, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Acrobat Archer's: no pillar, a firework going off over her with her badge rising.
  if (school === 'acro') {
    fxSprite(ctx, 'celacfirework', x, y - 40, { p, scale: 0.4 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.acro, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Arbalist Engineer's: no pillar, a burst of steam with her badge turning in it.
  if (school === 'brass') {
    fxSprite(ctx, 'celaesteam', x, y + 4, { p, scale: 0.45 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.brass, x, y - 44 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5, rot: p * 2 });
    return;
  }
  // The Sky Dancer's: no pillar, a whirlwind rising under her with her badge over it.
  if (school === 'aerial') {
    fxSprite(ctx, 'celskywhirl', x, y + 4, { t: p * 1.2, scale: 0.6, alpha: p < 0.8 ? 1 : (1 - p) / 0.2 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.aerial, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Blade Dancer's: no pillar, a ricochet flash and a ring popping out, her badge rising.
  if (school === 'rosegold') {
    fxSprite(ctx, 'celbdbounce', x, y - 26, { p, scale: 0.8 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.rosegold, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Wind Dancer's: no pillar, her swirl of ribbons with her badge rising out of it.
  if (school === 'coral') {
    fxSprite(ctx, 'celwdswirl', x, y - 26, { p, scale: 0.56 });

    if (p > 0.15) fxSprite(ctx, EMBLEMS.coral, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
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
// star of light, the Berserker's claw marks, the Thief's violet X, a burst for anyone else.
export function hitMark(ctx, school, x, y, p, { big = false, seed = 0.5, dir = 1 } = {}) {
  const k = big ? 1.15 : 0.85;
  // (The Paladin's star is drawn smaller than the others' marks: its rays reach far, and full size
  // on a monster beside her it swallowed her.)
  if (school === 'holy') fxSprite(ctx, 'celholyhit', x, y, { p, scale: k * 0.6 });
  // (The Berserker's claw marks a size smaller and each torn at its own angle, the all-class pass:
  // the same big red X on every blow read as spam.)
  else if (school === 'rage') fxSprite(ctx, 'celclaw', x, y, { p, scale: k * 0.62, rot: (seed - 0.5) * 0.9, flip: dir < 0 });
  else if (school === 'shadow') fxSprite(ctx, 'celshadowhit', x, y, { p, scale: k, rot: (seed - 0.5) * 0.6 });
  else if (school === 'ink') fxSprite(ctx, 'celinkhit', x, y, { p, scale: k * 0.85, rot: (seed - 0.5) * 1.2, flip: dir < 0 });
  else if (school === 'brass') fxSprite(ctx, 'celaehit', x, y, { p, scale: k * 0.6 });
  else if (school === 'phantom') fxSprite(ctx, 'celpthit', x, y, { p, scale: k * 0.55, rot: (seed - 0.5) * 0.4 });
  else if (school === 'acro') dancerHit(ctx, school, x, y, p, { big, seed, dir, scale: k * 0.5 });
  else if (school === 'aerial') dancerHit(ctx, school, x, y, p, { big, seed, dir, scale: k * 0.6 });
  else if (school === 'rosegold') dancerHit(ctx, school, x, y, p, { big, seed, dir, scale: k * 0.7 });
  else if (school === 'coral') dancerHit(ctx, school, x, y, p, { big, seed, dir, scale: k * 0.7 });
  else fxSprite(ctx, 'celcross', x, y, { p, scale: k, rot: (seed - 0.5) * 0.8 });
}

export function drawWarriorFx(ctx, f, x, y, p, cam, time) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const seed = f.seed ?? 0.5;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  if ((f.kind === 'aehit' || f.kind === 'aesteam' || f.kind === 'aeclockfx') && drawArbalistFx(ctx, f, x, y, p)) return true;
  switch (f.kind) {
    // The Wind Dancer's (coral and cream): her mark on each monster hit, the swirl of ribbons, the
    // crescent gust down the line, and Grand Finale's spotlight and rose of ribbons.
    case 'wdhit':
      return dancerHit(ctx, 'coral', x, y - (f.h ?? 40) * 0.55, p, { big: f.big || f.crit, seed, dir, scale: 0.6 });
    // Her swirl and her gusts are drawn as far as the blow reaches (`f.r`, its reach): the swirl
    // round her out to it (a wide one flattened round her waist), the gust racing down the line to
    // its end.
    case 'wdswirl': {
      const r = f.r ?? 70;
      if (r > 110) return fxSprite(ctx, 'celwdswirlbig', x, y - 44, { p, scale: r / 184, sy: 0.42 }) || true;
      return fxSprite(ctx, 'celwdswirl', x, y - 26, { p, scale: r / 74, sy: r > 80 ? 0.7 : 1 }) || true;
    }
    case 'wdgust':
      return fxSprite(ctx, 'celwdgustfar', x - dir * 10, y - 28, { p, flip, scale: ((f.r ?? 130) * 0.8) / 150 }) || true;
    // A puff of wind off her palms (each blow with gloves): a smaller crescent gust out to the blow's reach.
    case 'wdpuff':
      return fxSprite(ctx, 'celwdgustfar', x - dir * 10, y - 26, { p, flip, scale: ((f.r ?? 95) * 0.8) / 150 }) || true;
    case 'wdfinale':
      return fxSprite(ctx, 'celwdfinale', x, y + 4, { p }) || true;
    case 'shock':
      // A finisher's shockwave racing out to the edge of its reach (world/melee.js), capped so it
      // never draws a thin line right across the screen (the player found those ugly).
      return fxSprite(ctx, f.name, x, y + 2, { p, scale: Math.min(f.r, 150) / 99 }) || true;
    case 'aehit':
      return fxSprite(ctx, 'celaehit', x, y - (f.h ?? 40) * 0.55, { p, scale: f.big || f.crit ? 0.7 : 0.5 }) || true;
    case 'aeboom':
      // (as wide as the blast: a sticky bolt's 50-80 px, a bomblet's ~30)
      return fxSprite(ctx, 'celaeboom', x, y + 2, { p, scale: f.small ? 0.4 : 0.85 }) || true;
    case 'aesteam':
      // (Steam Vent's blast, `big`, is as wide as it reaches; a muzzle puff, `small`, still reads.)
      return fxSprite(ctx, 'celaesteam', x, y + 2, { p, scale: f.big ? 1.15 : f.small ? 0.18 : 0.4, flip }) || true;
    case 'aestick': {
      // A sticky bolt stuck in the monster, its teal light blinking faster as it's about to burst.
      const m = f.mob;
      const sx = (m ? m.x - cam.x : x) - 4;
      const sy = (m ? m.y - (m.air ?? 0) - m.def.h / 2 - cam.y : y - 20);
      return fxSprite(ctx, 'celaebolt', sx, sy, { frame: 0, scale: 0.32, rot: 0.6, alpha: 0.6 + 0.4 * Math.sin(p * p * 40) }) || true;
    }
    case 'aeballista':
      // (Behind her and set well back, so the whole machine shows and she stands at its crank.)
      return fxSprite(ctx, 'celaeballista', x - dir * 34, y + 4, { p, scale: 0.85, flip }) || true;
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
    case 'skyhit':
      if (f.r) {
        const cx = x - dir * f.r * 0.3;
        for (const s of [-1, 1]) fxSprite(ctx, 'celskyhit', cx + s * f.r * 0.72, y - 22, { p, scale: 0.75, flip: s < 0 });
        return true;
      }
      return dancerHit(ctx, 'aerial', x, y - (f.h ?? 40) * 0.55, p, { big: f.big || f.crit, seed, dir, scale: 0.5 });
    case 'skyupdraft':
      fxSprite(ctx, 'celskywhirlbig', x, y + 4, { t: p * 0.9, scale: (f.r ?? 80) / 127, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      return fxSprite(ctx, 'celskyhit', x, y - 40, { p, scale: 0.8 }) || true;
    case 'sddownburst':
      // Downburst: the ring slapping down where she lands and the wind bursting out both ways.
      return fxSprite(ctx, 'celsddownburst', x, y + 4, { p, scale: 0.62 }) || true;
    case 'sdgalefx':
      // Gale Step: the streak of wind she rode, from where she set off, pointing the way she went.
      return fxSprite(ctx, 'celsdgalefx', x, y - 30, { p, scale: 0.6, flip: f.dir < 0 }) || true;
    case 'sdcloudnine':
      // (Her sprite on the floor behind her, and a ring of puffy clouds circling her in front.)
      fxSprite(ctx, 'celsdcloudnine', x, y + 6, { p: Math.min(1, p * 1.6), scale: 0.75 });
      return true;
    case 'sdcloudring':
      cloudRing(ctx, x, y, p);
      return true;
    case 'achspring':
      springTrail(ctx, x, y, dir, f.d ?? 120, p);
      return true;
    case 'skytornado':
      return fxSprite(ctx, 'celskytornado', x, y + 6, { p, scale: 0.8 }) || true;
    case 'bdhoopla':
      // Hoopla: the ring dropping over the monster and spinning down tight round it.
      return fxSprite(ctx, 'celbdhoopla', x, y + 4, { p, scale: 0.6 }) || true;
    case 'bdjuggle':
      return fxSprite(ctx, 'celbdjuggle', x, y + 4, { p, scale: 0.6 }) || true;
    case 'bdshow':
      return fxSprite(ctx, 'celbdshow', x, y + 4, { p, scale: 0.65 }) || true;
    case 'bdhit':
      return dancerHit(ctx, 'rosegold', x, y - (f.h ?? 40) * 0.55, p, { big: f.big || f.crit, seed, dir, scale: 0.55 });
    case 'bdbounce':
      return fxSprite(ctx, 'celbdbounce', x, y - (f.h ?? 40) * 0.55, { p, scale: 0.6, flip, rot: (seed - 0.5) * 0.5 }) || true;
    case 'bdcarousel':
      return fxSprite(ctx, 'celbdcarousel', x, y + 4, { p }) || true;
    // Ribbon Lash on a Blade Dancer: two rose-gold rings whip once round her waist out to the
    // blow's reach (eased out and in, flattened round her, behind her on the far side), then spark.
    case 'bdorbit': {
      const r = (f.r ?? 76) * 0.8;
      const go = p * p * (3 - 2 * p);
      const fade = Math.min(1, p * 6, (1 - p) * 5);
      for (let i = 0; i < 2; i++) {
        const a = -Math.PI / 2 + i * Math.PI + dir * go * Math.PI * 2.2;
        const rx = r * Math.min(1, 0.35 + p * 2);
        fxSprite(ctx, 'celbdring', x + Math.cos(a) * rx, y - 20 + Math.sin(a) * rx * 0.22, { t: f.t + i * 0.1, flip: Math.sin(a) * dir > 0, scale: 0.62, alpha: fade * (Math.sin(a) < 0 ? 0.75 : 1) });
      }
      if (p > 0.7) fxSprite(ctx, 'celbdbounce', x + dir * r * 0.9, y - 22, { p: (p - 0.7) / 0.3, scale: 0.5, flip });
      return true;
    }
    // Gust Line on a Blade Dancer: a ring flung skimming down the line to the end of its reach,
    // slowing as it goes, and a ricochet spark where it turns.
    case 'bdskim': {
      const r = f.r ?? 210;
      const go = 1 - (1 - Math.min(1, p / 0.75)) ** 2;
      const fade = Math.min(1, p * 8, (1 - p) * 4);
      fxSprite(ctx, 'celbdring', x + dir * r * 0.8 * go, y - 24, { t: f.t, flip, scale: 0.9, alpha: fade });
      if (p > 0.6) fxSprite(ctx, 'celbdbounce', x + dir * r * 0.8, y - 26, { p: (p - 0.6) / 0.4, scale: 0.7, flip });
      return true;
    }
    // Gust Line on a Sky Dancer: a crescent of wind racing down the line, growing as it goes, and
    // a cloud bursting where it ends.
    case 'skyline': {
      const r = f.r ?? 210;
      const go = 1 - (1 - Math.min(1, p / 0.7)) ** 2;
      const fade = Math.min(1, p * 8, (1 - p) * 4);
      fxSprite(ctx, 'celskygust', x + dir * r * 0.8 * go, y - 26, { t: f.t, flip, scale: 0.9 + 0.5 * go, alpha: fade });
      if (p > 0.55) fxSprite(ctx, 'celskyhit', x + dir * r * 0.8, y - 26, { p: (p - 0.55) / 0.45, scale: 0.6, flip });
      return true;
    }
    // ---- The first jobs' skills as each path plays them (data/skills.js `paths`), in the path's
    // own art: ----
    // Grand Finale as the Blade Dancer's ring revue: rose-gold rings cascading round her in three
    // tiers, whirling faster and wider out to the blow's reach (behind her on the far side,
    // flattened round her), sparking as they cut; at the big blow (~0.6 of it) they all fly out to
    // the edge and spark there.
    case 'bdrevue': {
      const R = 190;
      const fly = Math.max(0, (p - 0.58) / 0.42);
      const fade = Math.min(1, p * 6, (1 - p) * 5);
      const spin = p * p * 7 * Math.PI;
      for (let i = 0; i < 6; i++) {
        const tier = i % 3;
        const a = spin * dir + (i * Math.PI) / 3 + tier * 0.6;
        const rx = Math.min(1, 0.25 + p * 2) * (R * (0.45 + 0.18 * tier)) * (1 + 0.6 * (1 - (1 - fly) ** 2));
        const yy = y - 18 - tier * 22 - 8 * Math.sin(p * 9 + i);
        fxSprite(ctx, 'celbdring', x + Math.cos(a) * rx, yy + Math.sin(a) * rx * 0.2, { t: f.t + i * 0.07, flip: Math.sin(a) * dir > 0, scale: 0.8 + 0.2 * tier, alpha: fade * (fly > 0 ? 1 - fly : 1) * (Math.sin(a) < 0 ? 0.7 : 1) });
        if (p > 0.2 && p < 0.58 && ((p * 30 + i) | 0) % 6 === 0) fxSprite(ctx, 'celbdbounce', x + Math.cos(a) * rx, yy, { p: (p * 30) % 1, scale: 0.45, flip });
      }
      if (fly > 0) for (const s of [-1, 1]) fxSprite(ctx, 'celbdbounce', x + s * R, y - 40, { p: fly, scale: 1.1, flip: s < 0 });
      return true;
    }
    // Grand Finale as the Sky Dancer's cloudburst: a whirl of wind rising off the ground under her,
    // clouds gathering round it in a ring out to the blow's reach, turning faster as she climbs; at
    // her heel drop (~0.6 of it) the whirl breaks and the clouds burst outward.
    case 'skycloudburst': {
      const R = 190;
      const burst = Math.max(0, (p - 0.58) / 0.42);
      const fade = Math.min(1, p * 5, (1 - p) * 4);
      fxSprite(ctx, 'celskywhirlbig', x, y + 4, { t: f.t * 0.8, scale: 0.78, alpha: 0.9 * fade * (1 - burst) });
      for (let i = 0; i < 8; i++) {
        const a = p * p * 6 * Math.PI * dir + (i * Math.PI) / 4;
        const rx = R * (0.55 + 0.3 * Math.min(1, p * 2)) * (1 + 0.35 * burst);
        const yy = y - 40 - 40 * Math.min(1, p * 1.6) * (1 - burst) - 14 * (i % 2);
        fxSprite(ctx, 'celskyhit', x + Math.cos(a) * rx, yy + Math.sin(a) * rx * 0.18, { p: burst > 0 ? 0.4 + 0.6 * burst : 0.25 + 0.1 * Math.sin(f.t * 6 + i), scale: 0.7, flip: Math.cos(a) < 0, alpha: fade * (Math.sin(a) < 0 ? 0.7 : 1) });
      }
      return true;
    }
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
      // The paths' own (their Pirouette): the Blade Dancer skims a rose-gold ring along her path and
      // it sparks where she stops; the Sky Dancer rides a crescent of wind with a cloud at each end.
      if (f.school === 'rosegold' || f.school === 'aerial') {
        const go = 1 - (1 - Math.min(1, p / 0.7)) ** 2;
        const mx = x + (tx - x) * go;
        const fade = Math.min(1, p * 8, (1 - p) * 4);
        if (f.school === 'rosegold') {
          fxSprite(ctx, 'celbdring', mx, y - 22, { t: f.t, flip, scale: 0.8, alpha: fade });
          if (p > 0.6) fxSprite(ctx, 'celbdbounce', tx, y - 24, { p: (p - 0.6) / 0.4, scale: 0.6, flip });
        } else {
          fxSprite(ctx, 'celskygust', mx, y - 24, { t: f.t, flip, scale: 0.9 + 0.4 * go, alpha: fade });
          fxSprite(ctx, 'celskyhit', x, y - 20, { p, scale: 0.5, flip: !flip });
          if (p > 0.55) fxSprite(ctx, 'celskyhit', tx, y - 22, { p: (p - 0.55) / 0.45, scale: 0.5, flip });
        }
        return true;
      }
      if (f.school === 'ink' || f.school === 'fox') {
        const ink = f.school === 'ink';
        fxSprite(ctx, ink ? 'celstreakshadow' : 'celfoxtrail', (x + tx) / 2, y - 18, { p, t: p, flip, sx: ink ? len / 100 : undefined, scale: ink ? 1 : len / 160 });
        fxSprite(ctx, ink ? 'celsmokebomb' : 'celfoxhit', x, y, { p, flip: !flip, scale: ink ? 0.5 : 0.5 });
        fxSprite(ctx, ink ? 'celsmokebomb' : 'celfoxhit', tx, y, { p: Math.min(1, p * 1.2), scale: ink ? 0.4 : 0.45 });
        return true;
      }
      fxSprite(ctx, f.school === 'rage' ? 'celstreakred' : f.school === 'holy' ? 'celstreakgold' : f.school === 'shadow' ? 'celstreakshadow' : 'celstreak', (x + tx) / 2, y - 18, { p, flip, sx: len / 100 });
      if (f.school === 'shadow') fxSprite(ctx, 'celsmoke', x, y, { p, flip: !flip, scale: 0.8 });
      else if (REAL.has(f.school)) fxSprite(ctx, 'celquake', x, y + 8, { p, flip: !flip, scale: 0.4 });
      else fxSprite(ctx, 'celdust', x, y, { p, flip: !flip, scale: 0.8 });
      if (f.school === 'shadow') {
        fxSprite(ctx, 'celsmoke', tx, y, { p: Math.min(1, p * 1.2), scale: 0.6 });
        return true;
      }
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
    case 'titanrise': {
      // Titan Breaker's leap: steel light bursting up from the ground he leaps from, and a giant
      // sword of steel flying together out of shards high over him, held there until he crashes
      // down (the crash, 'titanbreak', drives it into the ground).
      // (No pillar of light up through him any more, the all-class pass: it hid him as he leapt.)
      groundRing(ctx, ringOf(f.school), x, y, Math.min(1, p * 1.6), 60, { alpha: 0.8 });
      const form = Math.min(1, p / 0.35);
      if (p < 0.66) fxSprite(ctx, pathTint(f.school, 'celswordform', 'celswordformgold', 'celswordformred'), x, y - 92, { frame: Math.min(4, Math.floor(form * 4.99)), scale: 1, alpha: p > 0.6 ? (0.66 - p) / 0.06 : 1 });
      return true;
    }
    case 'titanbreak': {
      // The crash: the steel sword drives down into the ground and shatters, a cross of steel light
      // bursts where it lands, and the ground splits open wide with blades of light bursting up
      // out of it, a ring racing out.
      const r = f.r ?? 170;
      const fall = Math.min(1, p / 0.1);
      fxSprite(ctx, pathTint(f.school, 'celsteelsword', 'celsword', 'celragesword'), x, y + 6 - 120 * (1 - fall * fall), { p: p < 0.25 ? 0 : (p - 0.25) / 0.75, scale: 1.25 });
      // The split runs out both ways to the edge of the blow's reach: the main fissure under the
      // sword and a crack racing on from each end of it, a beat behind.
      const fissure = pathTint(f.school, 'celfissurebig', 'celfissuregoldbig', 'celfissureredbig');
      fxSprite(ctx, fissure, x, y, { p, scale: r / 230 });
      // (Rock torn up out of the split, so the blades of light rise out of broken ground.)
      rockBurst(ctx, x, y, Math.min(r * 1.4, 260), Math.min(1, p * 1.2), 7);
      for (const sd of [-1, 1]) if (p > 0.05) fxSprite(ctx, fissure, x + sd * r * 0.5, y, { p: (p - 0.05) / 0.95, scale: (r / 230) * 0.8, flip: sd < 0 });
      debris(ctx, x, y, p, r * 0.8, f.school);
      if (p > 0.06) fxSprite(ctx, pathTint(f.school, 'celsteelcross', 'cellightcross', 'celragecross'), x, y - 44, { p: (p - 0.06) / 0.94, scale: 0.85 });
      // (The aftershock's one ring races out after this; no second huge ring here, the all-class
      // pass: three blurry rings stacked over him buried the crash.)
      return true;
    }
    case 'xcross':
      // Cross Slash: the X of steel light burning where the two cuts crossed, on the monsters.
      return fxSprite(ctx, pathTint(f.school, 'celsteelcross', 'cellightcross', 'celragecross'), x, y - 34, { p, scale: 0.55, flip }) || true;
    case 'titanwave': {
      // The aftershock: rings of steel racing out along the ground, dust thrown both ways.
      const r = f.r ?? 180;
      groundRing(ctx, ringOf(f.school), x, y, p, Math.min(r, 150), { alpha: 0.75 * (1 - p * 0.5) });
      for (const sd of [-1, 1]) {
        if (REAL.has(f.school)) fxSprite(ctx, 'celquake', x + sd * r * 0.35, y + 6, { p, flip: sd < 0, scale: 0.55 });
        else fxSprite(ctx, 'celdust', x + sd * r * 0.55, y + 2, { p, flip: sd < 0, scale: 0.6 });
      }
      return true;
    }
    // ---------- The warrior paths' own Titan Breakers (data/path-skills.js) ----------
    case 'plcrest': {
      // Heaven's Seal: the great crest of light gathering high over the Paladin as she raises her
      // blade (frames 0-4), then shining, its rays turning, until she brings it down.
      const a = Math.min(1, p / 0.08) * (p > 0.9 ? (1 - p) / 0.1 : 1);
      const frame = p < 0.4 ? Math.min(4, Math.floor((p / 0.4) * 5)) : 5 + (Math.floor(time * 12) % 3);
      fxSprite(ctx, 'celplcrest', x, y - 104 - 6 * Math.min(1, p * 2) - 2 * Math.sin(time * 3), { frame, scale: 0.72, alpha: a });
      return true;
    }
    case 'plsealfall': {
      // The crest slams down with her chop: it drops onto the ground ahead and bursts into a cross of
      // light, gold dust and rock thrown up, a ring of light racing out to the blow's reach.
      const r = f.r ?? 170;
      const fall = Math.min(1, p / 0.1);
      if (p < 0.3) fxSprite(ctx, 'celplcrest', x, y - 30 - 80 * (1 - fall * fall), { frame: 7, scale: 0.72 * (1 + 0.3 * fall), alpha: p < 0.2 ? 1 : (0.3 - p) / 0.1 });
      if (p > 0.08) fxSprite(ctx, 'cellightcross', x, y - 40, { p: (p - 0.08) / 0.92, scale: 1.15 });
      debris(ctx, x, y, p, r * 0.8, 'holy');
      fxSprite(ctx, 'celholyhit', x, y - 20, { p, scale: 1.2 });
      groundRing(ctx, 'celringholy', x, y, p, r * 1.1);
      return true;
    }
    case 'plsealwave': {
      // The blade driven in: pillars of light burst up in a ring round her, one after another out to
      // the blow's reach, with a ring of light running out along the ground.
      const r = f.r ?? 185;
      groundRing(ctx, 'celringholy', x, y, p, r);
      for (let i = 0; i < 4; i++) {
        const k = (p - i * 0.08) / 0.68;
        if (k <= 0 || k >= 1) continue;
        for (const sd of [-1, 1]) lightPillar(ctx, 'celpillarholy', x + sd * r * (0.28 + i * 0.22), y, k, 110 - i * 10);
      }
      return true;
    }
    case 'bkhowl':
      // Skyfall Rend's howl: fire flaring up under the crouching Berserker, embers climbing.
      rageFlare(ctx, x, y, p, 90, time);
      return true;
    case 'bkmeteor': {
      // The meteor of rose fire he falls in (carried with him; drawn under him): it wraps him from the
      // top of his pounce to the smash, tipping head-first along the fall.
      const mp = 0.36 + p * (0.36 / 1.38);
      const u = Math.min(1, Math.max(0, (mp - 0.18) / 0.44));
      const lift = 66 * Math.sin(Math.PI * u) ** 0.8;
      const a = Math.min(1, p / 0.15) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      fxSprite(ctx, 'celbkmeteor', x + dir * 4, y - 26 - lift, { t: time, scale: 0.72, rot: -dir * (0.25 + 0.4 * Math.min(1, p * 1.5)), alpha: a });
      return true;
    }
    case 'bkrend': {
      // The smash: claw gashes torn huge across the ground, the earth ripped open, fire bursting and
      // a jagged shockwave out to the blow's reach.
      const r = f.r ?? 170;
      fxSprite(ctx, 'celclawbig', x, y - 40, { p, scale: 1.3, flip });
      debris(ctx, x, y, p, r * 0.95, 'rage');
      fxSprite(ctx, 'celragefire', x, y, { t: time, scale: 1.05, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      fxSprite(ctx, 'celembers', x, y, { t: p, scale: r / 80, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      groundRing(ctx, 'celshockred', x, y, p, r * 0.85, { alpha: 0.75 * (1 - p * 0.5) });
      return true;
    }
    case 'gswheel': {
      // Titan Breaker's somersaults: a wheel of steel round her as she turns over and over in the
      // leap, rising with her (the move's lift, from its own timeline: this plays from 0.1 to 0.43
      // of the 1.5 s move).
      const mp = 0.1 + p * (0.5 / 1.5);
      const u = Math.min(1, Math.max(0, (mp - 0.1) / 0.32));
      const lift = 62 * Math.sin((1 - (1 - u) ** 3) * Math.PI / 2);
      const a = Math.min(1, p / 0.12) * (p > 0.8 ? (1 - p) / 0.2 : 1);
      fxSprite(ctx, 'celgswheel', x, y - 26 - lift, { t: time, scale: 0.95, flip, alpha: a });
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
      if (f.school === 'focus') return false;
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
