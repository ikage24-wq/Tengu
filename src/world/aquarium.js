// What makes each room of the Sunken Aquarium Palace its own (docs/design/aquarium-palace.md; the
// map fields are described in data/maps.js), and its three boss fights. world/dungeon.js calls in
// here; the drawing is in render/aquarium.js.
//
//   The Coral Gate     bubble lifts rise between the floors (updrafts of bubbles: press Up in
//                      them); light the three lantern corals.
//   The Kelp Gardens   currents sweep along a floor at a time: they carry you if you go with them
//                      and push you back if you don't.
//   The Pearl Vault    the puzzle: the tide bell rings an order (a new one each run); open the clams
//                      in that order. A wrong clam snaps every open one shut and spits a jellyfish.
//   The Moray Grotto   Murri and Ena, the Twin Morays (2026-11-26): Peekaboo from the burrows, then
//                      Sister's Pick (stand their two marks together and they tangle in a knot),
//                      then Not Fair! (below).
//   The Ink Abyss      the tide surges up the shaft (get up on a ledge); Lady Abyssia, the Sea Witch
//                      (2026-11-26): Lights Out! (the dark comes down: stand in a lantern's beam),
//                      her darlings' lanterns, the lanterns adrift (below).
//   The Throne of Tides  Queen Coralie (2026-11-26): her Display Cases come down in numbered order,
//                      then the Royal Portrait (everyone into the frame), then Glass Walls closing
//                      in (below). Freed at the end.

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { killMob } from './world.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';
import { runRotation, buster, spread, raidwide, donut, out, cleave, tankOf, healerOf, dpsOf } from './bossfight.js';

export const AQUA_MECHS = new Set(['moray', 'abyssia', 'coralie']);
export const AQUA_CHANNEL = { coral: 1, clam: 0.6, fishtank: 1.8 };

// ---------- Rooms ----------

export function aquaSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'aquarium') return;
  // The vault: the bell's order, a fresh shuffle each run.
  const clams = room.objects.filter((o) => o.kind === 'clam');
  if (clams.length) {
    const order = clams.map((o) => o.id).sort(() => Math.random() - 0.5);
    room.bell = { order, next: 0 };
    clams.forEach((o) => (o.label = order.indexOf(o.id) + 1));
  }
  room.currents = (map.currents ?? []).map((c, i) => ({ ...c, t: 3 + i * 4, on: false, since: 0 }));
}

// The bell's order, for the callout as you walk in.
export const bellWords = (room) => `The tide bell rings: ${room.bell.order.map((id) => room.objects[id].mark).join(' · ')}`;

// Opening a clam: right if it's the next in the bell's order; a wrong one snaps every open clam
// shut and spits out a jellyfish. Returns whether it opened.
export function openClam(world, o) {
  const room = world.dungeon.room;
  const b = room.bell;
  if (b.order[b.next] === o.id) {
    b.next++;
    o.openAt = world.now;
    return true;
  }
  for (const c of room.objects) {
    if (c.kind !== 'clam' || !c.done) continue;
    c.done = false;
    c.progress = 0;
    c.snapAt = world.now;
  }
  b.next = 0;
  o.snapAt = world.now;
  o.progress = 0;
  adds(world, { x: o.x }, 'jellymaid', [o.x + 40], null);
  callout(world, 'SNAP!', 'Wrong clam: they all shut. Start the order again');
  return false;
}

export function tickAqua(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  if (world.map.dungeon !== 'aquarium' || !room) return;
  // Currents: on for a while, then still; going with one carries you, going against it is slow.
  for (const c of room.currents ?? []) {
    c.t -= dt;
    c.since += dt;
    if (c.t <= 0) {
      c.on = !c.on;
      c.t = c.on ? c.last : c.every;
      c.since = 0;
      if (c.on && up.some((g) => Math.abs(g.body.y - c.y) < 40)) callout(world, 'Current!', c.dir > 0 ? 'The water pulls right' : 'The water pulls left');
    }
    if (!c.on) continue;
    for (const g of up) {
      const b = g.body;
      if (Math.abs(b.y - c.y) > 40 || b.x < c.x1 || b.x > c.x2 || b.rope) continue;
      b.x = Math.max(c.x1, Math.min(c.x2, b.x + c.dir * 110 * dt));
    }
  }
  // Queen Coralie's Keepsake Bubbles: one that reaches someone keeps them, floating inside it, till
  // it's popped (hit it, from inside or out); one that's held anyone long enough lets go by itself.
  for (const b of world.mobs) {
    if (b.def.id !== 'keepsake' || b.hp <= 0) continue;
    b.atkT = 99;
    if (b.heldId == null) {
      const g = up.find((o) => Math.abs(o.body.x - b.x) < 16 && Math.abs(o.body.y - b.y) < 34 && !world.mobs.some((q) => q !== b && q.heldId === o.id && q.hp > 0));
      if (g) {
        b.heldId = g.id;
        b.heldAt = world.now;
        if (g.id === 'you') callout(world, 'Kept in a bubble!', 'Hit it to pop your way out');
      }
      continue;
    }
    const g = up.find((o) => o.id === b.heldId);
    if (!g || world.now - b.heldAt > 7) {
      killMob(world, b);
      continue;
    }
    b.frozenUntil = world.now + 0.2;
    g.body.x = b.x;
    g.body.y = b.y - 22;
    g.body.vx = 0;
    g.body.vy = 0;
  }
}

