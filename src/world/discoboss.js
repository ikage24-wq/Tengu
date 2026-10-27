// Dancing Green's fight. The boss stands in the middle of his stage and dances; his attacks are
// set to a 120 bpm beat and always shown before they land:
// - Do the Hustle: a rainbow wall rises on your side, then that half of the stage is hit.
// - 2-snap / 4-snap Twist: a cube wall builds on your side; that side is hit two or four times on
//   the beat, then the other side once with no warning.
// - Deep Cut: a high kick that slashes the ground in front of him.
// - Funky Floor: the floor tiles light up in a checkerboard and burst, swapping each time.
// - Disco Infernal: spotlights drift over the stage; when the timer runs out, be standing in one.
// - Ride the Waves: waves of light race across the floor; jump over them.
// - Ensemble Assemble, then Let's Dance!: eight frog dancers each raise a hand in turn; then he
//   cleaves the stage eight times, each toward the hand its frog raised. Dodge them all for a
//   Perfect Groove (his Let's Pose! after barely hurts).
// - Frogtourage: frogs moonwalk across the floor and their tracks burst.
// - Celebrate Good Times: a small hit on everyone.
// - Hi-NRG Fever: if the fight runs too long he powers up and wipes the stage.
// The intro: he struts and dances in his stage clothes, strikes his point, and red energy swallows
// him; he comes out in his toad form and the fight begins.

import { hurtPlayer } from './world.js';

const BEAT = 0.5;
const ENRAGE_AT = 330; // seconds of fighting before Hi-NRG Fever
const CUT = 13.4; // the cutscene before the fight
const HOME = 640; // centre stage
const WINGS = 1040; // where he struts in from

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Each step: the move he dances, how long it lasts, and what it puts on the stage.
const STEPS = [
  { move: 'groove', dur: 2 },
  { move: 'hustle', dur: 3, run: hustle },
  { move: 'groove', dur: 1 },
  { move: 'deepcut', dur: 2.4, run: deepCut },
  { move: 'twist', dur: 4, run: (w, m, s) => twist(w, m, s, 2) },
  { move: 'celebrate', dur: 2.6, run: celebrate },
  { move: 'funky', dur: 5.2, run: funky },
  { move: 'disco', dur: 9, run: discoInfernal },
  { move: 'waves', dur: 5, run: waves },
  { move: 'assemble', dur: 3, run: assemble },
  { move: 'groove', dur: 4.6, run: null },
  { move: 'dance', dur: 4.2, run: letsDance },
  { move: 'pose', dur: 2.6, run: letsPose },
  { move: 'moon', dur: 4, run: frogtourage },
  { move: 'twist', dur: 4, run: (w, m, s) => twist(w, m, s, 4) },
  { move: 'groove', dur: 2 },
];

const atk = (m, k) => Math.round(m.def.atk * k);
const call = (w, text, color, dur = 1.6, size = 18) => w.disco.callouts.push({ text, color, at: w.now, dur, size });
const sideOf = (w, m) => (w.body.x < m.x ? -1 : 1);
// The half of the stage on one side of the boss.
const half = (w, m, side) => (side < 0 ? [0, m.x] : [m.x, w.map.width]);

function zone(w, z) {
  w.disco.zones.push({ hit: false, ...z });
}

function hustle(w, m, s) {
  const side = sideOf(w, m);
  const [x0, x1] = half(w, m, side);
  zone(w, { kind: 'half', side, x0, x1, from: s, at: s + 1.3, dmg: atk(m, 1.6) });
  call(w, 'Do the Hustle!', '#ff9ad6');
}

function deepCut(w, m, s) {
  const dir = sideOf(w, m);
  m.dir = dir;
  zone(w, { kind: 'cone', dir, x0: dir > 0 ? m.x : m.x - 170, x1: dir > 0 ? m.x + 170 : m.x, from: s + 0.3, at: s + 1.1, dmg: atk(m, 2) });
}

function twist(w, m, s, snaps) {
  const side = sideOf(w, m);
  const [x0, x1] = half(w, m, side);
  const [o0, o1] = half(w, m, -side);
  const hits = snaps === 2 ? [1.4, 2] : [0.8, 1.4, 2, 2.6];
  for (const at of hits) zone(w, { kind: 'half', side, x0, x1, from: s, at: s + at, dmg: atk(m, 1.1), cubes: true });
  // The last snap hits the other side, with no wall to warn you.
  zone(w, { kind: 'half', side: -side, x0: o0, x1: o1, from: s + hits.at(-1) + 0.05, at: s + 3.2, dmg: atk(m, 1.3), blind: true });
  call(w, `${snaps}-snap Twist!`, '#c6e8ff');
}

function celebrate(w, m, s) {
  zone(w, { kind: 'raid', from: s, at: s + 0.7, dmg: atk(m, 0.5) });
  call(w, 'Celebrate Good Times!', '#ffe36b');
}

