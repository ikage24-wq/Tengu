# Russian-language research: pixel art, animation, FX, game feel, backgrounds, UI

Researcher: RU sources. All findings come from pages I opened, unless marked "(snippet)".

## 1. Engines and queries that worked

- **Yandex** (yandex.ru/search) returned a SmartCaptcha every time. **DuckDuckGo HTML** returned a bot challenge. **Bing** with Cyrillic queries returned junk (Avito and Microsoft pages). **Mojeek** returned 403. Raw curl to the engines was refused by the sandbox (bot-check rule).
- **What worked:** WebSearch with Russian queries, restricted with `allowed_domains` to habr.com, dtf.ru, pikabu.ru, youtube.com, skillbox.ru and similar sites. Then WebFetch on the articles themselves.
- **Partly blocked:** Several Habr pages return 403, including the "Курс пиксель-арта" parts 1, 5 and 6 (a translation of Les Forges: 241666, 243775, 245751). For those I only have snippets.
- **Inaccessible:** vk.com/vk.ru is blocked for the search agent, but one VK article (m.vk.ru) did open.
- **Productive queries:** «Галоп пикселя», «пиксель-арт анимация спрайтов», «хитстоп», «12 принципов анимации в разработке видеоигр», «постмортем пиксельная игра», «теплохолодность», «несекретные материалы», «2D магия в деталях», «эффекты в четырёх стихиях», «Tanks A Lot эффекты», «Skullgirls аниматор».

## 2. Top findings

Each finding is tagged: **[area] Game/artist: technique (numbers)**. The source, its language (RU, or RU translation), how it applies to Tengu, and the effort (S/M/L) follow.

### A. Game feel, hit-stop, shake, camera

1. **[feel] Monster Hunter series: hit-stop length per game, measured from video.**
   - Generations Ultimate / Rise: about 0.25 s on the Great Sword overhead chop. World: about 0.2 s. Wilds beta: none, and players said attacks "lost expression".
   - The research paper cited in the hitstop search results puts the best hit-stop at 0.1–0.2 s and slow-mo at 0.2–0.4 s for 3D action.
   - Source: https://shazoo.ru/2024/11/05/161406/... (RU)
   - **Tengu:** our values are tiny. `melee.js` uses 0.035 s for normal hits and 0.07 s for finishers, `world.js` uses 0.03 s for crits and 0.3 s for bosses. Proposed tiers:
     - light jab: 0.03–0.05 s (keep)
     - finisher: 0.09–0.12 s
     - heavy or charged skill: 0.15–0.2 s
     - boss kill: 0.3 s plus slow-mo
   - Effort: S. Tune `stop` per strike in `data/skills.js`.

2. **[feel] Skullgirls (Mariel Cartwright talk, Smirnov School summary): energetic animation rules.**
   - A whole attack fits in 4 frames: anticipation, smear, key pose, return.
   - A single anticipation frame (a snake opening its mouth before biting) is enough to read.
   - Shifting one frame of timing makes a punch noticeably snappier.
   - The fall animation went from 21 frames to about 15, with longer holds on key poses and fewer in-betweens.
   - Overshoot: the limb passes the key pose and snaps back like a pendulum, and on a hit it extends slightly into the target.
   - The player's anticipation is shorter than the enemy's, so the player feels responsive and still has time to react to enemies.
   - Hit-stop scales with attack strength. Quote: "You won't make a damn good game without hitstop."
   - Source: https://dtf.ru/gamedev/175323-kak-delat-energichnuyu-animaciyu-sovety-i-tehniki-ot-animatora-skullgirls (RU)
   - **Tengu:**
     - Every `combo` step should use a 4-pose structure: anticipation pose → smear (fxkit arc) → key pose held → return. `at` belongs on the smear-to-key transition.
     - Hero anticipation: 1–2 frames (≈50–80 ms).
     - Mob telegraphs: 3–5× longer (250–400 ms), with a visible wind-up.
     - Add a 1–2 lpx overshoot on the key pose of finishers.
   - Effort: M.

3. **[feel] Celeste (DTF breakdown of the GMTK video).**
   - The dash has a 4-frame freeze, a small screen shake, a trail of afterimages plus a white streak, dust on landing, and hair that turns blue when the dash is spent.
   - Spike hitboxes are smaller than the art. A jump pressed slightly early is buffered.
   - Source: https://dtf.ru/gamedev/62418-platforming-v-gorah-pochemu-v-celeste-takaya-priyatnaya-sistema-upravleniya (RU)
   - **Tengu:**
     - Dash, teleport and blink skills (the `combat.js` vanish/dash) should get a 4-frame (≈66 ms) freeze at the start, an afterimage trail (3–4 ghost copies at 60/40/20 % alpha) and a 1-px shake.
     - Use a colour-state cue on the hero (hair or aura tint) for "skill ready / MP low".
     - Make monster contact hitboxes 2–3 lpx smaller than the sprite.
   - Effort: S–M.

4. **[feel] Asteroids demo, "11 Шагов к Сочности" (Maxim Pylev, DTF): a juice checklist in order.**
   - The 11 steps: shadow/outline, particles, camera shake, sound, scale everything up, hit-stop, screen flash, flame/trail, recoil (camera moves opposite the shot and the shooter is pushed back), projectile trail, score.
   - Source: https://dtf.ru/gamedev/102442-11-shagov-k-sochnosti (RU)
   - **Tengu:**
     - Scale-up: explosions as big as the target.
     - Recoil: the camera kicks 1–2 px opposite to big ranged casts, and the hero slides back 2–4 lpx.
     - Screen flash: a full-screen 1–2 frame flash only on ultimates.
   - Effort: S.

