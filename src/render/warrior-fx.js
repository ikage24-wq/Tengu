// The warrior paths' effects (and the skill power-ups and buff casts every class shares), in
// Tengu's own effect art (tools/fx-art.js, the `cel*` strips): soft pastel shapes matched to the
// sprites' pixel size and outlines, each a short run of key drawings that pops in, holds, then
// breaks up into beads and sparkles (docs/art/README.md). The Warrior is steel blue and white, the
// Paladin gold, the Berserker rose red (and the Archer's buffs warm gold and sky blue).
//
// Drawn from progress `p` (0-1) and a seed; (x, y) is a monster's feet for per-target effects and
// the hero's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';

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
const EMBLEMS = { phantom: 'celembphantom', acro: 'celembacro', astral: 'celembastro', idol: 'celembidol', brass: 'celembgear', starlit: 'celembwitch', aerial: 'celembsky', rosegold: 'celembblade', coral: 'celembdancer', holy: 'celembholy', rage: 'celembrage', steel: 'celembsteel', hawk: 'celembhawk', wind: 'celembwind', storm: 'celembstorm', shadow: 'celembshadow', ink: 'celembink', fox: 'celembfox', spirit: 'celembspirit' };

// Pixel art keeps its pixel size: effects that play large have big versions drawn large (`*big`
// strips), so scales stay near 1.
const BIG = new Set(['celshockred', 'celringstorm', 'celring', 'celringholy', 'celringrage', 'celringwind', 'celringhawk', 'celringshadow', 'celringmint', 'celringink', 'celringfox', 'celringspirit']);

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
    fxSprite(ctx, 'celptsmoke', x, y + 4, { p, scale: 0.55 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.phantom, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Acrobat Archer's: no pillar, a firework going off over her with her badge rising.
  if (school === 'acro') {
    fxSprite(ctx, 'celacfirework', x, y - 40, { p, scale: 0.5 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.acro, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Astronomer's: no pillar, Lunar Tide's silver waves rising round her, her badge rising.
  if (school === 'astral') {
    fxSprite(ctx, 'celastide', x, y + 4, { p, scale: 0.55 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.astral, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Starlight Idol's: no pillar, a burst of sound waves and notes, her badge rising.
  if (school === 'idol') {
    fxSprite(ctx, 'celsiwave', x, y - 26, { p, scale: 0.3 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.idol, x, y - 50 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
    return;
  }
  // The Arbalist Engineer's: no pillar, a burst of steam with her badge turning in it.
  if (school === 'brass') {
    fxSprite(ctx, 'celaesteam', x, y + 4, { p, scale: 0.8 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.brass, x, y - 44 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5, rot: p * 2 });
    return;
  }
  // The Star Witch's: no pillar, her constellation snapping shut over her with her badge.
  if (school === 'starlit') {
    fxSprite(ctx, 'celstconst', x, y - 64, { frame: Math.min(7, Math.floor(p * 10)), scale: 0.4, alpha: p < 0.8 ? 1 : (1 - p) / 0.2 });
    if (p > 0.15) fxSprite(ctx, EMBLEMS.starlit, x, y - 44 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.5 });
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
    fxSprite(ctx, 'celwdswirl', x, y - 26, { p, scale: 0.9 });
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
  if (school === 'holy') fxSprite(ctx, 'celholyhit', x, y, { p, scale: k });
  else if (school === 'rage') fxSprite(ctx, 'celclaw', x, y, { p, scale: k, flip: dir < 0 });
  else if (school === 'shadow') fxSprite(ctx, 'celshadowhit', x, y, { p, scale: k, rot: (seed - 0.5) * 0.6 });
  else if (school === 'ink') fxSprite(ctx, 'celinkhit', x, y, { p, scale: k * 0.85, rot: (seed - 0.5) * 1.2, flip: dir < 0 });
  else if (school === 'brass') fxSprite(ctx, 'celaehit', x, y, { p, scale: k * 0.6 });
  else if (school === 'idol') fxSprite(ctx, 'celsihit', x, y, { p, scale: k * 0.4, rot: (seed - 0.5) * 0.4 });
  else if (school === 'phantom') fxSprite(ctx, 'celpthit', x, y, { p, scale: k * 0.55, rot: (seed - 0.5) * 0.4 });
  else if (school === 'acro') fxSprite(ctx, 'celachit', x, y, { p, scale: k * 0.5, rot: (seed - 0.5) * 0.4 });
  else if (school === 'astral') fxSprite(ctx, 'celashit', x, y, { p, scale: k * 0.55, rot: (seed - 0.5) * 0.6 });
  else if (school === 'starlit') fxSprite(ctx, 'celsthit', x, y, { p, scale: k * 0.6, rot: (seed - 0.5) * 0.6 });
  else if (school === 'aerial') fxSprite(ctx, 'celskyhit', x, y, { p, scale: k * 0.6 });
  else if (school === 'rosegold') fxSprite(ctx, 'celbdhit', x, y, { p, scale: k * 0.7, rot: (seed - 0.5) * 0.6 });
  else if (school === 'coral') fxSprite(ctx, 'celwdhit', x, y, { p, scale: k * 0.7, rot: (seed - 0.5) * 0.6 });
  else fxSprite(ctx, 'celcross', x, y, { p, scale: k, rot: (seed - 0.5) * 0.8 });
}

export function drawWarriorFx(ctx, f, x, y, p, cam, time) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const seed = f.seed ?? 0.5;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  switch (f.kind) {
    // The Wind Dancer's (coral and cream): her mark on each monster hit, the swirl of ribbons, the
    // crescent gust down the line, and Grand Finale's spotlight and rose of ribbons.
    case 'wdhit':
      return fxSprite(ctx, 'celwdhit', x, y - (f.h ?? 40) * 0.55, { p, scale: 0.6, rot: (seed - 0.5) * 0.6 }) || true;
    case 'wdswirl':
      return fxSprite(ctx, 'celwdswirl', x, y - 26, { p, scale: 0.95 }) || true;
    case 'wdgust':
      return fxSprite(ctx, 'celwdgust', x - dir * 30, y - 28, { p, flip }) || true;
    // A puff of wind off her palms (each blow with gloves): a small crescent gust.
    case 'wdpuff':
      return fxSprite(ctx, 'celwdgust', x - dir * 10, y - 26, { p, flip, scale: 0.5 }) || true;
    case 'wdfinale':
      return fxSprite(ctx, 'celwdfinale', x, y + 4, { p, scale: 1.1 }) || true;
    // The Blade Dancer's (rose gold): her ring-cut on a monster, the spark where a ring ricochets,
    // and Golden Carousel's rings on their track.
    // The Sky Dancer's (sky blue): her cloud on a monster, Updraft's rising whirl, and Sky Waltz's
    // tornado.
    // The Star Witch's (midnight and gold): her constellation hit, Wishing Star's fall of light, Star
    // Veil, and Starfall's constellation over the sky and its great impact.
    // The Arbalist Engineer's (brass and teal): her hit with flying cogs, a sticky or cluster burst, a
    // vent of steam, a sticky bolt ticking on a monster, and Big Bertha's ballista over her.
    // The Starlight Idol's (pink and gold): her hit of notes and hearts, a song's sound waves, a
    // song hanging in the air (a ring on the ground for as long as it lasts), a song's ring sung
    // once (the party's healer bots), and Grand Concert's stage.
    case 'sihit':
      return fxSprite(ctx, 'celsihit', x, y - (f.h ?? 40) * 0.55, { p, scale: f.big || f.crit ? 0.85 : 0.6, rot: (seed - 0.5) * 0.4 }) || true;
    case 'siwave':
      return fxSprite(ctx, 'celsiwave', x, y, { p, scale: f.scale ?? (f.big ? 0.75 : 0.5) }) || true;
    case 'shock':
      // A finisher's shockwave racing out to the edge of its reach (world/melee.js).
      return fxSprite(ctx, f.name, x, y + 2, { p, scale: f.r / 99 }) || true;
    case 'sishock': {
      // A blast of Grand Concert's music rolling out along the ground to the edge of its reach: the
      // monsters it passes are hit as it reaches them (world/idol.js).
      const u = Math.min(1, f.t / f.dur);
      const go = 1 - (1 - u) ** 2;
      const fade = Math.min(1, (1 - u) * 4);
      return fxSprite(ctx, 'celsibig', x + f.dir * f.r * go, y, { t: f.t, flip: f.dir < 0, scale: (f.big ? 1.5 : 1.15) * (0.8 + 0.4 * go), alpha: fade }) || true;
    }
    case 'idolsong': {
      const S = f.song;
      const name = S.kind === 'cheer' ? 'celsicheer' : S.kind === 'lull' ? 'celsilullaby' : 'celsisong';
      const fade = Math.min(1, f.t * 3, Math.max(0, f.dur - f.t) * 2);
      if (fade <= 0) return true;
      return fxSprite(ctx, name, x, y + 2, { t: f.t, scale: S.r / 130, alpha: fade }) || true;
    }
    case 'sisong': case 'sicheer': case 'silullaby': {
      const fade = Math.min(1, f.t * 4, Math.max(0, f.dur - f.t) * 3);
      return fxSprite(ctx, `cel${f.kind}`, x, y + 2, { t: f.t, scale: f.big ? 0.9 : 0.5, alpha: fade }) || true;
    }
    case 'sistage':
      return fxSprite(ctx, 'celsistage', x, y + 6, { p, scale: 1.2 }) || true;
    // The Astronomer's (violet and silver): her hit (a crescent passing and a ring opening), Gravity
    // Well hanging where she pointed for as long as it lasts, Lunar Tide, and the planets aligning.
    case 'ashit':
      return fxSprite(ctx, 'celashit', x, y - (f.h ?? 40) * 0.55, { p, scale: f.big || f.crit ? 0.65 : 0.45, rot: (seed - 0.5) * 0.6 }) || true;
    case 'aswell': {
      const fade = Math.min(1, f.t * 3, Math.max(0, f.dur - f.t) * 2);
      if (fade <= 0) return true;
      return fxSprite(ctx, 'celaswell', x, y + 2, { t: f.t, scale: (f.well?.r ?? 130) / 110, alpha: fade }) || true;
    }
    case 'astide':
      return fxSprite(ctx, 'celastide', x, y + 4, { p, scale: 0.6 }) || true;
    case 'asalign':
      return fxSprite(ctx, 'celasalign', x, y, { p, scale: ((f.span ?? 520) - 50) / 331, flip }) || true;
    case 'aehit':
      return fxSprite(ctx, 'celaehit', x, y - (f.h ?? 40) * 0.55, { p, scale: f.big || f.crit ? 0.7 : 0.5 }) || true;
    case 'aeboom':
      return fxSprite(ctx, 'celaeboom', x, y + 2, { p, scale: f.small ? 0.4 : 0.65 }) || true;
    case 'aesteam':
      return fxSprite(ctx, 'celaesteam', x, y + 2, { p, scale: f.small ? 0.3 : 0.6, flip }) || true;
    case 'aestick': {
      // A sticky bolt stuck in the monster, its teal light blinking faster as it's about to burst.
      const m = f.mob;
      const sx = (m ? m.x - cam.x : x) - 4;
      const sy = (m ? m.y - (m.air ?? 0) - m.def.h / 2 - cam.y : y - 20);
      return fxSprite(ctx, 'celaebolt', sx, sy, { frame: 0, scale: 0.45, rot: 0.6, alpha: 0.6 + 0.4 * Math.sin(p * p * 40) }) || true;
    }
    case 'aeballista':
      return fxSprite(ctx, 'celaeballista', x - dir * 20, y + 4, { p, scale: 0.75, flip }) || true;
    case 'sthit':
      return fxSprite(ctx, 'celsthit', x, y - (f.h ?? 40) * 0.55, { p, scale: f.big || f.crit ? 0.7 : 0.5, rot: (seed - 0.5) * 0.6 }) || true;
    case 'stwish':
      return fxSprite(ctx, 'celstwish', x, y + 4, { p, scale: 0.75 }) || true;
    case 'stveil':
      return fxSprite(ctx, 'celstveil', x, y + 4, { p, scale: 0.6 }) || true;
    case 'starfallsky':
      // (Spread over the whole stretch her meteors fall on: rainFrom 20, rainW 380.)
      return fxSprite(ctx, 'celstsky', x + dir * 210, y - 130, { frame: Math.min(7, Math.floor(p * 9)), scale: 1.2 }) || true;
    case 'starfallimpact':
      fxSprite(ctx, 'celsthit', x, y - 30, { p, scale: 1.4 });
      return fxSprite(ctx, 'celstwish', x, y + 4, { p: 0.4 + 0.6 * p, scale: 1.3 }) || true;
    case 'skyhit':
      return fxSprite(ctx, 'celskyhit', x, y - (f.h ?? 40) * 0.55, { p, scale: f.big ? 0.7 : 0.5 }) || true;
    case 'skyupdraft':
      fxSprite(ctx, 'celskywhirl', x, y + 4, { t: p * 0.9, scale: 0.5, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      return fxSprite(ctx, 'celskyhit', x, y - (f.h ?? 40) * 0.55, { p, scale: 0.5 }) || true;
    case 'skytornado':
      return fxSprite(ctx, 'celskytornado', x, y + 6, { p, scale: 1.25 }) || true;
    case 'bdhit':
      return fxSprite(ctx, 'celbdhit', x, y - (f.h ?? 40) * 0.55, { p, scale: f.big ? 0.75 : 0.55, rot: (seed - 0.5) * 0.6 }) || true;
    case 'bdbounce':
      return fxSprite(ctx, 'celbdbounce', x, y - (f.h ?? 40) * 0.55, { p, scale: 0.6, flip, rot: (seed - 0.5) * 0.5 }) || true;
    case 'bdcarousel':
      return fxSprite(ctx, 'celbdcarousel', x, y + 4, { p, scale: 0.85 }) || true;
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
      // The Shinobi darts off in a burst of white smoke and out of another; the Kitsune leaves a
      // trail of fox fire.
      // The Spirit Mage comes apart into paper streamers and light, and gathers again ahead.
      if (f.school === 'spirit') {
        fxSprite(ctx, 'celspiritstep', x, y, { p, flip, scale: 0.5 });
        fxSprite(ctx, 'celspiritstep', tx, y, { p: Math.max(0, 1 - p * 1.4), scale: 0.5 });
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
      fxSprite(ctx, 'celholyhit', x, y - 26, { p: Math.min(1, p * 1.4), scale: 0.8 });
      return true;
    }
    case 'aegis': {
      // A shield of light snapping up in front of the shove, then shattering into hexes.
      fxSprite(ctx, 'celshield', x + dir * 20, y - 28, { p, scale: 0.75, sx: 0.7 });
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
      fxSprite(ctx, 'celcirclebig', x, y, { frame: 0, scale: r / 105, sy: 0.3, alpha: a });
      groundRing(ctx, 'celringholy', x, y, p, r);
      for (const sd of [-1, 1]) lightPillar(ctx, 'celpillarholy', x + sd * r * 0.55, y, Math.min(1, p * 1.2), 90);
      fxSprite(ctx, 'celmotes', x, y, { t: time, scale: r / 60, alpha: a });
      return true;
    }
    case 'verdict': {
      // Grand Verdict: a great sword of light drives down out of the sky into the ground and
      // shatters, a cross of light bursts where it lands, over the blazing magic circle, with
      // pillars of light in a wide ring and a ring racing out.
      const r = f.r ?? 170;
      const a = (p < 0.08 ? p / 0.08 : 1) * (p > 0.75 ? (1 - p) / 0.25 : 1);
      fxSprite(ctx, 'celcirclebig', x, y, { frame: 0, scale: r / 105, sy: 0.3, alpha: a });
      groundRing(ctx, 'celringholy', x, y, p, r * 1.1);
      for (const sd of [-1, -0.5, 0.5, 1]) lightPillar(ctx, 'celpillarholy', x + sd * r * 0.6, y, Math.min(1, p * 1.1 + Math.abs(sd) * 0.08), 110);
      const fall = Math.min(1, p / 0.12);
      fxSprite(ctx, 'celsword', x, y + 4 - 160 * (1 - fall * fall), { p: p < 0.3 ? 0 : (p - 0.3) / 0.7, scale: 0.8 });
      if (p > 0.1) fxSprite(ctx, 'cellightcross', x, y - 40, { p: (p - 0.1) / 0.9, scale: 1.1 });
      return true;
    }
    case 'titanrise': {
      // Titan Breaker's leap: steel light bursting up from the ground he leaps from, and a giant
      // sword of steel flying together out of shards high over him, held there until he crashes
      // down (the crash, 'titanbreak', drives it into the ground).
      groundRing(ctx, ringOf(f.school), x, y, Math.min(1, p * 1.6), 70);
      if (p < 0.5) lightPillar(ctx, pillarSprite(f.school), x, y, p * 2, 120);
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
      fxSprite(ctx, pathTint(f.school, 'celsteelsword', 'celsword', 'celragesword'), x, y + 6 - 120 * (1 - fall * fall), { p: p < 0.25 ? 0 : (p - 0.25) / 0.75, scale: 1.05 });
      fxSprite(ctx, pathTint(f.school, 'celfissurebig', 'celfissuregoldbig', 'celfissureredbig'), x, y, { p, scale: r / 230 });
      debris(ctx, x, y, p, r * 0.8, f.school);
      if (p > 0.06) fxSprite(ctx, pathTint(f.school, 'celsteelcross', 'cellightcross', 'celragecross'), x, y - 44, { p: (p - 0.06) / 0.94, scale: 1.1 });
      groundRing(ctx, ringOf(f.school), x, y, p, r * 1.1);
      return true;
    }
    case 'titanwave': {
      // The aftershock: rings of steel racing out along the ground, dust thrown both ways.
      const r = f.r ?? 180;
      groundRing(ctx, ringOf(f.school), x, y, p, r);
      groundRing(ctx, ringOf(f.school), x, y, Math.min(1, p * 1.5), r * 0.6);
      for (const sd of [-1, 1]) {
        if (REAL.has(f.school)) fxSprite(ctx, 'celquake', x + sd * r * 0.35, y + 6, { p, flip: sd < 0, scale: 0.55 });
        else fxSprite(ctx, 'celdust', x + sd * r * 0.35, y + 2, { p, flip: sd < 0, scale: 1 });
      }
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
      fxSprite(ctx, 'celaxewheel', x + dir * Math.cos(th) * R, y - 30 + Math.sin(th) * R * 0.3, { t: time, scale: 0.55, flip });
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
      fxSprite(ctx, 'celrageaxe', x, y + 6 - 110 * (1 - fall * fall), { p: p < 0.25 ? 0 : (p - 0.25) / 0.75, scale: 0.75, flip });
      fxSprite(ctx, 'celclawbig', x, y - 40, { p, scale: 0.95, flip });
      debris(ctx, x, y, p, r * 0.9, 'rage');
      fxSprite(ctx, 'celragefire', x, y, { t: time, scale: 1, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      groundWave(ctx, 'rage', x, y, p, r);
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
      if (f.big) fxSprite(ctx, 'celblood', x + dir * 6, cy, { p, scale: 0.8, flip });
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
      groundWave(ctx, 'rage', x, y, p, r);
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
