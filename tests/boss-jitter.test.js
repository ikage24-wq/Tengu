// The remade bosses never pop (2026-11-28, the player: "need to make rule fixes so this doesn't happen
// again"). Lady Marigold's shoulder shape jumped a pixel or two when the points it was built from
// changed (a nearest point, a scan across her outline, an armpit curve switching on); each time the
// jitter probe caught it. This plays each remade boss through the mob stage's script at a steady 60
// frames a second and fails on any jump of its own (a pop off its smooth curve) or a layer flicker.
// Add each boss here as its remake is finished.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROBE = fileURLToPath(new URL('../tools/jitter-probe.mjs', import.meta.url));
const REMADE = ['velvet', 'marigold'];

test('the remade bosses play through their script without a pop', { timeout: 240000 }, () => {
  const out = execFileSync(process.execPath, [PROBE, ...REMADE, '--sched=60', '--fast', '--json'], { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
  const rows = JSON.parse(out.trim().split(/\r?\n/).pop());
  assert.equal(rows.length, REMADE.length);
  for (const row of rows) {
    const r = row['60'];
    const worst = (r.worst ?? []).map((w) => JSON.stringify(w)).join('; ');
    assert.equal(r.own, 0, `${row.id}: ${r.own} jumps of its own (node tools/jitter-probe.mjs ${row.id} --sched=60 to see them) ${worst}`);
    assert.equal(r.flicker, 0, `${row.id}: a part flickers between layers`);
  }
});