5. **[feel/camera] UNIGINE talk transcript (Habr): camera shake and smoothing formulas.**
   - Random shake: offset ±strength, multiplied by a cubic ease-in of (1 − t), so it decays to zero.
   - Sine sway: amplitude A and frequency f, with the vertical axis at A/2 and 2f, giving a figure-8.
   - Perlin "handheld": noise only while idle.
   - Frame-independent lerp: `k = 1 − exp(−rate·dt)`.
   - Time-to-settle: `rate = ln(range/ε)/duration`.
   - Give the player a shake-intensity setting.
   - Source: https://habr.com/ru/companies/unigine/articles/695608/ (RU)
   - **Tengu:**
     - Check that the `juice` shake in `post.js`/`main.js` decays with (1−t)³ rather than linearly.
     - Switch the camera follow to the exp form.
     - Add a "Screen shake: off/low/full" option next to `hitStop` in `ui/options.js`.
   - Effort: S.

6. **[camera] Itay Keren's "Scroll Back" (Habr translation 272933).**
   - Techniques: camera window or dead zone, with the height of a normal jump as in Rastan; platform snapping (the camera moves vertically only on landing, as in Super Mario World); lerp smoothing; dual-forward look-ahead (Cave Story); speed ramp 0→1→2→3 px/frame (Pac-Land); Super Mario Bros. push zone at about 25 % from centre.
   - Source: https://habr.com/ru/articles/272933/ (RU translation)
   - **Tengu:**
     - Vertical platform-snap: don't follow jumps; ease to the new ground height on landing.
     - Horizontal look-ahead of about 40–60 lpx in the facing direction, eased.
   - Effort: M.

7. **[feel] King, Witch and Dragon devlog (DTF): hit reaction.**
   - Player control is lost for 0.5 s, followed by 1.5 s of invulnerability with white flashing.
   - Two hurt animations: hit from the front and hit from behind.
   - Source: https://dtf.ru/indie/238054-king-witch-and-dragon-devlog-9 (RU)
   - **Tengu:**
     - Hero hurt: 0.3–0.5 s stagger, 1–1.5 s i-frames with 2-frame on/off blink.
     - Mobs: a separate "hit from behind" pose (pitch forward instead of back).
   - Effort: S.

