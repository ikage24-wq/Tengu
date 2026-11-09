# Tengu: notes for working on the game

A pastel chibi 2D side-scroller RPG in vanilla JS canvas (no build step). `npm test` runs the
`node:test` suites; `npm start` serves the game at http://localhost:8000. See README.md for the
game itself and the source layout.

## Combat rules (every job, every new skill)

These hold for all jobs, current and future. Keep them when adding or reworking any skill.

- **Cooldowns are allowed (the player's change, 2026-11-07).** Skills were once limited only by MP and
  their own animation; the game has moved on, and a skill may now have a cooldown where it fits (long
  buffs, big heals, strong utility). Everyday attack skills still lean on MP and their animation.
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
  shake all follow the same rules. The press itself still answers at once: the move starts on that frame (the art
  standard, Feel).
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

Build every future job the way the Warrior and its paths (Paladin, Berserker), the Acrobat Archer
and its paths (Phantom Trickster, Arbalist Engineer) and the Wind Dancer and its paths (Blade
Dancer, Sky Dancer) were built; the player signed off on that result and wants all jobs made like it. The full
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
  is (the Warrior's steel-blue cross, the Acrobat Archer's gold arrows, mint ribbons and confetti,
  the Phantom Trickster's plum smoke, cards and doves, the Arbalist Engineer's brass cogs, teal bolts
  and steam, the Wind Dancer's coral ribbons, crescent gusts and spinning rings, the Blade Dancer's
  rose-gold rings that ricochet and spark, the Sky Dancer's sky-blue wind crescents, clouds and
  whirlwinds, the Paladin's gold star, the Berserker's rose claws). Colour and shapes live in the
  effects, never in a restyled weapon (see "A job never replaces the weapon").
- **Effects in Tengu's own art** (`tools/fx-art.js`, HD with a soft glow; see the effects rule
  below): swipes or shots, a hit mark, a buff pillar with its emblem, a gauge aura, and a picture
  for each big skill. Never packs or code-drawn glows.
- **Everything else it touches:** icons, HUD gauge, sounds, bots and party play, its trial or
  quest to unlock, docs (README and the art notes).
- **Show it:** at each real checkpoint send one short clip of what's new (the basic attacks, then
  the skills); more only if the player asks. Fix what looks wrong before sending.

## Art, animation, and effects

