// Every source module parses, including the browser-only ones (HUD, windows, screens) that the
// other suites never import, so a broken edit there is caught before it ships.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : n.endsWith('.js') ? [p] : [];
  });
}

test('every source file parses', () => {
  const bad = [];
  for (const f of files('src')) {
    try {
      execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
    } catch (e) {
      bad.push(`${f}: ${String(e.stderr).split('\n').find((l) => /Error/.test(l)) ?? 'error'}`);
    }
  }
  assert.deepEqual(bad, []);
});
