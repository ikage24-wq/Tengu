# Research: animation craft (EN / JA / KO / ZH / RU)

Area: sprite animation timing, anime 作画 fundamentals, procedural and code animation, all mapped onto
Tengu's renderer (`src/render/monsters.js`, `animator.js`, `hero.js`, `moves.js`, `scene.js`, `world/melee.js`).
Raw page dumps are in `scratchpad/ranim/p/` and contact sheets of our GIFs are in `scratchpad/ranim/*.png`.

## 1. Engines and queries that worked

- **Yahoo! JAPAN** (curl HTML, `ranim/s/yj.sh`) worked well: ドット絵 アニメーション 中割り, オバケ 作画, パカ, 桜井政博 ヒットストップ, CEDEC やられ, 揺れもの. It surfaced note.com, PA Works, CGWorld, Famitsu, IGN JP and 4Gamer.
- **Naver** blog tab (`ranim/s/nvb.sh`) worked with a custom parser: 도트 걷기 모션 프레임, 히트스탑 프레임 타격감, 타이밍과 스페이싱, 던파 역경직. The plain web tab returned only portal noise.
- **Bilibili** API (`bili.sh`) worked for articles and videos: 打击感 顿帧, 日式作画 时间, 像素动画. **WebSearch** in Chinese reached 163.com and gcores. **Bing CN** answered but with off-topic results.
- **WebSearch** (US) worked for EN, RU and KO discovery, but its summaries are thin. I opened every page with curl (`ranim/s/get.sh`). Habr, DTF and VK pages fetched fine.
- **Blocked**: DuckDuckGo html (empty), Yandex (empty body), Bing KR (mangled query), GitHub API for NoelFB/Celeste (no access). The Celeste `Player.cs` was already in `scratchpad/dl_celeste/`, so I read it there.
- **Primary data**: MapleStory WZ XML (body `00002000.img`, mobs) from the HeavenMS repo on raw.githubusercontent. These are exact per-frame ms delays (see finding 1).

## 2. What our current animation does (from the GIFs and the code)

- **Monster attack timing is uniform.** `poseOf()` spreads the attack frames evenly over `ATTACK_TIME = 0.5` s, about 125 ms each. Only frame 0 is held, and only while `warn`/`windup` lasts. The `attack-gnarlroot.gif` strip (5 × 180 ms) shows arms up, then wider, then slam, then two near-identical frames. The trunk never crouches before the slam and never squashes on impact, and the arms jump from up to down with no smear or overshoot. The impact and recovery read as "two more poses", not as a hit.
- **The monster hurt is a static squash** (`sx 1.14, sy 0.86` while `flash > 0`), then it snaps back. There is no wobble, no overshoot and no hold pose. The hitstop jolt in `scene.js:116` is a constant ±px horizontal alternation: it does not decay and it is the same in the air.
- **Idle**: 6 frames over 1.8 s plus a sine `sy` breathe. It is fine, but it is purely a shift or scale.
- **Walk**: distance-driven, 8 frames, no foot sliding. This is good. In the `walk-wilds` and `walk-ruins` strips the bodies bob, but secondary parts (tails, leaves, ears) barely lag. In `queens-hair-walk.gif` (8 × 70 ms) the long hair and tails are nearly rigid, and the legs are hidden by skirts, so the walk reads as a slide (art bible item 8).
- **Hero**: a 24-frame distance-driven walk with a sine head bob. Moves are evaluated every 60 Hz frame with `snap()` time remapping (wind-up hold, then a 0.1 cut, then an eased settle), which is good. Hair and cape use `spring()` in `animator.js` with semi-implicit Euler at variable `dt` (clamped ≤ 0.1). With `k = 140, damp = 11`, `damp·dt` reaches 1.1 at 10 fps, so the hair flips sign and jitters. The behaviour differs between 30, 60 and 144 Hz.
- **Hitstop**: 35–100 ms for players, 300 ms for a boss kill. That is light next to the references below.

## 3. Top findings (technique, numbers, source, how it applies, effort)

### Timing data from shipped games

