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

**Effects are Tengu's own art, in the style the player picked: matched to the sprites.** Effects
are drawn for the game in `tools/fx-art.js` as soft pastel shapes (4-tone ramps that lean violet in
the shadows, white cores, the game's curvy sparkle stars), then matched to the characters' sprites
(redrawn at their pixel size, one art pixel = two screen pixels, colours snapped to a ramp of their
own hue, outlined like the sprites in a darker shade of their own colour, lighter on top edges and
darkest underneath). `tools/build-fx.py` renders them into the `cel*` strips in `assets/fx/`. Every
effect is a short run of key drawings: a shape pops in, holds a beat, then breaks up into beads and
sparkles. Keep pixel art near scale 1 (draw a big version rather than blowing one up). The player
rejected code-drawn gradient glows, pack effects (pixel and HD alike) and bold black-outlined
anime effects; every effect in `assets/fx/` is now Tengu's own. Look at
references first (research/fx.md section 6, MapleStory) for what each moment should show. Code
drawing is for small supporting touches only (a tracer line, a sight's ticks).

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
