# Monster art brief (shared by every art agent)

Game: "Tengu", a pastel chibi 2D side-scroller RPG in vanilla JS canvas. This repo (no build
step). Read CLAUDE.md first. `npm test` runs the suites. A static server is ALREADY
running at http://localhost:8000 — never start another.

## Quality bar (from the user, verbatim spirit)
"very expressive and good and amazing and nice, no amateur, no poor drawing, no low quality",
"super good smooth", "expressive smooth and nice animations". Treat it as a professional sprite job:
strong readable silhouette, clean consistent ink outline, 3-tone cel shading with one light direction
(top-left), crisp highlights, secondary motion (hair, tails, cloth, ears lag behind the body and
settle), anticipation and follow-through, squash and stretch inside the drawing. You may use
WebSearch / WebFetch to look up references (mythology, MapleStory / Granblue / Ragnarok-style chibi
monsters and bosses, animal anatomy, animation principles) — do so before designing.

## How monster art works
- Existing art: src/render/mobs/{meadow,wilds,ruins,sky,hollow,bosses}.js. Shape kit: src/render/mobs/kit.js
  (R, E, T polygon, F, C, shade, mix, INK, …) on top of src/render/pixel.js. Read one module fully
  (bosses.js is the most advanced) to learn the conventions and helpers before writing.
- Each module exports `ART = { key: { walk: nWalk, idle: nIdle, attack: nAttack, draw(pose, frame, mood) } }`
  and `INFO = { key: { name, w, h } }` (w/h = hitbox in logical px, feet at bottom centre).
- `draw` returns `{ w, h, res: 3, shapes }` (see existing modules). The sprite faces RIGHT, feet on the
  bottom edge, centred; keep w/h identical across all poses/frames/moods of one design so it doesn't jitter.
- Poses: 'walk' (or flying loop), 'idle', and NEW 'attack'. Moods: 'idle', 'angry', 'hurt', 'dead',
  'blink', 'happy' — every pose must accept every mood (the face/eyes/expression change; dead = x eyes
  or a collapsed pose).
- Timing (src/render/monsters.js, already implemented): the walk cycle always lasts 0.6 s (flyers
  0.45 s) and idle 1.8 s, whatever the frame count — so MORE FRAMES = SMOOTHER. Aim for 8 walk frames
  and 6 idle frames. Attack: frame 0 is the wind-up (it's held while a boss or dungeon monster
  gathers itself, so make it a clear anticipation pose), frames 1..n-1 play over 0.5 s as strike and
  follow-through (3–5 frames total). Attack is drawn with the 'angry' mood normally.
- Detail: res 3 (each logical px = 3x3 cells). Keep each frame under ~350 shapes.
- Gallery: `tools/mob-gallery.html?group=<module>&keys=a,b` shows every walk/idle/attack frame and
  mood next to a hero for scale. Screenshot it with:
  `node (working folder, not kept) gallery.cjs <module> <out.png> [keys]`
  (prints 'ok' or errors). Crop/zoom screenshots with python PIL to inspect closely. Save ALL images
  only under (working folder, not kept)  — never in the repo.
- Iterate: render, critique each frame honestly (silhouette, anatomy, consistency between frames,
  smooth in-betweens with no popping, outline consistency, expression), fix, repeat — at least 3 rounds.
  Also make an animated check: render the walk frames in sequence (e.g. a GIF via PIL) and look for
  popping or jitter.

## Rules
- Only edit the files your task names. Other agents are editing other modules at the same time.
- Match surrounding code style (short comments, naming). No model names anywhere.
- When done: `node --check` your files, `npm test` passes, and commit ONLY your files with explicit
  `git add <paths>` (do not push). Commit message ends with exactly:
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01LAADQTFD8976KUnMUbXVRk
  If the commit fails because another agent is committing at the same moment, wait a few seconds and retry.
- Report: files changed, commit hash, each design in 1–2 lines, the INFO table, and the gallery
  screenshot path(s).
