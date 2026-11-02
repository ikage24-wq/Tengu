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
Beastmaster, Stormcaller, Kitsune; now the Wind Dancer and Blade Dancer) were built; the player signed off on that result and wants all jobs made like it. The full
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
  is (the Warrior's steel-blue cross and giant sword, the Archer's gold arrows and sky-blue feathers, the Wind Dancer's coral ribbons, crescent gusts and spinning rings, the Blade Dancer's rose-gold rings that ricochet and spark, the Kitsune's blue fox fire and tails, the Paladin's gold star, the Berserker's rose claws, the Ranger's
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

**Everything is animated, fluid, smooth and good (the player's standing rule, 2026-11-01).** Nothing
in the game sits frozen: characters, monsters, summons, NPCs, props, plants, gathering spots,
platforms, effects, UI and HUD pieces all have motion or idle life. And every motion is fluid:
- Changes ease in and out (smoothstep, springs, blends between key poses), never snap or jump
  between two states; timed beats use eased windows, not on/off switches.
- Motion runs on time, at the frame rate, with in-between frames where sprites step; nothing
  stutters, flickers or pops in and out.
- Animation phases come from a thing's own place in the world (or its own id), never from where
  it is on screen, so nothing speeds up or stalls as the camera moves; things on a moving platform
  move with it.
- Check it moving (a strip of moments or a short recording), not just a still, before calling it
  done.

**The Wind Dancer standard (the player's standing rule, 2026-11-02, for every job, path, summon,
monster and move from now on).** The remade Wind Dancer is the quality bar the player approved;
everything is held to it:
- **Its own motion, matching its name.** Every move is drawn for what the thing *is*: a dancer
  dances (piqué, pirouette, arabesque, fouetté, a bow), a knight fights like a knight, a witch
  casts like a witch. Name each move for the figure it is, and build the whole set from that one
  idea.
- **Re-rig freely to get there.** Change how the weapon is held, its size, its grip point, rest and
  ready angles, idle fidgets and the rig's poses whenever it makes the motion read better (the
  chakram was re-gripped on its rim and hung at the hip so it never covers the face).
- **Fluid and smooth.** Anticipation, a clean strike landing early, follow-through and a held end
  pose; poses ease into each other, turns are clean mirror flips, nothing snaps or stutters.
- **Readable.** Nothing covers the face in any pose (check standing, idle fidgets, ready, walk,
  jump, every move); the silhouette says what the move is at game size.
- **Its effects follow the moves**, in the job's own colour and shapes, never another job's
  defaults (no steel trails, pillars or emblems on a coral dancer).
- **Checked moving, then shown.** Render every move as a strip of moments (`tools/move-strip.html`),
  check every pose for the face (`tools/hold-sheet.html`), record GIFs of the moves and of the skills
  in the game (`tools/make-gif.py`), fix what looks wrong, and send the GIFs before calling it done.

**Never reuse another job's moves (the player's standing rule, 2026-11-02).** Every job and path
gets its own animations drawn for its own fantasy: a dancer moves like a dancer, a knight like a
knight. Never borrow another job's swings, throws, poses or effects and re-skin them (the first
Wind Dancer reused the old Thief's swings and the player called them generic). Reuse the engine
(the rig, the timing, the strike system), never the motion. A new job isn't done until every
move it plays is its own.

