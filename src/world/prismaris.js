// Prismaris's fights (2026-11-27, the Little Crystal King rebuilt with brand-new fights; the old slam and his
// trial's spikes, flare, cape sweep and Lights Out are gone). Run by world/story.js like the Grand Kettle's:
// a set rotation of named casts, each shown on the cast bar under his health bar while he acts it out, its
// telegraph laid on the floor as it starts, landing as it ends; phases at his health marks, each adding a
// layer. Every telegraph is drawn whole in his own crystal look (render/prismaris/looks.js). Damage is a
// share (`k`) of the style's `damage`.
//
// A little boy-king holding court in the dark, so his fight is a royal audience gone wrong:
//   Royal Bonk       a tank buster: a gem marker follows you, then his sceptre's prism comes down on it
//   Royal Tantrum    the room-wide hit: he stamps and wails, crystals rattle down everywhere (no dodging,
//                    a gentle lilac tint, never a white flash)
//   Prism Beam       a band of refracted light from him at you along the floor (get behind him, or up)
//   Royal Gems       spread: crystals grow under you; anyone standing with you gets them too
//   Royal Portrait   stack: a golden frame round you; everyone in it shares the hit (squeeze in!)
//   Refraction       his signature: a great prism floats up under the ceiling and splits his light into
//                    five rainbow columns across the room; stand in a gap between the colours
//   Mirror, Mirror   his second signature: crystal mirrors rise at both walls, his beam sweeps your side
//                    of the room, bounces off the mirror and sweeps back over the other (cross behind him,
//                    then back); in his trial it bounces a third time
//
// The Crystal Throne (`crystalking`, lv 38, the field boss, players gather for him): two phases and a
// faster finale.
//   intro    Kneel Before the King! (the crown set straight, the sceptre raised, the crown slips over his
//            eyes and is shoved back up; nothing lands)
//   phase 1  Royal Bonk, Prism Beam, Royal Gems, Royal Tantrum, Refraction, Prism Beam
//   phase 2  (half: "The crown SLIPPED!") Mirror, Mirror, Royal Portrait, Royal Bonk, Refraction, Royal
//            Gems, Royal Tantrum
//   finale   (a fifth left: "NO BEDTIME!") phase 2 again, faster
// The Dark Throne (`nightking`, lv 49, his Chapter 10 trial, alone with Elder Shiratama's candle):
//   intro    MINE! (the Queen's clock hugged tight, a stamp; nothing lands)
//   phase 1  Royal Bonk, Prism Beam, Royal Gems, Royal Tantrum, Refraction
//   phase 2  (two thirds: "Mirror, mirror!") Mirror, Mirror (three sweeps), Royal Portrait, Royal Bonk,
//            Refraction, Royal Gems, Royal Tantrum
//   phase 3  (a third: "Mirror ME!") the harder twist: the mirrors stay up and every cast ECHOES. A second
//            bonk follows the first, the beam bounces back over the other side, the rainbow columns fall
//            again in the gaps the first ones left, the gems grow twice, the tantrum rattles twice
//   finale   (an eighth: "I'll put out EVERY light!") phase 3 again, faster
// Every pattern reads before it lands, has a safe place, and keeps its cast long enough to reach it.

// (each landing's hold, s: render/prismaris/looks.js plays it over that long)
export const PRISMARIS_HOLD = { pmBonk: 0.8, pmTantrum: 1, pmBeam: 0.8, pmGems: 0.9, pmPortrait: 0.9, pmRefract: 1, pmMirror: 0.8 };
const z = (look, o) => ({ look, hold: PRISMARIS_HOLD[look], ...o });

// A beam from his place to the wall on side `dir` (starting a little behind him, so standing on him
// isn't safe).
const sweep = (q, map, dir, extra = {}) => (dir > 0 ? { kind: 'lane', x: q.x - 24, w: map.width - (q.x - 24), dir, ...extra } : { kind: 'lane', x: 0, w: q.x + 24, dir, ...extra });
const sideOf = (q, p) => Math.sign(p.x - q.x) || 1;
// Five rainbow columns across the room, the set shifted by `off` (0..1 of a step); the gaps between are safe.
function columns(map, off, warn) {
  const step = (map.width - 120) / 5;
  return [0, 1, 2, 3, 4].map((i) => z('pmRefract', { kind: 'pillar', x: 60 + step * (i + off), w: 74, k: 0.9, colour: i, px: map.width / 2, ...(warn ? { warn } : {}) }));
}

