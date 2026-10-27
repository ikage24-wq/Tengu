# Research: 2D effects and game feel (EN / JA / KO / RU)

Area: pixel and hand-drawn VFX, sakuga effect animation, hit-stop, shake, knockback, camera, UI
juice, and procedural canvas techniques. Every item is mapped to Tengu's code. I read
`render/fxkit.js`, `particles.js`, `post.js`, `effects.js` (slash/arcSmear/numbers/drops),
`spells.js` (bolt/circle), `world/melee.js`, `world/world.js` (hit resolution), `main.js` (hitstop
loop) and `scene.js` (camera).

## 0. What Tengu already has (so we don't re-suggest it)
- Cel FX kit: `needle`, `starFlash`, `shardRing`, `puff`, `crescent` smear, `crown`, `shock`, `wisp`. Effects grow fast, then thin and break up rather than alpha-fade. This is already the right philosophy, matching Saint11, Hashimoto and the VK course below.
- Hit-stop is a **global** freeze of world ticks (`main.js` 174). Values: 0.035 s on a normal combo strike, 0.07 on a finisher, 0.03 on a crit, 0.045 on a kill, 0.3 on a boss kill. Particles keep animating during it because they update in render with real dt. That is good, and it matches Toylogic's rule that the hit effect plays at normal speed while the world stops.
- Shake: `shake(fx, mag, dur)` is a sinusoid at 71/53 Hz with `(1-t)^2` falloff. It has **no direction**, **no rotation**, and a new shake simply replaces a weaker one.
- Camera: plain exponential lerp (k = 1-e^(-8dt)), no lookahead, no kick.
- Numbers: they rise 26 px in 1.1 s with a pop of `1+(0.12-t)*4`. There is no horizontal scatter, and every hit spawns in the same column (only `stack` offsets by 15 px).
- Mob hit reaction: `m.flash = 0.12` gives a white blit plus a squash of 1.14 / 0.86 and a 0.12 rad rock. Nothing **shakes the victim during hit-stop**.
- Lightning `bolt()` uses `shadowBlur` 10 (soft glow, against the no-blur cel rule), and the path re-rolls with `Math.floor(p*12)`.
- HD glow: the FX are drawn again into a 1/4-size layer and composited with `'lighter'` at 0.7. Effects cast no light on the world.

## 1. Engines and queries that worked
- **WebSearch**: worked for all four languages, but its JA/KO/RU results lean on news sites.
- **Yahoo! Japan** (`search.yahoo.co.jp/search?p=`): worked well and surfaced the Toylogic, Qiita, Wikipedia-JA and CAPCOM pages.
- **DuckDuckGo HTML** and **Yandex**: blocked by captcha. **Naver**: fetch refused.
- **Direct asset fetch**: I downloaded Saint11's tutorial GIFs (`saint11.art/img/pixel-tutorials/*.gif`) and read the last frame with ImageMagick. These are primary sources with exact text, and are the most valuable find here. Copies: `scratchpad/s11/*.png`.
- Some fetches failed: wikidocs.net (403), gamespot (403), CAPCOM column (503), Guilty Gear Xrd handout PDF (503).

## 2. Top findings

### A. Hit-stop and the hit moment

**1. Shake the victim, not the world, during hit-stop (Sakurai, Smash Bros.)**
- **Source:** Famitsu col. 490–491 (EN translation by Source Gaming) and the "Eight Hit Stop Techniques" video.
- **What it says:**
  - Attacker and defender freeze for the same time, and the defender's *sprite* vibrates while its hurtbox stays put.
  - Grounded targets vibrate **side to side**; airborne targets vibrate **up and down**.
  - The amplitude starts large and decays over the freeze length.
  - The attacker also vibrates slightly and keeps drifting very slowly instead of freezing dead.
  - The flinch pose blends into the hurt pose over about 4 frames.
  - There is a cap on the maximum freeze. Projectiles get less hit-stop; electric hits get more.
- **Tengu:** in `render/monsters.js`, while `world.hitstop > 0` and `m.flash > 0`, offset the blit by `±A·(hitstop/hitstopTotal)`, alternating sign every tick (60 Hz). Use x when `m.air <= 0` and y when airborne. Store `world.hitstopTotal` when it's set. Use A = 1 lpx on normal hits and 2–3 lpx on finishers and bosses, and nudge the hero 0.5 lpx too. Shots in `combat.js` should use about half the melee stop, and the lightning school about 1.5×.
- **Effort:** S. This is the single biggest feel win.

**2. Hit-stop budgets in frames (multiple games and guides)**

| Source | Values |
|---|---|
| gamineai pixel combat guide | light 2–4 frames @60, heavy 6–10, boss super 12–18; or a 50–70% slowdown for 4–6 frames on light jabs |
| uhiyama-lab | weak 0–0.03 s, strong 0.05–0.08, crit 0.10–0.15; stop only on the **first and last hit of a multi-hit** |
| eastondev (KO) | 0.05–0.1 s, flash 50–100 ms (30 ms invisible, 150 ms looks murky), shake light 2–3 px / heavy 8–10 px |
| Nuclear Throne (Vlambeer, via infovore) | 10–20 ms on every hit |
| Dead Cells (Motion Twin, 80.lv) | crits: **1-frame freeze, then a slowdown of a few tenths of a second**, plus a blood spray and a unique sound |
| Slap City wiki | `hitlag × (dmg×0.5 + 3)` frames, i.e. scale with damage |