1. **MapleStory's own frame delays** (WZ data, exact ms; EN/KO; https://raw.githubusercontent.com/ronancpl/HeavenMS/master/wz/Character.wz/00002000.img.xml and `wz/Mob.wz/*.img.xml`):
   - **Player**: walk1 = 4 × 180 ms; stand1 = 3 × 500 ms; alert = 3 × 500 ms; jump = 1 frame; rope/ladder = 2 × 250 ms.
   - **Player swings**: swingO1 = **300 / 150 / 350** (wind-up hold, cut, follow-through hold). stabO1 = 350 / 450. swingOF = 200 / 100 / 100 / 300. shoot2 = 160 / 160 / 250 / 100 / 150.
   - **Player casts**: magic1 = **900 / 200 / 200**; brandish = 6 × 120. Negative delays in skill actions mark the pre-hit frames: comboSmash −120 −120 −120 / 120 120 **600**, and meteor −360 −1800 / 1320.
   - **Mobs**: snail move = 5 × 180; Orange Mushroom move = **100 / 100 / 300** (fast hop, hold on landing); stand = 180 / 150 / 180; **hit1 = one pose held 600 ms**; die1 = 120 ms frames, last frame **300**.
   - **Zakum attack1**: 130 130 130 **920** 120 120 120 120, a long hold on the impact pose.
   - **Lesson**: frames are almost never uniform. Fast frames are 60–150 ms, holds are 300–900 ms, and every hurt is one held pose.
   - **Applies to**: `monsters.js poseOf()`. Replace the even spread with a per-art `atkMs` table (see the sketch after finding 2). Effort **S**.

2. **Slynyrd Pixelblog 56: attack frame timing per weapon** (EN; https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation). Six frames in phases: anticipation, smear (several brief frames), rebound (hammer only), follow-through, recover.
   - Sword: **100, 50, 50, 50, 100, 50** ms.
   - Spear: **200**, 50, 50, 50, **150**, 50 ms.
   - Hammer: **250**, 50, 50, 50, **300**, 100 ms, plus screen shake and a 1-frame rebound.
   - Rules: never put smears on anticipation or recover frames. The follow-through goes 1 px further into the target, with no smear, and is held. Sharp, angular smears feel heavier than curvy ones.
   - **Applies to**: monster attack frames and boss slams. For the hero, `moves.js snap()` already approximates 100/50/50/50/100; add a true hold of 2–3 ticks at the follow-through extreme. Effort **S**.

   Sketch for `monsters.js` (replaces the linear `since/ATTACK_TIME` mapping; strike damage must land on the impact index, per CLAUDE.md):
   ```js
   // per art: ms per attack frame; frame 0 also held for warn/windup
   atkMs: [300, 60, 60, 260, 120],   // gnarlroot: wind-up, smear, impact(+shake), hold, recover
   function atkFrame(ms, since) { let t = since * 1000; for (let i = 0; i < ms.length; i++) { if (t < ms[i]) return i; t -= ms[i]; } return -1; }
   ```