function steps(echo) {
  const S = {
    bonk: {
      id: 'bonk', name: 'Royal Bonk', sub: echo ? 'Two bonks on you! Keep the others clear!' : 'A big bonk on you! Keep the others clear!', dur: 2.4, after: 1.6,
      make: (q, p, map, dur) => [z('pmBonk', { kind: 'mark', follow: true, lock: 0.6, x: p.x, w: 70, k: 1.6 }), ...(echo ? [z('pmBonk', { kind: 'mark', follow: true, lock: 0.6, x: p.x, w: 70, k: 1.1, warn: dur + 1.1, echo: true })] : [])],
    },
    tantrum: {
      id: 'tantrum', name: 'Royal Tantrum', sub: echo ? "He's stamping AGAIN! Brace!" : "He's stamping his feet! Brace!", dur: 2.6, after: 1.8,
      make: (q, p, map, dur) => [z('pmTantrum', { kind: 'raid', x: q.x, k: 0.42 }), ...(echo ? [z('pmTantrum', { kind: 'raid', x: q.x, k: 0.3, warn: dur + 1.2, echo: true })] : [])],
    },
    beam: {
      id: 'beam', name: 'Prism Beam', sub: echo ? 'Behind him! Then back - it bounces!' : 'Get behind him, or up on a ledge!', dur: 2.2, after: 1.6,
      make: (q, p, map, dur) => {
        const d = sideOf(q, p);
        return [z('pmBeam', { ...sweep(q, map, d), k: 1 }), ...(echo ? [z('pmMirror', { ...sweep(q, map, -d), k: 0.9, warn: dur + 1.3, echo: true })] : [])];
      },
    },
    gems: {
      id: 'gems', name: 'Royal Gems', sub: echo ? 'Crystals grow under you - twice! Spread out!' : 'Crystals grow under you! Spread out!', dur: 2.2, after: 1.6,
      make: (q, p, map, dur) => [z('pmGems', { kind: 'mark', follow: true, lock: 0.6, x: p.x, w: 82, k: 0.75, spread: true }), ...(echo ? [z('pmGems', { kind: 'mark', follow: true, lock: 0.6, x: p.x, w: 82, k: 0.6, spread: true, warn: dur + 1.2, echo: true })] : [])],
    },
    portrait: {
      id: 'portrait', name: 'Royal Portrait', sub: 'Squeeze into the frame together!', dur: 2.6, after: 1.8,
      make: (q, p) => [z('pmPortrait', { kind: 'mark', follow: true, lock: 0.8, x: p.x, w: 124, k: 1.1, stack: true })],
    },
    refract: {
      id: 'refract', name: 'Refraction', sub: echo ? 'Between the colours - then where they were!' : 'Stand between the colours!', dur: 2.8, after: 1.8,
      make: (q, p, map, dur) => {
        const off = 0.25 + Math.random() * 0.5;
        return [...columns(map, off), ...(echo ? columns(map, off + 0.5, dur + 1.4).map((c) => ({ ...c, echo: true, k: 0.8 })) : [])];
      },
    },
    mirror: {
      id: 'mirror', name: 'Mirror, Mirror', sub: echo ? 'Cross behind him, back, and back again!' : 'Cross behind him, then back!', dur: 2.4, after: echo ? 3 : 2.4,
      make: (q, p, map, dur) => {
        const d = sideOf(q, p);
        const out = [z('pmMirror', { ...sweep(q, map, d), k: 0.9 }), z('pmMirror', { ...sweep(q, map, -d), k: 0.9, warn: dur + 1.3, bounce: 1 })];
        if (echo) out.push(z('pmMirror', { ...sweep(q, map, d), k: 0.9, warn: dur + 2.6, bounce: 2 }));
        return out;
      },
    },
  };
  return S;
}
const N = steps(false);
const E = steps(true);
// (a finale: every cast a little quicker, less rest between)
const fast = (list) => list.map((s) => ({ ...s, dur: Math.round(s.dur * 0.82 * 10) / 10, after: Math.round(s.after * 0.65 * 10) / 10 }));
// (rotationTurn hands make() the hero and the map; the cast's own length rides along for echoes)
const withDur = (list) => list.map((s) => ({ ...s, make: (q, p, map) => s.make(q, p, map, s.dur) }));

const P2_FIELD = [N.mirror, N.portrait, N.bonk, N.refract, N.gems, N.tantrum];
export const CRYSTAL_THRONE = {
  color: '#b8a8ff', light: '#f4f0ff',
  damage: 300,
  moves: [],
  adds: { at: [], mob: null },
  rotation: {
    intro: { id: 'audience', name: 'Kneel Before the King!', sub: 'He would like you to kneel. Please.', dur: 3, after: 1.2, pose: 'audience' },
    phases: [
      { at: 1, list: withDur([N.bonk, N.beam, N.gems, N.tantrum, N.refract, N.beam]) },
      { at: 0.5, line: 'The crown SLIPPED!', lineSub: 'Nobody saw that. NOBODY!', list: withDur(P2_FIELD) },
      { at: 0.2, line: 'NO BEDTIME!', lineSub: 'He is NOT tired. He is a KING.', list: withDur(fast(P2_FIELD)) },
    ],
  },
};

const P3_TRIAL = [E.bonk, E.beam, E.refract, N.portrait, E.gems, E.tantrum, E.mirror];
export const DARK_THRONE = {
  color: '#b8a8ff', light: '#f4f0ff',
  damage: 380,
  moves: [],
  adds: { at: [], mob: null },
  rotation: {
    intro: { id: 'mine', name: 'MINE!', sub: 'He is not giving the clock back.', dur: 2.6, after: 1.2, pose: 'mine' },
    phases: [
      { at: 1, list: withDur([N.bonk, N.beam, N.gems, N.tantrum, N.refract]) },
      { at: 0.66, line: 'Mirror, mirror!', lineSub: "...on the wall, who's the bravest of all? ME!", list: withDur([E.mirror, N.portrait, N.bonk, N.refract, N.gems, N.tantrum]) },
      { at: 0.33, line: 'Mirror ME!', lineSub: 'Everything he does, the mirrors do again!', list: withDur(P3_TRIAL) },
      { at: 0.12, line: "I'll put out EVERY light!", lineSub: 'Faster! FASTER!', list: withDur(fast(P3_TRIAL)) },
    ],
  },
};
