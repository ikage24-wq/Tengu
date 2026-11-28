// The dressed rigs' layers (2026-11-28, the player: "I think it's the hair clipping, find the bugs so
// they never repeat"). Lady Marigold's back hair and corkscrew curls were drawn just under her neck,
// after her body, so they lay over her shoulders and, swinging on the walk, cut across the shoulder
// line: her shoulder looked disconnected. Whatever is behind a head (back hair, far ears) belongs behind
// the whole figure: on the blank bases' rig the far arm is the first part drawn, so a dressed rig hangs
// it under 'armF'. (Something behind the head that really sits in front of the body, like Tuskar's far
// tusk curling down in front of his chest, says "in front of the body" in the comment over its hook.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src/render/', import.meta.url));
function filesUnder(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...filesUnder(p));
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

test("what's behind a dressed rig's head (back hair, far ears) hangs behind its whole body", () => {
  let seen = 0;
  for (const file of filesUnder(ROOT)) {
    const src = readFileSync(file, 'utf8');
    // (a dressed rig's hooks: `part: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'back')`, or a hook
    // doing a few things, one of them that: `part: (ctx, a, mode, S, D) => { ...; head(ctx, a, mode, D, 'back'); }`)
    const re = /(\w+):\s*\(ctx, a, mode, S, D\)\s*=>\s*(?:\{[^{}]*?)?head\(ctx, a, mode, D, 'back'\)/g;
    for (const m of src.matchAll(re)) {
      seen++;
      const before = src.slice(0, m.index);
      const under = before.lastIndexOf('under: {');
      const over = before.lastIndexOf('over: {');
      assert.ok(under > over, `${file}: what's behind the head is hung over '${m[1]}' (it must be under, drawn before the body)`);
      const note = before.split(/\r?\n/).slice(-4).join(' ');
      if (m[1] !== 'armF') assert.ok(/in front of the body/.test(note), `${file}: what's behind the head is hung under '${m[1]}': hang it under 'armF', the first part drawn, so it never lies over the shoulders (or say why it sits "in front of the body")`);
    }
  }
  assert.ok(seen >= 5, "expected to find the dressed rigs' behind-the-head hooks");
});
