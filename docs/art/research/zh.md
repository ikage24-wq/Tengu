# Chinese-language research: pixel art, animation, effects, game feel, maps, UI (Simplified + Traditional)

Researcher area: Chinese sources (mainland plus Taiwan/HK). Every finding names its source and, where one applies, the game.
Many popular Chinese pixel tutorials are translations of Western authors (Saint11, Slynyrd, Pixel
Parmesan, Pedro Medeiros), and they are flagged as such. The original Chinese material is strongest
on 打击感 (hit feel), VFX rhythm (特效节奏), combat presentation, and skill-icon/UI practice.

## 1. Engines and queries: what worked

- **Bilibili APIs (best Chinese source).** The `api.bilibili.com/x/web-interface/search/type`
  endpoint (search_type=article and video) returned ranked results for every query, e.g. 打击感, 顿帧,
  像素 特效 教程, 像素 色板, Saint11 像素宝典, 受击 动作 设计, 死亡细胞 美术, 空洞骑士 打击感, DNF 打击感.
  Article bodies come from `x/article/view`, but after about 5 fetches it rate-limited hard (-509).
  I fetched slowly in the background and stopped there; I did not work around the limit. Video pages
  and descriptions are JS-only or near-empty, so videos are listed as references only.
- **WebSearch (Chinese queries)** found GameRes 游资网, 机核 gcores, 163.com, Sohu, TapTap, Zcool
  and 腾讯游戏学堂 pages. WebFetch worked on gameres.com, gcores.com, 163.com, sohu.com, taptap.cn,
  zcool.com.cn, gameinstitute.qq.com, news.qq.com, juxia.com and wiki.biligame.com.
- **Blocked or unusable:** zhihu.com (403), indienova (403), CSDN (521), ithome 鐵人賽 (403),
  gamelook and gamerboom (503), udn blog (403). Bing CN and www.bing.com served unrelated junk for
  every CJK query (airline and network-protocol pages). DuckDuckGo showed a captcha. Sogou sent me to
  an antispider page, and Baidu returned an empty stub. Taiwanese sources (Bahamut, Medium zh-TW)
  barely surfaced through any engine; the few Traditional-Chinese hits were course listings.

## 2. Top findings (technique, numbers, source, how it applies to Tengu, effort)

### A. Hit feel (打击感), hit-stop (顿帧) and screen shake