- **Tengu:**
  - Tengu's 0.035 / 0.07 sit at the low end, which is correct for MMO-pace combos.
  - Add a **slow-mo tail** after finisher and crit freezes: run `world` at a time scale of 0.35 for 0.12–0.2 s. In `main.js`, accumulate `acc += dt * world.timeScale`.
  - Scale the stop with the damage ratio: `stop = base + min(0.05, dmg/maxHP × 0.1)`.
  - Never stop on the middle hits of `barrage` / multi-hit strikes.
- **Effort:** S–M.

**3. Saint11 "Impact" and "Death / Take hit" sheets (Pedro Medeiros, Celeste and TowerFall artist)**
- **Anatomy of an impact:** idle → anticipation → motion → **overshoot** → rest.
- **Exaggeration:** motion blur, smoke particles, shrapnel and debris, and things affected by gravity.
- **Cut out frames:** remove the in-betweens between rest and the target pose so the blow is faster and stronger, and cover the jump with lots of motion blur.
- **Freeze time:** "pause **one frame before** the impact; do not pause too long; only for very exaggerated impacts."
- **Take hit:**
  - The first frame is the strongest and throws the character all the way back.
  - "The impact uses only one frame; overshoot the first frame; recover slowly back to idle."
  - A **contrast frame**: a white silhouette, or a black frame, for more contrast.
  - A death **squish** that conserves mass, then an explosion.
