// The art standard's rig and motion checks (CLAUDE.md, "The art standard"): every frame of every
// move, solved exactly as the figure is drawn (render/hero.js poseJoints). Moves that broke a rule
// when the check was written are listed as KNOWN, to be fixed; any other move breaking it fails,
// and a listed move that's been fixed must come off its list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVES, moveAt } from '../src/render/moves.js';
import { poseJoints } from '../src/render/hero.js';

const N = 24;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// The inside angle at the middle joint (180 = straight, small = folded tight).
const bendAt = (a, j, b) => {
  const u = [a[0] - j[0], a[1] - j[1]];
  const v = [b[0] - j[0], b[1] - j[1]];
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
};
function frames(move) {
  const out = [];
  for (let i = 0; i <= N; i++) {
    const j = poseJoints(move, i / N, 0.5);
    if (!j) break;
    out.push(j);
  }
  return out;
}
const ALL = Object.keys(MOVES).map((m) => [m, frames(m)]);
// Checks a rule over every move; `known` moves may still break it (and must, or come off the list).
function rule(name, known, broken) {
  const bad = ALL.filter(([m, fs]) => broken(fs, m)).map(([m]) => m);
  const fresh = bad.filter((m) => !known.includes(m));
  const fixed = known.filter((m) => !bad.includes(m));
  assert.deepEqual(fresh, [], `${name}: these moves break it`);
  assert.deepEqual(fixed, [], `${name}: these are fixed now, take them off the known list`);
}

test('every move is checked, frame by frame', () => {
  assert.ok(ALL.length > 200);
  for (const [m, fs] of ALL) assert.equal(fs.length, N + 1, `${m} draws every frame`);
});

test('limbs never change length: thigh, shin, upper arm and forearm keep theirs in every pose', () => {
  for (const [m, fs] of ALL) {
    for (const [i, j] of fs.entries()) {
      for (const l of j.legs) {
        assert.ok(Math.abs(dist(l.hip, l.knee) - l.a) < 0.01 && Math.abs(dist(l.knee, l.ankle) - l.b) < 0.01, `${m} at ${i}/${N}: a leg keeps its length`);
      }
      for (const a of j.arms) {
        assert.ok(Math.abs(dist(a.shoulder, a.elbow) - a.a) < 0.01 && Math.abs(dist(a.elbow, a.wrist) - a.b) < 0.01, `${m} at ${i}/${N}: an arm keeps its length`);
      }
    }
  }
});

test('the figure keeps its proportions: no move scales, stretches or narrows it', () => {
  for (const [m, fs] of ALL) for (const j of fs) {
    assert.equal(j.stretch, 1, `${m} keeps its height`);
    for (const k of ['scale', 'scaleX', 'scaleY', 'headScale', 'squash']) assert.ok(j.mv[k] == null || j.mv[k] === 1, `${m} has no ${k}`);
  }
});

test('joints bend the right way: elbows never bend backward, and nothing folds past a natural limit', () => {
  // An arm's bend shown sideways runs 0..1 (toward the viewer to out in the picture); below 0 the
  // elbow is mirrored across the arm, bending backward.
  rule('elbows bend the right way', [], (fs) => fs.some((j) => j.armSide < -0.01 || j.armSide > 1.01));
  for (const [m, fs] of ALL) for (const [i, j] of fs.entries()) {
    for (const l of j.legs) assert.ok(bendAt(l.hip, l.knee, l.ankle) >= 25, `${m} at ${i}/${N}: a knee folds no tighter than 25 degrees`);
    for (const a of j.arms) assert.ok(bendAt(a.shoulder, a.elbow, a.wrist) >= 15, `${m} at ${i}/${N}: an elbow folds no tighter than 15 degrees`);
  }
});

test('hands really hold things: an aimed weapon hand is exactly where the arm reaches', () => {
  for (const [m, fs] of ALL) for (const [i, j] of fs.entries()) {
    if (j.mv.arm == null) continue;
    const front = j.arms.at(-1);
    assert.ok(dist(front.wrist, front.aim) < 0.05, `${m} at ${i}/${N}: the weapon hand reaches its grip`);
  }
});

test('nothing comes apart, and the neck has limits: the head stays on the neck and rolls a natural amount', () => {
  for (const [m, fs] of ALL) for (const [i, j] of fs.entries()) {
    assert.ok(Math.hypot(...j.head) <= 4, `${m} at ${i}/${N}: the head stays on its neck (${Math.hypot(...j.head).toFixed(1)} px off)`);
    assert.ok(Math.abs(j.tilt) <= 25, `${m} at ${i}/${N}: the head rolls no more than 25 degrees`);
  }
});

// Moves whose planted foot drags along the ground (more than 1.2 px between two of 24 moments,
// with the foot down both times), found when this check was written: to be fixed.
const DRAGGING = [];
test('feet stay planted: a foot on the ground never slides unless it steps', () => {
  rule('feet stay planted', DRAGGING, (fs) => fs.some((j, i) => i && !j.air && !fs[i - 1].air && j.legs.some((l, n) => {
    const p = fs[i - 1].legs[n];
    return l.grounded && p.grounded && Math.abs(l.ankle[0] - p.ankle[0]) > 1.2;
  })));
});

// Moves with a long stretch at one steady speed (30% of the move or more). Spinning weapons
// (`weapon` turning round and round) may spin steadily; the rest are to be fixed.
const STEADY = [];
test('no linear motion in bodies: every pose change eases in and out', () => {
  const FIELDS = ['arm', 'weapon', 'lunge', 'lift', 'tilt'];
  const S = 60;
  rule('bodies ease in and out', STEADY, (fs, m) => {
    const vals = [];
    // (A looping pose that runs on its own clock, `(p, dur)`, a seat by the water, an AFK sit, is
    // checked over the long stretch it really plays for.)
    const probe = (d) => JSON.stringify(moveAt(m, 0.7, d), (k, v) => (typeof v === 'function' ? undefined : v));
    const dur = probe(0.5) !== probe(6) ? 6 : 0.5;
    for (let i = 0; i <= S; i++) vals.push(moveAt(m, i / S, dur));
    return FIELDS.some((f) => {
      const v = vals.map((x) => x?.[f] ?? 0);
      const range = Math.max(...v) - Math.min(...v);
      // (A weapon spun round and round turns at a steady speed, as a real spin does.)
      if (range < 4 || (f === 'weapon' && range >= 300)) return false;
      let run = 0;
      let best = 0;
      for (let i = 2; i <= S; i++) {
        const d1 = v[i] - v[i - 1];
        const d0 = v[i - 1] - v[i - 2];
        // (Steady means the speed itself doesn't change: each step within 2% of the last one. Movement
        // too slow to see, under 0.15 a step, is a moving hold's drift, not a glide.)
        if (Math.abs(d1) > Math.max(range * 0.004, 0.15) && Math.abs(d1 - d0) < Math.abs(d1) * 0.02) best = Math.max(best, ++run);
        else run = 0;
      }
      return best / S >= 0.3;
    });
  });
});
