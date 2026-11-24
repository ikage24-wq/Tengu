// Fawnelle, the Moonlit Doe (2026-11-23): how Moonleaf Grove's shy deer goes about the plaza (her
// story: data/quests.js fawnelle_*; her drawing: render/fawnelle/).
//
// By day she stands behind the moon tree, her face just round the edge of its trunk on your side,
// peeking at you; after dark she steps out under its lanterns (her place, x 1162). Until her story
// is done she's shy: rush at her in the dark and she darts back behind the tree, flustered, and peeks
// out; stand still a moment and she steps out again, shyly. Near you she glances over now and then
// and looks away. Once she has said her good evening to the Grove (fawnelle_evening) she hides no
// more, day or night, and brightens when you come near.
//
// world.fawnelle is her state on the map she's on: { mode, emote: { name, seq }, ... }. Each new
// feeling bumps `seq` and the renderer plays it from its start (blending over from the last). Her
// place (n.x) moves at a walk or a dart; her steps follow it (render/fawnelle/art.js), and she faces
// the way she goes (n.facing).
import { clockNight } from './daytime.js';
import { easedPace } from './pace.js';

export const FAWNELLE_QUESTS = ['fawnelle_charms', 'fawnelle_snow', 'fawnelle_letters', 'fawnelle_evening'];
// Behind the trunk, how far round it she stands (game px from its middle): her face and one twin
// tail peek out past its edge, the rest of her hidden.
const PEEK = 10;
// Close enough, and quick enough, to startle her.
const NEAR = 64;
const RUSH = 40;
// Her paces (px a second): stepping out or back, at her base's own walking pace (blankrigs.js: a
// stride of 1.15 forelegs, 1.4 strides a second); darting behind the tree, at a trot. She eases
// into each and slows to a stop.
const STROLL = 36;
const DART = 62;

// How far her story has gone: 0 to 4 steps done.
export const trustOf = (char) => FAWNELLE_QUESTS.filter((q) => char.quests?.[q]?.state === 'done').length;

const treeOf = (map) => map.townPieces?.find(([k]) => k === 'moontree')?.[1] ?? null;

function feel(st, name) {
  st.emote = { name, seq: st.emote.seq + 1 };
}

// What she does close to you, now and then, by how well she knows you.
const FIDGETS = [['glance', 'glance', 'shy'], ['glance', 'shy', 'dreamy'], ['shy', 'dreamy', 'glance', 'happy'], ['happy', 'dreamy', 'wink', 'happy']];
const fidgetsOf = (trust) => FIDGETS[Math.min(3, Math.max(0, trust - 1 + (trust >= 4 ? 1 : 0)))];

export function tickFawnelle(world, dt) {
  const map = world.map;
  const n = map.npcs?.find((q) => q.id === 'fawnelle');
  if (!n) {
    world.fawnelle = null;
    return;
  }
  n.home ??= n.x;
  const tree = treeOf(map) ?? n.home - 52;
  const b = world.body;
  const trust = trustOf(world.char);
  const night = clockNight(world);
  // (Out in the open: at night, or any time once she's said her good evening.)
  const open = night || trust >= 4;
  let st = world.fawnelle;
  if (!st || st.map !== map.id) {
    const side = Math.sign(b.x - tree) || 1;
    st = world.fawnelle = { map: map.id, mode: open ? 'out' : 'hide', side, emote: { name: 'neutral', seq: 0 }, calmUntil: 0, hideAt: -9, still: 0, near: false, fidgets: 0, nextFidget: world.now + 5, dart: false, rushAt: -9 };
    n.x = open ? n.home : tree + PEEK * side;
    n.facing = side;
  }
  // (A scene moves her itself: world/director.js.)
  if (world.scene || n.cine) return;
  const dx = b.x - n.x;
  const dist = Math.abs(dx);
  const rushing = Math.abs(b.vx) > RUSH && Math.sign(b.vx) === Math.sign(n.x - b.x) && dist < NEAR;
  st.still = Math.abs(b.vx) < 5 ? st.still + dt : 0;

  // Day and night: out under the lanterns, or back behind the trunk.
  if (open && st.mode === 'hide' && (night ? world.now - st.hideAt > 2.5 && (st.still > 1.2 || dist > 220) : true)) {
    st.mode = 'out';
    if (dist < 160) feel(st, trust >= 4 ? 'happy' : 'shy');
    // (Coming back out after a fright, she isn't startled again straight away; stepping out at dusk
    // she can be.)
    st.calmUntil = world.now - st.hideAt < 20 ? world.now + 12 : world.now;
  } else if (!open && st.mode === 'out') {
    st.mode = 'hide';
    st.side = dist < 260 ? Math.sign(dx) || 1 : 1;
  }
  // Rushed at in the dark, before she knows you: behind the tree, quick.
  if (st.mode === 'out' && trust < 4 && rushing && world.now > st.calmUntil) {
    st.mode = 'hide';
    st.side = Math.sign(b.x - tree) || 1;
    st.hideAt = world.now;
    st.dart = true;
    feel(st, 'flustered');
  } else if (st.mode === 'hide' && rushing && world.now - st.rushAt > 6 && world.now - st.hideAt > 2) {
    // (Already hidden: a fluster, from where she is.)
    st.rushAt = world.now;
    feel(st, 'flustered');
  }
  // (Far off, she lets it go: next time you come close counts again.)
  if (dist > 180) st.calmUntil = Math.min(st.calmUntil, world.now);
  // Hidden by day, she peeks round the side you're on.
  if (st.mode === 'hide' && dist < 260 && !st.dart) {
    const side = Math.sign(b.x - tree) || st.side;
    if (side !== st.side && Math.abs(b.x - tree) > 26) st.side = side;
  }

  // Where she's going, and her pace there (easing into the stop).
  const target = st.mode === 'out' ? n.home : tree + PEEK * st.side;
  const d = target - n.x;
  if (Math.abs(d) > 0.05) {
    // (Turning back the other way, she starts afresh from a standstill.)
    if (Math.sign(d) !== st.dir) st.v = 0;
    st.dir = Math.sign(d);
    st.v = easedPace(st.v ?? 0, st.dart ? DART : STROLL, Math.abs(d), dt);
    n.x += st.dir * Math.min(Math.abs(d), st.v * dt);
    n.facing = st.dir;
  } else {
    st.v = 0;
    st.dir = 0;
    st.dart = false;
    // Standing: hidden, she faces the way she peeks; out, she faces you if you're near.
    n.facing = st.mode === 'hide' ? st.side : dist < 200 ? Math.sign(dx) || n.facing : 1;
  }

  // Coming close: a glance, a shy look, or (once she knows you) a smile.
  if (!st.near && dist < 90 && !rushing) {
    st.near = true;
    if (world.now - st.hideAt > 2) feel(st, trust >= 4 ? 'happy' : trust >= 2 ? 'shy' : 'glance');
    st.nextFidget = world.now + 6;
  } else if (st.near && dist > 140) st.near = false;
  // Close by and settled, now and then something; far off at night, a dreamy look up at the lanterns.
  if (world.now > st.nextFidget && Math.abs(d) < 0.5) {
    if (dist < 130) {
      const pool = fidgetsOf(trust);
      feel(st, pool[st.fidgets++ % pool.length]);
      st.nextFidget = world.now + 7 + (st.fidgets % 3) * 1.6;
    } else {
      if (night) feel(st, 'dreamy');
      st.nextFidget = world.now + 14;
    }
  }
}