8. **[feel] Silent Hill f review (DTF): hit-stop must not stack per target.**
   - Its hit-stop plays separately on each enemy hit, so multi-target swings stall absurdly.
   - Source: https://dtf.ru/games/4102986-obzor-silent-hill-f... (RU, via snippet)
   - **Tengu:** `world.hitstop = max(...)` is already correct (it doesn't add up). Keep it max-based for AoE skills that hit 10+ mobs.
   - Effort: none, just guard it in tests.

9. **[feel] Monster Hunter / New Frame Plus (DTF "Тайминг"): timing references in 60 fps frames.**
   - Street Fighter: one of Ryu's hits is 3 frames (1/20 s). Dark Souls basic sword: 30 frames. Super Smash Bros. Cloud swing: 48 frames.
   - Long recovery equals risk. Slow timing reads as big.
   - Source: https://dtf.ru/gamedev/52571-taiming-kak-v-igrah-rabotaet-odin-iz-klyuchevyh-principov-animacii (RU, after Dan Floyd)
   - **Tengu:**
     - Hero basic attacks: 8–14 frames (130–230 ms).
     - Big skills: 24–40 frames.
     - Bosses: wind-ups of 40–60 frames, to sell size.
   - Effort: S (data tuning).

### B. Animation

10. **[anim] «Галоп пикселя» V and VI, Weilard (Andrey Lyapichev), Habr: walk and run from 2 to 8 frames.**
    - The key pose is maximum leg spread ("contact").
    - Colour-swap legs: same silhouette, swap near (light) and far (dark) colours to get the other step for free. Mirror half the cycle.
    - Body bob of 1 px: lower at full stride, higher at passing.
    - Secondary parts (hair, hem, bag strap, cap visor) move in counter-phase with 1-px offsets and lag one frame.
    - 8-frame run: arms may be asymmetric, but legs stay "like pistons" so the character doesn't limp. Offset the far arm by 1 px so mirrored frames aren't identical.
    - Animated highlights keep their shape and change brightness instead of position.
    - Refine horizontal motion first, then add the vertical bounce.
    - Move cast shadows at most 1 px per frame.
    - Sources: https://habr.com/ru/post/441562/ and https://habr.com/ru/articles/772588/ (RU)
    - **Tengu (fixes art-bible §1.8, Tamamo slides):**
      - In `animator.js`/`figure.js` walk, give each frame a vertical bob (−1/0/+1 lpx).
      - Add a far-leg darker tint swap.
      - Hair, tails and hem should sample the body pose from 1 frame earlier (lag), with 1–2 lpx counter-phase.
      - Running: lean the torso 1–2 lpx forward and swing the arms asymmetrically.
    - Effort: M.

11. **[anim] «Галоп пикселя» III, Weilard: ball and idle physics.**
    - The ball bounce uses 8 frames.
    - Squash on contact frames, stretch vertically on the rise, and a hang time at the apex.
    - Rule: "if a pixel left somewhere, it must arrive somewhere", so volume is preserved.
    - Shift per frame no more than 1–2 px.
    - Dust peaks on the frame right after impact.
    - Shadow opacity changes no more than 5 % per frame, and shadow size shows height.
    - Idle: belly breathe, then compensate with the head, then the sleeves and hair.
    - Source: https://habr.com/ru/post/275703 (RU)
    - **Tengu:**
      - Slimes and mushrooms: squash and stretch that keeps area constant (sx·sy = 1).
      - Blob ground shadows scale with jump height.
      - The landing-dust puff spawns on the frame after touchdown.
    - Effort: S.

12. **[anim] Sergio Flores (lunarlabs), Habr translation 444738: idle and sub-pixel.**
    - Idle: shift the lower half down 1 px and let hair, hat and nose lag up.
    - Sub-pixel motion: change shading colours instead of moving pixels.
    - Cluster rule: a pixel touches at most 2 same-colour neighbours.
    - Source: https://habr.com/ru/post/444738/ (RU translation)
    - **Tengu:** for the breathing idle, move only the torso and head 1/3 lpx (1 real px) with lag on hair. Faces should not move (keep the anchors snapped, per art-bible §A4).
    - Effort: S.

13. **[anim] Different Sense Games RPG (DTF 294631): a 10-frame run and a weighted attack.**
    - The run uses 10 frames, judged smoother than 8 and cheaper than 16.
    - The backpack lags one frame; hair moves more than the backpack.
    - Attack: slow start, a spike of speed, an abrupt stop on impact, the sword keeps travelling for a few frames, then a slow return with a slide of a few px.
    - Source: https://dtf.ru/294631-sozdanie-piksel-art-animacii (RU)
    - **Tengu:** the strike curve in `melee.js` should ease-in sharply to the hit, then follow through with the weapon continuing 2–3 frames past contact. Add a 2–4 lpx slide on the recovery.
    - Effort: S.

14. **[anim] Blasphemous, animator Andrey Gogia (DTF 102918 and 789862).**
    - Process: keyframes in pencil, then line, then colour, then in-betweens drawn directly in pixels.
    - Attack phases (windup, action, recovery) are tuned by about 0.1 s for gameplay. Some attacks skip the windup for responsiveness.
    - Insert a slower frame or a short pause mid-attack so the cape and flowing cloth can be read.
    - Prioritise the animations seen most: run and idle (Alucard's run in Symphony of the Night).
    - Every colour must survive all frames, so be "greedy" with colours.
    - Sources: https://dtf.ru/gamedev/102918-hudozhnik-blasphemous-o-piksel-arte and https://dtf.ru/id385049/789862-14-sovetov-ot-hudozhnika-i-animatora-blasphemous (RU)
    - **Tengu:**
      - Polish order: walk/idle of every job first, then skills.
      - Add a 1-frame hold at the key pose in long skills so trailing cloth and hair settle visibly.
    - Effort: M.

15. **[anim] Jonathan Cooper, *Game Anim*, ch. "12 principles" (Habr translation 451534).**
    - Anticipation trade-off: too short and the move loses weight; too long and it feels sluggish. Enemy telegraphs are long; big damage justifies a longer windup.
    - Fast start and slow settle for weapons (ease-out on swings).
    - Hold strong poses during follow-through, but expose a cancel frame. Avoid perfect arcs on repeats.
    - Exaggeration stays consistent project-wide: the uppercut launches the target higher so it reads from far away.
    - Source: https://habr.com/ru/articles/451534/ (RU translation)
    - **Tengu:** this matches CLAUDE.md's `skillReadyAt`/`recoverAt`. Make sure `recoverAt` (walk-cancel) begins at the hold's start, not its end. Uppercut finishers: launch 1.5× higher than physically plausible.
    - Effort: S.

16. **[anim] Sword-and-pistols combo (DTF 6941).**
    - Hold each pose 5 frames, then transition in 4.
    - Anticipation hint 1–2 frames before with a hand or head lead.
    - Smear frames where an object covers a large distance in few frames. Bounce plus damped settle on landing.
    - The silhouette must read the action.
    - Source: https://dtf.ru/gamedev/6941-mech-i-pistolety-animirovanie-kombo-ataki (RU)
    - **Tengu:** combo steps get a rhythm of about 5 frames hold and 4 frames transition. The head leads 1 frame.
    - Effort: S.

17. **[anim] Garage (Zombie Dynamics, DevGAMM, DTF 8201).**
    - About 5 frames per leg step.
    - Pelvis drives the walk; hips and shoulders counter-rotate.
    - Body split into upper, middle and lower "containers"; any part can run its own animation over the main one (a hand grab of 4 frames). Code tweens the in-betweens.
    - Frame-by-frame for small things, containers for interactive parts. Guilty Gear's 15 fps look is cited.
    - Source: https://dtf.ru/gamedev/8201-s-vysoty-ptichego-poleta-2d-animaciya-i-ispolzovanie-graficheskih-effektov (RU)
    - **Tengu:** our code-built figures are already "containers". Add a per-part override layer, so a cast-hand or face expression plays over walk. Consider stepping limb poses at 12–15 fps while root motion stays at 60, which avoids the floaty "tweened" look.
    - Effort: M.

18. **[anim] Luno modular sprites (Habr translation 468991).**
    - Every body, clothing and hair part sits on its own layer with a shared pivot (0.5, 0).
    - 26 animations for one outfit set. Palette swapping by a shader colour array (hair and skin chosen at runtime).
    - Source: https://habr.com/ru/articles/468991/ (RU translation)
    - **Tengu:** equipment and hair recolours should go through palette indices in `pixel.js` rather than separate draws.
    - Effort: M.

### C. Effects (VFX)

19. **[fx] Animation Club VK: the 5-stage effect grammar and an explosion timeline.**
    - The stages: appear (small, then grow), morph, break apart (thin a weak joint), spread out, disappear (shrink, never fade only).
    - Impact effect (12 frames): 1–5 fall and stretch; 6 impact, spreading outward; 7 peak with holes punched in as weak points; 8–12 holes widen, the shape fragments, and the pieces fly out and shrink.
    - Smoke wave (11 frames): curl up, split into upper and lower parts, keep splitting, shrink away.
    - Second smoke (16 frames): alternate the wind direction every frame or two for an S-curve, detach from the ground at frame 11.
    - Source: https://m.vk.ru/@animationclubvk-kak-sozdat-animaciu-vzryva (RU)
    - **Tengu:** in `fxkit.js`/`effects.js`, burst and impact effects should
      - end by shrinking and fragmenting rather than alpha-fading;
      - punch "holes" into rings and flashes at peak (an arc with a gap pattern);
      - break smoke puffs into 2–3 children that drift and shrink.
    - Effort: M.

20. **[fx] Tanks A Lot (DTF tutorial): effect layering recipe.**
    - Shots and hits: 2–3 systems. Projectiles: 2–4. Explosions: 4–5 (core, flash with sparks and shock ring, smoke ring, ground decal, debris with trailing smoke).
    - Smoke starts red-tinted (lit by the fire) and goes darker and transparent.
    - The glow is largest late and strongest early.
    - Flame particles peak in size mid-life, then become sparks and ash.
    - Random start rotation 0–360°, and ranges rather than fixed values everywhere.
    - Ice spikes: scale Y only, pop up fast, fade slow.
    - Avoid sudden appear or disappear. Big and mid shapes carry the effect; small ones are accents.
    - Source: https://dtf.ru/highcore/690831-uchimsya-delat-vizualnye-effekty-podrobnyi-tutorial-ot-razrabotchikov-tanks-a-lot (RU)
    - **Tengu:** use a fixed 4-layer template for every skill hit in `strikes.js`/`spells.js`: flash (1–2 frames), shape (arc, ring or spike), sparks (6–12, random rotation), lingering smoke or dust tinted by the element. Ice skills scale on Y only.
    - Effort: M.

21. **[fx] Hollow Knight (DTF 80980): effects carry the animation.**
    - Crystal Heart uses only 4 hero frames. Charge, peak and release read differently purely through effects: growing ground crystals, wind, then a flash, hero blink, pulsing aura and heavy shake, then a burst and air trail. On the stop, the wind keeps going past the hero.
    - Damage taken: black-and-white splashes covering a large screen area.
    - Source: https://dtf.ru/gamedev/80980-znachimost-vizualnyh-effektov-v-animacii-na-primere-hollow-knight (RU)
    - **Tengu:**
      - Charged and ultimate skills: build the charge with ground particles and aura growth, not more hero frames.
      - On release, keep the wind and trail particles moving after the hero stops.
      - Hero damage taken gets a strong 2-tone splash, which is distinct from mob-hit fx.
    - Effort: M.

22. **[fx] Match-3 effects review (Habr 715286): Royal Match, Small Town, Gardenscapes.**
    - Anticipation swell before boosters fire.
    - Sequence rays, then vortex, then stars, with the projectile landing on the star-burst peak.
    - Debris travels about 1 cell; the shockwave reaches about 2.5 cells; smoke reaches about 1 cell.
    - Staged break-up in 1–4 stages. A dark or muted backdrop is required for glow to read; light boards wash it out. Small Town adds a purple backing behind smoke.
    - Too many simultaneous trails make a "sandwich" mess.
    - Source: https://habr.com/ru/articles/715286/ (RU)
    - **Tengu (important):** our maps are very light pastel (see `ig/new-woods.png`), so additive glow washes out.
      - Give bright fx a dark or saturated backing: a 1-px dark rim, or a darker-hue under-shape behind the flash.
      - Cap concurrent trails per skill.
      - Swell the caster or projectile 1.1–1.2× for 2 frames before release.
    - Effort: S–M.

23. **[fx] Norland (Habr 737464 / DTF): elemental effects.**
    - Fire: few particles plus a scrolling Perlin "fire" texture rising bottom to top, then darken and dissolve the burnt object.
    - Water: caustic overlay with scrolling displacement.
    - Ground: Perlin threshold with smoothstep(0.5 ± 0.02) for 3-colour grass patches, to hide tiling.
    - Five time-of-day LUTs blended 33:66.
    - Source: https://habr.com/ru/articles/737464/ (RU)
    - **Tengu:**
      - Burn and death dissolve for mobs: darken, then a noise-threshold dissolve upward, quantised to 1-lpx cells to stay pixel.
      - `terrain.js` could break grass-top repetition with a noise threshold.
      - `post.js` could blend tint LUT-style for time of day.
    - Effort: M.

24. **[fx] Gunpowder on The Teeth: Arcade, Ruslan Eliseev (DTF 26240): effect discipline and reactive scenery.**
    - Rules: everything sits on the pixel grid, no semi-transparency, and effect colours must come from the main palette.
    - Trees and grass sway when an explosion happens: play the sway frames from a start frame down to 0, with the start frame chosen by distance (a close blast starts at frame 10).
    - 20 fighters × about 50 animations × 3–15 frames each.
    - Source: https://dtf.ru/gamedev/26240-takoi-prostoi-no-slozhnyi-piksel-art (RU)
    - **Tengu:**
      - Scenery reacts to big hits: grass and flowers in `scenery.js` get an impulse with amplitude ∝ 1/distance that decays.
      - Pick fx colours from each element's ramp (no free RGB).
    - Effort: S–M.

25. **[fx/light] «Галоп пикселя» IV, Weilard: light animation.**
    - Light planes are flat overlays at about 47 % opacity, animated over 4, then 6 frames at 0.5 s per frame.
    - Rim light is 1 px on edges away from the camera.
    - Moving highlight masks run about 9 frames.
    - Reduce shadow opacity on the first and last frames to hide the loop seam.
    - Effects "work best when unnoticed".
    - Source: https://habr.com/ru/articles/318678/ (RU)
    - **Tengu:** `post.js` lighting overlays (god rays, lamp light) loop at about 0.5 s per frame with an opacity ease at the seam. Give skill-lit heroes a 1-px rim on the side facing the effect.
    - Effort: S.

### D. Sprite art, colour, materials (general pixel art)

26. **[art] "Как рисовать пиксель-арт: программы, пайплайн, советы" (DTF 1257126).**
    - Outline types: 1-px black; 2–3 px "enhanced" only to separate from the background; colour line (darker of the fill); area line; selout (lighter on the lit side, darker and more saturated on the shadow side); broken line (gaps soften without AA).
    - AA length is 1/2–2/3 of the step it smooths, with at most 3 AA shades.
    - Steps must be consistent: after a run of 3 comes 2 or 4.
    - Don't stack more than 3 darker shades.
    - Neutral tones on large areas, saturated colour for accents.
    - Source: https://dtf.ru/gamedev/1257126-kak-risovat-piksel-art-programmy-paiplain-sovety (RU)
    - **Tengu:** the outline pass could use "broken line" gaps on the lit top edge of large monsters; this pairs with selout. Saturated accents go only at the focal points (eyes, weapon tip).
    - Effort: S.

27. **[art] Derek Yu "Pixel Art for Beginners" plus "Fixing Common Mistakes" (Habr 482536 and 485704, Playgendary; also DTF 121713).**
    - Light from the upper left.
    - Check the work by flipping it and by desaturating it.
    - Banding demo: hundreds of shades → 9 → 2 + dither.
    - Clumsy-pixel rule: never draw limbs or protrusions 1 px thick; only outlines are 1 px.
    - Avoid pillow shading; build forms from 3D primitives (a treetop is a few spheres).
    - Too many similar colours, plus low contrast, plus over-shading all hurt readability. Remove shading and raise contrast.
    - Sources: https://habr.com/ru/companies/playgendary/articles/482536/ and https://habr.com/ru/companies/playgendary/articles/485704/ (RU translations)
    - **Tengu:** for treants and bushes (see the woods screenshot), shade the canopy as 3–5 sphere clusters, each with its own light side, not one flat blob with dots. Add a desaturate-check to the screenshot review script.
    - Effort: S.

28. **[art] «Галоп пикселя» I and II, Weilard.**
    - Pass order: silhouette (2 colours) → light/shadow → AA → second pass (highlights, dither, colour balance).
    - AA goes only on selected contour points, never the full perimeter (otherwise you get a "pop" rim). AA thin elements like wires most.
    - Line "pipe" rule: each segment is no longer than the previous one, with a ≤1 px rise.
    - Tonal perspective: nearer objects get more contrast and saturation; far layers lower opacity toward the sky colour.
    - Light comes from a lamp as a backlight plus a cold reflected fill.
    - Pixel skeleton of 10 bones; a muscle group is 2–3 px at 320×200; an arm 2–3 px thick needs no muscle detail.
    - Sources: https://habr.com/ru/articles/247333/ and https://habr.com/ru/articles/261987/ (RU)
    - **Tengu:** add a cold 1-px reflected rim on the shadow side of heroes (sky bounce) and a warm key on top. AA should run only on long diagonal runs of the silhouette, not the whole outline.
    - Effort: S.

29. **[colour] DTF "Все о теплохолодности" (167116).**
    - "Warm light, cool shadow" is a guideline, not a law.
    - Shadow colour comes from the secondary sources: blue sky, warm ground bounce. Surfaces facing up catch more warm bounce.
    - Temperature is relative to neighbours. A 50 % saturation colour looks brighter next to 25 % than next to 75 %.
    - Source: https://dtf.ru/gamedev/167116-vse-o-teploholodnosti-ili-kakogo-cveta-budut-teni-svet-i-refleksy (RU)
    - **Tengu:**
      - Per-map shadow tint: woods get a green-blue shadow, harbour blue, cave warm purple, all fed from the map palette into cel shading.
      - Under-chin and under-belly planes get a warm ground-bounce tint on grassy or sandy maps.
    - Effort: S–M.

30. **[colour] DTF 4816152 and DTF 5263513: palette budget and rules for small sprites.**
    - Use 4–6 (or 4–8) colours per sprite: base, shadow, mid, light, plus 1–2 details. Shadow = base, darker and slightly cooler.
    - Chibi head = 1/3 to 1/2 of the height.
    - On 16×16, skip AA (it blurs the shape); the smaller the sprite, the less AA.
    - Avoid dithering in animation because it flickers.
    - Lines go 1:1, 2:1, 3:1; curves go 3:1 → 2:1 → 1:1.
    - Error list: jaggies, orphans, banding that follows the outline instead of the form, doubles at corners.
    - Sources: https://dtf.ru/indie/4816152-piksel-art-dlya-pervoy-igry-sovety-i-instrumenty and https://dtf.ru/flood/5263513-kak-osvoit-piksel-art-s-nulya (RU)
    - **Tengu:** confirms art-bible §A1–A5. Add "no dither on animated parts" and the "banding follows outline" check to the bible.
    - Effort: S.

31. **[materials] DTF "Несекретные материалы" (248151).**
    - Iron: matte, ragged transitions, dark dents with lit edges, rust as a few desaturated orange strokes.
    - Steel: lighter and smoother, sharper reflections.
    - Gold: smooth gradients, *saturated* highlights, strong reflected light, blurred environment reflection. Weak highlights make gold read as bronze.
    - Fresnel: grazing angles brighten.
    - Gems: the darkest area is *near* the light; the cast shadow is coloured by the gem; each facet is its own flat value.
    - Stone: blue-grey base outdoors, light on fracture edges, irregular silhouette.
    - Wood: grey-brown when aged, grain lines and cracks with lit edges; varnished wood gets more contrast.
    - Leaves: backlit leaves shift toward the light colour; edge-on leaves go almost white.
    - Source: https://dtf.ru/gamedev/248151-nesekretnye-materialy-ili-kak-risovat-metally-organiku-kamen (RU)
    - **Tengu:** use these for `weapons.js`/`gear.js` metal ramps (gold highlight = saturated yellow-white, not plain white), gem sockets on staves (inverted gem shading), and treant bark and leaf rims in `mobs`.
    - Effort: M.

32. **[art] DTF "Как рисовать блики правильно" (1140657): highlight logic.**
    - Highlights land only on planes that reflect the light into the eye, by type: a single plane (forehead), a ridge (a band along an edge) or a multi-plane point (nose tip, eyes).
    - Eye catchlights overlap both the sclera and the iris.
    - Highlights differ in brightness: the one under the nose is dimmer than the one on the forehead.
    - Source: https://dtf.ru/gamedev/1140657-kak-risovat-bliki-pravilno-a-ne-stavit-ih-naugad (RU)
    - **Tengu:** in the face code, put the eye catchlight on the iris/sclera border on the light side, the same side for both eyes. Hair gets a "ridge" highlight band (the anime crown band from art-bible §1.6). Add one small nose or cheek point only on large portraits.
    - Effort: S.

33. **[art] The Siege and the Sandfox (Habr translation 430754): hand-painted normal maps.**
    - 32×32 tiles; light from the top and slightly right.
    - Paint normals as hard planes (an octagonal barrel), not smooth gradients. Auto-generated normals looked worse.
    - Two 2k maps covered the world; about 3 person-months of work.
    - Lights only light surfaces, without casting shadows.
    - Source: https://habr.com/ru/articles/430754/ (RU translation)
    - **Tengu:** since sprites are built from vector shapes, each shape could carry a facing tag (up/left/right). A dynamic light (a torch or a fire skill) then brightens the facing planes: cheap "normal-map" lighting for skill flashes.
    - Effort: L (optional).

34. **[art] Pixel-art basics (Pikabu 8946388; Nikita Solo interview, DTF 653560).**
    - Pikabu: stairs should decrease smoothly, like 6>3>2>1; a pattern like 3>1<3 makes a bump. Use 3 tones per base colour.
    - Nikita Solo: place clusters first, then single pixels.
    - Nikita Solo recommends Pixel Grimoire (Pedro Medeiros) in order, and lists Waneela, Gustavo Viselner, 6vcr, Franek, Kenze Wee and .aj as references.
    - Sources: https://pikabu.ru/story/osnovyi_risovaniya_piksel_arta_8946388 and https://dtf.ru/gamedev/653560-pixel-artist-intervyu-s-nikita-solo (RU)
    - Effort: n/a (reference).

35. **[art] "Влияние ЭЛТ на пиксель-арт" (Habr 1085786).**
    - 16-bit artists relied on CRT blur. Modern flat-screen art should *use* AA and dithering deliberately, not avoid them.
    - Ruff'n'Tumble (Amiga) is cited as AA good enough to look smooth on LCD.
    - Real CRTs aren't reproduced by filters, so don't add fake CRT shaders.
    - Source: https://habr.com/ru/articles/1085786/ (RU)
    - **Tengu:** supports our res-3 AA edges. Skip any scanline filter.
    - Effort: none.

### E. Backgrounds, parallax, lighting

36. **[maps] Gunpowder on The Teeth (DTF 26240): value-ordered palette by depth.**
    - One 12-step ramp, from white to black at even steps, made from a 50/50 green/sand mix.
    - Sky plus 4 backdrop layers use the first 4–5 (lightest) colours, with nearer layers darker.
    - The back plane (grass and trees behind the hero) uses the last 4–5 (darkest).
    - The playfield uses mid colours. Characters may use all of them.
    - Source: https://dtf.ru/gamedev/26240-takoi-prostoi-no-slozhnyi-piksel-art (RU)
    - **Tengu:** in `ig/new-woods.png` the hills, sky and ground are all mid-light pastels and compete with the heroes. Define a per-map value ladder:
      - far hills: lightest and least saturated, 2 values
      - mid trees: one step darker
      - walkable terrain: a clear value break, plus a darker 1–2 lpx top edge
      - characters: the full range, including the darkest
    - Effort: M.

37. **[maps] Hollow Knight (DTF 41932) and "Композиция в левел-дизайне" (DTF 4571480).**
    - Many background layers fade into fog toward the back.
    - Walkable surfaces always contrast in tone with the background and carry a texture pattern, which signals "you can stand here".
    - Background: no bright colours, no hard lines, little detail.
    - Darkening foreground objects raises perceived depth.
    - Warm foreground against a cool background.
    - Sources: https://dtf.ru/gamedev/41932-vysokaya-estetika-sovety-nachinayushim-2d-hudozhnikam and https://dtf.ru/gamedev/4571480-kompozitsiya-v-level-dizayne-osnovy-i-sovety-dlya-razrabotchikov (RU)
    - **Tengu:**
      - `scenery.js`: add an optional dark, blurred-silhouette foreground layer (leaves, grass) at a parallax of about 1.3, at the bottom of the screen, for depth.
      - Fade back layers toward the sky colour (fog).
      - Mute colour on decor that isn't walkable.
    - Effort: M.

38. **[maps] Garage (DTF 8201): depth for a top-down view.**
    - Shadows give weight. Darken the floor level.
    - Light collidable objects so they pop forward.
    - Move ceiling pipes to a foreground parallax layer.
    - Generate particles from non-pixel textures, then *pixelate* them so they match the art.
    - **Tengu:** particles in `particles.js` should be snapped to the 1-lpx grid and quantised to the palette. Bright, rim-lit edges on platforms separate them from the background.
    - Effort: S.

39. **[maps/light] "2D магия в деталях" I–IV (Habr 305252 and others).**
    - Three light types: point, sun, and sky-ambient.
    - Render lights to a low-res light map; soft shadows via a distance-weighted blur.
    - HDR ratio of about 10 so lights can over-expose dark stone. God rays are added where the stencil is empty.
    - Source: https://habr.com/ru/articles/305252/ (RU)
    - **Tengu:** in `post.js`, a low-res (1/3 or 1/6) light buffer composited additively for dungeons and night maps, allowing over-bright glow on skills.
    - Effort: L.

40. **[maps] Loop Hero (Four Quarters; DTF/Igromania interviews).**
    - The art style was dictated by the team (artist Dmitry Karimov), and the art and sound are kept in harmony.
    - Neighbouring tiles visibly transform when combined: 9 mountains become a peak.
    - Few art specifics were published in Russian.
    - Source: https://dtf.ru/gamedev/660318-... (RU)
    - **Tengu:** the transferable idea is set-piece props that change when grouped. Low priority.

### F. UI and icons

41. **[UI] DTF "Показываю, как делаю интерфейсы" / "работаю над ошибками GUI"; Habr NieR:Automata UI (340610).**
    - A bar can switch to numbers when the resource is low.
    - Use discrete icons (hearts) for small counts.
    - Limit the UI palette and carry information through weight and saturation of type.
    - Bitmap fonts must hit exact pixels.
    - Sources: https://dtf.ru/gamedev/2040216-pokazyvayu-kak-rabotayu-nad-oshibkami-gui and https://habr.com/ru/articles/340610/ (RU)
    - **Tengu:**
      - HP/MP bars flash and pulse below 25 %.
      - Damage numbers use a weight hierarchy: crit gets bigger, bolder and more saturated; normal hits are smaller.
      - Snap HUD text to integer px.
    - Effort: S.

42. **[UI] Royal Match / Hearthstone (Habr 715286; DTF "Идеальный HUD"): feedback for every action.**
    - Every click gets visual and audio feedback; boosters swell before firing.
    - **Tengu:** skill-bar slots do a 1.15× pop and a white flash when the skill fires, and a short shake when there isn't enough MP.
    - Effort: S.

### G. Pipeline and production lessons (Russian postmortems)

43. **[process] Children of Morta postmortem (DTF translation 277781).**
    - Pixel art was assumed to be the cheap option, but detailed animated sprites ate the schedule.
    - Lighting and post-processing are what unified the look.
    - **Tengu:** spend on the lighting/post (`post.js`) layer, which lifts every asset at once, before redrawing assets one by one.

44. **[process] Katana ZERO art (DTF 1720090).**
    - Several artists with different styles were unified by post-processing lighting and VFX.
    - Earlier backgrounds served as style references for later ones.
    - **Tengu:** same lesson. A shared post pass plus a palette ladder (finding 36) unifies the maps.

45. **[process] Matchday (Sports.ru, DTF 983088).**
    - 3,275 characters were assembled in code from three parameters: skin, hair and kit colour.
    - **Tengu:** this confirms the code-built-sprite approach. Use palette indices for NPC variety.

## 3. Reference list

**Tutorial series (RU, original)**
- https://habr.com/ru/articles/247333/: «Галоп пикселя» I. Basics, pass order, line "pipe" rule, AA placement.
- https://habr.com/ru/articles/261987/: II. Tonal and aerial perspective, 32-colour scene budget, pixel anatomy.
- https://habr.com/ru/post/275703: III. Ball bounce (8 frames), squash and stretch, dust, shadows ≤5 % per frame.
- https://habr.com/ru/articles/318678/: IV. Light animation, 47 % overlays, 0.5 s per frame, 9-frame highlight sweeps.
- https://habr.com/ru/post/441562/: V. Walks with 2, 3 and 4 frames, colour swapping, 1-px bob.
- https://habr.com/ru/articles/772588/: VI. Runs with 2, 3, 4 and 8 frames, piston legs, asymmetric arms.
- https://dtf.ru/craft/1479184-...: Weilard's video series: torch, candle and campfire animation in Aseprite.
- https://dtf.ru/gamedev/1257126-...: pipeline, outline types, AA ratio, jaggies.
- https://dtf.ru/flood/5263513-...: canvas progression, chibi ratios, line ratios, error checklist.
- https://dtf.ru/indie/4816152-...: 4–6 colours per sprite, hue-shift rule, Aseprite tips.
- https://dtf.ru/gamedev/248151-...: material rendering (metals, gems, stone, wood, leaves).
- https://dtf.ru/gamedev/167116-...: colour temperature of light, shadow and reflected light.
- https://dtf.ru/gamedev/1140657-...: highlight placement logic.
- https://habr.com/ru/articles/1085786/: CRT and pixel art; use AA and dither deliberately.
- https://pikabu.ru/story/osnovyi_risovaniya_piksel_arta_8946388: line step rules. (The Pikabu "учусь рисовать в pixel art" series is a beginner journal.)

**Translations into Russian**
- https://habr.com/ru/post/444738/: Sergio Flores, "From doodle to asset" (10 steps, idle, sub-pixel).
- https://habr.com/ru/companies/playgendary/articles/482536/ and https://habr.com/ru/companies/playgendary/articles/485704/: Derek Yu's beginner tutorial and common mistakes.
- https://habr.com/ru/post/241666/ (Les Forges course, parts 2–8: 241764, 242925, 243775, 245751): **403 for me**. Part 6 covers AA in 3 cases (snippet).
- https://habr.com/ru/articles/451534/: Jonathan Cooper, "12 principles" applied to games.
- https://habr.com/ru/articles/272933/: Itay Keren, cameras in side-scrollers.
- https://habr.com/ru/articles/468991/: modular sprite characters and palette swaps.
- https://habr.com/ru/articles/430754/: hand-painted normal maps (The Siege and the Sandfox).
- https://habr.com/ru/articles/465479/: low-res render target and point filtering (the article says Celeste scales up from 320×200; render-target size 300–600).

**Game feel and FX**
- https://dtf.ru/gamedev/175323-...: Skullgirls energetic animation and hit-stop.
- https://dtf.ru/gamedev/52571-...: timing in frames (Street Fighter 3 f, Dark Souls 30 f, Smash 48 f).
- https://dtf.ru/gamedev/6941-...: combo hold and transition rhythm, smears.
- https://dtf.ru/gamedev/102442-11-shagov-k-sochnosti: an 11-step juice checklist.
- https://dtf.ru/gamedev/62418-...: Celeste dash freeze (4 frames), trails, buffered input.
- https://shazoo.ru/2024/11/05/161406/...: Monster Hunter hit-stop of 0.2–0.25 s, and what happens when it is removed.
- https://habr.com/ru/companies/unigine/articles/695608/: shake and smoothing formulas.
- https://m.vk.ru/@animationclubvk-kak-sozdat-animaciu-vzryva: frame-by-frame explosion and smoke (12/11/16 frames).
- https://dtf.ru/highcore/690831-...: VFX layering (Tanks A Lot).
- https://dtf.ru/gamedev/80980-...: Hollow Knight, fx over 4 frames.
- https://habr.com/ru/articles/715286/: match-3 effects, glow versus a light background.
- https://habr.com/ru/articles/737464/: Norland fire, water and grass shaders, LUT time of day.
- https://dtf.ru/indie/238054-...: hit-stun of 0.5 s and i-frames of 1.5 s.

**Game art interviews and postmortems**
- https://dtf.ru/gamedev/102918-..., https://dtf.ru/id385049/789862-... and https://dtf.ru/gamedev/108844-...: Blasphemous animator and background artist.
- https://dtf.ru/gamedev/26240-...: Gunpowder on The Teeth (palette ladder, reactive foliage).
- https://dtf.ru/gamedev/8201-...: Garage, with parallax, sprite containers and pixelated particles.
- https://dtf.ru/294631-...: 10-frame run and attack weighting.
- https://dtf.ru/games/1720090-...: Katana ZERO art process.
- https://dtf.ru/gamedev/277781-...: Children of Morta postmortem.
- https://habr.com/ru/companies/first/articles/737468/: 2.5D in Dead Cells, Carrion, Rain World and Heroes of Might and Magic (Dead Cells uses low-poly cel-shaded 3D rendered low-res; 2–3 frame sprite props).
- https://dtf.ru/gamedev/653560-...: Nikita Solo, pixel artist interview.
- https://dtf.ru/gamedev/660318-...: Loop Hero authors.