3. **Street Fighter V / Smash / DNF hitstop scale** (ZH, translated Game Anim notes, gcores https://www.gcores.com/articles/167815; KO, byjun_04 https://blog.naver.com/byjun_04/224412686555):
   - SF5 freezes light, medium and heavy hits for **8 / 12 / 15 frames** at 60 fps (133 / 200 / 250 ms), keyed only to attack strength, so players can rely on it.
   - Smash: 15% damage gives 15 frames, electric ×1.5, cap **30 frames**.
   - DMC5 uses hitstop only on heavy hits. God of War uses it on every hit.
   - Dungeon Fighter splits 경직 (victim stun) from **역경직** (the attacker held in pose). Slash-type hits have short stun and no attacker stall; blunt-type hits have both. Bosses with super armor replace stagger with hitstop, a hit-part glow and HP-bar shake.
   - Korean devlogs use 0.1 s for basics and 0.2 s for strong skills (teambackstreet), or 100–200 ms overall (art-life.tistory.com/178).
   - **Applies to**: `world/melee.js` `stop` values (currently 0.035–0.1 s). Use about 0.05 for light, 0.1 for medium, 0.15–0.2 for finishers and ultimates. Keep the 0.3 s boss kill. Effort **S**.

4. **Sakurai's eight hitstop rules** (JA video, https://www.youtube.com/watch?v=CiQzmwz_Olg; ZH notes, https://www.bilibili.com/read/cv20755711):
   1. Hitstop is not a dead stop; the victim vibrates **harder than the attacker**.
   2. The hit position does not move with the shake.
   3. On the ground the victim shakes **left-right**; in the air, **in all directions**.
   4. The amplitude **decays**.
   5. The length scales with power.
   6. The hurt pose is swapped in during the stop.
   7. The attacker gets small "digging in" detail.
   8. The amplitude scales with camera distance.

   **Applies to**: `scene.js:116`, where the jolt is a constant ±px on X. Make it `amp·(left/total)`, use a random 2D direction when `m.air > 0`, and give the attacker a 0.33-lpx push forward. Effort **S**.

5. **Dead Cells: pose-to-pose with easing frames only at the keys** (EN, Thomas Vasseur, https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-; RU translation https://habr.com/ru/articles/416589/).
   - "Once the animation is timed with the least frames possible, I add interpolation frames **before or after the key frames. Never in-between.**" The animation runs at 30 fps.
   - Dead Cells sells motion with VFX, not in-betweens. Retiming is done by sliding keys.
   - **Applies to**: hero `moves.js`. Our eased per-tick evaluation is fine; to get the same feel, make the strike segment linear and 1–2 ticks long, and put ease only into and out of the wind-up and the settle. Monster attacks need only keys plus smear and FX. Effort **S**.

6. **Celeste: concrete squash and stretch and the hair chain** (EN, source in `scratchpad/dl_celeste/Player.cs`).
   - Jump sets `Sprite.Scale = (0.6, 1.4)`; super jump `(0.5, 1.5)`; wall bounce `(1.5, 0.5)`.
   - Landing: `squish = min(vy / FastMaxFall, 1)`, then `scale = lerp((1, 1), (1.6, 0.4), squish)`.
   - Recovery is **linear**: `Approach(scale, 1, 1.75·dt)`.
   - Hair: each node approaches the previous node plus `StepPerSegment`. At rest that is `(0, 2)` with `StepInFacingPerSegment 0.5` and `StepApproach 64`. In motion it is `(sin(t·2)·0.7 − facing·3, sin(t))` with approach 90 and `StepYSinePerSegment 1`.
   - **Applies to**: `animator.js` land squash. Ours is 1–2 lpx of knees; add a whole-sprite scale kick scaled by fall speed. For queen and maiden hair and tails, see finding 15. Effort **S** (squash), **M** (chain).

7. **Slynyrd Pixelblog 50: walk cycle** (EN, https://www.slynyrd.com/blog/2024/5/24/pixelblog-50-human-walk-cycle). 8 frames: contact (lowest), down, pass (tallest), swing, then mirrored. 6 frames is the economy cut; 4 frames is too few on its own. The head path should be a **triangle wave, not a sine**, because "a perfect sine wave feels unnatural". The female walk has a fuller arm swing past the hips, and the chest drops 1 px on contact. **Applies to**: `hero.js:797`, where `r.hy = 0.4·sin(4πp − 1)`; switch to a triangle-ish curve such as `1 − 2|frac(2p + φ) − 0.5|`, sharpened. Effort **S**.

8. **Korean pixel walk rules** (KO, redrabbitpixel, https://blog.naver.com/redrabbitpixel/220736473631).
   - A 4-frame walk needs only 3 drawings (the pass pose is reused). SD and chibi games often use 2–4 frames.
   - With 4 or more frames, **darken the far leg** so the legs read apart. With 2 frames, don't.
   - Side-scrollers must bob the head, or the sprite looks pinned while the background scrolls.
   - Fewer than 8–10 frames gives "스키 타기" (ski sliding); the lift-and-reach frame cures it.
   - **Applies to**: our chibi walkers. Check the far-leg shade contrast in the mobs/*.js leg drawers. Effort **S**.

9. **Russian practice: run cycle, the 1-frame lag rule, захлёст** (RU):
   - **DTF** (https://dtf.ru/294631-sozdanie-piksel-art-animacii): the heroine's run is **10 frames**, smoother than 8 and cheaper than 16. The backpack "**lags one frame**" behind her up and down. Hair moves more than heavy items. Don't move small details on every frame or it looks noisy. In her attack, the sword keeps moving "a few frames" after the body stops.
   - **VK Animation Club, 21 principles** (https://vk.ru/@animationclubvk-21-princip-animacii): in захлёст (overlap), the belly stops **8 frames** after the body. "Break" a joint for a few frames for loose, cartoony motion. They define timing as the numbers on the keys and spacing (фазовка) as where the inbetweens sit.
   - **Habr, Галоп пикселя 6** (https://habr.com/ru/articles/772588/): walk and run are each defined by one key, the "maximum opening" (contact) pose. The far arm is often hidden for clarity.
   - **Applies to**: every monster's secondary part. Phase-offset tails, leaves and ears by one walk frame (`p − 2π/8`), and more toward the tip. Effort **S** per mob.

10. **Nippon Ichi breathing by shading, not by shifting** (JA, a ドッター roundtable, https://news.denfaminicogamer.jp/kikakuthetower/dotter-taidan/2). They avoid "シフト" (moving the sprite 1 px). Instead they keep a 3-step shadow gradient and **shift the shadow bands** to show muscles tightening and relaxing. **Applies to**: idle loops of bosses, queens and large mobs. Move the cel shadow terminator by 0.33 lpx on inhale (chest and belly shadow) instead of only scaling `sy`. Effort **M** (the shape code takes a `breath` parameter).

11. **The 4-frame idle recipe and FPS bands** (JA): Pixnote (https://pixnote.net/learn/animation/) and pixelartlab (https://pixelartlab.net/tutorials/dot-anime-tsukurikata).
    - Idle at 4–6 fps, 2–4 frames; walk at 8–12 fps; attacks and FX at 15–24 fps.
    - Attack: give the wind-up a long hold and the strike 1–2 frames.
    - Idle: the body moves 1 px, and **the hair tip moves 1 px later**. That one change turns a "blink" into "breathing". Frame 4 sits near frame 2 so the loop closes.
    - **Applies to**: our `IDLE_CYCLE = 1.8` s over 6 frames, which equals 3.3 fps. That is good, as long as each idle frame offsets hair, ear and tail tips one frame behind the body (most mobs already pass `it − 0.5`). Effort **S**.

12. **Hair sway is a wave; never ping-pong the same shapes** (JA, tetotti, https://note.com/tetotti/n/n2ed27b7af8e3). Playing hair frames 1→5→4→…→1 looks stiff and "lumpy". The return stroke must have different shapes, because the wave travels to the tip. **Applies to**: hair, tail and sleeve offsets in mobs/queens.js and maidens.js. Use `sin(phase − k·i)` per segment i, a traveling wave, not one `sin(phase)` scaled per segment. Effort **S**.

### Anime 作画 craft

13. **タメ・ツメ, and where the keys go for weight** (JA, PA Works 作画の跳び箱 No.19, https://www.pa-works.jp/for-animator/tobibako/782/).
    - A heavy ball and a light ball bouncing need different key placement.
    - For weight, put **more keys into the 収まり (the settle)**: "sticky" (粘った) keys after the impact. The start can be left to evenly split in-betweens.
    - A ツメ (spacing) instruction only exists because too few keys were drawn. A key in the right place lets the in-betweens split evenly.
    - **Applies to**: boss slams and heavy monster landings. The impact is followed by 2–3 settle poses (rebound up, then down, then rest) rather than one. Effort **M** (extra attack frames for bosses).

14. **Koma rhythm: mixing 1s, 2s and 3s** (ZH notes on a Japanese 作画 explainer, https://www.bilibili.com/read/cv23317102; JA, Pixnote).
    - TV anime works on 2s (12 drawings per second) and 3s (8 per second). Fast hits go on 1s.
    - Kanada-school animators insert **3s-holds inside 1s/2s runs** to create 顿挫感 (a snap and stop). Too many in-betweens feel "sticky and slimy" (粘粘滑滑).
    - **Applies to**: hero moves run at 60 Hz continuous. Optionally quantize the wind-up and settle phases of `moveAt()` to 1/20 s steps and keep the strike on single ticks. That gives the anime "snap" without new art. Effort **S** (one `Math.floor` on p per phase).

15. **オバケ (smears) and impact frames** (JA, Takuan, https://note.com/tkyhgsanimation/n/nd994bfa1d00b; EN, Sakugabooru glossary, https://blog.sakugabooru.com/glossary/; JA, 点P空間 explosion breakdown, https://blog.tenp-kukan.com/10141/).
    - A smear is **one frame** where the shape is stretched along the path in **flat colour**. It is not a semi-transparent blur, which muddies the silhouette.
    - Impact frames are monochrome or colour-inverted drawings flashed for 1 frame.
    - In the explosion breakdown: ignition at f24, then **one impact frame at f27** (a global value flip), then smoke and debris at f28, a shockwave at f29 (very fast), and debris arcs at f31. Fire grows fast until f39, then slows; it turns to smoke at f49 and slows sharply from f58 to f86. Each component gets its own speed, so the explosion is not "all fast". f27–31 is on 1s, f33 and f35 slow a little for a "boko" lift, then back on 1s.
    - **Applies to**:
      - Monster attack smear frames (a flat crescent in a lighter limb colour, hard leading edge). For example, the gnarlroot's branch arms on frame 2.
      - A 1-tick inverted or monochrome flash in `post.js` for ultimates and boss kills.
      - In `fxkit.js`, per-layer speed curves for bursts: shockwave fastest and linear; flash 1–2 ticks; smoke ease-out with a long tail.
    - Effort **M**.

### Attacks, hurt reactions and readability (game-animation talks)

16. **The counter-movement must sit right before the strike; kinetic chain** (JA, CEDEC 2013 Square Enix, Famitsu, https://www.famitsu.com/news/201308/26038928.html).
    - Stretched muscle snaps back reflexively, so the wind-up twist must be **immediately** before the blow. A longer charge is not stronger in reality.
    - Power chains from the hips outward. Each proximal part must **decelerate and stop ("make a wall")** so the next part whips.
    - Fold the limb to spin faster, then extend at impact.
    - Rotating attacks need the opposite arm thrown back to cancel torque.
    - **Applies to**: big-limb mobs (treant arms, golem fists, tails). Shoulder leads, the elbow is 1 frame late, the hand or branch tip 2 frames late. On the impact frame the torso stops dead while the tip overshoots 1 px and settles. Effort **M**.

17. **Hurt animation is about the centre of mass** (JA, CEDEC 2026, IGN, https://jp.ign.com/cedec-2026/83887/).
    - A hurt reaction is the centre-of-mass projection being knocked **outside the support base**, then recovered: a step, a stumble or a fall.
    - Bigger hits mean more translation and rotation. Spins and launches are fun but jarring if overused.
    - **Directional hurt** (KO, Kazan devlog, https://blog.naver.com/gamedesigns/224220589787): the victim's head and body bend **in the swing's direction**. A left-to-right swing pushes right; an overhead swing buckles the knees.
    - **Applies to**: `drawMonster` recoil. Rotate by the strike arc's direction (`arc` already exists in melee.js strikes) and lower the body on overhead blows. Effort **S–M**.

18. **PlatinumGames: idle neutrality, readable attacks, damage as reward** (JA, CEDEC 2017, CGWorld, https://cgworld.jp/feature/201709-cedec2017-platinum.html).
    - Idle must be neutral. A boss with raised claws in idle is wrong; raise them in the attack.
    - A jump attack that hung in mid-air tested as "undodgeable", so they made rise and fall symmetric.
    - Damage animations should scale with damage, so a big hit tells the player "I can win".
    - Monster anticipation should be **exaggerated** (it is the player's warning); player anticipation should be **compressed** (or it feels like input lag) (ZH, https://c.m.163.com/news/a/KM84CU2T0526K8VB.html; JA, https://note.com/bbds_blog/n/nb1f5058063b8).
    - **Applies to**: boss `warn` poses (keep them long and readable) and hero skills (keep wind-ups at 60–100 ms, as now). Effort **S**.

19. **The Chinese 3-key attack recipe** (ZH, after Goob's tutorial, https://c.m.163.com/news/a/KMMASHN00526K8VB.html). Draw three keys: before (charge, lowest point), during (the strongest frame) and after (recover). Give anticipation more frames, the strike fewer, and recovery a few more so it doesn't "snap back". Start each sub-move at 2–3 frames, then retime by changing frame durations rather than adding frames. The companion piece adds Saint11's **overshot**: on the hit frame the arm and weapon go past the target pose, with a fan-shaped colour block as the blur. **Applies to**: the same atkMs tables. Effort **S**.

### Procedural and code animation for our engine

20. **Frame-rate-independent damping** (EN, Daniel Holden "Spring-It-On", https://theorangeduck.com/page/spring-roll-call; Rory Driscoll, https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/).
    - `lerp(x, g, k·dt)` is wrong and explodes when `k·dt > 1`. Use `x = lerp(x, g, 1 − 2^(−dt/halflife))`.
    - The exact critically damped spring:
      ```js
      function critSpring(s, g, halflife, dt) { // s = {x, v}
        const y = (4 * 0.693147) / (halflife + 1e-5) / 2, j0 = s.x - g, j1 = s.v + j0 * y, e = Math.exp(-y * dt);
        s.x = e * (j0 + j1 * dt) + g; s.v = e * (s.v - j1 * y * dt);
      }
      ```
    - **Applies to**: `animator.js spring()`. It is semi-implicit Euler with variable `dt` up to 0.1 and becomes unstable at low fps. Either swap in the exact solver above, or sub-step at a fixed 1/120. Effort **S**.

21. **Second-order dynamics with f, ζ, r for personality** (EN, t3ssel8r, https://www.youtube.com/watch?v=KPoeNZZ6H4s).
    ```js
    k1 = z/(PI*f); k2 = 1/((2*PI*f)**2); k3 = r*z/(2*PI*f);
    // per step T: y += T*yd; yd += T*(x + k3*xd - y - k1*yd)/max(k2, T*T/2 + T*k1/2, T*k1)
    ```
    Here `f` is the speed in Hz, `ζ < 1` gives wobble, and `r < 0` gives anticipation (it moves the wrong way first), while `r > 1` overshoots.
    **Applies to**:
    - Monster hurt squash (`f ≈ 4`, `ζ ≈ 0.3`) for a jelly wobble that suits pastel chibis.
    - Spawn pop (replaces the sine bump).
    - Boss `warn` crouch (`r = −0.5` gives a built-in anticipation dip).
    - Damage-number and UI pops.
    - Effort **S**.

22. **Verlet chains for hair, tails and ribbons** (EN, Jakobsen "Advanced Character Physics", GDC 2001; PICO-8 tutorial, https://www.lexaloffle.com/bbs/?tid=154658). Store `pos` and `prev`. Apply `next = pos + (pos − prev)·damping + g·dt²`, then project each segment back to its rest length for 2–4 iterations. The root is pinned to the head anchor, and a bend limit keeps hair in shape. It is stable and frame-rate tolerant.
    - **Applies to**: queen and maiden hair, kitsune tails, lamia tail, capes. **Caveat**: `monsterSprite()` caches whole frames by key, so a per-instance chain cannot live inside the cached sprite. Two options:
      - (a) Draw chain parts as separate small cached segment sprites, rotated and placed after the body blit (Vanillaware-style cut-out).
      - (b) Quantize the chain state into 3–5 "lag buckets" that become part of the cache key.
    - Celeste's simpler node-follow (finding 6) is enough for chibi scale.
    - Effort **M–L**.

23. **IK and procedural gait** (EN, Wolfire/Rosen "An Indie Approach to Procedural Animation", GDC 2014; Rain World talks).
    - Use very few key poses (2 for a run), blend them by distance travelled, and let springs do overlap.
    - Two-bone IK uses the law of cosines: `cosK = (a² + b² − d²)/(2ab)`.
    - **Applies to**: we already drive walks by distance (`m.odo`). Next steps:
      - Plant feet to the slope with 2-bone IK on big walkers (tuskar, thornback, golem). `footShadow` already knows the slope.
      - Quadrupeds: diagonal pairs in a trot; in a walk each foot is down for 60–75% of the cycle and the back pair lags the front by 0.25–0.5 of the cycle.
      - Serpents and lamia: a traveling sine down the body (`sin(phase − k·s)`), amplitude growing toward the tail.
    - Effort **L** (IK); **S** (wave bodies).

24. **Animator's Survival Kit timing chart** (EN, Monmouth, reproducing Williams, https://animation.monmouth.edu/instruct/?p=351). At 24 fps:
    - 8-frame cycle: a very fast run.
    - 12-frame cycle: a run or very fast walk.
    - 16-frame cycle: a slow run or "cartoon" walk.
    - 24-frame cycle (12 per step): a natural walk.
    - 32-frame cycle: a stroll.

    Contacts fall on frames 1, 13 and 25, with down and pass in between. A Korean summary (https://blog.naver.com/mg2201/223077128797) states the working order: **set the timing first, then the spacing within it**.
    **Applies to**: sanity-checking `stride`. A chibi takes about 3 steps a second at a natural walk and 4–6 when angry (`fast = 1.5`). Effort **S**.

## 4. Concrete upgrade plan (ordered by payoff per effort)

1. **Per-frame attack timings** (`atkMs`) for every mob with `attack` frames, with damage on the impact frame. Defaults by weight:
   - Light: `[150, 50, 50, 150, 80]`
   - Heavy: `[250, 60, 60, 300, 120]`
   - Boss slam: `[hold(warn), 80, 60, 600–900, 150]`, as in Zakum.

   Add to the attack frames: anticipation squash `sy 0.9 / sx 1.08` on frame 0, a smear on frame 1, and an impact squash `sy 0.92 → spring` plus shake on frame 3. (Findings 1, 2, 15, 16.)
2. **Hurt**: one held hurt pose (Maple: 600 ms). Squash by second-order spring (`f 4, ζ 0.3`). Lean in the swing's direction. Hitstop jolt decays, goes 2D in the air, and is bigger on the victim. (Findings 4, 17, 21.)
3. **Hitstop table** about 50 / 100 / 150–200 ms for light, medium and finisher, plus a 1-tick monochrome impact frame on ultimates and boss kills. (Findings 3, 15.)
4. **`animator.js` springs** made frame-rate-exact. (Finding 20.)
5. **Overlap pass on mobs**: tips lag the body by one walk frame; hair and tail as a traveling wave, never ping-pong; far leg darker. (Findings 8, 9, 11, 12.)
6. **Hair and tail chains** for queens and maidens, Celeste node-follow first, drawn outside the cached body. (Findings 6, 22.)
7. **Death and knockdown**: pop up on an arc with a 15° rotation, one ground bounce (squash `1.3 / 0.7`), hold 300 ms, then poof. This replaces the plain shrink and fade. (Finding 1, die1; finding 17.)
8. **Breathing by shading** on large sprites; hero bob as a triangle wave; optional "on 2s" quantization of hero wind-up and settle. (Findings 7, 10, 14.)

## 5. Reference list

**English**
- MapleStory WZ frame delays (HeavenMS): https://github.com/ronancpl/HeavenMS (`wz/Character.wz/00002000.img.xml`, `wz/Mob.wz/`). Exact ms per frame for every action.
- Slynyrd Pixelblog 56, attack timing tables: https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation
- Slynyrd Pixelblog 50, walk cycle (8, 6 and 4 frames; triangle bob): https://www.slynyrd.com/blog/2024/5/24/pixelblog-50-human-walk-cycle
- Dead Cells pipeline, keys plus easing only at the keys: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-
- Celeste `Player.cs` (scale and hair constants): local `scratchpad/dl_celeste/Player.cs`
- Spring-It-On (exact dampers and springs): https://theorangeduck.com/page/spring-roll-call
- Frame-rate-independent lerp: https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
- t3ssel8r, second-order dynamics: https://www.youtube.com/watch?v=KPoeNZZ6H4s
- Verlet procedural animation (PICO-8): https://www.lexaloffle.com/bbs/?tid=154658
- ASK walk and run timing chart: https://animation.monmouth.edu/instruct/?p=351
- Sakugabooru glossary (impact frames, genga and douga roles): https://blog.sakugabooru.com/glossary/
- Guilty Gear Xrd GDC handout (limited animation on 3D): https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf

**Japanese**
- PA Works 作画の跳び箱 No.19 (key placement for weight, 収まり): https://www.pa-works.jp/for-animator/tobibako/782/
- オバケ (smear) technique: https://note.com/tkyhgsanimation/n/nd994bfa1d00b
- Explosion timing frame by frame (impact frame, per-part speed): https://blog.tenp-kukan.com/10141/
- Sakurai, 8つのヒットストップ仕様: https://www.youtube.com/watch?v=CiQzmwz_Olg
- ドッター対談 (breathing by shadow bands, no shift): https://news.denfaminicogamer.jp/kikakuthetower/dotter-taidan/2
- CEDEC 2026 やられアニメーション (centre of mass and support base): https://jp.ign.com/cedec-2026/83887/
- CEDEC 2013 攻撃モーション (counter-movement, kinetic chain): https://www.famitsu.com/news/201308/26038928.html
- CEDEC 2017 PlatinumGames (idle neutrality, readable attacks): https://cgworld.jp/feature/201709-cedec2017-platinum.html
- 髪揺れ is a wave, no ping-pong: https://note.com/tetotti/n/n2ed27b7af8e3
- Pixnote FPS bands and idle, walk and attack frame counts: https://pixnote.net/learn/animation/
- pixelartlab 4-frame idle (hair 1 px later): https://pixelartlab.net/tutorials/dot-anime-tsukurikata
- 予備動作の省略 in game motion: https://note.com/bbds_blog/n/nb1f5058063b8
- ドット絵アニメのコツ (wide spacing at mid-swing): https://note.com/sano_tenshoku/n/n15063c478868

**Korean**
- 도트 걷기 (2 and 4 frames, far-leg shade, ski sliding): https://blog.naver.com/redrabbitpixel/220736473631
- 타격감 해부 (Smash hitstop numbers, DNF 역경직, super armor): https://blog.naver.com/byjun_04/224412686555
- 타이밍과 스페이싱: https://blog.naver.com/mg2201/223077128797
- 히트스톱 구현 100–200 ms: https://art-life.tistory.com/178
- 히트스톱 0.1 / 0.2 s by skill: https://blog.naver.com/teambackstreet/223713778197
- Directional hurt (Kazan): https://blog.naver.com/gamedesigns/224220589787

**Chinese**
- 打击感 design notes (SF5 8/12/15 hitstop, Tekken hold-on-hit): https://www.gcores.com/articles/167815
- Sakurai's 8 hitstop points (notes): https://www.bilibili.com/read/cv20755711
- 日式作画 时间 (1/2/3 格, mixing for 顿挫感): https://www.bilibili.com/read/cv23317102
- 像素攻击动画 关键帧与节奏: https://c.m.163.com/news/a/KMMASHN00526K8VB.html
- 主角 vs 怪物 蓄力, overshot: https://c.m.163.com/news/a/KM84CU2T0526K8VB.html
- Saint11 walk cycle (Chinese voice-over, 185k views): https://www.bilibili.com/video/BV1XG4y1c7ca

**Russian**
- Создание пиксель-арт анимаций (10-frame run, 1-frame lag): https://dtf.ru/294631-sozdanie-piksel-art-animacii
- Галоп пикселя 6, run animation: https://habr.com/ru/articles/772588/
- Галоп пикселя 4, light animation (0.5 s holds, 6–8 frame loops): https://habr.com/post/318678
- 21 принцип анимации (захлёст 8 frames, broken joints, фазовка): https://vk.ru/@animationclubvk-21-princip-animacii
- Виды кадров (ключи, экстримы, брейкдауны, фазовка, спейсинг): https://vk.ru/@animationclubvk-vidy-kadrov
- Dead Cells pipeline, Russian translation: https://habr.com/ru/articles/416589/
