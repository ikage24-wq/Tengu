# Improvement brief (shared by every implementation agent)

This repo — "Tengu", pastel chibi 2D side-scroller MMO-like RPG, vanilla JS canvas, no
build step. Read CLAUDE.md first (combat rules, standing rules — including "improve
the whole game: carry an improvement across every part it applies to"). `npm test` must pass. A
static server is ALREADY running at http://localhost:8000 — never start another.

## Research to apply
A team researched pixel art, animation, effects, environments, UI and game feel in English,
Japanese, Korean, Chinese and Russian. Findings files in the scratchpad
(working folder, not kept)  :
research-fx.md, research-env.md, research-en.md, research-ja.md (ready now); research-ko.md,
research-ru.md, research-zh.md, research-fanart.md, research-anim.md (arriving while you work — check
for them before your final round and fold in anything relevant to your area). Also art-bible.md.
Read every finding relevant to your area, then implement the best ones. Prefer high impact per
effort; do the quick wins, then the bigger ones. Every change must be visible and tasteful in the
pastel style — no regressions in readability or performance (the game must hold 60 fps; avoid
per-frame full-screen passes you can bake or cache).

## Working rules
- Only edit the files your task assigns to you. Other agents edit other files at the same time.
  If you truly need a small change in another file, keep it minimal and mention it in your report.
- Match the surrounding code style (comment density, naming). No model names anywhere.
- Before/after proof: take screenshots/GIFs with Playwright (`require('playwright')`,
  `chromium.launch()` with no options). Useful existing scripts in the scratchpad: mapsmobs.cjs
  (`node mapsmobs.cjs <outdir> <tag> map1,map2`), gaitgif.cjs, maidshot.cjs, faces.cjs. Start the
  game with `window.twzt.start('Rin')`; `window.twzt.world` exposes the world. Save ALL images only
  in the scratchpad (never in the repo).
- Commit in coherent steps (each with tests passing) using explicit `git add <your files>`; do not
  push. If git is busy (another agent committing), wait a few seconds and retry. Commit messages end
  with exactly:
  Co-Authored-By: Claude <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01LAADQTFD8976KUnMUbXVRk
- Report at the end: what you implemented (finding → change), commit hashes, before/after image
  paths, anything left undone and why.
