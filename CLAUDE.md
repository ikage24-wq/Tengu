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
- **Nothing can be spammed; it should feel like a real game (the player's standing ask: apply it
  to every skill, attack and item, now and in future).** Every skill plays out its whole motion and
  then a beat of recovery before the next skill (`AFTER` in `world/melee.js`: a quick move ~0.1 s,
  a skill ~0.2 s, a heavy one ~0.3 s, a finisher ~0.45 s); steps inside one skill's own chain flow
  on with only a tiny beat. Mashing one skill gives at most about 2 casts a second, most land
  1.25-1.75. Basic combos keep their rhythm, but the finisher and the command moves end with a
  beat. Potions take a moment to drink (`ITEM_DELAY`). When adding a skill, give it its weight and
  check it against the pace test in `tests/melee.test.js` ("no job can mash out its attacks").
- **Basic attacks and skills weave, within that pace.** Once a basic attack's blow lands (or its
  shot is away), a skill may start right away; a basic attack may follow a skill once the skill's
  motion is nearly over; basic attacks keep their own rhythm (`world.basicReadyAt`).
- **Hits land on the animation, not on the key press.** Melee blows land when the blade cuts;
  shots leave on the release frame and hit when the projectile arrives. Build attack skills as
  combo steps in `world/melee.js` style (`combo` in `data/skills.js`: a move, a duration, and
  strikes timed with `at`), so timing, stepping in or back, knockback, launches, hit-stop, and
  shake all follow the same rules.
- **Presses are buffered.** A tap or skill pressed mid-motion goes off the moment it's allowed.
- **Weight matches the blow.** Light hits barely push; finishers knock back or launch; heavy blows
  get hit-stop, screen shake, and bigger effects.
- **Basic attacks never feel stale (the player's standing rule, for every job and path).** Holding
  attack must never play the same string over and over: every job's basic combo has a pool of
  different swings or shots at each step (`PATH_VARIANTS` in `world/melee.js`, drawn by
  `planCombo`): the first combo is the job's own, then a fresh string each time, never the same
  twice in a row. Mix the kinds (quick, heavy, stabs, overheads, spins, kicks, leaps, bursts) and
  make them exaggerated and fun. A new job or a reworked one isn't done without its pool.
- `tests/melee.test.js` checks these rules (including the no-spam rule for several jobs); extend it
  when adding skills.

## Making a job (every new job or path, the standard the player approved)

Build every future job the way the Warrior, Archer and Thief and their paths (Paladin, Berserker,
Beastmaster, Stormcaller, Shinobi, Kitsune) were built; the player signed off on that result and wants all jobs made like it. The full
step-by-step recipe is `docs/design/making-a-job.md`: read it before starting any job. In short:

- **Research first.** Read the art research (below) and look at real references for the job
  (MapleStory first: research/fx.md section 6), and save new findings back there.
- **Its own feel in combat:** its own basic combo (3 steps with a finisher), command moves (up +
  attack, in the air, on the run), its own gauge that builds in a fight in its own way and does
  something while full, skills built as timed combo steps, and a finisher with a big signature
  moment that needs the gauge full and spends all of it (`fullGauge`; never a hit-count cost). Follow
  the combat rules below and extend `tests/melee.test.js` for it.
- **Its own animation:** moves drawn for its weapon (a bow really draws, a crossbow kneels and
  cranks), with weight that matches each blow.
- **Its own colour and shape language**, bold enough to read on every map, so a hit says whose it
  is (the Warrior's steel-blue cross and giant sword, the Archer's gold arrows and sky-blue feathers, the Thief's violet smoke and crescent moons, the Shinobi's ink and red seals, the Kitsune's blue fox fire and tails, the Paladin's gold star, the Berserker's rose claws, the Ranger's
  emerald wind and leaves, the Sniper's ice-blue streaks and rose sight).
- **Effects in Tengu's own art** (`tools/fx-art.js`, HD with a soft glow; see the effects rule
  below): swipes or shots, a hit mark, a buff pillar with its emblem, a gauge aura, and a picture
  for each big skill. Never packs or code-drawn glows.
- **Everything else it touches:** icons, HUD gauge, sounds, bots and party play, its trial or
  quest to unlock, docs (README and the art notes).
- **Show it:** record demo videos of every skill and send them; fix what looks wrong before
  calling it done.

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

**Effects are Tengu's own art, in the style the player picked: HD with a soft glow.** Effects
are drawn for the game in `tools/fx-art.js` as soft pastel shapes (4-tone ramps that lean violet in
the shadows, white cores, the game's curvy sparkle stars, outlined in a darker shade of their own
colour), rendered in HD (`FXHD.render`: three strip pixels per game pixel, smooth edges) with a soft
glow bloomed from their bright parts only. `tools/build-fx.py` renders them into the `cel*` strips
in `assets/fx/`; the game draws them smoothed, and blends each drawing into the next so effects
flow instead of stepping. Every effect is a short run of key drawings: a shape pops in, holds a
beat, then breaks up into beads and sparkles. Big versions (`big()`) are re-rendered at their own
size from the same art, never stretched strips. The player rejected code-drawn gradient glows, pack effects (pixel and HD alike) and bold black-outlined
anime effects; every effect in `assets/fx/` is now Tengu's own. Look at
references first (research/fx.md section 6, MapleStory) for what each moment should show. Code
drawing is for small supporting touches only (a tracer line, a sight's ticks).

**The character never squashes, stretches or narrows (the player's standing rule, for every
move, job and future animation).** Moves may lift, lunge, lean, crouch, tuck and flip the figure,
but it is always drawn at its own width and height: a spin is a clean mirror flip at each half
turn, never a squeeze, and jumping, landing and getting hit show in the pose alone. `rigid` in
`render/hero.js` enforces it and `tests/anim.test.js` checks every move against it.

**Expressive, smooth, creative, never generic (the player's standing rule, for everything).**
Every character, summon, NPC, monster, move, effect, UI piece and map must be expressive,
smoothly animated, creative and polished to as near perfect as we can make it. Nothing may be
generic, stiff or clunky:
- Poses blend into each other, never snap.
- Motion has anticipation, follow-through and overlap: hair, cloth, tails and props trail and
  settle.
- Faces and bodies act: they react, emote and have idle life.
- Every design has its own idea rather than a stock one.

If something reads as plain, rigid or "default", it isn't done: rework it before showing it.

**Freedom to make it better (the player's standing rule).** The player always wants things better,
so you have broad freedom to improve whatever you're working on: redraw, rework, add, or replace
art, effects, animation, moves and feel when it raises the quality, without asking first. That
includes re-rigging freely (the rig, poses, joints, how weapons are held, how a move is built) for
any character, job, monster or move, to animate it, make it fit, or make it look better, and
reanimating or redrawing anything (sprites, monsters, effects, maps, UI, icons) so it fits the
game's theme and look. You may also freely draw new character parts whenever they help a design:
new clothes and outfits, hairstyles, faces, eyes, brows, ears, tails, horns, wings, accessories,
props, and anything else (for heroes, summons, NPCs and monsters alike). Keep the
other standing rules (no squash or stretch, hits on the animation, no spam), and show the result
with pictures or videos. Still ask before changing what the game is (story, progression, removing
features) or when the player's choice is genuinely needed.

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