// ---------- The bosses ----------

// A share of a hit that reaches an aquarium boss: a moray hiding in her burrow can't be reached.
export function aquaHitMul(world, m) {
  if (m.def.mech === 'moray' && m.burrowed) return 0;
  // (tied in a knot with her sister: every blow lands harder)
  if (m.def.mech === 'moray' && m.tangle && world.now < m.tangle.until) return MO.knotMul;
  return 1;
}

export function aquaBoss(world, m, up, dt) {
  if (m.def.mech === 'moray') return moray(world, m, up, dt);
  if (m.def.mech === 'abyssia') return abyssia(world, m, up, dt);
  if (m.def.mech === 'coralie') return coralie(world, m, up, dt);
  return false;
}

// ---------- The Moray Grotto: Murri and Ena, the Twin Morays (remade 2026-11-26) ----------
// Two moray eel sisters (render/moray/) who have had no visitors since the palace sank and would
// like to keep these ones. One rotation for both (world/bossfight.js, `by`), each cast on its
// caster's own cast bar, its telegraph drawn in their own look (render/moray/looks.js). Phases go by
// the pair's health together:
//   Peekaboo (to 65%)     one sister out, the other hiding in a burrow, out of reach. Chomp Chomp! (a
//                         big bite on the tank), Sister Gossip (a whisper bubble over each of you:
//                         spread), then Peekaboo! (the hidden one bursts out of a burrow, the hole
//                         bubbling first: clear its mouth); she stays out and her sister ducks into
//                         the other burrow ("your turn!").
//   Tangle Time (to 25%)  both out. Sister's Pick (each dives into the burrow at her end of the
//                         grotto and marks one of you in her own colour, then lunges out along the
//                         floor at her mark: stand the two marked ones together and the sisters crash
//                         nose to nose in the middle and tie themselves in a knot: Tangled! they can't
//                         move and take half again from every blow for a while; apart, two lunges
//                         bowl over whoever is in the way); Twin Twirl (each coils and spins: out from
//                         round both); Chomp Chomp!; Sister Gossip.
//   Not Fair! (below 25%) Double Peekaboo (both burrows burst at once, a big bubble over one of you in
//                         the middle: everyone in it, together); Sister's Pick; Grotto Squabble (they
//                         squabble and it hurts everyone: healer, ready); Chomp Chomp!.
// When one falls the other sulks alone: nobody to tangle with, so no more picks; Peekaboo from the
// burrow nearest you, and everything comes quicker.
// Each one's state for her rig: m.cast / m.castPose (poses 'chomp', 'gossip', 'peek', 'pick', 'twirl',
// 'squabble'), m.burrowed (in a burrow: her head in the hole, out of reach) and m.diveAt / m.popAt
// (into it and out), m.charging (a lunge), m.tangle { at, until, with } (knotted with her sister),
// m.alone (her sister down), m.phaseAt.
const MO = { chomp: 330, gossip: 135, peek: 210, peekW: 230, pick: 240, pickSpeed: 520, knot: 7, knotMul: 1.5, twirl: 175, twirlR: 112, huddle: 560, squabble: 150 };
const sistersOf = (world) => {
  const all = world.mobs.filter((o) => o.def.mech === 'moray');
  return { murri: all.find((o) => o.def.id === 'moraymurri' && o.hp > 0) ?? null, ena: all.find((o) => o.def.id === 'morayena' && o.hp > 0) ?? null, all };
};
const MID = (world) => world.map.width / 2;
const pick1 = (list) => (list.length ? list[Math.floor(Math.random() * list.length)] : null);
// (the two burrows, the left one first)
const holes = (world) => [...(world.map.burrows ?? [120, world.map.width - 120])].sort((p, q) => p - q);
// (the burrow nearer most of the group)
const nearHole = (world, up) => {
  const [h0, h1] = holes(world);
  return up.filter((g) => g.body.x < MID(world)).length * 2 >= up.length ? h0 : h1;
};
// A dive into a burrow: she's there at once (her rig plays the dive), out of reach till she pops out.
function dive(world, m, bx) {
  m.burrowed = true;
  m.burrowX = bx;
  m.x = bx;
  m.charging = null;
  m.diveAt = world.now;
  m.state = 'idle';
}
function popOut(world, m, x) {
  m.burrowed = false;
  m.popAt = world.now;
  if (x != null) m.x = Math.max(m.fx1 ?? 40, Math.min(m.fx2 ?? world.map.width - 40, x));
}
const outOf = (world, bx) => bx + (bx < MID(world) ? 70 : -70);
// A bite at a burrow's mouth, the hole bubbling as it builds.
const peekZone = (world, m, bx, dur) => addZone(world, { kind: 'circle', x: bx, y: world.map.groundY, w: MO.peekW, warn: dur, damage: MO.peek, from: m, noSprout: true, look: 'mrPeek' });
// The pick: each sister dives into the burrow at her own end and marks one of you; the lunges go
// when it ends.
function pickMarks(world, up, dur) {
  const sis = sistersOf(world);
  if (!sis.murri || !sis.ena) return;
  const [h0, h1] = holes(world);
  const [left, right] = sis.murri.x <= sis.ena.x ? [sis.murri, sis.ena] : [sis.ena, sis.murri];
  dive(world, left, h0);
  dive(world, right, h1);
  const pool = up.filter((g) => g.role !== 'tank');
  const from = pool.length >= 2 ? pool : up;
  const ga = pick1(from);
  const gb = pick1(from.filter((g) => g !== ga)) ?? ga;
  for (const [m, g] of [[sis.murri, ga], [sis.ena, gb]]) {
    if (!g) continue;
    addZone(world, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w: 62, warn: dur, lock: 0.7, damage: 0, tele: true, from: m, look: m === sis.murri ? 'mrPickM' : 'mrPickE' });
    m.pickOn = g.id;
  }
  sis.murri.mech.pickAt = world.now + dur;
}
const CHOMP = (by) => ({ gap: 2.2, look: 'mrChomp', cast: 'Chomp Chomp!', dur: 2.8, pose: 'chomp', by, sub: 'A big bite on the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), MO.chomp, 2.8, 86) });
const GOSSIP = (by) => ({ gap: 2.4, look: 'mrGossip', cast: 'Sister Gossip', dur: 3, pose: 'gossip', by, sub: 'A whisper bubble over each of you: spread out!', run: (w, m, up) => spread(w, m, up, MO.gossip, 3, 74) });
const PEEK = {
  gap: 2.2, cast: 'Peekaboo!', dur: 2.6, pose: 'peek', by: 'hid', sub: 'A burrow bubbles: keep clear of its mouth!',
  run: (w, m, up) => {
    const bx = nearHole(w, up);
    // (she slips through the walls to that burrow first)
    if (m.burrowed && m.burrowX !== bx) dive(w, m, bx);
    peekZone(w, m, bx, 2.6);
    m.peekTo = bx;
    (sistersOf(w).murri ?? m).mech.peekAt = w.now + 2.6;
  },
};
const PICK = { gap: 2.4, cast: "Sister's Pick", dur: 4.2, pose: 'pick', sub: 'Each marks one of you, then lunges: stand the two marked ones together to tangle them!', run: (w, m, up) => pickMarks(w, up, 4.2) };
const TWIRL = {
  gap: 2.4, cast: 'Twin Twirl', dur: 2.6, pose: 'twirl', sub: 'They coil and spin: get out from round both!',
  run: (w, m) => {
    const { murri, ena } = sistersOf(w);
    for (const o of [murri, ena]) if (o && !o.burrowed) addZone(w, { kind: 'circle', x: o.x, y: w.map.groundY, w: MO.twirlR * 2, warn: 2.6, damage: MO.twirl, from: o, noSprout: true, look: 'mrTwirl' });
    for (const o of [murri, ena]) if (o && o !== m) Object.assign(o, { cast: { name: 'Twin Twirl', t0: w.now, dur: 2.6 }, castPose: 'twirl', castEnd: w.now + 2.6 });
  },
};
const DOUBLE_PEEK = {
  gap: 2.4, cast: 'Double Peekaboo!', dur: 3.2, pose: 'peek', sub: 'Both burrows burst at once: everyone in the bubble in the middle, together!',
  run: (w, m, up) => {
    const { murri, ena } = sistersOf(w);
    const [h0, h1] = holes(w);
    const pair = [murri, ena].filter(Boolean);
    const [a, b] = pair.length === 2 && pair[0].x > pair[1].x ? [pair[1], pair[0]] : pair;
    for (const [o, bx] of [[a, h0], [b, h1]]) if (o) {
      dive(w, o, bx);
      peekZone(w, o, bx, 3.2);
      o.peekTo = bx;
      if (o !== m) Object.assign(o, { cast: { name: 'Double Peekaboo!', t0: w.now, dur: 3.2 }, castPose: 'peek', castEnd: w.now + 3.2 });
    }
    addZone(w, { kind: 'stack', target: (healerOf(up) ?? dpsOf(up))?.id, x: MID(w), y: w.map.groundY, w: 110, warn: 3.2, lock: 0.7, damage: MO.huddle, need: Math.min(3, up.length), from: m, look: 'mrHuddle' });
    (murri ?? m).mech.peekAt = w.now + 3.2;
  },
};
const SQUABBLE = { gap: 2.4, look: 'mrSquabble', cast: 'Grotto Squabble', dur: 3.2, pose: 'squabble', sub: 'The sisters squabble, and it hurts everyone: healer, ready!', run: (w, m) => raidwide(w, m, MO.squabble, 3.2) };
const SULK_PEEK = {
  gap: 2.2, cast: 'Sulky Peekaboo', dur: 2.4, pose: 'peek', sub: 'She dives, and bursts out of the burrow nearest you!',
  run: (w, m, up) => {
    const bx = nearHole(w, up);
    dive(w, m, bx);
    peekZone(w, m, bx, 2.4);
    m.peekTo = bx;
    m.mech.peekAt = w.now + 2.4;
  },
};
const PEEKABOO = [CHOMP('out'), GOSSIP('out'), PEEK];
const TANGLE = [PICK, TWIRL, CHOMP('murri'), GOSSIP('ena'), PICK, CHOMP('ena')];
const NOT_FAIR = [DOUBLE_PEEK, PICK, SQUABBLE, CHOMP('murri'), CHOMP('ena')];
const ALONE = [CHOMP(null), GOSSIP(null), SULK_PEEK, SQUABBLE].map((st) => ({ ...st, gap: Math.max(1.2, st.gap * 0.7) }));

function moray(world, m, up, dt) {
  const now = world.now;
  const sis = sistersOf(world);
  const sister = m === sis.murri ? sis.ena : sis.murri;
  const lead = sis.murri ?? sis.ena;
  const s = (m.mech ??= {});
  // (a cast laid on her by her sister's step ends on its own clock, as a rotation's does)
  if (m.castEnd != null && now >= m.castEnd) {
    if (m.cast) m.attackAt = now;
    Object.assign(m, { cast: null, castPose: null, castEnd: null, windup: 0 });
  }
  if (m.castEnd != null && m.cast) {
    const left = m.castEnd - now;
    m.windup = left > 0 && left < 0.5 ? left : 0;
  }
  if (m.burrowed === undefined) {
    m.burrowed = false;
    if (m.def.id === 'morayena') dive(world, m, holes(world)[1]);
  }
  // Her sister down: she sulks alone (out of any burrow, the pick and the knot forgotten).
  if (!sister && !m.alone) {
    m.alone = true;
    s.rot = null;
    s.pickAt = null;
    m.pickOn = null;
    m.tangle = null;
    if (m.burrowed && m.peekTo == null) popOut(world, m, outOf(world, m.burrowX));
    callout(world, `${m.def.name.split(',')[0]} sulks alone!`, 'Nobody left to tangle with: everything comes quicker');
    radio(world, 'moraymad');
  }
  if (m.tangle && now >= m.tangle.until) m.tangle = null;
  // Peekaboo: out of the burrow as the bite lands; in the first phase her sister ducks into the other.
  if (s.peekAt != null && now >= s.peekAt) {
    s.peekAt = null;
    const popped = [];
    for (const o of [sis.murri, sis.ena]) {
      if (!o || o.peekTo == null) continue;
      popOut(world, o, outOf(world, o.peekTo));
      o.peekTo = null;
      popped.push(o);
    }
    if ((s.phase ?? 1) === 1 && !m.alone && popped.length === 1) {
      const other = popped[0] === sis.murri ? sis.ena : sis.murri;
      if (other && !other.burrowed) {
        const [h0, h1] = holes(world);
        dive(world, other, popped[0].x < MID(world) ? h1 : h0);
        callout(world, 'Your turn!', `${other.def.name.split(',')[0]} ducks into a burrow: out of reach till she peeks`);
      }
    }
  }
  // Sister's Pick: out of the burrows and along the floor at their marks.
  if (s.pickAt != null && now >= s.pickAt) {
    s.pickAt = null;
    for (const o of [sis.murri, sis.ena]) {
      if (!o) continue;
      const z = world.dungeon.zones.find((q) => q.from === o && q.tele && (q.look === 'mrPickM' || q.look === 'mrPickE'));
      const g = up.find((q) => q.id === o.pickOn);
      const to = z ? z.x : g ? g.body.x : MID(world);
      popOut(world, o);
      o.pickOn = null;
      o.charging = { dir: Math.sign(to - o.x) || 1, to, hit: new Set(), lunge: true };
    }
  }
  // A lunge: along the floor to her mark, bowling over whoever is in the way; meeting her sister
  // head-on, the two tie themselves in a knot.
  const c = m.charging;
  if (c?.lunge) {
    m.state = 'walk';
    m.dir = c.dir;
    m.x += c.dir * MO.pickSpeed * dt;
    for (const g of up) {
      if (c.hit.has(g.id) || g.remote || Math.abs(g.body.x - m.x) > m.def.w / 2 + 6 || Math.abs(g.body.y - m.y) > 44) continue;
      c.hit.add(g.id);
      hurtMember(world, g, MO.pick, m.x - c.dir * 40, { knock: true });
    }
    const sc = sister?.charging;
    if (sc?.lunge && sc.dir === -c.dir && (sister.x - m.x) * c.dir < 46) {
      const x = (m.x + sister.x) / 2;
      for (const o of [m, sister]) {
        o.charging = null;
        o.x = x + (o === m ? -c.dir : c.dir) * 16;
        o.dir = o === m ? c.dir : -c.dir;
        o.tangle = { at: now, until: now + MO.knot, with: o === m ? sister.def.id : m.def.id, x };
        o.frozenUntil = now + MO.knot;
        o.state = 'idle';
      }
      callout(world, 'Tangled!', 'The sisters are tied in a knot: hit them now, every blow lands harder!');
      world.juice.push({ type: 'shake', mag: 4, dur: 0.35 });
      return true;
    }
    if ((c.dir > 0 && m.x >= c.to) || (c.dir < 0 && m.x <= c.to) || m.x <= (m.fx1 ?? 0) || m.x >= (m.fx2 ?? world.map.width)) {
      m.x = Math.max(m.fx1 ?? 0, Math.min(m.fx2 ?? world.map.width, c.to));
      m.charging = null;
      m.landAt = now;
    }
    return true;
  }
  // In a burrow: out of reach, her head in the hole.
  if (m.burrowed) {
    m.x = m.burrowX ?? m.x;
    m.state = 'idle';
  }
  if (lead !== m) return Boolean(m.cast) || Boolean(m.burrowed);
  // The phases, by the pair's health together (a fallen sister counts as none).
  const frac = sis.all.reduce((t, o) => t + Math.max(0, o.hp) / o.def.hp, 0) / Math.max(1, sis.all.length);
  const phase = frac > 0.65 ? 1 : frac > 0.25 ? 2 : 3;
  s.phase ??= 1;
  if (phase > s.phase && !m.cast && s.peekAt == null && s.pickAt == null && !m.alone) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      for (const o of [sis.murri, sis.ena]) if (o?.burrowed) popOut(world, o, outOf(world, o.burrowX));
      callout(world, 'Tangle Time!', 'Both sisters out: when each marks one of you, stand the two together');
    } else callout(world, 'Not Fair!', 'Sore losers: they squabble, and both burrows burst');
  }
  if (m.phaseAt != null && now - m.phaseAt < 1.4) return true;
  const hid = [sis.murri, sis.ena].find((o) => o?.burrowed) ?? null;
  const out = [sis.murri, sis.ena].find((o) => o && !o.burrowed) ?? m;
  const ctx = { murri: sis.murri, ena: sis.ena, out, hid: hid ?? out, caster: m };
  const list = m.alone ? ALONE : s.phase === 1 ? PEEKABOO : s.phase === 2 ? TANGLE : NOT_FAIR;
  return runRotation(world, m, list, up, dt, ctx) || Boolean(m.burrowed);
}