1. **Hit-stop budgets per weapon class, at 60 fps** (GameRes, "写实动作游戏打击感个人实践与经验总结",
   https://www.gameres.com/901202502.html, zh).
   - Dagger and other quick bursts: 0 frames. Long blades and polearms: 0–2. Fists: about 3.
     Melee overall: 1–6. Ranged: 0, at most 2. Guard-break: longer.
   - Both attacker and target freeze. Reset time dilation on cancel or death.
   - Fire the hit 1–2 frames after the strongest pose for heavy blows, so the freeze never comes
     before the visible contact.
   - Knockback should follow a curve: big force early, decay in the middle, ease out at the end.
     Constant speed reads as sliding.
   - Set the hit-reaction blend-in to 0. The first hit frame must be a clearly deformed pose.

   *Tengu:* `world/melee.js` already sets light 0.035 s (about 2 f), finisher 0.07 s (about 4 f) and
   heavy 0.09–0.1 s. Bring dagger and claw flurries down to 0–1 frame. Keep bow `stop` at 0.03 or less
   except on finishers. Make `knock` an ease-out curve (for example v·(1−t)²) instead of a linear
   decay. Effort: S.

2. **DNF vs Naruto Mobile, measured** (GameRes, "游戏的打击感从何而来？以DNF、火影忍者手游为例",
   https://www.gameres.com/896158.html, zh).
   - **Dungeon Fighter:** single-hit hit-stop of only about 1–2 frames, because many monsters get hit
     at once and pauses would stack. Shake is mostly horizontal or vertical and used sparingly;
     vertical shake marks heavy monsters. Team play limits shake.
   - **Naruto Mobile:** 3–4 frames of hit-stop, frequent front-to-back shake, and quiet victim cries
     that play only on big hits.

   *Tengu (MMO-like, mob-heavy, MapleStory lineage):* when one strike hits 3 or more targets, do not
   add per-target hit-stop. Clamp to one global stop of 0.035 s or less, and keep the larger stop for
   the finisher only. Use vertical shake only for heavy or boss impacts and horizontal for normal
   heavies. Effort: S.

3. **Sakurai's eight hit-stop rules** (Bilibili cv20755711, a summary of Masahiro Sakurai's YouTube
   lesson, zh; game: Smash Bros.). Hit-stop is not a pure freeze; the victim vibrates.
   1. The victim shakes more than the attacker.
   2. The victim's hurtbox does not move with the shake.
   3. A grounded victim shakes left-right only; an airborne one shakes in all directions.
   4. The shake amplitude decays over the stop.
   5. Stop length scales with power and weapon.
   6. Insert the hit-reaction pose during the stop.
   7. Give the attacker a held "strike" pose detail during the stop.
   8. Scale the amplitude by camera distance.

   *Tengu:* `render/scene.js:115` jolts struck monsters by ±0.6–2 px at a fixed amplitude. Make it decay
   as `amp*(hitstop/stopTotal)`. Shake on X only when the monster is grounded and on X+Y when it is
   launched. Hold the hero's strike pose (`render/moves.js`) frozen on the strike frame while
   `world.hitstop > 0`. Effort: S.

4. **Fighting-game hit-stop numbers** (gcores 111322, zh):
   - Street Fighter 4: attacker freezes 14 f, defender 16 f, so the defender is held 2 f longer.
     (gcores 167815 gives SF5 values of 8, 12 and 15 f for light, medium and heavy.)
   - Skullgirls (Mariel Cartwright): 1–2 frames of anticipation can still sell strength. Pair longer
     anticipation with longer hit-stop to read as "heavy".

   *Tengu:* hold the monster 1–2 frames longer than the hero, for example
   `mob.stopUntil = now + stop + 0.03`, so the hero's next swing starts while the victim is still
   reeling. That keeps the weave snappy. Effort: S.

5. **Global vs local freeze** (Bilibili cv34785994 "游戏中怎么实现打击感（打击感拆解）", zh; games: Monster
   Hunter, Hollow Knight, Sifu, Nier).
   - A global freeze (the whole screen stops) is for moments the player must notice, such as Hollow
     Knight's freeze when you take damage. Multiplayer games can't use it, because everyone's heavies
     would stack.
   - Other tools listed: a black-and-white flash on super moves (Dragon Ball Sparking Zero), shake as
     a camera impulse, a 2B-style inertia follow-through, and weapon-weight anticipation and recovery.
     Nier's light swords have short wind-up and recovery; its heavy swords long.

   *Tengu:* keep the global `world.hitstop` for the local player's own hits and for damage taken.
   Party and bot hits (`world/bots.js`, `party.js`) should only flash or jolt their own target, with no
   global stop. Add a 1–2 frame inverted or white screen flash only for ultimates (`combat.js:242`
   already shakes). Effort: S–M.

6. **Combat presentation numbers** (gcores 202329 "浅谈游戏战斗设计——战斗表现", zh; games: Elden Ring,
   Wuthering Waves, Zenless Zone Zero).
   - Elden Ring greatsword: about 0.7 s wind-up, 0.2 s strike, 0.6 s recovery.
   - Hit-stop of 0.05–0.08 s is typical. Over 0.10 s is for very heavy blows only, and 0.12 s already
     feels choppy.
   - Hit VFX should be about 1.2× the size of the attack VFX and shorter-lived.
   - Wuthering Waves offsets the hit spark about 0.5 m above the contact point so it isn't hidden.
   - Zenless Zone Zero lights the enemy's side with a light source instead of a flat white flash,
     slows the victim and attacker, but keeps the hit VFX at full speed.
   - Shake rhythm: "tap-tap-tap-BOOM", about 30% less amplitude on non-finishers. Never shake on a whiff.
   - Saturation budget: auxiliary FX at 70% opacity or less, background saturation 30% or less, VFX
     saturation above the environment's.

   *Tengu:* cap `stop` at 0.1 (the current 0.1 is the ceiling) and turn any longer moment into slowmo,
   as already done. Check that `combat.js:243` SHAKY skills don't shake when nothing is hit. Keep
   particle hit sparks running during hit-stop: only actors freeze, while `particles.js` keeps
   advancing. Draw hit sparks at 1.2× the slash flash, offset toward the camera or up 4–6 lpx. Effort: S.

7. **Street Fighter: Duel dev notes** (TapTap dev diary, https://www.taptap.cn/moment/15201622904803036,
   zh).
   - Every hit point has its own light, medium or heavy hit-stop and shake setting, and its own spark
     type (punch, kick or blade) and orientation.
   - They raised hit-reaction amplitude and cut the frames it takes to reach maximum displacement.
   - They shortened transition frames and kept hit and impact frames.

   *Tengu:* add a `spark: 'blunt'|'cut'|'pierce'` field on combo strikes (`data/skills.js`) to pick
   the spark shape in `strikes.js`. Victims should reach full knockback lean within 1 frame. Effort: S–M.

8. **Celeste dash freeze, frame data** (BWiki translation of TASVideos,
   https://wiki.biligame.com/celeste/高级技巧, zh; game: Celeste).
   - The dash is 14 f: the first 4 f freeze the player, and the level and timer also freeze for 3 f.
     Then 10 f at speed 240, ending at 160.
   - Coyote time 5 f, jump buffer 5 f, variable jump held up to 12 f.

   *Tengu:* give dash and teleport skills (`combat.js` vanish/dash) a 3-frame (0.05 s) freeze before
   the burst. Check that the movement code's coyote time and jump buffer are about 5 f (0.083 s).
   Effort: S.

### B. VFX rhythm, slashes and hit sparks

9. **Three-phase VFX rhythm: charge, burst, dissipate** (several Chinese VFX notes; numbers as quoted
   by gcores 202329 and CSDN "高级游戏特效制作之节奏篇", zh).
   - Charge 0.5–2 s, moving outside-in, accelerating and shrinking.
   - Burst 0.1–0.3 s.
   - Dissipate 1–3 s with decelerating speed. Dissipation must last at least 3× the burst (burst
     0.1 s means dissipation 0.3 s or more).
   - Scale and bursts use fast-then-slow easing. Absorb or "gain energy" effects use slow-then-fast.
   - Colour and alpha follow the same curve.

   *Tengu:* audit `fxkit.js` and `spells.js` lifetimes. Many effects probably fade linearly with
   equal in and out times. Use alpha `(1−t)^2` for dissipation, scale `easeOutCubic` for bursts, and a
   `≥3×` tail rule. Effort: M.

10. **Pixel attack VFX frame allocation** (163.com "2026像素画角色攻击特效教程",
    https://www.163.com/dy/article/KV5HLU7J0526K8VB.html, zh; games: Katana Zero, Blasphemous, Gestalt).
    - At 8–12 fps: anticipation 1–2 frames, burst 1 frame (all the displacement in that one frame, the
      most exaggerated), recovery 2–3.
    - Smear: lives 1–2 frames, peaking on the burst frame, then thins and breaks up. Wide head at the
      weapon, tapered tail at last frame's position.
    - Double-ellipse smear construction: an outer ellipse minus an offset inner ellipse gives a natural
      thick-to-thin crescent.
    - Slash effects pass through the target. Blunt effects stop at the contact point with a flash,
      debris and squashed air.
    - Flash at the contact point fades in place and does not travel.
    - Particles: 3–5 groups, all flowing from one dominant direction. Dust bursts out then falls;
      air spirals up and fades by thinning, not shrinking; lightning flickers in place.
    - Blasphemous shifts the impact colour white → blue → purple → red.
    - Priority: weapon, then smear, then particles.

    *Tengu:* `strikes.js` smears should be drawn as crescents (outer arc minus an offset inner arc)
    rather than stroked arcs, and live 2 frames at full strength then break into segments. Add the
    `blunt` variant (fist, hammer, `crack`) with a stop-flash and no pass-through. Effort: M.

11. **Hit-spark shape language** (gcores 111322; TVTropes HitSpark via Chinese search, zh).
    Sparks scale and saturate with attack strength; heavy hits get bigger, more saturated sparks.
    Blunt hits get a starburst; edged hits get a scratch-line glint. Red or white screen flashes are
    common. *Tengu:* `effects.js` hit flash should pick its shape by `spark` type (see #7). Effort: S.

12. **Effects follow motion; build complex FX from parts** (Saint11 像素宝典 translated on Bilibili,
    cv1480409, cv1474542, cv1546333; Sohu translation of Medeiros notes,
    https://www.sohu.com/a/656159731_121124319, zh).
    - Smoke: new puffs about every 4 frames; carry the last frame's leftovers into frame 1 for loops.
    - Lightning: brightest on frame 1, then fade over the rest, with smoke added.
    - Flash: frame 3 covers most of the area, and an optional blank frame before a second flash.
    - Explosions: draw each particle type as its own layer (debris, then smoke).

    *Tengu:* the explosion and impact builders in `particles.js` should emit debris, fire core and
    smoke as separate populations with their own lifetimes, plus an empty frame before secondary
    flashes. Effort: M.

### C. Animation (idle, walk, attack, squash and stretch)

13. **Idle breath** (163.com "像素角色idle待机动画", https://m.163.com/dy/article/KO9TSMQI0526K8VB.html,
    zh; after imonk).
    - Two keys: stand, then the upper body down 1–2 px with knees bent.
    - Hair and cape lag behind. Metal highlights shift subtly.
    - Blink only once per 8- or 16-frame loop; blinking every 4 frames looks eerie.
    - 200 ms per frame for calm play, 125 ms per frame for action.

    *Tengu:* hero and monster idle in `render/animator.js` should blink on a long random interval
    (3–6 s), not a short loop. The breath dip should be at least 1 lpx, and hair should trail the body
    by 1–2 frames. Effort: S.

14. **Follow-through offsets** (163.com "像素画特效：像素画与视觉特效的结合",
    https://c.m.163.com/news/a/JS0HJKVP0526K8VB.html, zh).
    - The shoulder lags the head by 2 frames.
    - Fire mane: 8-frame loop animated on 1s, body on 2s (16 frames total).
    - Dissipating fire needs more than 16 frames.
    - Idle options: 3 f at 300 ms, 4 f at 200 ms, or 6 f at 100 ms.

    *Tengu:* in `render/mobs/*` add a per-part phase offset (`t - 2/12 s` for trailing parts such as
    tails, ears and flames), and animate flame-like parts "on ones" while the body steps "on twos".
    Effort: S.

15. **Player attacks need no wind-up; enemies telegraph** (Sohu translation of Medeiros, zh).
    - The player's first frame should already cover the hit area. If a weapon starts in front of the
      body, fake the wind-up with a "wind slash" and a longer return.
    - Enemy attacks always get preparation frames unless they are meant to be unfair.
    - Anticipation frame: squash the start pose horizontally and stretch it vertically
      (volume-preserving). Landing gets a squash stronger than the anticipation.
    - Walk: 12 frames can be cut to 6, or 8+2. Run: from a jump frame, the fall frame is the jump frame
      moved down 1–2 px.

    *Tengu:* boss and monster attacks in `world/mobs.js` should have a readable 0.3–0.6 s tell
    (flash, crouch, squash), and the hero's basic combo steps a short one. Effort: M.

16. **Attack poses: kinetic chain, centre of gravity, recovery pose** (gcores 202329, 167815, zh;
    games: Sekiro, DMC5, Tekken 7).
    - Force flows legs → waist → shoulders → weapon.
    - The recovery pose is designed to flow into the next step and shows direction.
    - DMC5 Nero uses extreme poses for readability.
    - Tekken 7 holds the impact pose several frames.

    *Tengu:* in `render/moves.js`, lead with the hips 1 frame before the arm on heavy steps, and hold
    the extended pose on the strike frame during `stop`. Effort: S.

17. **Hollow Knight combat breakdown** (gcores 136688, 155205, zh; also gcores 167815).
    - Basic slashes have almost no wind-up or recovery, so control feels immediate.
    - Nail Arts and the Dream Nail use a charge-up that can be interrupted by moving or dashing.
    - Clashing blades (拼刀) give a stagger plus a flash.
    - Taking damage triggers a near-full-screen hit effect and a global pause, because every health
      point matters.

    *Tengu:* when the hero is hit, use a short global stop (0.06–0.08 s) plus a red vignette pulse in
    `post.js`. That makes damage taken readable without the full pause. Effort: S.

18. **Dead Cells pipeline: 3D to pixel** (gamelook / Kajie translation of the 80.lv interview; Tencent
    News "关于《死亡细胞》美术工作流的初步探索", https://news.qq.com/rain/a/20210417A019TN00, zh).
    - The hero is about 50 px tall. Animation is done in 3DS Max and rendered tiny with no
      anti-aliasing.
    - Each frame ships as a colour pass plus a normal pass, shaded in engine with a toon shader so
      lights affect sprites.
    - Weapon timing changes don't need redrawing.
    - The analysis recreates it in Maya Arnold (albedo and normal sequences) and lights it with Unity
      URP 2D lights.

    *Tengu:* our sprites are vector shapes, so we can compute a cheap per-shape normal (each `F`/`C`
    shape already knows its lit side) and add a rim light on the side facing scene lights (lanterns,
    portals, spell FX) in `render/pixel.js`. That gives a Dead Cells-style reaction to light without
    art changes. Effort: L.

19. **DNF frame animation** (TapTap DNF Mobile planner post,
    https://www.taptap.cn/moment/15201337687934223, zh).
    - Hand-drawn frames allow deforming a foot during a kick to add force.
    - One Berserker skill (Rage Burst) uses 120 frames. A Kyo attack in KOF is 15 frames.
    - DNF moves reference arcade fighters (Samurai Shodown, SF Shoryuken).

    *Tengu:* our code-built poses can do the same trick. On the strike frame, stretch the leading limb
    or weapon 10–20% along the blow (smear-limb). Effort: S.

### D. Sprite art, colour and AA

20. **Hue-shifted ramps with no grey shadows** (163.com series, https://c.m.163.com/news/a/L2QS2K340526K8VB.html,
    https://c.m.163.com/news/a/L3O0II360526K8VB.html, zh).
    - Darker means hue toward blue; lighter means toward yellow.
    - Green: shadow aqua→blue, highlight yellow-green. Brown: highlight yellow-orange, shadow toward
      red. Red and orange darken via magenta.
    - Hair three-band example: yellow-green / cyan-green / blue.
    - White clothing shadows are beige or a tinted hue, never grey.
    - Aseprite's gradient tool interpolates midtones to grey, so fix midtones by hand.
    - Leave faces empty at low resolution rather than muddy.

    *Tengu:* our ramp generator (`render/pixel.js` / kit shade functions) should rotate hue as well as
    darken. For example, shadow 1 = base with hue −8–12° toward blue, S +5%, L −12%; highlight = hue
    +6° toward yellow, L +10%. Check pastel whites (Tamamo) get beige or lilac shadows. Effort: S–M.

21. **AA by perceived luminance, not averages** (Bilibili cv51483192 by 像素熊老师, a Chinese adaptation
    of Pixel Parmesan "Anti-Aliasing Fundamentals", zh).
    - Pick an AA colour whose perceived luminance sits between the two colours. Its hue may lean
      toward either side; averaging greys out complementary pairs.
    - Longer segments get longer AA runs.
    - Avoid banding: parallel equal-length AA runs.
    - AA is safest on interior contours. Exterior AA depends on the background, so pure-dark outlines
      animate and read better on busy maps.
    - Broken lines (gaps of 1–2 px in an interior line) are a no-colour alternative for soft form turns.
    - Sub-pixel animation: shift colour between neighbouring pixels over about 5 frames to move less
      than 1 px. Especially important when 1 px is 1/16 of the body.

    *Tengu:* our rasteriser's edge blend should use a luminance-matched midtone (OKLab L midpoint,
    hue of the darker side) instead of RGB averaging. Use broken interior lines for the jaw and cheek
    turn (relates to art-bible face items). Idle breathing and bobs can sub-pixel at res 3. Effort: M.

22. **Eyes by sprite size** (163.com "从8x8到64x64像素画角色眼睛创作技巧",
    https://www.163.com/dy/article/L35UE0CG0526K8VB.html, zh).
    - 8×8: one pixel or none; identity comes from hair and colour.
    - 16×16: the head is more than half the sprite. Eye is a 2×2 block (lower two dark, upper light,
      or top row as brow), a 2–3 px bar, or one pixel. A horizontal bar reads tired or old.
    - 32×32: 2–4 px bars. A cute style uses a 4–6 px eye area plus a clear brow. The same head with a
      different eye type gives a different personality.
    - 64×64: cute style shrinks the sclera and enlarges the pupil.

    *Tengu:* heads at res 3 sit around the 32–64 equivalent. That supports the art bible's "4–6
    clusters". Give each monster family its own eye type (bar, 2×2, slit, glow) instead of the shared
    `face()`. Effort: M.

23. **MapleStory proportions** (Chinese prompt and analysis posts on 冒险岛; unverified).
    Player characters are about 2.0–2.3 heads tall. Head plus hair is about 60–65% of height, body
    15–18%, legs 20–25%, seen from a 35–45° front-side angle. *Tengu:* sanity-check the chibi hero
    ratio against this (head-heavy). Effort: S, check only.

24. **Dithering for material, not just gradients** (Bilibili cv24887564, zh; game: Eastward).
    - Use dither for smooth sky and background gradients.
    - Use small, patterned patches for materials: moss edges, rusty metal, chipped paint.
    - Choose the pattern by material (learned from Eastward).

    *Tengu:* in `terrain.js`, use 2–3 px dither patches along the grass→dirt boundary and on stone
    props, and a dithered sky band transition in `scenery.js`. Effort: S.

### E. Backgrounds, parallax, atmosphere

25. **Atmospheric perspective by colour bands** (163.com "像素画JRPG 战斗背景+角色教程",
    https://c.m.163.com/news/a/L28V6ILT0526K8VB.html, zh; JRPG battle backs).
    - 192×144 canvas, 16 colours or fewer.
    - Build horizontal bands from the horizon. Near bands are the most saturated with the highest
      contrast; far bands are lighter, less saturated and shift toward the sky hue.
    - Mountain shadows reuse sky colours.
    - Grass texture shrinks with depth: near grass gets an extra dark colour for vertical strokes, far
      grass is 1–2 px clusters, then no blades at all.
    - Far clouds are baked into the sky.
    - Forest variant: near greens lean cool and far greens lean warm yellow, with depth compressed.
    - Desert variant: deep orange near, pale yellow mid, pale blue far; dark-red shadows go to pale
      purple.

    *Tengu:* the screenshot `ig/new-woods.png` shows flat mid-green hills with no depth falloff. In
    `scenery.js`, lerp each parallax layer toward the sky colour by depth (for example 0.15 / 0.35 /
    0.6) and reduce saturation. Scale texture detail by layer (blades only on the nearest), and let the
    far-hill shadow colour equal a sky band. Effort: S–M.

26. **Seamless far layers** (163.com "游戏场景远景图",
    https://www.163.com/dy/article/FC2774J80526K8VB.html, zh).
    - The far layer is one big image, separate from the tiled near layer.
    - Make clouds and islands seamless (offset filter / tile mode), repeat them 3×, then hand-edit the
      joins so the repeat isn't obvious.
    - Parallax ratios like 1, 2/3 and 1/3 are a common demo default (Godot docs zh).

    *Tengu:* the procedural far-layer generators should vary every third repeat (seeded variation) to
    hide tiling. Effort: S.

27. **Octopath HD-2D in Chinese write-ups** (juxia.com, https://www.juxia.com/sjwy/zixun-30190.html;
    gamelook 2018, zh; game: Octopath Traveler).
    - Only characters are 2D; everything else is 3D with pixel-style textures.
    - Tilt-shift depth blur gives a diorama feel. Dynamic point lights such as lanterns, and glints on
      snow and sand.
    - The devs added a point light that spawns with each VFX because effects alone looked flat.

    *Tengu:* in `post.js` / `effects.js`, every spell or big hit should drop a short-lived additive
    light blob (radius 40–80 lpx, 0.15–0.3 s) onto the terrain and nearby sprites. Optionally add a
    soft blur or desaturation on the furthest parallax layer, kept crisp (downsampled) so it doesn't
    break the no-blur rule on sprites. Effort: M.

28. **Eastward lighting** (gcores 17339, zh; game: Eastward / 风来之国 by Pixpil, Shanghai).
    Pixpil says it added an effectively 3D lighting system on top of pixel art to direct the eye and
    set mood per scene. Every prop is designed "for a space people could live in". *Tengu:* use mood
    lighting overlays per map in `post.js` (warm pools around lamps and windows such as the treehouse
    windows in new-woods, plus cool ambient) to guide the eye toward NPCs, portals and the hero.
    Effort: M.

### F. UI, icons, damage numbers

29. **Skill-icon rules** (腾讯游戏学堂 "一个UI的图标自我修养", https://gameinstitute.qq.com/knowledge/100071;
    Zcool "游戏图标的分类与设计", https://www.zcool.com.cn/article/ZMTE3ODQ0MA==.html, zh).
    - Design at in-game size; subtract elements first.
    - Show the most expressive fragment, e.g. the feet for a sprint rather than a whole body.
    - Use perspective or foreshortening for action.
    - One dominant hue per job set, with analogous accents and complements kept small.
    - Type language: physical = straight, directional lines; magic = glow with layered values; buff =
      bright, warm, positive; debuff = dark purple.
    - Personality sets shape: aggressive = sharp corners, refined = delicate lines.
    - Same light direction, view angle and outline across a set. Icons must match the skill's in-combat
      FX.

    *Tengu:* audit `render/icons.js` per job. One hue family per job, a shared top-left light, and a
    distinct base frame per type (attack / buff / passive). Physical icons use a diagonal blade or
    motion; buffs use upward glow; debuffs get a purple tint. Effort: M.

30. **Skill-tree node states** (GameRes 913976, zh).
    - Unlocked = full highlight. Available = half-highlight plus a breathing border.
    - Locked = greyscale or a lock.
    - Hovering a locked node lights its prerequisites; unlocking lights its paths.

    *Tengu:* skill window states. Effort: S.

31. **Damage numbers** (星火编辑器 article, https://3g.7723.cn/strategy/171226.html; GitHub issue
    summarising other games; CSDN Unity notes, zh).
    - Outgoing damage pops up fast, holds, then shrinks away. Crits are bigger, carry a marker and are
      brighter, with a scale-up-and-rebound keyframe.
    - Normal hits drift on a parabola away from the attack direction.
    - Tier the size by the hit's % of the target's max HP; light tiers are more transparent and shorter.
    - Large hits linger longer.

    *Tengu:* damage-number renderer. Scale keyframes 0→1.3→1.0 over 0.12 s for crits (0→1.1→1.0 for
    normal). Drift away from the hero on a parabola. Size and duration scale with dmg/maxHP. Effort: S.

32. **HUD hit feedback** (gcores 167815; game: Tekken 7).
    - The health bar shakes and flashes during hitstun.
    - The lost chunk stays visible for about 1 s before draining.

    *Tengu:* make the HP/MP bars and the boss bar use a delayed-drain "ghost" segment (white, then
    drain after 0.6–1 s) and shake 1–2 px when the hero is hit. Effort: S.

## 3. Reference list (best links)

Hit feel and combat
- https://www.gameres.com/901202502.html — hit-stop frames per weapon at 60 fps, knockback curves, reaction blend 0.
- https://www.gameres.com/896158.html — DNF vs Naruto Mobile hit-stop and shake measured.
- https://www.gameres.com/819581.html — frame-by-frame study method (record, then VirtualDub); hitstun asymmetry; DNF weight-based launch height.
- https://www.gcores.com/articles/167815 — readability, hit frames, SF5 hit-stop 8/12/15, Hollow Knight and Bayonetta pauses, Tekken HUD.
- https://www.gcores.com/articles/111322 — SF4 14/16 f hit-stop, Skullgirls anticipation.
- https://www.gcores.com/articles/202329 — VFX 3-phase timing, hit-stop 0.05–0.08 s, shake rhythm, saturation budget.
- https://www.gcores.com/articles/97115 — active vs passive stagger ratio as the core hit-feel lever.
- Bilibili cv20755711 — Sakurai's 8 hit-stop vibration rules (Chinese summary).
- Bilibili cv34785994 — the full 打击感 checklist (attacker, victim, camera, audio, rumble).
- Bilibili cv17475535 — 打击帧: still vs motion contrast, flashes, voice.
- https://www.taptap.cn/moment/15201622904803036 — Street Fighter: Duel hit-point configuration.
- https://www.taptap.cn/moment/15201337687934223 — DNF Mobile: frame animation and deformation.
- https://wiki.biligame.com/celeste/高级技巧 — Celeste dash freeze and coyote/buffer frame data.
- Bilibili videos: BV1hgAgzTEfE (3 hit-feel tricks), BV1tH4y1H79x (Godot 4 shake and hit-stop), BV1fg411X7TF (Unity hit-stop code).

Animation and VFX
- https://www.163.com/dy/article/KV5HLU7J0526K8VB.html — pixel attack VFX: 1–2 / 1 / 2–3 frame split, double-ellipse smear, particles.
- https://m.163.com/dy/article/KO9TSMQI0526K8VB.html — idle breath, blink cadence, 125/200 ms.
- https://c.m.163.com/news/a/JS0HJKVP0526K8VB.html — on-1s/on-2s mixing, 2-frame lag, fire loops.
- https://www.sohu.com/a/656159731_121124319 and https://www.sohu.com/a/315565951_661496 — Medeiros-style notes (ball, attack, walk, smoke, lightning).
- Bilibili Saint11 像素宝典 translations: cv1474542 (flash), cv1480409 (smoke), cv1485239 (run), cv1661395 (walk), cv1681607 (cute), cv1521034 (animation planning), cv1546333 and cv1554792 (dark and light magic).
- Bilibili video BV1cT41157DP — Saint11 explosion lesson explained in Chinese (27k views).
- Bilibili videos BV1gmsyzxE98, BV1a6h16hETc, BV1Wa411a7Zn — pixel attack, idle, walk and effect animation courses.
- https://news.qq.com/rain/a/20210417A019TN00 — Dead Cells colour and normal pipeline recreated.

Pixel art fundamentals
- Bilibili cv51483192 — AA via perceived luminance, banding, sel-out vs dark outline, sub-pixel.
- https://c.m.163.com/news/a/L2QS2K340526K8VB.html and https://c.m.163.com/news/a/L3O0II360526K8VB.html — hue-shift ramps and grey-shadow fixes.
- https://www.163.com/dy/article/L35UE0CG0526K8VB.html — eyes at 8/16/32/64 px.
- https://c.m.163.com/news/a/KMQ4PIGR0526K8VB.html — curated Lospec beginner route in Chinese.
- Bilibili cv33303129 — Slynyrd #1 palettes (HSB stepping), Chinese translation.
- Bilibili cv24887564 — dithering for materials (Eastward).

Maps and lighting
- https://c.m.163.com/news/a/L28V6ILT0526K8VB.html — colour-band atmospheric perspective, ≤16 colours.
- https://www.163.com/dy/article/FC2774J80526K8VB.html — seamless far layers, repeat 3× and edit joins.
- https://www.juxia.com/sjwy/zixun-30190.html — Octopath HD-2D: tilt-shift, point lights, pixel textures.
- https://www.gcores.com/articles/17339 — Eastward's 3D lighting on pixel art.

UI
- https://gameinstitute.qq.com/knowledge/100071 — skill icon craft (subtract, hue dominance, type language).
- https://www.zcool.com.cn/article/ZMTE3ODQ0MA==.html — icon classification and consistency.
- https://www.gameres.com/913976.html — skill-tree node states.
- https://3g.7723.cn/strategy/171226.html — damage-number motion (pop, hold, shrink; crit style).
