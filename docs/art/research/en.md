# English research: sprite art and animation (characters, monsters, bosses), plus general pixel-art craft

Scope: sprite art and every animation type (idle, walk, run, jump, attack, hurt, death, wings, quadrupeds, slime, cloth and hair), with frame counts and timings. Each finding names the game or artist it comes from. Backgrounds/UI and FX/game-feel belong to other researchers, so they appear here only where they touch sprites. Everything below was checked against the existing art bible; rules 1–25 there are not repeated.

## 1. Engines and queries that worked

- **WebSearch** worked well for discovery. Over 40 queries, for example "Slynyrd pixelblog walk cycle", "Celeste Player.cs Sprite.Scale", "pixel art hurt death animation frames".
- **DuckDuckGo** (`html.duckduckgo.com`) showed a bot captcha every time, so it was unusable.
- **Bing** (`bing.com/search`) returned unrelated results ("to-do list" pages), so it was unusable.
- **Direct fetches of primary sources gave the best data:**
  - slynyrd.com, pixelparmesan.com and saint11.art pages, via WebFetch.
  - **Saint11's tutorial GIFs, downloaded with curl and read frame by frame.** There are 24 cards (Impact, Attack, Death, Squash, Idle, Motion Blur, Jump, Character Design, Cuteness, Defend, Easing, Sub-pixel, Run, Walk, Quadruped, Wings, Outlines, Fabric, Slime, Metal, Slide/Roll, Fundamentals). Local copies are in `scratchpad/dl_s11/`, as `pair*.png` and `pairb*.png`.
  - **The released Celeste `Player.cs`** (github.com/NoelFB/Celeste), read for its real squash and stretch constants.
  - **The maplestory.io API**, which gave real per-frame delays for MapleStory's player animations and frame counts for its monster animations. The GIFs were parsed with PIL.

## 2. Top findings

### A. Animation timing tables (primary data)

**1. MapleStory (Nexon), real player frame delays** from the maplestory.io API, GMS v83. Source: https://maplestory.io/api/GMS/83/character/2000,12000,1302000/stand1/animated (swap the action name). Language: EN data.

| Action | Frames | Delay per frame (ms) | Total |
|---|---|---|---|
| `stand1` | 3 unique, ping-pong (A B C B) | 500 each | 2.0 s |
| `alert` (combat idle) | 3 unique, ping-pong | 500 each | 2.0 s |
| `walk1` | 4 | 180 each | 720 ms |
| `swingO1` / `swingO2` (one-hand slash) | 3 | 300 wind-up, **150 smear**, 350 follow-through hold | 800 ms |
| `stabO1` | 2 | 350, 450 | 800 ms |
| `swingOF` (finisher) | 4 | 200, 100, 100, 300 | 700 ms |
| `jump` | 1 pose | (200) | held |

The pattern: a long wind-up, a very short smear, and the longest hold on the follow-through. A finisher has 2 fast middle frames.

Monster frame counts from the same API (`/api/GMS/83/mob/{id}`):

| Monster | stand | move | hit | die | attack |
|---|---|---|---|---|---|
| Snail | 1 | 5 | 1 | 9 | — |
| Pig | 3 | 3 | 1 | 3 | — |
| Zombie Mushroom | 2 | 4 | 1 | 3 | — |
| Jr. Balrog (boss) | 2 | 5 | 1 | 3 | **12**, 4, 4 |

Hit is always 1 frame. Bosses spend their frame budget on the signature attack.

- **Apply to Tengu:** Use this as the baseline rhythm for `src/render/animator.js` and the mob animators. Hero idle bob at about 2 s per cycle. A 4-phase walk at 180 ms per phase (Tengu is distance-driven, so check that a step is about 180 ms at base speed). In `combo` data (`data/skills.js`), give light hits a wind-up of 2× their smear time and a follow-through hold of 2.3×. For mobs, use a single held hurt pose (Tengu already has this) and a 3–9-step death. Bosses get a 12-step signature attack.
- **Effort:** S (timing constants).