- **Tengu:**
  - The monster recoil (`recoil` in monsters.js) currently eases linearly out of `m.flash/0.15`. Make the frame after the hit the **maximum** displacement (overshoot about 3 lpx away from the blow), then ease back with `easeOut` over 0.25 s.
  - Death: add a 1-frame **all-white silhouette** frame (and an optional 1-frame black one for bosses) before `poof`. Then squash x1.3 / y0.6 for 2 frames, conserving area, before it bursts.
  - For finishers, add a 1-tick pre-impact hold (Saint11's "one frame before") through `stopBefore` in the melee strike data.
- **Effort:** S.

**4. Contrast frame for explosions and bursts (Saint11 "Explosions", "Smoke", "Electricity")**
- **Explosion layers:** "FLASH, BLAST, FIRE, SMOKE, animated individually."
  1. A **contrast flash**: a dark circle that makes the next frames feel brighter.
  2. A **white flash**, sometimes with shrapnel or light lines.
  3. A **sharp blast** with sharp angles; avoid noise.
  4. A fade where "**fire fades quickly, smoke fades slowly**."
- At least 4 frames. "Explosion fire is like bubbles; the centre is brighter and hotter."
- Add multiple staggered explosions for an extended effect, and flying bits *after* the explosion.
- The smoke sheet resolves a tiny blast in 2 frames. "Animate one particle, go back and do another"; don't break the shape up too much or it reads as noise.
- **Tengu:**
  - `poof()` and spell impacts start straight on a star flash. Prepend a **1-tick dark-core disc** (deep palette colour, r≈0.6×size), then the white disc, then the spiky flash.
  - Split fire and smoke lifetimes: fire puffs 0.15–0.25 s, smoke puffs 0.5–0.8 s and slower.
  - Boss deaths should chain 3–5 sub-explosions offset 40–80 ms apart (Metal Slug style, see 20).
- **Effort:** S.

**5. Hit-flash duration and the photosensitivity cap (uhiyama-lab, gamineai, Hashimoto/CEDEC 2011)**
- Flash the target only, for 1–2 frames, rather than flashing the full screen.
- Reserve full-screen flashes for finishers and ultimates, and add in-between frames or darken to avoid strobing.
- **Tengu:**
  - `m.flash = 0.12` is fine, but render the white as **solid for 2 ticks, then a 50% blend for 2 ticks**, so it doesn't sit white for 7 frames.
  - Ultimates (`combat.js` 235) could get one full-screen flash of white at 0.35 alpha for 2 frames, behind the **Screen shake / Flashes** setting.
- **Effort:** S.

### B. Screen shake, camera kick and camera

**6. Trauma-based noise shake (Squirrel Eiserloh GDC 2016, "Juicing Your Cameras With Math")**
- **Model:**
  - `trauma` lives in 0..1. Each hit adds to it (0.2 light, 0.5 heavy), and it decays linearly at about 1.5/s.
  - Shake = `trauma²` (or `trauma³`) × maxOffset.
  - Sample **smooth noise** (Perlin / value noise) per axis, not random numbers, and add a **small rotation**.
  - Implementations: Bevy example and the `screen-shake` npm package, with defaults maxAngle 10°, maxOffset 30.
- **Tengu:** replace `fx.shake = {t,dur,mag}` with `fx.trauma`.
  - Hits add rather than replace, so a multi-hit barrage builds naturally and a boss slam saturates.
  - Use `offset = maxPx × trauma² × noise1D(time×25 + seed)`, with maxPx = 8 lpx, and keep `snap()`.
  - Add `ctx.rotate(maxRot × trauma² × noise)` with maxRot of about 0.6° (2D games need very little).
  - Keep the `settings.screenShake` toggle and add a 0–100% slider (dev.to "Art of screen shake": let the player decide).
- **Effort:** M.

**7. Directional kick: shake toward the blow (Vlambeer "Art of Screenshake", Nuclear Throne; DTF.ru "Camera Shake…")**
- **Nuclear Throne pistol:**
  - The camera kicks 6 px back from the aim, and 4 is added to the shake, which decays fast.
  - Gun kick of 2, with a quick snap back. On a reload, a reverse kick.
  - Muzzle flash: the bullet is a **circle on its first frame**, then the bullet shape.
  - Enemies are knocked 3 px/frame along the bullet direction.
  - Hurt is 1 white frame plus 2 big-eyed hurt frames. 10–20 ms freeze. Props give "permanence".
- **DTF (RU):** directional "ударное вращение" (impact rotation), which jerks the view along the hit direction and lerps back at angle 10° and 100°/s. Repeated calls must not break the return to rest, so drive it per frame rather than as one-off tweens. For a landing, use the direction (down + right×0.2).
- **Tengu:**
  - Add `fx.kick = {x, y}`, which decays with `k *= e^(-18dt)` and is added to the camera offset.
  - Melee finisher: kick 3–4 lpx **in the hero's facing direction**. Hero hurt: 3 lpx away from the attacker.
  - Hard landing or boss slam: 3 lpx **down**.
  - Bow `aimshot`: kick 2 lpx *back* (recoil), and draw the arrow's first frame as a white circle (muzzle flash).
- **Effort:** S.

**8. Shake guidelines (gamineai, uhiyama-lab, Toylogic, Wayline)**
- Melee shake is short and high-frequency (4–8 frames). Explosions get one slow wave plus a quick tail (10–16 frames).
- Don't shake on every combo hit; save it for finishers.
- Don't stack shake from every enemy; scope it to the player.
- If testers feel sick, drop horizontal shake first and keep vertical.
- **Tengu:**
  - Party and bot hits (`h.party`) and other players' skills should add 0 trauma.
  - Boss slam shakes should be **vertical-only**.
  - `SHAKY` skills keep their shake; combo steps 1–2 have none (already true).
- **Effort:** S.

**9. Side-scroller camera (Itay Keren, "Scroll Back", Gamasutra / Game Developer)**
- **Techniques:** camera window, platform snapping, lerp, forward focus, cue focus.
  - *Forward focus*: Defender keeps the view ~25% of the screen ahead.
  - *Dual forward focus*: Cave Story slides between two anchors by walking speed.
  - *Super Mario World* holds the current anchor until a threshold is passed, to avoid flip-flopping.
  - *Platform snapping*: Mario World and Rayman recentre vertically only on landing.
  - *Cue focus* (Insanely Twisted Shadow Planet): attractors pull the camera.
- **Tengu (`scene.js updateCamera`):**
  - Add lookahead `tx += facing × 48` lpx, eased at k = 1-e^(-3dt) so it drifts rather than snaps, held until the hero has moved 24 px the other way.
  - Vertical: only retarget y while `onGround` or on a rope (platform snap), which stops jump bob.
  - Bosses act as a cue: weight the camera 25% toward the boss when it's within 260 px.
- **Effort:** M.

**10. Boss-kill moment (Sakurai "boss stop"; Dead Cells slow-mo)**
- On the final blow, the camera zooms in and pauses dramatically.
- **Tengu:**
  - The boss kill already has hitstop 0.3. Add a 0.6 s time scale of 0.3 after it, a 1.08× zoom toward the boss (scale the world draw about its screen point and ease back), the white contrast frame, and a radial shard ring.
  - The UI should hold off showing drops until the slow-mo ends.
- **Effort:** M.

### C. Effect shape language and timing (sakuga / pixel artists)

**11. Fire (Saint11 "Fire"; Hashimoto CEDEC 2011; Gilland *Elemental Magic* ch. "Lighting a Fire")**
- **Saint11:**
  - "Drawing fire is about flow." Each wave starts brighter and at the bottom, and uses wavy shapes.
  - Start new waves every 2–3 frames.
  - **Flame speed is higher in the middle**; the wave top fades in a pointy shape; bright colours come from the bottom.
  - Simple flame = base plus particles: the base changes shape but keeps volume, and particles detach.
  - Embers flick and move slightly; sparks need only small moves.
- **Hashimoto:** a 6–8 frame flicker cycle (16 when looping), sometimes with the frame order shuffled.
- **Tengu:**
  - `flameWall()` and fire `elementStep` emit round dots that shrink (`grow:-2`).
  - Add a fxkit **`tongue(ctx, x, y, h, w, sway, rim, core)`**: a teardrop whose tip is offset by `sin(t)` sway, with a white-yellow core at the base.
  - Spawn a new tongue every 2–3 ticks; tongues accelerate mid-life and taper to a point at the top.
  - Detached ember particles use the `needle` shape pointing up.
- **Effort:** M.

**12. Smoke (VK Animation Club, RU; Saint11; Hashimoto; Dark Magic sheet)**
- **VK "Как создать анимацию взрыва":**
  - Principles: appear small → grow; **morph** (flatten, stretch, bend); **break apart** (stretch one side, thin a weak joint until it tears); **spread out** (each piece gets its own vector); then shrink to nothing.
  - Impact shockwave in about 12 frames: frame 6 is the hit; at frame 7, the peak reaction, punch **holes** that become weak joints; frames 8–12 the holes widen and the shape breaks into fragments.
  - Smoke wave in 16 frames, with wind alternating sides to make an S-curve, then "uprooting" it off the ground.
- **Saint11 Dark magic:** smoke "more fluid-like, with more connections, fades in **spirals** and slowly."
- **Hashimoto:** steam is about 10 overlapping puffs per layer, each born and dying at different times.
- **Tengu:**
  - `puff()` is a disc with a shadow crescent that shrinks. Add **hole-punching** in its last 40% of life: draw 1–3 `destination-out` circles (or circles in the background colour) inside the puff, growing until the puff splits. This gives the cel "breakup" without alpha.
  - Have puffs in the same burst share a common drift plus a per-puff curl (`vx += sin(age×4+phase)×20`).
- **Effort:** M.

**13. Lightning (Saint11 "Electricity"; Kanada style via fullfrontal.moe)**
- **Saint11:**
  - "Electric animations must be FAST." Animate on alternate frames, **adding blank frames**, and mix arcs, bolts and smoke.
  - Bolt sequence: first shock (sharp angles) → a **white or bright, different shape** → **wait one blank frame** → fade the lightning from the first frame → wait one frame → dissipate fast.
  - Sparks resolve in 3 frames. Avoid too many particles.
- **Kanada:** angular, irregular bolts; yellow against dark; red and black over yellow on the impact frame; rays converge toward the target.
- **Tengu (`spells.js bolt`):**
  - Drop `shadowBlur`, since HD glow already exists.
  - Draw a fat colour stroke, then a thin white core.
  - Re-roll the path every **2 ticks**, insert **blank ticks** (skip the draw when `floor(p×16)%5===2`), and draw the first frame all-white and 1.5× thicker.
  - The end-point gets a 3-frame spark and a dark ring.
- **Effort:** S.

**14. Light vs. dark magic shape language (Saint11 Light / Dark magic sheets)**
- **Light/holy:**
  - Analogous, bright, saturated colours. Sparks fall slowly or even go up.
  - Light from above. Particle trails "start fast then slow down."
  - Rounded or square shapes; avoid spikes and smoke. Things happen **sequentially** (rain → explosion → symbol).
- **Dark:**
  - Complementary, high-contrast colours, with a **black circle for contrast** and lighting from below.
  - Sharp shapes, overlapping animations for chaos, and faces or skulls.
- **Tengu:**
  - The holy school (`SCHOOL_COLORS`) should swap `starFlash` spikes for **rounded petals or diamonds**, add a top-down light beam, and sequence its sub-effects.
  - Dark/demonic effects add a 1-frame black disc under the burst and use `shardRing` with jagged shards.
- **Effort:** S.

**15. Timing: fast in, hold, slow out (Hashimoto CEDEC 2011; Saint11 "Easing"; VK)**
- **Hashimoto:**
  - Avoid linear in-betweens; keep the one key drawing that makes the hit read, even if it breaks physics.
  - Alternate 2- and 3-frame holds to stretch time cheaply. End on 3–4 frame holds.
  - Add a **one-frame "catch" drawing** (an offset fragment or blur) so the eye registers speed.
  - Impacts may **omit the contact frame** and show a deformation or smear instead.
  - Spark patterns A/B alternate to flicker, and he mixes two time curves in one shot.
- **Saint11 Easing:** "Sometimes I even skip the middle frame to make the movement stronger"; making a trail is good for fast movement.
- **Tengu:**
  - FX animate on smooth `p`, which reads as "tweened". Add an optional `stepped(p, fps)` quantiser in fxkit (`Math.floor(p×dur×12)/(dur×12)`, i.e. on twos at 24 fps feel) for flashes, sparks and lightning in HD mode. This gives anime-limited motion while sprites stay smooth.
  - Alternate two seeds for spark ring patterns each tick (A/B flicker).
- **Effort:** S.

**16. Slash smears (Saint11 "Motion Blur" and "Attack anim"; gamineai)**
- **Motion blur:**
  - The smear connects to the previous frame. Lighter colours "bleed" over darker ones.
  - Darker colours are used for fading. When the animation is very fast, flash **complementary colours** for a dynamic feel.
  - There are many smear styles: wedge, crescent, zig-zag, full disc, multi-blade.
- **Attack anim:** 3 attack frames plus 4 recovery frames, and **no anticipation frame on player attacks** (it feels like input lag). The last frame is a **bounce** past the start pose.
- **gamineai:** one smear per swing, a second only on charged attacks; two colours (base plus highlight).
- **Tengu (`arcSmear`):**
  - Add a darker trailing third tone at the tail end. Today it's rim plus white core, so use `shade(color)` in the last 30% of the arc.
  - On `big` blows, flash the smear **complementary** for 1 tick.
  - The hero recovery pose should overshoot 1–2 lpx (bounce). Check `render/moves.js`.
- **Effort:** S.

**17. Explosion sequencing and density (Sakurai effects videos; Hades readability; Toylogic)**
- **Sakurai:** "Effects lack physical presence and are regulated by time, so **density** is extremely important." A single orange blast isn't enough; build a sequence of steps.
- **Toylogic (NieR / Warlander):**
  - Draw hit effects **in front of** the enemy, at a constant on-screen size, and randomise the shape for consecutive hits.
  - Emphasise the *local* player's hits more than others'.
  - A very faint radial blur on heavy hits only.
- **Tengu:** in `world.js`, tag `h.party` and bot hits to spawn half-size sparks with no shock ring. Random-rotate `starFlash` (already done) and vary the spike count 4/5/6 per hit.
- **Effort:** S.

### D. Particles, light and canvas techniques

**18. Effects that light the world (Octopath Traveler, Acquire via Unreal spotlight)**
- Early Octopath combat effects "fell flat" until a **point light was added alongside each VFX**, so effects cast light and shadows on the diorama.
- **Tengu (`post.js`):**
  - Add `world.lights[]` (x, y, r, colour, life), pushed by spells, impacts, fire and lightning.
  - In HD, draw them into the small light layer as radial gradients with `'lighter'` at 0.25–0.4 before the vignette.
  - Lightning gets a 2-frame full-strength flash; fire gets a flickering radius (`r × (0.9 + 0.1·noise)`).
  - Optional: tint the ground under the hero toward the light colour.
- **Effort:** M.

**19. Normal-mapped and lit pixel backgrounds (Dead Cells, Motion Twin via 80.lv)**
- Hand-drawn pixel props get normal maps so torches light statues from the correct side.
- **Tengu:** out of scope for vector props, but a cheap version works: when a light from item 18 is near a prop, draw the prop's rim-highlight path (the auto-outline lighter edge in `pixel.js`) on the side facing the light.
- **Effort:** L (later).

**20. Hand-drawn unique explosions (Metal Slug, Nazca/SNK)**
- Every explosion is its own hand-drawn sequence, with far more frames than necessary. Hashimoto likewise draws about 3 explosion variants, then scales, flips and inverts them.
- **Tengu:** give `poof()` and impacts **3 seeded variants** each: different puff counts, spike counts and asymmetric ring offsets. Pick by `seed`, and mirror randomly. Chain sub-explosions for bosses (item 4).
- **Effort:** S.

**21. Over-animation (Dungeon Fighter Online, Neople monster team via NewsTomato, KO)**
- 2D hit feel comes from **over-animation**: a fist enlarged on impact, body parts exaggerated past real proportion. "Boldly omit what can be omitted so the user feels the hit best." The effects team adds FX after the sprite is finished.
- **Tengu:**
  - On combo finishers, scale the hero's weapon or fist sprite to 1.25× for the 2 frames around the strike `at`, through a `weaponScale` param in `hero.js` draw.
  - Monster recoil can scale the struck side.
- **Effort:** M.

**22. Bullets and projectiles (Saint11 "Bullets"; Nuclear Throne)**
- The core is warmer and brighter, the border cooler and darker.
- Dangerous bullets draw more attention (blinking is cheap). Fast bullets need little detail and are elongated in the direction of travel.
- **Muzzle flash and impact shrapnel** tell the player where the bullet starts and ends, especially if it's barely visible.
- **Tengu:**
  - Mob projectiles should blink at 8 Hz.
  - Arrows and stars in `strikes.js drawStrikeShot` add a 1-frame muzzle circle on release and a 3-needle shrapnel burst on hit or despawn, including **misses on walls** for permanence.
- **Effort:** S.

**23. Trails (Saint11 "Rocket trail")**
- Bright frame (like a small explosion) → stretched tall-thin flame → mass shifts back, with a piece thrown off → wider and shorter, darker → darker and smaller.
- **Tengu:** dash steps and `bigarrow` trails. Implement as a ring buffer of the last 6 positions drawn as a tapering `crescent`/polyline whose colour steps white → main → deep. Don't use alpha-faded copies.
- **Effort:** S.

**24. Particle budgets (eastondev KO; gamineai; Habr "VFX artist tasks", RU)**
- 20–30 particles per burst max, initial speed 200–400 px/s, life 0.5–1 s.
- Light-hit debris 3–8 px. Halve melee particles when the screen is busy.
- Habr (Gears 4 VFX): impact = light + sparks + lightning + smoke + **~0.1 s screen distortion**; dissolve particles (erosion) rather than dim them; small per-instance variations in delay and size are noticed.
- **Tengu:**
  - `MAX = 600` with `shift()` drops the *oldest* particle, which may be an important flash. Instead, drop new low-priority particles: add a `prio` field, and refuse ambient and dust when over 450.
  - Halve `sparks()` needle counts when `world.mobs` within view exceeds 6.
- **Effort:** S.

**25. Palette cycling (Mark Ferrari / Joseph Huckaby "Canvas Cycle", 80.lv)**
- Shift palette indices over time. Ferrari's "BlendShift" cross-fades between neighbouring colours for smoothness.
- **Tengu:**
  - Effects are vector, so emulate it by cycling the colour *assignment* over a ramp: `ramp[(i + floor(time×12)) % n]` for magic-circle rune ticks, loot beams, water and lava edges, and level-up rings.
  - Cheap and very "pixel" for idle shimmer on rare-item names in UI too.
- **Effort:** S.

**26. Sparkle "shine" sweep (Saint11 "Shine")**
- *Simple shine:* a white diagonal parallelogram sweeps across a bar or frame.
- *Extra shine:* the whole frame flashes white → yellow → a shrinking pill → a 1 px line.
- **Tengu:**
  - Use it on HP/MP/EXP bars when a potion is used or on level-up.
  - Use it on the item icon when rare loot lands, on new skill icons, and on the chest open.
  - Clip to the bar's rect and sweep 0.35 s.
- **Effort:** S.

### E. UI juice

**27. Damage numbers (Last Epoch and Neverwinter forums; Unity floating-text guides; MapleStory convention)**
- **Problems and fixes:**
  - Stacking in one spot: **alternate left and right** offsets rather than random.
  - Crits start higher and are bigger and yellow.
  - DoTs are smaller, grey or green, and start lower.
  - Neverwinter narrowed outgoing numbers to the upper-right quadrant and cut size 23–50% for readability.
  - Linger more than 0.25 s.
- **MapleStory:** multi-hit lines stack vertically per skill cast (already `stack`).
- **Tengu (`effects.js drawNumbers`):**
  - Add `vx` alternating ±18 px/s per spawn, with gravity giving a small arc (rise, then settle).
  - Pop: 1.6× → 1.0 with overshoot (`easeOutBack`) over 0.12 s.
  - Crits get a 1-frame white fill before the orange.
  - Totals: when ≥3 hits from one cast land on the same mob within 0.3 s, show a big summed number above them.
  - Party and bot damage is drawn at 70% size and 60% alpha.
- **Effort:** S–M.

**28. Feedback ordering (eastondev, KO)**
- Sound and haptics land on the same frame; the flash +20 ms; particles +50 ms; floating text +100 ms.
- Feedback must appear within 100 ms of input.
- **Tengu:**
  - Numbers currently appear on the same tick as the spark. Delay the number by 2 ticks so the eye reads impact, then value.
  - Presses are already buffered.
- **Effort:** S.

**29. Loot, chest and level-up juice (Saint11 Light magic "sequential"; general)**
- Make these into sequences:
  - **Drop:** pop up with a spin and a 1-frame white silhouette, bounce twice (restitution 0.4), *then* the rarity beam rises (0.2 s grow) with palette-cycled motes.
  - **Pickup:** the icon flies to the inventory button along a curve while shrinking, and the inventory icon bumps 1.2×.
  - **Level-up:** a ground ring (shock) → a rising column → the "LEVEL UP" letters drop in one by one (40 ms apart) with overshoot → a sparkle shine sweep → bars refill with a shine.
- **Tengu:** `drops.js` (spawn arc), `effects.js drawDrops/lootBeam`, the UI layer.
- **Effort:** M.

## 3. Reference list
- Saint11 (Pedro Medeiros) tutorials index — https://saint11.art/blog/pixel-art-tutorials/ ; GIFs at `https://saint11.art/img/pixel-tutorials/{Explosion,Impact-export,Fire,SmokeSheet,Electric,LightMagic,DarkMagic,Death,MotionBlur,Easings,AttackSheet,Bullets,RocketTrail,Shine,Ice}.gif` (EN). These are the core 2D VFX rules; local copies are in `scratchpad/s11/`.
- Sakurai hit-stop column, EN translation — https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/ (EN/JA). Victim shake axis and decay.
- Sakurai's eight hit-stop techniques — https://nintendowire.com/news/2022/12/12/this-week-in-sakurai-12-5-12-11-fine-tuning-hit-stop-and-cheating-the-system/ ; video https://www.youtube.com/watch?v=tycbMSjDDLg
- ヒットストップ, Wikipedia-JA — https://ja.wikipedia.org/wiki/ヒットストップ (JA). Smash: 4-frame hurt blend; projectiles less, electric more.
- Toylogic, ヒット演出10選 — https://blog.toylogic.co.jp/planner/4111.html (summary https://gamemakers.jp/article/2024_02_13_60648/) (JA). The effect plays at 1× during the stop; draw it in front; constant size.
- Qiita hit-stop in Unity — https://qiita.com/flankids/items/75dd457463918f48b70f (JA). 0.23 s stop; shake the target (0.15, 25 vibrato); jump to 20% into the damage clip.
- GIGAZINE on 橋本敬史 CEDEC 2011 anime effects — https://www.gigazine.net/news/20111019_anime_effect_cedec2011/ (JA). Fire cycles, 2/3 holds, catch frames, A/B sparks.
- CLIP STUDIO explosion drawing — https://www.clipstudio.net/oekaki/archives/168095 (JA). Explosion colour hexes (#511900/#FFC21C base, #FFF5DA add).
- 井上俊之「エフェクト」book (water / fire-explosion-smoke) — https://kai-you.net/article/78584 (JA). Flip-book reference to buy.
- eastondev 게임 피드백 수치 — https://eastondev.com/blog/ko/posts/dev/20260521-game-feedback-feel/ (KO). Flash, shake, particle and ordering numbers.
- 2D 슈팅 타격감 실험 (KoreaScience) — https://www.koreascience.or.kr/article/JAKO201017337332989.page (KO). Effects on the *target* matter more than on the projectile; sound and vibration rank above visuals.
- Neople (Dungeon Fighter) monster team, over-animation — https://newstomato.com/ReadNews.aspx?no=981403 (KO)
- VK Animation Club, Как создать анимацию взрыва — https://m.vk.ru/@animationclubvk-kak-sozdat-animaciu-vzryva (RU). Appear / morph / break / spread; 12- and 16-frame breakdowns.
- DTF, Camera Shake или как передать ощущения игры — https://dtf.ru/130309-camera-shake-ili-kak-peredat-oshusheniya-igry (RU). Directional impact rotation.
- Habr, Основные задачи художников визуальных эффектов — https://habr.com/en/articles/331604 (RU). Anticipation, impact, dissipation, erosion.
- Habr, 2D particles in Unity (Finseth) — https://habr.com/ru/articles/349778/ (RU). Distance emission and stretched particles for streaks.
- Nuclear Throne breakdown of Vlambeer's talk — https://infovore.org/tag/feel/ (EN). Exact kick, shake and freeze numbers.
- Eiserloh camera-math talk — https://www.gamedeveloper.com/programming/video-sprucing-up-cameras-with-math ; Bevy implementation https://bevy.org/examples/camera/2d-screen-shake/ (EN)
- Itay Keren, Scroll Back — https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers (EN)
- Dead Cells interview — https://80.lv/articles/interview-with-the-developers-of-dead-cells (EN). 1-frame crit freeze plus slow-mo; normal-mapped pixel art.
- Octopath HD-2D, Unreal spotlight — https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true (EN/JA/KO). Point light per effect.
- Pixel combat FX timing guide — https://gamineai.com/blog/pixel-art-combat-fx-hitstop-smear-frames-impact-timing-2026 (EN)
- Unity hit-feedback primer and pitfalls — https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/ (EN)
- Kanada effects analysis — https://fullfrontal.moe/?p=1106 and https://animetudes.com/2021/07/21/yoshinori-kanada-and-the-nature-of-animation/ (EN). Angular bolts, triangle smoke, colour-driven fire.
- Canvas Cycle / BlendShift (Ferrari, Huckaby) — https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5 (EN)
- Floating combat text feedback — https://forum.lastepoch.com/t/floating-combat-text-placement-emphasis-duration-speed-length-custom-elements/22864 (EN)
- Guilty Gear Xrd GDC 2015 (limited animation, anime smoke) — https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The (EN). Treat every frame as a key pose, with no in-between tweening.
- *Elemental Magic* vol. 1–2 (Gilland), *Animator's Survival Kit* (Williams; timing/spacing, ones vs twos), *アニメーションのエフェクト作画テクニック* (玄光社), *エフェクト作画探究ノート* (Born Digital). Books to buy rather than web sources.

## 4. Suggested order of work (all S unless noted)
1. Victim shake during hit-stop (1) and the overshoot recoil plus contrast frame (3, 4).
2. Directional camera kick (7) and trauma noise shake (6, M).
3. Lightning re-time with blank frames (13), and A/B stepped timing for sparks (15).
4. Damage-number scatter, overshoot pop, delay and totals (27, 28).
5. Effect lights in post.js (18, M); camera lookahead (9, M); boss-kill slow-mo (10).
6. Fire tongues and smoke hole-breakup (11, 12, M); loot, level-up and shine sequences (26, 29).

## 5. HD effect packs we can ship (CC0), and how they're played
The player rejected both code-drawn gradient effects and pixel-art effect packs: effects must be
smooth HD art. These are free packs whose license (CC0) allows shipping the files in the game:
- Brackeys VFX Bundle — https://brackeysgames.itch.io/brackeys-vfx-bundle (EN). Kenney and
  Picster's white particle textures with alpha (spotlights, stars, ray bursts, rings, magic
  circles, traces, twirls, slashes, dirt) and Thomas Iché's flipbooks (fire, flame, explosion
  smoke, wispy smoke). Its "predrawn" folder is CodeManu's pixel pack (not used).
