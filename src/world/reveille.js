// Madame Reveille's fight (2026-11-27, the finale's trial rebuilt with her: the Queen's alarm clock grown into a brisk
// morning governess on the palace lawn at dawn). Run by world/story.js like the queens' moves, as a set rotation of
// named casts (the way the Grand Kettle fights): each cast on the cast bar under her health bar while she performs it,
// its telegraph laid on the lawn as it starts, landing as it ends; three phases at her health marks, each adding to the
// last, the last one quicker. Every telegraph is drawn whole in her own look (render/reveille/looks.js). Nothing of the
// old fight is left (no snoozes knocking her quiet, no clock hands, no "IT'S MONDAY!" floor).
//
// She means to get the Queen up, washed, dressed and off to Monday, and you are in the way. Her fight is a morning:
//   intro    Good Morning!        her bell rung high over her head (her entrance cast; nothing lands)
//   phase 1  (Six A.M.)
//            Morning Bell         (the buster) a great brass bell's shadow follows you, then stops and drops: step out
//                                 from under it once it stops
//            Ring-a-Ding          three rings of sound rolling along the lawn, ring... ring... RING: jump each one
//            The Snooze Button    (her signature) three big snooze buttons pop up on the lawn and she points at the
//                                 lit one: the whole lawn RINGS but whoever stands on that button (jumping won't help)
//            Rise and Shine!      (the raid-wide) dawn washes over the whole lawn: everyone takes it, nothing to dodge
//   phase 2  (two thirds down: "Five more minutes?! NO!")
//            Cock-a-Doodle-Doo!   she crows ahead of her, a wide blast along the lawn: get behind her
//            Five More Minutes?   (the spread) three little alarm clocks follow you and drop where you stood, one
//                                 after another: keep moving, never stop on one
//            Snooze Again?!       the buttons again, but she changes her mind halfway: stand on the first lit one,
//                                 then run to the second
//   phase 3  (a third left: "RIIIIIIIIING!!"), everything quicker
//            First Light          (the stack) a beam of first light settles on a spot on the lawn: gather in it and
//                                 share a gentle warmth; the rest of the lawn gets the full alarm
// Damage is a share (`k`) of her own `damage`. Zones use world/story.js's kinds: `follow` (it follows you until `lock`
// seconds before it lands), 'mark' (a column: it catches you in the air or up on a ledge too), 'raid' (it catches
// everyone), `stack` (a stack's own spot: its hit shared by whoever gathers in it; alone, a gentle one).

// A lane from her toward the hero, `w` long.
function lane(q, p, w) {
  const dir = Math.sign(p.x - q.x) || 1;
  return { kind: 'lane', x: dir > 0 ? q.x : q.x - w, w, flow: dir };
}
const HOLD = { rvBell: 0.9, rvRing: 0.7, rvSnooze: 1.0, rvRise: 1.1, rvDoodle: 0.9, rvClock: 0.8, rvLight: 1.1 };
const z = (look, o) => ({ look, hold: HOLD[look], ...o });
const W = (map) => map?.width ?? 1400;
// Three button spots round you, on screen (about 210 px apart), each a little jittered; the lit one never the one
// under you.
function buttons(map, p, n = 3) {
  const w = W(map);
  const mid = Math.max(330, Math.min(w - 330, p.x));
  const xs = [-1, 0, 1].slice(0, n).map((d) => mid + d * 210 + (Math.random() - 0.5) * 50);
  const far = xs.filter((x) => Math.abs(x - p.x) > 140);
  return { xs, lit: far[Math.floor(Math.random() * far.length)] ?? xs[0] };
}
// The whole lawn but one gap (the lit button, the first light): two tall lanes either side of it.
// (each a 'mark': a column catching you on the lawn, in the air or up on a ledge alike; x its middle)
function allBut(map, gx, half, look, k, extra = {}) {
  const w = W(map);
  const col = (x0, x1, more) => z(look, { kind: 'mark', col: true, x: (x0 + x1) / 2, w: Math.max(1, x1 - x0), k, ...extra, ...more });
  return [col(0, gx - half, {}), col(gx + half, w, { art: false })];
}

