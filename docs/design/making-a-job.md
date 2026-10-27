# Making a job

The recipe for every new job or path. The player approved how the Warrior paths (Paladin,
Berserker) and archer paths (Ranger, Sniper) turned out and wants every future job made the same
way. Read this whole page before starting a job, follow it in order, and update it when something
new is learned.

## 1. Research and plan

- Read `docs/art/README.md`, `docs/art/art-bible.md` and the research that covers the job
  (`research/fx.md` for effects and feel, section 6 for MapleStory's skill effects;
  `research/anim.md` for moves; `research/archery.md` is an example of a job's own research
  pass).
- Look at real references for the job's fantasy (MapleStory first, then other 2D action games).
  Save what you learn, with sources, in `docs/art/research/`.
- Decide the job's identity before writing code: its fantasy, its weapon, its **colour**, and its
  **shape language** (the Warrior's blue cross, the Paladin's gold star and pillars of light, the
  Berserker's rose claws and fire, the Ranger's emerald wind and leaves, the Sniper's ice-blue
  streaks and rose sight). Pick a colour bold enough to read on every map (pale mint vanished on
  purple maps).

## 2. Combat

Follow the combat rules in `CLAUDE.md` (no cooldowns, skills play out their whole motion, basic
attacks and skills weave, hits land on the animation, presses are buffered, weight matches the
blow).

- **Basic combo** (`world/melee.js`): three steps with a finisher on the third, each a move, a
  duration and strikes timed with `at`.
- **Command moves**: up + attack, attacking in the air, attacking out of a run.
- **Its own gauge** (like Valor, Momentum, Shadow, Rage, Faith, Gale, Focus in `world/melee.js`):
  - It builds in a fight in the job's own way (Valor from blows, faster the more monsters one
    blow catches; Momentum from shots landing in a row, halved when hit; Shadow from hits landing in a quick chain; Rage from blows, Faith
    also from hits taken, Gale from arrows landing, Focus from standing still and aiming).
  - It drains once the fighting stops.
  - The fuller it is, the stronger something gets.
  - While it's full, something special happens: Unbroken, Hawkeye, Phantom, Berserk, Sanctified,
    Tailwind's twin arrows, Deadeye.
  - Show it on the HUD (`ui/hud.js` GAUGES) with an aura on the hero (`render/aura.js`).
- **Skills** (`data/skills.js`): built as timed combo steps; limited by MP and their own
  animation only.
- **Finisher**: one big signature skill that needs the gauge **full** and spends **all** of it
  (`fullGauge: true`).
  - "FINISHER READY" shows over the gauge.
  - It must not refill the gauge.
  - Never cost it in hits.
- **Tests** (`tests/melee.test.js`):
  - the gauge builds and drains;
  - the full-gauge effect works;
  - the finisher waits for a full gauge and spends it;
  - the no-spam rule holds;
  - any special behaviour is tested (e.g. Sniper bolts pierce the line).

- **A first job with two weapons** (like the Thief's dagger and gauntlet) is the base for both
  2nd-job paths: one shared gauge and a few shared skills, then a set of skills for each weapon
  (each set with its own finisher and mastery, gated by `weapons`), so the player chooses where
  the points go, and its own basic combo and command moves for each weapon.

## 3. Animation

- Moves drawn for the job's weapon: a bow really draws and the string snaps, a crossbow kneels and
  cranks, an axe winds up heavy.
- The follow-through is the longest beat, heavier blows have more anticipation, and finishers
  overshoot.

## 4. Effects (Tengu's own art)

Every effect is drawn for the game in `tools/fx-art.js` in the style the player picked (see
`CLAUDE.md` and `docs/art/README.md`).

- **Style**:
  - Soft pastel shapes in 4-tone ramps.
  - White cores, the game's curvy sparkle stars and beads.
  - Matched to the sprites: drawn at their pixel size, outlined in a darker shade of their own
    colour.
  - Every effect is a few key drawings: it pops in, holds a beat, then breaks into beads and
    sparkles.
- **Never** use effect packs or code-drawn glows.
- **Keep pixel art near scale 1.** For something that plays large, add a big version (`big()` in
  fx-art.js) rather than stretching a small one.
- **Each job needs**:
  - its swipe or shot;
  - a hit mark that says whose hit it is;
  - a crit (or a variation of the shared one);
  - a buff pillar with its own emblem;
  - its gauge aura (building and full);
  - one recognisable picture for each big skill and for the finisher;
  - small touches: dust, rings, trails.
- **Build**: run `python3 tools/build-fx.py`, which writes the `cel*` strips and
  `src/render/fx-sheets.js`. Wire them in through `render/warrior-fx.js` (melee paths),
  `render/archery.js` (shots) or a new file for the job, and `render/aura.js`.
- **Check**:
  - slow-motion screenshots in the game;
  - effects read on the purple and bright maps;
  - pixels the same size as the characters';
  - no effect blocks the hero or the monsters for long.

## 5. Everything else it touches

- Job data (`data/jobs.js`), its trial quest and trainer NPC (`data/quests.js`, `data/npcs.js`).
- Skill icons (`render/icons/skills.js`) and job gear look (`render/jobgear/`).
- Sounds for its weapon and skills.
- Bots and party play (`world/bots.js`, `world/party.js`).
- Dungeon roles (`data/dungeons.js`).
- Docs: README (the job's section) and the art notes.

## 6. Show it

- Record a demo video of every skill (basic combo, command moves, each skill, the gauge filling,
  the finisher) with captions, and send it.
- Fix anything that looks wrong before calling the job done.
- Commit and push, and report in plain words with pictures.
