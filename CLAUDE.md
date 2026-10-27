# Tengu: notes for working on the game

A pastel chibi 2D side-scroller RPG in vanilla JS canvas (no build step). `npm test` runs the
`node:test` suites; `npm start` serves the game at http://localhost:8000. See README.md for the
game itself and the source layout.

## Combat rules (every job, every new skill)

These hold for all jobs, current and future. Keep them when adding or reworking any skill.

- **No cooldowns.** Skills are limited by MP and by their own animation, never by a cooldown timer.
- **A skill plays out its whole motion before another skill can start.** `world.skillReadyAt` gates
  skill-after-skill (set in `world/combat.js` for normal skills and `world/melee.js` for combo
  steps). Walking or jumping may cut a move's follow-through short (`world.recoverAt`), but must
  never skip that wait, so skills can't be spammed back to back.
- **Basic attacks and skills weave.** Once a basic attack's blow lands (or its shot is away), a
  skill may start right away, and a basic attack may follow a skill; basic attacks keep their own
  rhythm (`world.basicReadyAt`).
- **Hits land on the animation, not on the key press.** Melee blows land when the blade cuts;
  shots leave on the release frame and hit when the projectile arrives. Build attack skills as
  combo steps in `world/melee.js` style (`combo` in `data/skills.js`: a move, a duration, and
  strikes timed with `at`), so timing, stepping in or back, knockback, launches, hit-stop, and
  shake all follow the same rules.
- **Presses are buffered.** A tap or skill pressed mid-motion goes off the moment it's allowed.
- **Weight matches the blow.** Light hits barely push; finishers knock back or launch; heavy blows
  get hit-stop, screen shake, and bigger effects.
- `tests/melee.test.js` checks these rules (including the no-spam rule for several jobs); extend it
  when adding skills.

## Art, animation, and effects

**Always consult the research first.** `docs/art/research/` is the saved research guide: about 350
sources in five languages (tutorials, artists' process posts, game-dev talks, real game data).
Before any visual or feel work (sprites, faces, hair, animation, effects, maps, UI, HUD, windows,
icons, fonts, game feel), read `docs/art/README.md` and `docs/art/art-bible.md` (the rules drawn
from it), then the research files that cover the task. For UI that's `research/env.md` sections
E (UI) and F (Icons); for effects and game feel `research/fx.md`; for animation
`research/anim.md`. Follow what they say, compare the work against them rather than against our
own older work, and save anything new we learn back there (the rule in `README.md`, the finding
with its source in `research/`).

**Effects come from good effect art, never simple drawn shapes.** The player finds simple
code-drawn effects (soft gradient glows, plain rings, flat blobs) childish and rejects low-quality
effects; pixel-art effects are fine when they're actually good. The target is MapleStory's skill
effects (research/fx.md section 6): every hit lands as its own bright shape, big skills show one
recognisable picture, buffs rise as a pillar of light with an emblem, everything ends breaking into
sparkles. Before making any effect, look at references and for effect packs (painted or rendered
flipbooks, pixel sheets, particle textures, emblem shapes) that cover it, and build the effect from
those: `assets/fx/` holds the packs we use, built by `tools/build-fx.py` (credits in
`assets/fx/CREDITS.md`; only use packs whose license allows shipping them in the game's files,
such as CC0 or CC BY). Recolouring, combining frames, and moving, turning, growing and fading art
in code (the way a particle system plays it) is fine. Code drawing is for small supporting touches
only (a tracer line, a sight's ticks).

"Continue the redo pass" means: read `docs/art/briefs/redo-pass.md` (the brief) and
`docs/art/briefs/redo-status.md` (what's done and what's left), then pick up the remaining items
there and update the status file as they get done.

## Other standing rules

- Commits end with the session's Co-Authored-By / Claude-Session lines; no model names in code or
  commits.
- When reporting to the user, describe what changed in the game in plain words: no code, file
  names, function names, or technical jargon. Show pictures instead.
- Don't open pull requests unless asked.
- Improve the whole game, not one thing at a time: when raising quality (art, animation, effects,
  maps, UI, game feel), carry the improvement across every part it applies to — heroes, NPCs,
  monsters, bosses, towns and maps, skills and effects, HUD and windows, icons — not just the piece
  that prompted it.

## Progression plan

"Continue the progression plan" means: read `docs/design/progression-plan.md` (the MapleStory +
FFXIV-style plan: story, job advancement, dungeons, bosses, collecting), pick the next unchecked
phase, build it, and tick it off there.