// ---------- The Ink Abyss: Lady Abyssia, the Sea Witch (remade 2026-11-26) ----------
// A little octopus sea witch (render/abyssia/) who has been draining the light out of the palace's
// bubble wards into her lanterns, so the deep can be dark, and hers. One rotation per phase (world/
// bossfight.js), each cast on her cast bar, its telegraph drawn in her own look (render/abyssia/
// looks.js). Phases go by her health:
//   Good Evening, Darlings (to 65%)  Kiss Goodnight (a big kiss on the tank), Ink Blots (a drop over
//                         each of you: spread), Lights Out! (the dark comes down over the whole room, all
//                         heights, but for the beams under three lanterns she hangs in the water: anyone
//                         outside a beam when it falls is hurt), Eight-Arm Embrace (her arms sweep the
//                         floor round her: in close) straight into Ink Flounce (a swirl of ink round
//                         her: now out).
//   Light the Way! (to 30%) she calls two of her Dumbo Lamplighters; now Lights Out!'s beams are the
//                         darlings' own lanterns (each freezes, trembling, its lantern held up, where it
//                         is: stand with it) and her own lantern, round her (topped up with hung ones
//                         if the darlings are gone); Ohohoho! (her laugh hurts everyone) joins in.
//   The Deep Is Mine (below 30%) she draws every light into her lantern: Lights Out! now hangs two
//                         lanterns that drift across the room as it falls (walk with the light), and
//                         everything comes quicker.
// The room's tide still surges up the shaft every so often (get up on a ledge). Her state for her rig:
// m.cast / m.castPose ('kiss', 'blot', 'snuff', 'embrace', 'flounce', 'cackle'), m.phaseAt (and
// m.mech.phase: 2 her darlings called, 3 the deep).
const AB = { kiss: 340, blot: 140, dark: 270, embrace: 200, embraceIn: 70, embraceR: 200, flounce: 190, flounceR: 92, cackle: 160, beamW: 86, drift: 44, lightsOut: 4.6 };
// The beams' gaps: the dark's stretches of the room (on the floor and up on the ledges), laid as zones
// that hurt nobody themselves (the dark's own hit is worked out when it falls) but that everyone dodges.
function darkGaps(world, beams) {
  const W = world.map.width;
  const hw = AB.beamW / 2;
  const xs = beams.map((b) => b.x).sort((p, q) => p - q);
  const gaps = [];
  let x0 = 0;
  for (const x of xs) {
    gaps.push([x0, Math.max(x0, x - hw)]);
    x0 = Math.max(x0, x + hw);
  }
  gaps.push([x0, W]);
  return gaps;
}
function setGaps(world, parts, beams) {
  const gaps = darkGaps(world, beams);
  parts.forEach((z, i) => {
    const [a, b] = gaps[Math.floor(i / 2)] ?? [0, 0];
    // (a gap closed up by two beams side by side: put out of the way)
    if (b - a < 2) Object.assign(z, { x: -9999, w: 0 });
    else Object.assign(z, { x: a, w: b - a });
  });
}
// Lights Out!: where the beams are this time.
function lanternBeams(world, m, how) {
  const W = world.map.width;
  const jit = () => (Math.random() - 0.5) * 120;
  const hung = (n) => {
    const list = [];
    for (let i = 0; i < n; i++) list.push({ x: Math.max(70, Math.min(W - 70, (W * (i + 0.5)) / n + jit())), own: false });
    return list;
  };
  const darlings = world.mobs.filter((o) => o.def.id === 'anglerlamp' && o.hp > 0 && o.add);
  if (how === 'darlings') {
    const beams = darlings.map((o) => ({ x: o.x, own: true, h: 30, mob: o }));
    beams.push({ x: m.x, own: true, h: 82, mob: m });
    // (the darlings gone: lanterns of her own hung in the water to make up three)
    const spots = hung(3).filter((b) => beams.every((o) => Math.abs(o.x - b.x) > AB.beamW * 1.6));
    while (beams.length < 3 && spots.length) beams.push(spots.shift());
    return beams;
  }
  if (how === 'adrift') {
    // two lanterns hung either side of the room, drifting the same way across it
    const dir = Math.random() < 0.5 ? 1 : -1;
    const beams = [W * 0.28, W * 0.72].map((x) => ({ x: x - dir * 120 + jit() * 0.5, own: false, vx: dir * AB.drift }));
    for (const o of darlings) beams.push({ x: o.x, own: true, h: 30, mob: o });
    return beams;
  }
  return hung(3);
}
function lightsOut(world, m, dur, how) {
  const beams = lanternBeams(world, m, how);
  // (her darlings, scared of the dark, stay right where they are with their lanterns held up: held, not
  // frozen, world/dungeon.js `heldUntil`; their rig shows it, render/dumbo/)
  for (const b of beams) if (b.mob && b.mob !== m) b.mob.heldUntil = world.now + dur + 0.4;
  addZone(world, { kind: 'circle', x: m.x, y: world.map.groundY, w: 1, warn: dur, damage: 0, tele: true, from: m, noSprout: true, look: 'abDark', beams, bw: AB.beamW });
  const parts = [];
  const n = darkGaps(world, beams).length;
  for (let i = 0; i < n; i++) {
    for (const high of [false, true]) {
      addZone(world, { kind: 'band', x: 0, w: 0, warn: dur, damage: 0, tele: true, from: m, look: 'abDarkPart', high });
      parts.push(world.dungeon.zones.at(-1));
    }
  }
  setGaps(world, parts, beams);
  m.mech.dark = { at: world.now + dur, beams, parts };
}
// Each frame of a Lights Out: the lanterns adrift move on (the gaps follow them), a darling's beam stays
// with it; when the dark falls, everyone outside a beam is hurt.
function tickDark(world, m, up, dt) {
  const s = m.mech;
  const D = s.dark;
  if (!D) return;
  const W = world.map.width;
  for (const b of D.beams) {
    if (b.vx) b.x = Math.max(40, Math.min(W - 40, b.x + b.vx * dt));
    else if (b.mob && b.mob.hp > 0) b.x = b.mob.x;
  }
  setGaps(world, D.parts, D.beams);
  if (world.now < D.at) return;
  s.dark = null;
  if (m.hp <= 0) return;
  const hw = AB.beamW / 2 + 4;
  for (const g of up) {
    if (g.remote || D.beams.some((b) => Math.abs(g.body.x - b.x) < hw)) continue;
    hurtMember(world, g, AB.dark, g.body.x, { knock: false });
  }
  world.juice.push({ type: 'shake', mag: 3, dur: 0.3 });
}
const AB_KISS = { gap: 2.2, look: 'abKiss', cast: 'Kiss Goodnight', dur: 3, pose: 'kiss', sub: 'A big kiss blown at the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), AB.kiss, 3, 84) };
const AB_BLOTS = { gap: 2.4, look: 'abBlot', cast: 'Ink Blots', dur: 3, pose: 'blot', sub: 'A drop of ink over each of you: spread out!', run: (w, m, up) => spread(w, m, up, AB.blot, 3, 72) };
const AB_DARK = (how) => ({
  gap: 2.4, cast: how === 'adrift' ? 'Lights Out: Adrift' : 'Lights Out!', dur: AB.lightsOut, pose: 'snuff',
  sub: how === 'darlings' ? 'The dark comes down: stand in a darling’s light, or hers!' : how === 'adrift' ? 'The dark comes down and the lanterns drift: walk with the light!' : 'The dark comes down: get into a lantern’s beam!',
  run: (w, m) => lightsOut(w, m, AB.lightsOut, how),
});
const AB_EMBRACE = { gap: 2.2, look: 'abEmbrace', cast: 'Eight-Arm Embrace', dur: 3, pose: 'embrace', sub: 'Her arms sweep the floor round her: in close!', run: (w, m) => donut(w, m, AB.embraceIn, AB.embraceR, AB.embrace, 3) };
const AB_FLOUNCE = { gap: 0.4, look: 'abFlounce', cast: 'Ink Flounce', dur: 2.4, pose: 'flounce', sub: 'A flounce of ink round her: now get out!', run: (w, m) => out(w, m, AB.flounceR, AB.flounce, 2.4) };
const AB_CACKLE = { gap: 2.4, look: 'abCackle', cast: 'Ohohoho!', dur: 3.2, pose: 'cackle', sub: 'Her laugh hurts everyone: healer, ready!', run: (w, m) => raidwide(w, m, AB.cackle, 3.2) };
const AB_EVENING = [AB_KISS, AB_BLOTS, AB_DARK('hung'), AB_EMBRACE, AB_FLOUNCE];
const AB_LIGHT_WAY = [AB_DARK('darlings'), AB_KISS, AB_EMBRACE, AB_FLOUNCE, AB_BLOTS, AB_CACKLE];
const AB_DEEP = [AB_DARK('adrift'), AB_KISS, AB_CACKLE, AB_BLOTS, AB_EMBRACE, AB_FLOUNCE].map((st) => ({ ...st, gap: Math.max(0.4, st.gap * 0.8) }));
function abyssia(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1 });
  const frac = m.hp / m.def.hp;
  tickDark(world, m, up, dt);
  // The phases (never in the middle of a cast or a Lights Out).
  const phase = frac > 0.65 ? 1 : frac > 0.3 ? 2 : 3;
  if (phase > s.phase && !m.cast && !s.dark) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      adds(world, m, 'anglerlamp', [m.x - 220, m.x + 220], null);
      callout(world, 'Darlings, light the way!', 'Her lamplighters come: when the dark falls, stand in their light');
      radio(world, 'anglers');
    } else callout(world, 'The deep is MINE!', 'Every light rushes into her lantern: now the lanterns drift');
  }
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  const list = s.phase === 1 ? AB_EVENING : s.phase === 2 ? AB_LIGHT_WAY : AB_DEEP;
  return runRotation(world, m, list, up, dt) || Boolean(s.dark);
}