function funky(w, m, s) {
  const T = 72;
  for (let i = 0; i < 4; i++) zone(w, { kind: 'tiles', T, parity: i % 2, from: s + i * 1.2, at: s + i * 1.2 + 0.9, dmg: atk(m, 1.2) });
  call(w, 'Funky Floor!', '#ffb347');
}

function discoInfernal(w, m, s) {
  const lights = [0, 1, 2].map((i) => ({ x: 120 + i * 380 + Math.random() * 80, vx: (i % 2 ? -1 : 1) * (40 + Math.random() * 30) }));
  zone(w, { kind: 'spot', lights, w: 60, from: s, at: s + 4.5, dmg: atk(m, 2.2), until: s + 8.5 });
  zone(w, { kind: 'spot', lights, w: 60, from: s, at: s + 8, dmg: atk(m, 2.2) });
  call(w, 'Bask in the spotlight!', '#fff6c8');
}

function waves(w, m, s) {
  zone(w, { kind: 'wave', x0: 20, dir: 1, speed: 360, from: s, at: s + 0.9, dmg: atk(m, 1.4) });
  zone(w, { kind: 'wave', x0: w.map.width - 20, dir: -1, speed: 360, from: s + 1.8, at: s + 2.7, dmg: atk(m, 1.4) });
  zone(w, { kind: 'wave', x0: 20, dir: 1, speed: 420, from: s + 3.1, at: s + 3.8, dmg: atk(m, 1.4) });
  call(w, 'Ride the Waves!', '#8fe0ff');
}

function assemble(w, m, s) {
  const xs = Array.from({ length: 8 }, (_, i) => w.map.width / 2 + (i - 3.5) * 70);
  // The frogs pop up, then each raises a hand in turn, one per beat.
  w.disco.frogs = xs.map((x, i) => ({ x, from: s + 1 + i * 0.12, poseAt: s + 3.6 + i * BEAT, hand: pick([-1, 1]) }));
  w.disco.groove = 0;
  call(w, "You're up, dancers!", '#9fff8f');
}

function letsDance(w, m, s) {
  // Eight cleaves, one per beat, each toward the hand its frog raised.
  w.disco.frogs.forEach((f, i) => {
    const [x0, x1] = half(w, m, f.hand);
    zone(w, { kind: 'half', side: f.hand, x0, x1, from: s + i * BEAT - 0.25, at: s + i * BEAT + 0.25, dmg: atk(m, 1), dance: true, blind: true, point: f.hand });
  });
  call(w, "Let's Dance!", '#9fff8f');
}

function letsPose(w, m, s) {
  const perfect = w.disco.groove >= 8;
  if (perfect) call(w, 'PERFECT GROOVE!', '#ffe36b', 2.2, 24);
  zone(w, { kind: 'raid', from: s, at: s + 0.6, dmg: atk(m, perfect ? 0.2 : 0.5 + 0.25 * (8 - w.disco.groove)) });
  w.disco.hearts.push({ x: m.x + m.dir * 30, y: m.y - 80, dx: m.dir, at: s + 0.6 });
  w.disco.frogs = null;
}

function frogtourage(w, m, s) {
  // Two frogs moonwalk across the floor; their tracks burst a beat after they finish.
  const segs = Math.random() < 0.5 ? [[60, 400], [700, 1040]] : [[280, 820]];
  segs.forEach(([x0, x1], i) => zone(w, { kind: 'track', x0, x1, dir: i % 2 ? -1 : 1, from: s + 0.3, walk: 1.6, at: s + 2.6, dmg: atk(m, 1.5) }));
  call(w, 'Back to it, dancers!', '#9fff8f');
}

function enrage(w, m, s) {
  zone(w, { kind: 'raid', from: s, at: s + 3, dmg: 999999 });
  call(w, 'Hi-NRG Fever!', '#ff6b8a', 3, 24);
}

// Whether the player stands in a zone when it lands.
function inZone(w, z) {
  const b = w.body;
  if (z.kind === 'half' || z.kind === 'cone') return b.x >= z.x0 && b.x <= z.x1 && (z.kind === 'half' || b.y > w.map.groundY - 90);
  if (z.kind === 'tiles') return b.onGround && ((Math.floor(b.x / z.T) % 2) + 2) % 2 === z.parity;
  if (z.kind === 'track') return b.onGround && b.x >= z.x0 && b.x <= z.x1;
  if (z.kind === 'raid') return true;
  if (z.kind === 'spot') return !z.lights.some((l) => Math.abs(b.x - (l.x + l.vx * (w.now - z.from))) < z.w / 2);
  return false;
}