const STEPS = {
  bell: {
    id: 'bell', name: 'Morning Bell', sub: 'Out from under the bell once it stops!', dur: 2.6, after: 1.6,
    make: (q, p) => [z('rvBell', { kind: 'circle', x: p.x, w: 84, k: 1.6, follow: true, lock: 0.8 })],
  },
  ring: {
    id: 'ring', name: 'Ring-a-Ding', sub: 'Ring... ring... RING! Jump each one!', dur: 2.2, after: 2.4,
    make: (q, p, map) => [0, 0.9, 1.8].map((d, i) => z('rvRing', { kind: 'lane', x: 0, w: W(map), low: true, k: 0.7, warn: 2.2 + d, beat: i, fromX: q.x })),
  },
  snooze: {
    id: 'snooze', name: 'The Snooze Button', sub: 'Stand on the LIT button!', dur: 3.2, after: 1.8,
    make: (q, p, map) => {
      const B = buttons(map, p);
      return allBut(map, B.lit, 30, 'rvSnooze', 1.2, { art: true, xs: B.xs, lit: B.lit });
    },
  },
  rise: {
    id: 'rise', name: 'Rise and Shine!', sub: 'Dawn for everyone: brace yourself', dur: 2.8, after: 1.6,
    make: () => [z('rvRise', { kind: 'raid', k: 0.5 })],
  },
  doodle: {
    id: 'doodle', name: 'Cock-a-Doodle-Doo!', sub: 'Get behind her!', dur: 2.4, after: 1.6,
    make: (q, p) => {
      const L = lane(q, p, 620);
      return [z('rvDoodle', { kind: 'mark', col: true, x: L.x + L.w / 2, w: L.w, flow: L.flow, from0: q.x, k: 1.1 })];
    },
  },
  minutes: {
    id: 'minutes', name: 'Five More Minutes?', sub: 'Keep moving: the clocks drop where you stood!', dur: 2.0, after: 2.2,
    make: (q, p) => [0, 0.75, 1.5].map((d, i) => z('rvClock', { kind: 'circle', x: p.x, w: 66, k: 0.8, warn: 2.0 + d, follow: true, lock: 0.7, n: i })),
  },
  again: {
    id: 'again', name: 'Snooze Again?!', sub: 'The lit button, then the NEXT one!', dur: 4.2, after: 1.8,
    make: (q, p, map) => {
      const B = buttons(map, p);
      const others = B.xs.filter((x) => x !== B.lit);
      const second = others[Math.floor(Math.random() * others.length)];
      return [
        ...allBut(map, B.lit, 30, 'rvSnooze', 1.1, { art: true, xs: B.xs, lit: B.lit, next: second, warn: 2.4, seq: 0 }),
        ...allBut(map, second, 30, 'rvSnooze', 1.1, { art: true, xs: B.xs, lit: second, warn: 4.2, seq: 1 }),
      ];
    },
  },
  light: {
    id: 'light', name: 'First Light', sub: 'Gather in the first light!', dur: 3.2, after: 1.8,
    make: (q, p, map) => {
      const w = W(map);
      const opts = [];
      // (a spot you can see from where you stand, a good walk away)
      for (let x = 180; x <= w - 180; x += 20) if (Math.abs(x - p.x) >= 170 && Math.abs(x - p.x) <= 270) opts.push(x);
      const gx = opts.length ? opts[Math.floor(Math.random() * opts.length)] : w / 2;
      return [z('rvLight', { kind: 'circle', x: gx, w: 130, high: true, k: 0.3, stack: true, fromX: q.x, art: true }), ...allBut(map, gx, 65, 'rvLight', 1.3, { gx })];
    },
  },
};
// (the last phase: every cast quicker, its pause shorter)
const quick = (s) => ({ ...s, dur: s.dur * 0.82, after: Math.max(1.1, s.after * 0.72), make: (q, p, map) => s.make(q, p, map).map((o) => (o.warn ? { ...o, warn: o.warn * 0.82 } : o)) });

export const REVEILLE = {
  color: '#f4a83c', light: '#fff4d6',
  damage: 420,
  moves: [],
  adds: { at: [], mob: null },
  rotation: {
    intro: { id: 'entrance', name: 'Good Morning!', sub: 'She rings in the day.', dur: 3.2, after: 1.2, pose: 'entrance' },
    phases: [
      { at: 1, list: [STEPS.bell, STEPS.ring, STEPS.snooze, STEPS.rise] },
      { at: 0.66, line: 'Five more minutes?! NO!', lineSub: 'Not one more minute!', list: [STEPS.doodle, STEPS.minutes, STEPS.bell, STEPS.again, STEPS.ring, STEPS.rise] },
      { at: 0.33, line: 'RIIIIIIIIING!!', lineSub: 'EVERYBODY UP!', list: [STEPS.light, STEPS.doodle, STEPS.minutes, STEPS.again, STEPS.bell, STEPS.rise, STEPS.ring, STEPS.snooze].map(quick) },
    ],
  },
};