**2. Slynyrd, Pixelblog 8: frame budget versus timing.** Source: https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation
- An 8-frame run plays at 80 ms per frame and a 4-frame run at 160 ms per frame. Both loops last 640 ms.
- To shrink a cycle, delete the recoil frame (8→6), then the high point (6→4). Never delete contact or pass.
- 6 frames is the sweet spot. Too many in-betweens make motion look sluggish.
- **Apply to Tengu:** When cutting phases for small mobs, keep the loop length constant and keep contact and pass. Map the procedural walk sine to a **triangle-ish wave** (Slynyrd #50: the head path is a triangle wave, not a sine) for a snappier step.
- **Effort:** S.

**3. Slynyrd, Pixelblog 60 (Side-View Run 'n Gun).** Source: https://www.slynyrd.com/blog/2026/1/26/side-view-run-n-gun
- Timing: idle and walk at **120 ms per frame**; run, shoot, land and dust at **60 ms per frame**.
- 8-frame walk. 3-frame shoot overlays are added to every locomotion animation.
- Jump uses 3 poses: tuck, up and down.
- Landing reuses the crouch pose plus 1 frame with the head and arms dipped.
- **No jump anticipation**, so input stays instant.
- **Apply to Tengu:** In the hero jump, keep anticipation off. Add a 1-frame head and arm dip after the landing squash (`animator.js` `land`). Effects that sit on sprites (dust, step puffs) tick at 60 ms.
- **Effort:** S.

**4. Slynyrd, Pixelblog 52 (Idle Fighting Stance): asymmetric bounce timing.** Source: https://www.slynyrd.com/blog/2024/9/26/pixelblog-52-idle-fighting-stance
- An 8-frame combat idle. Frames 1–4 play at **100 ms** (rising, lingering at the top) and frames 5–8 at **50 ms** (falling fast, so gravity feels real).
- Parts move in a cascade per step: the torso moves 1 px, the shoulders and elbows 2 px, and the inner fist up to 4 px.
- The head often holds while the body moves, which is the delay.
- Forearms get small rotations. The skirt and straps get their own sub-motion.
- **Apply to Tengu:** Tengu's `alert` or combat-idle (after attacking) should use an eased curve that rises slowly and falls fast, not a symmetric sine. Give the hands or weapon 2–4× the torso amplitude, with the head holding 1 step.
- **Effort:** S–M.

**5. Pixnote animation basics: FPS per action.** Source: https://pixnote.net/en/learn/animation
- Idle 2–4 frames at about 6 fps (167 ms).
- Walk 4–6 frames at 8 fps (125 ms).
- Attack 4–8 frames at 10–12 fps.
- Effects 3–6 frames that "start small, expand sharply".
- **Effort:** S. A sanity check that matches #1 and #3.

**6. Sprite-AI timing table (secondary, tool vendor).** Source: https://www.sprite-ai.art/guides/animation-principles

| Phase | Timing |
|---|---|
| Idle | 300–500 ms per frame |
| Walk | 100–150 ms |
| Run | 60–100 ms |
| Jump launch | 60–80 ms |
| Jump apex hold | 120–180 ms |
| Landing squash | 80–120 ms |
| Attack recovery | 80–100 ms |

Squash on a 14-px character: 12–13 px tall and +1 px wide. Stretch: 15–16 px tall and −1 px wide.
- **Apply to Tengu:** Hold the jump apex: ease vertical speed near the top and hold the "up" pose about 150 ms.
- **Effort:** S.

### B. Attack, impact, hurt and death (Saint11 cards, read from the GIFs)

**7. Saint11 (Pedro Medeiros, Celeste and TowerFall art lead), "Attack Anim".** Source: https://saint11.art/img/pixel-tutorials/AttackSheet.gif
- **3 frames to hit and 4 frames back to idle.**
- **"It's important that there's no anticipation frame or players will feel input lag"**, for player attacks.
- Frame 2 is the smear and holds the longest (its timing bar is the longest).
- **Frame 8 is a bounce: it goes further left than frame 1**, an overshoot past idle before settling.
- **Apply to Tengu:** In `world/melee.js` combo steps, player light attacks start on the smear pose with no wind-up frame. Add a 1-step overshoot past rest at the end of recovery. This fits CLAUDE.md, where blows land on the cut.
- **Effort:** S.

**8. Saint11, "Impact".** Source: https://saint11.art/img/pixel-tutorials/Impact-export.gif
- The anatomy of an impact: idle → anticipation (short) → motion (longest bar) → overshoot → rest.
- **"Cut out those frames":** remove frames between rest and the target position for a faster, stronger move, and add lots of motion blur instead.
- **Freeze time:** "pause one frame *before* the impact. Don't pause too long. Only for very exaggerated impacts."
- Exaggerate with motion blur, smoke particles, shrapnel and debris, and things affected by gravity.
- The target must bounce and react. Shake the camera *and* the target.
- **Apply to Tengu:** For finishers, add a hit-stop frame **just before contact** (the raised weapon frozen), as well as Tengu's existing post-hit stop. Make the target sprite bounce as well as getting the screen shake. This plugs into `world/combat.js` hit-stop and `render/strikes.js`.
- **Effort:** M.

**9. Saint11, "Death / Take Hit".** Source: https://saint11.art/img/pixel-tutorials/Death.GIF

Death sequence:
1. **Impact:** the first frame is the strongest and throws the character all the way back.
2. **Give up:** stop the recovery halfway, bend the knees, and let the arms and head lag behind.
3. **Hit ground:** the arms lag behind and almost hit the ground. **Overshoot the ground by 1 px down**, then an arm bounce, then rest.

Small enemies:
- **Squish** (conserve mass), then **compress** (may shrink the sprite but stay plausible).
- Then a **contrast frame**: an all-white or all-black silhouette for one frame.
- Then an explosion.

Take-hit:
- "All about the correct easing". **Overshoot on the first frame. The impact uses only ONE frame**, then recover slowly back to idle over about 6 eased steps.
- **Apply to Tengu:** `render/monsters.js` currently does a flash plus a `><` face. Add these:
  - (a) A 1-frame max-displacement pose away from the hit, then an ease-out back over about 300 ms.
  - (b) A mob death of squash → compress → 1 white contrast frame → poof.
  - (c) Boss and queen death: throw back → knees buckle with lagging arms and head → hit the ground with a 1-lpx overshoot and an arm bounce.
- **Effort:** M.

**10. Saint11, "Defend" (hits that connect without damage).**
- Bounce the projectile off, and make only the shielded area react.
- Armor: small movement, a **long recovery**, and the armor shines on hit. A post-hit shine shows the armor is intact. **Don't move the silhouette much.**
- For a no-damage hit, use a "bubble explosion" instead of shrapnel: rounded shapes, short, plus a contrast frame.
- **Apply to Tengu:** Use this for guarded or armored mobs, boss shields and "0 / MISS" hits: a shine sweep across the sprite and a round puff, with no shrapnel. Files: `effects.js`, `monsters.js`.
- **Effort:** S–M.

**11. Slynyrd, Pixelblog 53 (Punches and Kicks): pixel offsets per phase.** Source: https://www.slynyrd.com/blog/2024/11/25/pixelblog-53-punches-and-kicks
- Jab, 5 frames: smear → hit → follow-through (the arm goes 1 px further) → recover → overshoot (the idle frame shifted back 1 px).
- Cross, 7 frames: load → pull (forearm back 1 px) → smear (front knee +4 px, back knee +9/−6 px, head −2 px) → hit → follow-through → recover → overshoot.
- **"The hit frame is slightly longer."**
- Two prep frames read as power. Pair them with delay, shake and a heavier effect.
- **Combos skip the idle frames between hits.**
- Hair and skirt flop at the end of a kick and flip back on recovery.
- **Apply to Tengu:** In `data/skills.js` combos, chained steps start from the previous step's follow-through pose, not idle. Finishers get 2 prep beats. Follow-through extends the reach by about 1 lpx past the hit pose.
- **Effort:** S.

**12. Slynyrd, Pixelblog 9 (Melee Attacks).** Source: https://www.slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks
- One smear frame is usually enough. A wide arc reads slow but powerful; a narrow arc reads fast but weak. The example sword arc is about 90°.
- Stretch the arm or weapon slightly at full extension. Hold the follow-through a little longer.
- Heavy weapons (maces, two-handed axes) get slower anticipation *and* recovery. Too much of either reads as lag or as being sticky.
- Choose the start stance to fit the cut: a backhand upward slash starts at the hip, a downward slash starts high.
- A colour gradient on the smear adds smoothness without adding frames.
- **Apply to Tengu:** Arc width is a weapon-class parameter in `strikes.js` and `weapon-fx.js`. Daggers: narrow 60° arcs, fast. Greatswords and axes: 150°+ arcs with longer wind-up and recovery. Stretch the weapon about 10% on the smear step.
- **Effort:** S.

### C. Squash, stretch and easing (the code-friendly part)

**13. Celeste (Maddy Thorson and Noel Berry), the actual squash and stretch constants.** Source: https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs

| Event | Scale (x, y) |
|---|---|
| Jump / wall jump | (0.6, 1.4) |
| Super bounce | (0.5, 1.5) |
| Side bounce | (1.5, 0.5) |
| Landing | lerp from 1 to (1.6, 0.4) by `min(fallSpeed / maxFall, 1)` |
| Crouch | (1.4, 0.6) |
| Turn while ducking / un-duck | (0.8, 1.2) |
| Dash start | Y = 0.7 |

- Every frame both axes approach 1.0 at a linear **1.75 per second**, so a 0.4 squash recovers in about 0.34 s.
- Freezes: `Celeste.Freeze(0.05)` on dash-attack collisions and 0.1 s on heavier ones. Directional shake lasts 0.1–0.2 s.
- **Apply to Tengu:** `animator.js` already has `land` and `rise` timers. Swap them for one scale vector with a decay rate:
  - Landing squash scaled by fall speed (cap 1.6×0.4, pivot at the feet).
  - Jump stretch at 0.6×1.4 for heroes. Chibi heads are big, so maybe 0.75×1.3.
  - **Mobs:** apply 1.3×0.7 when hit and 0.7×1.3 when launched.

  Mass rule (Saint11 "Squash"): always change width when height changes.
- **Effort:** S.

**14. Saint11, "Squash and Stretch" and "Easing".** Sources: https://saint11.art/img/pixel-tutorials/Squash.gif, https://saint11.art/img/pixel-tutorials/Easings.gif
- "Mass never changes." Preparation squashes in the **opposite direction** of the action.
- Stiff materials deform less. Combine squash with motion blur for extreme moves.
- **"Add squash and stretch tweens to your game code."**
- Easing: linear motion is dull. Back-in and back-out easing (anticipation plus overshoot) suits attacks, and "sometimes I even skip the middle frame to make the movement stronger."
- **Apply to Tengu:** Material per mob gets a squash multiplier: slimes 1.0, beasts 0.6, armour and golems 0.2. Store it in mob data. Use easeOutBack for weapon swings in `weapon-kit.js`.
- **Effort:** S.

**15. Saint11, "Jump".** Source: https://saint11.art/img/pixel-tutorials/Jump.gif
- Two jump sets: an UP set when starting with x-speed 0, and a FORWARD set when x-speed > 0.
- Phases: 1 anticipation (avoid on player characters) → 2 going up (simple, no loop) → 3 **invert** (a bridge pose while the y-speed flips) → 4 fall (arms up, head looks down, hair and cloth flap upward) → 5 contact (squash as much as you can; can be a long animation, interruptible).
- Use high-contrast hands to track fast motion. Don't forget dust.
- **Apply to Tengu:** Choose the jump pose by `vy` sign and magnitude in `hero.js` and `figure.js`, with a distinct apex "invert" pose for |vy| < threshold. Hair and cape springs should point *up* while falling (`animator.js` partly does this already).
- **Effort:** S.

### D. Idle, walk, run and locomotion

**16. Saint11, "Character Idle".** Source: https://saint11.art/img/pixel-tutorials/characterIdle.gif
- 2 frames: down 1 px with the arms open and the knees bent, then up 1 px with the arms down.
- 3 frames: the middle frame slows the "fall down" and **delays the face movement**.
- 6 frames: add **secondary animation like hair lagging behind the head**, and lots of sub-pixel movement.
- "Vertical alone is boring": horizontal movement compensates the vertical.
- Use the idle pose for personality specials: **blink, yawn, look around, scratch**.
- **Apply to Tengu:** Add an idle-fidget system in `animator.js`. After about 6–10 s of standing, play one of 3 fidgets per job (look around, stretch, adjust weapon). Queens and NPCs get personality fidgets (the fan flick for Tamamo).
- **Effort:** M.

**17. Saint11, "Walk Cycle" and "Run Cycle 1".** Sources: https://saint11.art/img/pixel-tutorials/Walk.gif, https://saint11.art/img/pixel-tutorials/RunCycleSimple.gif

Walk phases:
1. **Contact:** the front leg touches the ground.
2. **Down:** the impact drops the torso and head.
3. **Down+:** the lowest frame, with the arms at their widest.
4. **Prepare passing:** a head delay is added here.
5. **Passing:** the most room for character variation.
6. **Up:** the highest point.

The leg on the ground always moves backward. 12 frames is fluid (6 per leg); 6 is fine at low resolution.

Run: 4 key poses per leg.
1. **Jump:** both feet off the ground, highest point.
2. **Fall down:** the widest pose.
3. **Contact:** the front leg straight.
4. **Recover:** the lowest point, thinnest.

8 frames is simple; 16 frames is fluid.
- **Apply to Tengu:** The hero walk in `figure.js` and `animator.js` `walkPhase` should put the lowest body point *after* contact (on down+), not at contact, and add a 1-step head delay at prepare-passing. The run's widest pose is in the air, which differs from the walk.
- **Effort:** S–M.

**18. Saint11, "Quadruped Walk/Trot".** Source: https://saint11.art/img/pixel-tutorials/4LegsWalk.gif
- Treat a quadruped as **2 bipeds with a small time offset**. The head follows the front biped with a delay.
- Trot: every 2 frames a leg touches the ground. Leg contact order is 1 → 2 → 3 → 4 (mirrorable; a run uses a different order).
- Each leg cycles contact → drag → rise → forward.
- Back leg: the thigh moves regularly, the knee rises the foot, the paw lags. Front leg: the shoulder moves regularly, the elbow moves fast on contact and release, and the **paw snaps on release**.
- Slynyrd #25: travel must be equal for front and back legs, or the body "accordions". The pelvis and shoulders bob in opposite, equal motion.
- **Apply to Tengu:** Beast mobs in `mobs/wilds.js` and `meadow.js`: drive the legs from one phase with a +0.25 to +0.5 offset front versus back, with the head lagging the front pair, and the shoulder and pelvis bobs in antiphase.
- **Effort:** M.

**19. Saint11, "Wings / Flying".** Source: https://saint11.art/img/pixel-tutorials/Wings.gif
- **Wing motion alternates with body motion. Going up is much faster than going down.**
- Falling: the body drops 1 px per frame while the wings rise "fighting gravity" (3 frames).
- Flap: the body goes up fast by 3 px, then 1 px more slowly. The wings go down and almost touch each other.
- Recover: down 1 px, then stabilise, with the wings returning to open.
- Sub-pixel helps hover. Vertical bob makes it realistic. **Fast wings use fewer frames and draw several wing copies for blur.**
- **Apply to Tengu:** Flying mobs (`mobs/sky.js`) and the Tengu or seraph wings: make the body's y the *inverse* of the wing angle with an asymmetric curve (25% of the period for the downstroke, 75% for the recovery). For insects, draw 2–3 alpha wing ghosts.
- **Effort:** S.

**20. Saint11, "Slide-Roll-Dash".** Source: https://saint11.art/img/pixel-tutorials/Slide-Roll-Dash.gif
- Roll: hands on the ground → 4 spin frames → overshoot recovery → back to idle. An optional pre-ground frame adds personality.
- Lunge/dash: a **2–3 frame loop during the dash to show the wind**, a squash and stretch tween, and overshoot on recovery.
- Slide: 1 prepare frame → short loop → 2 recover frames, with dust trails and motion blur.
- **Apply to Tengu:** Dash and teleport skills, and mob charges: use a 2–3-step wind-flutter loop and an overshoot on stop.
- **Effort:** S.

**21. Slynyrd, Pixelblog 33 (Wind Effects) and Saint11 "Fabric": cloth and hair.** Sources: https://www.slynyrd.com/blog/2021/7/16/pixelblog-33-wind-effects, https://saint11.art/img/pixel-tutorials/Fabric.gif
- Waves start small at the fixed edge and **grow toward the free edge**. Example: flow points 12 px apart, 2 px per frame, a 6-frame loop.
- Hair uses the same method per lock: the main mass first, then the bangs.
- Foliage sways 1 px up-right, 1 px down, 1 px left, at 200 ms per frame, with clusters offset in sequence.
- Fabric moves in a sine wave offset in the wind's direction. Dark areas carry less detail. Move the cloth but respect the anatomy under it.
- Folds run **parallel** where tension is high and **perpendicular** where it is low, and radiate from compression points. Folds cast shadows on the fabric itself. Most fabric is soft shadows with no highlights.
- **Apply to Tengu:** Capes, sleeves, kimono hems and banners in `figure.js`, `gear.js` and `queens.js`: displace polygon edge points by `A·(d/len)·sin(ωt − k·d)`, so amplitude grows with distance `d` from the anchor. This is a phase-lagged travelling wave, not a whole-cape swing.
- **Effort:** M.

### E. Sprite design: silhouette, shape, cuteness, monsters, bosses

**22. Saint11, "Character Design 1" (silhouette).** Source: https://saint11.art/img/pixel-tutorials/Silhouette.gif
- "The silhouette is the prologue." Sketch the *animation* in silhouette so the action reads.
- **Snakes or spider shapes, long limbs and pointed edges convey danger.** Complicated, sharp shapes also do.
- Add one **strong, recognisable element** to each silhouette, such as a flat head or tank treads.
- Process: silhouette sketch → details → animate.
- **Apply to Tengu:** A per-monster silhouette checklist for `mobs/*.js`. Every species needs one signature silhouette feature (horn, shell, flat cap) that survives a black fill. Elites and bosses add pointed edges; friendly or early mobs stay round.
- **Effort:** S per mob.

**23. Saint11, "Cuteness" (matches Tengu's pastel chibi).** Source: https://saint11.art/img/pixel-tutorials/Cuteness.gif
- Face: big forehead, big eye sockets, big ears, small nose, tiny maxilla (jaw), wide head, few marks.
- Body: usually under 4 heads tall, triangular, weighted to the bottom "like a flour sack". Big head and belly, small limbs, oversized hair.
- Limbs: triangular, wider at the base, small stubby fingers.
- **Shiny dark eyes** give a strong puppy effect.
- Animating: make it extra bouncy, with lots of squash and stretch. "Everything is soft, bend the shapes. Make everything malleable."
- **Apply to Tengu:** Monster bodies in `kit.js` should widen at the base (pear and flour-sack shapes). Mob eyes should be darker with 1 bright catchlight. Increase squash amplitude on cute mobs (slimes, mushrooms) to about 1.25×0.8 per bounce.
- **Effort:** S–M.

**24. Saint11, "Fluids / Slime" (slime and goo mobs).** Source: https://saint11.art/img/pixel-tutorials/Goo.GIF
- Drips start very wide and asymmetric, and get **taller and thinner each frame**. Thicker fluid hangs longer at the base and may bounce.
- Slimy bubbles are heavy and move slowly: start wide, move slow, smooth shapes, tall and thin, open holes, create particles.
- Thick slime makes bridges and holes and resists breaking into particles. Avoid sharp corners.
- Use 4 tones: highlight, base, reflection (a light band on the shadow side) and shadow, plus a hard small specular highlight.
- **Apply to Tengu:** Slime-type mobs in `meadow.js`: add a reflected-light rim on the bottom-shadow side, one hard specular, a drip that stretches and breaks off on move or death, and a death that leaves a puddle.
- **Effort:** S–M.

**25. Monster frame budgets (MapleStory data in #1; Slynyrd #38 Metroid study).** Source: https://www.slynyrd.com/blog/2022/5/24/pixelblog-38-metroid-study
- Metroid: hit feedback is a **palette swap to the player's colours**, so no extra frames or colours are needed. Death is a single 32×32 explosion frame held for a few frames.
- Pick an animation anchor (the centre of gravity) that barely moves between frames.
- Design enemies around the player's abilities, e.g. flying and wall crawlers when the player shoots in 4 directions.
- Slynyrd #64 (2026): a robotic stiffness comes from **merging head and body into one part**, and the back legs lead the front arms by one step.
- **Apply to Tengu:**
  - Hurt flash: alternate the normal colours with a palette shifted toward the hitter's element colour, not only white. A data-driven `flash` tint already exists in `pixel.js` `blit`.
  - Golems and constructs: lock the head to the body.
- **Effort:** S.

**26. Boss sprites: scale, readable telegraphs, armour reaction.** Sources: Saint11 Defend/Impact; sprite-ai (https://www.sprite-ai.art/gallery/dragons); bugnet (https://bugnet.io/blog/readable-game-art-why-clarity-beats-detail); Shovel Knight "Breaking the NES" (https://www.yachtclubgames.com/blog/breaking-the-nes/).
- A boss can break the grid on purpose. **Player 1 tile versus boss 4 tiles** "communicates the entire fight before the health bar".
- A charging enemy should **change shape** (wind-up pose, spikes extending), not only flash a colour.
- Grayscale-audit the screen.
- Shovel Knight: bosses are single big animated sprites against dark or simple backgrounds. Sprites use 4–5 colours plus transparency (versus 3 on the NES). **Flashing replaces alpha** for invulnerability. Palette swaps are used for enemy variants and damage cycling.
- **Apply to Tengu:**
  - `mobs/bosses.js` and `queens.js`: each boss attack gets a pose-based tell. Hold the wind-up 2× longer than the mob equivalent, in a distinct silhouette.
  - Bosses take hits with small movement plus an armour shine and a long recovery (Defend card), not full knockback.
  - Palette-swap variants for elite mobs.
- **Effort:** M.

### F. Pixel-art craft for code-built sprites

**27. Saint11, "< 1 Pixel Movement" (sub-pixel) and Tiny Warrior Games.** Sources: https://saint11.art/img/pixel-tutorials/Subpixel.gif, https://tinywarriorgames.com/2019/01/04/game-development-pixel-art-sub-pixel-animation/
- **Move the interior before or after the silhouette** (the face moves, the outline stays).
- Fade colours to suggest less than 1 px of movement. Slide line-breaking points along a line. Move part of an object first.
- "Mostly move lights, avoid moving shapes." Too many colours make it blurry.
- **Apply to Tengu:** At res 3, Tengu *can* move features by 1/3 lpx, but bible rule 4 snaps anchors. Use controlled sub-steps instead: the idle bob moves the body silhouette by whole lpx while face and highlight anchors move a 1/3 lpx earlier or later (`figure.js`, `faces.js`).
- **Effort:** S.

**28. Pixel Parmesan (Jason Tammemägi): anti-aliasing, dithering, colour.** Sources: https://pixelparmesan.com/blog/anti-aliasing-fundamentals-for-pixel-artists, /dithering-for-pixel-artists, /color-theory-for-pixel-artists-its-all-relative

AA:
- Keep AA **inside** the sprite. Outer-edge AA breaks against varied backgrounds.
- Match the AA colour by *perceived value*, not by averaging hue (averaging complements gives mud).
- Longer segments take longer AA runs. Avoid parallel equal runs (banding).

Dithering:
- Avoid it on animated character sprites.

Colour:
- Midtones carry peak saturation, so shadows aren't automatically less saturated.
- Yellow peaks at high value, red at mid, blue at low.
- Use **one main colour, an accent at 10–20% coverage, and a low-contrast secondary.**
- Compress modelling to fewer steps.

- **Apply to Tengu:** In `pixel.js`, make the rasteriser's edge AA (if any) interior-only and leave the outline crisp. For ramps, saturate the base or mid tone most. Per sprite, check accent coverage is at most 20%.
- **Effort:** S–M.

**29. Saint11 "Outlines" and "Metals"; PixelJoint shine thread; cure's PixelJoint guide.** Sources: https://saint11.art/img/pixel-tutorials/Outlines.gif, https://saint11.art/img/pixel-tutorials/Metal.gif, https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=3366, https://pixeljoint.com/forum/forum_posts.asp?TID=11299

Outlines:
- **Internal borders can be lighter than the outer border.** Outline colour can reinforce the shading.
- Square pixels make sharp edges, so use 1-px points for blades, spikes and feathers.

Metal:
- Ramp: light is usually colder and less saturated, dark usually warmer and more saturated.
- Order: base, light, shadow, then **backlight and specular**, then reflection.
- Metal doesn't stretch (move its parts separately). Its highlight should animate with the angle. Use multiple parallel light and shadow lines for an easy reflection.

Shine priority (PixelJoint): **1** a tiny specular inside the main highlight on the bevel edge, **2** reflected light (a midtone) on the shadow edge, **3** irregular reflection spots. Steel highlights push to white; brass is soft.

cure's guide: sel-out only where the background is known; ramps can share their ends; avoid "eyeburn".

- **Apply to Tengu:**
  - In `weapons.js`, `gear.js` and `jobgear`, add a backlight rim on metal edges facing away from the light, and a specular that slides along the blade as the swing angle changes. This makes a cheap shine sweep on every swing.
  - In `pixel.js` `outlineFor`, interior part boundaries use a lighter line than the silhouette.
- **Effort:** M.

**30. Saint11 "Pixel Art Fundamentals 1" and "Very Low Resolution"; "Consistency".** Sources: https://saint11.art/img/pixel-tutorials/Fundamentals.gif, https://saint11.art/blog/thoughts_on_low_resolution/, https://saint11.art/blog/consistency/
- **When animating, keep track of clusters and avoid breaking clusters** between frames.
- Orphans are fine only for strong details.
- **One light plus at most one backlight.** Moving one pixel of eye or torso changes posture and expression.
- Consistency: no mixed resolutions. Rotate only by 90° (45° sometimes) or redraw. Rotating at screen resolution makes rotated squares, which is inconsistent. Fast or big sprites may rotate at native resolution. Stop sliding layers on integer coordinates. Non-diegetic icons should not use the character's pixel style.
- **Apply to Tengu:** Weapon rotation during swings is the main mixel risk. Pre-rasterise weapons at 8–16 angles at res 3 (or snap rotation to 22.5°) instead of rotating the canvas freely (`weapon-kit.js`).
- **Effort:** M.

### G. Game pipelines worth borrowing

**31. Dead Cells (Motion Twin, Thomas Vasseur): 3D → pixel.** Sources: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-, https://80.lv/articles/case-study-dead-cells-character-art-pipeline/
- Characters are about 50 px tall in-game. The 3D model is rendered tiny with **no AA** and a basic toon shader, and each frame exports a PNG plus a **normal map**.
- Animation is **pose-to-pose, with interpolation frames only before or after keys, never evenly in between**. VFX carry the speed and impact.
- Retakes move keys, not drawings. Armour is reused across monsters. The team said pixel "flicker" stayed unsolved.
- **Apply to Tengu:** Tengu's code-built sprites are already a "model → raster" pipeline, so the lessons map directly:
  - Ease into and out of keys with *held* keys (not linear tweens).
  - Snap poses to the res-3 grid every frame to reduce flicker (bible rule 4).
  - Optionally, a 2-tone normal-ish rim pass for map lights (`post.js`).
- **Effort:** M.

**32. Rain World (Joar Jakobsson): procedural puppets.** Source: https://unity.com/en/blog/exploring-procedural-design-rain-world
- Creatures are a few physics chunks (the slugcat is 2 circles at a fixed distance). Limbs and tails are cosmetic sprites puppeted in real time from those chunks, not pre-made animation sets.
- **Apply to Tengu:** Tails (Tamamo's nine), tentacles, snake and centipede mobs, and long hair as chains of verlet points following the body (the Celeste hair is also physics-based). This extends the springs in `animator.js` from scalar hair and cape values to point chains.
- **Effort:** M–L.

**33. Shovel Knight (Yacht Club Games): a "rose-tinted" constraint set.** Sources: https://www.yachtclubgames.com/blog/breaking-the-nes/, https://kotaku.com/how-a-shovel-knight-npc-gets-made-1842271950
- Keep the spirit of the limits (few colours per sprite, uncluttered screens, limited particles) and drop the ones that hurt play (flicker).
- Large sprites, 5–6 parallax layers, and diagonal shake are allowed.
- NPCs are iterated on idle pose and attitude, then **simplified to stay readable against the background**.
- **Apply to Tengu:** Adopt explicit "house limits" in the art bible: colours per sprite (for example 12 plus outline) and max particles per effect.
- **Effort:** S.

**34. Owlboy (D-Pad Studio, Simon S. Andersen): pure pixel discipline.** Sources: https://www.killscreen.com/owlboy/, https://www.gog.com/en/news/read_about_the_future_of_pixel_art_according_to_the_creators_of_owlboy
- No gradients, blur, tracing or 3D captures, and a palette as limited as possible. The only concession is rotation.
- Motion between pixel positions is suggested with sub-pixel in-between colours.
- **Apply to Tengu:** Supports keeping effects crisp (no canvas blur in `post.js`) and using colour-step sub-pixels instead of alpha fades on sprites.

**35. Blasphemous (The Game Kitchen) and Moonlighter (Digital Sun): production habits.** Sources: https://blasphemous.backerkit.com/hosted_preorders/project_updates?page=7, https://www.gameanim.com/?p=67403, https://80.lv/articles/moonlighter-building-pixel-art-preparing-for-switch/
- Blasphemous: each enemy starts as a standing pose, is pixelised, then **tested on top of several real game scenes** before animation. Roughs are black line over white. Raul Vivar makes new frames by modifying existing ones.
- Moonlighter: no dynamic lights. Light comes from layered additive sprites, and the team spent long on the hero's feel.
- **Apply to Tengu:** Add a contact-sheet test that renders each new mob on the 3–4 real map backgrounds (`scratchpad/ig/*`) before it is approved.
- **Effort:** S.

### H. Animation fundamentals and colour

**36. Richard Williams, *The Animator's Survival Kit*, spacing and easing.** Sources: https://longstories.ai/blog/complete-guide-timing-spacing-animation; the book.
- Timing is the frame count; spacing is the distance between drawings. Clustered spacing reads slow, spread spacing reads fast.
- Equal spacing looks robotic.
- **Apply to Tengu:** Every procedural motion (weapon arcs, knockback, launches, fidgets) should use eased spacing. Add one shared `ease.js` (out-quad, out-back, in-out) and lint against linear lerps in render code.
- **Effort:** S.

**37. Mark Ferrari: colour cycling (GDC 2016, "8-Bit & 8-Bitish Graphics").** Sources: https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5, https://makegamessa.com/discussion/4596/8-bit-8-bitish-graphics-gdc-presentation
- Animate water, fire, waterfalls and time of day by **rotating palette indices** on a still image, with no frames. "BlendShift" cycling fades between indices for in-betweens.
- **Apply to Tengu:**
  - Sprites: glowing runes on bosses, flowing kimono patterns, gem glints in `icons.js`, by cycling a 4–6-colour ramp along a pre-indexed stripe. It's cheap in canvas with an index map per sprite.
  - Water and waterfall props in `scenery.js` (shared with the backgrounds researcher).
- **Effort:** M.

**38. Hue-shift ramps and palettes.** Sources: https://www.gamedev.net/articles/visual-arts/color-palettes-r4964/, https://lospec.com/palette-list/tag/pastel (146 pastel palettes: Vanilla Milkshake 16, Pastel QT 7, Fairydust 8, Hydrangea 11, mulfok32).
- GameDev.net example: 9 swatches per ramp with a +20° hue step per swatch.
- Most popular Lospec palettes are about 16 colours.
- **Apply to Tengu:** Sample Vanilla Milkshake and Hydrangea 11 as pastel reference ramps when tuning `shadowTone`.
- **Effort:** S.

## 3. Reference list

- Slynyrd Pixelblog catalogue (64 posts; animation #8 #9 #25 #50 #52 #53 #60 #64; monsters #38 #57; wind #33): https://slynyrd.com/pixelblog-catalogue
- Saint11 tutorial index (about 80 GIF cards, CC-BY 4.0, 512×512): https://saint11.art/blog/pixel-art-tutorials/ — images are at https://saint11.art/img/pixel-tutorials/{Name}.gif. For sprites, read: AttackSheet, Impact-export, Death.GIF, Defend, Squash, Easings, characterIdle, Walk, RunCycleSimple, Jump, 4LegsWalk, Wings, Slide-Roll, Fabric, Goo.GIF, Metal, Outlines, Silhouette, Cuteness, Subpixel, Fundamentals, MotionBlur.
- Saint11 essays, "Consistency" and "Very Low Resolution": https://saint11.art/blog/consistency/, https://saint11.art/blog/thoughts_on_low_resolution/
- Celeste `Player.cs` (squash and stretch values, freeze and shake durations): https://github.com/NoelFB/Celeste
- MapleStory frame data via the API (player `stand1`/`walk1`/`swingO1`/`stabO1`/`swingOF`, mob framebooks): https://maplestory.io/api/GMS/83/mob/8130100
- Pixel Parmesan, on AA, dithering, colour and resolution: https://pixelparmesan.com/blog
- Pixnote animation basics (FPS per action): https://pixnote.net/en/learn/animation
- Sprite-AI animation principles timing table: https://www.sprite-ai.art/guides/animation-principles
- Tiny Warrior Games sub-pixel method: https://tinywarriorgames.com/2019/01/04/game-development-pixel-art-sub-pixel-animation/
- PixelJoint "Creating Pixel Art" (cure): https://pixeljoint.com/forum/forum_posts.asp?TID=11299. Shine and metal thread: https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=3366
- Dead Cells 3D pipeline: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-. Normal-map sprite shader code: https://github.com/Broxxar/PixelArtPipeline
- Shovel Knight "Breaking the NES": https://www.yachtclubgames.com/blog/breaking-the-nes/
- Rain World procedural design: https://unity.com/en/blog/exploring-procedural-design-rain-world
- Mark Ferrari colour cycling: https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- OpenGameArt 4-frame walk template (ping-pong 1-2-3-4-3-2, CC-BY 3.0): https://opengameart.org/content/walk-animation-template
- itch.io 3-frame idle tutorial: https://itch.io/blog/559673/pixel-art-idle-cycle-animation-tutorial
- Reference asset frame counts, for an undead enemy: idle 11, run 8, attack 9, hit 2, death 9 (https://japassou.itch.io/undead-pixel-art-enemy).
- Lospec tutorials (586 entries) and the pastel palette list: https://lospec.com/pixel-art-tutorials, https://lospec.com/palette-list/tag/pastel
- Pixel Logic (Michael Azzi), chapters 8 (Subpixeling) and 9 (Animation): https://michafrar.gumroad.com/l/pixel-logic
- SF3: 3rd Strike holds a record of 23,039 animation frames. Paid smear and squash breakdowns: https://gameanimation.gumroad.com/l/SF3

**Not found as text (video-only or paywalled):** AdamCYounis, MortMort and Brandon James Greer (YouTube only); Slynyrd's frame-timing GIF annotations (Patreon); the GDC talks for Owlboy, Rain World and Hyper Light Drifter (Vault). The Eastward, Sea of Stars and Octopath sources found only cover lighting and HD-2D at a high level (see the backgrounds researcher).