- Kenney Particle Pack and Smoke Particle Assets — https://opengameart.org/content/particle-pack-80-sprites,
  https://opengameart.org/content/smoke-particle-assets (EN). The same textures; white puffs.
- Sinestesia on OpenGameArt — hit flashes at 1024 px a frame (https://opengameart.org/node/80085,
  https://opengameart.org/node/84746), blood and hit bursts (https://opengameart.org/node/81933),
  explosions at 512 px a frame (https://opengameart.org/node/74923) (EN).
- Cethiel, Weapon Slash - Effect — https://opengameart.org/content/weapon-slash-effect (EN).
  Glowing crescents, thrusts and slash lines in four colours, small frames (126x150).
- MetaShinryu's Slash Effect Collection (CC0) is flat grey vector shapes, too plain to use.
How they're played: a flipbook plays as is; a texture is coloured like light (deep colour at its
thin edges, white where dense) and animated as a particle system would (grow fast then settle,
turn, fade). On light pastel maps additive blending only suits white and cold colours (red goes
pink, gold goes white), so warm effects draw normally; dark rendered smoke reads as dirt there
and is lifted pale.

## 6. MapleStory's warrior effects, frame by frame (the target look)
Source: MapleStory Classic World skill animations hosted by meowdb (e.g.
https://meowdb.com/msclassic/skills/white-knight/charged-blow; animations at
`/msclassic/skill-anim/<id>-cast.gif`: Power Strike 1001001, Slash Blast 1001002, Coma 1111002,
Armor Crash 1111004, Shout 1111003, Charged Blow 1211000, Fire/Ice/Lightning Charge 1211001-3,
Elemental Crash 1211004, Threaten 1201004, Piercing Crusher 1311000, Dragon Fury 1311001, Dragon
Roar 1311002, Power Crash 1311003, Hyper Body 1311005, Power Guard 1111005). Studied, not shipped.
What makes them read:
- **The hit lands on the monster as its own big shape**, not a puff: Power Strike is a gold
  star-burst at the hero, then a red X of two crossing slashes over the target, white-hot at the
  core with a red glow; Slash Blast cuts a red V; Coma strikes three blue-white lightning slashes.
  Each is bigger than the monster's head and lasts 4-6 frames.
- **Big skills show a symbol**: Shout is a cyan spectral lion roaring out of a white burst;
  Dragon Roar is a magenta magic circle with a dragon's head inside; Piercing Crusher is a huge
  blue dragon wing and a lance of light; Threaten is a black ghost; Power Guard a stone tablet
  outlined in gold. One recognisable picture per skill.
- **Buffs are a pillar of coloured light from the ground with an emblem inside** (a shield, a
  cross, a lightning gem), the pillar thinning out and dissolving into falling sparkles (Armor
  Crash, Elemental Crash, Power Crash). Elemental charges wrap a crescent swoosh round the body,
  then a tall flame of the element rises through it.
- **Shapes are crisp with a white core, a saturated body and a soft glow**; saturated enough to
  read on bright maps. Effects run 2-3 times the hero's height. Everything ends by breaking into
  sparkles, never by a plain fade.
- Jason Tom Lee's slash tutorial (https://jasontomlee.itch.io/slashfx/devlog/629732/tutorial-2-slash-shape-fundamentals):
  a slash is one clean curve shaped like a flag, wide at the leading head and tapering to the
  trailing end; it follows the weapon's arc; the full shape is the climax and shows for only 1-2
  frames; stray pixels ruin it. (His SlashFX pack says CC BY 4.0 but also "you may not
  redistribute", so it can't ship in our files.)
- Emblems we can ship: game-icons.net (https://game-icons.net, CC BY 3.0, credit each author;
  some CC0): lion, dragon heads, griffin, holy symbol, shields, angel wings, skulls, crossed
  swords. Rendered as glowing emblems (white core, coloured body, soft glow), they give skills
  MapleStory's "one picture per skill" read.

## 7. Better effect packs (searched again; all shippable)
- jellyfish0, Sprite Effects parts 1-2 (CC0) — https://opengameart.org/content/sprite-effects-part-1,
  https://opengameart.org/content/sprite-effects-part-2 (EN). About 98 smooth painted effects in
  1024 px frames: crescent sword swipes that sweep round (50e-50j), a spin slash, claw slashes,
  pillars of light, a golden magic circle, hex and orb shields, vortices, shockwave rings,
  speed streaks. The closest free match to MapleStory / Dungeon Fighter. No fire or blood.
- Inguz Media, 2DFX Impact Spritesheets (CC BY 4.0) — https://opengameart.org/content/2dfx-impact-spritesheets.
  Rendered impact bursts, 64 frames of 1024 px.
- Raja_Kutai, Slash (CC0) — https://opengameart.org/content/slash-0. A slash streak turning into
  an anime white-yellow star burst with a bubble and red droplets: a crit.
- Pavel Kutejnikov, Auras (CC0) — https://opengameart.org/content/auras. Looping ring auras
  (fire, blue, purple), 60 frames.
- Also CC0 and usable: System G6 RPG VFX Pack (https://opengameart.org/content/rpg-vfx-pack), para's
  Animated Particle Effects 2, rubberduck's 25 Blender effects, Sam's FREE 2D VFX PACK (itch.io,
  toon dust and blood).
- Can't ship (their terms forbid redistributing the files): Pipoya's packs, jasontomlee's Slash
  FX and Blood FX, Cartoon Coffee, CraftPix, unTied Games.

## 8. The style the player picked (18 samples)
Samples of one swing, one hit and one buff were shown in 18 styles: pastel glow, bold anime
(black ink), neon lines, ink brush, pixel, storybook stickers, crystal, candy, manga, watercolour,
paper ribbon, crayon, matched-to-sprites, kawaii, bubbles, petals, clouds, jewels. The player
picked **matched to the sprites**: pastel shapes redrawn at the characters' pixel size with the
sprites' own outline rule. Lesson: effects must look like they were drawn by the same hand as the
characters; style mismatch, not just quality, is what made earlier effects feel wrong.

## 9. The first jobs remade (Warrior: Valor; Archer: Hawk)
- MapleStory gives each first job a few big readable shapes rather than many small ones, and the
  finisher-level moments are a single giant object (a giant blade or a great bird) more than a
  spray of particles: for example the Hero's and Kaiser's giant swords and the Bowmaster's
  Phoenix (a great bird that flies out and strikes), all in the job's own colours. We followed
  that: Titan Breaker is one giant steel sword that forms over the leap and is driven into the
  ground; Falcon Dive is one great falcon that dives through the line.
- A bird read as a bird only once it had a round head with a white cheek, a hooked beak in the
  accent colour, a plump body, and wings whose back edge breaks into separate long feathers;
  straight wing slabs read as a jet. Wingbeat in four drawings (up, mid, down, mid) is enough at
  12 fps.
- A finisher's big object must land a little ahead of the hero, not on top of them, or the hero
  disappears behind it at the key moment.
- Colour: a job's colour needs a second accent when its main hue is shared (the Archer's gold vs
  the Paladin's gold): the accent (sky blue) on every hit and trail is what says whose hit it is.
- The Thief followed MapleStory's first-job Rogue: one book for both weapons, Double Stab for the
  dagger and Lucky Seven for the claw, so the player picks a side with their points before the
  2nd-job split (Assassin with claws, Bandit with daggers). Her shapes are the night's: smoke,
  crescent moons, a full moon; a shadow copy of the hero (like the later Shadow Partner) reads
  instantly as "full power" without any new effect art.
- The Thief's 2nd jobs follow MapleStory's split: a dagger Assassin (Bandit/Shadower side:
  stealth, backstabs, marks) and a gauntlet Night Lord (Assassin/Night Lord side: star storms,
  Shadow Stars, Triple Throw, Showdown). Each finisher is again one big object: a red moon with
  crows, a giant constellation.