export function tickDisco(world, dt) {
  const m = world.mobs.find((x) => x.def.disco);
  if (!m) {
    world.disco = null;
    world.cutscene = false;
    return;
  }
  const b = (world.disco ??= { zones: [], callouts: [], hearts: [], frogs: null, groove: 0 });
  const brain = (m.brain ??= { form: 'human', move: 'cut', moveT: world.now, cutAt: world.now, step: -1, stepAt: 0, started: world.now + CUT, charge: 0, fightT: 0 });
  if (m.hp <= 0) {
    b.zones = [];
    b.frogs = null;
    world.cutscene = false;
    if (!brain.saidBye) {
      brain.saidBye = true;
      call(world, 'That was one helluva party!', '#ffe36b', 3, 16);
    }
    b.callouts = b.callouts.filter((c) => world.now - c.at < c.dur);
    return;
  }
  // The cutscene: controls are off and the camera is the director's (render/scene.js reads
  // b.cut). Any key skips to the fight.
  if (world.now < brain.started) {
    if (world.cutSkip) {
      brain.started = world.now;
      brain.form = 'toad';
    } else {
      const t = world.now - brain.cutAt;
      b.cut = t;
      world.cutscene = true;
      // He struts in from the wings to centre stage.
      const walk = Math.max(0, Math.min(1, (t - 1.5) / 2.1));
      m.x = HOME + (WINGS - HOME) * (1 - walk);
      brain.walking = t > 1.5 && t < 3.6;
      m.dir = brain.walking ? -1 : 1;
      if (t < 1.5) m.x = WINGS;
      // Keep you out of his way, facing the stage.
      world.body.x = Math.min(world.body.x, HOME - 220);
      world.body.facing = 1;
      brain.charge = t > 6.8 && t < 8.8 ? ((t - 6.8) / 2) ** 1.5 : 0;
      if (t > 6.8 && t < 8.6 && Math.floor(t * 8) !== Math.floor((t - dt) * 8)) world.juice.push({ type: 'shake', mag: 2 + 5 * brain.charge, dur: 0.15 });
      if (t >= 8.7 && brain.form === 'human') {
        brain.form = 'toad';
        b.flashAt = world.now;
        world.juice.push({ type: 'shake', mag: 8, dur: 0.6 });
      }
      return;
    }
  }
  if (b.cut != null) {
    b.cut = null;
    world.cutscene = false;
    world.cutSkip = false;
    brain.walking = false;
    brain.charge = 0;
    brain.form = 'toad';
    m.x = HOME;
    brain.stepAt = world.now + 0.6;
    call(world, "Let's dance!", '#ffe36b', 1.6, 22);
  }
  brain.charge = 0;
  brain.fightT += dt;
  // Face the player between moves.
  if (brain.move === 'groove') m.dir = world.body.x < m.x ? -1 : 1;
  // The next step.
  if (world.now >= brain.stepAt) {
    if (brain.fightT > ENRAGE_AT && !brain.enraged) {
      brain.enraged = true;
      brain.move = 'enrage';
      brain.moveT = world.now;
      brain.stepAt = world.now + 4;
      enrage(world, m, world.now);
    } else {
      brain.step = (brain.step + 1) % STEPS.length;
      const st = STEPS[brain.step];
      brain.move = st.move === 'dance' ? 'groove' : st.move;
      brain.moveT = world.now;
      brain.stepAt = world.now + st.dur;
      st.run?.(world, m, world.now);
    }
  }
  // Let's Dance: he points toward each cleave as it comes.
  const dancing = b.zones.find((z) => z.dance && !z.hit && world.now >= z.from);
  if (dancing && STEPS[brain.step]?.move === 'dance') {
    const want = dancing.point < 0 ? 'pointL' : 'pointR';
    if (brain.move !== want || brain.danceZ !== dancing) {
      brain.move = want;
      brain.moveT = world.now;
      brain.danceZ = dancing;
    }
    m.dir = 1;
  }
  // Resolve zones.
  for (const z of b.zones) {
    if (z.hit || world.now < z.at) continue;
    if (z.kind === 'wave') {
      // A wave is live while it crosses the stage.
      const wx = z.x0 + z.dir * z.speed * (world.now - z.at);
      if (wx < -40 || wx > world.map.width + 40) {
        z.hit = true;
        continue;
      }
      if (!world.dead && Math.abs(world.body.x - wx) < 12 && world.body.y > world.map.groundY - 18) {
        z.hit = true;
        hurtPlayer(world, z.dmg, wx - z.dir * 20);
      }
      continue;
    }
    z.hit = true;
    if (z.kind === 'raid' || z.kind === 'half' || z.kind === 'tiles' || z.kind === 'track') world.juice.push({ type: 'shake', mag: z.kind === 'raid' ? 5 : 3, dur: 0.3 });
    const struck = !world.dead && inZone(world, z);
    if (struck) hurtPlayer(world, z.dmg, m.x);
    if (z.dance && !struck) b.groove++;
    if (z.kind === 'spot') call(world, struck ? 'Missed the spotlight!' : 'Strike a pose!', struck ? '#ff8fa8' : '#fff6c8', 1.2, 14);
  }
  b.zones = b.zones.filter((z) => !(z.hit && world.now - z.at > 0.6) && !(z.until && world.now > z.until));
  b.callouts = b.callouts.filter((c) => world.now - c.at < c.dur);
  b.hearts = b.hearts.filter((h) => world.now - h.at < 1.6);
}