**Consult the research for new designs.** `docs/art/research/` is the saved research guide: about
350 sources in five languages (tutorials, artists' process posts, game-dev talks, real game data).
Before designing something new (a job, a map, a monster, a look, a UI screen), read
`docs/art/README.md` and `docs/art/art-bible.md` (the rules drawn from it), then the research files
that cover the task. Small fixes and tweaks don't need it. For UI that's `research/env.md` sections
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

**Indoors is indoors (the player's standing rule, 2026-11-04).** A room inside a building has
nothing of the outdoors in it: no birds, butterflies, gulls, fireflies or other critters, no
petals, leaves, snow, rain or outdoor motes drifting through, no street life, no sky, and no
birdsong or outdoor sounds. The outside shows only through a window or door; the room's own life
(a fire, steam, lanterns, a hammock) is drawn with it, and the floor you walk on is the room's own
painted floor, never a default ground strip (`look.floor: 'painted'`). Rooms set `indoor: true` (and a ceiling)
so the outdoor look, particles and ambience stay outside; see `docs/art/art-bible.md`, "Exterior
and interior design", and check every room for it before showing it.

**The character never squashes, stretches or narrows (the player's standing rule, for every
move, job and future animation).** Moves may lift, lunge, lean, crouch, tuck and flip the figure,
but it is always drawn at its own width and height: a spin is a clean mirror flip at each half
turn, never a squeeze, and jumping, landing and getting hit show in the pose alone. `rigid` in
`render/hero.js` enforces it and `tests/anim.test.js` checks every move against it.

**The quality bar (the player's standing rules, 2026-11-01 and 2026-11-02, for everything).** The
remade Wind Dancer is the bar the player approved. Every character, summon, NPC, monster, move,
effect, UI piece and map is held to it:
- **Its own idea, never generic.** Every move is drawn for what the thing *is*: a dancer dances
  (piqué, pirouette, arabesque, fouetté, a bow), a knight fights like a knight. Name each move for
  the figure it is and build the whole set from that one idea. Never borrow another job's swings,
  throws, poses or effects and re-skin them (the first Wind Dancer reused the old Thief's swings and
  was called generic): reuse the engine (the rig, the timing, the strike system), never the motion.
- **Alive.** Nothing sits frozen: characters, monsters, props, plants, platforms, effects, UI and
  HUD all have motion or idle life; living things breathe and shift their weight, and faces and
  bodies act (react, emote, idle).
- **Fluid.** Anticipation, a clean strike landing early, follow-through and a held end pose; hair,
  cloth, tails, ears, capes, sleeves and dangling gear trail and settle on their own timing; changes ease in and out (smoothstep, springs, blends),
  never snap or switch on and off; motion runs on time at the frame rate with nothing stuttering,
  flickering or popping; animation phases come from a thing's own place in the world or its id,
  never from where it is on screen, and things on a moving platform move with it.
- **Re-rig freely to get there.** Change how the weapon is held (its grip point, rest and ready
  angles), idle fidgets and the rig's poses whenever it makes the motion read better (the chakram
  was re-gripped on its rim and hung at the hip so it never covers the face). Never the weapon
  itself: its size, shape and look stay as equipped.
- **Readable.** Nothing covers the face in any pose (standing, idle fidgets, ready, walk, jump,
  every move); the silhouette says what the move is at game size.
- **Its effects follow the moves**, in the job's own colour and shapes, never another job's
  defaults (no steel trails, pillars or emblems on a coral dancer).
- **Checked moving, then shown.** Look at every move as a strip of moments (`tools/move-strip.html`)
  and every pose for the face (`tools/hold-sheet.html`), fix what looks wrong, then send a short
  clip at the checkpoint (`tools/make-gif.py`).

If something reads as plain, rigid or "default", it isn't done: rework it before showing it.

**Summons are built on a player character, with a new rig (the player's standing rule, for every
summon and companion).** Every summon (a companion, a guardian, anything a job calls
to fight beside it) starts from the player character (the hero's body, parts and drawing, so it
belongs in the game's look), and then gets:
- a new rig of its own: its own skeleton, poses and joints on top of that base, never the
  player's moves and never another summon's;
- new animations of its own: very, very smooth and expressive, with anticipation, overshoot,
  follow-through and overlap, idle life and personality in every move, unique to it;
- a unique look: its own outfit, hair, ears, tail, face and props (draw new parts freely), and its
  own size and silhouette where the design calls for it (bigger or smaller, never stretched).
Never take a shortcut by reusing another character's rig or animations, and never draw a summon
from scratch outside the player-character base.

**Freedom for polish (the player's standing rule).** Small fixes and polish that are clearly better
(smoother motion, a cleaner pose, a fixed effect, a re-rig so a move reads) don't need asking. Real
choices (a job's idea, a look, how something should feel, what to build next) go to the player first
(the check-in rule below). Keep the other standing rules (no squash or stretch, hits on the
animation, no spam, never restyle a weapon) and show the result with pictures or videos.

## The art standard (the player's standing rules, 2026-11-09)

Every character, monster, summon, NPC, move, prop, map, effect and UI piece meets all of these.
"(test)" marks a rule a test checks: the rigs and motion in `tests/rig.test.js` (every frame of
every move), placement and readability in `tests/placement.test.js`, sizes in `tests/assets.test.js`,
map-change cleanup in `tests/session.test.js`. Moves or files that broke a rule when its check was
written sit on that test's KNOWN list, to be fixed (a fixed one must come off it). Rules without a
test are checked by eye on the strips, the hold sheet and a real map before showing anything.

**Rigs**
- **Joints bend the right way:** elbows and knees never bend backward or past a natural limit. (test)
- **Hands really hold things:** the weapon's grip sits in the hand on every frame; no floating
  weapon, no gap between fist and handle. (test)
- **Nothing comes apart:** arms, legs and head overlap the body at the joints in every pose. (test)
- **Feet stay planted** on the ground during attacks, idles and turns; they slide only when stepping. (test)
- **Limbs never change length:** upper arm, forearm, thigh and shin keep their length in every pose. (test)
- **Joints pivot at real joints** (shoulder, elbow, hip, knee, neck).
- **The neck has limits:** the head turns and tilts within a natural range. (test)
- **Feet follow the ground:** on slopes and steps the feet tilt with it and the body adjusts.
- **Hands have shapes:** a fist to punch, a grip to hold, an open hand to cast or wave, a point to
  point; never one hand shape for everything.
- **Layer order never flickers:** the back arm stays behind the body and the front arm in front; a
  part changes layer only at a planned moment of a move.

**Animation**
- **Arcs:** limbs and weapons travel on curves, never straight lines between poses.
- **Uneven timing:** every move has one fast moment and one held moment, never even spacing.
- **No linear motion in bodies:** every pose change of a character, monster or summon eases in and
  out. (test) Things that really travel at a steady speed (arrows and bolts in flight, drifting
  clouds, scrolling backgrounds, moving platforms, loading bars) are exempt.
- **A chain, not a block:** on a big move the hips lead, then the chest, the arm, the hand or
  weapon, each a beat after the last.
- **A strong line of action:** every key pose has one clear C or S curve through the body.
- **Silhouettes read:** every key pose says what it is as a solid black shape.
- **Moving holds:** a held pose keeps breathing or drifting after about a third of a second.
- **Turning has a turn** for NPCs, bots, monsters and cutscenes: the head looks first and the body
  follows (spins stay clean mirror flips). Your own turns are instant: you face the way you press.
- **Landings land:** a jump ends in a crouch that takes the weight, then a rise (pose only, never
  squash). It's only the look: you can move, jump or attack straight out of it, with no lock.
- **Power shows in the wind-up:** for monsters and bosses, the bigger the hit, the longer and deeper
  the anticipation and the heavier the recovery. For you, a big move shows its power in the pose, but
  it still starts on the frame you press, and skills keep their timing.
- **Hits react to their direction:** a monster flinches away from the side it was hit on.
- **Every enemy attack has a visible wind-up**, so you can see it coming.

**Drawing**
- **One light, one style:** every sprite, prop, map and effect is lit from the same upper-front light,
  at the same pixel size, with the same outline weight (see the art bible).
- **Big, medium, small:** one big shape that reads from far away, a few medium ones, small detail only
  where the eye should go (face, hands, weapon).
- **Values first:** a design works in greyscale before it gets colour, the strongest contrast at the face.
- **Real volume:** forms wrap, overlap and turn; nothing is a flat cut-out.
- **Materials read as what they are:** metal shines sharp, cloth folds soft, wood has grain, skin is warm.
- **Clean clusters:** no stray pixels, wobbly lines or muddy gradients; line weight follows form.
- **Consistent proportions:** each character keeps the same head-to-body ratio, eye height and hand
  size in every pose, outfit and scene. (test)
- **Recognisable silhouettes:** every named character has its own hair shape or accessory; no two
  share a silhouette.
- **Hands and feet stay readable** at game size, never blobs.
- **A final polish pass:** zoomed in, at real size in a real map, and (for new designs and big
  changes) beside a reference from a top-quality game. If it looks worse side by side, it isn't done.

**Hair**
- **Volume:** hair sits above the skull with real thickness, the part in the same place in every pose.
- **Moves by its weight:** long heavy hair swings slow and settles late, short hair bounces quick;
  every lock follows the way you move and the wind.
- **Bangs never hide both eyes** unless the style is designed to, and hair never cuts across the
  eyes by accident in motion.

**Eyes**
- **Eyes look at something** (the player, a monster, whoever is talking) and dart from point to point
  quickly rather than sliding; gaze uses a few fixed directions (speed rules).
- **Eyes fit the personality:** soft and lowered for shy, sharp and level for confident, half-lidded
  for sleepy; each character has its own set.
- **Eyes stay a fixed distance apart, never cross, and keep steady highlights.**

**Face and mouth**
- **The face reacts first:** an emotion shows on the face a beat before the body follows.
- **Brows do the acting,** one at a time for mixed feelings.
- **Expressions change through an in-between,** never snapping from calm to shocked; faces use fixed
  shapes (speed rules).
- **Marks are rare:** an extra flush, sweat drops and anger marks for real moments only. The soft
  cheek blush that's part of a normal face stays.
- **A full set of mouth shapes:** closed, small o, open, wide, smile, frown, a tight line, teeth; at
  least six in regular use.
- **Talking uses real shapes:** vowel-like mouths, not open-close flapping (fixed shapes, speed rules).
- **Mouths stay centred and the same size,** on the face's centre line in every pose.
- **No stuck default smile** on NPCs, bots and monsters: their mouths rest naturally and react. The
  face a player picks for their own character in the creator is kept as chosen.

**Life**
- **Personality in the idle:** every named character (NPCs, sweethearts, bosses) has an idle that says
  who they are; bots draw from a pool of personality idles (the crowd's loops stay in the cache).
- **Eyes are alive:** each blinks at its own rhythm (set from its id, never a random number), glances
  around and looks at you when you come near.
- **Breathing and weight:** everything living breathes and shifts its weight; nothing stands like a statue.
- **Secondary motion:** hair, ears, tails, capes, sleeves, ribbons and dangling gear trail and settle on
  their own timing, never in lockstep with the body.
- **Characters react to the world** through animation on existing characters only (a flinch at a hit,
  a cheer at your level-up, a shiver in snow), never a new system or gag.
- **Acting, not posing:** emotions use the whole body, each character in their own way.
- **No twinning:** poses are never perfectly symmetrical (one shoulder higher, weight on one leg,
  hands doing different things).
- **The world breathes:** grass sways, water ripples, lamps flicker, smoke drifts, signs creak. No new
  critters (the player removed the town critters).

**Design**
- **No overused defaults without a twist.** Banned as the core of a design: plain fire/ice/lightning
  trios, basic slimes, generic skeleton knights, runes on everything, and new monsters or jobs that are
  just a recolour (cosmetic colour options are fine). Every new design has a one-line idea and one
  signature detail nobody else has.
- **Readability first:** you, monsters and anything you can interact with stand out from the
  background in greyscale on every map. (test)
- **Colour discipline:** each area keeps a small palette; its brightest accent goes to what matters
  (loot, portals, quest people) and to legendary gacha sets, the chase.

**AI-like tells (banned)**
- Stamped or mirrored copies of the same prop or building; random clutter; light from different
  directions in one scene; mixed pixel sizes; glow on things that don't give off light (effects, lamps
  and magic may glow); busy noise detail that adds nothing to the shape; things clipping into each other.

**Placement**
- **Everything rests on something:** props and characters sit on a surface with a small contact shadow;
  only magic things float, with a shadow below. MapleStory ledges, platforms, clouds and sky islands
  are exempt and stay floating. (test)
- **Nothing overlaps:** standing NPCs, props, doors, signs and portals never overlap each other. (test)
  Moving players, bots and monsters may pass through each other, as in any MMO.
- **Scale makes sense:** doors, chairs, beds and stairs fit the hero's size.

**Feel**
- **Every press answers at once:** the move starts on the frame you press; each sound plays at its own
  moment of the move (no extra sound on the press), and the hit still lands on the animation.

## Speed rules (no lag: the player's standing rule, 2026-11-08)

The player plays on a 144 Hz screen: a frame has **6.9 ms** for all of its work. Every rule below
is a lag that was really found and fixed; breaking one brings that lag back. `npm test` (the speed
tests, `tests/perf.test.js`) and `npm run speed` (`tools/perf-check.mjs`: every map, every job's
skills, every window) count what each frame does and fail when one is broken.

**Pictures (sprites)**
- **Never build a sprite key from a raw value** (time, a spring, a progress, a speed, a colour
  that blends): a new key every frame is a new painting every frame (2–6 ms each, plus 1–3 MB of
  garbage that stalls a frame later when the browser clears it). Round to fixed steps or loop.
- **Walks run on 24 fixed frames** (`WALK_FRAMES`), the hair and cloth springs held for each cycle
  (`walkHeld`, moving on only when they've really moved, 2 px), the breeze and flutter in time with
  the steps (`walkLoop`); the walk is painted ahead in the background (`spriteSoon`). The held gait
  compares in quarters: an exact gait reset the loop every frame you sped up.
- **Moves step**: yours 24 steps a move, everyone else's 16; a blend between moves 3 steps, the old
  move on 8; springs in whole pixels during a swing, breeze and flutter in time with the move.
- **Standing still loops**: the crowd 6 s at 8 fps (48 pictures each, so a town of thirty fits the
  cache), you 8 s at 20 fps, previews (shop, bag, creator) ~11 s at 20 fps. Scripted chore poses
  and `drawPosed` figures on half pixels. Mount springs on half steps; the dog in quarters.
- **Who paints where**: you are drawn exactly on the spot; everyone else's non-walking poses go to
  the sprite worker (`spriteAsync`, their last frame standing in for a frame or two); their walks are
  painted ahead; people up to 320 px off screen are painted ahead (`prepareHeroes`); a newcomer
  past the 2.5 ms crowd budget waits a frame for the worker rather than stalling it.
- **The sprite cache** holds 12,000 sprites / 384 MB on a computer (160 MB on a phone without
  `deviceMemory`): too small and a busy town's loops push each other out and repaint forever.

**Canvases, tints and copies**
- **No new canvas, tint pass or pixel read every frame.** Cache it, keyed by things that only change
  in steps, and cap the cache.
- **A copy of a character is drawn once and stamped**: afterimages are drawn and tinted once when
  they appear, then only placed and faded (`ghostImage`); copies in your own pose (Stampede, Shadow
  Partner, Mirage, illusions) are drawn once a frame per tint and stamped at each copy
  (`copyImage`), into reused canvases. Never redraw the whole hero per copy per frame.
- **Static backdrop pieces keep their picture**: set-back hazed decos are redrawn 30 times a second
  at most (`hazedKept`), never every frame.
- **Colour blends step**: zone blends in eighths (`blendLook`), day and night in sixteenths
  (`tickDaytime`); per-sprite tint and veil copies keep at most 12 colours.
- **Swaying things lean a cached picture**: hanging drips are painted once straight and leaned by
  their sway as they're placed, never repainted for each step of sway. Bushes the same.
- **The glow pass only runs when something can glow** (effects, sparks, dungeon, boss mechanics,
  team link, zones on screen).

**Placing things on screen**
- **The camera sits on whole screen pixels** (`snap` in `drawWorld`): between them every thin line
  (grass blades, lip spikes, outlines) flickered as you walked.
- **Never `Math.round` a world position to whole world pixels** for drawing (houses, ledges, ropes,
  pets): it shakes against everything else, which lines up with the screen's own pixels (`snap`,
  `place`, `blit`). Cached pictures are drawn one to one, on whole screen pixels.
- **Nothing drawn may use `Math.random` or the real clock**: drawn twice with nothing moving, a frame
  must be identical (or it flickers). Animation runs on the `time` it's given.

**Budgets and caps (2026-11-09)**
- **Every system has a share of the frame:** drawing 4 ms, game logic 1.5 ms, bots 0.8 ms, sound
  0.3 ms (of 6.9 ms). Anything new fits inside its system's share; the speed check measures each and
  fails when one goes over. (The busy hunting fields, 83-101 fps live on 2026-11-08, must be brought
  inside it.)
- **The worst frames count:** the check tracks the slowest 1% of frames, not just the average.
- **Everything that spawns has a limit** (particles, effects, damage numbers, sounds at once,
  projectiles, loot on the ground); at the limit the oldest fades out. Nothing is unlimited.
- **Far away updates less:** monsters, bots and props well past the 320 px painted-ahead edge update a
  few times a second, and anything far off stops animating until it's close. Animation stays on time,
  so nothing pops or jumps when it comes into view.
- **Bots think on a timer:** their decisions (targets, paths, chat) run a few times a second, spread
  over frames so they never all think at once; their movement stays smooth every frame.
- **Routes are worked out once,** when a map loads, never every frame.

**Long sessions**
- **No slow build-up:** a 30-minute simulated session (hunting, map changes, windows, a boss) fails if
  memory or frame time keeps growing.
- **Leaving a map cleans up completely:** its monsters, effects, timers, sounds and cached pictures go;
  a test changes map 100 times and checks nothing piles up.
- **No garbage every frame:** normal play makes no throwaway arrays, objects or strings in hot code.

**Loading and size**
- **Fast loads:** the Windows app (or a cached web start) starts in under 3 s; a first web visit shows
  the title screen quickly while the rest loads behind it; a map change under 0.5 s, windows instant (timed).
- **No size limits** on files (the player's call, 2026-11-09): an effect gets as many drawings as it
  needs to move smoothly at 144 fps.

**Weaker machines**
- **The phone and busy-scene check:** with a phone's memory budget, a full town, a party fight and a
  boss together still hold 60 fps.
- **Fast/Sharp steps down on its own:** when frames run slow it lowers extras first (particles, glow,
  background detail), never the core look; it is the existing setting, not a new system.

**Every change**
- **No new feature without a speed check:** anything that draws, spawns or thinks goes into the speed
  test when it is built, not after lag shows up.
- **A speed record per version:** every release saves its numbers (frame time, worst frames, memory,
  load times); a new version is never slower than the last without saying so.

**Errors are lag too**: an error thrown while drawing stops the frame (the buff icon for a buff that
isn't a skill; an attack in the air before you've landed reading an empty combo step). Guard
lookups that can miss.

**Testing it (the player's rule: test like a player, everywhere)**
- Measure speed **live, with the browser pane showing** (requestAnimationFrame timings); a hidden
  pane is throttled and lies. Counts of paintings (`paintStats`) are the reliable offline measure.
- **A check must be on the map it means**: dungeon rooms are entered through a run started at the
  gate (`startRun`), never loaded bare (that sends you back to the gate), and the check asserts the
  map. A check of the gate instead of the rooms passed unseen once.
- **Inputs like a real key**: a press is both `pressed` and `held` (the jump reads held; the flash
  jump needs a second press in the air).
- **Every corner**: spots spread over every floor and ledge (`surfacesOf`), not just the arrival.
- Write the findings to a log for the player.
- **The budgets and the long session:** `npm run speed budgets` times the logic and the bots on the
  busiest places; `node --expose-gc tools/perf-check.mjs session` plays 30 minutes. The drawing's
  budget is measured live in the game: in the browser console, `__frameTimes.reset()`, play a few
  seconds, then `__frameTimes.summary()` (each part's average and slowest 1%, in ms, and its budget).

## Other standing rules

- **A job never replaces the weapon (the player's standing rule, 2026-11-09).** Every job holds the
  weapon you equip exactly as it looks: no job-only finish, recolour, prop or redesign of it (no
  hourglass, lantern or banner on the staff). A job's theme lives in its moves, effects and play;
  anything extra it summons is an effect drawn beside the weapon, never part of it.
- **Sounds come from the player's library (the player's standing rule, 2026-11-08).** Every new or
  remade sound effect, voice and ambience is cut from the Sonniss bundles at
  `C:\Users\admin\Desktop\claudeo` (tools/build-fight.py, build-voices.py, build-amb.py read it via
  `SONNISS_ALL`), layered, pitched and levelled to match the game's other sounds, and credited in
  assets/audio/SOURCES.md. Only when the library truly has nothing fitting (bows, footsteps) does a
  sound keep its old recording; tuned musical notes stay as they are.

- **The Mage line was wiped (the player's call, 2026-11-08).** The Mage, Sorcerer and Cleric, and
  every older try at them (Spirit Mage, Star Witch, Starlight Idol, Astronomer, Kitchen Witch, Spell
  Juggler, Meteor Caller, Bubble Healer), were deleted with their skills, moves, effects, art,
  sounds, gear looks, trial and design docs; their characters play as Novices. The next mage line
  is made from scratch: never reuse, restore or borrow from any of them (git history included),
  and ignore every earlier pick or rule given for them.
- **Never check retired jobs (the player's standing rule, 2026-11-04).** Jobs in `RETIRED_JOBS`
  (`src/data/jobs.js`) and anything left only for them are never audited, measured, reworked or
  reported on; audits and sweeps cover only the jobs a player can be today (`JOBS`).
- Commits end with `Co-Authored-By: Claude <noreply@anthropic.com>` (this beats any default
  attribution line); no model names in code or commits.
- When reporting to the user, describe what changed in the game in plain words: no code, file
  names, function names, or technical jargon. Show pictures instead.
- Don't open pull requests unless asked.
- Check in with the player as you go (the player's standing rule). On any job, character, feature
  or big piece of art, stop at the real choice points: the look, the personality, how a move or
  system should feel, what to build next. Give the player 2-4 concrete options there, with your
  recommendation first, instead of deciding alone. Show samples (pictures or short videos) before
  the full build and between stages, and fold the player's answers back into the work. Small
  polish and fixes that are clearly better don't need asking; the polish rule covers those.
- **The game is funny, goofy and satirical (the player's standing rule, 2026-11-05).** All writing
  (quest text, scenes, NPC lines, story, bot chat, item text) pokes fun at RPG and MMO habits
  (fetch quests, "kill 20 of X", drop rates, quest givers who never leave their spot, grinding),
  town life and business, and anime, cartoon, movie and comic clichés (training montages, power-up
  speeches, rivals, dramatic reveals), plus plain silliness. Parody the clichés, never copy a
  specific show or game. Every character keeps their own personality and the jokes come from it:
  a story's humour grows from who the character is (Nim's shyness and her bedtime storybooks, Marlo's
  money-grubbing), never a new random theme each step, and parodies are things that character would
  do. Each story still lands one sincere beat under the jokes at its end.
- **Every quest giver's quests are one short story (the player's standing rule, 2026-11-05).** A
  giver's loose quests become a chain of about 4 steps (`prereq`), with a scene played where the
  giver stands after every step (`QUEST_SCENES` and `SIDE_SCENES` in `src/data/scenes.js`): a twist
  in the middle that no other story has used, and an ending that lands a sincere beat and points to
  what comes next. Keep the giver's personality and lore, and make it funny from who they are (the
  rule above). Stage scenes with care: only people who stand near the giver (others come in with
  `spawn`), fixed spots so nobody overlaps a person, a prop or water, the camera framing what the
  words describe, and new cutscene moves or effects when a moment needs them (`ride`, `trip`,
  bursts at a place). Rewards pay about twice what hunting the same monsters would. Add a
  play-through test in `tests/director.test.js`, watch every scene in the game, fix what looks
  wrong, and send pictures or a video.
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
  between). Floor shapes vary too: no stamped repeats of the same rows (nor of props or
  buildings: the art standard's AI-like tells). Every map also follows
  these (the player picked them):
  - **Hunt in a loop:** monsters and ropes are placed so you can hunt round a floor or zone
    without walking back over empty ground, and respawns keep up with one hunter.
  - **Room to fight:** hunting floors are wide enough for dashes, knockbacks and launches; no low
    ceilings or tiny ledges where skills fall off.
  - **Safe arrival:** no monsters at portals or where you appear.
  - **A landmark per zone:** one big piece you recognise from far away (a giant mushroom, a
    shrine bell), so you always know where you are.
  - **A secret per big map:** one hidden find worth finding (a hidden ledge with a view, a rare
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
  - **Monsters live there:** they act like it's their home (gather at the pond,
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

## Progression plan

"Continue the progression plan" means: read `docs/design/progression-plan.md` (the MapleStory +
FFXIV-style plan: story, job advancement, dungeons, bosses, collecting), pick the next unchecked
phase, build it, and tick it off there.