// ---------- The Throne of Tides: Queen Coralie, the Drowned Queen (remade 2026-11-26) ----------
// A young mermaid queen (render/coralie/) who keeps everything she loves under glass so nothing can
// leave, and would like to add you to her collection. One rotation per phase (world/bossfight.js), each
// cast on her cast bar, its telegraph drawn in her own look (render/coralie/looks.js). Phases go by her
// health:
//   Welcome to My Collection (to 60%)  Royal Decree (the scepter stamped on the tank), Display Cases
//                         (glass cases appear on the floor numbered 1, 2, 3, 4, then come down on them in
//                         that order: read the numbers and keep out from under each as it falls), Strand of
//                         Pearls (her pearl strand swung out across the floor in front of her: get behind
//                         her or up on a stand), Royal Wave (a royal wave, and the wave it makes hurts
//                         everyone).
//   Say Pearls! (to 25%)  Royal Portrait (a gilded frame round her: everyone squeeze into it with her for
//                         the portrait; anyone left out of the picture is hurt), more and quicker cases.
//   Nobody Ever Leaves! (below 25%) Glass Walls (glass slides in from both walls, at every height: in to
//                         the middle), six cases, Royal Encore (two waves), everything quicker.
// Her state for her rig: m.cast / m.castPose ('decree', 'cases', 'strand', 'wave', 'portrait', 'walls'),
// m.phaseAt (and m.mech.phase).
const CR = { decree: 360, kase: 230, caseR: 46, strand: 210, strandLen: 420, wave: 165, portrait: 300, frameW: 170, walls: 260, wallW: 0.22 };
// Display Cases: n cases laid out round the group, numbered in a shuffled order; each comes down `gap`
// seconds after the last once the cast ends (its own short warning as it does, so it can be dodged).
function displayCases(world, m, up, n, gap, dur) {
  const W = world.map.width;
  const mid = up.length ? up.reduce((t, g) => t + g.body.x, 0) / up.length : m.x;
  const span = CR.caseR * 2 + 34;
  const x0 = Math.max(80, Math.min(W - 80 - (n - 1) * span, mid - ((n - 1) * span) / 2));
  const order = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
  const t0 = world.now + dur;
  const cases = order.map((slot, k) => ({ x: x0 + slot * span, n: k + 1, at: t0 + k * gap, off: dur + k * gap, added: false }));
  addZone(world, { kind: 'floor', x: 0, w: W, warn: dur + (n - 1) * gap + 0.15, damage: 0, tele: true, from: m, look: 'crCases', cases, r: CR.caseR });
  m.mech.cases = cases;
}
function tickCases(world, m) {
  const list = m.mech.cases;
  if (!list) return;
  for (const c of list) {
    if (c.added || world.now < c.at - 1.1) continue;
    c.added = true;
    addZone(world, { kind: 'circle', x: c.x, y: world.map.groundY, w: CR.caseR * 2, warn: Math.max(0.2, c.at - world.now), damage: CR.kase, from: m, noSprout: true, look: 'crCase', n: c.n });
  }
  if (list.every((c) => c.added)) m.mech.cases = null;
}
// Royal Portrait: a gilded frame round her; when it flashes, everyone outside it is hurt.
function portrait(world, m, up, dur) {
  addZone(world, { kind: 'stack', x: m.x, y: world.map.groundY, w: CR.frameW, warn: dur, damage: 0, tele: true, need: Math.max(1, up.length), from: m, look: 'crPortrait' });
  m.mech.portrait = { at: world.now + dur, x: m.x };
}
function tickPortrait(world, m, up) {
  const P = m.mech.portrait;
  if (!P || world.now < P.at) return;
  m.mech.portrait = null;
  if (m.hp <= 0) return;
  for (const g of up) {
    if (g.remote) continue;
    const inFrame = Math.abs(g.body.x - P.x) < CR.frameW / 2 + 4 && Math.abs(g.body.y - world.map.groundY) < 34;
    if (!inFrame) hurtMember(world, g, CR.portrait, P.x, { knock: false });
  }
}
// Glass Walls: from both walls in, at every height.
function glassWalls(world, m, dur) {
  const W = world.map.width;
  const w = W * CR.wallW;
  for (const [x, dir] of [[0, 1], [W - w, -1]]) {
    for (const high of [false, true]) addZone(world, { kind: 'band', x, w, dir, warn: dur, damage: CR.walls, from: m, look: high ? 'crWallsHigh' : 'crWalls', high });
  }
}
const CR_DECREE = { gap: 2.2, look: 'crDecree', cast: 'Royal Decree', dur: 3, pose: 'decree', sub: 'Her scepter comes down on the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), CR.decree, 3, 84) };
const CR_CASES = (n, gap) => ({ gap: 2.2, cast: 'Display Cases', dur: 3.2, pose: 'cases', sub: 'Glass cases, numbered: keep out from under each as it comes down, in order!', run: (w, m, up) => displayCases(w, m, up, n, gap, 3.2) });
const CR_STRAND = { gap: 2.4, look: 'crStrand', cast: 'Strand of Pearls', dur: 2.8, pose: 'strand', sub: 'Her pearls roll out across the floor in front of her: get behind her!', run: (w, m) => cleave(w, m, CR.strandLen, CR.strand, 2.8) };
const CR_WAVE = { gap: 2.4, look: 'crWave', cast: 'Royal Wave', dur: 3.2, pose: 'wave', sub: 'A royal wave, and the wave it makes hurts everyone: healer, ready!', run: (w, m) => raidwide(w, m, CR.wave, 3.2) };
const CR_ENCORE = {
  gap: 2.4, look: 'crWave', cast: 'Royal Encore', dur: 4.4, pose: 'wave', sub: 'Two royal waves, one after the other: healer, ready!',
  run: (w, m) => {
    raidwide(w, m, CR.wave, 3);
    raidwide(w, m, CR.wave, 4.4);
  },
};
const CR_PORTRAIT = { gap: 2.4, cast: 'Royal Portrait', dur: 3.6, pose: 'portrait', sub: 'Say pearls! Everyone into the frame with her, or be left out of the picture!', run: (w, m, up) => portrait(w, m, up, 3.6) };
const CR_WALLS = { gap: 2.2, cast: 'Glass Walls', dur: 3, pose: 'walls', sub: 'Glass slides in from both walls: in to the middle!', run: (w, m) => glassWalls(w, m, 3) };
const CR_COLLECTION = [CR_DECREE, CR_CASES(4, 0.6), CR_STRAND, CR_WAVE];
const CR_PEARLS = [CR_PORTRAIT, CR_DECREE, CR_CASES(5, 0.5), CR_WAVE, CR_STRAND];
const CR_NOBODY = [CR_WALLS, CR_CASES(6, 0.45), CR_PORTRAIT, CR_DECREE, CR_ENCORE, CR_STRAND].map((st) => ({ ...st, gap: Math.max(0.6, st.gap * 0.8) }));
function coralie(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1 });
  const frac = m.hp / m.def.hp;
  tickCases(world, m);
  tickPortrait(world, m, up);
  const phase = frac > 0.6 ? 1 : frac > 0.25 ? 2 : 3;
  if (phase > s.phase && !m.cast && !s.cases && !s.portrait) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Say Pearls!', 'A royal portrait: when the frame comes, everyone into it with her');
      radio(world, 'portrait');
    } else {
      callout(world, 'Nobody Ever Leaves!', 'Glass walls close in from both sides: keep to the middle');
      radio(world, 'walls');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  const list = s.phase === 1 ? CR_COLLECTION : s.phase === 2 ? CR_PEARLS : CR_NOBODY;
  return runRotation(world, m, list, up, dt);
}

// An aquarium boss down.
export function aquaKilled(world, m) {
  if (m.def.mech !== 'coralie') return;
  // Her bubbles pop, and Elder Warabi goes home to the palace (render/prologue.js).
  for (const b of world.mobs) if (b.def.id === 'keepsake' && b.hp > 0) killMob(world, b);
  world.char.elders = { ...(world.char.elders ?? {}), warabi: true };
  world.map.elders = world.char.elders;
  playScene(world, 'aquarium_freed');
}