**Summons are built on a player character, with a new rig (the player's standing rule, for every
summon and companion).** Every summon (a companion, a shikigami, a guardian, anything a job calls
to fight beside it) starts from the player character (the hero's body, parts and drawing, so it
belongs in the game's look), and then gets:
- a new rig of its own: its own skeleton, poses and joints on top of that base, never the
  player's moves and never another summon's (not Snow wolf's, not the Spirit Doll's);
- new animations of its own: very, very smooth and expressive, with anticipation, overshoot,
  follow-through and overlap, idle life and personality in every move, unique to it;
- a unique look: its own outfit, hair, ears, tail, face and props (draw new parts freely), and its
  own size and silhouette where the design calls for it (bigger or smaller, never stretched).
Never take a shortcut by reusing another character's rig or animations, and never draw a summon
from scratch outside the player-character base.

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
- Check in with the player as you go (the player's standing rule). On any job, character, feature
  or big piece of art, stop at the real choice points: the look, the personality, how a move or
  system should feel, what to build next. Give the player 2-4 concrete options there, with your
  recommendation first, instead of deciding alone. Show samples (pictures or short videos) before
  the full build and between stages, and fold the player's answers back into the work. Small
  polish and fixes that are clearly better don't need asking; the freedom rule covers those.
- Bot and NPC chat must never read generic, spammy or repetitive (the player's standing ask).
  Everything the other players say goes through the chat gate (`src/world/chatlog.js`: no repeats
  for ten minutes, one line of their own per 30 s, a paced chat log), and every line is about
  something real for the speaker (their own gear, job and map, its monsters, where they're headed,
  what just happened on the server); a line that doesn't fit isn't said. New features that make
  bots talk follow the same rules, and new townsfolk get lines of their own beyond their trade's.
- **No useless features (the player's standing rule).** Before building anything the player asks
  for (or that you'd suggest), check that it actually helps or improves the game: something the
  player does, decides, earns or enjoys in play, not background flavour, a one-off gag, a chore, a
  copy of a system that already exists, or a setting nobody would touch. If it doesn't clear that
  bar, say so plainly before building it, explain why in a sentence, and offer a version that would
  help (or suggest skipping it). Build it only if the player still wants it after hearing that.
  The 2026-10-31 cleanup removed a long list of such things (fake-player town gags, gear layers
  that duplicated polishing, chores like running out of stars or a hungry pet): don't bring them
  back.
- **Hunting maps are built MapleStory style: tall, in zones (the player's standing rule, from
  the Blossom Heights example, `tools/tall-map.html`).** A main hunting map climbs high (about
  1000-1500 px, 8-14 floors 80 px apart, ropes and ladders between them) and is split by height
  into zones, each with its own look and its own monsters, so players spread out over the floors
  instead of crowding one line. Exits sit on different floors (the best one at the top, as the
  reward for the climb), and floors vary: wide ledges, short zig-zag hops, gaps to drop through.
  Not every map has to be big, and size is decided per map, not by its kind: a town or a linking
  map can be big too when that makes it better (a town climbing a cliff in districts, a linking
  path up a mountain), as long as it is designed really well, with a reason for every floor and
  nothing that's just filler. Boss rooms and trial arenas are usually their own size, built for
  the fight. New maps follow this, and older maps get it when they are reworked.
  **Layouts vary (the player's standing rule, 2026-11-01): not every map is a bottom-middle-top
  climb, and no two neighbouring maps share a shape.** The shapes: a tall climb (zones by
  height); side by side (zones left to right, a journey across); sky islands (floating islands at
  different heights, gaps crossed by drifting clouds and updrafts); a descent (arrive at the top,
  the best part at the bottom); a valley (high at both ends, down into a low middle and up out);
  and surface and underground (a walk along the top with tunnels beneath, holes and ladders
  between). Floor shapes vary too: no stamped repeats of the same rows. Every map also follows
  these (the player picked them):
  - **Hunt in a loop:** monsters and ropes are placed so you can hunt round a floor or zone
    without walking back over empty ground, and respawns keep up with one hunter.
  - **Room to fight:** hunting floors are wide enough for dashes, knockbacks and launches; no low
    ceilings or tiny ledges where skills fall off.
  - **Safe arrival:** no monsters at portals or where you appear.
  - **A landmark per zone:** one big piece you recognise from far away (a giant mushroom, a
    shrine bell), so you always know where you are.
  - **A secret per big map:** one hidden find worth finding (a hidden ledge with a chest, a rare
    monster, a shortcut), never just flavour.
  - **Bots use the whole map:** bot players spread across every floor and zone like real players,
    not bunched on the ground floor.
  - **Maps heal as you hunt:** the island's spirits are souring (the story); as players hunt, a
    map grows calmer and prettier (flowers bloom, colour returns, its calm spirit shows), and
    left alone it slowly sours again.
  - **One fun moving part per zone:** its own way to get around beyond ropes (bouncy mushroom
    caps, swinging vines, drifting clouds, zip lines, updrafts).
  - **An area boss nest:** hunt enough on a map and its own boss wakes in a set spot, a shared
    moment for everyone there.
  - **Day and night:** maps follow the game clock (a 24-minute day, the same for everyone); at night
    some floors change, other monsters
    come out, lanterns light up and a night-only spot opens.
  - **Monsters live there:** they act like it's their home (nap on ledges, gather at the pond,
    chase each other, flee to their nest when hurt), a habitat rather than a spawn list.
  - **Maps connect in the view:** the next map shows in the far background (the canyon behind the
    meadow, the Sky Garden above the peak), so the island reads as one place.
  - **Weather per region:** real weather that changes play a little (wind pushes jumps on the
    peak, rain raises ponds and brings new fish, snow slows monsters).
  - **Fishing spots are quiet nooks:** a spot sits where no monster walks or flies to (a dock or
    a ledge of its own over the water), never on a floor monsters roam. No invisible walls or
    invincibility: the safety comes from the map's design.
  - **A shortcut home:** every map's far end has a quick way back toward its town (a slide, a zip
    line, a portal stone), so a long map never means a long walk back.
  - **Towns are split into districts with a feel:** each town's quarters (homes, market, plaza,
    its job's quarter...) are districts like a hunting map's zones, each with its own name, look
    and street life.
  - **Everything is close to the plaza in a town:** the shops, the stove and the job instructor are
    a short walk from the plaza (about 700 px at most); nothing important is up a ladder. Climbs in
    town lead to views, secrets and cozy spots.
  - **Life skills are important (the player's words):** every map has spots for fishing, mining
    and gathering that fit its theme and zones (fishing where there's water, ore veins in caves
    and cliffs, herbs and fruit in woods and meadows), worth visiting alongside hunting.
- Improve the whole game, not one thing at a time: when raising quality (art, animation, effects,
  maps, UI, game feel), carry the improvement across every part it applies to — heroes, NPCs,
  monsters, bosses, towns and maps, skills and effects, HUD and windows, icons — not just the piece
  that prompted it.

## Progression plan

"Continue the progression plan" means: read `docs/design/progression-plan.md` (the MapleStory +
FFXIV-style plan: story, job advancement, dungeons, bosses, collecting), pick the next unchecked
phase, build it, and tick it off there.
